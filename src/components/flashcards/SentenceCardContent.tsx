import type { SentenceFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function SentenceCardFront({ word, fields }: { word: string; fields: SentenceFields }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-2xl font-bold leading-tight italic">{word}</p>
      {fields.register && (
        <Badge variant="outline" className="text-xs capitalize">{fields.register}</Badge>
      )}
    </div>
  )
}

export function SentenceCardBack({ meaning, fields }: { meaning: string; fields: SentenceFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      {fields.literal_translation && (
        <p className="max-w-md text-sm italic text-muted-foreground">
          Literally: {fields.literal_translation}
        </p>
      )}
      {fields.word_by_word && fields.word_by_word.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
          {fields.word_by_word.map((w, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-sm font-medium">{w.word}</span>
              <span className="text-xs text-muted-foreground">{w.translation}</span>
            </div>
          ))}
        </div>
      )}
      {fields.context && (
        <p className="max-w-md text-xs text-muted-foreground italic">{fields.context}</p>
      )}
    </div>
  )
}
