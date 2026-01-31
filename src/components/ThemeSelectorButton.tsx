"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { motion } from "framer-motion"
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
          size="icon"
          className={cn(
            "h-12 w-12 border-2 border-indigo-300/40 rounded-full overflow-hidden bg-indigo-500/10 text-indigo-600 dark:text-indigo-200 hover:bg-indigo-500/20 dark:bg-neutral-800/40 backdrop-blur-md transition-all duration-300",
            className,
          )}
        >
          <div className="relative w-full h-full">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                rotate: theme === "dark" ? 180 : 0,
                scale: theme === "dark" ? 0 : 1,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Sun className="h-6 w-6 filter drop-shadow" />
            </motion.div>
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={false}
              animate={{
                rotate: theme === "dark" ? 0 : -180,
                scale: theme === "dark" ? 1 : 0,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Moon className="h-6 w-6  filter drop-shadow" />
            </motion.div>
          </div>
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

