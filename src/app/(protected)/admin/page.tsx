"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { toast } from "sonner"
import { Shield, ShieldOff } from "lucide-react"

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
}

function formatDate(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
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
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">
          All registered users and their study activity.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead>Last sign in</TableHead>
              <TableHead className="text-right">Words</TableHead>
              <TableHead className="text-right">Streak</TableHead>
              <TableHead className="text-right">Avg score</TableHead>
              <TableHead className="text-right">Accuracy</TableHead>
              <TableHead className="text-right">Due</TableHead>
              <TableHead>Last reviewed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.signedUpAt)}</TableCell>
                  <TableCell>{formatDate(user.lastSignInAt)}</TableCell>
                  <TableCell className="text-right">{user.totalWords}</TableCell>
                  <TableCell className="text-right">{user.streak}</TableCell>
                  <TableCell className="text-right">{user.avgScore}</TableCell>
                  <TableCell className="text-right">{user.accuracy}%</TableCell>
                  <TableCell className="text-right">{user.dueCount}</TableCell>
                  <TableCell>{formatDate(user.lastReviewedAt)}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingRole({ user, role: "user" })
                        }
                      >
                        <ShieldOff className="size-4" />
                        Demote
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPendingRole({ user, role: "admin" })
                        }
                      >
                        <Shield className="size-4" />
                        Promote
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
