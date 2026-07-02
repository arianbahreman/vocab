import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { currentStreak } from "@/lib/vocab"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const isDashboard = searchParams.get("dashboard")

  if (isDashboard) {
    const { data: all } = await supabase
      .from("vocabulary")
      .select("language, score, next_review")
      .eq("user_id", user.id)

    const total = all?.length ?? 0
    const english = all?.filter((v) => v.language === "english").length ?? 0
    const french = all?.filter((v) => v.language === "french").length ?? 0
    const lowScore = all?.filter((v) => v.score < 5).length ?? 0
    const now = new Date()
    const due = all?.filter((v) => new Date(v.next_review) <= now).length ?? 0

    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const { data: reviews } = await supabase
      .from("review_history")
      .select("reviewed_at, vocabulary:vocabulary_id!inner(user_id)")
      .eq("vocabulary.user_id", user.id)
      .gte("reviewed_at", since)

    const reviewDates = (reviews ?? []).map((r) => r.reviewed_at)
    const streak = currentStreak(reviewDates)

    return NextResponse.json({ total, english, french, lowScore, due, streak, reviewDates })
  }

  const search = searchParams.get("search") || ""
  const language = searchParams.get("language") || ""
  const type = searchParams.get("type") || ""
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
    query = query.or(`original.ilike.%${search}%,meaning.ilike.%${search}%`)
  }
  if (language) query = query.eq("language", language)
  if (type) query = query.eq("type", type)

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

    const rows = body.items.map((item: { type: string; original: string; meaning: string; note?: string }) => ({
      user_id: user.id,
      language: body.language,
      type: item.type,
      original: item.original,
      meaning: item.meaning,
      notes: item.note || "",
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

  if (!body.language || !body.type || !body.original || !body.meaning) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("vocabulary")
    .insert({
      user_id: user.id,
      language: body.language,
      type: body.type,
      original: body.original,
      meaning: body.meaning,
      notes: body.notes || "",
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
