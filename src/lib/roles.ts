import type { User } from "@supabase/supabase-js"

export function isAdmin(user: User | null | undefined): boolean {
  return user?.app_metadata?.role === "admin"
}

export function getUserRole(user: User | null | undefined): "admin" | "user" {
  return isAdmin(user) ? "admin" : "user"
}
