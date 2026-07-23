"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import PageTurn from "@/components/books/PageTurn"
import BookPageContent from "@/components/books/BookPageContent"
import { typeLabel } from "@/lib/vocab-types"
import type { VocabularyRow } from "@/lib/vocab-types"

const WORDS_PER_PAGE = 6

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}

export default function BookViewPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const type = params.type as string
  const language = searchParams.get("language") || "english"

  const [words, setWords] = useState<VocabularyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setPageIndex(0)
    fetch(`/api/vocabulary?type=${type}&language=${language}&all=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => {
        setWords(data.items ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [type, language])

  const pages = chunkArray(words, WORDS_PER_PAGE)
  const totalPages = pages.length
  const currentPage = pages[pageIndex] ?? []

  const goNext = useCallback(() => {
    setPageIndex((p) => Math.min(p + 1, totalPages - 1))
  }, [totalPages])

  const goPrev = useCallback(() => {
    setPageIndex((p) => Math.max(p - 1, 0))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
        <div className="flashcard-perspective mx-auto w-full max-w-2xl">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Bookshelf
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load words.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (words.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/books"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Bookshelf
        </Link>
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No {typeLabel(type)?.toLowerCase() ?? type} words found in {language}.
          </p>
          <Link
            href="/vocabulary"
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
          >
            Add some words
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Bookshelf
      </Link>

      <PageTurn
        onNext={goNext}
        onPrev={goPrev}
        hasNext={pageIndex < totalPages - 1}
        hasPrev={pageIndex > 0}
        page={pageIndex + 1}
        totalPages={totalPages}
      >
        <BookPageContent words={currentPage} />
      </PageTurn>
    </div>
  )
}
