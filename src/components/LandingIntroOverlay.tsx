"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import DecipathLogo, { DecipathMark } from "@/components/DecipathLogo"

const INTRO_DURATION_MS = 3450
const REDUCED_MOTION_DURATION_MS = 700

export default function LandingIntroOverlay() {
  const [showIntro, setShowIntro] = useState(true)
  const shouldReduceMotion = useReducedMotion()
  const endDelay = shouldReduceMotion ? REDUCED_MOTION_DURATION_MS : INTRO_DURATION_MS

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntro(false), endDelay)
    return () => window.clearTimeout(timer)
  }, [endDelay])

  return (
    <AnimatePresence mode="wait">
      {showIntro && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[130] overflow-hidden bg-neutral-50 dark:bg-neutral-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0.25 : 0.5 } }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_58%)]" />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/35"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: shouldReduceMotion ? 0.2 : [0, 0.42, 0.18], scale: shouldReduceMotion ? 1 : [0.88, 1, 1.08] }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 2.3, ease: "easeOut" }}
          />
          <motion.div
            className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300/20"
            initial={{ opacity: 0, scale: 0.78 }}
            animate={{ opacity: shouldReduceMotion ? 0.18 : [0, 0.35, 0.1], scale: shouldReduceMotion ? 1 : [0.78, 1, 1.14] }}
            transition={{ duration: shouldReduceMotion ? 0.2 : 2.2, delay: shouldReduceMotion ? 0 : 0.08, ease: "easeOut" }}
          />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
            animate={{
              opacity: shouldReduceMotion ? 1 : [0, 1, 1, 0],
              y: shouldReduceMotion ? 0 : [20, 0, 0, -12],
              filter: shouldReduceMotion ? "blur(0px)" : ["blur(12px)", "blur(0px)", "blur(0px)", "blur(8px)"],
            }}
            transition={{
              duration: shouldReduceMotion ? 0.35 : 1.8,
              times: shouldReduceMotion ? undefined : [0, 0.24, 0.7, 1],
              ease: "easeOut",
            }}
          >
            <div className="flex flex-wrap items-center justify-center gap-3 text-[clamp(24px,5vw,56px)] font-semibold tracking-tight text-neutral-900 dark:text-white">
              <span>Decide</span>
              <span className="text-indigo-500 dark:text-indigo-300">+</span>
              <span>Path</span>
            </div>
            <p className="mt-2 text-[clamp(12px,1.45vw,18px)] text-neutral-600 dark:text-neutral-300">
              Strategy meets direction.
            </p>
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{
              opacity: shouldReduceMotion ? 1 : [0, 0, 1, 1, 0],
              y: shouldReduceMotion ? 0 : [12, 12, 0, 0, -6],
              filter: shouldReduceMotion ? "blur(0px)" : ["blur(8px)", "blur(8px)", "blur(0px)", "blur(0px)", "blur(4px)"],
            }}
            transition={{
              duration: shouldReduceMotion ? 0.35 : 2.15,
              delay: shouldReduceMotion ? 0.1 : 0.9,
              times: shouldReduceMotion ? undefined : [0, 0.32, 0.52, 0.86, 1],
              ease: "easeOut",
            }}
          >
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.42, ease: "easeOut", delay: shouldReduceMotion ? 0 : 0.12 }}
              >
                <DecipathLogo
                  size={56}
                  className="gap-3"
                  markClassName="rounded-[18px]"
                  nameClassName="text-[clamp(32px,6vw,78px)] font-semibold tracking-tight text-neutral-900 dark:text-white"
                  subtitle="Decide + Path"
                  subtitleClassName="mt-2 text-[clamp(11px,1.4vw,16px)] tracking-[0.2em] text-indigo-600 dark:text-indigo-200/90"
                />
              </motion.div>

              <motion.div
                className="mt-8 flex items-center gap-4"
                initial={{ opacity: 0, scaleX: 0.9 }}
                animate={{ opacity: shouldReduceMotion ? 0.7 : [0, 0.8, 0.55], scaleX: shouldReduceMotion ? 1 : [0.9, 1, 1] }}
                transition={{ duration: shouldReduceMotion ? 0.2 : 0.7, delay: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" }}
              >
                <DecipathMark size={18} className="rounded-[6px]" />
                <div className="h-px w-[80px] bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
                <DecipathMark size={18} className="rounded-[6px]" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
