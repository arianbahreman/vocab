# Book Feature — Implementation Plan

## Overview
Add a "Books" section where users can browse vocabulary in a book-like format, grouped by type and language, with page-turn animations.

## Routes

| Route | Description |
|---|---|
| `/books` | Bookshelf: language selector + book covers per vocab type |
| `/books/[type]` | Book view: word entries in page-turnable book format |

## Files to Create (6)

| File | Purpose |
|------|---------|
| `src/app/(protected)/books/page.tsx` | Bookshelf page |
| `src/app/(protected)/books/[type]/page.tsx` | Book view page |
| `src/components/books/BookCover.tsx` | Book cover card |
| `src/components/books/BookPageContent.tsx` | Word entries for one page (3×2 grid) |
| `src/components/books/WordEntry.tsx` | Single word entry display |
| `src/components/books/PageTurn.tsx` | Page-turn animation wrapper |

## Files to Modify (4)

| File | Change |
|---|---|
| `src/proxy.ts` | Add `"/books"` to `protectedPaths` |
| `src/components/Navbar.tsx` | Add "Books" link with `Book` icon to `baseNavLinks` |
| `src/app/api/vocabulary/route.ts` | Accept `all=true` param to skip pagination range |
| `src/app/globals.css` | Add `@keyframes` for page-turn animation |

## Component Details

### Bookshelf Page (`/books`)
- Language toggle (English / French tabs)
- Fetch word counts per type for selected language
- Grid of `BookCover` cards sorted by type
- Empty state if no words exist

### Book View (`/books/[type]`)
- Reads `type` from route params, `language` from search params
- Fetches all words of that type + language, sorts alphabetically
- Chunks into pages of 6 words (3 rows × 2 columns)
- Renders `PageTurn` → `BookPageContent` → `WordEntry`
- Navigation: Previous/Next buttons + "Page X of Y"
- "Back to Books" link at top

### BookCover Component
- Props: `type`, `label`, `count`, `language`
- Styled card with type icon, type name, word count badge
- Links to `/books/[type]?language=[language]`

### BookPageContent Component
- Props: `words: VocabularyRow[]`
- Renders 3×2 grid of `WordEntry` components

### WordEntry Component
- Props: `word`, `meaning`, `exampleSentence`
- **Word** (large/bold), meaning (normal), example (italic/muted)
- Subtle separator between entries

### PageTurn Component
- Animated 3D page-turn using CSS `perspective` + `rotateY`
- Two-phase: fold away (0→90deg), swap content, unfold (90→0deg)
- `prefers-reduced-motion` fallback
- Prevents rapid clicks during animation

## Data Flow

- **Bookshelf**: For each `VocabType`, fetch via `GET /api/vocabulary?language=...&all=true` and count types client-side
- **Book view**: `GET /api/vocabulary?type=noun&language=english&all=true` → returns all words → chunk into pages

## Page Layout (Book View)

```
┌──────────────────────────────────────────┐
│  ← Back to Bookshelf                     │
│                                          │
│  ╔══════════════════════════════════════╗ │
│  ║         Page 3 of 12                ║ │
│  ║                                      ║ │
│  ║  слово          │  читать           ║ │
│  ║  word           │  to read          ║ │
│  ║  "..."          │  "..."            ║ │
│  ║  ───────────────┼───────────────    ║ │
│  ║  книга          │  писать           ║ │
│  ║  book           │  to write         ║ │
│  ║  "..."          │  "..."            ║ │
│  ║  ───────────────┼───────────────    ║ │
│  ║  дом            │  говорить         ║ │
│  ║  house          │  to speak         ║ │
│  ║  "..."          │  "..."            ║ │
│  ║                                      ║ │
│  ║     [← Prev]          [Next →]      ║ │
│  ╚══════════════════════════════════════╝ │
└──────────────────────────────────────────┘
```

## Animation

- CSS `@keyframes` with two phases:
  - 0–40%: page rotates from 0 to -90deg (fold away)
  - 40–50%: content swap (edge-on, invisible)
  - 50–100%: new page rotates from 90deg to 0 (unfold in)
- `transform-origin: left center`
- Duration: ~500ms
- Reduced motion: skip animation, instant swap

## Edge Cases

- **No words**: empty state with message + link to /vocabulary
- **Single page**: hide navigation buttons
- **Loading**: skeleton while fetching
- **Error**: error message with retry button