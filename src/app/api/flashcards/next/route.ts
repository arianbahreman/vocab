import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: all } = await supabase
    .from("vocabulary")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)

  if (!all || all.length === 0) {
    return NextResponse.json({ error: "No vocabulary found" }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { data: due } = await supabase
    .from("vocabulary")
    .select("id, original, meaning")
    .eq("user_id", user.id)
    .lte("next_review", now)
    .order("next_review", { ascending: true })
    .limit(1)

  if (due && due.length > 0) {
    return NextResponse.json(due[0])
  }

  const { data: nextUp } = await supabase
    .from("vocabulary")
    .select("next_review")
    .eq("user_id", user.id)
    .order("next_review", { ascending: true })
    .limit(1)

  return NextResponse.json({
    done: true,
    nextDue: nextUp?.[0]?.next_review ?? null,
  })
}
