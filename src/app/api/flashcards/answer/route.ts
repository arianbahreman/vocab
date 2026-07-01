import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { vocabularyId, correct } = await request.json()

  const { data: item } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("id", vocabularyId)
    .eq("user_id", user.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: "Vocabulary not found" }, { status: 404 })
  }

  const newScore = correct
    ? Math.min(item.score + 1, 10)
    : Math.max(item.score - 1, 0)

  const newCorrectCount = item.correct_count + (correct ? 1 : 0)
  const newWrongCount = item.wrong_count + (correct ? 0 : 1)

  await supabase
    .from("vocabulary")
    .update({
      score: newScore,
      correct_count: newCorrectCount,
      wrong_count: newWrongCount,
      last_reviewed: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", vocabularyId)
    .eq("user_id", user.id)

  await supabase.from("review_history").insert({
    vocabulary_id: vocabularyId,
    correct,
    reviewed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    correct,
    newScore,
    correct_count: newCorrectCount,
    wrong_count: newWrongCount,
  })
}
