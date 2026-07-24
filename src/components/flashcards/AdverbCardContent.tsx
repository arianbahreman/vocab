import type { AdverbFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function AdverbCardFront({ word, fields }: { word: string; fields: AdverbFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold leading-tight">{word}</p>
      {fields.adverb_type && (
        <Badge variant="outline" className="text-xs capitalize">{fields.adverb_type}</Badge>
      )}
    </div>
  )
}

export function AdverbCardBack({ meaning, fields }: { meaning: string; fields: AdverbFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {fields.comparative && (
          <Badge variant="secondary" className="text-xs">
            Comparative: {fields.comparative}
          </Badge>
        )}
        {fields.superlative && (
          <Badge variant="secondary" className="text-xs">
            Superlative: {fields.superlative}
          </Badge>
        )}
        {fields.adverb_type && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.adverb_type}
          </Badge>
        )}
      </div>
      {fields.synonyms && fields.synonyms.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Synonyms: {fields.synonyms.join(", ")}
        </p>
      )}
    </div>
  )
}