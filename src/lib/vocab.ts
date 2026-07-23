export {
  VOCAB_TYPES,
  WORD_CATEGORIES,
  WORD_LEVELS,
  categoryLabel,
  levelLabel,
  typeLabel,
  defaultFields,
  isNounFields,
  isVerbFields,
  isAdjectiveFields,
  isSentenceFields,
  isPhraseFields,
} from "./vocab-types"

export type {
  VocabType,
  VocabFields,
  FieldsByType,
  NounFields,
  VerbFields,
  AdjectiveFields,
  SentenceFields,
  PhraseFields,
  ConjugationSet,
  VocabularyRow,
  VocabFlashCard,
  FlashCardMode,
} from "./vocab-types"

// Kept here because they are general-purpose helpers, not type-specific
export interface VocabularyItem {
  id: string
  language: string
  type: string
  word: string
  meaning: string
  example_sentence?: string
  category: string
  level: string
  frequency_rank?: number | null
  notes?: string
  score: number
}

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
