"use client"

import { useState, useCallback, useRef, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PageTurnProps {
  children: ReactNode
  onNext: () => void
  onPrev: () => void
  hasNext: boolean
  hasPrev: boolean
  page: number
  totalPages: number
}

type Phase = "idle" | "turning-away" | "turning-in"

export default function PageTurn({
  children,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
  page,
  totalPages,
}: PageTurnProps) {
  const [phase, setPhase] = useState<Phase>("idle")
  const lockRef = useRef(false)

  const turn = useCallback(
    (dir: "next" | "prev") => {
      if (lockRef.current) return
      lockRef.current = true

      setPhase("turning-away")

      setTimeout(() => {
        if (dir === "next") onNext()
        else onPrev()
        setPhase("turning-in")

        setTimeout(() => {
          setPhase("idle")
          lockRef.current = false
        }, 250)
      }, 250)
    },
    [onNext, onPrev],
  )

  const isAnimating = phase !== "idle"

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </div>

      <div className="flashcard-perspective mx-auto w-full max-w-2xl">
        <div
          className={`page-turn-origin rounded-xl border bg-card p-6 shadow-sm ${
            phase === "turning-away"
              ? "page-turn-away"
              : phase === "turning-in"
                ? "page-turn-in"
                : ""
          }`}
        >
          {children}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => turn("prev")}
            disabled={!hasPrev || isAnimating}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="size-4" /> Prev
          </button>
          <button
            onClick={() => turn("next")}
            disabled={!hasNext || isAnimating}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  )
}
