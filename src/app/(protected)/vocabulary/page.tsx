"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Save,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  VOCAB_TYPES,
  WORD_CATEGORIES,
  WORD_LEVELS,
  categoryLabel,
  levelLabel,
  typeLabel,
  defaultFields,
} from "@/lib/vocab";
import type {
  VocabType,
  VocabFields,
  NounFields,
  VerbFields,
  AdjectiveFields,
  SentenceFields,
  PhraseFields,
} from "@/lib/vocab-types";
import { isNounFields, isVerbFields, isAdjectiveFields, isSentenceFields, isPhraseFields } from "@/lib/vocab-types";
import { createClient } from "@/lib/supabase/client";
import { isAdmin } from "@/lib/roles";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell } from "recharts";

const CATEGORY_COLORS = [
  "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
  "#FF9F40", "#E76F51", "#D4A5FF", "#A0D2DB", "#F8A5C2",
  "#74B9FF", "#A29BFE", "#FD79A8", "#00CEC9", "#E17055",
  "#6C5CE7", "#00B894", "#FDCB6E", "#E84393", "#0984E3",
  "#636E72",
]

interface CsvRow {
  type: string;
  word: string;
  meaning: string;
  note: string;
  example_sentence: string;
  category: string;
  level: string;
  frequency_rank: number | null;
  fields?: string;
}

interface VocabTableRow {
  id: string
  user_id: string
  language: string
  type: string
  word: string
  meaning: string
  example_sentence: string
  category: string
  level: string
  frequency_rank: number | null
  notes: string
  fields: VocabFields
  score: number
}

function DeleteButton({
  item,
  onDelete,
  setDeleteId,
  size = "icon-sm",
}: {
  item: VocabTableRow;
  onDelete: () => void;
  setDeleteId: (id: string | null) => void;
  size?: "icon-sm" | "icon-lg";
}) {
  return (
    <Dialog>
      <DialogTrigger
        render={<Button variant="destructive" size={size} />}
        onClick={() => setDeleteId(item.id)}
      >
        <Trash2 className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete vocabulary?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete
            &ldquo;{item.word}&rdquo;?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function generateCsv(items: VocabTableRow[]): string {
  const header =
    "language,type,word,meaning,example_sentence,category,level,frequency_rank,notes,fields";
  const rows = items.map((item) =>
    [
      escapeCsv(item.language),
      escapeCsv(item.type),
      escapeCsv(item.word),
      escapeCsv(item.meaning),
      escapeCsv(item.example_sentence ?? ""),
      escapeCsv(item.category),
      escapeCsv(item.level),
      item.frequency_rank != null ? String(item.frequency_rank) : "",
      escapeCsv(item.notes ?? ""),
      escapeCsv(JSON.stringify(item.fields ?? {})),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim());
  const typeIdx = cols.indexOf("type");
  const wordIdx =
    cols.indexOf("word") !== -1
      ? cols.indexOf("word")
      : cols.indexOf("original");
  const meaningIdx = cols.indexOf("meaning");
  const noteIdx = cols.indexOf("note");
  const notesIdx = cols.indexOf("notes");
  const exampleIdx = cols.indexOf("example_sentence");
  const categoryIdx = cols.indexOf("category");
  const levelIdx = cols.indexOf("level");
  const freqIdx = cols.indexOf("frequency_rank");
  const fieldsIdx = cols.indexOf("fields");

  if (typeIdx === -1 || wordIdx === -1 || meaningIdx === -1) {
    throw new Error('CSV must have "type", "word", and "meaning" columns');
  }

  const results: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((c) => c.trim());
    const type = values[typeIdx] ?? "";
    const word = values[wordIdx] ?? "";
    const meaning = values[meaningIdx] ?? "";
    const note =
      noteIdx !== -1
        ? (values[noteIdx] ?? "")
        : notesIdx !== -1
          ? (values[notesIdx] ?? "")
          : "";
    const example_sentence =
      exampleIdx !== -1 ? (values[exampleIdx] ?? "") : "";
    const category = categoryIdx !== -1 ? (values[categoryIdx] ?? "") : "";
    const level = levelIdx !== -1 ? (values[levelIdx] ?? "") : "";
    const freqRaw = freqIdx !== -1 ? values[freqIdx] : "";
    const frequency_rank = freqRaw ? parseInt(freqRaw, 10) : null;
    const fieldsRaw = fieldsIdx !== -1 ? values[fieldsIdx] : "";

    if (!type || !word || !meaning) continue;

    const row: CsvRow = {
      type,
      word,
      meaning,
      note,
      example_sentence,
      category,
      level,
      frequency_rank: Number.isNaN(frequency_rank) ? null : frequency_rank,
    };

    if (fieldsRaw) {
      try { row.fields = JSON.parse(fieldsRaw) } catch { /* ignore invalid JSON */ }
    }

    results.push(row);
  }

  return results;
}

function ExportModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [exportLanguage, setExportLanguage] = useState("");
  const [exportType, setExportType] = useState("");
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("export", "true");
      if (exportLanguage) params.set("language", exportLanguage);
      if (exportType) params.set("type", exportType);

      const res = await fetch(`/api/vocabulary?${params}`);
      const data = await res.json();
      const csv = generateCsv(data.items);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vocabulary-export.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.items.length} items`);
      onOpenChange(false);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Vocabulary</DialogTitle>
          <DialogDescription>
            Select filters and export to CSV
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Language</label>
            <Select
              value={exportLanguage}
              onValueChange={(v) => setExportLanguage(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <Select
              value={exportType}
              onValueChange={(v) => setExportType(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {VOCAB_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="size-4" />
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function generateSampleCsv(): string {
  const header =
    "type,word,meaning,example_sentence,category,level,frequency_rank,fields";
  const rows = [
    ['noun', 'hello', 'سلام', '"Hello, how are you?"', 'people_relationships', 'elementary', '100', '{"plural":"hellos","gender":"masculine"}'],
    ['verb', 'go', 'رفتن', '"I go to school every day."', 'daily_routines', 'elementary', '80', '{"is_regular":false,"present":{"1s":"میروم","3s":"میرود"},"past":{"1s":"رفتم","3s":"رفت"}}'],
    ['adjective', 'beautiful', 'زیبا', '"The sky is beautiful tonight."', 'descriptions', 'intermediate', '120', '{"comparative":"زیباتر","superlative":"زیباترین"}'],
    ['adverb', 'quickly', 'سریع', '"He quickly finished his homework."', 'manner', 'intermediate', '200', '{}'],
    ['noun', 'book', 'کتاب', '"This book is very interesting."', 'education', 'elementary', '50', '{"plural":"books","gender":"inanimate"}'],
    ['verb', 'eat', 'خوردن', '"We eat lunch at noon."', 'food', 'elementary', '90', '{"is_regular":true,"present":{"1s":"میخورم","3s":"میخورد"},"past":{"1s":"خوردم","3s":"خورد"}}'],
    ['adjective', 'tall', 'بلند', '"The building is very tall."', 'descriptions', 'elementary', '150', '{"comparative":"بلندتر","superlative":"بلندترین"}'],
  ];
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const csvRows = rows.map((r) => r.map(escape).join(","));
  return [header, ...csvRows].join("\n");
}

function ImportModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const [importLanguage, setImportLanguage] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAdminUser(isAdmin(user))
    }
    checkAdmin()
  }, [])

  async function handleImport() {
    if (!importLanguage || !importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();
      const rows = parseCsv(text);

      const body: Record<string, unknown> = { language: importLanguage, items: rows }
      if (isAdminUser && isPublic) {
        body.is_public = true
      }

      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      const data = await res.json();
      toast.success(
        `Imported ${data.imported} item${data.imported !== 1 ? "s" : ""}`,
      );
      setImportLanguage("");
      setImportFile(null);
      setIsPublic(false);
      if (fileRef.current) fileRef.current.value = "";
      onOpenChange(false);
      onImported();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  const canImport = importLanguage && importFile;

  function handleDownloadSample() {
    const csv = generateSampleCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vocabulary-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Vocabulary</DialogTitle>
          <DialogDescription>
            Select language and upload a CSV file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium pb-1">Language</label>
            <Select
              value={importLanguage}
              onValueChange={(v) => setImportLanguage(v ?? "")}
              required
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="french">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium pb-1">CSV File</label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              CSV must have columns: type, word, meaning. Optional:
              example_sentence, category, level, frequency_rank, note, fields
              (type-specific fields as JSON)
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Need a template?{" "}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5"
                onClick={handleDownloadSample}
              >
                <Download className="size-3.5" />
                Download sample CSV
              </Button>
              <Link href="/help/import">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 bg-blue-500/10 hover:bg-blue-500/20"
                  title="Import help"
                >
                  <HelpCircle className="size-3.5 text-blue-600" />
                </Button>
              </Link>
            </div>
          </div>
          {isAdminUser && (
            <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-medium leading-none">
                  Make available for all users
                </span>
                <p className="text-xs text-muted-foreground">
                  These vocabs will be visible in every user's vocabulary list.
                </p>
              </div>
            </label>
          )}
        </div>
        <DialogFooter className="flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canImport || importing}>
            <Upload className="size-4" />
            {importing ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Type-specific form sections ────────────────────────────────

function NounFieldsForm({
  fields,
  onChange,
}: {
  fields: NounFields;
  onChange: (f: NounFields) => void;
}) {
  const set = (partial: Partial<NounFields>) => onChange({ ...fields, ...partial });
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Noun Details
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Plural Form</Label>
          <Input
            value={fields.plural ?? ""}
            onChange={(e) => set({ plural: e.target.value || undefined })}
            placeholder="e.g. cats"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Article</Label>
          <Input
            value={fields.article ?? ""}
            onChange={(e) => set({ article: e.target.value || undefined })}
            placeholder="e.g. der, le, the"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Gender</Label>
          <Select
            value={fields.gender ?? "none"}
            onValueChange={(v) => set({ gender: v === "none" ? undefined : v as NounFields["gender"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="masculine">Masculine</SelectItem>
              <SelectItem value="feminine">Feminine</SelectItem>
              <SelectItem value="neuter">Neuter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="noun-countable"
          checked={fields.countable ?? true}
          onChange={(e) => set({ countable: e.target.checked })}
          className="size-4"
        />
        <Label htmlFor="noun-countable" className="text-xs">Countable</Label>
      </div>
    </div>
  );
}

function VerbFieldsForm({
  fields,
  onChange,
}: {
  fields: VerbFields;
  onChange: (f: VerbFields) => void;
}) {
  const set = (partial: Partial<VerbFields>) => onChange({ ...fields, ...partial });

  const tenseKeys = ["i", "you_sg", "he_she_it", "we", "you_pl", "they"] as const;
  const tenseLabels: Record<string, string> = {
    i: "I", you_sg: "you (sg)", he_she_it: "he/she/it",
    we: "we", you_pl: "you (pl)", they: "they",
  };

  function TenseSection({
    label,
    tense,
    setTense,
  }: {
    label: string;
    tense: VerbFields["present"];
    setTense: (t: VerbFields["present"]) => void;
  }) {
    return (
      <div className="space-y-1 rounded-lg border p-2">
        <p className="text-xs font-medium text-muted-foreground uppercase text-center">{label}</p>
        <div className="space-y-1">
          {tenseKeys.map((key) => (
            <div key={key} className="grid grid-cols-[3.5rem_1fr] items-center gap-1">
              <span className="text-[11px] text-muted-foreground text-right">{tenseLabels[key]}</span>
              <Input
                className="h-6 text-[11px]"
                value={tense[key] ?? ""}
                onChange={(e) =>
                  setTense({ ...tense, [key]: e.target.value || undefined })
                }
                placeholder="—"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Verb Details
      </p>

      {/* Properties row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="verb-regular"
            checked={fields.is_regular}
            onChange={(e) => set({ is_regular: e.target.checked })}
            className="size-4"
          />
          <Label htmlFor="verb-regular" className="text-xs">Regular</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Auxiliary</Label>
          <Input
            className="h-7 w-24 text-xs"
            value={fields.auxiliary_verb ?? ""}
            onChange={(e) => set({ auxiliary_verb: e.target.value || undefined })}
            placeholder="avoir/être"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Reflexive pronoun</Label>
          <Input
            className="h-7 w-20 text-xs"
            value={fields.reflexive_pronoun ?? ""}
            onChange={(e) => set({ reflexive_pronoun: e.target.value || undefined })}
            placeholder="se"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Prepositions</Label>
          <Input
            className="h-7 w-32 text-xs"
            value={fields.prepositions?.join(", ") ?? ""}
            onChange={(e) =>
              set({
                prepositions: e.target.value
                  ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  : undefined,
              })
            }
            placeholder="à, de, avec"
          />
        </div>
      </div>

      {/* Conjugation tables */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <TenseSection label="Present" tense={fields.present ?? {}} setTense={(t) => set({ present: t })} />
        <TenseSection label="Past" tense={fields.past ?? {}} setTense={(t) => set({ past: t })} />
        <TenseSection label="Future" tense={fields.future ?? {}} setTense={(t) => set({ future: t })} />
      </div>

      {/* Participles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Past Participle</Label>
          <Input
            className="h-7 text-xs"
            value={fields.past_participle ?? ""}
            onChange={(e) => set({ past_participle: e.target.value || undefined })}
            placeholder="e.g. walked, been"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Present Participle</Label>
          <Input
            className="h-7 text-xs"
            value={fields.present_participle ?? ""}
            onChange={(e) => set({ present_participle: e.target.value || undefined })}
            placeholder="e.g. walking, being"
          />
        </div>
      </div>
    </div>
  );
}

function AdjectiveFieldsForm({
  fields,
  onChange,
}: {
  fields: AdjectiveFields;
  onChange: (f: AdjectiveFields) => void;
}) {
  const set = (partial: Partial<AdjectiveFields>) => onChange({ ...fields, ...partial });
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Adjective Details
      </p>

      {/* Comparison */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Comparison</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Comparative</Label>
            <Input
              className="h-7 text-xs"
              value={fields.comparative ?? ""}
              onChange={(e) => set({ comparative: e.target.value || undefined })}
              placeholder="e.g. taller, more beautiful"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Superlative</Label>
            <Input
              className="h-7 text-xs"
              value={fields.superlative ?? ""}
              onChange={(e) => set({ superlative: e.target.value || undefined })}
              placeholder="e.g. tallest, most beautiful"
            />
          </div>
        </div>
      </div>

      {/* Gender agreement */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Gender &amp; Number Agreement</p>
        <div className="grid grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Masculine</Label>
            <Input
              className="h-7 text-xs"
              value={fields.masculine_form ?? ""}
              onChange={(e) => set({ masculine_form: e.target.value || undefined })}
              placeholder="e.g. beau"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Feminine</Label>
            <Input
              className="h-7 text-xs"
              value={fields.feminine_form ?? ""}
              onChange={(e) => set({ feminine_form: e.target.value || undefined })}
              placeholder="e.g. belle"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Neuter</Label>
            <Input
              className="h-7 text-xs"
              value={fields.neuter_form ?? ""}
              onChange={(e) => set({ neuter_form: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Plural</Label>
            <Input
              className="h-7 text-xs"
              value={fields.plural_form ?? ""}
              onChange={(e) => set({ plural_form: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SentenceFieldsForm({
  fields,
  onChange,
}: {
  fields: SentenceFields;
  onChange: (f: SentenceFields) => void;
}) {
  const set = (partial: Partial<SentenceFields>) => onChange({ ...fields, ...partial });

  const addWord = () => {
    const wbw = fields.word_by_word ?? [];
    set({ word_by_word: [...wbw, { word: "", translation: "" }] });
  };

  const updateWord = (i: number, part: Partial<{ word: string; translation: string }>) => {
    const wbw = [...(fields.word_by_word ?? [])];
    wbw[i] = { ...wbw[i], ...part };
    set({ word_by_word: wbw });
  };

  const removeWord = (i: number) => {
    const wbw = fields.word_by_word?.filter((_, idx) => idx !== i);
    set({ word_by_word: wbw?.length ? wbw : undefined });
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Sentence Details
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Literal Translation</Label>
          <Input
            className="h-7 text-xs"
            value={fields.literal_translation ?? ""}
            onChange={(e) => set({ literal_translation: e.target.value || undefined })}
            placeholder="Word-for-word translation"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Register</Label>
          <Select
            value={fields.register ?? "neutral"}
            onValueChange={(v) => set({ register: v as SentenceFields["register"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="informal">Informal</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Context</Label>
        <Textarea
          className="min-h-[48px] text-xs resize-none"
          value={fields.context ?? ""}
          onChange={(e) => set({ context: e.target.value || undefined })}
          placeholder="When is this sentence used?"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Word-by-word breakdown</Label>
          <Button variant="outline" size="xs" onClick={addWord} type="button">
            <Plus className="size-3" /> Add
          </Button>
        </div>
        {(fields.word_by_word ?? []).map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Input
              className="h-7 flex-1 text-xs"
              value={w.word}
              onChange={(e) => updateWord(i, { word: e.target.value })}
              placeholder="Word"
            />
            <Input
              className="h-7 flex-1 text-xs"
              value={w.translation}
              onChange={(e) => updateWord(i, { translation: e.target.value })}
              placeholder="Translation"
            />
            <Button
              variant="destructive"
              size="xs"
              onClick={() => removeWord(i)}
              type="button"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhraseFieldsForm({
  fields,
  onChange,
}: {
  fields: PhraseFields;
  onChange: (f: PhraseFields) => void;
}) {
  const set = (partial: Partial<PhraseFields>) => onChange({ ...fields, ...partial });
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Phrase Details
      </p>
      <div className="space-y-1">
        <Label className="text-xs">Literal Translation</Label>
        <Input
          value={fields.literal_translation ?? ""}
          onChange={(e) => set({ literal_translation: e.target.value || undefined })}
          placeholder="Word-for-word translation"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Usage Context</Label>
        <Textarea
          className="min-h-[48px] text-xs resize-none"
          value={fields.usage_context ?? ""}
          onChange={(e) => set({ usage_context: e.target.value || undefined })}
          placeholder="When and how is this phrase used?"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Register</Label>
        <Select
          value={fields.register ?? "neutral"}
          onValueChange={(v) => set({ register: v as PhraseFields["register"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal</SelectItem>
            <SelectItem value="informal">Informal</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
            <SelectItem value="slang">Slang</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ─── Type-specific fields dispatcher ─────────────────────────────

function TypeFieldsForm({
  type,
  fields,
  onChange,
}: {
  type: string;
  fields: VocabFields;
  onChange: (f: VocabFields) => void;
}) {
  if (type === "noun") {
    return <NounFieldsForm fields={fields as NounFields} onChange={onChange} />;
  }
  if (type === "verb") {
    return <VerbFieldsForm fields={fields as VerbFields} onChange={onChange} />;
  }
  if (type === "adjective") {
    return <AdjectiveFieldsForm fields={fields as AdjectiveFields} onChange={onChange} />;
  }
  if (type === "sentence") {
    return <SentenceFieldsForm fields={fields as SentenceFields} onChange={onChange} />;
  }
  if (type === "phrase") {
    return <PhraseFieldsForm fields={fields as PhraseFields} onChange={onChange} />;
  }
  return null;
}

// ─── Base form fields (shared across add/edit) ──────────────────

interface FormState {
  language: string;
  type: string;
  word: string;
  meaning: string;
  exampleSentence: string;
  category: string;
  level: string;
  frequencyRank: string;
  notes: string;
  fields: VocabFields;
}

function makeInitialForm(type: string): FormState {
  const t = (VOCAB_TYPES.find((vt) => vt.value === type)?.value ?? "noun") as VocabType;
  return {
    language: "",
    type,
    word: "",
    meaning: "",
    exampleSentence: "",
    category: "other",
    level: "intermediate",
    frequencyRank: "",
    notes: "",
    fields: defaultFields(t),
  };
}

function VocabularyFormFields({
  idPrefix,
  form,
  setForm,
}: {
  idPrefix: string;
  form: FormState;
  setForm: (f: FormState) => void;
}) {
  const update = (partial: Partial<FormState>) => setForm({ ...form, ...partial });

  const handleTypeChange = (newType: string) => {
    const t = (VOCAB_TYPES.find((vt) => vt.value === newType)?.value ?? "noun") as VocabType;
    update({
      type: newType,
      fields: defaultFields(t),
    });
  };

  return (
    <div className="space-y-3 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-language`}>Language</Label>
          <Select
            value={form.language}
            onValueChange={(v) => update({ language: v ?? "" })}
            required
          >
            <SelectTrigger id={`${idPrefix}-language`} className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="french">French</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <Select value={form.type} onValueChange={(v) => handleTypeChange(v ?? "")} required>
            <SelectTrigger id={`${idPrefix}-type`} className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {VOCAB_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => update({ category: v ?? "other" })}
        >
          <SelectTrigger id={`${idPrefix}-category`} className="w-full">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {WORD_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-level`}>Level</Label>
          <Select
            value={form.level}
            onValueChange={(v) => update({ level: v ?? "intermediate" })}
          >
            <SelectTrigger id={`${idPrefix}-level`} className="w-full">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {WORD_LEVELS.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-frequency`}>Frequency Rank</Label>
          <Input
            id={`${idPrefix}-frequency`}
            type="number"
            min={1}
            value={form.frequencyRank}
            onChange={(e) => update({ frequencyRank: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-word`}>Word</Label>
          <Textarea
            id={`${idPrefix}-word`}
            value={form.word}
            onChange={(e) => update({ word: e.target.value })}
            className="min-h-[56px] resize-none"
            rows={2}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-meaning`}>Meaning</Label>
          <Textarea
            id={`${idPrefix}-meaning`}
            value={form.meaning}
            onChange={(e) => update({ meaning: e.target.value })}
            className="min-h-[56px] resize-none"
            rows={2}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-example`}>Example</Label>
          <Textarea
            id={`${idPrefix}-example`}
            value={form.exampleSentence}
            onChange={(e) => update({ exampleSentence: e.target.value })}
            className="min-h-[56px] resize-none"
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-notes`}>Note</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            className="min-h-[56px] resize-none"
            rows={2}
          />
        </div>
      </div>

      {form.type && (
        <TypeFieldsForm
          type={form.type}
          fields={form.fields}
          onChange={(f) => update({ fields: f })}
        />
      )}
    </div>
  );
}

// ─── Add Modal ──────────────────────────────────────────────────

function AddModal({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState<FormState>(makeInitialForm("noun"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: form.language,
        type: form.type,
        word: form.word,
        meaning: form.meaning,
        example_sentence: form.exampleSentence,
        category: form.category,
        level: form.level,
        frequency_rank: form.frequencyRank ? parseInt(form.frequencyRank, 10) : null,
        notes: form.notes,
        fields: form.fields,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save vocabulary");
      return;
    }
    toast.success("Vocabulary added!");
    setForm(makeInitialForm("noun"));
    onOpenChange(false);
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-0">
            <DialogTitle>Add Vocabulary</DialogTitle>
          </DialogHeader>
          <VocabularyFormFields idPrefix="add" form={form} setForm={setForm} />
          <DialogFooter className="flex-row pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────

function EditModal({
  item,
  open,
  onOpenChange,
  onUpdated,
}: {
  item: VocabTableRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState<FormState>(makeInitialForm("noun"));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        language: item.language,
        type: item.type,
        word: item.word,
        meaning: item.meaning,
        exampleSentence: item.example_sentence ?? "",
        category: item.category ?? "other",
        level: item.level ?? "intermediate",
        frequencyRank: item.frequency_rank != null ? String(item.frequency_rank) : "",
        notes: item.notes ?? "",
        fields: item.fields ?? defaultFields((item.type as VocabType) || "noun"),
      });
    }
  }, [item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    const res = await fetch(`/api/vocabulary/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: form.language,
        type: form.type,
        word: form.word,
        meaning: form.meaning,
        example_sentence: form.exampleSentence,
        category: form.category,
        level: form.level,
        frequency_rank: form.frequencyRank ? parseInt(form.frequencyRank, 10) : null,
        notes: form.notes,
        fields: form.fields,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to update vocabulary");
      return;
    }
    toast.success("Vocabulary updated!");
    onOpenChange(false);
    onUpdated();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-0">
            <DialogTitle>Edit Vocabulary</DialogTitle>
          </DialogHeader>
          <VocabularyFormFields idPrefix="edit" form={form} setForm={setForm} />
          <DialogFooter className="flex-row pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-4" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ──────────────────────────────────────────────────

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabTableRow[]>([]);
  const [, setTotal] = useState(0);
  const [vocabTotal, setVocabTotal] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [language, setLanguage] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editItem, setEditItem] = useState<VocabTableRow | null>(null);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (language) params.set("language", language);
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    if (level) params.set("level", level);
    params.set("sort", sort);
    params.set("page", String(page));

    return fetch(`/api/vocabulary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      });
  }, [debouncedSearch, language, type, category, level, sort, page]);

  const fetchVocabTotal = useCallback(() => {
    return fetch("/api/vocabulary?dashboard=true")
      .then((r) => r.json())
      .then((d) => {
        setVocabTotal(d.total ?? 0);
        setCategoryCounts(d.categoryCounts ?? {});
      });
  }, []);

  const refreshData = useCallback(() => {
    setLoading(true);
    Promise.all([fetchData(), fetchVocabTotal()]).finally(() =>
      setLoading(false),
    );
  }, [fetchData, fetchVocabTotal]);

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([fetchData(), fetchVocabTotal()]).finally(() =>
      setLoading(false),
    );
  }, [fetchData, fetchVocabTotal]);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/vocabulary/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    refreshData();
  }

  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      const res = await fetch("/api/vocabulary", { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const data = await res.json();
      toast.success(
        `Deleted ${data.deleted} item${data.deleted !== 1 ? "s" : ""}`,
      );
      setDeleteAllOpen(false);
      setPage(1);
      refreshData();
    } catch {
      toast.error("Failed to delete vocabulary");
    } finally {
      setDeletingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Vocabulary</h1>
        <div className="flex w-full items-center justify-between gap-2 md:w-auto md:justify-start">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
            >
              <Download className="size-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="size-4" />
              Import
            </Button>
            <Dialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={vocabTotal === 0}
                  />
                }
              >
                <Trash2 className="size-4" />
                Delete All
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete all vocabulary?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all {vocabTotal} vocabulary
                    item
                    {vocabTotal !== 1 ? "s" : ""}. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteAllOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAll}
                    disabled={deletingAll}
                  >
                    <Trash2 className="size-4" />
                    {deletingAll ? "Deleting..." : "Delete All"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="shrink-0">
            <Button
              variant="default"
              size="sm"
              className="size-7 p-0 md:h-7 md:w-auto md:px-2.5"
              onClick={() => setAddOpen(true)}
              aria-label="Add vocabulary"
            >
              <Plus className="size-4" />
              <span className="hidden md:inline">Add</span>
            </Button>
          </div>
        </div>
      </div>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refreshData}
      />
      <AddModal
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdded={refreshData}
      />
      <EditModal
        key={editItem?.id ?? "closed"}
        item={editItem}
        open={editItem !== null}
        onOpenChange={(open) => {
          if (!open) setEditItem(null);
        }}
        onUpdated={refreshData}
      />

      <Card>
        <CardHeader>
          <CardTitle>Words by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const chartData = Object.entries(categoryCounts)
              .filter(([, count]) => count > 0)
              .map(([value, count]) => ({
                name: value,
                value: count,
                label: categoryLabel(value),
              }))
              .sort((a, b) => b.value - a.value)

            if (chartData.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  No vocabulary yet.
                </p>
              )
            }

            const chartConfig: ChartConfig = {}
            for (const { name, label } of chartData) {
              chartConfig[name] = { label }
            }

            return (
              <>
                <ChartContainer
                  config={chartConfig}
                  className="mx-auto h-64 aspect-square"
                >
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      strokeWidth={0}
                    >
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span className="font-medium">
                              {String(chartData.find((d) => d.name === name)?.label ?? name)}: {value}
                            </span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {chartData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }}
                      />
                      {d.label}: {d.value}
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={language}
                onValueChange={(v) => {
                  setLanguage(v ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={type}
                onValueChange={(v) => {
                  setType(v ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {VOCAB_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={category}
                onValueChange={(v) => {
                  setCategory(v ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {WORD_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={level}
                onValueChange={(v) => {
                  setLevel(v ?? "");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {WORD_LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v ?? "newest");
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="score_low">Lowest Score</SelectItem>
                <SelectItem value="score_high">Highest Score</SelectItem>
                <SelectItem value="frequency">Frequency Rank</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {loading ? (
            <p className="p-4 text-muted-foreground">Loading...</p>
          ) : items.length === 0 ? (
            <p className="p-4 text-muted-foreground">No vocabulary found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Word</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.word}</TableCell>
                    <TableCell>{item.meaning}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categoryLabel(item.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{levelLabel(item.level)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.language}</Badge>
                    </TableCell>
                    <TableCell>{typeLabel(item.type)}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {currentUserId === item.user_id && (
                          <>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setEditItem(item)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <DeleteButton
                              item={item}
                              onDelete={handleDelete}
                              setDeleteId={setDeleteId}
                            />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No vocabulary found.</p>
        ) : (
          items.map((item) => (
            <Card key={item.id}>
              <CardHeader className="flex items-center gap-2">
                <span className="inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium">
                  {typeLabel(item.type)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {categoryLabel(item.category)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {levelLabel(item.level)}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30"
                >
                  Score: {item.score}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="font-bold text-foreground text-xl">{item.word}</p>
                <p className="text-muted-foreground text-xl">{item.meaning}</p>
              </CardContent>
              <CardFooter className="justify-center gap-2">
                {currentUserId === item.user_id && (
                  <>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      size="icon-sm"
                      item={item}
                      onDelete={handleDelete}
                      setDeleteId={setDeleteId}
                    />
                  </>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
