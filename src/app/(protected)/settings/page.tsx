"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Save } from "lucide-react"

interface UserSettings {
  show_public_vocabs: boolean
  default_language: string
  default_level: string
  flashcards_per_session: number
  review_order: string
}

const DEFAULT_SETTINGS: UserSettings = {
  show_public_vocabs: true,
  default_language: "",
  default_level: "intermediate",
  flashcards_per_session: 20,
  review_order: "due_first",
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const update = (partial: Partial<UserSettings>) =>
    setSettings((prev) => ({ ...prev, ...partial }))

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/user/settings")
      if (!res.ok) throw new Error("Failed to load settings")
      const data = await res.json()
      setSettings({
        show_public_vocabs: data.show_public_vocabs ?? true,
        default_language: data.default_language ?? "",
        default_level: data.default_level ?? "intermediate",
        flashcards_per_session: data.flashcards_per_session ?? 20,
        review_order: data.review_order ?? "due_first",
      })
    } catch {
      toast.error("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      toast.success("Settings saved!")
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Vocabulary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer">
            <Switch
              checked={settings.show_public_vocabs}
              onCheckedChange={(v) => update({ show_public_vocabs: v })}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-sm font-medium leading-none">
                Show public vocabulary from admin
              </span>
              <p className="text-xs text-muted-foreground">
                When disabled, only your own vocabulary will appear in the list.
              </p>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="default-language">Default Language</Label>
              <Select
                value={settings.default_language}
                onValueChange={(v) => update({ default_language: v ?? "" })}
              >
                <SelectTrigger id="default-language">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="default-level">Default Level</Label>
              <Select
                value={settings.default_level}
                onValueChange={(v) => update({ default_level: v ?? "intermediate" })}
              >
                <SelectTrigger id="default-level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elementary">Elementary</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="cards-per-session">Cards per session</Label>
              <Input
                id="cards-per-session"
                type="number"
                min={5}
                max={100}
                value={settings.flashcards_per_session}
                onChange={(e) =>
                  update({
                    flashcards_per_session: Math.max(
                      5,
                      Math.min(100, parseInt(e.target.value) || 20),
                    ),
                  })
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="review-order">Review order</Label>
              <Select
                value={settings.review_order}
                onValueChange={(v) => update({ review_order: v ?? "due_first" })}
              >
                <SelectTrigger id="review-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_first">Due First</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="newest_first">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
