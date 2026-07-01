# Vocab Learning App — Build Plan

## Stack
- Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- Shadcn/ui components
- Supabase (Auth + Database)
- Deploy: Vercel

---

## Step 1: Project Setup (done)
- `create-next-app` with TypeScript, Tailwind, App Router, `src/` dir
- Installed: `@supabase/supabase-js`, `@supabase/ssr`
- Removed: prisma, next-auth, bcryptjs

---

## Step 2: Supabase Client Setup
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client
- `lib/supabase/middleware.ts` — session refresh middleware

---

## Step 3: Database Tables
Run in Supabase SQL Editor:
- `vocabulary` table
- `review_history` table

---

## Step 4: Auth API Routes
- `POST /api/register` — `supabase.auth.signUp`
- `POST /api/login` — `supabase.auth.signInWithPassword`
- `POST /api/logout` — `supabase.auth.signOut`

---

## Step 5: Middleware
- Protect `/dashboard`, `/vocabulary`, `/flashcards`, `/statistics`

---

## Step 6: Layout + Navbar
- Root layout with Navbar
- Navbar: logo, nav links, session-based login/logout

---

## Step 7: Auth Pages
- Login page
- Register page

---

## Step 8: Dashboard
- Stats cards (total, EN, FR, low-score)
- Quick action links

---

## Step 9: Vocabulary CRUD API
- `GET /api/vocabulary` — list with search/filter/sort/pagination
- `POST /api/vocabulary` — create
- `PUT /api/vocabulary/[id]` — update
- `DELETE /api/vocabulary/[id]` — delete

---

## Step 10: Vocabulary Pages
- List page with search, filters, sort, table
- Add vocabulary form
- Edit vocabulary form

---

## Step 11: Flashcard Engine
- `GET /api/flashcards/next` — weighted random + distractors
- `POST /api/flashcards/answer` — score update + review_history
- Flashcard page UI

---

## Step 12: Statistics Page
- `GET /api/statistics` — aggregated stats
- Display: total studied, correct, wrong, accuracy, avg score

---

## Step 13: Polish
- Responsive mobile-first
- Loading, error, empty states
- Edge cases handled
