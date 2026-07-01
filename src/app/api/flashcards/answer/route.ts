import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { applyReview } from "@/lib/srs"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { vocabularyId, quality } = await request.json()

  const { data: item } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("id", vocabularyId)
    .eq("user_id", user.id)
    .single()

  if (!item) {
    return NextResponse.json({ error: "Vocabulary not found" }, { status: 404 })
  }

  const result = applyReview(
    {
      easeFactor: item.ease_factor,
      interval: item.interval,
      repetitions: item.repetitions,
    },
    quality,
  )

  const newScore = quality >= 3
    ? Math.min(item.score + 1, 10)
    : Math.max(item.score - 1, 0)

  const newCorrectCount = item.correct_count + (quality >= 3 ? 1 : 0)
  const newWrongCount = item.wrong_count + (quality < 3 ? 1 : 0)

  await supabase
    .from("vocabulary")
    .update({
      ease_factor: result.easeFactor,
      interval: result.interval,
      repetitions: result.repetitions,
      next_review: result.nextReview.toISOString(),
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
    correct: quality >= 3,
    quality,
    reviewed_at: new Date().toISOString(),
  })

  return NextResponse.json({
    nextReview: result.nextReview.toISOString(),
    score: newScore,
    correct_count: newCorrectCount,
    wrong_count: newWrongCount,
  })
}
