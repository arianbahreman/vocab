import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, BookOpen } from "lucide-react";
import type { VocabFields, VocabType } from "@/lib/vocab-types";
import { isNounFields, isVerbFields, isAdjectiveFields, isAdverbFields, isPronounFields, isPrepositionFields, isSentenceFields, isPhraseFields, typeLabel } from "@/lib/vocab-types";
import { NounCardFront, NounCardBack } from "./NounCardContent";
import { VerbCardFront, VerbCardBack } from "./VerbCardContent";
import { AdjectiveCardFront, AdjectiveCardBack } from "./AdjectiveCardContent";
import { AdverbCardFront, AdverbCardBack } from "./AdverbCardContent";
import { PronounCardFront, PronounCardBack } from "./PronounCardContent";
import { PrepositionCardFront, PrepositionCardBack } from "./PrepositionCardContent";
import { SentenceCardFront, SentenceCardBack } from "./SentenceCardContent";
import { PhraseCardFront, PhraseCardBack } from "./PhraseCardContent";

export interface FlashcardProps {
  word: string;
  meaning: string;
  type?: VocabType | string | null;
  fields?: VocabFields;
  exampleSentence?: string | null;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  revealed: boolean;
  onReveal?: () => void;
  frontHint?: string;
}

function FrontFace({ word, type, fields }: { word: string; type?: VocabType | string | null; fields?: VocabFields }) {
  if (type === "noun" && fields && isNounFields(fields)) {
    return <NounCardFront word={word} fields={fields} />;
  }
  if (type === "verb" && fields && isVerbFields(fields)) {
    return <VerbCardFront word={word} fields={fields} />;
  }
  if (type === "adjective" && fields && isAdjectiveFields(fields)) {
    return <AdjectiveCardFront word={word} fields={fields} />;
  }
  if (type === "adverb" && fields && isAdverbFields(fields)) {
    return <AdverbCardFront word={word} fields={fields} />;
  }
  if (type === "pronoun" && fields && isPronounFields(fields)) {
    return <PronounCardFront word={word} fields={fields} />;
  }
  if (type === "preposition" && fields && isPrepositionFields(fields)) {
    return <PrepositionCardFront word={word} fields={fields} />;
  }
  if (type === "sentence" && fields && isSentenceFields(fields)) {
    return <SentenceCardFront word={word} fields={fields} />;
  }
  if (type === "phrase" && fields && isPhraseFields(fields)) {
    return <PhraseCardFront word={word} fields={fields} />;
  }
  return <p className="text-4xl font-bold leading-tight">{word}</p>;
}

function BackFace({ meaning, type, fields, exampleSentence }: {
  meaning: string;
  type?: VocabType | string | null;
  fields?: VocabFields;
  exampleSentence?: string | null;
}) {
  const typeSpecific = (
    <>
      {type === "noun" && fields && isNounFields(fields) && <NounCardBack meaning={meaning} fields={fields} />}
      {type === "verb" && fields && isVerbFields(fields) && <VerbCardBack meaning={meaning} fields={fields} />}
      {type === "adjective" && fields && isAdjectiveFields(fields) && <AdjectiveCardBack meaning={meaning} fields={fields} />}
      {type === "adverb" && fields && isAdverbFields(fields) && <AdverbCardBack meaning={meaning} fields={fields} />}
      {type === "pronoun" && fields && isPronounFields(fields) && <PronounCardBack meaning={meaning} fields={fields} />}
      {type === "preposition" && fields && isPrepositionFields(fields) && <PrepositionCardBack meaning={meaning} fields={fields} />}
      {type === "sentence" && fields && isSentenceFields(fields) && <SentenceCardBack meaning={meaning} fields={fields} />}
      {type === "phrase" && fields && isPhraseFields(fields) && <PhraseCardBack meaning={meaning} fields={fields} />}
    </>
  );

  const fallback = (
    <div className="flex flex-col items-center gap-3">
      <p className="text-2xl font-semibold">{meaning}</p>
      {exampleSentence && (
        <p className="max-w-md text-sm italic text-muted-foreground">
          &ldquo;{exampleSentence}&rdquo;
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      {typeSpecific || fallback}
    </div>
  );
}

export function Flashcard({
  word,
  meaning,
  type,
  fields,
  exampleSentence,
  score,
  correctCount,
  wrongCount,
  revealed,
  onReveal,
  frontHint,
}: FlashcardProps) {
  return (
    <div
      className="flashcard-perspective mx-auto w-full cursor-pointer"
      onClick={() => onReveal && !revealed && onReveal()}
    >
      <div
        className={cn(
          "flashcard-inner flashcard-preserve-3d relative w-full min-h-[280px] rounded-xl bg-card text-card-foreground text-sm ring-1 ring-foreground/10 transition-transform duration-500 ease-in-out sm:min-h-[320px]",
          revealed && "flashcard-rotate-180"
        )}
        data-revealed={revealed}
      >
        {/* Front face */}
        <div className="flashcard-front flashcard-backface-hidden absolute inset-0 flex flex-col items-center justify-center rounded-xl p-6 text-center">
          {type && (
            <Badge variant="secondary" className="mb-3">
              {typeLabel(type)}
            </Badge>
          )}
          <FrontFace word={word} type={type} fields={fields} />
          <p className="mt-4 text-sm text-muted-foreground">
            {frontHint ?? (
              <>
                Press{" "}
                <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-xs font-medium">
                  Space
                </kbd>{" "}
                to reveal
              </>
            )}
          </p>
        </div>

        {/* Back face */}
        <div className="flashcard-back flashcard-backface-hidden flashcard-rotate-180 absolute inset-0 flex flex-col rounded-xl ring-1 ring-foreground/10">
          <BackFace
            meaning={meaning}
            type={type}
            fields={fields}
            exampleSentence={exampleSentence}
          />

          {(typeof correctCount === "number" ||
            typeof wrongCount === "number" ||
            typeof score === "number") && (
            <div className="flex items-center justify-center gap-4 border-t border-border/50 px-4 py-3 text-xs text-muted-foreground">
              {typeof correctCount === "number" && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="size-3.5 text-green-600" />
                  {correctCount}
                </span>
              )}
              {typeof wrongCount === "number" && (
                <span className="flex items-center gap-1">
                  <XCircle className="size-3.5 text-destructive" />
                  {wrongCount}
                </span>
              )}
              {typeof score === "number" && (
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" />
                  {score}/10
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
