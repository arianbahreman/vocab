import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"

type UserRole = "admin" | "user"

function getUserRole(user: User): UserRole {
  return user.app_metadata?.role === "admin" ? "admin" : "user"
}

async function countAdmins() {
  const admin = createAdminClient()
  let count = 0
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    count += data.users.filter((u) => getUserRole(u) === "admin").length
    if (data.users.length < perPage) break
    page++
  }

  return count
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  const { id } = await params
  const body = await request.json()
  const role = body.role as UserRole | undefined

  if (role !== "admin" && role !== "user") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  if (id === auth.user.id && role === "user") {
    return NextResponse.json(
      { error: "You cannot demote yourself" },
      { status: 400 },
    )
  }

  const admin = createAdminClient()

  const { data: target, error: fetchError } =
    await admin.auth.admin.getUserById(id)
  if (fetchError || !target.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (getUserRole(target.user) === "admin" && role === "user") {
    const adminCount = await countAdmins()
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot demote the last admin" },
        { status: 400 },
      )
    }
  }

  const { data: updated, error: updateError } =
    await admin.auth.admin.updateUserById(id, {
      app_metadata: { ...target.user.app_metadata, role },
    })

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    id: updated.user.id,
    role: getUserRole(updated.user),
  })
}
