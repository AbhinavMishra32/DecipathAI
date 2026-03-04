"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import {
  House,
  SquaresFour,
  Sparkle,
  GearSix,
  MagnifyingGlass,
  Moon,
  Sun,
  List,
  X,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import DecipathLogo from "@/components/DecipathLogo"

/* ─── Constants ─────────────────────────────────────────────── */
const COLLAPSED = 64
const EXPANDED = 272
const SPRING = { type: "spring" as const, stiffness: 300, damping: 28, mass: 0.8 }

/* ─── Types ─────────────────────────────────────────────────── */
type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  badge?: number
}

type RecentRoadmap = {
  id: string
  title: string
  slugId: string
  updatedAt: string
}

type SidebarData = {
  roadmapCount: number
  activeProgressCount: number
  planTier: "FREE" | "PRO" | "PREMIUM"
  planLabel: string
  monthlyGenerationUsed: number
  monthlyGenerationLimit: number
  recentRoadmaps: RecentRoadmap[]
}

/* ─── Navigation config ─────────────────────────────────────── */
const BASE_NAV: Omit<NavItem, "badge">[] = [
  { label: "Home Feed", href: "/feed", icon: House },
  { label: "My Roadmaps", href: "/roadmaps", icon: SquaresFour },
  { label: "Create Roadmap", href: "/create", icon: Sparkle },
]

/* ─── Utilities ─────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return "now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

/* ─── Sub-components ────────────────────────────────────────── */

/** Animated text label that collapses with the sidebar */
function SidebarLabel({
  text,
  open,
  className,
}: {
  text: string
  open: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "overflow-hidden whitespace-nowrap transition-all duration-200 ease-out",
        open ? "ml-3 max-w-[180px] opacity-100" : "ml-0 max-w-0 opacity-0",
        className,
      )}
    >
      {text}
    </span>
  )
}

/** Individual navigation link with active indicator */
function NavLink({
  item,
  active,
  open,
}: {
  item: NavItem
  active: boolean
  open: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
        active
          ? "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-500/[0.12] dark:text-indigo-300"
          : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200",
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-indigo-600 dark:bg-indigo-400"
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
        />
      )}
      <Icon
        weight={active ? "fill" : "regular"}
        className={cn(
          "h-[18px] w-[18px] shrink-0 transition-colors",
          active
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300",
        )}
      />
      <SidebarLabel text={item.label} open={open} />
      {item.badge !== undefined && item.badge > 0 && open && (
        <span className="ml-auto rounded-md bg-slate-100/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-white/[0.08] dark:text-slate-400">
          {item.badge}
        </span>
      )}
    </Link>
  )
}

/** Section divider — shows a label when open, a thin line when collapsed */
function SectionLabel({ label, open }: { label: string; open: boolean }) {
  if (!open) {
    return <div className="mx-auto my-3 h-px w-5 bg-slate-200/80 dark:bg-neutral-800/80" />
  }
  return (
    <div className="mb-1.5 mt-5 px-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400/80 dark:text-slate-500/80">
        {label}
      </p>
    </div>
  )
}

/** Recent roadmap quick-access link */
function RecentItem({
  roadmap,
  active,
}: {
  roadmap: RecentRoadmap
  active: boolean
}) {
  return (
    <Link
      href={`/roadmaps/${roadmap.slugId}`}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] transition-all duration-150",
        active
          ? "bg-indigo-50/60 text-indigo-700 dark:bg-indigo-500/[0.08] dark:text-indigo-300"
          : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/[0.04] dark:hover:text-slate-300",
      )}
    >
      <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
      <span className="min-w-0 flex-1 truncate">{roadmap.title}</span>
      <span className="shrink-0 text-[10px] tabular-nums text-slate-400 dark:text-slate-600">
        {timeAgo(roadmap.updatedAt)}
      </span>
    </Link>
  )
}

/* ─── User Profile (handles Clerk availability) ─────────────── */
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
const hasClerk = Boolean(publishableKey && publishableKey.startsWith("pk_"))

function SidebarUserProfile({ open, planLabel }: { open: boolean; planLabel: string }) {
  if (!hasClerk) {
    return (
      <div className="flex items-center rounded-xl px-3 py-2.5 transition-all hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
        <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 shadow-sm ring-1 ring-slate-200/50 dark:ring-neutral-700/50" />
        {open && (
          <div className="ml-3 min-w-0">
            <p className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">Account</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">{planLabel}</p>
          </div>
        )}
      </div>
    )
  }
  return <ClerkSidebarProfile open={open} planLabel={planLabel} />
}

function ClerkSidebarProfile({ open, planLabel }: { open: boolean; planLabel: string }) {
  /* These hooks are safe because ClerkProvider wraps the app when hasClerk is true */
  const [clerkMod, setClerkMod] = useState<{
    UserButton: React.ComponentType<{ appearance?: Record<string, unknown> }>
    useUser: () => { user: { username?: string | null; fullName?: string | null } | null | undefined }
  } | null>(null)

  const [themeMod, setThemeMod] = useState<{ dark: unknown } | null>(null)
  const { theme } = useTheme()

  useEffect(() => {
    Promise.all([import("@clerk/nextjs"), import("@clerk/themes")]).then(
      ([clerk, themes]) => {
        setClerkMod({ UserButton: clerk.UserButton as never, useUser: clerk.useUser as never })
        setThemeMod({ dark: themes.dark })
      },
    )
  }, [])

  if (!clerkMod || !themeMod) {
    return (
      <div className="flex items-center rounded-xl px-3 py-2.5">
        <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-neutral-800" />
      </div>
    )
  }

  return (
    <ClerkProfileInner open={open} clerkMod={clerkMod} themeMod={themeMod} currentTheme={theme} planLabel={planLabel} />
  )
}

function ClerkProfileInner({
  open,
  clerkMod,
  themeMod,
  currentTheme,
  planLabel,
}: {
  open: boolean
  clerkMod: {
    UserButton: React.ComponentType<{ appearance?: Record<string, unknown> }>
    useUser: () => { user: { username?: string | null; fullName?: string | null } | null | undefined }
  }
  themeMod: { dark: unknown }
  currentTheme: string | undefined
  planLabel: string
}) {
  const { user } = clerkMod.useUser()
  const { UserButton } = clerkMod

  return (
    <div className="flex items-center rounded-xl px-3 py-2.5 transition-all hover:bg-slate-50/80 dark:hover:bg-white/[0.04]">
      <div className="shrink-0">
        <UserButton
          appearance={{
            baseTheme: currentTheme === "dark" ? themeMod.dark : undefined,
            elements: {
              userButtonAvatarBox: "h-7 w-7 ring-1 ring-slate-200/50 dark:ring-neutral-700/50",
            },
          }}
        />
      </div>
      {open && (
        <div className="ml-3 min-w-0">
          <p className="truncate text-[13px] font-medium text-slate-700 dark:text-slate-200">
            {user?.username || user?.fullName || "Account"}
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">{planLabel}</p>
        </div>
      )}
    </div>
  )
}

/* ─── Main Sidebar Component ────────────────────────────────── */
export default function WorkspaceNavSidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [pinned, setPinned] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarData, setSidebarData] = useState<SidebarData | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  /* Fetch sidebar data (recent roadmaps, counts) */
  useEffect(() => {
    fetch("/api/sidebar")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSidebarData(data)
      })
      .catch(() => {})
  }, [pathname])

  /* ⌘B to pin / unpin sidebar */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault()
        setPinned((p) => !p)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const isOpen = open || pinned

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href))

  const navItems: NavItem[] = useMemo(
    () =>
      BASE_NAV.map((item) => ({
        ...item,
        badge: item.href === "/roadmaps" && sidebarData ? sidebarData.roadmapCount : undefined,
      })),
    [sidebarData],
  )

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")
  const planLabel = sidebarData?.planLabel ?? "Free plan"

  /* ─── Shared sidebar content (reused for desktop & mobile) ── */
  const sidebarContent = (forMobile: boolean) => {
    const isExpanded = forMobile || isOpen

    return (
      <>
        {/* ── Header with logo ── */}
        <div className="flex h-14 shrink-0 items-center gap-0 border-b border-slate-100/80 px-[18px] dark:border-neutral-800/50">
          <DecipathLogo
            showName={false}
            size={32}
            markClassName="rounded-[10px]"
            className="shrink-0"
          />
          <SidebarLabel
            text="Decipath"
            open={isExpanded}
            className="text-[15px] font-semibold text-slate-900 dark:text-white"
          />
          {forMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-neutral-800 dark:hover:text-slate-300"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Search trigger ── */}
        <div className="shrink-0 px-3 pt-3">
          <button
            className={cn(
              "flex w-full items-center rounded-xl border px-3 py-2 transition-all duration-150",
              "border-slate-200/60 bg-slate-50/50 hover:border-slate-300/70 hover:bg-slate-100/70",
              "dark:border-neutral-800/60 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/40",
              !isExpanded && "justify-center",
            )}
          >
            <MagnifyingGlass
              weight="bold"
              className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500"
            />
            {isExpanded && (
              <>
                <span className="ml-2.5 flex-1 text-left text-[13px] text-slate-400 dark:text-slate-500">
                  Search...
                </span>
                <kbd className="inline-flex items-center gap-0.5 rounded-md border border-slate-200/60 bg-white/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-neutral-700/60 dark:bg-neutral-800/70 dark:text-slate-500">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2 pt-3"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Main nav items */}
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                open={isExpanded}
              />
            ))}
          </div>

          {/* Recent roadmaps section */}
          {sidebarData && sidebarData.recentRoadmaps.length > 0 && (
            <>
              <SectionLabel label="Recent" open={isExpanded} />
              {isExpanded && (
                <div className="space-y-0.5">
                  {sidebarData.recentRoadmaps.map((roadmap) => (
                    <RecentItem
                      key={roadmap.id}
                      roadmap={roadmap}
                      active={pathname === `/roadmaps/${roadmap.slugId}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Workspace section */}
          <SectionLabel label="Workspace" open={isExpanded} />
          <div className="space-y-0.5">
            <NavLink
              item={{ label: "Settings", href: "/settings", icon: GearSix }}
              active={isActive("/settings")}
              open={isExpanded}
            />
          </div>
        </nav>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-slate-100/80 px-2.5 pb-4 pt-2 dark:border-neutral-800/50">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="group flex w-full items-center rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-150 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200"
          >
            {mounted && theme === "dark" ? (
              <Moon
                weight="regular"
                className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-slate-500"
              />
            ) : (
              <Sun
                weight="regular"
                className="h-[18px] w-[18px] shrink-0 text-slate-400 dark:text-slate-500"
              />
            )}
            <SidebarLabel
              text={mounted && theme === "dark" ? "Dark mode" : "Light mode"}
              open={isExpanded}
            />
          </button>

          {/* User profile */}
          <div className="mt-0.5">
            <SidebarUserProfile open={isExpanded} planLabel={planLabel} />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {/* ── Desktop sidebar (fixed, hover-expand) ── */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col",
          "border-r border-slate-200/50 bg-white/[0.97] backdrop-blur-2xl",
          "dark:border-neutral-800/50 dark:bg-neutral-950/[0.97]",
          "lg:flex",
        )}
        animate={{ width: isOpen ? EXPANDED : COLLAPSED }}
        transition={SPRING}
        onMouseEnter={() => {
          if (!pinned) setOpen(true)
        }}
        onMouseLeave={() => {
          if (!pinned) setOpen(false)
        }}
      >
        {sidebarContent(false)}
      </motion.aside>

      {/* ── Mobile hamburger trigger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex items-center justify-center rounded-xl border border-slate-200/50 bg-white/90 p-2.5 shadow-sm backdrop-blur-xl transition-colors hover:bg-slate-50 dark:border-neutral-800/50 dark:bg-neutral-950/90 dark:hover:bg-neutral-900 lg:hidden"
      >
        <List weight="bold" className="h-5 w-5 text-slate-600 dark:text-slate-300" />
      </button>

      {/* ── Mobile sidebar (slide-over) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40 lg:hidden"
            />

            {/* Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={SPRING}
              className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-slate-200/50 bg-white shadow-2xl shadow-slate-200/40 dark:border-neutral-800/50 dark:bg-neutral-950 dark:shadow-black/30 lg:hidden"
            >
              {sidebarContent(true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
