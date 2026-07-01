import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { username, password } = await request.json()

  if (!username || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: `${username}@vocab.app`,
    password,
    options: { data: { username } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: data.user }, { status: 201 })
}
