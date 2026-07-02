import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentStreak } from "@/lib/vocab"

interface ImportItem {
  type: string
  word: string
  meaning: string
  note?: string
  example_sentence?: string
  category?: string
  level?: string
  frequency_rank?: number | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const isDashboard = searchParams.get("dashboard")

  if (isDashboard) {
    const { data: all } = await supabase
      .from("vocabulary")
      .select("language, score, next_review, category")
      .eq("user_id", user.id)

    const total = all?.length ?? 0
    const english = all?.filter((v) => v.language === "english").length ?? 0
    const french = all?.filter((v) => v.language === "french").length ?? 0
    const lowScore = all?.filter((v) => v.score < 5).length ?? 0
    const now = new Date()
    const due = all?.filter((v) => new Date(v.next_review) <= now).length ?? 0

    const categoryCounts: Record<string, number> = {}
    for (const v of all ?? []) {
      categoryCounts[v.category] = (categoryCounts[v.category] ?? 0) + 1
    }

    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const { data: reviews } = await supabase
      .from("review_history")
      .select("reviewed_at, vocabulary:vocabulary_id!inner(user_id)")
      .eq("vocabulary.user_id", user.id)
      .gte("reviewed_at", since)

    const reviewDates = (reviews ?? []).map((r) => r.reviewed_at)
    const streak = currentStreak(reviewDates)

    return NextResponse.json({ total, english, french, lowScore, due, streak, reviewDates, categoryCounts })
  }

  const search = searchParams.get("search") || ""
  const language = searchParams.get("language") || ""
  const type = searchParams.get("type") || ""
  const category = searchParams.get("category") || ""
  const level = searchParams.get("level") || ""
  const sort = searchParams.get("sort") || "newest"
  const isExport = searchParams.get("export") === "true"
  const page = parseInt(searchParams.get("page") || "1")
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from("vocabulary")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)

  if (search) {
    query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%`)
  }
  if (language && language !== "all") query = query.eq("language", language)
  if (type && type !== "all") query = query.eq("type", type)
  if (category && category !== "all") query = query.eq("category", category)
  if (level && level !== "all") query = query.eq("level", level)

  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true })
      break
    case "score_low":
      query = query.order("score", { ascending: true })
      break
    case "score_high":
      query = query.order("score", { ascending: false })
      break
    case "frequency":
      query = query.order("frequency_rank", { ascending: true, nullsFirst: false })
      break
    default:
      query = query.order("created_at", { ascending: false })
  }

  if (!isExport) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, count } = await query

  if (isExport) {
    return NextResponse.json({ items: data ?? [] })
  }

  return NextResponse.json({
    items: data ?? [],
    total: count ?? 0,
    page,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  if (body.items) {
    if (!body.language || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const rows = body.items.map((item: ImportItem) => ({
      user_id: user.id,
      language: body.language,
      type: item.type,
      word: item.word,
      meaning: item.meaning,
      notes: item.note || "",
      example_sentence: item.example_sentence || "",
      category: item.category || "other",
      level: item.level || "intermediate",
      frequency_rank: item.frequency_rank ?? null,
    }))

    const { data, error } = await supabase
      .from("vocabulary")
      .insert(rows)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: data?.length ?? 0 }, { status: 201 })
  }

  const word = body.word ?? body.original
  if (!body.language || !body.type || !word || !body.meaning) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .insert({
      user_id: user.id,
      language: body.language,
      type: body.type,
      word,
      meaning: body.meaning,
      notes: body.notes || "",
      example_sentence: body.example_sentence || "",
      category: body.category || "other",
      level: body.level || "intermediate",
      frequency_rank: body.frequency_rank ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { error, count } = await supabase
    .from("vocabulary")
    .delete({ count: "exact" })
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: count ?? 0 })
}
