import type { PronounFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function PronounCardFront({ word, fields }: { word: string; fields: PronounFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold leading-tight">{word}</p>
      <div className="flex gap-2">
        {fields.pronoun_type && (
          <Badge variant="outline" className="text-xs capitalize">{fields.pronoun_type}</Badge>
        )}
        {fields.case && fields.case !== "none" && (
          <Badge variant="outline" className="text-xs capitalize">{fields.case}</Badge>
        )}
      </div>
    </div>
  )
}

export function PronounCardBack({ meaning, fields }: { meaning: string; fields: PronounFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {fields.pronoun_type && (
          <Badge variant="secondary" className="text-xs capitalize">
            {fields.pronoun_type}
          </Badge>
        )}
        {fields.person && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.person} person
          </Badge>
        )}
        {fields.number && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.number}
          </Badge>
        )}
        {fields.gender && fields.gender !== "none" && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.gender}
          </Badge>
        )}
        {fields.case && fields.case !== "none" && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.case}
          </Badge>
        )}
        {fields.formal !== undefined && (
          <Badge variant={fields.formal ? "default" : "secondary"} className="text-xs">
            {fields.formal ? "Formal" : "Informal"}
          </Badge>
        )}
      </div>
    </div>
  )
}