import type { AdjectiveFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function AdjectiveCardFront({ word, fields }: { word: string; fields: AdjectiveFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold leading-tight">{word}</p>
      {fields.masculine_form && (
        <Badge variant="outline" className="text-xs">masc: {fields.masculine_form}</Badge>
      )}
      {fields.feminine_form && (
        <Badge variant="outline" className="text-xs">fem: {fields.feminine_form}</Badge>
      )}
    </div>
  )
}

export function AdjectiveCardBack({ meaning, fields }: { meaning: string; fields: AdjectiveFields }) {
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
        {fields.masculine_form && (
          <Badge variant="outline" className="text-xs">
            Masc: {fields.masculine_form}
          </Badge>
        )}
        {fields.feminine_form && (
          <Badge variant="outline" className="text-xs">
            Fem: {fields.feminine_form}
          </Badge>
        )}
        {fields.neuter_form && (
          <Badge variant="outline" className="text-xs">
            Neut: {fields.neuter_form}
          </Badge>
        )}
        {fields.plural_form && (
          <Badge variant="outline" className="text-xs">
            Plural: {fields.plural_form}
          </Badge>
        )}
      </div>
    </div>
  )
}
