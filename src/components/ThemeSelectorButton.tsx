"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export default function ThemeSelectorButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-10 w-10 rounded-lg border border-indigo-200/70 bg-white/70 p-0 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60",
            className,
          )}
        >
          {theme === "dark" ? (
            <Moon className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          ) : (
            <Sun className="h-4 w-4 text-indigo-500 dark:text-indigo-300" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl shadow-lg dark:shadow-[0_5px_60px_-15px_rgba(154,157,241,0.2)]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`cursor-pointer rounded-lg ${theme === "light" ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
        >
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`cursor-pointer rounded-lg my-1 ${theme === "dark" ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
        >
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`cursor-pointer rounded-lg ${theme === "system" ? "bg-gray-100 dark:bg-neutral-800" : "hover:bg-gray-100 dark:hover:bg-neutral-800"}`}
        >
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
