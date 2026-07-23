import type { PhraseFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function PhraseCardFront({ word, fields }: { word: string; fields: PhraseFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-3xl font-bold leading-tight">{word}</p>
      {fields.register && (
        <Badge variant="outline" className="text-xs capitalize">{fields.register}</Badge>
      )}
    </div>
  )
}

export function PhraseCardBack({ meaning, fields }: { meaning: string; fields: PhraseFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      {fields.literal_translation && (
        <p className="max-w-md text-sm italic text-muted-foreground">
          Literally: {fields.literal_translation}
        </p>
      )}
      {fields.usage_context && (
        <p className="max-w-md text-xs text-muted-foreground">{fields.usage_context}</p>
      )}
    </div>
  )
}
