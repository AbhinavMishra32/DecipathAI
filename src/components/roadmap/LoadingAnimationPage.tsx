"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { CheckCircle, Circle, CircleNotch, MagnifyingGlass } from "@phosphor-icons/react"
import type { AgentActivityEvent } from "@/utils/aiUtils"
import { Sidebar, SidebarBody } from "@/components/roadmap/decipath-thread-sidebar"

interface LoadingAnimationPageProps {
  activity?: AgentActivityEvent[]
}

type BillingUsageSnapshot = {
  planTier: "FREE" | "PRO" | "PREMIUM"
  planLabel: string
  monthlyGenerationUsed: number
  monthlyGenerationLimit: number
  monthlyGenerationRemaining: number
  maxSearchCalls: number
}

type ThreadKind = "thought" | "action" | "checkpoint" | "outcome" | "warning" | "error"
type MarkerShape = "dot" | "diamond" | "square" | "ring"
type NodeLifecycleStage = "planned" | "researching" | "researched" | "ready"

type ThreadEntry = {
  id: string
  kind: ThreadKind
  icon: string
  label: string
  badge?: string
  query?: string
  queries?: string[]
  title: string
  detail?: string
  dotClass: string
  titleClass: string
  markerShape: MarkerShape
  objective?: string
  nextNodeLabels?: string[]
}

type NodeLifecycleEntry = {
  id: string
  label: string
  stage: NodeLifecycleStage
  pathwayCount?: number
  referencesCount?: number
  searchCount: number
  searchQueries: string[]
  latestDetail?: string
  statusTrail: string[]
  order: number
}

const THREAD_META: Record<ThreadKind, Pick<ThreadEntry, "icon" | "dotClass" | "titleClass" | "label" | "markerShape">> = {
  thought: {
    icon: "✦",
    label: "Thought",
    dotClass: "bg-violet-500/85",
    titleClass: "text-violet-700 dark:text-violet-300",
    markerShape: "dot",
  },
  action: {
    icon: "search",
    label: "Searching",
    dotClass: "bg-fuchsia-500/85",
    titleClass: "text-fuchsia-700 dark:text-fuchsia-300",
    markerShape: "square",
  },
  checkpoint: {
    icon: "◈",
    label: "Checkpoint",
    dotClass: "bg-purple-500/85",
    titleClass: "text-purple-700 dark:text-purple-300",
    markerShape: "diamond",
  },
  outcome: {
    icon: "✓",
    label: "Outcome",
    dotClass: "bg-emerald-500/90",
    titleClass: "text-emerald-700 dark:text-emerald-300",
    markerShape: "ring",
  },
  warning: {
    icon: "⚑",
    label: "Warning",
    dotClass: "bg-amber-500/85",
    titleClass: "text-amber-700 dark:text-amber-300",
    markerShape: "diamond",
  },
  error: {
    icon: "⚠",
    label: "Error",
    dotClass: "bg-rose-500/90",
    titleClass: "text-rose-700 dark:text-rose-300",
    markerShape: "square",
  },
}

const THREAD_GLOW_CLASS: Record<ThreadKind, string> = {
  thought: "bg-violet-400/25 dark:bg-violet-400/20",
  action: "bg-fuchsia-400/25 dark:bg-fuchsia-400/20",
  checkpoint: "bg-purple-400/25 dark:bg-purple-400/20",
  outcome: "bg-emerald-400/25 dark:bg-emerald-400/20",
  warning: "bg-amber-400/25 dark:bg-amber-400/20",
  error: "bg-rose-500/25 dark:bg-rose-400/20",
}

const THREAD_ROW_CLASS: Record<ThreadKind, string> = {
  thought: "",
  action: "",
  checkpoint: "",
  outcome: "",
  warning: "",
  error: "",
}

const getLatestMarkerAnimation = (kind: ThreadKind) => {
  switch (kind) {
    case "action":
      return { scale: [1, 1.18, 1], rotate: [0, -10, 10, 0], opacity: [0.88, 1, 0.88] }
    case "checkpoint":
      return { scale: [1, 1.24, 1], rotate: [45, 45, 45], opacity: [0.84, 1, 0.84] }
    case "thought":
      return { scale: [1, 1.12, 1], y: [0, -1.5, 0], opacity: [0.88, 1, 0.88] }
    case "outcome":
      return { scale: [1, 1.16, 1], opacity: [0.9, 1, 0.9] }
    case "warning":
      return { scale: [1, 1.14, 1], y: [0, -1, 0], opacity: [0.88, 1, 0.88] }
    case "error":
      return { scale: [1, 1.16, 1], x: [0, -1, 1, 0], opacity: [0.86, 1, 0.86] }
    default:
      return { scale: [1, 1.14, 1], opacity: [0.88, 1, 0.88] }
  }
}

const getLatestMarkerTransition = (kind: ThreadKind) => {
  switch (kind) {
    case "action":
      return { duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const }
    case "checkpoint":
      return { duration: 1.25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const }
    case "error":
      return { duration: 0.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const }
    default:
      return { duration: 1.15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const }
  }
}

const getRowSweepAnimation = (kind: ThreadKind) => {
  switch (kind) {
    case "action":
      return { x: [0, 170, 0], opacity: [0.06, 0.18, 0.06] }
    case "checkpoint":
      return { y: [0, -2, 0], opacity: [0.06, 0.16, 0.06] }
    case "outcome":
      return { x: [0, 140, 0], opacity: [0.06, 0.14, 0.06] }
    case "warning":
      return { x: [0, 120, 0], opacity: [0.06, 0.14, 0.06] }
    case "error":
      return { x: [0, 80, 0], opacity: [0.06, 0.15, 0.06] }
    default:
      return { x: [0, 110, 0], opacity: [0.06, 0.14, 0.06] }
  }
}

const getLiveTextAnimation = (kind: ThreadKind) => {
  switch (kind) {
    case "action":
      return { opacity: [0.78, 1, 0.78], textShadow: ["0 0 0px rgba(217,70,239,0)", "0 0 10px rgba(217,70,239,0.28)", "0 0 0px rgba(217,70,239,0)"] }
    case "checkpoint":
      return { opacity: [0.8, 1, 0.8], textShadow: ["0 0 0px rgba(168,85,247,0)", "0 0 11px rgba(168,85,247,0.28)", "0 0 0px rgba(168,85,247,0)"] }
    case "outcome":
      return { opacity: [0.82, 1, 0.82], textShadow: ["0 0 0px rgba(16,185,129,0)", "0 0 9px rgba(16,185,129,0.3)", "0 0 0px rgba(16,185,129,0)"] }
    default:
      return { opacity: [0.8, 1, 0.8], textShadow: ["0 0 0px rgba(139,92,246,0)", "0 0 8px rgba(139,92,246,0.24)", "0 0 0px rgba(139,92,246,0)"] }
  }
}

type TypeBlurTextProps = {
  text: string
  className: string
  kind: ThreadKind
  isLatest: boolean
  live?: boolean
  lowPerf?: boolean
}

const TypeBlurText = ({ text, className, kind, isLatest, live = false, lowPerf = false }: TypeBlurTextProps) => {
  const blurStart = lowPerf ? "blur(6px)" : "blur(8px)"
  const segments =
    lowPerf || text.length > 110
      ? text.split(/(\s+)/).filter((segment) => segment.length > 0)
      : Array.from(text)

  const maxIndex = Math.max(segments.length - 1, 1)
  const maxDelay = lowPerf ? 0.75 : 0.92

  return (
    <motion.p
      className={className}
      animate={
        isLatest && live
          ? lowPerf
            ? { opacity: [0.9, 1, 0.9] }
            : getLiveTextAnimation(kind)
          : { opacity: 1, textShadow: "0 0 0px rgba(0,0,0,0)" }
      }
      transition={isLatest && live ? { duration: lowPerf ? 2.8 : 2.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0.2 }}
    >
      {segments.map((segment, index) => (
        (() => {
          const progress = index / maxIndex
          const easedProgress = Math.pow(progress, 1.85)
          const charDelay = easedProgress * maxDelay

          return (
        <motion.span
          key={`${segment}-${index}`}
          className="inline-block"
          initial={isLatest ? { opacity: 0, filter: blurStart, y: 2 } : { opacity: 1, filter: "blur(0px)", y: 0 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          transition={
            isLatest
              ? {
                  delay: charDelay,
                  type: "spring",
                  stiffness: lowPerf ? 360 : 560,
                  damping: lowPerf ? 30 : 22,
                  mass: lowPerf ? 0.62 : 0.5,
                }
              : { duration: 0 }
          }
        >
          {segment === " " ? "\u00A0" : segment}
        </motion.span>
          )
        })()
      ))}
    </motion.p>
  )
}

const NODE_STAGE_META: Record<NodeLifecycleStage, { label: string; dotClass: string; textClass: string }> = {
  planned: {
    label: "Planned",
    dotClass: "bg-violet-300/80 dark:bg-violet-400/80",
    textClass: "text-violet-600 dark:text-violet-300",
  },
  researching: {
    label: "Researching",
    dotClass: "bg-purple-500/90 dark:bg-purple-400/90",
    textClass: "text-purple-700 dark:text-purple-300",
  },
  researched: {
    label: "Evidence ready",
    dotClass: "bg-fuchsia-500/90 dark:bg-fuchsia-400/90",
    textClass: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  ready: {
    label: "Node card ready",
    dotClass: "bg-emerald-500/90 dark:bg-emerald-400/90",
    textClass: "text-emerald-700 dark:text-emerald-300",
  },
}

const NODE_STAGE_ORDER: Record<NodeLifecycleStage, number> = {
  planned: 0,
  researching: 1,
  researched: 2,
  ready: 3,
}

const SEARCH_CALL_LIMIT_BY_TIER: Record<"FREE" | "PRO" | "PREMIUM", number> = {
  FREE: 6,
  PRO: 16,
  PREMIUM: 30,
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const summarizeActionDetail = (detail: string | undefined, query: string | null): string | undefined => {
  if (!detail) {
    return undefined
  }

  let cleaned = detail

  if (query) {
    const escapedQuery = escapeRegExp(query)
    cleaned = cleaned.replace(new RegExp(`"${escapedQuery}"`, "gi"), "")
    cleaned = cleaned.replace(new RegExp(escapedQuery, "gi"), "")
  }

  cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\(\s*\)/g, "").trim()

  if (!cleaned) {
    return undefined
  }

  return cleaned.length > 120 ? `${cleaned.slice(0, 120)}…` : cleaned
}

const getShowcaseKind = (event: AgentActivityEvent): string | null => {
  const payload = event.payload as { showcase?: { kind?: unknown } } | undefined
  const kind = payload?.showcase?.kind
  return typeof kind === "string" ? kind : null
}

const getShowcasePayload = (event: AgentActivityEvent): Record<string, unknown> | null => {
  const payload = event.payload as { showcase?: unknown } | undefined
  if (!payload?.showcase || typeof payload.showcase !== "object") {
    return null
  }

  return payload.showcase as Record<string, unknown>
}

const getEventQuery = (event: AgentActivityEvent): string | null => {
  const payload = event.payload as { query?: unknown } | undefined
  return typeof payload?.query === "string" ? payload.query : null
}

const getEventQueries = (event: AgentActivityEvent): string[] => {
  const payload = event.payload as { queries?: unknown } | undefined
  if (!Array.isArray(payload?.queries)) {
    return []
  }

  return payload.queries
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value, index, list) => list.findIndex((entry) => entry.toLowerCase() === value.toLowerCase()) === index)
}

const getEventContext = (event: AgentActivityEvent): { objective?: string; nextNodeLabels?: string[] } => {
  const payload = (event.payload ?? {}) as Record<string, unknown>
  const objective = typeof payload.objective === "string" ? payload.objective : undefined
  const nextNodeLabels = Array.isArray(payload.nextNodeLabels)
    ? payload.nextNodeLabels.filter((value): value is string => typeof value === "string").slice(0, 3)
    : undefined

  return {
    objective,
    nextNodeLabels,
  }
}

const toUserCentricLabel = (value: string): string => {
  const normalized = value.toLowerCase()

  if (
    normalized.includes("repair") ||
    normalized.includes("json") ||
    normalized.includes("recovery") ||
    normalized.includes("fallback")
  ) {
    return "Refining your roadmap"
  }

  return value
}

const toUserCentricDetail = (value: string | undefined): string | undefined => {
  if (!value) {
    return value
  }

  const normalized = value.toLowerCase()
  if (
    normalized.includes("json") ||
    normalized.includes("repair") ||
    normalized.includes("recovery") ||
    normalized.includes("schema") ||
    normalized.includes("fallback")
  ) {
    return "Polishing structure and quality so your roadmap stays clear, complete, and actionable."
  }

  return value
}

const toReadableStatusEntry = (title: string, detail: string): { badge: string; title: string; detail: string } => {
  if (title.startsWith("Pathway:")) {
    const pathwayName = title.replace(/^Pathway:\s*/i, "").trim()
    const startsAfter = detail.match(/starts after\s+([^,]+)/i)?.[1]?.trim()
    const endsAt = detail.match(/ends at\s+([^,]+)/i)?.[1]?.trim()
    const nodes = detail.match(/nodes\s*=\s*(\d+)/i)?.[1]?.trim()

    const readableRange = startsAfter && endsAt ? `${startsAfter} → ${endsAt}` : null
    const readableCount = nodes ? `${nodes} guided steps` : "multiple guided steps"

    return {
      badge: "Pathway",
      title: pathwayName,
      detail: readableRange
        ? `Covers ${readableCount} across this route (${readableRange}) to move you forward with a clear progression.`
        : `Covers ${readableCount} in a structured sequence to move you toward your goal.`,
    }
  }

  if (title.startsWith("Connection:")) {
    const transition = title.replace(/^Connection:\s*/i, "").trim().replace(/\s*→\s*/g, " to ")
    return {
      badge: "Transition",
      title: `Switch point: ${transition}`,
      detail: "This marks where one pathway can branch or merge into another for better flexibility.",
    }
  }

  return {
    badge: "Update",
    title: toUserCentricLabel(title),
    detail: toUserCentricDetail(detail) || detail,
  }
}

const toThreadEntry = (event: AgentActivityEvent): ThreadEntry => {
  const showcaseKind = getShowcaseKind(event)
  const query = getEventQuery(event)
  const eventContext = getEventContext(event)

  if (event.type === "error") {
    return {
      id: event.id,
      kind: "error",
      ...THREAD_META.error,
      badge: "Issue",
      title: toUserCentricLabel(event.title || "Agent failed"),
      detail: toUserCentricDetail(event.detail),
      ...eventContext,
    }
  }

  if (event.type === "complete") {
    return {
      id: event.id,
      kind: "outcome",
      ...THREAD_META.outcome,
      badge: "Done",
      title: toUserCentricLabel(event.title || "Roadmap complete"),
      detail: toUserCentricDetail(event.detail),
      ...eventContext,
    }
  }

  if (showcaseKind === "topology-repair") {
    return {
      id: event.id,
      kind: "warning",
      ...THREAD_META.warning,
      badge: "Warning",
      title: "Improving roadmap balance",
      detail: "Adjusting branching depth so your roadmap has stronger alternative paths.",
      ...eventContext,
    }
  }

  if (showcaseKind === "agent-thought") {
    return {
      id: event.id,
      kind: "thought",
      ...THREAD_META.thought,
      badge: "Agent thought",
      title: toUserCentricLabel(event.title || "Agent thought"),
      detail: event.detail,
      ...eventContext,
    }
  }

  if (event.type === "tool-call") {
    const queries = getEventQueries(event)
    return {
      id: event.id,
      kind: "action",
      ...THREAD_META.action,
      query: query ?? undefined,
      queries: queries.length > 0 ? queries : query ? [query] : undefined,
      title: "Web search",
      detail: summarizeActionDetail(event.detail, query),
      ...eventContext,
    }
  }

  if (event.type === "step") {
    return {
      id: event.id,
      kind: "checkpoint",
      ...THREAD_META.checkpoint,
      badge: "Checkpoint",
      title: toUserCentricLabel(event.title),
      detail: toUserCentricDetail(event.detail),
      ...eventContext,
    }
  }

  if (event.type === "status") {
    const readable = toReadableStatusEntry(event.title, event.detail)
    return {
      id: event.id,
      kind: "checkpoint",
      ...THREAD_META.checkpoint,
      badge: readable.badge,
      title: readable.title,
      detail: readable.detail,
      ...eventContext,
    }
  }

  return {
    id: event.id,
    kind: "thought",
    ...THREAD_META.thought,
    badge: "Insight",
    title: toUserCentricLabel(event.title),
    detail: toUserCentricDetail(event.detail),
    ...eventContext,
  }
}

const toFriendlyText = (event: AgentActivityEvent): string => {
  const showcaseKind = getShowcaseKind(event)
  if (showcaseKind === "topology-repair") {
    return `Branch quality check triggered — ${event.detail}`
  }

  return event.detail || event.title
}

const clampText = (value: string, max = 110): string => {
  const trimmed = value.trim()
  if (trimmed.length <= max) {
    return trimmed
  }
  return `${trimmed.slice(0, max).trim()}…`
}

const deriveRoadmapIntent = (activity: AgentActivityEvent[]): string => {
  const firstToolQuery = activity
    .filter((event) => event.type === "tool-call")
    .map((event) => getEventQuery(event))
    .find((query): query is string => Boolean(query && query.trim().length > 0))

  if (firstToolQuery) {
    const cleaned = firstToolQuery
      .replace(/["']/g, "")
      .replace(/\s+/g, " ")
      .trim()

    const chunks = cleaned
      .split(/,|;|\b(?:and|or)\b/gi)
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length >= 4)

    const phrase = (chunks.slice(0, 2).join(" and ") || cleaned).replace(/^(for|to)\s+/i, "")
    return clampText(`Roadmap is being crafted for ${phrase}.`, 120)
  }

  const firstAnalysis = activity.find((event) => event.type === "analysis")
  if (firstAnalysis?.detail) {
    return clampText(`Roadmap is being crafted around ${firstAnalysis.detail.toLowerCase()}`)
  }

  return "Roadmap is being crafted around your stated current state and desired outcome."
}

const toNodeLifecycleEntries = (activity: AgentActivityEvent[]): NodeLifecycleEntry[] => {
  const entries = new Map<string, NodeLifecycleEntry>()

  const appendUniqueLimited = (values: string[], next: string | undefined, limit = 3): string[] => {
    if (!next) {
      return values
    }

    const normalized = next.trim()
    if (!normalized) {
      return values
    }

    const filtered = values.filter((value) => value.toLowerCase() !== normalized.toLowerCase())
    return [...filtered, normalized].slice(-limit)
  }

  const upsert = (input: {
    id: string
    label: string
    stage: NodeLifecycleStage
    order?: number
    pathwayCount?: number
    referencesCount?: number
    searchIncrement?: number
    searchQuery?: string
    latestDetail?: string
    statusNote?: string
  }) => {
    const existing = entries.get(input.id)

    if (!existing) {
      entries.set(input.id, {
        id: input.id,
        label: input.label,
        stage: input.stage,
        order: input.order ?? entries.size,
        pathwayCount: input.pathwayCount,
        referencesCount: input.referencesCount,
        searchCount: input.searchIncrement ?? 0,
        searchQueries: input.searchQuery ? [input.searchQuery] : [],
        latestDetail: input.latestDetail,
        statusTrail: input.statusNote ? [input.statusNote] : [],
      })
      return
    }

    const shouldPromoteStage = NODE_STAGE_ORDER[input.stage] >= NODE_STAGE_ORDER[existing.stage]

    entries.set(input.id, {
      ...existing,
      label: input.label || existing.label,
      stage: shouldPromoteStage ? input.stage : existing.stage,
      order: Math.min(existing.order, input.order ?? existing.order),
      pathwayCount: input.pathwayCount ?? existing.pathwayCount,
      referencesCount: input.referencesCount ?? existing.referencesCount,
      searchCount: existing.searchCount + (input.searchIncrement ?? 0),
      searchQueries: appendUniqueLimited(existing.searchQueries, input.searchQuery, 4),
      latestDetail: input.latestDetail ?? existing.latestDetail,
      statusTrail: appendUniqueLimited(existing.statusTrail, input.statusNote, 2),
    })
  }

  activity.forEach((event) => {
    const showcase = getShowcasePayload(event)
    if (!showcase) {
      return
    }

    const kind = typeof showcase.kind === "string" ? showcase.kind : null
    if (!kind) {
      return
    }

    if (kind === "blueprint") {
      const nodes = Array.isArray(showcase.nodes) ? showcase.nodes : []
      nodes.forEach((node, index) => {
        if (!node || typeof node !== "object") {
          return
        }

        const entry = node as Record<string, unknown>
        const nodeId = typeof entry.id === "string" ? entry.id : null
        const nodeLabel = typeof entry.label === "string" ? entry.label : null
        if (!nodeId || !nodeLabel) {
          return
        }

        upsert({
          id: nodeId,
          label: nodeLabel,
          stage: "planned",
          order: index,
          pathwayCount: Array.isArray(entry.pathwayIds) ? entry.pathwayIds.length : undefined,
        })
      })
      return
    }

    if (kind === "node-research") {
      const nodeId = typeof showcase.nodeId === "string" ? showcase.nodeId : null
      const nodeLabel = typeof showcase.nodeLabel === "string" ? showcase.nodeLabel : null
      if (!nodeId || !nodeLabel) {
        return
      }

      const state = showcase.state === "researched" ? "researched" : "researching"
      const query = typeof showcase.query === "string" ? showcase.query : getEventQuery(event) ?? undefined
      const referencesCount = typeof showcase.referencesCount === "number" ? showcase.referencesCount : undefined
      upsert({
        id: nodeId,
        label: nodeLabel,
        stage: state,
        referencesCount,
        searchIncrement: event.type === "tool-call" ? 1 : 0,
        searchQuery: query,
        latestDetail: event.detail,
        statusNote: state === "researched" ? `Evidence gathered${referencesCount ? ` (${referencesCount})` : ""}` : "Research running",
      })
      return
    }

    if (kind === "node-card") {
      const nodeId = typeof showcase.nodeId === "string" ? showcase.nodeId : null
      const nodeLabel = typeof showcase.nodeLabel === "string" ? showcase.nodeLabel : null
      if (!nodeId || !nodeLabel) {
        return
      }

      upsert({
        id: nodeId,
        label: nodeLabel,
        stage: "ready",
        latestDetail: event.detail,
        statusNote: "Node card assembled",
      })
    }
  })

  return Array.from(entries.values()).sort((left, right) => {
    if (left.order !== right.order) {
      return left.order - right.order
    }
    return left.label.localeCompare(right.label)
  })
}

export default function LoadingAnimationPage({ activity = [] }: LoadingAnimationPageProps) {
  const { resolvedTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const isDark = resolvedTheme !== "light"
  const [nodeSidebarOpen, setNodeSidebarOpen] = useState(false)
  const [accountUsage, setAccountUsage] = useState<BillingUsageSnapshot | null>(null)
  const lowPerfDevice =
    prefersReducedMotion || (typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number" ? navigator.hardwareConcurrency <= 4 : false)
  const threadViewportRef = useRef<HTMLDivElement>(null)
  const latestStepAnchorRef = useRef<HTMLDivElement>(null)
  const seenThreadIdsRef = useRef<Set<string>>(new Set())
  const entryRevealRankRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    let mounted = true

    const fetchUsage = async () => {
      const response = await fetch("/api/billing/status")
      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as {
        planTier: "FREE" | "PRO" | "PREMIUM"
        planLabel: string
        usage: {
          monthlyGenerationUsed: number
          monthlyGenerationLimit: number
          monthlyGenerationRemaining: number
        }
      }

      if (!mounted) {
        return
      }

      setAccountUsage({
        planTier: payload.planTier,
        planLabel: payload.planLabel,
        monthlyGenerationUsed: payload.usage.monthlyGenerationUsed,
        monthlyGenerationLimit: payload.usage.monthlyGenerationLimit,
        monthlyGenerationRemaining: payload.usage.monthlyGenerationRemaining,
        maxSearchCalls: SEARCH_CALL_LIMIT_BY_TIER[payload.planTier],
      })
    }

    fetchUsage().catch(() => {})
    const timer = window.setInterval(() => {
      fetchUsage().catch(() => {})
    }, 8000)

    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])

  const { latestEvent, threadEntries, currentSearchQueries, currentThought, nodeLifecycle, roadmapIntent } = useMemo(() => {
    const visibleEvents = activity.filter((event) => event.type !== "tool-result")
    const latest = visibleEvents[visibleEvents.length - 1]
    const threads = visibleEvents.slice(-16).map((event) => toThreadEntry(event))
    const lifecycle = toNodeLifecycleEntries(activity)
    const intent = deriveRoadmapIntent(activity)
    const latestToolCall = [...activity].reverse().find((event) => event.type === "tool-call")
    const toolPayload = (latestToolCall?.payload ?? {}) as Record<string, unknown>
    const queries = Array.isArray(toolPayload.queries)
      ? toolPayload.queries.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : []
    const query = typeof toolPayload.query === "string" ? toolPayload.query : undefined
    const groupedQueries = queries.length > 0 ? queries : query ? [query] : []
    const thoughtSource = [...visibleEvents].reverse().find((event) => event.type === "analysis" || event.type === "step")
    const thought = thoughtSource ? toFriendlyText(thoughtSource) : "Preparing pathways, node strategy, and evidence collection."

    return {
      latestEvent: latest,
      threadEntries: threads,
      currentSearchQueries: groupedQueries,
      currentThought: thought,
      nodeLifecycle: lifecycle,
      roadmapIntent: intent,
    }
  }, [activity])

  const readyNodes = nodeLifecycle.filter((node) => node.stage === "ready").length
  const activeNodeId = [...nodeLifecycle].reverse().find((node) => node.stage === "researching")?.id
  const searchStepCount = threadEntries.filter((entry) => entry.kind === "action").length
  const liveSearchLimit = accountUsage?.maxSearchCalls ?? 0
  const liveSearchUsed = liveSearchLimit > 0 ? Math.min(searchStepCount, liveSearchLimit) : searchStepCount
  const liveSearchRemaining = Math.max(0, liveSearchLimit - liveSearchUsed)
  const generationUsed = accountUsage?.monthlyGenerationUsed ?? 0
  const generationLimit = accountUsage?.monthlyGenerationLimit ?? 0
  const generationRemaining = accountUsage?.monthlyGenerationRemaining ?? 0
  const generationProgress = generationLimit > 0 ? Math.min(generationUsed / generationLimit, 1) : 0
  const searchProgress = liveSearchLimit > 0 ? Math.min(liveSearchUsed / liveSearchLimit, 1) : 0

  const threadRevealRanks = useMemo(() => {
    const currentIds = threadEntries.map((entry) => entry.id)
    const currentIdSet = new Set(currentIds)
    const seen = seenThreadIdsRef.current
    const revealRanks = entryRevealRankRef.current

    let batchRank = 0
    currentIds.forEach((id) => {
      if (!seen.has(id)) {
        revealRanks.set(id, batchRank)
        batchRank += 1
      }
    })

    Array.from(revealRanks.keys()).forEach((id) => {
      if (!currentIdSet.has(id)) {
        revealRanks.delete(id)
      }
    })

    seenThreadIdsRef.current = currentIdSet

    return threadEntries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.id] = revealRanks.get(entry.id) ?? 0
      return acc
    }, {})
  }, [threadEntries])

  useEffect(() => {
    if (!threadViewportRef.current || !latestStepAnchorRef.current) {
      return
    }

    latestStepAnchorRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [threadEntries.length, latestEvent?.id])

  return (
    <div
      className={`fixed left-0 top-0 z-[51] h-screen w-full overflow-hidden ${
        isDark ? "bg-gray-950" : "bg-[radial-gradient(circle_at_50%_0%,#e0e7ff_0%,#f8fafc_42%,#eef2ff_100%)]"
      }`}
    >
      <div className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] grid-cols-1 items-stretch gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8">
        <section className="relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-violet-200/50 bg-white/80 p-5 shadow-2xl shadow-violet-900/10 backdrop-blur-xl dark:border-violet-300/20 dark:bg-neutral-950/55 dark:shadow-violet-950/40">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-10 top-10 h-36 w-36 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-500/20"
            animate={{ opacity: [0.2, 0.42, 0.2], x: [0, 10, 0], y: [0, -6, 0] }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-12 bottom-14 h-40 w-40 rounded-full bg-violet-300/15 blur-3xl dark:bg-violet-500/20"
            animate={{ opacity: [0.16, 0.34, 0.16], x: [0, -10, 0], y: [0, 8, 0] }}
            transition={{ duration: 9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-violet-200/70 pb-3 dark:border-violet-300/20">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Agent Research Thread</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Building your roadmap step by step</h2>
              <p className="mt-1 text-[13px] leading-snug text-slate-600 dark:text-slate-300">{roadmapIntent}</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {latestEvent?.timestamp ? new Date(latestEvent.timestamp).toLocaleTimeString() : "initializing"}
            </p>
          </div>

          <div className="mb-4 rounded-xl border border-violet-200/65 bg-white/55 px-3.5 py-2.5 backdrop-blur-md dark:border-violet-300/20 dark:bg-violet-500/5">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center rounded-full border border-violet-300/70 bg-violet-100/80 px-2 py-0.5 font-medium text-violet-700 dark:border-violet-300/30 dark:bg-violet-500/15 dark:text-violet-200">
                {accountUsage ? accountUsage.planLabel : "Loading plan..."}
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {accountUsage ? `${generationRemaining} generation credits left this month` : "Fetching account credits..."}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-violet-300/90 sm:inline-block" />
              <span className="text-slate-600 dark:text-slate-300">
                {liveSearchLimit > 0 ? `${liveSearchRemaining} research calls left in this run` : "Calculating run budget..."}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-violet-200/60 px-2.5 py-2 dark:border-violet-300/20">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Monthly generation credits</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {accountUsage ? `${generationUsed}/${generationLimit}` : "--"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-violet-100/80 dark:bg-violet-500/20">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 dark:from-violet-300 dark:via-purple-300 dark:to-fuchsia-300"
                    animate={{ width: `${Math.max(Math.round(generationProgress * 100), accountUsage ? 2 : 8)}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-violet-600/90 dark:text-violet-300/90">
                  {accountUsage ? `${generationRemaining} remaining` : "Loading..."}
                </p>
              </div>

              <div className="rounded-lg border border-fuchsia-200/60 px-2.5 py-2 dark:border-fuchsia-300/20">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                  <span>Live research calls</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {liveSearchLimit > 0 ? `${liveSearchUsed}/${liveSearchLimit}` : "--"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-fuchsia-100/80 dark:bg-fuchsia-500/20">
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-purple-500 dark:from-fuchsia-300 dark:via-violet-300 dark:to-purple-300"
                    animate={{ width: `${Math.max(Math.round(searchProgress * 100), liveSearchLimit > 0 ? 2 : 8)}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  />
                </div>
                <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-fuchsia-600/90 dark:text-fuchsia-300/90">
                  {accountUsage
                    ? `${liveSearchRemaining} left · ${accountUsage.planTier === "FREE" ? "Basic research depth" : "Advanced research depth"}`
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={latestEvent?.id || "fallback"}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mb-4 rounded-lg border border-violet-200/65 bg-gradient-to-r from-violet-50/85 via-white/40 to-fuchsia-50/50 px-3 py-2 backdrop-blur-md dark:border-violet-300/20 dark:from-violet-500/12 dark:via-violet-500/5 dark:to-fuchsia-500/10"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase tracking-[0.13em] text-violet-600 dark:text-violet-300">Current focus</p>
                {currentSearchQueries.length > 0 && (
                  <span className="rounded-full border border-violet-300/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.1em] text-violet-700 dark:border-violet-300/30 dark:text-violet-300">
                    {currentSearchQueries.length} live query{currentSearchQueries.length > 1 ? "ies" : ""}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[15px] font-medium leading-snug text-slate-900 dark:text-slate-100">{currentThought}</p>

              {currentSearchQueries.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {currentSearchQueries.slice(0, 3).map((query) => (
                    <span
                      key={query}
                      className="rounded-full border border-violet-200/80 bg-white/70 px-2 py-0.5 text-[11px] text-slate-700 dark:border-violet-300/20 dark:bg-violet-500/10 dark:text-slate-200"
                    >
                      {query}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[12px] text-slate-600 dark:text-slate-300/90">
                  {latestEvent?.title || "Initializing roadmap research..."}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          <div ref={threadViewportRef} className="relative min-h-0 flex-1 overflow-auto pr-1">
            <span className="absolute bottom-2 left-[6px] top-1 w-px bg-violet-200 dark:bg-violet-300/20" />

            <div className="space-y-2 pb-6">
              {threadEntries.map((entry, index) => (
                (() => {
                  const isLatest = index === threadEntries.length - 1
                  const revealRank = threadRevealRanks[entry.id] ?? 0
                  const markerClass =
                    entry.markerShape === "dot"
                      ? "rounded-full"
                      : entry.markerShape === "diamond"
                        ? "rounded-[2px] rotate-45"
                        : entry.markerShape === "square"
                          ? "rounded-[3px]"
                          : "rounded-full border-2 bg-transparent"

                  return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10, y: 6, filter: "blur(10px)" }}
                  animate={{ opacity: 1, x: 0, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.28, delay: Math.min(revealRank * 0.08, 0.28), ease: "easeOut" }}
                  className={`relative flex items-start gap-2 rounded-md px-1 py-0.5 backdrop-blur-[1px] ${THREAD_ROW_CLASS[entry.kind]}`}
                >
                  <motion.span
                    aria-hidden
                    className={`pointer-events-none absolute inset-y-[2px] -left-8 w-10 -skew-x-12 blur-md ${THREAD_GLOW_CLASS[entry.kind]}`}
                    animate={lowPerfDevice ? { opacity: isLatest ? [0.08, 0.16, 0.08] : [0.05, 0.1, 0.05] } : getRowSweepAnimation(entry.kind)}
                    transition={{ duration: lowPerfDevice ? 3.6 : isLatest ? 2.3 : 3.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  />

                  {isLatest && (
                    <motion.span
                      className={`absolute left-[-2px] top-[1px] z-0 h-5 w-5 rounded-full blur-[1px] ${THREAD_GLOW_CLASS[entry.kind]}`}
                      animate={{ scale: [1, 1.4, 1], opacity: [0.24, 0.52, 0.24] }}
                      transition={{ duration: lowPerfDevice ? 2.2 : 1.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                    />
                  )}

                  <motion.span
                    className={`relative z-10 mt-1.5 h-2.5 w-2.5 ${markerClass} ring-[1.5px] ring-white dark:ring-neutral-950 ${entry.dotClass}`}
                    animate={
                      isLatest
                        ? lowPerfDevice
                          ? { scale: [1, 1.12, 1], opacity: [0.88, 1, 0.88] }
                          : getLatestMarkerAnimation(entry.kind)
                        : { scale: 1, opacity: 1 }
                    }
                    transition={
                      isLatest
                        ? lowPerfDevice
                          ? { duration: 1.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
                          : getLatestMarkerTransition(entry.kind)
                        : { duration: 0.2 }
                    }
                  />

                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={`inline-flex h-4 w-4 items-center justify-center font-semibold ${entry.titleClass}`}>
                        {entry.kind === "action" ? (
                          <motion.span
                            animate={isLatest ? (lowPerfDevice ? { scale: [1, 1.04, 1] } : { rotate: [0, -8, 8, 0], scale: [1, 1.06, 1] }) : { rotate: 0, scale: 1 }}
                            transition={isLatest ? { duration: lowPerfDevice ? 1.6 : 0.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" } : { duration: 0.2 }}
                          >
                            <MagnifyingGlass size={13} weight="bold" className="text-fuchsia-600/90 dark:text-fuchsia-300/90" />
                          </motion.span>
                        ) : (
                          <span className="text-[12px]">{entry.icon}</span>
                        )}
                      </span>
                      <span className="uppercase tracking-[0.11em] text-slate-500/90 dark:text-slate-400">{entry.badge || entry.label}</span>
                      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    <motion.div
                      initial={{ opacity: 0.82, y: 4, filter: "blur(7px)" }}
                      animate={{ opacity: 1, filter: "blur(0px)" }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="mt-1 pl-0.5"
                    >
                      {entry.kind === "action" && (entry.queries?.length || entry.query) ? (
                        <>
                          <TypeBlurText
                            text={`Looking up web for: ${(entry.queries && entry.queries.length > 0 ? entry.queries : [entry.query as string]).join(" • ")}`}
                            className="text-[12px] italic leading-snug text-slate-500 dark:text-slate-400"
                            kind={entry.kind}
                            isLatest={isLatest}
                            live
                            lowPerf={lowPerfDevice}
                          />
                          {isLatest && (
                            <div className="mt-1.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-fuchsia-600/90 dark:text-fuchsia-300/90">
                              <div className="relative h-[6px] w-[74px] overflow-hidden rounded-full bg-gradient-to-r from-violet-500/20 via-fuchsia-500/25 to-purple-500/20 dark:from-violet-300/20 dark:via-fuchsia-300/25 dark:to-purple-300/20">
                                <motion.span
                                  className="absolute inset-y-0 left-[-35%] w-[40%] rounded-full bg-gradient-to-r from-transparent via-fuchsia-400/85 to-transparent dark:via-fuchsia-300/85"
                                  animate={lowPerfDevice ? { opacity: [0.25, 0.7, 0.25] } : { x: [0, 92, 0], opacity: [0.2, 0.95, 0.2] }}
                                  transition={{ duration: lowPerfDevice ? 2.4 : 1.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                />
                                <motion.span
                                  className="absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full bg-violet-500/80 blur-[1px] dark:bg-violet-300/80"
                                  animate={lowPerfDevice ? { opacity: [0.35, 0.9, 0.35], scale: [0.92, 1.02, 0.92] } : { x: [2, 64, 2], opacity: [0.35, 1, 0.35], scale: [0.9, 1.08, 0.9] }}
                                  transition={{ duration: lowPerfDevice ? 2.6 : 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <motion.span
                                  className="h-1.5 w-1.5 rounded-full bg-violet-500 dark:bg-violet-300"
                                  animate={{ y: [0, -2, 0], opacity: [0.35, 1, 0.35] }}
                                  transition={{ duration: lowPerfDevice ? 1.4 : 0.95, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 }}
                                />
                                <motion.span
                                  className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-300"
                                  animate={{ y: [0, -2, 0], opacity: [0.35, 1, 0.35] }}
                                  transition={{ duration: lowPerfDevice ? 1.4 : 0.95, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.15 }}
                                />
                                <motion.span
                                  className="h-1.5 w-1.5 rounded-full bg-purple-500 dark:bg-purple-300"
                                  animate={{ y: [0, -2, 0], opacity: [0.35, 1, 0.35] }}
                                  transition={{ duration: lowPerfDevice ? 1.4 : 0.95, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.3 }}
                                />
                              </div>

                              <motion.span
                                animate={{ opacity: [0.62, 1, 0.62], letterSpacing: ["0.1em", "0.12em", "0.1em"] }}
                                transition={{ duration: 1.9, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                              >
                                Scanning sources
                              </motion.span>
                            </div>
                          )}
                        </>
                      ) : (
                        <TypeBlurText
                          text={entry.title}
                          className={`text-[14px] font-semibold leading-snug ${entry.titleClass}`}
                          kind={entry.kind}
                          isLatest={isLatest}
                          live
                          lowPerf={lowPerfDevice}
                        />
                      )}
                      {entry.kind === "checkpoint" && isLatest && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-purple-700/90 dark:text-purple-300/90">
                          <motion.span
                            className="h-1.5 w-1.5 rounded-[2px] bg-purple-500 dark:bg-purple-300"
                            animate={{ rotate: [45, 45, 45], scale: [1, 1.35, 1], opacity: [0.45, 1, 0.45] }}
                            transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          />
                          <span>Checkpoint synchronized</span>
                        </div>
                      )}
                      {entry.detail ? (
                        <TypeBlurText
                          text={entry.detail}
                          className={`mt-0.5 text-[12px] leading-snug ${
                            entry.kind === "thought"
                              ? "text-slate-600 dark:text-slate-300"
                              : entry.kind === "warning"
                                ? "text-amber-700/90 dark:text-amber-300"
                                : entry.kind === "error"
                                  ? "text-rose-700/90 dark:text-rose-300"
                                  : entry.kind === "outcome"
                                    ? "text-emerald-700/90 dark:text-emerald-300"
                                    : entry.kind === "checkpoint"
                                      ? "text-purple-700/90 dark:text-purple-300"
                                    : "text-slate-600 dark:text-slate-300"
                          }`}
                          kind={entry.kind}
                          isLatest={isLatest}
                          lowPerf={lowPerfDevice}
                        />
                      ) : null}

                      {(entry.objective || (entry.nextNodeLabels && entry.nextNodeLabels.length > 0)) && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                          {entry.objective && <p className="leading-snug">Goal — {entry.objective}</p>}
                          {entry.nextNodeLabels && entry.nextNodeLabels.length > 0 && (
                            <p className="leading-snug">Next — {entry.nextNodeLabels.join(" • ")}</p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  </div>
                </motion.div>
                  )
                })()
              ))}
              <div ref={latestStepAnchorRef} className="h-1 w-full" />
            </div>
          </div>
        </section>

        <Sidebar open={nodeSidebarOpen} setOpen={setNodeSidebarOpen} animate={false}>
          <SidebarBody className="relative min-h-0 flex-col overflow-hidden p-4">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-10 top-10 h-32 w-32 rounded-full bg-violet-300/25 blur-3xl dark:bg-violet-500/20"
              animate={{ opacity: [0.2, 0.4, 0.2], x: [0, -8, 0], y: [0, 6, 0] }}
              transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />

            <>
              <p className="text-[11px] uppercase tracking-[0.16em] text-violet-600 dark:text-violet-300">Node Construction</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {nodeLifecycle.length > 0
                  ? `${readyNodes}/${nodeLifecycle.length} nodes ready`
                  : "Waiting for pathway blueprint..."}
              </p>

              <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
                {nodeLifecycle.length === 0 ? (
                  <div className="rounded-xl border border-violet-200/60 bg-violet-100/40 p-3 text-xs text-slate-600 dark:border-violet-300/20 dark:bg-violet-500/10 dark:text-slate-300">
                    The agent will populate this panel as soon as planned roadmap nodes are identified.
                  </div>
                ) : (
                  <div className="space-y-2 pb-2">
                    {nodeLifecycle.map((node, index) => {
                      const stageMeta = NODE_STAGE_META[node.stage]
                      const isActive = node.id === activeNodeId

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.22, delay: Math.min(index * 0.03, 0.2), ease: "easeOut" }}
                          className={`group relative overflow-hidden rounded-xl border px-3 py-2.5 backdrop-blur-md transition-colors ${
                            isActive
                              ? isDark
                                ? "border-violet-300/35 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                                : "border-violet-400/50 bg-violet-100/45 shadow-lg shadow-violet-500/10"
                              : "border-violet-200/60 bg-white/65 dark:border-violet-300/15 dark:bg-neutral-900/40"
                          }`}
                        >
                          <motion.span
                            aria-hidden
                            className={`pointer-events-none absolute inset-y-0 -left-10 w-16 -skew-x-12 blur-md ${
                              isActive ? "bg-violet-300/15 dark:bg-violet-300/12" : "bg-violet-200/20 dark:bg-violet-400/10"
                            }`}
                            animate={{ x: [0, 150, 0], opacity: isActive ? [0.08, 0.2, 0.08] : [0.06, 0.14, 0.06] }}
                            transition={{ duration: isActive ? 3.4 : 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          />

                            <div className="flex items-start gap-2.5">
                              <span
                                className={`mt-[3px] inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ring-violet-200/70 dark:ring-violet-300/20 ${stageMeta.dotClass}`}
                              >
                                {node.stage === "ready" ? (
                                  <CheckCircle size={13} weight="fill" className="text-white" />
                                ) : node.stage === "researching" ? (
                                  <CircleNotch size={12} weight="bold" className="animate-spin text-white" />
                                ) : node.stage === "researched" ? (
                                  <CheckCircle size={12} weight="bold" className="text-white" />
                                ) : (
                                  <Circle size={11} weight="bold" className="text-white" />
                                )}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{node.label}</p>
                                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
                                  <span className={`font-medium ${stageMeta.textClass}`}>{stageMeta.label}</span>
                                  {node.searchCount > 0 && (
                                    <span className="text-slate-500 dark:text-slate-400">{node.searchCount} searches</span>
                                  )}
                                  {typeof node.pathwayCount === "number" && node.pathwayCount > 0 && (
                                    <span className="text-slate-500 dark:text-slate-400">{node.pathwayCount} pathways</span>
                                  )}
                                  {typeof node.referencesCount === "number" && node.referencesCount > 0 && (
                                    <span className="text-slate-500 dark:text-slate-400">{node.referencesCount} references</span>
                                  )}
                                </div>

                                <div className="mt-1.5 max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-h-28 group-hover:opacity-100">
                                  {node.searchQueries.length > 0 && (
                                    <div className="rounded-lg border border-violet-200/60 bg-violet-50/55 px-2 py-1.5 dark:border-violet-300/20 dark:bg-violet-500/10">
                                      <p className="text-[10px] uppercase tracking-[0.12em] text-violet-600 dark:text-violet-300">Recent searches</p>
                                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300">
                                        {node.searchQueries.slice(-2).join(" • ")}
                                      </p>
                                    </div>
                                  )}

                                  {(node.latestDetail || node.statusTrail.length > 0) && (
                                    <p className="mt-1.5 line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300">
                                      {node.statusTrail.length > 0 ? `${node.statusTrail[node.statusTrail.length - 1]} — ` : ""}
                                      {node.latestDetail}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                You’re seeing live progress as each roadmap node is researched and assembled.
              </p>
            </>
          </SidebarBody>
        </Sidebar>
      </div>
    </div>
  )
}
