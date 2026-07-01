"use client";

import { useCallback, useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { VOCAB_TYPES } from "@/lib/vocab";

interface VocabularyItem {
  id: string;
  language: string;
  type: string;
  original: string;
  meaning: string;
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

export default function VocabularyPage() {
  const [items, setItems] = useState<VocabularyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [language, setLanguage] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vocabulary</h1>
        <Link
          href="/vocabulary/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="size-4" />
        </Link>
      </div>

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
                  <p className="font-bold text-foreground text-xl">{item.original}</p>
                  <p className="text-muted-foreground text-xl">{item.meaning}</p>
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
