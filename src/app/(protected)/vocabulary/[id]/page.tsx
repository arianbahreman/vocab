"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

export default function EditVocabularyPage() {
  const { id } = useParams<{ id: string }>()
  const [language, setLanguage] = useState("")
  const [type, setType] = useState("")
  const [original, setOriginal] = useState("")
  const [meaning, setMeaning] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/vocabulary?search=&language=&type=&sort=newest&page=1`)
      .then((r) => r.json())
      .then((d) => {
        const item = d.items.find((i: any) => i.id === id)
        if (item) {
          setLanguage(item.language)
          setType(item.type)
          setOriginal(item.original)
          setMeaning(item.meaning)
          setNotes(item.notes || "")
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch(`/api/vocabulary/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, type, original, meaning, notes }),
    })

    setSaving(false)

    if (!res.ok) {
      toast.error("Failed to update vocabulary")
      return
    }

    toast.success("Vocabulary updated!")
    router.push("/vocabulary")
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-3xl font-bold">Edit Vocabulary</h1>
      <Card>
        <CardHeader>
          <CardTitle>Edit Word</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v ?? "")} required>
                <SelectTrigger>
                  <SelectValue />
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
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="phrase">Phrase</SelectItem>
                  <SelectItem value="verb">Verb</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="original">Original</Label>
              <Input
                id="original"
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meaning">Meaning</Label>
              <Input
                id="meaning"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
