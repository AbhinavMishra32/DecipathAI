"use client"

import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

const INTRO_DURATION_MS = 3600
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
          className="pointer-events-none fixed inset-0 z-[130] overflow-hidden bg-neutral-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0.25 : 0.5 } }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_58%)]" />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
            animate={{
              opacity: shouldReduceMotion ? 1 : [0, 1, 1, 0],
              y: shouldReduceMotion ? 0 : [20, 0, 0, -12],
              filter: shouldReduceMotion ? "blur(0px)" : ["blur(12px)", "blur(0px)", "blur(0px)", "blur(8px)"],
            }}
            transition={{
              duration: shouldReduceMotion ? 0.35 : 2.2,
              times: shouldReduceMotion ? undefined : [0, 0.2, 0.74, 1],
              ease: "easeOut",
            }}
          >
            <h1 className="text-[clamp(42px,9vw,116px)] font-semibold tracking-tight text-white">Decipath</h1>
            <p className="mt-1 text-[clamp(13px,1.6vw,20px)] text-indigo-200/90">abhinavmishra.in</p>
          </motion.div>

          <motion.div
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
            animate={{
              opacity: shouldReduceMotion ? 1 : [0, 0, 1, 1, 0],
              y: shouldReduceMotion ? 0 : [12, 12, 0, 0, -8],
              filter: shouldReduceMotion ? "blur(0px)" : ["blur(8px)", "blur(8px)", "blur(0px)", "blur(0px)", "blur(6px)"],
            }}
            transition={{
              duration: shouldReduceMotion ? 0.35 : 2.3,
              delay: shouldReduceMotion ? 0.1 : 1.15,
              times: shouldReduceMotion ? undefined : [0, 0.34, 0.5, 0.84, 1],
              ease: "easeOut",
            }}
          >
            <p className="text-[clamp(14px,2vw,24px)] text-indigo-100/95">
              Visit <span className="font-medium text-white">abhinavmishra.in</span> to know about me...
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
