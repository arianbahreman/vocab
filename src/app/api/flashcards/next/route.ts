import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const VALID_LANGUAGES = ["english", "french"]

interface DueCard {
  id: string
  original: string
  meaning: string
  language: string
  type: string | null
  notes: string | null
  score: number
  correct_count: number
  wrong_count: number
  ease_factor: number
  interval: number
  repetitions: number
}

function mapCard(card: DueCard, choices: string[], dueCount: number) {
  return {
    id: card.id,
    original: card.original,
    meaning: card.meaning,
    language: card.language,
    type: card.type,
    notes: card.notes,
    score: card.score,
    correctCount: card.correct_count,
    wrongCount: card.wrong_count,
    easeFactor: card.ease_factor,
    interval: card.interval,
    repetitions: card.repetitions,
    dueCount,
    choices,
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const language = request.nextUrl.searchParams.get("language")
  const filterLanguage =
    language && language !== "all" && VALID_LANGUAGES.includes(language)
      ? language
      : null

  const excludeParam = request.nextUrl.searchParams.get("exclude")
  const excludeIds = excludeParam ? excludeParam.split(",").filter(Boolean) : []

  const limit = Math.min(
    Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "1"), 1),
    20
  )

  const now = new Date().toISOString()

  let existsQuery = supabase
    .from("vocabulary")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (filterLanguage) existsQuery = existsQuery.eq("language", filterLanguage)

  const { data: all } = await existsQuery

  if (!all || all.length === 0) {
    return NextResponse.json({ error: "No vocabulary found" }, { status: 404 })
  }

  let countQuery = supabase
    .from("vocabulary")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review", now)

  if (filterLanguage) countQuery = countQuery.eq("language", filterLanguage)

  const { count: dueCount } = await countQuery

  let dueQuery = supabase
    .from("vocabulary")
    .select("id, original, meaning, language, type, notes, score, correct_count, wrong_count, ease_factor, interval, repetitions")
    .eq("user_id", user.id)
    .lte("next_review", now)
    .order("next_review", { ascending: true })
    .limit(limit)

  if (filterLanguage) dueQuery = dueQuery.eq("language", filterLanguage)
  if (excludeIds.length > 0) dueQuery = dueQuery.not("id", "in", `(${excludeIds.join(",")})`)

  const { data: due } = await dueQuery

  if (due && due.length > 0) {
    const dueIds = due.map((c) => c.id)

    let distractorQuery = supabase
      .from("vocabulary")
      .select("meaning")
      .eq("user_id", user.id)
      .not("id", "in", `(${dueIds.join(",")})`)
      .limit(Math.min(limit * 12, 48))

    if (filterLanguage) distractorQuery = distractorQuery.eq("language", filterLanguage)

    const { data: distractors } = await distractorQuery
    const pool = (distractors || [])
      .map((d) => d.meaning)
      .filter((m): m is string => !!m)

    const cards = due.map((card) => {
      const available = pool.filter((m) => m !== card.meaning)
      const shuffled = shuffle(available)
      return mapCard(card, shuffled.slice(0, 3), dueCount ?? 0)
    })

    return NextResponse.json({ cards, dueCount: dueCount ?? 0 })
  }

  let nextUpQuery = supabase
    .from("vocabulary")
    .select("next_review")
    .eq("user_id", user.id)
    .order("next_review", { ascending: true })
    .limit(1)

  if (filterLanguage) nextUpQuery = nextUpQuery.eq("language", filterLanguage)
  if (excludeIds.length > 0) nextUpQuery = nextUpQuery.not("id", "in", `(${excludeIds.join(",")})`)

  const { data: nextUp } = await nextUpQuery

  return NextResponse.json({
    cards: [],
    done: true,
    nextDue: nextUp?.[0]?.next_review ?? null,
    dueCount: 0,
  })
}
