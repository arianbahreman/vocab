import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("score, correct_count, wrong_count")
    .eq("user_id", user.id)

  if (!vocab || vocab.length === 0) {
    return NextResponse.json({
      totalStudied: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      accuracy: 0,
      averageScore: 0,
    })
  }

  const totalStudied = vocab.length
  const correctAnswers = vocab.reduce((sum, v) => sum + v.correct_count, 0)
  const wrongAnswers = vocab.reduce((sum, v) => sum + v.wrong_count, 0)
  const totalAttempts = correctAnswers + wrongAnswers
  const accuracy = totalAttempts > 0
    ? Math.round((correctAnswers / totalAttempts) * 100)
    : 0
  const averageScore =
    Math.round(
      (vocab.reduce((sum, v) => sum + v.score, 0) / totalStudied) * 10,
    ) / 10

  return NextResponse.json({
    totalStudied,
    correctAnswers,
    wrongAnswers,
    accuracy,
    averageScore,
  })
}
