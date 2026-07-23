interface WordEntryProps {
  word: string
  meaning: string
  exampleSentence: string
}

export default function WordEntry({ word, meaning, exampleSentence }: WordEntryProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-lg font-bold">{word}</span>
      <span className="text-sm text-muted-foreground">{meaning}</span>
      {exampleSentence && (
        <span className="text-xs italic text-muted-foreground/70 line-clamp-2">
          &ldquo;{exampleSentence}&rdquo;
        </span>
      )}
    </div>
  )
}
