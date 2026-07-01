export const VOCAB_TYPES = [
  { value: "word",        label: "Word" },
  { value: "phrase",      label: "Phrase" },
  { value: "verb",        label: "Verb" },
  { value: "noun",        label: "Noun" },
  { value: "adjective",   label: "Adjective" },
  { value: "adverb",      label: "Adverb" },
  { value: "expression",  label: "Expression" },
  { value: "idiom",       label: "Idiom" },
  { value: "preposition", label: "Preposition" },
  { value: "other",       label: "Other" },
] as const

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function currentStreak(reviewDates: string[], now = new Date()): number {
  const days = new Set(reviewDates.map((s) => dayKey(new Date(s))))
  let streak = 0
  const cursor = new Date(now)
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  while (days.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
