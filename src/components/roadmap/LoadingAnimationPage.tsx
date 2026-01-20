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

export default function LoadingAnimationPage() {
  return (
    <div className="fixed top-0 left-0 z-[51] flex items-center justify-center w-full h-screen bg-gray-950">
      <LoadingAnimation />
    </div>
  )
}