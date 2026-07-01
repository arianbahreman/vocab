import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const isDashboard = searchParams.get("dashboard")

  if (isDashboard) {
    const { data: all } = await supabase
      .from("vocabulary")
      .select("language, score")
      .eq("user_id", user.id)

    const total = all?.length ?? 0
    const english = all?.filter((v) => v.language === "english").length ?? 0
    const french = all?.filter((v) => v.language === "french").length ?? 0
    const lowScore = all?.filter((v) => v.score < 5).length ?? 0

    return NextResponse.json({ total, english, french, lowScore })
  }

  const search = searchParams.get("search") || ""
  const language = searchParams.get("language") || ""
  const type = searchParams.get("type") || ""
  const sort = searchParams.get("sort") || "newest"
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

  query = query.range(offset, offset + limit - 1)

  const { data, count } = await query

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
