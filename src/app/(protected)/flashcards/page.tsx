"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RefreshCw, ArrowRight, CheckCircle2, XCircle } from "lucide-react"

interface FlashCard {
  id: string
  original: string
  correctMeaning: string
  options: string[]
}

export default function FlashcardsPage() {
  const [card, setCard] = useState<FlashCard | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState<number | null>(null)
  const [wrongCount, setWrongCount] = useState<number | null>(null)

  const fetchCard = useCallback(async () => {
    setLoading(true)
    setSelected(null)
    setResult(null)
    setScore(null)
    setCorrectCount(null)
    setWrongCount(null)
    setError(null)

    const res = await fetch("/api/flashcards/next")
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to load card")
      setLoading(false)
      return
    }

    const data = await res.json()
    setCard(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCard()
  }, [fetchCard])

  async function handleSelect(option: string) {
    if (selected) return

    setSelected(option)
    const isCorrect = option === card?.correctMeaning
    setResult(isCorrect)

    const res = await fetch("/api/flashcards/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vocabularyId: card?.id,
        correct: isCorrect,
      }),
    })

    if (res.ok) {
      const data = await res.json()
      setScore(data.newScore)
      setCorrectCount(data.correct_count)
      setWrongCount(data.wrong_count)
    }
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

  if (!card) return null

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-bold text-center">Flashcards</h1>

      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-4xl font-bold">
            {card.original}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {card.options.map((option) => {
              let variant:
                | "default"
                | "outline"
                | "secondary" = "outline"
              if (selected) {
                if (option === card.correctMeaning) {
                  variant = "default"
                } else if (option === selected) {
                  variant = "secondary"
                }
              }
              return (
                <Button
                  key={option}
                  variant={variant}
                  className={cn(
                    "h-auto py-4 text-lg",
                    selected && option === card.correctMeaning &&
                      "bg-green-600 text-white hover:bg-green-600",
                    selected &&
                      option === selected &&
                      option !== card.correctMeaning &&
                      "bg-destructive text-destructive-foreground hover:bg-destructive",
                  )}
                  onClick={() => handleSelect(option)}
                  disabled={!!selected}
                >
                  {option}
                </Button>
              )
            })}
          </div>

          {result !== null && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-center gap-2">
                {result ? (
                  <CheckCircle2 className="size-6 text-green-600" />
                ) : (
                  <XCircle className="size-6 text-destructive" />
                )}
                <p
                  className={cn(
                    "text-xl font-semibold",
                    result ? "text-green-600" : "text-destructive",
                  )}
                >
                  {result ? "Correct!" : "Wrong"}
                </p>
              </div>
              {!result && (
                <p className="text-muted-foreground">
                  Correct answer:{" "}
                  <span className="font-medium">{card.correctMeaning}</span>
                </p>
              )}
              {score !== null && (
                <p className="text-sm text-muted-foreground">
                  Score: {score} | Correct: {correctCount} | Wrong:{" "}
                  {wrongCount}
                </p>
              )}
              <Button size="lg" onClick={fetchCard}>
                Next Card
                <ArrowRight className="size-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
