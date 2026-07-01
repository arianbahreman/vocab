# Plan: Proper Spaced Repetition (SM-2, Anki-style)

> **This is a multi-phase plan.**
> - **Phase 1 — Spaced Repetition (SM-2):** the sections below.
> - **Phase 2 — Engagement & Statistics:** daily check-in weekday tracker, learning chart, dashboard streak, and more vocabulary types. See [Phase 2](#phase-2--engagement--statistics) at the end.
>
> **Migrations — do not edit `supabase.sql`.** That file is the already-applied baseline for the live database; re-running or editing it would conflict with existing objects. All schema changes ship as **new, ordered migration files** under a `migrations/` directory, run once each in the Supabase SQL editor:
> - `migrations/0001_srs.sql` — Phase 1 (SM-2 columns + index)
> - `migrations/0002_engagement.sql` — Phase 2 (widen `type` CHECK)
>
> Each uses idempotent `ADD COLUMN IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS` / `CREATE INDEX IF NOT EXISTS` so a re-run is harmless. Fresh installs run `supabase.sql` first, then every `migrations/000N_*.sql` in order.

## Context

The app currently has a flashcard mode that selects cards by a crude weight (`weight = max(1, 10 - score)`) and grades answers as a binary correct/wrong that nudges a 0–10 `score`. There is **no scheduling**: a card can reappear immediately, nothing tracks *when* a card is next due, and the `review_history` table is written on every answer but never read.

This change replaces the score-weighting scheme with a real **SM-2 spaced-repetition algorithm**. Each card gets an ease factor, interval, repetition count, and a `next_review` date. The study UI becomes Anki-style: show the word → reveal the meaning → self-grade **Again / Hard / Good / Easy**. Wrong answers (Again) requeue the card **within the same session**; correct grades schedule it days into the future. The outcome: users review each word right before they'd forget it, and only see cards that are actually due.

Decisions locked in with the user:
- Grading model: **Anki-style self-grade** (4 buttons → SM-2 quality 0–5). Multiple-choice + distractors are removed.
- Lapse behavior: **requeue same session** (Again sets `next_review ≈ now`).
- Auth hardening is **out of scope**.

---

## 1. Database schema — new file `migrations/0001_srs.sql`

**Do not touch the live `supabase.sql`.** Add SM-2 columns to `vocabulary`, a quality column to `review_history`, and a due-lookup index in a fresh migration file, run once in the Supabase SQL editor. Idempotent guards make a re-run a no-op.

```sql
-- migrations/0001_srs.sql
ALTER TABLE vocabulary
  ADD COLUMN IF NOT EXISTS ease_factor REAL        NOT NULL DEFAULT 2.5,
  ADD COLUMN IF NOT EXISTS interval    INTEGER     NOT NULL DEFAULT 0,   -- days
  ADD COLUMN IF NOT EXISTS repetitions INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_review TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE review_history ADD COLUMN IF NOT EXISTS quality INTEGER;  -- 0..5, nullable for old rows

CREATE INDEX IF NOT EXISTS idx_vocabulary_next_review ON vocabulary (user_id, next_review);
```
The `DEFAULT now()` means all existing rows and every new word start out due. Keep the existing `score`, `correct_count`, `wrong_count` columns — `score` still feeds the dashboard's "Low Score" card and stays roughly in sync (see §4).

---

## 2. Shared SM-2 utility (new file `src/lib/srs.ts`)

A single **pure, testable** function so the algorithm lives in one place (not duplicated in the route). Mirrors the style of `src/lib/utils.ts`.

```ts
export interface SrsState { easeFactor: number; interval: number; repetitions: number }
export interface SrsResult extends SrsState { nextReview: Date }

// quality: 0 Again, 3 Hard, 4 Good, 5 Easy
export function applyReview(state: SrsState, quality: number): SrsResult {
  let ef = state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (ef < 1.3) ef = 1.3

  let repetitions: number, interval: number, nextReview: Date
  if (quality < 3) {                 // lapse → requeue this session
    repetitions = 0
    interval = 0
    nextReview = new Date(Date.now() + 60_000) // ~1 min so other due cards come first
  } else {
    repetitions = state.repetitions + 1
    if (repetitions === 1) interval = 1
    else if (repetitions === 2) interval = 6
    else interval = Math.round(state.interval * ef)
    nextReview = new Date(Date.now() + interval * 86_400_000)
  }
  return { easeFactor: ef, interval, repetitions, nextReview }
}
```
Quality mapping (defined in the UI, passed to the API): **Again=0, Hard=3, Good=4, Easy=5**.

---

## 3. API changes

### `src/app/api/flashcards/next/route.ts` (rewrite)
- Delete `pickDistractors` and the whole options/distractor logic — no longer needed.
- Query the single most-overdue card:
  `.eq("user_id", user.id).lte("next_review", new Date().toISOString()).order("next_review", { ascending: true }).limit(1)`
- If a card is found, return `{ id, original, meaning }` (the client now reveals `meaning` itself).
- If **nothing is due**, do a second tiny query (soonest `next_review`, ascending, limit 1) and return `{ done: true, nextDue: <iso|null> }` with **status 200** (not the current 404). Keep the 404/empty case only when the user has zero vocabulary at all.

### `src/app/api/flashcards/answer/route.ts` (rewrite scoring)
- Accept `{ vocabularyId, quality }` (integer 0–5) instead of `{ correct }`.
- Load the user-scoped item (keep the existing `.eq("id").eq("user_id").single()` guard).
- Call `applyReview({ easeFactor, interval, repetitions }, quality)` from `src/lib/srs.ts`.
- Update `ease_factor`, `interval`, `repetitions`, `next_review`, `last_reviewed`, `updated_at`. Keep `correct_count`/`wrong_count` incrementing on `quality >= 3` / `< 3`, and keep the old `score` roughly in sync (`quality >= 3 ? min(score+1,10) : max(score-1,0)`) so the dashboard's Low-Score card keeps working.
- Insert into `review_history` with `{ vocabulary_id, correct: quality >= 3, quality, reviewed_at }`.
- Return the updated `next_review` and counts (handy for optional UI feedback).

### `src/app/api/vocabulary/route.ts` (dashboard branch only)
- In the `isDashboard` block, add a **due count**: `all.filter(v => new Date(v.next_review) <= now).length` (add `next_review` to the `.select`). Return it as `due` alongside `total/english/french/lowScore`.

---

## 4. UI changes

### `src/app/(protected)/flashcards/page.tsx` (rewrite the flow)
Replace the multiple-choice interaction with reveal + self-grade, keeping the existing Card/Button/loading/error scaffolding and `cn` styling conventions:
1. State: `card`, `revealed` (bool), `submitting`, plus `done`/`nextDue`.
2. Front: show `card.original` + a **Show Answer** button (Space also triggers — optional).
3. After reveal: show `card.meaning`, then four buttons **Again / Hard / Good / Easy** (color cues: Again destructive, Easy green). On click → `POST /api/flashcards/answer` with the mapped quality → `fetchCard()`.
4. `done: true` → "🎉 All caught up" empty state showing when the next card is due (relative time from `nextDue`) and a link back to `/dashboard`.
5. Optional niceties (mention, don't require): keyboard shortcuts (Space reveal, 1–4 grade), and an in-session counter of cards reviewed.

### `src/app/(protected)/dashboard/page.tsx`
- Add `due` to the `DashboardData` interface and render a **"Due for Review"** stat card (reuse the existing card markup; a `Clock`/`CalendarClock` lucide icon). Wrap the card's number in a `Link` to `/flashcards`, or leave the existing "Start Flashcards" button as the entry point. Grid already handles a 5th card via `sm:grid-cols-2`; optionally bump `lg:grid-cols-4`→`5`.

### Statistics (optional, low priority)
`src/app/api/statistics/route.ts` + `statistics/page.tsx` could later surface "cards due" and "reviews in last 7 days" by finally reading `review_history`. **Out of scope for this plan** unless requested — noted as the natural follow-up.

---

## Files to change
- `migrations/0001_srs.sql` — **new** (do NOT edit `supabase.sql`): SM-2 columns, `quality`, due index
- `src/lib/srs.ts` — **new**, pure SM-2 function
- `src/app/api/flashcards/next/route.ts` — due-based selection, remove distractors
- `src/app/api/flashcards/answer/route.ts` — quality-based SM-2 update
- `src/app/api/vocabulary/route.ts` — dashboard `due` count
- `src/app/(protected)/flashcards/page.tsx` — reveal + 4-grade UI
- `src/app/(protected)/dashboard/page.tsx` — "Due for Review" card

---

## Verification

1. **Migration**: paste `migrations/0001_srs.sql` into the Supabase SQL editor (leave `supabase.sql` untouched); confirm columns exist and existing rows have `next_review = now()`.
2. **Run**: `npm run dev`, log in, ensure a few vocab items exist.
3. **Study flow**: open `/flashcards` → word shows → Show Answer reveals meaning → four grade buttons appear.
   - Grade **Good** on a new card → in Supabase table editor confirm `interval=1`, `repetitions=1`, `next_review ≈ now+1 day`; card should **not** reappear this session.
   - Grade **Again** on another → confirm `repetitions=0`, `next_review ≈ now+1 min`; card **reappears** later in the session.
   - Grade the same card **Good** twice more → interval progresses 1 → 6 → ~`round(6 × ease_factor)`.
4. **All caught up**: grade everything due → page shows the empty "caught up" state with the next-due time; `/api/flashcards/next` returns `{ done: true }` (200).
5. **Dashboard**: "Due for Review" count matches the number of cards with `next_review <= now`; drops as you review.
6. **Algorithm sanity** (no test runner is installed): optionally spot-check `applyReview` in a scratch `node` REPL, e.g. `applyReview({easeFactor:2.5,interval:6,repetitions:2},5)` → interval ≈ 15, ef ≈ 2.6. Adding Vitest for a real unit test is a reasonable follow-up but out of scope here.

---
---

# Phase 2 — Engagement & Statistics

## Context

Phase 1 gives us real scheduling and finally makes `review_history` meaningful (one row per graded review, with `reviewed_at`). Phase 2 turns that data into **habit-building UI**:

1. **Daily check-in tracker** — a Mon–Sun row of circles on the Statistics page; a day's circle is filled once the user has reviewed **at least one** card that day. Today is highlighted.
2. **Learning chart** — a small bar chart of **reviews per day over the last 14 days** on the Statistics page, so progress is visible over time.
3. **Check-in streak** — the count of consecutive days (ending today or yesterday) with at least one review, shown **both** on Statistics and as a stat card on the **Dashboard**.
4. **More vocabulary types** — expand the current `word / phrase / verb` set (adjective, adverb, noun, expression, idiom, preposition, other) and centralize the list so the four places that hardcode it stay in sync.

Design decisions:
- **A "check-in" is derived, not a separate action.** A day counts as checked-in iff `review_history` has ≥1 row that day. No new table, no extra button — studying *is* the check-in. (An explicit "check in without studying" button is a possible later addition, noted but out of scope.)
- **Charting library: shadcn/ui `chart` (Recharts).** The learning chart uses a real charting library for a polished look. Since the project is already shadcn/ui-based, we add shadcn's `chart` component — a thin wrapper over **Recharts** (which builds on **D3** scales/shapes under the hood) that themes off the existing CSS variables. This gives smooth SVG bars, axes, gridlines, rounded corners, and hover tooltips out of the box with minimal code. *(Alternative considered: raw **D3** — maximum control but much more imperative `useRef`/`useEffect` DOM code and manual theming; not worth it here. If you'd rather go pure D3, the same data shape from §2 feeds it directly.)*
- **Timezone:** `reviewed_at` is stored UTC. To make "days" match the user's calendar, the API returns the **raw `reviewed_at` timestamps for the last ~30 days** and the client buckets them by **local** day. Review volume is tiny (a handful/day), so shipping timestamps is cheap and avoids a server-side timezone guess.

---

## 1. More vocabulary types

### New file `migrations/0002_engagement.sql` — widen the `type` CHECK
**Do not edit the live `supabase.sql`.** Swap the constraint in a new migration file, run once in the Supabase SQL editor. `DROP ... IF EXISTS` first makes it re-runnable:
```sql
-- migrations/0002_engagement.sql
ALTER TABLE vocabulary DROP CONSTRAINT IF EXISTS vocabulary_type_check;
ALTER TABLE vocabulary ADD CONSTRAINT vocabulary_type_check
  CHECK (type IN ('word','phrase','verb','noun','adjective','adverb','expression','idiom','preposition','other'));
```
> The default constraint name Postgres generated for the `CREATE TABLE` CHECK is `vocabulary_type_check`. If your live DB used a different name, adjust the `DROP` accordingly (check with `\d vocabulary` or the Supabase table editor). No `review_history`/check-in schema is needed — check-in and streak derive from existing `review_history` rows.

### `src/lib/vocab.ts` (new) — single source of truth
```ts
export const VOCAB_TYPES = [
  { value: "word",        label: "Word" },
  { value: "phrase",      label: "Phrase" },
  { value: "verb",        label: "Verb" },
  { value: "noun",        label: "Noun" },
  { value: "adjective",   label: "Adjective" },
  { value: "adverb",      label: "Adverb" },
  { value: "expression",  label: "Expression" },
  { value: "idiom",       label: "Idiom" },
  { value: "preposition", label: "Preposition" },
  { value: "other",       label: "Other" },
] as const
```

### Wire it into the three Select menus
Replace the hardcoded `<SelectItem value="word|phrase|verb">` blocks with a `VOCAB_TYPES.map(...)` in:
- `src/app/(protected)/vocabulary/new/page.tsx`
- `src/app/(protected)/vocabulary/[id]/page.tsx`
- `src/app/(protected)/vocabulary/page.tsx` (filter dropdown — keep the leading `<SelectItem value="all">All</SelectItem>`)

No API change: `POST /api/vocabulary` already stores `type` verbatim; the DB CHECK is the only server-side gate.

---

## 2. Statistics API — check-in, streak, and daily buckets

### `src/app/api/statistics/route.ts` (extend)
Add a second query alongside the existing vocabulary aggregate — pull recent review timestamps and return them raw:
```ts
const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
const { data: reviews } = await supabase
  .from("review_history")
  .select("reviewed_at, vocabulary:vocabulary_id!inner(user_id)")
  .eq("vocabulary.user_id", user.id)
  .gte("reviewed_at", since)
  .order("reviewed_at", { ascending: true })

// add to the JSON response:
reviewDates: (reviews ?? []).map((r) => r.reviewed_at),
```
Notes:
- `review_history` has no `user_id`; scope through the `vocabulary` FK with an **inner join** (`vocabulary:vocabulary_id!inner(user_id)` + `.eq("vocabulary.user_id", user.id)`). RLS already restricts to the user's rows, but the explicit filter keeps the query correct even if policies change.
- Keep the existing empty-state shape; just add `reviewDates: []` to the zero-vocab branch.
- **Streak** can be computed on the client from `reviewDates` (see below), so the route stays a thin data endpoint. Optionally also compute and return `streak` server-side for the Dashboard (see §4) — but the Dashboard already calls `/api/vocabulary?dashboard=true`, so it's cheaper to compute the streak there (§4) than to make the Dashboard hit the statistics route.

### Shared streak/bucket helper — add to `src/lib/vocab.ts`
Pure, testable, timezone-aware (local day) helpers reused by Statistics (client) and the dashboard API (server):
```ts
// local YYYY-MM-DD key
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// consecutive days ending today (or yesterday) with ≥1 review
export function currentStreak(reviewDates: string[], now = new Date()): number {
  const days = new Set(reviewDates.map((s) => dayKey(new Date(s))))
  let streak = 0
  const cursor = new Date(now)
  // allow the streak to "hold" if they haven't studied yet today
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
```

---

## 3. Statistics page — check-in row + learning chart + streak

### `src/app/(protected)/statistics/page.tsx`
Add `reviewDates: string[]` to the `Stats` interface, then render three new pieces above/among the existing stat cards, reusing the `Card` scaffolding.

**A. Streak stat card** — new `Card` with a `Flame` (lucide) icon: `{currentStreak(stats.reviewDates)} day streak`.

**B. Weekly check-in row** — Mon→Sun circles for the current week:
```tsx
// build the 7 days of the current week (Mon-start), mark active from reviewDates
const active = new Set(stats.reviewDates.map((s) => dayKey(new Date(s))))
// each day → a circle: filled (bg-primary) if active, ring on today, muted otherwise
```
Render as a `Card` titled "This Week" containing a `flex gap-2` of 7 items, each a labelled circle (`size-9 rounded-full`, weekday initial under it). Filled = `bg-primary text-primary-foreground`; today = `ring-2 ring-primary`; inactive = `bg-muted text-muted-foreground`. Use a `CheckCircle2` glyph or the weekday letter inside.

**C. Learning chart (last 14 days)** — a `Card` titled "Activity" rendering a **shadcn/ui `ChartContainer` + Recharts `BarChart`**.

Install once (adds the `chart` component and pulls in `recharts`):
```bash
npx shadcn@latest add chart
# creates src/components/ui/chart.tsx and installs recharts
```
> React-19 note: if the `recharts` peer-dep install balks, `npm i recharts` (or add `--legacy-peer-deps`). Recharts 2.13+ supports React 19.

Bucket `reviewDates` into the last 14 local days → `data: { day: string; reviews: number }[]` (see the `dayKey` helper in §2), then:
```tsx
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

const chartConfig = { reviews: { label: "Reviews", color: "var(--primary)" } } satisfies ChartConfig

<ChartContainer config={chartConfig} className="h-40 w-full">
  <BarChart data={data} margin={{ left: -20 }}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="reviews" fill="var(--color-reviews)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ChartContainer>
```
`var(--color-reviews)` is the CSS var shadcn generates from `chartConfig` (mapped to `--primary`), so bars match the app theme in light/dark automatically. Rounded bar tops, gridlines, an axis, and a themed hover tooltip come for free. Keep the existing "No study data yet" empty state (gated on `totalStudied === 0`); an all-zero 14-day window still renders a clean flat axis.

---

## 4. Dashboard — streak card

### `src/app/api/vocabulary/route.ts` (dashboard branch)
Compute the streak server-side so the Dashboard needs only its existing call. In the `isDashboard` block, add a review-history query (last 30 days, scoped via the vocabulary FK as in §2) and return `streak: currentStreak(reviewDates)` alongside `total/english/french/lowScore` (and the Phase 1 `due`).

### `src/app/(protected)/dashboard/page.tsx`
- Add `streak` to `DashboardData`.
- Add a **"Day Streak"** stat card (lucide `Flame`) next to the others: `{data?.streak ?? 0}`. The grid is already `sm:grid-cols-2 lg:grid-cols-4`; with Phase 1's "Due for Review" card this becomes 6 cards — bump to `lg:grid-cols-3` (2 rows of 3) or `xl:grid-cols-6` for a single row.

---

## Files to change (Phase 2)
- `migrations/0002_engagement.sql` — **new** (do NOT edit `supabase.sql`): widen `type` CHECK
- `src/components/ui/chart.tsx` + `recharts` dep — **new**, added via `npx shadcn@latest add chart`
- `src/lib/vocab.ts` — **new**: `VOCAB_TYPES`, `dayKey`, `currentStreak`
- `src/app/(protected)/vocabulary/new/page.tsx` — `VOCAB_TYPES.map` in type Select
- `src/app/(protected)/vocabulary/[id]/page.tsx` — `VOCAB_TYPES.map` in type Select
- `src/app/(protected)/vocabulary/page.tsx` — `VOCAB_TYPES.map` in type filter
- `src/app/api/statistics/route.ts` — return `reviewDates`
- `src/app/(protected)/statistics/page.tsx` — streak card, weekly check-in row, learning chart
- `src/app/api/vocabulary/route.ts` — dashboard `streak`
- `src/app/(protected)/dashboard/page.tsx` — "Day Streak" stat card

---

## Verification (Phase 2)

1. **Types:** run `migrations/0002_engagement.sql` in the Supabase SQL editor (leave `supabase.sql` untouched); open **Add Vocabulary** → the Type dropdown lists all 10 options; save an `idiom` and confirm the row inserts (no CHECK violation). The vocabulary list filter shows the same options and filters correctly.
2. **Check-in row:** with at least one review today, open **Statistics** → today's circle is filled and ring-highlighted; days with no reviews are muted. Study on two consecutive days (or backfill `reviewed_at` in Supabase) → both circles fill.
3. **Learning chart:** after `npx shadcn@latest add chart`, the Recharts `BarChart` renders with themed bars, axis, gridlines, and hover tooltips; bar heights match reviews/day, a busier day is visibly taller, and today's bar grows as you grade cards. Toggle dark mode → bars re-theme via `var(--color-reviews)`. `npm run build` succeeds (no Recharts/React-19 peer-dep error).
4. **Streak:** grade a card today → Statistics **and** Dashboard show "1". Backfill a review for yesterday → streak shows "2". Skip a day (gap) → streak resets to the trailing run. Confirm the streak still shows yesterday's value **before** you've studied today (the `cursor` back-off), then increments once you study today.
5. **Timezone sanity:** studying late at night attributes to the correct **local** calendar day (buckets use `dayKey` on local `Date`, not UTC).
