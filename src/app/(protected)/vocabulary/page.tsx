"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import { VOCAB_TYPES } from "@/lib/vocab";

interface VocabularyItem {
  id: string;
  language: string;
  type: string;
  original: string;
  meaning: string;
  notes?: string;
  score: number;
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
        render={
          <Button variant="ghost" size={size} className="text-destructive" />
        }
        onClick={() => setDeleteId(item.id)}
      >
        <Trash2 className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete vocabulary?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. Are you sure you want to delete
            &ldquo;{item.original}&rdquo;?
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
  const header = "language,type,original,meaning,notes";
  const rows = items.map((item) =>
    [
      escapeCsv(item.language),
      escapeCsv(item.type),
      escapeCsv(item.original),
      escapeCsv(item.meaning),
      escapeCsv(item.notes ?? ""),
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

function parseCsv(
  text: string,
): { original: string; meaning: string; note: string }[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase();
  const cols = header.split(",").map((c) => c.trim());
  const origIdx = cols.indexOf("original");
  const meaningIdx = cols.indexOf("meaning");
  const noteIdx = cols.indexOf("note");

  if (origIdx === -1 || meaningIdx === -1) {
    throw new Error('CSV must have "original" and "meaning" columns');
  }

  const results: { original: string; meaning: string; note: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split(",").map((c) => c.trim());
    const original = values[origIdx] ?? "";
    const meaning = values[meaningIdx] ?? "";
    const note = noteIdx !== -1 ? (values[noteIdx] ?? "") : "";

    if (!original || !meaning) continue;

    results.push({ original, meaning, note });
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
  const [importType, setImportType] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleImport() {
    if (!importLanguage || !importType || !importFile) return;

    setImporting(true);
    try {
      const text = await importFile.text();
      const rows = parseCsv(text);
      let success = 0;
      let errors = 0;

      for (const row of rows) {
        try {
          const res = await fetch("/api/vocabulary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              language: importLanguage,
              type: importType,
              original: row.original,
              meaning: row.meaning,
              notes: row.note,
            }),
          });
          if (res.ok) {
            success++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }

      toast.success(
        `Imported ${success} item${success !== 1 ? "s" : ""}${errors ? `, ${errors} error${errors !== 1 ? "s" : ""}` : ""}`,
      );
      setImportLanguage("");
      setImportType("");
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

  const canImport = importLanguage && importType && importFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Vocabulary</DialogTitle>
          <DialogDescription>
            Select language and type, then upload a CSV file
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="text-sm font-medium pb-1">Type</label>
              <Select
                value={importType}
                onValueChange={(v) => setImportType(v ?? "")}
                required
              >
                <SelectTrigger className="w-full">
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
          <div className="space-y-2">
            <label className="text-sm font-medium pb-1">CSV File</label>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              CSV must have columns: original, meaning, note (optional)
            </p>
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

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [language, setLanguage] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (language) params.set("language", language);
    if (type) params.set("type", type);
    params.set("sort", sort);
    params.set("page", String(page));

    return fetch(`/api/vocabulary?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setTotalPages(d.totalPages);
      });
  }, [debouncedSearch, language, type, sort, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/vocabulary/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Vocabulary</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
          >
            <Upload className="size-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportOpen(true)}
          >
            <Download className="size-4" />
            Export
          </Button>
          <Button
            variant="default"
            size="icon"
            render={<Link href="/vocabulary/new" />}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <ExportModal open={exportOpen} onOpenChange={setExportOpen} />
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={() => {
          setLoading(true);
          fetchData().finally(() => setLoading(false));
        }}
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
            <div className="flex gap-4">
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
                  <TableHead>Original</TableHead>
                  <TableHead>Meaning</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.original}
                    </TableCell>
                    <TableCell>{item.meaning}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.language}</Badge>
                    </TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link
                          href={`/vocabulary/${item.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                        </Link>
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
                    <span className="inline-flex h-5 items-center rounded-full bg-blue-500/10 px-2 text-xs font-medium text-blue-600">
                      Score: {item.score}
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Link
                      href={`/vocabulary/${item.id}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                    >
                      <Pencil className="size-4" />
                    </Link>
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
                    {item.original}
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
