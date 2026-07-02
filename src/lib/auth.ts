import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/roles"
import { NextResponse } from "next/server"

export { isAdmin, getUserRole } from "@/lib/roles"

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user, supabase }
}

export async function requireAdmin() {
  const result = await requireUser()
  if ("error" in result) return result
  if (!isAdmin(result.user)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return result
}
