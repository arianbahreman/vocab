export const VOCAB_TYPES = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "pronoun", label: "Pronoun" },
  { value: "preposition", label: "Preposition" },
  { value: "sentence", label: "Sentence" },
  { value: "phrase", label: "Phrase" },
] as const

export type VocabType = (typeof VOCAB_TYPES)[number]["value"]

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

// ─── Conjugation grid ───────────────────────────────────────────

export interface ConjugationSet {
  i?: string
  you_sg?: string
  he_she_it?: string
  we?: string
  you_pl?: string
  they?: string
}

// ─── Noun ────────────────────────────────────────────────────────

export interface NounFields {
  plural?: string
  gender?: "masculine" | "feminine" | "neuter" | "none"
  article?: string
  countable?: boolean
}

// ─── Verb ────────────────────────────────────────────────────────

export interface VerbFields {
  is_regular: boolean
  present: ConjugationSet
  past: ConjugationSet
  future: ConjugationSet
  past_participle?: string
  present_participle?: string
  prepositions?: string[]
  auxiliary_verb?: string
  reflexive_pronoun?: string
}

// ─── Adjective ───────────────────────────────────────────────────

export interface AdjectiveFields {
  comparative?: string
  superlative?: string
  masculine_form?: string
  feminine_form?: string
  neuter_form?: string
  plural_form?: string
}

// ─── Adverb ───────────────────────────────────────────────────────

export interface AdverbFields {
  adverb_type?: "manner" | "time" | "place" | "frequency" | "degree" | "interrogative" | "relative" | "other"
  comparative?: string
  superlative?: string
  synonyms?: string[]
}

// ─── Pronoun ──────────────────────────────────────────────────────

export interface PronounFields {
  pronoun_type?: "personal" | "possessive" | "reflexive" | "demonstrative" | "interrogative" | "relative" | "indefinite" | "other"
  person?: "first" | "second" | "third"
  number?: "singular" | "plural"
  gender?: "masculine" | "feminine" | "neuter" | "none"
  case?: "nominative" | "accusative" | "dative" | "genitive" | "none"
  formal?: boolean
}

// ─── Preposition ──────────────────────────────────────────────────

export interface PrepositionFields {
  case_governed?: "accusative" | "dative" | "genitive" | "none"
  preposition_type?: "location" | "time" | "direction" | "manner" | "cause" | "other"
  contractions?: Record<string, string>
}

// ─── Sentence ────────────────────────────────────────────────────

export interface SentenceFields {
  word_by_word?: { word: string; translation: string }[]
  context?: string
  register?: "formal" | "informal" | "neutral"
  literal_translation?: string
}

// ─── Phrase ──────────────────────────────────────────────────────

export interface PhraseFields {
  usage_context?: string
  register?: "formal" | "informal" | "neutral" | "slang"
  literal_translation?: string
}

// ─── Discriminated union ─────────────────────────────────────────

export type VocabFields =
  | NounFields
  | VerbFields
  | AdjectiveFields
  | AdverbFields
  | PronounFields
  | PrepositionFields
  | SentenceFields
  | PhraseFields

export type FieldsByType = {
  noun: NounFields
  verb: VerbFields
  adjective: AdjectiveFields
  adverb: AdverbFields
  pronoun: PronounFields
  preposition: PrepositionFields
  sentence: SentenceFields
  phrase: PhraseFields
}

export function defaultFields(type: VocabType): VocabFields {
  switch (type) {
    case "noun":
      return { countable: true } satisfies NounFields as NounFields
    case "verb":
      return {
        is_regular: true,
        present: {},
        past: {},
        future: {},
      } satisfies VerbFields as VerbFields
    case "adjective":
      return {} satisfies AdjectiveFields as AdjectiveFields
    case "adverb":
      return {} satisfies AdverbFields as AdverbFields
    case "pronoun":
      return {} satisfies PronounFields as PronounFields
    case "preposition":
      return {} satisfies PrepositionFields as PrepositionFields
    case "sentence":
      return {} satisfies SentenceFields as SentenceFields
    case "phrase":
      return {} satisfies PhraseFields as PhraseFields
  }
}

export function isNounFields(f: VocabFields): f is NounFields {
  return "plural" in f || "gender" in f || "article" in f
}
export function isVerbFields(f: VocabFields): f is VerbFields {
  return "present" in f
}
export function isAdjectiveFields(f: VocabFields): f is AdjectiveFields {
  return "comparative" in f || "superlative" in f
}
export function isAdverbFields(f: VocabFields): f is AdverbFields {
  return "adverb_type" in f || "synonyms" in f
}
export function isPronounFields(f: VocabFields): f is PronounFields {
  return "pronoun_type" in f || "person" in f
}
export function isPrepositionFields(f: VocabFields): f is PrepositionFields {
  return "case_governed" in f || "preposition_type" in f
}
export function isSentenceFields(f: VocabFields): f is SentenceFields {
  return "word_by_word" in f || "context" in f
}
export function isPhraseFields(f: VocabFields): f is PhraseFields {
  return "usage_context" in f || "literal_translation" in f
}

// ─── Full row (DB shape) ─────────────────────────────────────────

export interface VocabularyRow {
  id: string
  user_id: string
  language: string
  type: VocabType
  word: string
  meaning: string
  example_sentence: string
  category: string
  level: string
  frequency_rank: number | null
  notes: string
  fields: VocabFields
  is_public: boolean
  score: number
  correct_count: number
  wrong_count: number
  ease_factor: number
  interval: number
  repetitions: number
  next_review: string
  last_reviewed: string | null
  created_at: string
  updated_at: string
}

// ─── Flashcard shape ─────────────────────────────────────────────

export type FlashCardMode = "rate" | "quiz"

export interface VocabFlashCard {
  id: string
  word: string
  meaning: string
  language: string
  type: VocabType
  notes: string | null
  exampleSentence: string | null
  fields: VocabFields
  score: number
  correctCount: number
  wrongCount: number
  easeFactor: number
  interval: number
  repetitions: number
  dueCount: number
  choices: string[]
}

export function typeLabel(value: string): string {
  return VOCAB_TYPES.find((t) => t.value === value)?.label ?? value
}

export function categoryLabel(value: string): string {
  return WORD_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function levelLabel(value: string): string {
  return WORD_LEVELS.find((l) => l.value === value)?.label ?? value
}
