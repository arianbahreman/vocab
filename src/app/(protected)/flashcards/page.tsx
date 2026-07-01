"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RefreshCw, CheckCircle2, XCircle, Sparkles, ArrowRight } from "lucide-react"

interface FlashCard {
  id: string
  original: string
  meaning: string
}

export default function FlashcardsPage() {
  const [card, setCard] = useState<FlashCard | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [nextDue, setNextDue] = useState<string | null>(null)
  const [reviewedCount, setReviewedCount] = useState(0)

  const fetchCard = useCallback(async () => {
    setLoading(true)
    setRevealed(false)
    setSubmitting(false)
    setError(null)
    setDone(false)
    setNextDue(null)

    const res = await fetch("/api/flashcards/next")
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to load card")
      setLoading(false)
      return
    }

    const data = await res.json()

    if (data.done) {
      setDone(true)
      setNextDue(data.nextDue)
      setLoading(false)
      return
    }

    setCard(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCard()
  }, [fetchCard])

  async function handleGrade(quality: number) {
    if (submitting || !card) return
    setSubmitting(true)

    await fetch("/api/flashcards/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vocabularyId: card.id, quality }),
    })

    setReviewedCount((c) => c + 1)
    setSubmitting(false)
    fetchCard()
  }

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading card...</p>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => fetchCard()}>
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="relative">
          <Sparkles className="size-16 text-yellow-500" />
          <div className="absolute -inset-2 animate-ping rounded-full bg-yellow-400/20" />
        </div>
        <h2 className="text-3xl font-bold">You're all caught up!</h2>
        <p className="text-lg text-muted-foreground">
          {nextDue
            ? `Next card due ${formatRelative(nextDue)}`
            : "Add more vocabulary to keep studying."}
        </p>
        <p className="text-sm text-muted-foreground">
          Cards reviewed this session: {reviewedCount}
        </p>
        <div className="flex gap-4">
          <Button onClick={fetchCard} variant="outline">
            <RefreshCw className="size-4" />
            Check Again
          </Button>
          <Link href="/dashboard">
            <Button>
              Back to Dashboard
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Flashcards</h1>
        <span className="text-sm text-muted-foreground">
          Reviewed: {reviewedCount}
        </span>
      </div>

      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">
            {card.original}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!revealed ? (
            <Button
              size="lg"
              className="w-full text-lg"
              onClick={() => setRevealed(true)}
            >
              Show Answer
            </Button>
          ) : (
            <>
              <p className="text-2xl text-muted-foreground">{card.meaning}</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className={cn(
                    "h-auto py-4 text-base font-semibold",
                    "border-destructive/50 text-destructive hover:bg-destructive/10",
                  )}
                  onClick={() => handleGrade(0)}
                  disabled={submitting}
                >
                  <XCircle className="size-5" />
                  Again
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 text-base font-semibold"
                  onClick={() => handleGrade(3)}
                  disabled={submitting}
                >
                  Hard
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 text-base font-semibold"
                  onClick={() => handleGrade(4)}
                  disabled={submitting}
                >
                  Good
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "h-auto py-4 text-base font-semibold",
                    "border-green-600/50 text-green-600 hover:bg-green-600/10",
                  )}
                  onClick={() => handleGrade(5)}
                  disabled={submitting}
                >
                  <CheckCircle2 className="size-5" />
                  Easy
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return "now"
  const hours = Math.round(diff / 3_600_000)
  if (hours < 1) return `${Math.round(diff / 60_000)}m`
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
