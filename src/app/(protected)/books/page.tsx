"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BookCover from "@/components/books/BookCover"
import { VOCAB_TYPES, type VocabType } from "@/lib/vocab-types"

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "french", label: "French" },
] as const

export default function BookshelfPage() {
  const [language, setLanguage] = useState<string>("english")
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/vocabulary?language=${language}&all=true`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch")
        return res.json()
      })
      .then((data) => {
        const items = data.items ?? []
        const typeCounts: Record<string, number> = {}
        for (const item of items) {
          typeCounts[item.type] = (typeCounts[item.type] ?? 0) + 1
        }
        setCounts(typeCounts)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [language])

  const hasWords = Object.keys(counts).length > 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Books</h1>
        <p className="mt-1 text-muted-foreground">
          Browse vocabulary in a book-like format
        </p>
      </div>

      <Tabs value={language} onValueChange={(v) => setLanguage(v)}>
        <TabsList>
          {LANGUAGES.map((lang) => (
            <TabsTrigger key={lang.value} value={lang.value}>
              {lang.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col items-center gap-3 rounded-xl border bg-card p-6"
            >
              <div className="size-14 rounded-full bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-4 w-16 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive">Failed to load books.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm font-medium underline underline-offset-4"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && !hasWords && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No vocabulary found in {language}.
          </p>
          <Link
            href="/vocabulary"
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
          >
            Add some words
          </Link>
        </div>
      )}

      {!loading && !error && hasWords && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {VOCAB_TYPES.filter((t) => counts[t.value] > 0).map((type) => (
            <BookCover
              key={type.value}
              type={type.value as VocabType}
              label={type.label}
              count={counts[type.value]}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  )
}
