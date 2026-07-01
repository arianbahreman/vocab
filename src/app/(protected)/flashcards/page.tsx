"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { applyReview } from "@/lib/srs";
import { Flashcard } from "@/components/flashcards/Flashcard";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  RotateCw,
} from "lucide-react";

interface FlashCard {
  id: string;
  original: string;
  meaning: string;
  type?: string | null;
  notes?: string | null;
  score?: number;
  correctCount?: number;
  wrongCount?: number;
  easeFactor?: number;
  interval?: number;
  repetitions?: number;
  dueCount: number;
  choices: string[];
}

const GRADES = [
  { quality: 0, label: "Again", icon: XCircle, shortcut: "1" },
  { quality: 3, label: "Hard", icon: undefined, shortcut: "2" },
  { quality: 4, label: "Good", icon: undefined, shortcut: "3" },
  { quality: 5, label: "Easy", icon: CheckCircle2, shortcut: "4" },
] as const;

export default function FlashcardsPage() {
  return (
    <Suspense fallback={<p className="text-center text-muted-foreground">Loading card...</p>}>
      <FlashcardsContent />
    </Suspense>
  );
}

function FlashcardsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = searchParams.get("language") ?? "all";

  const [card, setCard] = useState<FlashCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);
  const [done, setDone] = useState(false);
  const [nextDue, setNextDue] = useState<string | null>(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState<number | null>(null);
  const [mode, setMode] = useState<"rate" | "quiz">("rate");
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCard = useCallback(() => {
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
      advanceTimer.current = null;
    }

    const params = new URLSearchParams();
    if (language !== "all") params.set("language", language);

    fetch(`/api/flashcards/next?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          if (data.error === "No vocabulary found") {
            setEmpty(true);
          } else {
            setError(data.error || "Failed to load card");
          }
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.done) {
          setDone(true);
          setNextDue(data.nextDue);
          return;
        }
        setCard(data);
        setSessionTotal((prev) => (prev === null ? data.dueCount : prev));
        if (data.choices) {
          const options = [data.meaning, ...data.choices];
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }
          setQuizOptions(options);
        }
      })
      .catch(() => {
        setError("Failed to load card");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [language]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  const handleGrade = useCallback(
    async (quality: number) => {
      if (submitting || !card) return;
      setSubmitting(true);

      await fetch("/api/flashcards/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vocabularyId: card.id, quality }),
      });

      setReviewedCount((c) => c + 1);
      setRevealed(false);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setLoading(true);
      loadCard();
    },
    [submitting, card, loadCard]
  );

  const handleQuizSelect = useCallback(
    (answer: string) => {
      if (!card || selectedAnswer !== null) return;
      setSelectedAnswer(answer);
      setCorrectAnswer(card.meaning);

      const isCorrect = answer === card.meaning;
      const quality = isCorrect ? 4 : 0;

      advanceTimer.current = setTimeout(() => {
        setSubmitting(true);
        fetch("/api/flashcards/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vocabularyId: card.id, quality }),
        })
          .then(() => {
            setReviewedCount((c) => c + 1);
            advanceTimer.current = null;
            setRevealed(false);
            setSelectedAnswer(null);
            setCorrectAnswer(null);
            setLoading(true);
            loadCard();
          })
          .catch(() => {
            setSubmitting(false);
          });
      }, 800);
    },
    [card, selectedAnswer, loadCard]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (submitting) return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed && card && !done) {
          setRevealed(true);
        }
      }

      if (revealed && card && !done) {
        const key = parseInt(e.key);
        if (key >= 1 && key <= 4) {
          e.preventDefault();
          if (mode === "rate") {
            const grade = GRADES[key - 1];
            if (grade) handleGrade(grade.quality);
          } else if (mode === "quiz" && selectedAnswer === null) {
            const option = quizOptions[key - 1];
            if (option) handleQuizSelect(option);
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealed, card, done, mode, submitting, quizOptions, selectedAnswer, handleGrade, handleQuizSelect]);

  function handleLanguageChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") {
      params.delete("language");
    } else {
      params.set("language", value);
    }
    setSessionTotal(null);
    setReviewedCount(0);
    setLoading(true);
    router.replace(`/flashcards?${params.toString()}`, { scroll: false });
  }

  function getIntervalPreview(quality: number): string {
    if (!card || card.easeFactor === undefined) return "";
    const result = applyReview(
      {
        easeFactor: card.easeFactor,
        interval: card.interval ?? 0,
        repetitions: card.repetitions ?? 0,
      },
      quality
    );
    return formatRelative(result.nextReview.toISOString());
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          mode={mode}
          onModeChange={setMode}
          reviewedCount={reviewedCount}
          modeDisabled={false}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              loadCard();
            }}
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          mode={mode}
          onModeChange={setMode}
          reviewedCount={reviewedCount}
          modeDisabled={false}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <BookOpen className="size-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">No vocabulary yet</h2>
          <p className="text-center text-muted-foreground">
            Add some words to your vocabulary to start studying with flashcards.
          </p>
          <Link href="/dashboard">
            <Button>
              <BookOpen className="size-4" />
              Add Vocabulary
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          mode={mode}
          onModeChange={setMode}
          reviewedCount={reviewedCount}
          modeDisabled={false}
        />
        <div className="flex flex-col items-center justify-center gap-6 py-20">
          <div className="relative">
            <Sparkles className="size-16 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-bold">You&apos;re all caught up!</h2>
          <p className="text-lg text-muted-foreground">
            {nextDue
              ? `Next card due ${formatRelative(nextDue)}`
              : "Add more vocabulary to keep studying."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="secondary" className="h-auto gap-1.5 px-3 py-1.5 text-sm">
              <CheckCircle2 className="size-4 text-green-600" />
              Reviewed: {reviewedCount}
            </Badge>
            {sessionTotal !== null && sessionTotal > 0 && (
              <Badge variant="secondary" className="h-auto gap-1.5 px-3 py-1.5 text-sm">
                <RotateCw className="size-4" />
                {Math.round((reviewedCount / sessionTotal) * 100)}%
              </Badge>
            )}
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setDone(false);
                setLoading(true);
                loadCard();
              }}
              variant="outline"
            >
              <RefreshCw className="size-4" />
              Check Again
            </Button>
            <Link href="/dashboard">
              <Button>
                Back to Dashboard
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-center py-20">
          <p className="text-center text-muted-foreground">Loading card...</p>
        </div>
      </div>
    );
  }

  if (!card) return null;

  const canQuiz = card.choices && card.choices.length >= 3;
  const capSessionTotal = sessionTotal ?? card.dueCount;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        mode={mode}
        onModeChange={setMode}
        reviewedCount={reviewedCount}
        modeDisabled={!canQuiz}
      />

      {capSessionTotal > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-4xl bg-muted">
            <div
              className="h-full rounded-4xl bg-primary transition-all duration-300"
              style={{
                width: `${Math.min((reviewedCount / capSessionTotal) * 100, 100)}%`,
              }}
            />
          </div>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {capSessionTotal - reviewedCount} left
          </span>
        </div>
      )}

      <Flashcard
        original={card.original}
        meaning={card.meaning}
        type={card.type}
        notes={card.notes}
        score={card.score}
        correctCount={card.correctCount}
        wrongCount={card.wrongCount}
        revealed={revealed}
        onReveal={() => setRevealed(true)}
      />

      {revealed && mode === "rate" && (
        <div className="grid grid-cols-2 gap-3">
          {GRADES.map(({ quality, label, icon: Icon, shortcut }) => (
            <Button
              key={quality}
              variant={quality === 0 ? "destructive" : "outline"}
              className={cn(
                "h-auto flex-col gap-1 py-3 text-base font-semibold",
                quality === 5 && "bg-green-600/15 border-green-600/50 text-green-600 hover:bg-green-600/25"
              )}
              onClick={() => handleGrade(quality)}
              disabled={submitting}
            >
              <span className="flex items-center gap-1.5">
                {Icon && <Icon className="size-5" />}
                {label}
                <kbd className="ml-1 flex size-5 items-center justify-center rounded bg-current/10 text-[10px] leading-none opacity-60">
                  {shortcut}
                </kbd>
              </span>
              <span className="text-[11px] font-normal opacity-60">
                {getIntervalPreview(quality)}
              </span>
            </Button>
          ))}
        </div>
      )}

      {revealed && mode === "quiz" && (
        <div className="grid grid-cols-2 gap-3">
          {quizOptions.map((option, i) => {
            const isSelected = selectedAnswer === option;
            const isCorrectAnswer = correctAnswer === option;
            let variant: "default" | "outline" | "destructive" = "outline";
            let extraClass = "";

            if (selectedAnswer !== null) {
              if (isCorrectAnswer) {
                variant = "default";
                extraClass =
                  "border-green-600/50 text-green-600 hover:bg-green-600/10 bg-green-600/10";
              } else if (isSelected && !isCorrectAnswer) {
                variant = "destructive";
              }
            }

            return (
              <Button
                key={i}
                variant={variant}
                className={cn("h-auto py-4 text-base font-semibold", extraClass)}
                onClick={() => handleQuizSelect(option)}
                disabled={submitting || selectedAnswer !== null}
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  {option}
                </span>
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Header({
  language,
  onLanguageChange,
  mode,
  onModeChange,
  reviewedCount,
  modeDisabled,
}: {
  language: string;
  onLanguageChange: (value: string | null) => void;
  mode: "rate" | "quiz";
  onModeChange: (mode: "rate" | "quiz") => void;
  reviewedCount: number;
  modeDisabled: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="flex items-center gap-2 text-3xl font-bold">
        <GraduationCap className="size-8 text-muted-foreground" />
        Flashcards
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "rate"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onModeChange("rate")}
          >
            Self-rate
          </button>
          <button
            className={cn(
              "px-3 py-1.5 text-sm font-medium transition-colors",
              mode === "quiz"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
              modeDisabled && "cursor-not-allowed opacity-40"
            )}
            onClick={() => !modeDisabled && onModeChange("quiz")}
            disabled={modeDisabled}
            title={modeDisabled ? "Add more vocabulary for quiz mode" : undefined}
          >
            Quiz
          </button>
        </div>
        <Select value={language} onValueChange={onLanguageChange}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="french">French</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="h-auto gap-1 px-2.5 py-1">
          <CheckCircle2 className="size-3.5 text-green-600" />
          {reviewedCount}
        </Badge>
      </div>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "<1m";
  const hours = Math.round(diff / 3_600_000);
  if (hours < 1) return `${Math.round(diff / 60_000)}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}
