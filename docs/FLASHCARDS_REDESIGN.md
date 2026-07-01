# Flashcards Page Redesign

## Context

The flashcards page (`src/app/(protected)/flashcards/page.tsx`) works functionally but looks basic: an instant (non-animated) reveal, a flat 2×2 grid of rating buttons, no progress indication, and none of the richer data the app already stores (type, notes, review stats) is surfaced. The study flow (SM-2 self-rating via `Again/Hard/Good/Easy`) is sound but the UI doesn't feel good.

Goal: rebuild the page to follow modern flashcard-app best practices while staying native to this app's design language (Base UI + Tailwind v4, OKLCH tokens, `Card`/`Button`/`Badge`, lucide icons, `ring-1 ring-foreground/10` surfaces, mobile-first grids). Concretely we will add: a **card-flip animation**, a **quiz (multiple-choice) mode** alongside the existing self-rating mode, a **session progress bar with a due-count**, **richer card content**, and a **full-page visual polish** of the header and the done/empty/error states.

## Data currently available (no schema changes needed)

The `vocabulary` table already stores everything we need: `original`, `meaning`, `type` (word/phrase/verb), `notes`, `score`, `correct_count`, `wrong_count`, plus SM-2 state `ease_factor`, `interval`, `repetitions`. The SM-2 engine lives in `src/lib/srs.ts` (`applyReview(state, quality)`) and will be **reused** on the client to preview intervals.

---

## API changes

### `src/app/api/flashcards/next/route.ts`
Currently the "due" query selects only `id, original, meaning, language`. Extend it and add two derived pieces of data:

1. **Richer card fields** — widen the due-card `.select()` to also return `type, notes, score, correct_count, wrong_count, ease_factor, interval, repetitions`.
2. **Due count** — add a `count` query (`select("id", { count: "exact", head: true })` with the same `lte("next_review", now)` + optional language filter) and return `dueCount` alongside the card. Lets the client render a progress bar and "X remaining".
3. **Quiz distractors** — fetch a small pool of other meanings for the same user (respect the language filter, exclude the current card id), e.g. `.select("meaning").neq("id", card.id).limit(24)`, then shuffle server-side and return up to 3 distinct `choices` (distractor meanings) in the payload. If fewer than 3 exist, return what's available (client falls back to self-rate-only when quiz isn't viable).

Keep the existing `done`/`nextDue` branch and the `VALID_LANGUAGES` validation unchanged.

### `src/app/api/flashcards/answer/route.ts`
No change. Quiz answers map to a `quality` on the client (correct → 4, incorrect → 0) and post to this same endpoint.

---

## Client redesign — `src/app/(protected)/flashcards/page.tsx`

Keep the `Suspense` + `FlashcardsContent` structure and the existing fetch/grade logic; layer the new UI on top. Extend the `FlashCard` interface with the new fields (`type`, `notes`, `score`, `correctCount`, `wrongCount`, `easeFactor`, `interval`, `repetitions`, `choices`) and store `dueCount` + a `sessionTotal` (captured on first successful fetch) in state, plus a `mode` state (`"rate" | "quiz"`).

### 1. Header / session bar (full-page polish)
- Title `Flashcards` (keep `text-3xl font-bold`) with a subtle lucide `GraduationCap`/`Layers` accent to match dashboard headers.
- Row of controls: existing language `Select`, plus a **mode toggle** (segmented control built from two `Button`s or Base UI, "Self-rate" / "Quiz"; hide/disable Quiz when `choices` unavailable).
- **Progress bar**: a slim rounded track (`bg-muted` + `bg-primary` fill, `rounded-4xl`) showing `reviewedCount / sessionTotal`, with a "N left" label and the existing "Reviewed: X" chip restyled as a `Badge`.

### 2. The flashcard (flip animation)
Replace the instant reveal with a 3D flip:
- A perspective wrapper containing an inner element that rotates `rotateY(180deg)` when `revealed`, with two absolutely-positioned faces using `backface-visibility: hidden`.
- Add the small amount of CSS these need (`perspective`, `transform-style: preserve-3d`, `backface-visibility`, `.rotate-y-180`) to `src/app/globals.css` as utility classes — Tailwind v4 has no built-in 3D-transform utilities. Respect `prefers-reduced-motion` (fall back to a cross-fade).
- **Front face**: `type` shown as a `Badge` (top), the word `original` large and centered (`text-4xl font-bold`), and a "Show answer" affordance / hint (`Space`).
- **Back face**: `meaning` prominent, `notes` below in `text-muted-foreground` when present, and a small stats footer (correct/wrong counts, current `score`) using muted text + lucide icons — mirrors the stat styling on the dashboard/statistics pages.

### 3. Self-rate mode (redesigned)
- Keep the four grades (`Again`=0, `Hard`=3, `Good`=4, `Easy`=5) but improve hierarchy: full-width-friendly buttons with clear color semantics (Again destructive, Easy green, Hard/Good outline/secondary) and lucide icons.
- **Interval preview**: for each grade, call `applyReview({ easeFactor, interval, repetitions }, quality)` from `src/lib/srs.ts` and show the resulting next interval (`<1m`, `1d`, `6d`, …) as a sub-label — a hallmark of good SRS UIs. Reuse/extend the existing `formatRelative` helper for formatting.

### 4. Quiz mode (new)
- Shuffle `[meaning, ...choices]` once per card and render 4 selectable option buttons (numbered 1–4).
- On select: reveal correctness — correct option turns green, a wrong pick turns red and the correct one is highlighted — then after a short delay (~800ms) auto-advance by posting `quality` (correct → 4, wrong → 0) via the existing `handleGrade` and fetching the next card.
- If `choices.length < 3`, fall back to self-rate mode and disable the toggle.

### 5. Keyboard shortcuts (best practice)
Add a `useEffect` key listener: `Space`/`Enter` to flip (rate mode); `1‑4` to grade (rate) or pick an option (quiz); ignore when `submitting`. Show the shortcut hints inline on buttons. Clean up the listener on unmount.

### 6. Done / empty / error states (polish)
Restyle within the same page shell so the header/progress context stays visible:
- **Done**: keep the caught-up messaging + `nextDue`, but present session stats (reviewed count, accuracy if tracked this session) as `Badge`/stat chips and keep the `Check Again` / `Back to Dashboard` actions.
- **Empty** (404 "No vocabulary"): friendly state with a CTA linking to the vocabulary page to add words.
- **Error**: keep retry, restyled consistently.
- **Loading**: replace the bare text with a skeleton card (muted `animate-pulse` block sized like the flashcard).

### Optional componentization
Extract the flip card into `src/components/flashcards/Flashcard.tsx` (presentational) to keep `page.tsx` focused on state/flow. Optional but recommended if the JSX grows large.

---

## Critical files
- `src/app/(protected)/flashcards/page.tsx` — main rebuild.
- `src/app/api/flashcards/next/route.ts` — richer fields, `dueCount`, `choices`.
- `src/app/globals.css` — add 3D-flip utility classes (+ reduced-motion fallback).
- `src/lib/srs.ts` — **reuse** `applyReview` for interval previews (no change).
- Reused components: `Card`, `Button`, `Badge`, `Select` from `src/components/ui/*`; icons from `lucide-react`.

## Verification
1. `npm run dev` and open `/flashcards`.
2. **Flip**: click / press `Space` — card flips smoothly front→back; enable OS reduced-motion and confirm it cross-fades instead.
3. **Self-rate**: verify each button shows a sensible interval preview and that grading advances to the next card; confirm `1‑4` keys work.
4. **Quiz**: toggle to Quiz — 4 options render (correct + 3 distractors), selecting shows correct/wrong feedback and auto-advances; verify a `POST /api/flashcards/answer` fires with `quality` 4 (correct) / 0 (wrong) via the Network tab.
5. **Progress**: confirm the bar/"N left" reflects `dueCount` and increments as you review.
6. **Richer content**: confirm type badge, notes, and correct/wrong stats appear (seed a card with notes to check).
7. **States**: filter to a language with no due cards (done state), an account/language with no vocabulary (empty state), and simulate a failed fetch (error state).
8. `npm run build` / lint to confirm no type or build errors.
9. Check mobile width (~375px) and dark mode.
