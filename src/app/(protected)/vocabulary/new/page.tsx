"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { toast } from "sonner"
import { Save, X } from "lucide-react"
import { VOCAB_TYPES } from "@/lib/vocab"

export default function NewVocabularyPage() {
  const [language, setLanguage] = useState("")
  const [type, setType] = useState("")
  const [original, setOriginal] = useState("")
  const [meaning, setMeaning] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch("/api/vocabulary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, type, original, meaning, notes }),
    })

    setSaving(false)

    if (!res.ok) {
      toast.error("Failed to save vocabulary")
      return
    }

    toast.success("Vocabulary added!")
    router.push("/vocabulary")
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Add Vocabulary</h1>
      <Card>
        <CardHeader>
          <CardTitle>New Word</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={(v) => setLanguage(v ?? "")} required>
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
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v ?? "")} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VOCAB_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="original">Original</Label>
              <Textarea
                id="original"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meaning">Meaning</Label>
              <Textarea
                id="meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                <Save className="size-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/vocabulary")}
              >
                <X className="size-4" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
