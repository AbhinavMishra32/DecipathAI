import { NextRequest, NextResponse } from "next/server"
import { generateText, tool } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { GenerationStatus } from "@prisma/client"
import { z } from "zod"
import { AuthError, requireDbUser } from "@/lib/auth"
import { completeRoadmapGenerationRun, reserveRoadmapGenerationQuota } from "@/lib/entitlements"

export const runtime = "nodejs"
export const maxDuration = 300

type GenerateRoadmapRequest = {
  currentState?: string
  desiredOutcome?: string
  customPrompt?: string | null
  theme?: string | null
}

type NodeReference = {
  title: string
  url: string
  snippet: string
  relevance: string
}

type SuccessStory = {
  person: string
  achievement: string
  summary: string
  sourceUrl: string
  afterNode: string
}

type RoadmapNodeData = {
  label: string
  icon: string
  description: string
  detailedDescription: string
  timeEstimate: string
  nextSteps: string[]
  tasks: string[]
  references: NodeReference[]
  successStories: SuccessStory[]
}

type RoadmapNode = {
  id: string
  type: string
  data: RoadmapNodeData
}

type RoadmapEdge = {
  id: string
  source: string
  target: string
  type: string
  animated: boolean
  style: {
    stroke: string
    strokeWidth: number
  }
}

type RoadmapPayload = {
  aiNodes: RoadmapNode[]
  aiEdges: RoadmapEdge[]
}

type PathwayBlueprint = {
  id: string
  name: string
  focus: string
  startsAfterNodeId: string
  endsAtNodeId: string
  nodeIds: string[]
}

type PathwayConnection = {
  fromPathwayId: string
  toPathwayId: string
  afterNodeId: string
  reason: string
}

type PlannedNode = {
  id: string
  label: string
  pathwayIds: string[]
  researchQueries: string[]
}

type PathwayPlan = {
  summary: string
  pathways: PathwayBlueprint[]
  connections: PathwayConnection[]
  nodePlan: PlannedNode[]
}

const buildFallbackPathwayPlan = ({
  currentState,
  desiredOutcome,
}: {
  currentState: string
  desiredOutcome: string
}): PathwayPlan => {
  const foundationNodes = [
    "Clarify direction",
    "Map strengths and constraints",
    "Pick one high-impact lane",
    "Design 30-day execution sprint",
  ]

  const accelerationNodes = [
    "Build portfolio-grade proof",
    "Get expert feedback loops",
    "Expand leverage and visibility",
    "Convert momentum into outcomes",
  ]

  const toPlannedNode = (label: string, index: number, pathwayIds: string[]): PlannedNode => ({
    id: `node-${index + 1}`,
    label,
    pathwayIds,
    researchQueries: [
      `${desiredOutcome} ${label} framework`,
      `${label} practical checklist`,
      `${currentState} to ${desiredOutcome} ${label}`,
    ],
  })

  const laneA = foundationNodes.map((label, index) => toPlannedNode(label, index, ["path-foundation"]))
  const laneB = accelerationNodes.map((label, index) =>
    toPlannedNode(label, foundationNodes.length + index, ["path-acceleration"]),
  )

  return {
    summary: "Fallback pathway plan generated to keep roadmap synthesis running.",
    pathways: [
      {
        id: "path-foundation",
        name: "Foundation Path",
        focus: "Direction clarity and execution setup",
        startsAfterNodeId: "root",
        endsAtNodeId: "final",
        nodeIds: laneA.map((node) => node.id),
      },
      {
        id: "path-acceleration",
        name: "Acceleration Path",
        focus: "Proof-building and compounding outcomes",
        startsAfterNodeId: "root",
        endsAtNodeId: "final",
        nodeIds: laneB.map((node) => node.id),
      },
    ],
    connections: [
      {
        fromPathwayId: "path-foundation",
        toPathwayId: "path-acceleration",
        afterNodeId: laneA[2]?.id ?? "node-3",
        reason: "Shift from planning to high-leverage execution",
      },
    ],
    nodePlan: [...laneA, ...laneB],
  }
}

const normalizePathwayPlan = (rawPlan: unknown): PathwayPlan => {
  const record = (rawPlan ?? {}) as Record<string, unknown>
  const pathwaysRaw = Array.isArray(record.pathways) ? record.pathways : []
  const connectionsRaw = Array.isArray(record.connections) ? record.connections : []
  const nodePlanRaw = Array.isArray(record.nodePlan) ? record.nodePlan : []

  const pathways: PathwayBlueprint[] = pathwaysRaw
    .map((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>
      const id = safeString(item.id, `path-${index + 1}`)
      return {
        id,
        name: safeString(item.name, `Pathway ${index + 1}`),
        focus: safeString(item.focus, "General pathway"),
        startsAfterNodeId: safeString(item.startsAfterNodeId, "root"),
        endsAtNodeId: safeString(item.endsAtNodeId, "final"),
        nodeIds: safeStringArray(item.nodeIds).slice(0, 10),
      }
    })
    .filter((pathway) => pathway.id.length > 0)

  const connections: PathwayConnection[] = connectionsRaw
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>
      const fromPathwayId = safeString(item.fromPathwayId)
      const toPathwayId = safeString(item.toPathwayId)

      if (!fromPathwayId || !toPathwayId) {
        return null
      }

      return {
        fromPathwayId,
        toPathwayId,
        afterNodeId: safeString(item.afterNodeId, "unknown-node"),
        reason: safeString(item.reason, "Skill dependency"),
      }
    })
    .filter((entry): entry is PathwayConnection => Boolean(entry))

  const nodePlan: PlannedNode[] = nodePlanRaw
    .map((entry, index) => {
      const item = (entry ?? {}) as Record<string, unknown>
      const id = safeString(item.id, `node-${index + 1}`)
      return {
        id,
        label: safeString(item.label, `Node ${index + 1}`),
        pathwayIds: safeStringArray(item.pathwayIds).slice(0, 4),
        researchQueries: safeStringArray(item.researchQueries).slice(0, 4),
      }
    })
    .filter((entry) => entry.id.length > 0)

  if (pathways.length < 2) {
    throw new Error("Pathway planning output did not include enough pathways")
  }

  if (connections.length < 1) {
    throw new Error("Pathway planning output did not include pathway connections")
  }

  if (nodePlan.length < 8) {
    throw new Error("Pathway planning output did not include enough planned nodes")
  }

  return {
    summary: safeString(record.summary, "Multi-path roadmap strategy generated from web research."),
    pathways,
    connections,
    nodePlan,
  }
}

const evaluateRoadmapShape = (payload: RoadmapPayload) => {
  const outDegree = new Map<string, number>()
  const inDegree = new Map<string, number>()

  payload.aiEdges.forEach((edge) => {
    outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
  })

  const forkCount = Array.from(outDegree.values()).filter((count) => count >= 2).length
  const mergeCount = Array.from(inDegree.values()).filter((count) => count >= 2).length

  const rootNodeId = payload.aiNodes[0]?.id
  const terminalNodeId = payload.aiNodes[payload.aiNodes.length - 1]?.id
  let hasRootToTerminalPath = false

  if (rootNodeId && terminalNodeId) {
    const adjacency = new Map<string, string[]>()
    payload.aiEdges.forEach((edge) => {
      const neighbors = adjacency.get(edge.source) ?? []
      neighbors.push(edge.target)
      adjacency.set(edge.source, neighbors)
    })

    const visited = new Set<string>()
    const queue = [rootNodeId]

    while (queue.length > 0) {
      const node = queue.shift() as string
      if (node === terminalNodeId) {
        hasRootToTerminalPath = true
        break
      }

      if (visited.has(node)) {
        continue
      }

      visited.add(node)
      const neighbors = adjacency.get(node) ?? []
      neighbors.forEach((neighbor) => {
        if (!visited.has(neighbor)) {
          queue.push(neighbor)
        }
      })
    }
  }

  const passes = forkCount >= 2 && mergeCount >= 1 && hasRootToTerminalPath

  return {
    passes,
    forkCount,
    mergeCount,
    hasRootToTerminalPath,
  }
}

const tokenizeForMatch = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2)

const findBestPlannedNodeMatch = (plan: PathwayPlan, query: string): PlannedNode | null => {
  const queryTokens = tokenizeForMatch(query)
  if (queryTokens.length === 0) {
    return null
  }

  let bestNode: PlannedNode | null = null
  let bestScore = 0

  plan.nodePlan.forEach((node) => {
    const nodeText = `${node.label} ${node.researchQueries.join(" ")}`.toLowerCase()
    const score = queryTokens.reduce((total, token) => (nodeText.includes(token) ? total + 1 : total), 0)

    if (score > bestScore) {
      bestScore = score
      bestNode = node
    }
  })

  return bestScore >= 2 ? bestNode : null
}

type ActivityEventType = "status" | "tool-call" | "tool-result" | "step" | "analysis" | "complete" | "error"

type AgentActivityEvent = {
  id: string
  type: ActivityEventType
  title: string
  detail: string
  payload?: unknown
  timestamp: string
}

type TavilyApiResult = {
  title?: string
  url?: string
  content?: string
  score?: number
}

type TavilyApiResponse = {
  answer?: string
  results?: TavilyApiResult[]
}

type ClassifiedAgentError = {
  code: string
  userMessage: string
  retryAfterSeconds?: number
  rawMessage: string
}

const ICONS = [
  "Briefcase",
  "Book",
  "Server",
  "Cloud",
  "Users",
  "School",
  "Building",
  "Chart",
  "Stethoscope",
  "Code",
  "Gavel",
  "Mic",
  "Paintbrush",
  "Calculator",
  "Tool",
  "Camera",
  "Cutlery",
  "Wrench",
  "Flask",
  "Music",
  "Globe",
  "DollarSign",
  "Airplane",
  "Tree",
  "Package",
  "Heart",
] as const

type LoggerLevel = "debug" | "info" | "warn" | "error"

const safeString = (value: unknown, fallback = ""): string =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback

const safeStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const containsFictionalMarker = (value: string): boolean =>
  /(fictional|hypothetical|imaginary|composite|placeholder|made\s*up|example\s+persona|sample\s+persona|anonymous\s+practitioner)/i.test(
    value,
  )

const toSourceDomain = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "trusted source"
  }
}

const isGenericTask = (task: string): boolean =>
  /(continue to the next milestone|execute this milestone|work on this step|do this step|learn about|practice regularly|gain experience)/i.test(
    task,
  )

const normalizeTasks = ({
  value,
  references,
  nodeLabel,
}: {
  value: unknown
  references: NodeReference[]
  nodeLabel: string
}): string[] => {
  const providedTasks = safeStringArray(value)
    .map((task) => task.replace(/\s+/g, " ").trim())
    .filter((task) => task.length >= 18 && !isGenericTask(task))

  if (providedTasks.length >= 3) {
    return providedTasks.slice(0, 6)
  }

  const fallbackTasks = references.slice(0, 4).map((reference) => {
    const sourceDomain = toSourceDomain(reference.url)
    const referenceTitle = safeString(reference.title, "source")
    return `Review ${referenceTitle} (${sourceDomain}) and produce one concrete deliverable for ${nodeLabel}.`
  })

  const merged = [...providedTasks, ...fallbackTasks]

  if (merged.length === 0) {
    return [
      `Draft a measurable execution plan for ${nodeLabel} with milestones, dependencies, and completion criteria.`,
      `Ship one concrete artifact for ${nodeLabel} and capture evidence of completion.`,
      `Run a review on outcomes for ${nodeLabel} and revise the plan based on gaps.`,
    ]
  }

  return merged.slice(0, 6)
}

const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error")

const preview = (value: string, maxLength = 120): string => {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength)}...`
}

const createRequestLogger = (requestId: string) => {
  const startedAt = Date.now()

  const log = (level: LoggerLevel, message: string, meta?: Record<string, unknown>) => {
    const prefix = `[roadmap.generate][${requestId}][+${Date.now() - startedAt}ms] ${message}`
    if (meta && Object.keys(meta).length > 0) {
      console[level](prefix, meta)
      return
    }

    console[level](prefix)
  }

  return {
    debug: (message: string, meta?: Record<string, unknown>) => log("debug", message, meta),
    info: (message: string, meta?: Record<string, unknown>) => log("info", message, meta),
    warn: (message: string, meta?: Record<string, unknown>) => log("warn", message, meta),
    error: (message: string, meta?: Record<string, unknown>) => log("error", message, meta),
  }
}

const parseRetryAfterSeconds = (message: string): number | undefined => {
  const match = message.match(/Please retry in ([\d.]+)s\./i)
  if (!match?.[1]) {
    return undefined
  }

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : undefined
}

const PRIMARY_MODEL = "gemini-3-flash-preview"
const FALLBACK_MODEL = "gemini-2.5-flash"
const TAVILY_HTTP_TIMEOUT_MS = 4500

const hasThoughtSignatureError = (message: string): boolean => {
  const normalized = message.toLowerCase()
  return normalized.includes("thought_signature") || normalized.includes("thought signature")
}

const hasInvalidToolArgumentsError = (message: string): boolean => {
  const normalized = message.toLowerCase()
  return (
    normalized.includes("invalid arguments for tool") ||
    normalized.includes("type validation failed") ||
    normalized.includes("ai_invalidtoolargumentserror")
  )
}

const normalizeStepThoughtText = (value: string): string => {
  const trimmed = safeString(value)
  if (!trimmed) {
    return ""
  }

  const withoutFences = trimmed.replace(/```(?:json)?\s*[\s\S]*?```/gi, " ")
  const flattened = withoutFences.replace(/\s+/g, " ").trim()

  if (!flattened) {
    return ""
  }

  if (flattened.startsWith("{") || flattened.startsWith("[")) {
    return ""
  }

  return flattened
}

const buildAgentThoughtFromModelStep = ({
  phase,
  finishReason,
  text,
  toolCalls,
  toolResults,
}: {
  phase: string
  finishReason: string
  text: string
  toolCalls: number
  toolResults: number
}): { title: string; detail: string } => {
  const llmThought = normalizeStepThoughtText(text)

  if (llmThought.length > 0) {
    const firstSentence = llmThought.split(/(?<=[.!?])\s+/)[0] ?? llmThought
    return {
      title: preview(firstSentence, 72),
      detail: preview(llmThought, 460),
    }
  }

  const phaseLabel = phase.toLowerCase()
  const fallbackTitle = phaseLabel.includes("pathway") ? "Pathway reasoning in progress" : "Roadmap reasoning in progress"
  const finishNote = finishReason === "stop" ? "step reached a confidence checkpoint" : "step is still exploring options"

  return {
    title: fallbackTitle,
    detail: `${finishNote}; research actions: ${toolCalls}, evidence updates: ${toolResults}.`,
  }
}

const classifyAgentError = (rawMessage: string): ClassifiedAgentError => {
  const retryAfterSeconds = parseRetryAfterSeconds(rawMessage)
  const normalized = rawMessage.toLowerCase()

  if (
    normalized.includes("exceeded your current quota") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("free_tier")
  ) {
    return {
      code: "GEMINI_QUOTA_EXCEEDED",
      userMessage:
        "The AI service quota is currently exhausted. Please retry after quota refresh or update your AI billing setup.",
      retryAfterSeconds,
      rawMessage,
    }
  }

  if (normalized.includes("rate limit") || normalized.includes("429")) {
    return {
      code: "GEMINI_RATE_LIMITED",
      userMessage: "The AI service is rate-limiting requests right now. Please retry shortly.",
      retryAfterSeconds,
      rawMessage,
    }
  }

  if (
    normalized.includes("valid json object") &&
    !normalized.includes("pathway planning output did not include") &&
    !normalized.includes("structured output recovery failed")
  ) {
    return {
      code: "MODEL_INVALID_JSON",
      userMessage: "The model returned invalid JSON. Please retry.",
      rawMessage,
    }
  }

  if (hasThoughtSignatureError(rawMessage)) {
    return {
      code: "GEMINI_THOUGHT_SIGNATURE_ERROR",
      userMessage:
        "The research workflow hit an internal formatting issue. Automatic recovery was attempted, but this run still failed. Please retry.",
      rawMessage,
    }
  }

  if (hasInvalidToolArgumentsError(rawMessage)) {
    return {
      code: "INVALID_TOOL_ARGUMENTS",
      userMessage:
        "A web research step failed due to malformed lookup input. Automatic recovery was attempted, but this run still failed. Please retry.",
      rawMessage,
    }
  }

  return {
    code: "ROADMAP_GENERATION_FAILED",
    userMessage: "Roadmap generation failed unexpectedly. Please retry.",
    retryAfterSeconds,
    rawMessage,
  }
}

const normalizeReferences = (value: unknown): NodeReference[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const record = (entry ?? {}) as Record<string, unknown>
      const url = safeString(record.url)
      if (!url || !isHttpUrl(url)) {
        return null
      }

      return {
        title: safeString(record.title, "Reference"),
        url,
        snippet: safeString(record.snippet, "No summary available."),
        relevance: safeString(record.relevance, "Relevance not specified"),
      }
    })
    .filter((entry): entry is NodeReference => Boolean(entry))
}

const normalizeSuccessStories = (value: unknown): SuccessStory[] => {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      const record = (entry ?? {}) as Record<string, unknown>
      const sourceUrl = safeString(record.sourceUrl)
      const person = safeString(record.person)
      const achievement = safeString(record.achievement)
      const summary = safeString(record.summary)
      const afterNode = safeString(record.afterNode)
      const aggregateText = `${person} ${achievement} ${summary}`

      if (!sourceUrl || !isHttpUrl(sourceUrl)) {
        return null
      }

      if (!person || !achievement || !summary || !afterNode) {
        return null
      }

      if (containsFictionalMarker(aggregateText)) {
        return null
      }

      return {
        person,
        achievement,
        summary,
        sourceUrl,
        afterNode,
      }
    })
    .filter((entry): entry is SuccessStory => Boolean(entry))
}

const extractJsonObject = (input: string): string => {
  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced?.[1] ?? input
  const firstBrace = candidate.indexOf("{")
  const lastBrace = candidate.lastIndexOf("}")

  if (firstBrace < 0 || lastBrace < 0 || lastBrace <= firstBrace) {
    throw new Error("Model did not return a valid JSON object")
  }

  return candidate.slice(firstBrace, lastBrace + 1)
}

const normalizeRoadmapPayload = (rawPayload: unknown, theme: string | null): RoadmapPayload => {
  const payloadRecord = (rawPayload ?? {}) as Record<string, unknown>
  const rawNodes = Array.isArray(payloadRecord.aiNodes) ? payloadRecord.aiNodes : []
  const rawEdges = Array.isArray(payloadRecord.aiEdges) ? payloadRecord.aiEdges : []

  if (rawNodes.length === 0 && rawEdges.length === 0) {
    throw new Error("Generated roadmap payload is empty")
  }

  if (rawNodes.length === 0) {
    throw new Error("Generated roadmap payload is missing aiNodes")
  }

  if (rawEdges.length === 0) {
    throw new Error("Generated roadmap payload is missing aiEdges")
  }

  const normalizedNodes: RoadmapNode[] = rawNodes.map((entry, index) => {
    const nodeRecord = (entry ?? {}) as Record<string, unknown>
    const dataRecord = (nodeRecord.data ?? {}) as Record<string, unknown>
    const label = safeString(dataRecord.label, `Step ${index + 1}`)
    const chosenIcon = safeString(dataRecord.icon, "Briefcase")
    const icon = ICONS.includes(chosenIcon as (typeof ICONS)[number]) ? chosenIcon : "Briefcase"
    const references = normalizeReferences(dataRecord.references).slice(0, 6)
    const tasks = normalizeTasks({
      value: dataRecord.tasks,
      references,
      nodeLabel: label,
    })

    return {
      id: safeString(nodeRecord.id, `Step ${index + 1}`),
      type: "customNode",
      data: {
        label,
        icon,
        description: safeString(dataRecord.description, "No description provided."),
        detailedDescription: safeString(
          dataRecord.detailedDescription,
          "A deeper explanation was not generated for this step.",
        ),
        timeEstimate: safeString(dataRecord.timeEstimate, "Not specified"),
        nextSteps: (() => {
          const nextSteps = safeStringArray(dataRecord.nextSteps)
          return nextSteps.length > 0 ? nextSteps : ["Continue to the next milestone"]
        })(),
        tasks,
        references,
        successStories: normalizeSuccessStories(dataRecord.successStories).slice(0, 4),
      },
    }
  })

  const edgeStroke = theme === "dark" ? "rgb(205, 209, 255)" : "rgba(79, 70, 229, 0.62)"
  const normalizedEdges: RoadmapEdge[] = rawEdges
    .map((entry, index) => {
      const edgeRecord = (entry ?? {}) as Record<string, unknown>
      const styleRecord = (edgeRecord.style ?? {}) as Record<string, unknown>
      const strokeWidthRaw = styleRecord.strokeWidth
      const strokeWidthNumber =
        typeof strokeWidthRaw === "number" && Number.isFinite(strokeWidthRaw) ? strokeWidthRaw : 2
      const source = safeString(edgeRecord.source)
      const target = safeString(edgeRecord.target)

      if (!source || !target) {
        return null
      }

      return {
        id: safeString(edgeRecord.id, `edge-${index + 1}`),
        source,
        target,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: safeString(styleRecord.stroke, edgeStroke),
          strokeWidth: strokeWidthNumber,
        },
      }
    })
    .filter((edge): edge is RoadmapEdge => Boolean(edge))

  if (normalizedEdges.length === 0) {
    throw new Error("Generated roadmap does not contain valid edges")
  }

  return {
    aiNodes: normalizedNodes,
    aiEdges: normalizedEdges,
  }
}

const buildPathwayPlanningSystemPrompt = () => {
  return `You are Decipath's pathway architect.

Your goal is to design MULTIPLE viable pathways from current state to desired outcome using web evidence.

Hard requirements:
1. Use tavily_search tool multiple times before finalizing.
2. Start with 3 high-signal Tavily queries, then continue only if uncertainty remains.
3. Ensure your searches cover:
   - baseline foundations
   - at least 2 alternative specialization tracks
   - market demand and hiring expectations
   - realistic timelines and transition constraints
   - case studies / success stories
4. If evidence is already sufficient, stop tool use and finalize.
5. Return ONLY valid JSON.

Output JSON shape:
{
  "summary": "string",
  "pathways": [
    {
      "id": "string",
      "name": "string",
      "focus": "string",
      "startsAfterNodeId": "string",
      "endsAtNodeId": "string",
      "nodeIds": ["string"]
    }
  ],
  "connections": [
    {
      "fromPathwayId": "string",
      "toPathwayId": "string",
      "afterNodeId": "string",
      "reason": "string"
    }
  ],
  "nodePlan": [
    {
      "id": "string",
      "label": "string",
      "pathwayIds": ["string"],
      "researchQueries": ["string"]
    }
  ]
}

Topology requirements:
- Provide at least 2 meaningful pathways.
- Include at least 1 cross-pathway connection that specifies exactly after which node a path can merge/switch.
- nodePlan must contain 10-24 nodes total and be consistent with pathways + connections.`
}

const buildPathwayPlanningUserPrompt = ({
  currentState,
  desiredOutcome,
  customPrompt,
}: {
  currentState: string
  desiredOutcome: string
  customPrompt?: string | null
}) => {
  return `Design the multi-path strategy first.

Current state: ${currentState}
Desired outcome: ${desiredOutcome}
${customPrompt ? `Custom constraints: ${customPrompt}` : ""}

List each pathway and how pathways connect/switch after specific nodes.`
}

const buildRoadmapSystemPrompt = (theme: string | null, pathwayPlan: PathwayPlan) => {
  const edgeStroke = theme === "dark" ? "rgb(205, 209, 255)" : "rgba(79, 70, 229, 0.62)"

  return `You are Decipath's agentic research planner.

You MUST follow this precomputed pathway plan exactly for topology:
${JSON.stringify(pathwayPlan)}

Hard requirements:
1. Use tavily_search tool multiple times before writing the final roadmap.
2. Research the highest-impact or uncertain planned nodes first.
3. Continue researching additional nodes only when confidence is insufficient.
4. Keep branching and merges faithful to pathways + connections.
5. Never invent references. Every URL must come from Tavily tool results.
6. Never invent or fictionalize success stories. Do not use placeholders like "fictional", "hypothetical", "sample", "anonymous", or made-up personas.
7. Every successStories.sourceUrl must exactly match a real URL returned by Tavily tool calls in this run.
8. If evidence is already strong enough, finalize early instead of over-researching.
9. Return ONLY valid JSON. No markdown, no prose.

Output JSON shape:
{
  "aiNodes": [
    {
      "id": "string",
      "type": "customNode",
      "data": {
        "label": "string",
        "icon": "one of ${ICONS.join(", ")}",
        "description": "string",
        "detailedDescription": "string",
        "timeEstimate": "string",
        "nextSteps": ["string"],
        "tasks": ["string"],
        "references": [
          {
            "title": "string",
            "url": "https://...",
            "snippet": "string",
            "relevance": "string"
          }
        ],
        "successStories": [
          {
            "person": "string",
            "achievement": "string",
            "summary": "string",
            "sourceUrl": "https://...",
            "afterNode": "string"
          }
        ]
      }
    }
  ],
  "aiEdges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "type": "smoothstep",
      "animated": false,
      "style": {
        "stroke": "${edgeStroke}",
        "strokeWidth": 2
      }
    }
  ]
}

Roadmap quality rules:
- include 12-20 high-quality nodes
- include branching and converging pathways
- reflect the planned pathways and connection points from the provided pathway plan
- include at least 2 fork points (a node with 2+ outgoing edges)
- include at least 1 merge point (a node with 2+ incoming edges)
- each node must include 3-6 executable tasks
- each node's tasks must be concrete, source-grounded actions tied to collected evidence
- avoid generic filler tasks (e.g. "continue learning", "practice more")
- each node should include 2-4 references
- each non-root node should include at least 1 success story connected to a prior milestone via "afterNode"`
}

const buildRoadmapUserPrompt = ({
  currentState,
  desiredOutcome,
  customPrompt,
  pathwayPlan,
}: {
  currentState: string
  desiredOutcome: string
  customPrompt?: string | null
  pathwayPlan: PathwayPlan
}) => {
  return `Create the final roadmap from the pathway plan.

Current state: ${currentState}
Desired outcome: ${desiredOutcome}
${customPrompt ? `Custom constraints: ${customPrompt}` : ""}

Pathway summary: ${pathwayPlan.summary}

Research with web evidence and include concrete references + success stories per node.
If evidence is already sufficient for reliable decisions, finish early.`
}

const runTavilySearch = async ({
  apiKey,
  query,
  maxResults,
  searchDepth,
  log,
}: {
  apiKey: string
  query: string
  maxResults: number
  searchDepth: "basic" | "advanced"
  log: ReturnType<typeof createRequestLogger>
}) => {
  const startedAt = Date.now()
  log.debug("Tavily HTTP request started", { query, maxResults, searchDepth })

  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), TAVILY_HTTP_TIMEOUT_MS)
  let response: Response

  try {
    response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        max_results: maxResults,
        search_depth: searchDepth,
        include_answer: true,
        include_raw_content: false,
        include_images: false,
      }),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      log.warn("Tavily HTTP request timed out", {
        query,
        timeoutMs: TAVILY_HTTP_TIMEOUT_MS,
      })
      throw new Error(`Tavily search timed out after ${TAVILY_HTTP_TIMEOUT_MS}ms`)
    }

    throw error
  } finally {
    clearTimeout(timeoutHandle)
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "")
    log.error("Tavily HTTP request failed", {
      query,
      status: response.status,
      responsePreview: preview(bodyText, 300),
    })
    throw new Error(`Tavily search failed (${response.status}): ${bodyText || "no response body"}`)
  }

  const payload = (await response.json()) as TavilyApiResponse
  const normalizedResults: NodeReference[] = (payload.results ?? [])
    .map((entry) => {
      const url = safeString(entry.url)
      if (!url) {
        return null
      }

      return {
        title: safeString(entry.title, "Reference"),
        url,
        snippet: safeString(entry.content, "No snippet available.").slice(0, 320),
        relevance: typeof entry.score === "number" ? `score:${entry.score.toFixed(2)}` : "score:unknown",
      }
    })
    .filter((entry): entry is NodeReference => Boolean(entry))

  log.debug("Tavily HTTP request succeeded", {
    query,
    elapsedMs: Date.now() - startedAt,
    resultCount: normalizedResults.length,
    hasAnswer: Boolean(payload.answer),
  })

  return {
    answer: safeString(payload.answer),
    results: normalizedResults,
  }
}

const createActivityEvent = ({
  type,
  title,
  detail,
  payload,
}: {
  type: ActivityEventType
  title: string
  detail: string
  payload?: unknown
}): AgentActivityEvent => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type,
  title,
  detail,
  payload,
  timestamp: new Date().toISOString(),
})

const toSseChunk = (event: string, data: unknown) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID()
  const log = createRequestLogger(requestId)

  log.info("Incoming roadmap generation request", {
    method: request.method,
    path: request.nextUrl.pathname,
  })

  let dbUser: Awaited<ReturnType<typeof requireDbUser>>
  try {
    dbUser = await requireDbUser()
  } catch (error) {
    if (error instanceof AuthError) {
      log.warn("Unauthorized roadmap generation request")
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    log.error("Unexpected auth resolution failure", { error: getErrorMessage(error) })
    return NextResponse.json({ error: "Failed to resolve user identity" }, { status: 500 })
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  const tavilyApiKey = process.env.TAVILY_API_KEY

  if (!geminiApiKey) {
    log.error("Missing Gemini API key configuration")
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY or GOOGLE_API_KEY server environment variable" },
      { status: 500 },
    )
  }

  if (!tavilyApiKey) {
    log.error("Missing Tavily API key configuration")
    return NextResponse.json({ error: "Missing TAVILY_API_KEY server environment variable" }, { status: 500 })
  }

  let body: GenerateRoadmapRequest
  try {
    body = (await request.json()) as GenerateRoadmapRequest
    log.debug("Request JSON parsed", {
      hasCurrentState: typeof body.currentState === "string",
      hasDesiredOutcome: typeof body.desiredOutcome === "string",
      hasCustomPrompt: typeof body.customPrompt === "string" && body.customPrompt.trim().length > 0,
      theme: safeString(body.theme, "unset"),
    })
  } catch {
    log.warn("Request JSON parsing failed")
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const currentState = safeString(body.currentState)
  const desiredOutcome = safeString(body.desiredOutcome)
  const customPrompt = safeString(body.customPrompt)
  const theme = safeString(body.theme)

  if (!currentState || !desiredOutcome) {
    log.warn("Request validation failed: missing required fields", {
      currentStateLength: currentState.length,
      desiredOutcomeLength: desiredOutcome.length,
    })
    return NextResponse.json({ error: "currentState and desiredOutcome are required" }, { status: 400 })
  }

  log.info("Request validated", {
    currentStatePreview: preview(currentState),
    desiredOutcomePreview: preview(desiredOutcome),
    customPromptLength: customPrompt.length,
    theme: theme || "unset",
  })

  const quotaReservation = await reserveRoadmapGenerationQuota({
    userId: dbUser.id,
    requestId,
    currentStatePreview: preview(currentState, 180),
    desiredOutcomePreview: preview(desiredOutcome, 180),
  })

  if (!quotaReservation.ok) {
    log.warn("Roadmap generation request denied due to plan limits", {
      planTier: quotaReservation.entitlement.planTier,
      used: quotaReservation.entitlement.monthlyGenerationUsed,
      limit: quotaReservation.entitlement.monthlyGenerationLimit,
    })

    return NextResponse.json(
      {
        code: quotaReservation.code,
        error: quotaReservation.message,
        planLabel: quotaReservation.entitlement.planLabel,
        monthlyGenerationUsed: quotaReservation.entitlement.monthlyGenerationUsed,
        monthlyGenerationLimit: quotaReservation.entitlement.monthlyGenerationLimit,
      },
      { status: 429 },
    )
  }

  const entitlement = quotaReservation.entitlement
  const generationRunId = quotaReservation.generationRunId
  const limits = entitlement.limits
  const clampPathwaySteps = (candidate: number, fallback: number): number => {
    const safeCandidate = Number.isFinite(candidate) ? candidate : fallback
    return Math.max(1, Math.min(safeCandidate, limits.pathwayPlanningMaxSteps))
  }
  const clampRoadmapSteps = (candidate: number, fallback: number): number => {
    const safeCandidate = Number.isFinite(candidate) ? candidate : fallback
    return Math.max(1, Math.min(safeCandidate, limits.roadmapSynthesisMaxSteps))
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      log.info("SSE stream opened")

      const write = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(toSseChunk(event, data)))
        log.debug("SSE event emitted", { event })
      }

      const pushActivity = (event: AgentActivityEvent) => {
        log.debug("Agent activity", {
          type: event.type,
          title: event.title,
          detail: preview(event.detail, 180),
        })
        write("activity", event)
      }

      ;(async () => {
        const sourceRegistry = new Map<string, NodeReference>()
        const researchedNodeIds = new Set<string>()
        let stepCounter = 0
        let searchCallCount = 0

        try {
          const google = createGoogleGenerativeAI({ apiKey: geminiApiKey })
          log.info("Agent initialized", {
            model: PRIMARY_MODEL,
            fallbackModel: FALLBACK_MODEL,
            planTier: entitlement.planTier,
            pathwayPlanningMaxSteps: limits.pathwayPlanningMaxSteps,
            roadmapSynthesisMaxSteps: limits.roadmapSynthesisMaxSteps,
            maxSearchCalls: limits.maxSearchCalls,
            temperature: 0.2,
          })
          pushActivity(
            createActivityEvent({
              type: "status",
              title: "Agent initialized",
              detail: "Preparing objective decomposition and research plan.",
            }),
          )

          const modelStartedAt = Date.now()
          let activePathwayPlan: PathwayPlan | null = null

          const runGenerationPass = async ({
            modelId,
            phase,
            system,
            prompt,
            maxSteps,
            allowTools = true,
          }: {
            modelId: string
            phase: string
            system: string
            prompt: string
            maxSteps: number
            allowTools?: boolean
          }) => {
            let phaseStep = 0

            return generateText({
              model: google(modelId),
              maxSteps,
              maxRetries: 0,
              temperature: 0.2,
              system,
              prompt,
              tools: allowTools
                ? {
                    tavily_search: tool({
                      description:
                        "Search the web for factual evidence, references, implementation guides, and success stories relevant to roadmap planning.",
                      parameters: z
                        .object({
                          query: z.string().min(3).optional(),
                          queries: z.array(z.string().min(3)).min(1).optional(),
                          maxResults: z.number().int().min(1).optional().default(3),
                          searchDepth: z.enum(["basic", "advanced"]).catch("basic").default("basic"),
                        })
                        .refine((value) => Boolean(value.query || (value.queries && value.queries.length > 0)), {
                          message: "Either query or queries must be provided",
                        }),
                      execute: async ({ query, queries, maxResults, searchDepth }) => {
                        if (searchCallCount >= limits.maxSearchCalls) {
                          log.warn("Search call budget exhausted for this generation", {
                            phase,
                            searchCallCount,
                            maxSearchCalls: limits.maxSearchCalls,
                          })

                          pushActivity(
                            createActivityEvent({
                              type: "status",
                              title: "Web research budget reached",
                              detail: "Continuing with references already collected for this roadmap.",
                            }),
                          )

                          return {
                            query: safeString(query, `${phase} roadmap implementation evidence`),
                            queries: [],
                            answer: "",
                            results: [],
                          }
                        }

                        searchCallCount += 1
                        const safeMaxResults = Math.max(1, Math.min(limits.maxResultsPerQuery, maxResults ?? 3))
                        const normalizedQueries = [...(query ? [query] : []), ...(queries ?? [])]
                          .map((item) => safeString(item))
                          .filter((item) => item.length >= 3)
                          .filter((item, index, list) => list.findIndex((entry) => entry.toLowerCase() === item.toLowerCase()) === index)
                          .slice(0, limits.maxSubqueriesPerSearchCall)

                        const selectedQueries =
                          normalizedQueries.length > 0
                            ? normalizedQueries
                            : [`${phase} roadmap implementation evidence`]
                        const primaryQuery = selectedQueries[0]
                        const effectiveSearchDepth = limits.maxSearchDepth === "basic" ? "basic" : searchDepth

                        const matchedNode =
                          activePathwayPlan && phase.toLowerCase().includes("roadmap")
                            ? findBestPlannedNodeMatch(activePathwayPlan, primaryQuery)
                            : null

                        log.info("Tool call started: tavily_search", {
                          primaryQuery,
                          queryCount: selectedQueries.length,
                          maxResults: safeMaxResults,
                          searchDepth: effectiveSearchDepth,
                          phase,
                        })

                        pushActivity(
                          createActivityEvent({
                            type: "tool-call",
                            title:
                              matchedNode
                                ? `Researching node: ${matchedNode.label}`
                                : `Searching the web: ${preview(primaryQuery, 90)}`,
                            detail: matchedNode
                              ? `Finding high-quality sources for ${matchedNode.label}.`
                              : `${phase}: gathering relevant web references.`,
                            payload: {
                              query: primaryQuery,
                              queries: selectedQueries,
                              maxResults: safeMaxResults,
                              searchDepth: effectiveSearchDepth,
                              showcase: matchedNode
                                ? {
                                    kind: "node-research",
                                    nodeId: matchedNode.id,
                                    nodeLabel: matchedNode.label,
                                    query: primaryQuery,
                                    state: "researching",
                                  }
                                : undefined,
                            },
                          }),
                        )

                        const toolStartedAt = Date.now()
                        const aggregatedResults = new Map<string, NodeReference>()
                        const answerFragments: string[] = []

                        const subQueryResults = await Promise.allSettled(
                          selectedQueries.map(async (selectedQuery) => ({
                            selectedQuery,
                            searchPayload: await runTavilySearch({
                              apiKey: tavilyApiKey,
                              query: selectedQuery,
                              maxResults: safeMaxResults,
                              searchDepth: effectiveSearchDepth,
                              log,
                            }),
                          })),
                        )

                        subQueryResults.forEach((subQueryResult, index) => {
                          if (subQueryResult.status === "fulfilled") {
                            const { searchPayload } = subQueryResult.value

                            searchPayload.results.forEach((entry) => {
                              if (!sourceRegistry.has(entry.url)) {
                                sourceRegistry.set(entry.url, entry)
                              }

                              if (!aggregatedResults.has(entry.url)) {
                                aggregatedResults.set(entry.url, entry)
                              }
                            })

                            if (searchPayload.answer) {
                              answerFragments.push(searchPayload.answer)
                            }

                            return
                          }

                          log.warn("Sub-query failed inside tavily_search execution", {
                            phase,
                            query: selectedQueries[index],
                            error: getErrorMessage(subQueryResult.reason),
                          })
                        })

                        const mergedResults = Array.from(aggregatedResults.values())
                        const mergedAnswer = answerFragments.join("\n\n").trim()

                        log.info("Tool call finished: tavily_search", {
                          primaryQuery,
                          queryCount: selectedQueries.length,
                          phase,
                          elapsedMs: Date.now() - toolStartedAt,
                          resultCount: mergedResults.length,
                          sourceRegistrySize: sourceRegistry.size,
                        })

                        pushActivity(
                          createActivityEvent({
                            type: "tool-result",
                            title: `Web search complete: ${preview(primaryQuery, 90)}`,
                            detail: `(${phase}) Retrieved ${mergedResults.length} references across ${selectedQueries.length} lookup${
                              selectedQueries.length > 1 ? "s" : ""
                            }.`,
                            payload: {
                              query: primaryQuery,
                              queries: selectedQueries,
                              answer: mergedAnswer,
                              topResults: mergedResults.slice(0, 4),
                              showcase: matchedNode
                                ? {
                                    kind: "node-research",
                                    nodeId: matchedNode.id,
                                    nodeLabel: matchedNode.label,
                                    query: primaryQuery,
                                    state: "researched",
                                    referencesCount: mergedResults.length,
                                  }
                                : undefined,
                            },
                          }),
                        )

                        if (matchedNode) {
                          researchedNodeIds.add(matchedNode.id)
                        }

                        return {
                          query: primaryQuery,
                          queries: selectedQueries,
                          answer: mergedAnswer,
                          results: mergedResults,
                        }
                      },
                    }),
                  }
                : undefined,
              onStepFinish: ({ finishReason, text, toolCalls, toolResults }) => {
                stepCounter += 1
                phaseStep += 1
                const normalizedFinishReason = String(finishReason)
                const callCount = Array.isArray(toolCalls) ? toolCalls.length : 0
                const resultCount = Array.isArray(toolResults) ? toolResults.length : 0
                const objective = `from ${preview(currentState, 60)} to ${preview(desiredOutcome, 60)}`
                const nextNodeLabels = (activePathwayPlan?.nodePlan ?? [])
                  .filter((node) => !researchedNodeIds.has(node.id))
                  .slice(0, 3)
                  .map((node) => node.label)

                log.info("Model step finished", {
                  phase,
                  globalStep: stepCounter,
                  phaseStep,
                  finishReason: normalizedFinishReason,
                  toolCalls: callCount,
                  toolResults: resultCount,
                  textPreview: preview(safeString(text), 200),
                })

                pushActivity(
                  createActivityEvent({
                    type: normalizedFinishReason === "stop" ? "analysis" : "step",
                    title:
                      normalizedFinishReason === "stop"
                        ? `${phase}: confidence checkpoint reached`
                        : `${phase}: expanding evidence`,
                    detail:
                      normalizedFinishReason === "stop"
                        ? `Checkpoint reached with enough confidence. Keeping focus ${objective} and moving to the next roadmap decision.`
                        : `Exploring alternatives while keeping focus ${objective}.`,
                    payload: {
                      finishReason: normalizedFinishReason,
                      toolCalls: callCount,
                      toolResults: resultCount,
                      preview: safeString(text).slice(0, 260),
                      objective,
                      nextNodeLabels,
                    },
                  }),
                )

                pushActivity(
                  createActivityEvent({
                    ...(buildAgentThoughtFromModelStep({
                      phase,
                      finishReason: normalizedFinishReason,
                      text: safeString(text),
                      toolCalls: callCount,
                      toolResults: resultCount,
                    })),
                    type: "analysis",
                    payload: {
                      showcase: {
                        kind: "agent-thought",
                        phase,
                        step: phaseStep,
                      },
                      toolCalls: callCount,
                      toolResults: resultCount,
                      objective,
                      nextNodeLabels,
                    },
                  }),
                )
              },
            })
          }

          const runJsonFinalizationPass = async ({
            modelId,
            phase,
            system,
            prompt,
          }: {
            modelId: string
            phase: string
            system: string
            prompt: string
          }) => {
            log.warn("Primary pass returned empty text; running JSON finalization pass", {
              phase,
              modelId,
            })

            pushActivity(
              createActivityEvent({
                type: "status",
                title: "Finalizing structured output",
                detail: `(${phase}) Generating final JSON payload from gathered evidence.`,
              }),
            )

            return generateText({
              model: google(modelId),
              maxSteps: 1,
              maxRetries: 0,
              temperature: 0,
              system: `${system}\n\nFinalization mode:\n- Return exactly one valid JSON object.\n- Do not call tools.\n- Do not include markdown fences or prose.`,
              prompt: `${prompt}\n\nReturn the final JSON object now.`,
            })
          }

          const executeWithFallback = async ({
            phase,
            system,
            prompt,
            maxSteps,
          }: {
            phase: string
            system: string
            prompt: string
            maxSteps: number
          }) => {
            let selectedModel = PRIMARY_MODEL
            let usedFallbackModel = false

            const ensureTextResult = async <TResult extends { text: string }>(
              modelId: string,
              result: TResult,
            ): Promise<TResult> => {
              if (safeString(result.text).length > 0) {
                return result
              }

              const finalized = await runJsonFinalizationPass({
                modelId,
                phase,
                system,
                prompt,
              })

              if (safeString(finalized.text).length > 0) {
                return finalized as unknown as TResult
              }

              return result
            }

            try {
              const initialResult = await runGenerationPass({ modelId: selectedModel, phase, system, prompt, maxSteps })
              const result = await ensureTextResult(selectedModel, initialResult)
              return { result, selectedModel, usedFallbackModel }
            } catch (firstError) {
              const firstMessage = getErrorMessage(firstError)

              if (hasInvalidToolArgumentsError(firstMessage)) {
                log.warn("Invalid tool arguments encountered; retrying same phase with tool schema guardrails", {
                  phase,
                  model: selectedModel,
                  error: firstMessage,
                })

                pushActivity(
                  createActivityEvent({
                    type: "status",
                    title: "Retrying web lookup",
                    detail: `(${phase}) A web lookup input was malformed. Retrying this step with stricter formatting.`,
                    payload: {
                      model: selectedModel,
                      recoveryMode: "retry-tools",
                    },
                  }),
                )

                const toolRetryPrompt = `${prompt}

Tool input guardrails (mandatory):
- For tavily_search, pass either a single "query" string OR "queries" array.
- If using "queries", include at most ${limits.maxSubqueriesPerSearchCall} concise queries.
- Prefer one focused query when possible.`

                try {
                  const retryWithTools = await runGenerationPass({
                    modelId: selectedModel,
                    phase,
                    system,
                    prompt: toolRetryPrompt,
                    maxSteps: Math.max(2, Math.min(maxSteps, 6)),
                    allowTools: true,
                  })
                  const result = await ensureTextResult(selectedModel, retryWithTools)
                  return { result, selectedModel, usedFallbackModel }
                } catch (toolRetryError) {
                  const toolRetryMessage = getErrorMessage(toolRetryError)

                  if (selectedModel !== FALLBACK_MODEL) {
                    log.warn("Tool retry failed on primary model; retrying same step with fallback model", {
                      phase,
                      primaryModel: selectedModel,
                      fallbackModel: FALLBACK_MODEL,
                      error: toolRetryMessage,
                    })

                    pushActivity(
                      createActivityEvent({
                        type: "status",
                        title: "Trying alternative model",
                        detail: `(${phase}) Re-running this lookup step with a backup model for better recovery.`,
                        payload: {
                          fromModel: selectedModel,
                          toModel: FALLBACK_MODEL,
                          recoveryMode: "retry-tools-fallback-model",
                        },
                      }),
                    )

                    usedFallbackModel = true
                    selectedModel = FALLBACK_MODEL

                    try {
                      const fallbackToolRetry = await runGenerationPass({
                        modelId: selectedModel,
                        phase,
                        system,
                        prompt: toolRetryPrompt,
                        maxSteps: Math.max(2, Math.min(maxSteps, 6)),
                        allowTools: true,
                      })
                      const result = await ensureTextResult(selectedModel, fallbackToolRetry)
                      return { result, selectedModel, usedFallbackModel }
                    } catch (fallbackToolRetryError) {
                      log.warn("Fallback model tool retry failed; switching to no-tool synthesis mode", {
                        phase,
                        model: selectedModel,
                        error: getErrorMessage(fallbackToolRetryError),
                      })
                    }
                  }
                }

                pushActivity(
                  createActivityEvent({
                    type: "status",
                    title: "Continuing without extra lookup",
                    detail: `(${phase}) Web lookup kept failing format checks. Continuing this step with the evidence already collected.`,
                    payload: {
                      model: selectedModel,
                      recoveryMode: "no-tools",
                    },
                  }),
                )

                const recoveryResult = await runGenerationPass({
                  modelId: selectedModel,
                  phase,
                  system,
                  prompt: `${prompt}\n\nRecovery mode:\n- Do not call any tools.\n- Use evidence already gathered in context.\n- Return the strongest possible draft for this phase.`,
                  maxSteps: Math.max(2, Math.min(maxSteps, 6)),
                  allowTools: false,
                })
                const result = await ensureTextResult(selectedModel, recoveryResult)
                return { result, selectedModel, usedFallbackModel }
              }

              if (selectedModel !== FALLBACK_MODEL && hasThoughtSignatureError(firstMessage)) {
                usedFallbackModel = true
                selectedModel = FALLBACK_MODEL

                log.warn("Primary model failed with thought signature validation; retrying with fallback model", {
                  phase,
                  primaryModel: PRIMARY_MODEL,
                  fallbackModel: FALLBACK_MODEL,
                  error: firstMessage,
                })

                pushActivity(
                  createActivityEvent({
                    type: "status",
                    title: "Recovering automatically",
                    detail: `(${phase}) Retrying with a fallback model due to an internal formatting issue.`,
                    payload: {
                      fromModel: PRIMARY_MODEL,
                      toModel: FALLBACK_MODEL,
                    },
                  }),
                )

                const fallbackInitialResult = await runGenerationPass({ modelId: selectedModel, phase, system, prompt, maxSteps })
                const result = await ensureTextResult(selectedModel, fallbackInitialResult)
                return { result, selectedModel, usedFallbackModel }
              }

              throw firstError
            }
          }

          const parseWithJsonRecovery = async <T>({
            phase,
            system,
            basePrompt,
            initialPass,
            parse,
            maxRepairAttempts,
            repairMaxSteps,
          }: {
            phase: string
            system: string
            basePrompt: string
            initialPass: Awaited<ReturnType<typeof executeWithFallback>>
            parse: (rawText: string) => T
            maxRepairAttempts: number
            repairMaxSteps: number
          }): Promise<{ parsed: T; pass: Awaited<ReturnType<typeof executeWithFallback>> }> => {
            let latestPass = initialPass
            let lastError = "Model did not return a valid JSON object"

            for (let attempt = 0; attempt <= maxRepairAttempts; attempt += 1) {
              try {
                return {
                  parsed: parse(latestPass.result.text),
                  pass: latestPass,
                }
              } catch (parseError) {
                lastError = getErrorMessage(parseError)

                if (attempt === maxRepairAttempts) {
                  break
                }

                const retryLabel = `${attempt + 1}/${maxRepairAttempts}`
                log.warn("JSON parse failed; running recovery pass", {
                  phase,
                  retry: retryLabel,
                  error: lastError,
                  model: latestPass.selectedModel,
                })

                pushActivity(
                  createActivityEvent({
                    type: "status",
                    title: "Recovering JSON output",
                    detail: `(${phase}) Invalid JSON detected. Running structured regeneration (${retryLabel}).`,
                    payload: {
                      phase,
                      retry: attempt + 1,
                      maxRepairAttempts,
                      error: preview(lastError, 220),
                    },
                  }),
                )

                const repairPrompt = `${basePrompt}

Previous output could not be parsed as valid JSON:
${lastError}

Recovery constraints:
- Return exactly one valid JSON object.
- Do not include markdown fences or prose.
- Preserve all required schema fields and structure.
- If uncertain, output best-effort valid JSON matching the schema.`

                latestPass = await executeWithFallback({
                  phase: `${phase} (json recovery)`,
                  system,
                  prompt: repairPrompt,
                  maxSteps: repairMaxSteps,
                })
              }
            }

            throw new Error(`Structured output recovery failed: ${lastError}`)
          }

          pushActivity(
            createActivityEvent({
              type: "analysis",
              title: "Planning pathways",
              detail: "Researching and mapping all viable pathways before building nodes.",
            }),
          )

          const pathwayPlanningPrompt = buildPathwayPlanningUserPrompt({ currentState, desiredOutcome, customPrompt })
          const pathwayPlanningSystemPrompt = buildPathwayPlanningSystemPrompt()

          let pathwayPass = await executeWithFallback({
            phase: "Pathway planning",
            system: pathwayPlanningSystemPrompt,
            prompt: pathwayPlanningPrompt,
            maxSteps: clampPathwaySteps(limits.pathwayPlanningMaxSteps, 8),
          })

          let pathwayPlan: PathwayPlan
          try {
            const pathwayParsed = await parseWithJsonRecovery({
              phase: "Pathway planning",
              system: pathwayPlanningSystemPrompt,
              basePrompt: pathwayPlanningPrompt,
              initialPass: pathwayPass,
              parse: (rawText) => normalizePathwayPlan(JSON.parse(extractJsonObject(rawText))),
              maxRepairAttempts: 2,
              repairMaxSteps: clampPathwaySteps(5, limits.pathwayPlanningMaxSteps),
            })

            pathwayPass = pathwayParsed.pass
            pathwayPlan = pathwayParsed.parsed
          } catch (pathwayRecoveryError) {
            const recoveryMessage = getErrorMessage(pathwayRecoveryError)
            log.warn("Pathway planning recovery exhausted; using fallback pathway plan", {
              error: recoveryMessage,
            })

            pushActivity(
              createActivityEvent({
                type: "status",
                title: "Using resilient fallback planning",
                detail:
                  "Pathway planning output stayed unstable after retries. Continuing with a deterministic fallback pathway map.",
                payload: {
                  reason: preview(recoveryMessage, 220),
                },
              }),
            )

            pathwayPlan = buildFallbackPathwayPlan({ currentState, desiredOutcome })
          }

          activePathwayPlan = pathwayPlan

          pushActivity(
            createActivityEvent({
              type: "analysis",
              title: "Pathways identified",
              detail: `Found ${pathwayPlan.pathways.length} pathways and ${pathwayPlan.connections.length} cross-path connections.`,
              payload: {
                showcase: {
                  kind: "blueprint",
                  nodes: pathwayPlan.nodePlan.map((node) => ({
                    id: node.id,
                    label: node.label,
                    pathwayIds: node.pathwayIds,
                  })),
                },
              },
            }),
          )

          pathwayPlan.pathways.slice(0, 6).forEach((pathway) => {
            pushActivity(
              createActivityEvent({
                type: "status",
                title: `Pathway: ${pathway.name}`,
                detail: `Starts after ${pathway.startsAfterNodeId}, ends at ${pathway.endsAtNodeId}, nodes=${pathway.nodeIds.length}.`,
              }),
            )
          })

          pathwayPlan.connections.slice(0, 6).forEach((connection) => {
            pushActivity(
              createActivityEvent({
                type: "status",
                title: `Connection: ${connection.fromPathwayId} → ${connection.toPathwayId}`,
                detail: `Switch/merge after node ${connection.afterNodeId} (${connection.reason}).`,
              }),
            )
          })

          pushActivity(
            createActivityEvent({
              type: "analysis",
              title: "Researching planned nodes",
              detail: "Now researching each planned node and generating final roadmap structure.",
            }),
          )

          const roadmapSystemPrompt = buildRoadmapSystemPrompt(theme || null, pathwayPlan)
          const roadmapBasePrompt = buildRoadmapUserPrompt({
            currentState,
            desiredOutcome,
            customPrompt,
            pathwayPlan,
          })

          let roadmapPass = await executeWithFallback({
            phase: "Roadmap synthesis",
            system: roadmapSystemPrompt,
            prompt: roadmapBasePrompt,
            maxSteps: clampRoadmapSteps(limits.roadmapSynthesisMaxSteps, 9),
          })

          const parseNormalizedRoadmap = (rawText: string) =>
            normalizeRoadmapPayload(JSON.parse(extractJsonObject(rawText)), theme || null)

          let normalized: RoadmapPayload | null = null
          let normalizationMessage = ""

          for (let repairAttempt = 0; repairAttempt < 3; repairAttempt += 1) {
            try {
              normalized = parseNormalizedRoadmap(roadmapPass.result.text)
              normalizationMessage = ""
              break
            } catch (normalizationError) {
              normalizationMessage = getErrorMessage(normalizationError)

              if (repairAttempt === 2) {
                break
              }

              pushActivity(
                createActivityEvent({
                  type: "status",
                  title: "Repairing roadmap structure",
                  detail: `Roadmap JSON needs repair (${normalizationMessage}). Retrying with stricter graph constraints (${repairAttempt + 1}/2).`,
                }),
              )

              const repairPrompt = `${roadmapBasePrompt}

Your previous output could not be normalized: ${normalizationMessage}

Critical fixes:
- Return aiNodes and aiEdges arrays, both non-empty
- Ensure every edge source/target references existing node IDs from aiNodes
- Ensure there are at least 2 fork nodes and at least 1 merge node
- Keep pathway branches and merges from the supplied pathway plan
- Do not include markdown fences
- Return ONLY valid JSON`

              roadmapPass = await executeWithFallback({
                phase: "Roadmap synthesis (structure repair)",
                system: roadmapSystemPrompt,
                prompt: repairPrompt,
                maxSteps: clampRoadmapSteps(6, limits.roadmapSynthesisMaxSteps),
              })
            }
          }

          if (!normalized) {
            throw new Error(`Roadmap generation produced invalid graph JSON after retries: ${normalizationMessage}`)
          }

          let shape = evaluateRoadmapShape(normalized)
          let topologyGateRelaxed = false

          if (!shape.passes) {
            pushActivity(
              createActivityEvent({
                type: "analysis",
                title: "Topology quality gate triggered",
                detail: `Branch diversity is below target (forks ${shape.forkCount}/2, merges ${shape.mergeCount}/1). Running a directed regeneration pass to improve pathway variety.`,
                payload: {
                  showcase: {
                    kind: "topology-repair",
                    forkCount: shape.forkCount,
                    mergeCount: shape.mergeCount,
                    requiredForks: 2,
                    requiredMerges: 1,
                  },
                },
              }),
            )

            const strictPrompt = `${roadmapBasePrompt}

Validation feedback:
- Required forks >= 2 (got ${shape.forkCount})
- Required merges >= 1 (got ${shape.mergeCount})
- Must keep start-to-end reachability

Regenerate a better branched graph using web evidence via tools.`

            roadmapPass = await executeWithFallback({
              phase: "Roadmap synthesis (repair)",
              system: roadmapSystemPrompt,
              prompt: strictPrompt,
              maxSteps: clampRoadmapSteps(7, limits.roadmapSynthesisMaxSteps),
            })

            const strictParsed = await parseWithJsonRecovery({
              phase: "Roadmap synthesis (repair)",
              system: roadmapSystemPrompt,
              basePrompt: strictPrompt,
              initialPass: roadmapPass,
              parse: parseNormalizedRoadmap,
              maxRepairAttempts: 1,
              repairMaxSteps: clampRoadmapSteps(5, limits.roadmapSynthesisMaxSteps),
            })

            roadmapPass = strictParsed.pass
            normalized = strictParsed.parsed
            shape = evaluateRoadmapShape(normalized)

            if (!shape.passes) {
              pushActivity(
                createActivityEvent({
                  type: "analysis",
                  title: "Topology refinement retry",
                  detail: `Directed regeneration is still below target (forks ${shape.forkCount}/2, merges ${shape.mergeCount}/1). Running a final topology salvage pass.`,
                  payload: {
                    showcase: {
                      kind: "topology-repair",
                      stage: "salvage",
                      forkCount: shape.forkCount,
                      mergeCount: shape.mergeCount,
                      requiredForks: 2,
                      requiredMerges: 1,
                    },
                  },
                }),
              )

              const salvagePrompt = `${roadmapBasePrompt}

Topology constraints were not met in the previous draft.

Non-negotiable graph rules:
- forks >= 2
- merges >= 1
- keep root-to-terminal reachability
- keep pathway structure faithful to the supplied pathway plan
- do not reduce node quality (tasks, references, success stories)
- return ONLY valid JSON`

              try {
                const salvagePass = await executeWithFallback({
                  phase: "Roadmap synthesis (topology salvage)",
                  system: roadmapSystemPrompt,
                  prompt: salvagePrompt,
                  maxSteps: clampRoadmapSteps(6, limits.roadmapSynthesisMaxSteps),
                })

                const salvageParsed = await parseWithJsonRecovery({
                  phase: "Roadmap synthesis (topology salvage)",
                  system: roadmapSystemPrompt,
                  basePrompt: salvagePrompt,
                  initialPass: salvagePass,
                  parse: parseNormalizedRoadmap,
                  maxRepairAttempts: 1,
                  repairMaxSteps: clampRoadmapSteps(5, limits.roadmapSynthesisMaxSteps),
                })

                const salvagedPayload = salvageParsed.parsed
                const salvagedShape = evaluateRoadmapShape(salvagedPayload)

                const currentScore = shape.forkCount + shape.mergeCount
                const salvagedScore = salvagedShape.forkCount + salvagedShape.mergeCount

                if (salvagedShape.passes || salvagedScore >= currentScore) {
                  normalized = salvagedPayload
                  shape = salvagedShape
                  roadmapPass = salvageParsed.pass
                }
              } catch (salvageError) {
                log.warn("Topology salvage pass failed; continuing with best available graph", {
                  error: getErrorMessage(salvageError),
                  forkCount: shape.forkCount,
                  mergeCount: shape.mergeCount,
                })
              }

              if (!shape.passes) {
                topologyGateRelaxed = true
                pushActivity(
                  createActivityEvent({
                    type: "analysis",
                    title: "Using best available topology",
                    detail: `Proceeding with the strongest generated graph (forks=${shape.forkCount}, merges=${shape.mergeCount}) to avoid request failure.`,
                    payload: {
                      showcase: {
                        kind: "topology-repair",
                        stage: "relaxed-gate",
                        forkCount: shape.forkCount,
                        mergeCount: shape.mergeCount,
                        requiredForks: 2,
                        requiredMerges: 1,
                      },
                    },
                  }),
                )
              }
            }
          }

          log.info("Model generation finished", {
            elapsedMs: Date.now() - modelStartedAt,
            stepCount: stepCounter,
            sourceCount: sourceRegistry.size,
            pathwayModel: pathwayPass.selectedModel,
            pathwayUsedFallback: pathwayPass.usedFallbackModel,
            roadmapModel: roadmapPass.selectedModel,
            roadmapUsedFallback: roadmapPass.usedFallbackModel,
            roadmapForks: shape.forkCount,
            roadmapMerges: shape.mergeCount,
            topologyGateRelaxed,
          })

          pushActivity(
            createActivityEvent({
              type: "analysis",
              title: "Synthesizing roadmap",
              detail: "Converting researched evidence into roadmap nodes, references, and success stories.",
            }),
          )

          log.debug("Final roadmap payload ready after native pathway planning and node-level research", {
            nodeCount: normalized.aiNodes.length,
            edgeCount: normalized.aiEdges.length,
          })

          const trustedSourceUrls = new Set(Array.from(sourceRegistry.keys()))
          const fallbackReferences = Array.from(sourceRegistry.values()).slice(0, 3)
          const enrichedNodes = normalized.aiNodes.map((node) => {
            const trustedReferences = node.data.references.filter((reference) => trustedSourceUrls.has(reference.url))
            const trustedSuccessStories = node.data.successStories.filter(
              (story) =>
                trustedSourceUrls.has(story.sourceUrl) &&
                !containsFictionalMarker(`${story.person} ${story.achievement} ${story.summary}`),
            )

            const finalReferences =
              trustedReferences.length > 0
                ? trustedReferences
                : fallbackReferences.length > 0
                  ? fallbackReferences
                  : []

            if (
              finalReferences.length === node.data.references.length &&
              trustedSuccessStories.length === node.data.successStories.length
            ) {
              return node
            }

            return {
              ...node,
              data: {
                ...node.data,
                references: finalReferences,
                successStories: trustedSuccessStories,
              },
            }
          })

          enrichedNodes.forEach((node) => {
            pushActivity(
              createActivityEvent({
                type: "analysis",
                title: `Card ready: ${node.data.label}`,
                detail: "Node content synthesized with tasks, references, and supporting context.",
                payload: {
                  showcase: {
                    kind: "node-card",
                    nodeId: node.id,
                    nodeLabel: node.data.label,
                    state: "ready",
                  },
                },
              }),
            )
          })

          const nodesMissingReferences = enrichedNodes.filter((node) => node.data.references.length === 0).length
          const nodesWithSuccessStories = enrichedNodes.filter((node) => node.data.successStories.length > 0).length
          log.info("Roadmap normalization completed", {
            nodeCount: enrichedNodes.length,
            edgeCount: normalized.aiEdges.length,
            nodesMissingReferences,
            nodesWithSuccessStories,
            fallbackReferencesApplied: nodesMissingReferences > 0 ? fallbackReferences.length : 0,
          })

          pushActivity(
            createActivityEvent({
              type: "complete",
              title: "Roadmap ready",
              detail: `Generated ${enrichedNodes.length} nodes and ${normalized.aiEdges.length} edges.`,
              payload: { sourceCount: sourceRegistry.size },
            }),
          )

          await completeRoadmapGenerationRun({
            runId: generationRunId,
            status: GenerationStatus.SUCCEEDED,
            searchCallsUsed: searchCallCount,
          }).catch((trackingError) => {
            log.warn("Failed to mark generation run as succeeded", {
              generationRunId,
              error: getErrorMessage(trackingError),
            })
          })

          write("result", {
            initialNodes: enrichedNodes,
            initialEdges: normalized.aiEdges,
            sources: Array.from(sourceRegistry.values()),
          })
          write("done", { ok: true })
          log.info("Roadmap generation request completed successfully")
        } catch (error) {
          const message = getErrorMessage(error)
          const classified = classifyAgentError(message)

          log.error("Roadmap generation request failed", {
            code: classified.code,
            message: classified.userMessage,
            retryAfterSeconds: classified.retryAfterSeconds,
            rawMessage: classified.rawMessage,
            stack: error instanceof Error ? error.stack : undefined,
          })
          pushActivity(
            createActivityEvent({
              type: "error",
              title: "Agent failed",
              detail: classified.userMessage,
              payload: {
                code: classified.code,
                retryAfterSeconds: classified.retryAfterSeconds,
                rawMessage: classified.rawMessage,
              },
            }),
          )
          write("error", {
            code: classified.code,
            message: classified.userMessage,
            retryAfterSeconds: classified.retryAfterSeconds,
            rawMessage: classified.rawMessage,
          })

          await completeRoadmapGenerationRun({
            runId: generationRunId,
            status: GenerationStatus.FAILED,
            searchCallsUsed: searchCallCount,
            errorCode: classified.code,
            errorMessage: classified.userMessage,
          }).catch((trackingError) => {
            log.warn("Failed to mark generation run as failed", {
              generationRunId,
              error: getErrorMessage(trackingError),
            })
          })
        } finally {
          log.info("SSE stream closed")
          controller.close()
        }
      })()
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
