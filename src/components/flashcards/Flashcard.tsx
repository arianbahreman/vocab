import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, BookOpen } from "lucide-react";

export interface FlashcardProps {
  original: string;
  meaning: string;
  type?: string | null;
  notes?: string | null;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  revealed: boolean;
  onReveal?: () => void;
  frontHint?: string;
}

export function Flashcard({
  original,
  meaning,
  type,
  notes,
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
              {type}
            </Badge>
          )}
          <p className="text-4xl font-bold leading-tight">{original}</p>
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
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-2xl font-semibold">{meaning}</p>
            {notes && (
              <p className="max-w-md text-sm text-muted-foreground">{notes}</p>
            )}
          </div>

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
