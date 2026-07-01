import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function pickDistractors(all: any[], correctId: string, count: number) {
  const pool = all.filter((v) => v.id !== correctId)
  const shuffled = pool.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((v) => v.meaning)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: all } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", user.id)

  if (!all || all.length === 0) {
    return NextResponse.json({ error: "No vocabulary found" }, { status: 404 })
  }

  const weights = all.map((v) => ({
    ...v,
    weight: Math.max(1, 10 - v.score),
  }))

  const totalWeight = weights.reduce((sum, v) => sum + v.weight, 0)
  let random = Math.random() * totalWeight

  let selected = weights[0]
  for (const item of weights) {
    random -= item.weight
    if (random <= 0) {
      selected = item
      break
    }
  }

  const distractors = pickDistractors(all, selected.id, 3)
  const options = [selected.meaning, ...distractors].sort(
    () => Math.random() - 0.5,
  )

  return NextResponse.json({
    id: selected.id,
    original: selected.original,
    correctMeaning: selected.meaning,
    options,
  })
}
