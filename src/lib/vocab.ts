export const VOCAB_TYPES = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "phrase", label: "Phrase" },
  { value: "expression", label: "Expression" },
  { value: "idiom", label: "Idiom" },
  { value: "preposition", label: "Preposition" },
  { value: "word", label: "Word" },
  { value: "other", label: "Other" },
] as const

export const WORD_CATEGORIES = [
  { value: "home_daily_life", label: "Home & Daily Life" },
  { value: "food_dining", label: "Food & Dining" },
  { value: "people_relationships", label: "People & Relationships" },
  { value: "body_health", label: "Body & Health" },
  { value: "work_money", label: "Work & Money" },
  { value: "education_learning", label: "Education & Learning" },
  { value: "travel_transport", label: "Travel & Transport" },
  { value: "places_environment", label: "Places & Environment" },
  { value: "nature_weather", label: "Nature & Weather" },
  { value: "technology_communication", label: "Technology & Communication" },
  { value: "government_law_society", label: "Government, Law & Society" },
  { value: "culture_arts_leisure", label: "Culture, Arts & Leisure" },
  { value: "sports_fitness", label: "Sports & Fitness" },
  { value: "emotions_personality", label: "Emotions & Personality" },
  { value: "thinking_communication", label: "Thinking & Communication" },
  { value: "time_numbers_measurement", label: "Time, Numbers & Measurement" },
  { value: "abstract_concepts_logic", label: "Abstract Concepts & Logic" },
  { value: "common_verbs_phrasal_verbs", label: "Common Verbs & Phrasal Verbs" },
  { value: "idioms_collocations", label: "Idioms & Collocations" },
  { value: "connectors_function_words", label: "Connectors & Function Words" },
  { value: "other", label: "Other" },
] as const

export const WORD_LEVELS = [
  { value: "elementary", label: "Elementary" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const

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

export function categoryLabel(value: string): string {
  return WORD_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function levelLabel(value: string): string {
  return WORD_LEVELS.find((l) => l.value === value)?.label ?? value
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
