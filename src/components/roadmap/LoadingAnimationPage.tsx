"use client"

import { useTheme } from "next-themes"
import LoadingAnimation from "./loading-animation"
import type { AgentActivityEvent } from "@/utils/aiUtils"

interface LoadingAnimationPageProps {
  activity?: AgentActivityEvent[]
}

const formatPayload = (payload: unknown) => {
  if (!payload) {
    return ""
  }

  try {
    const serialized = JSON.stringify(payload, null, 2)
    return serialized.length > 520 ? `${serialized.slice(0, 520)}...` : serialized
  } catch {
    return String(payload)
  }
}

export default function LoadingAnimationPage({ activity = [] }: LoadingAnimationPageProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme !== "light"
  const latestEvent = activity[activity.length - 1]
  const recentEvents = activity.slice(-5).reverse()

  return (
    <div
      className={`fixed left-0 top-0 z-[51] flex h-screen w-full items-center justify-center ${
        isDark ? "bg-gray-950" : "bg-[radial-gradient(circle_at_50%_0%,#e0e7ff_0%,#f8fafc_42%,#eef2ff_100%)]"
      }`}
    >
      <LoadingAnimation theme={isDark ? "dark" : "light"} />

      <div className="pointer-events-none absolute bottom-6 left-1/2 w-[min(960px,94vw)] -translate-x-1/2">
        <div className="rounded-2xl border border-indigo-300/35 bg-white/85 p-4 text-slate-800 shadow-[0_18px_50px_-26px_rgba(79,70,229,0.45)] backdrop-blur-2xl dark:border-indigo-300/25 dark:bg-neutral-950/65 dark:text-indigo-50">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Agentic Search
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {latestEvent?.timestamp ? new Date(latestEvent.timestamp).toLocaleTimeString() : "initializing"}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {latestEvent?.title || "Initializing web research..."}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {latestEvent?.detail || "Preparing search queries and objective decomposition."}
          </p>

          {latestEvent?.payload && (
            <pre className="mt-3 max-h-32 overflow-auto rounded-xl border border-indigo-200/70 bg-indigo-50/70 p-2 text-[11px] leading-relaxed text-slate-700 dark:border-indigo-300/20 dark:bg-neutral-900/60 dark:text-slate-300">
              {formatPayload(latestEvent.payload)}
            </pre>
          )}

          <div className="mt-3 max-h-28 space-y-1 overflow-auto border-t border-indigo-200/70 pt-2 dark:border-indigo-300/20">
            {recentEvents.map((event) => (
              <div key={event.id} className="text-xs text-slate-600 dark:text-slate-300">
                <span className="mr-2 font-semibold text-indigo-700 dark:text-indigo-300">[{event.type}]</span>
                <span>{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}