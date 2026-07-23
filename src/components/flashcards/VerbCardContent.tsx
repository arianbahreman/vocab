import type { VerbFields, ConjugationSet } from "@/lib/vocab-types"
import { Badge } from "@/components/ui/badge"

function TenseTable({ label, conjugation }: { label: string; conjugation: ConjugationSet }) {
  const rows: [string, string | undefined][] = [
    ["I", conjugation.i],
    ["You (sg)", conjugation.you_sg],
    ["He/She/It", conjugation.he_she_it],
    ["We", conjugation.we],
    ["You (pl)", conjugation.you_pl],
    ["They", conjugation.they],
  ]
  const hasData = rows.some(([, v]) => v)
  if (!hasData) return null

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <div className="space-y-0.5">
        {rows.map(([pronoun, value]) =>
          value ? (
            <div key={pronoun} className="flex gap-2 text-sm">
              <span className="w-16 shrink-0 text-muted-foreground">{pronoun}</span>
              <span className="font-medium">{value}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}

export function VerbCardFront({ word, fields }: { word: string; fields: VerbFields }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-4xl font-bold leading-tight">{word}</p>
      <div className="flex gap-2">
        <Badge variant={fields.is_regular ? "secondary" : "destructive"} className="text-xs">
          {fields.is_regular ? "Regular" : "Irregular"}
        </Badge>
        {fields.reflexive_pronoun && (
          <Badge variant="outline" className="text-xs">
            {fields.reflexive_pronoun}
          </Badge>
        )}
      </div>
      {fields.prepositions && fields.prepositions.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {fields.prepositions.join(", ")}
        </p>
      )}
    </div>
  )
}

export function VerbCardBack({ meaning, fields }: { meaning: string; fields: VerbFields }) {
  const hasTenseData = fields.present || fields.past || fields.future
  return (
    <div className="flex flex-col items-center gap-3 p-4 text-center">
      <p className="text-2xl font-semibold">{meaning}</p>
      {hasTenseData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md text-left">
          <TenseTable label="Present" conjugation={fields.present} />
          <TenseTable label="Past" conjugation={fields.past} />
          <TenseTable label="Future" conjugation={fields.future} />
        </div>
      )}
      {(fields.past_participle || fields.present_participle) && (
        <div className="flex flex-wrap justify-center gap-2">
          {fields.past_participle && (
            <Badge variant="secondary" className="text-xs">
              Past Participle: {fields.past_participle}
            </Badge>
          )}
          {fields.present_participle && (
            <Badge variant="secondary" className="text-xs">
              Present Participle: {fields.present_participle}
            </Badge>
          )}
        </div>
      )}
      {fields.auxiliary_verb && (
        <Badge variant="outline" className="text-xs">
          Auxiliary: {fields.auxiliary_verb}
        </Badge>
      )}
    </div>
  )
}
