"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import { toast } from "sonner";
import {
  VOCAB_TYPES,
  WORD_CATEGORIES,
  WORD_LEVELS,
  categoryLabel,
  levelLabel,
  type VocabularyItem,
} from "@/lib/vocab";

interface CsvRow {
  type: string;
  word: string;
  meaning: string;
  note: string;
  example_sentence: string;
  category: string;
  level: string;
  frequency_rank: number | null;
}

function DeleteButton({
  item,
  onDelete,
  setDeleteId,
  size = "icon-sm",
}: {
  item: VocabularyItem;
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

function generateCsv(items: VocabularyItem[]): string {
  const header =
    "language,type,word,meaning,example_sentence,category,level,frequency_rank,notes";
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

    if (!type || !word || !meaning) continue;

    results.push({
      type,
      word,
      meaning,
      note,
      example_sentence,
      category,
      level,
      frequency_rank: Number.isNaN(frequency_rank) ? null : frequency_rank,
    });
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
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!importLanguage || !importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();
      const rows = parseCsv(text);

      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: importLanguage, items: rows }),
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
              example_sentence, category, level, frequency_rank, note
            </p>
            <div className="rounded-lg border bg-muted/50 p-2 font-mono text-[0.375rem] leading-snug break-all">
              <p className="font-medium text-foreground">Example:</p>
              <p>
                type,word,meaning,example_sentence,category,level,frequency_rank
              </p>
              <p>
                noun,hello,سلام,&quot;Hello, how are
                you?&quot;,people_relationships,elementary,100
              </p>
            </div>
          </div>
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

function VocabularyFormFields({
  idPrefix,
  language,
  setLanguage,
  type,
  setType,
  word,
  setWord,
  meaning,
  setMeaning,
  exampleSentence,
  setExampleSentence,
  category,
  setCategory,
  level,
  setLevel,
  frequencyRank,
  setFrequencyRank,
  notes,
  setNotes,
}: {
  idPrefix: string;
  language: string;
  setLanguage: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  word: string;
  setWord: (v: string) => void;
  meaning: string;
  setMeaning: (v: string) => void;
  exampleSentence: string;
  setExampleSentence: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  level: string;
  setLevel: (v: string) => void;
  frequencyRank: string;
  setFrequencyRank: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
}) {
  return (
    <div className="space-y-3 py-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-language`}>Language</Label>
          <Select
            value={language}
            onValueChange={(v) => setLanguage(v ?? "")}
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
          <Select
            value={type}
            onValueChange={(v) => setType(v ?? "")}
            required
          >
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
          value={category}
          onValueChange={(v) => setCategory(v ?? "other")}
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
            value={level}
            onValueChange={(v) => setLevel(v ?? "intermediate")}
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
            value={frequencyRank}
            onChange={(e) => setFrequencyRank(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-word`}>Word</Label>
          <Textarea
            id={`${idPrefix}-word`}
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="min-h-[56px] resize-none"
            rows={2}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-meaning`}>Meaning</Label>
          <Textarea
            id={`${idPrefix}-meaning`}
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
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
            value={exampleSentence}
            onChange={(e) => setExampleSentence(e.target.value)}
            className="min-h-[56px] resize-none"
            rows={2}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-notes`}>Note</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[56px] resize-none"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}

function AddModal({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
}) {
  const [language, setLanguage] = useState("");
  const [type, setType] = useState("");
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [exampleSentence, setExampleSentence] = useState("");
  const [category, setCategory] = useState("other");
  const [level, setLevel] = useState("intermediate");
  const [frequencyRank, setFrequencyRank] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        type,
        word,
        meaning,
        example_sentence: exampleSentence,
        category,
        level,
        frequency_rank: frequencyRank ? parseInt(frequencyRank, 10) : null,
        notes,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Failed to save vocabulary");
      return;
    }
    toast.success("Vocabulary added!");
    setLanguage("");
    setType("");
    setWord("");
    setMeaning("");
    setExampleSentence("");
    setCategory("other");
    setLevel("intermediate");
    setFrequencyRank("");
    setNotes("");
    onOpenChange(false);
    onAdded();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-3 sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-0">
            <DialogTitle>Add Vocabulary</DialogTitle>
          </DialogHeader>
          <VocabularyFormFields
            idPrefix="add"
            language={language}
            setLanguage={setLanguage}
            type={type}
            setType={setType}
            word={word}
            setWord={setWord}
            meaning={meaning}
            setMeaning={setMeaning}
            exampleSentence={exampleSentence}
            setExampleSentence={setExampleSentence}
            category={category}
            setCategory={setCategory}
            level={level}
            setLevel={setLevel}
            frequencyRank={frequencyRank}
            setFrequencyRank={setFrequencyRank}
            notes={notes}
            setNotes={setNotes}
          />
          <DialogFooter className="flex-row">
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

function EditModal({
  item,
  open,
  onOpenChange,
  onUpdated,
}: {
  item: VocabularyItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [language, setLanguage] = useState(item?.language ?? "");
  const [type, setType] = useState(item?.type ?? "");
  const [word, setWord] = useState(item?.word ?? "");
  const [meaning, setMeaning] = useState(item?.meaning ?? "");
  const [exampleSentence, setExampleSentence] = useState(
    item?.example_sentence ?? "",
  );
  const [category, setCategory] = useState(item?.category ?? "other");
  const [level, setLevel] = useState(item?.level ?? "intermediate");
  const [frequencyRank, setFrequencyRank] = useState(
    item?.frequency_rank != null ? String(item.frequency_rank) : "",
  );
  const [notes, setNotes] = useState(item?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item) return;
    setSaving(true);
    const res = await fetch(`/api/vocabulary/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        type,
        word,
        meaning,
        example_sentence: exampleSentence,
        category,
        level,
        frequency_rank: frequencyRank ? parseInt(frequencyRank, 10) : null,
        notes,
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
      <DialogContent className="gap-3 sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="gap-0">
            <DialogTitle>Edit Vocabulary</DialogTitle>
          </DialogHeader>
          <VocabularyFormFields
            idPrefix="edit"
            language={language}
            setLanguage={setLanguage}
            type={type}
            setType={setType}
            word={word}
            setWord={setWord}
            meaning={meaning}
            setMeaning={setMeaning}
            exampleSentence={exampleSentence}
            setExampleSentence={setExampleSentence}
            category={category}
            setCategory={setCategory}
            level={level}
            setLevel={setLevel}
            frequencyRank={frequencyRank}
            setFrequencyRank={setFrequencyRank}
            notes={notes}
            setNotes={setNotes}
          />
          <DialogFooter className="flex-row">
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

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [, setTotal] = useState(0);
  const [vocabTotal, setVocabTotal] = useState(0);
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [editItem, setEditItem] = useState<VocabularyItem | null>(null);

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
      .then((d) => setVocabTotal(d.total ?? 0));
  }, []);

  const refreshData = useCallback(() => {
    setLoading(true);
    Promise.all([fetchData(), fetchVocabTotal()]).finally(() =>
      setLoading(false),
    );
  }, [fetchData, fetchVocabTotal]);

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
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-5 items-center rounded-full border px-2 text-xs font-medium">
                      {item.type}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabel(item.category)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {levelLabel(item.level)}
                    </Badge>
                    <span className="inline-flex h-5 items-center rounded-full bg-blue-500/10 px-2 text-xs font-medium text-blue-600">
                      Score: {item.score}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="outline"
                      size="icon-lg"
                      onClick={() => setEditItem(item)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <DeleteButton
                      size="icon-lg"
                      item={item}
                      onDelete={handleDelete}
                      setDeleteId={setDeleteId}
                    />
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="font-bold text-foreground text-xl">
                    {item.word}
                  </p>
                  <p className="text-muted-foreground text-xl">
                    {item.meaning}
                  </p>
                </div>
              </CardContent>
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
