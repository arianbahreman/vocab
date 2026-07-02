import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { currentStreak } from "@/lib/vocab"
import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"

interface VocabRow {
  user_id: string
  score: number
  correct_count: number
  wrong_count: number
  last_reviewed: string | null
  next_review: string
}

interface ReviewRow {
  reviewed_at: string
  vocabulary: { user_id: string } | { user_id: string }[] | null
}

function getUserRole(user: User): "admin" | "user" {
  return user.app_metadata?.role === "admin" ? "admin" : "user"
}

async function listAllUsers() {
  const admin = createAdminClient()
  const users: User[] = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    users.push(...data.users)
    if (data.users.length < perPage) break
    page++
  }

  return users
}

export async function GET() {
  const auth = await requireAdmin()
  if ("error" in auth) return auth.error

  try {
    const admin = createAdminClient()
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString()
    const now = new Date()

    const [users, vocabResult, reviewsResult] = await Promise.all([
      listAllUsers(),
      admin.from("vocabulary").select(
        "user_id, score, correct_count, wrong_count, last_reviewed, next_review",
      ),
      admin
        .from("review_history")
        .select("reviewed_at, vocabulary:vocabulary_id(user_id)")
        .gte("reviewed_at", since),
    ])

    if (vocabResult.error) throw vocabResult.error
    if (reviewsResult.error) throw reviewsResult.error

    const vocabByUser = new Map<string, VocabRow[]>()
    for (const row of vocabResult.data ?? []) {
      const list = vocabByUser.get(row.user_id) ?? []
      list.push(row)
      vocabByUser.set(row.user_id, list)
    }

    const reviewsByUser = new Map<string, string[]>()
    for (const row of (reviewsResult.data ?? []) as ReviewRow[]) {
      const vocab = row.vocabulary
      const userId = Array.isArray(vocab) ? vocab[0]?.user_id : vocab?.user_id
      if (!userId) continue
      const list = reviewsByUser.get(userId) ?? []
      list.push(row.reviewed_at)
      reviewsByUser.set(userId, list)
    }

    const result = users.map((user) => {
      const vocab = vocabByUser.get(user.id) ?? []
      const reviewDates = reviewsByUser.get(user.id) ?? []

      const totalWords = vocab.length
      const correctAnswers = vocab.reduce((sum, v) => sum + v.correct_count, 0)
      const wrongAnswers = vocab.reduce((sum, v) => sum + v.wrong_count, 0)
      const totalAttempts = correctAnswers + wrongAnswers
      const accuracy =
        totalAttempts > 0
          ? Math.round((correctAnswers / totalAttempts) * 100)
          : 0
      const avgScore =
        totalWords > 0
          ? Math.round(
              (vocab.reduce((sum, v) => sum + v.score, 0) / totalWords) * 10,
            ) / 10
          : 0
      const dueCount = vocab.filter(
        (v) => new Date(v.next_review) <= now,
      ).length
      const lastReviewedAt = vocab.reduce<string | null>((latest, v) => {
        if (!v.last_reviewed) return latest
        if (!latest || v.last_reviewed > latest) return v.last_reviewed
        return latest
      }, null)

      return {
        id: user.id,
        username: (user.user_metadata?.username as string | undefined) ?? "—",
        role: getUserRole(user),
        signedUpAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        totalWords,
        streak: currentStreak(reviewDates),
        avgScore,
        accuracy,
        dueCount,
        lastReviewedAt,
      }
    })

    result.sort((a, b) => a.username.localeCompare(b.username))

    return NextResponse.json({ users: result })
  } catch (err) {
    console.error("Admin users list error:", err)
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    )
  }
}
