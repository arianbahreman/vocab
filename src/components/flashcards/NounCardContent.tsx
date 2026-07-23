import type { NounFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function NounCardFront({ word, fields }: { word: string; fields: NounFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      {fields.article && (
        <span className="text-sm text-muted-foreground">{fields.article}</span>
      )}
      <p className="text-4xl font-bold leading-tight">{word}</p>
      {fields.gender && fields.gender !== "none" && (
        <Badge variant="outline" className="text-xs capitalize">{fields.gender}</Badge>
      )}
    </div>
  )
}

export function NounCardBack({ meaning, fields }: { meaning: string; fields: NounFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {fields.plural && (
          <Badge variant="secondary" className="text-xs">
            Plural: {fields.plural}
          </Badge>
        )}
        {fields.gender && fields.gender !== "none" && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.gender}
          </Badge>
        )}
        {fields.article && (
          <Badge variant="outline" className="text-xs">
            Article: {fields.article}
          </Badge>
        )}
      </div>
    </div>
  )
}
