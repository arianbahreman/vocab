"use client"

import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { isAdmin } from "@/lib/roles"
import { useEffect, useState } from "react"
import {
  BookOpen,
  GraduationCap,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Book,
  ChevronDown,
  Settings,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const mainNavLinks = [
  { href: "/vocabulary", label: "Vocabulary", icon: BookOpen },
  { href: "/books", label: "Books", icon: Book },
  { href: "/flashcards", label: "Flashcards", icon: GraduationCap },
]

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null)
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUsername(data.user?.user_metadata?.username ?? null)
      setAdmin(isAdmin(data.user))
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setOpen(false)
    setDropdownOpen(false)
    router.push("/login")
    router.refresh()
  }

  const dropdownItems = [
    ...(admin ? [{ href: "/admin", label: "Users", icon: Users }] : []),
    { href: "/statistics", label: "Statistics", icon: BarChart3 },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="size-5" />
          Vocab
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                pathname === link.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop dropdown */}
        <div className="hidden md:relative md:block">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {username ?? "Menu"}
            <ChevronDown className="size-3.5" />
          </button>
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-lg border bg-popover p-1 shadow-md">
                {dropdownItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDropdownOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors hover:bg-muted",
                      pathname === item.href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <LogOut className="size-4" />
                  Logout
                </button>
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden"
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="flex w-64 flex-col p-0" showCloseButton={false}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2 font-semibold">
                <GraduationCap className="size-5" />
                Vocab
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            {username && (
              <p className="px-4 pt-3 text-sm text-muted-foreground">
                {username}
              </p>
            )}
            <div className="flex flex-col gap-1 p-2">
              {mainNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                    pathname === link.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Link>
              ))}
              <div className="my-1 border-t" />
              {dropdownItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                    pathname === item.href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex justify-center border-t p-4">
              <Button
                variant="outline"
                className="w-fit gap-3"
                onClick={handleLogout}
              >
                <LogOut className="size-4" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
