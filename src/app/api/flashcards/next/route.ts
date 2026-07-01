import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const VALID_LANGUAGES = ["english", "french"]

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const language = request.nextUrl.searchParams.get("language")
  const filterLanguage =
    language && language !== "all" && VALID_LANGUAGES.includes(language)
      ? language
      : null

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
    .limit(1)

  if (filterLanguage) dueQuery = dueQuery.eq("language", filterLanguage)

  const { data: due } = await dueQuery

  if (due && due.length > 0) {
    const card = due[0]

    let distractorQuery = supabase
      .from("vocabulary")
      .select("meaning")
      .eq("user_id", user.id)
      .neq("id", card.id)
      .limit(24)

    if (filterLanguage) distractorQuery = distractorQuery.eq("language", filterLanguage)

    const { data: distractors } = await distractorQuery

    const choices = (distractors || [])
      .map((d) => d.meaning)
      .filter((m): m is string => !!m && m !== card.meaning)

    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]]
    }

    return NextResponse.json({
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
      dueCount: dueCount ?? 0,
      choices: choices.slice(0, 3),
    })
  }

  let nextUpQuery = supabase
    .from("vocabulary")
    .select("next_review")
    .eq("user_id", user.id)
    .order("next_review", { ascending: true })
    .limit(1)

  if (filterLanguage) nextUpQuery = nextUpQuery.eq("language", filterLanguage)

  const { data: nextUp } = await nextUpQuery

  return NextResponse.json({
    done: true,
    nextDue: nextUp?.[0]?.next_review ?? null,
    dueCount: 0,
  })
}
