"use client"

import { Card } from "@/components/ui/card"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { hubotSans } from "@/lib/fonts"

interface TaskDisplayProps {
  selectedNode?: {
    data: {
      tasks?: string[]
    }
  }
}

const listVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: "blur(5px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1] as const,
    },
  }),
  exit: {
    opacity: 0,
    y: -5,
    filter: "blur(5px)",
    transition: {
      duration: 0.2,
    },
  },
}

export default function TaskDisplay({ selectedNode }: TaskDisplayProps) {
  if (!selectedNode?.data.tasks?.length) return null

  return (
    <Card className={`${hubotSans.className} absolute z-50 bottom-6 left-6 m-3 w-auto max-w-md rounded-3xl backdrop-blur-lg dark:backdrop-blur-md bg-white/40 dark:bg-neutral-950/50 shadow-xl border-2 border-indigo-200 dark:border-indigo-400/30 overflow-hidden`}>
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: "rgba(255, 255, 255, 0.001)",
        }}
      />
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          background: `
            radial-gradient(circle at 0% 0%, rgba(244, 244, 245, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 100% 100%, rgba(244, 244, 245, 0.05) 0%, transparent 50%)
          `,
        }}
      />
      <div className="relative p-4 space-y-3">
        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="p-1.5 bg-indigo-200 rounded-lg transform transition-all hover:bg-indigo-100 duration-500">
            <CheckCircle className="w-4 h-4 text-black" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-200">Tasks</h2>
        </motion.div>
        <AnimatePresence mode="popLayout">
          <ul className="space-y-2">
            {selectedNode.data.tasks.map((task, index) => (
              <motion.li
                key={task}
                className="flex items-center gap-3 text-sm"
                variants={listVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                custom={index}
                layout
              >
                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-indigo-300 dark:bg-indigo-400 text-white text-[11px] font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-700 dark:text-gray-300">{task}</span>
              </motion.li>
            ))}
          </ul>
        </AnimatePresence>
      </div>
    </Card>
  )
}
