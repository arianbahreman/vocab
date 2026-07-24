import type { PrepositionFields } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

export function PrepositionCardFront({ word, fields }: { word: string; fields: PrepositionFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold leading-tight">{word}</p>
      {fields.case_governed && fields.case_governed !== "none" && (
        <Badge variant="outline" className="text-xs capitalize">
          +{fields.case_governed}
        </Badge>
      )}
    </div>
  )
}

export function PrepositionCardBack({ meaning, fields }: { meaning: string; fields: PrepositionFields }) {
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {fields.case_governed && fields.case_governed !== "none" && (
          <Badge variant="secondary" className="text-xs">
            Governs {fields.case_governed}
          </Badge>
        )}
        {fields.preposition_type && (
          <Badge variant="outline" className="text-xs capitalize">
            {fields.preposition_type}
          </Badge>
        )}
      </div>
      {fields.contractions && Object.keys(fields.contractions).length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(fields.contractions).map(([contracted, full]) => (
            <Badge key={contracted} variant="outline" className="text-xs">
              {contracted} ← {full}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}