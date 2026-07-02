"use client"

import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { toast } from "sonner"
import {
  Users,
  BookOpen,
  Target,
  Flame,
  Shield,
  ShieldOff,
  Search,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Pie,
  PieChart,
  Cell,
} from "recharts"

interface AdminUser {
  id: string
  username: string
  role: "admin" | "user"
  signedUpAt: string
  lastSignInAt: string | null
  totalWords: number
  streak: number
  avgScore: number
  accuracy: number
  dueCount: number
  lastReviewedAt: string | null
  reviewDates: string[]
  correctAnswers: number
  wrongAnswers: number
}

interface AdminStats {
  totalUsers: number
  totalWords: number
  averageAccuracy: number
  activeUsers: number
  activityData: { day: string; reviews: number }[]
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatRelative(value: string | null) {
  if (!value) return "—"
  const d = new Date(value)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days < 0) return formatDate(value)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  return formatDate(value)
}

function buildMiniChartData(reviewDates: string[], days: number) {
  const counts = new Map<string, number>()
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    counts.set(d.toDateString(), 0)
  }
  for (const iso of reviewDates) {
    const d = new Date(iso)
    const key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toDateString()
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1)
  }
  return Array.from(counts.entries()).map(([ts, count]) => ({
    ts,
    count,
  }))
}

const ROLE_COLORS = ["hsl(221, 83%, 53%)", "hsl(215, 20%, 65%)"]
const PERF_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(48, 96%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(215, 20%, 65%)",
]
const ENGAGE_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(221, 83%, 53%)",
  "hsl(215, 20%, 65%)",
]

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [roleFilter, setRoleFilter] = useState("all")
  const [sortField, setSortField] = useState<keyof AdminUser>("username")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingRole, setPendingRole] = useState<{
    user: AdminUser
    role: "admin" | "user"
  } | null>(null)
  const [updating, setUpdating] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setForbidden(false)
    try {
      const res = await fetch("/api/admin/users")
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      if (!res.ok) throw new Error("Failed to load users")
      const data = await res.json()
      setUsers(data.users ?? [])
      setStats(data.stats ?? null)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function confirmRoleChange() {
    if (!pendingRole) return
    setUpdating(true)
    try {
      const res = await fetch(
        `/api/admin/users/${pendingRole.user.id}/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: pendingRole.role }),
        },
      )
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update role")
        return
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === pendingRole.user.id ? { ...u, role: data.role } : u,
        ),
      )
      toast.success(
        pendingRole.role === "admin"
          ? `${pendingRole.user.username} is now an admin`
          : `${pendingRole.user.username} is now a regular user`,
      )
      if (pendingRole.role === "user") {
        toast.info("Role changes take effect on the user's next login.")
      }
    } catch {
      toast.error("Failed to update role")
    } finally {
      setUpdating(false)
      setPendingRole(null)
    }
  }

  const filteredUsers = useMemo(() => {
    let result = [...users]

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter((u) => u.username.toLowerCase().includes(q))
    }

    if (roleFilter !== "all") {
      result = result.filter((u) => u.role === roleFilter)
    }

    result.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1
      const aVal = a[sortField]
      const bVal = b[sortField]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir
      }
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * dir
    })

    return result
  }, [users, debouncedSearch, roleFilter, sortField, sortDir])

  const roleData = useMemo(() => {
    const adminCount = users.filter((u) => u.role === "admin").length
    const userCount = users.length - adminCount
    return [
      { name: "Admin", value: adminCount },
      { name: "User", value: userCount },
    ]
  }, [users])

  const performanceData = useMemo(() => {
    let excellent = 0, good = 0, needsWork = 0, noData = 0
    for (const u of users) {
      if (u.totalWords === 0) noData++
      else if (u.accuracy >= 80) excellent++
      else if (u.accuracy >= 60) good++
      else needsWork++
    }
    return [
      { name: "Excellent (≥80%)", value: excellent },
      { name: "Good (60-79%)", value: good },
      { name: "Needs Work (<60%)", value: needsWork },
      { name: "No Data", value: noData },
    ].filter((d) => d.value > 0)
  }, [users])

  const engagementData = useMemo(() => {
    let activeToday = 0, activeWeek = 0, inactive = 0
    for (const u of users) {
      if (!u.lastReviewedAt) { inactive++; continue }
      const days = Math.floor(
        (Date.now() - new Date(u.lastReviewedAt).getTime()) / 86_400_000,
      )
      if (days === 0) activeToday++
      else if (days <= 7) activeWeek++
      else inactive++
    }
    return [
      { name: "Active Today", value: activeToday },
      { name: "Active This Week", value: activeWeek },
      { name: "Inactive >7 days", value: inactive },
    ].filter((d) => d.value > 0)
  }, [users])

  const activityChartConfig = {
    reviews: { label: "Reviews", color: "var(--primary)" },
  } satisfies ChartConfig

  function toggleSort(field: keyof AdminUser) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function SortableHeader({
    field,
    label,
    className,
  }: {
    field: keyof AdminUser
    label: string
    className?: string
  }) {
    const isActive = sortField === field
    return (
      <TableHead
        className={cn("cursor-pointer select-none", className)}
        onClick={() => toggleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive && (
            <ChevronDown
              className={cn(
                "size-3 transition-transform",
                sortDir === "asc" && "rotate-180",
              )}
            />
          )}
        </div>
      </TableHead>
    )
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>
  }

  if (forbidden) {
    return (
      <div className="space-y-4 py-12 text-center">
        <h1 className="text-3xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">
          You do not have permission to view this page.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          All registered users and their study activity.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-8" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalUsers ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="size-8" />
              Words Studied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.totalWords ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="size-8" />
              Avg Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.averageAccuracy ?? 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="size-8 text-orange-500" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.activeUsers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={activityChartConfig}
              className="mx-auto h-48 aspect-square"
            >
              <PieChart>
                <Pie
                  data={roleData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={64}
                  strokeWidth={0}
                >
                  {roleData.map((_, i) => (
                    <Cell key={i} fill={ROLE_COLORS[i % ROLE_COLORS.length]} />
                  ))}
                </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span className="font-medium">{String(name)}: {value}</span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
                  {roleData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: ROLE_COLORS[i % ROLE_COLORS.length] }}
                      />
                      {d.name}: {d.value}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={activityChartConfig}
                  className="mx-auto h-48 aspect-square"
                >
                  <PieChart>
                    <Pie
                      data={performanceData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={64}
                      strokeWidth={0}
                    >
                      {performanceData.map((_, i) => (
                        <Cell key={i} fill={PERF_COLORS[i % PERF_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span className="font-medium">{String(name)}: {value}</span>
                          )}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                  {performanceData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: PERF_COLORS[i % PERF_COLORS.length] }}
                      />
                      {d.value}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={activityChartConfig}
                  className="mx-auto h-48 aspect-square"
                >
                  <PieChart>
                    <Pie
                      data={engagementData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={64}
                      strokeWidth={0}
                    >
                      {engagementData.map((_, i) => (
                        <Cell key={i} fill={ENGAGE_COLORS[i % ENGAGE_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <span className="font-medium">{String(name)}: {value}</span>
                          )}
                        />
                      }
                    />
              </PieChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
              {engagementData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: ENGAGE_COLORS[i % ENGAGE_COLORS.length] }}
                  />
                  {d.value}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Activity (Last 14 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityChartConfig} className="h-40 w-full">
            <BarChart data={stats?.activityData ?? []} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="reviews"
                fill="var(--color-reviews)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={`${sortField}-${sortDir}`}
          onValueChange={(v) => {
            if (!v) return
            const [field, dir] = v.split("-") as [keyof AdminUser, "asc" | "desc"]
            setSortField(field)
            setSortDir(dir)
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="username-asc">Username (A-Z)</SelectItem>
            <SelectItem value="username-desc">Username (Z-A)</SelectItem>
            <SelectItem value="totalWords-desc">Most Words</SelectItem>
            <SelectItem value="totalWords-asc">Fewest Words</SelectItem>
            <SelectItem value="streak-desc">Longest Streak</SelectItem>
            <SelectItem value="accuracy-desc">Highest Accuracy</SelectItem>
            <SelectItem value="avgScore-desc">Highest Score</SelectItem>
            <SelectItem value="dueCount-desc">Most Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="hidden md:block">
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">
              No users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <SortableHeader field="username" label="Username" />
                  <TableHead>Role</TableHead>
                  <SortableHeader field="totalWords" label="Words" className="text-right" />
                  <SortableHeader field="streak" label="Streak" className="text-right" />
                  <SortableHeader field="avgScore" label="Score" className="text-right" />
                  <SortableHeader field="accuracy" label="Accuracy" className="text-right" />
                  <SortableHeader field="dueCount" label="Due" className="text-right" />
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <Fragment key={user.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() =>
                        setExpandedId(
                          expandedId === user.id ? null : user.id,
                        )
                      }
                    >
                      <TableCell>
                        <ChevronRight
                          className={cn(
                            "size-4 text-muted-foreground transition-transform",
                            expandedId === user.id && "rotate-90",
                          )}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "admin" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user.totalWords}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={cn(
                            user.streak > 0 && "font-medium text-orange-500",
                          )}
                        >
                          {user.streak}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user.avgScore}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user.accuracy}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {user.dueCount}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatRelative(user.lastReviewedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.role === "admin" ? (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPendingRole({ user, role: "user" })
                              }}
                            >
                              <ShieldOff className="size-3" />
                              Demote
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPendingRole({ user, role: "admin" })
                              }}
                            >
                              <Shield className="size-3" />
                              Promote
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === user.id && (
                      <TableRow>
                        <TableCell colSpan={10} className="bg-muted/30 p-4">
                          <UserDetail user={user} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No users found.
          </p>
        ) : (
          filteredUsers.map((user) => {
            const isExpanded = expandedId === user.id
            return (
              <Card key={user.id}>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : user.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {user.role}
                      </Badge>
                    </div>
                    <ChevronRight
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-90",
                      )}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Words:</span>{" "}
                      <span className="tabular-nums">{user.totalWords}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Streak:</span>{" "}
                      <span
                        className={cn(
                          "tabular-nums",
                          user.streak > 0 && "font-medium text-orange-500",
                        )}
                      >
                        {user.streak}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Score:</span>{" "}
                      <span className="tabular-nums">{user.avgScore}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Accuracy:</span>{" "}
                      <span className="tabular-nums">{user.accuracy}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Due:</span>{" "}
                      <span className="tabular-nums">{user.dueCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Active:</span>{" "}
                      <span className="tabular-nums">
                        {formatRelative(user.lastReviewedAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <div className="flex gap-2 px-(--card-spacing) pb-(--card-spacing)">
                  {user.role === "admin" ? (
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex-1"
                      onClick={() => setPendingRole({ user, role: "user" })}
                    >
                      <ShieldOff className="size-3" />
                      Demote
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="xs"
                      className="flex-1"
                      onClick={() => setPendingRole({ user, role: "admin" })}
                    >
                      <Shield className="size-3" />
                      Promote
                    </Button>
                  )}
                </div>
                {isExpanded && (
                  <div className="border-t px-(--card-spacing) py-(--card-spacing)">
                    <UserDetail user={user} />
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      <Dialog
        open={pendingRole !== null}
        onOpenChange={(open) => !open && setPendingRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingRole?.role === "admin" ? "Promote to admin?" : "Demote to user?"}
            </DialogTitle>
            <DialogDescription>
              {pendingRole?.role === "admin"
                ? `${pendingRole.user.username} will be able to access the admin panel and manage users.`
                : `${pendingRole?.user.username} will lose admin access. This takes effect on their next login.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingRole(null)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button onClick={confirmRoleChange} disabled={updating}>
              {updating ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserDetail({ user }: { user: AdminUser }) {
  const chartData = useMemo(
    () => buildMiniChartData(user.reviewDates, 14),
    [user.reviewDates],
  )
  const maxCount = Math.max(1, ...chartData.map((d) => d.count))
  const totalAttempts = user.correctAnswers + user.wrongAnswers

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Signed Up</p>
          <p className="text-sm font-medium">{formatDate(user.signedUpAt)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Last Sign In</p>
          <p className="text-sm font-medium">
            {formatDate(user.lastSignInAt)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Attempts</p>
          <p className="text-sm font-medium tabular-nums">{totalAttempts}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg Score</p>
          <p className="text-sm font-medium tabular-nums">{user.avgScore} / 10</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-600" />
            Correct
          </p>
          <p className="text-xl font-bold text-green-600">{user.correctAnswers}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <XCircle className="size-4 text-destructive" />
            Wrong
          </p>
          <p className="text-xl font-bold text-destructive">{user.wrongAnswers}</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Target className="size-4" />
            Accuracy
          </p>
          <p className="text-xl font-bold">{user.accuracy}%</p>
        </div>
        <div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Flame className="size-4 text-orange-500" />
            Streak
          </p>
          <p className="text-xl font-bold">
            {user.streak} day{user.streak !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {chartData.some((d) => d.count > 0) && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">
            Activity (Last 14 Days)
          </p>
          <div className="flex items-end gap-0.5 h-10">
            {chartData.map((d) => (
              <div
                key={d.ts}
                className="flex-1 rounded-t transition-all"
                style={{
                  height: `${Math.max(2, (d.count / maxCount) * 100)}%`,
                  backgroundColor:
                    d.count > 0
                      ? "var(--color-primary)"
                      : "var(--color-muted)",
                  opacity: d.count > 0 ? 0.85 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
