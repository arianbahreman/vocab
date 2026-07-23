import Link from "next/link"
import { BookOpen, Zap, Palette, MessageSquare, Languages, type LucideIcon } from "lucide-react"
import type { VocabType } from "@/lib/vocab-types"

const TYPE_CONFIG: Record<
  VocabType,
  {
    icon: LucideIcon
    gradient: string
    border: string
    topBar: string
    iconBg: string
    iconColor: string
    badgeBg: string
    badgeText: string
    hoverGlow: string
  }
> = {
  noun: {
    icon: BookOpen,
    gradient: "from-orange-500/10 to-amber-500/5",
    border: "border-orange-200",
    topBar: "border-t-orange-400",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    badgeBg: "bg-orange-100",
    badgeText: "text-orange-700",
    hoverGlow: "group-hover:shadow-orange-200/50",
  },
  verb: {
    icon: Zap,
    gradient: "from-blue-500/10 to-sky-500/5",
    border: "border-blue-200",
    topBar: "border-t-blue-400",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    hoverGlow: "group-hover:shadow-blue-200/50",
  },
  adjective: {
    icon: Palette,
    gradient: "from-emerald-500/10 to-green-500/5",
    border: "border-emerald-200",
    topBar: "border-t-emerald-400",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    hoverGlow: "group-hover:shadow-emerald-200/50",
  },
  sentence: {
    icon: MessageSquare,
    gradient: "from-violet-500/10 to-purple-500/5",
    border: "border-violet-200",
    topBar: "border-t-violet-400",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    badgeBg: "bg-violet-100",
    badgeText: "text-violet-700",
    hoverGlow: "group-hover:shadow-violet-200/50",
  },
  phrase: {
    icon: Languages,
    gradient: "from-pink-500/10 to-rose-500/5",
    border: "border-pink-200",
    topBar: "border-t-pink-400",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    badgeBg: "bg-pink-100",
    badgeText: "text-pink-700",
    hoverGlow: "group-hover:shadow-pink-200/50",
  },
}

interface BookCoverProps {
  type: VocabType
  label: string
  count: number
  language: string
}

export default function BookCover({ type, label, count, language }: BookCoverProps) {
  const config = TYPE_CONFIG[type]
  const Icon = config.icon

  return (
    <Link
      href={`/books/${type}?language=${language}`}
      className={`group flex flex-col items-center gap-3 rounded-xl border bg-gradient-to-br p-6 shadow-sm transition-all hover:shadow-lg ${config.border} ${config.gradient} ${config.topBar} border-t-4 ${config.hoverGlow}`}
    >
      <div
        className={`flex size-14 items-center justify-center rounded-full ${config.iconBg}`}
      >
        <Icon className={`size-7 transition-transform ${config.iconColor}`} />
      </div>
      <span className="text-base font-semibold">{label}</span>
      <span
        className={`rounded-full px-3 py-0.5 text-xs tabular-nums ${config.badgeBg} ${config.badgeText}`}
      >
        {count} {count === 1 ? "word" : "words"}
      </span>
    </Link>
  )
}
