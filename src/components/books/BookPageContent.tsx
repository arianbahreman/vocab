import type { VocabularyRow } from "@/lib/vocab-types"
import WordEntry from "./WordEntry"

interface BookPageContentProps {
  words: VocabularyRow[]
}

export default function BookPageContent({ words }: BookPageContentProps) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
      {words.map((word) => (
        <div key={word.id}>
          <WordEntry
            word={word.word}
            meaning={word.meaning}
            exampleSentence={word.example_sentence}
          />
        </div>
      ))}
    </div>
  )
}
