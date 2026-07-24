import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const DEFAULT_SETTINGS = {
  show_public_vocabs: true,
  default_language: "",
  default_level: "intermediate",
  flashcards_per_session: 20,
  review_order: "due_first",
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single()

  return NextResponse.json(data ?? { user_id: user.id, ...DEFAULT_SETTINGS })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()

  const allowedFields = [
    "show_public_vocabs",
    "default_language",
    "default_level",
    "flashcards_per_session",
    "review_order",
  ]

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowedFields) {
    if (key in body) {
      updateData[key] = body[key]
    }
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert({ user_id: user.id, ...updateData })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
