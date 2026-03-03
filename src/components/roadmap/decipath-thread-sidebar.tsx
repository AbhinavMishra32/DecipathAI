"use client"

import { cn } from "@/lib/utils"
import Link, { type LinkProps } from "next/link"
import React, { createContext, useContext, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Menu, X } from "lucide-react"

interface Links {
  label: string
  href: string
  icon: React.JSX.Element | React.ReactNode
}

interface SidebarContextProps {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  animate: boolean
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined)

export const useDecipathSidebar = () => {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useDecipathSidebar must be used within a SidebarProvider")
  }
  return context
}

export const SidebarProvider = ({
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

  return <SidebarContext.Provider value={{ open, setOpen, animate }}>{children}</SidebarContext.Provider>
}

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode
  open?: boolean
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>
  animate?: boolean
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  )
}

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  )
}

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useDecipathSidebar()

  return (
    <motion.div
      className={cn(
        "hidden h-full flex-shrink-0 px-4 py-4 md:flex md:flex-col md:overflow-hidden rounded-2xl border border-indigo-200/50 bg-white/80 shadow-2xl shadow-indigo-900/10 backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-950/55 dark:shadow-indigo-950/40",
        className,
      )}
      animate={{
        width: animate ? (open ? "360px" : "72px") : "360px",
      }}
      transition={{ type: "spring", stiffness: 220, damping: 28, mass: 0.8 }}
      onMouseEnter={animate ? () => setOpen(true) : undefined}
      onMouseLeave={animate ? () => setOpen(false) : undefined}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useDecipathSidebar()

  return (
    <>
      <div
        className={cn(
          "mb-2 flex h-10 w-full items-center justify-between rounded-xl border border-indigo-200/70 bg-white/85 px-3 py-2 md:hidden dark:border-indigo-300/20 dark:bg-neutral-950/70",
        )}
        {...props}
      >
        <p className="text-xs uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Node Construction</p>
        <div className="z-20 flex justify-end">
          <Menu className="cursor-pointer text-indigo-700 dark:text-indigo-200" onClick={() => setOpen(!open)} />
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 z-[100] flex h-full w-full flex-col justify-between bg-white/95 p-6 dark:bg-neutral-950/95 md:hidden",
              className,
            )}
          >
            <div
              className="absolute right-6 top-6 z-50 cursor-pointer text-indigo-700 dark:text-indigo-200"
              onClick={() => setOpen(!open)}
            >
              <X />
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links
  className?: string
  props?: LinkProps
}) => {
  const { open, animate } = useDecipathSidebar()

  return (
    <Link href={link.href} className={cn("group/sidebar flex items-center justify-start gap-2 py-2", className)} {...props}>
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="inline-block whitespace-pre !m-0 !p-0 text-sm text-slate-700 transition duration-150 group-hover/sidebar:translate-x-1 dark:text-slate-200"
      >
        {link.label}
      </motion.span>
    </Link>
  )
}
