"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookOpen,
  Languages,
  GraduationCap,
  AlertCircle,
  Clock,
  Flame,
  Plus,
  Play,
} from "lucide-react";

interface DashboardData {
  total: number;
  english: number;
  french: number;
  lowScore: number;
  due: number;
  streak: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vocabulary?dashboard=true")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-8" />
              Total Words
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-8" />
              English
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.english ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Languages className="size-8" />
              French
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.french ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="size-8" />
              Low Score (&lt;5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.lowScore ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-8" />
              Due for Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.due ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="size-8 text-orange-500" />
              Day Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.streak ?? 0}</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-4">
        <Link
          href="/vocabulary/new"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          <Plus className="size-4" />
          Add Vocabulary
        </Link>
        <Link
          href="/flashcards"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-secondary px-2.5 text-sm font-medium text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]"
        >
          <Play className="size-4" />
          Start Flashcards
        </Link>
      </div>
    </div>
  );
}
