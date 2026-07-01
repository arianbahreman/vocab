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

  let query = supabase
    .from("vocabulary")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (filterLanguage) query = query.eq("language", filterLanguage)

  const { data: all } = await query

  if (!all || all.length === 0) {
    return NextResponse.json({ error: "No vocabulary found" }, { status: 404 })
  }

  const now = new Date().toISOString()

  let dueQuery = supabase
    .from("vocabulary")
    .select("id, original, meaning, language")
    .eq("user_id", user.id)
    .lte("next_review", now)
    .order("next_review", { ascending: true })
    .limit(1)

  if (filterLanguage) dueQuery = dueQuery.eq("language", filterLanguage)

  const { data: due } = await dueQuery

  if (due && due.length > 0) {
    return NextResponse.json(due[0])
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
  })
}
