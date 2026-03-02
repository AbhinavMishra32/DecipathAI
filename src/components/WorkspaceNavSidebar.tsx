"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { createContext, useContext, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"
import ThemeSelectorButton from "@/components/ThemeSelectorButton"
import UserProfileButton from "@/components/UserProfileButton"

type WorkspaceLink = {
  label: string
  href: string
}

type SidebarContextProps = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const WorkspaceSidebarContext = createContext<SidebarContextProps | undefined>(undefined)

const useWorkspaceSidebar = () => {
  const context = useContext(WorkspaceSidebarContext)
  if (!context) {
    throw new Error("useWorkspaceSidebar must be used within WorkspaceSidebarProvider")
  }
  return context
}

const WorkspaceSidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  const [openState, setOpenState] = useState(false)

  const open = openProp !== undefined ? openProp : openState
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState

  return <WorkspaceSidebarContext.Provider value={{ open, setOpen, animate }}>{children}</WorkspaceSidebarContext.Provider>
}

function DesktopWorkspaceSidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open, setOpen, animate } = useWorkspaceSidebar()

  return (
    <motion.aside
      className={cn(
        "z-20 hidden h-screen shrink-0 flex-col border-r border-indigo-300/20 bg-white/75 px-4 py-5 backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/55 lg:flex",
        className,
      )}
      animate={{
        width: animate ? (open ? "17.5rem" : "4.5rem") : "17.5rem",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
    </motion.aside>
  )
}

function MobileWorkspaceSidebar({ children }: { children: React.ReactNode }) {
  const { open, setOpen } = useWorkspaceSidebar()

  return (
    <>
      <div className="fixed left-3 top-3 z-40 flex lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center justify-center rounded-lg border border-indigo-300/30 bg-white/80 p-2 text-indigo-700 shadow-md backdrop-blur dark:border-indigo-300/20 dark:bg-neutral-900/75 dark:text-indigo-200"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex w-full flex-col bg-white/95 p-6 dark:bg-neutral-950/95 lg:hidden"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-6 top-6 text-indigo-700 dark:text-indigo-200"
            >
              <X className="h-6 w-6" />
            </button>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function WorkspaceSidebarLabel({ text }: { text: string }) {
  const { open, animate } = useWorkspaceSidebar()
  return (
    <motion.span
      animate={{
        display: animate ? (open ? "inline-block" : "none") : "inline-block",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className="inline-block whitespace-pre"
    >
      {text}
    </motion.span>
  )
}

export default function WorkspaceNavSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links: WorkspaceLink[] = useMemo(
    () => [
      { label: "Home Feed", href: "/feed" },
      { label: "Dashboard", href: "/roadmaps" },
      { label: "Create roadmap", href: "/create" },
    ],
    [],
  )

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href))

  const content = (
    <>
      <div className="mb-5 rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-2 dark:border-indigo-300/20 dark:bg-indigo-900/20">
        <p className="text-xs uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Decipath</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
          <WorkspaceSidebarLabel text="Workspace" />
        </p>
      </div>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "inline-flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition",
              isActive(link.href)
                ? "border-indigo-300/40 bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
                : "border-indigo-200/70 bg-white/85 font-medium text-slate-700 hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-200",
            )}
          >
            <span aria-hidden>•</span>
            <WorkspaceSidebarLabel text={link.label} />
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2">
        <ThemeSelectorButton />
        <UserProfileButton />
      </div>
    </>
  )

  return (
    <WorkspaceSidebarProvider open={open} setOpen={setOpen} animate>
      <DesktopWorkspaceSidebar>{content}</DesktopWorkspaceSidebar>
      <MobileWorkspaceSidebar>{content}</MobileWorkspaceSidebar>
    </WorkspaceSidebarProvider>
  )
}
