import { roadmapData } from "@/data"
import type { Edge, Node } from "reactflow"

export type AgentActivityEvent = {
  id: string
  type: "status" | "tool-call" | "tool-result" | "step" | "analysis" | "complete" | "error"
  title: string
  detail: string
  payload?: unknown
  timestamp: string
}

interface GenerateRoadmapDataProps {
  currentState: string
  desiredOutcome: string
  sampleData?: boolean
  customPrompt?: string | null
  theme: string | undefined
  onActivity?: (event: AgentActivityEvent) => void
}

interface GenerateRoadmapApiResponse {
  initialNodes: Node[]
  initialEdges: Edge[]
}

const toReactFlowSampleNodes = (nodes: unknown[]): Node[] =>
  nodes.map((entry, index) => {
    const node = entry as Node & { position?: { x: number; y: number } }

    return {
      ...node,
      position: node.position ?? { x: index * 260, y: 0 },
    }
  })

const parseSseEvent = (chunk: string) => {
  const lines = chunk.split("\n")
  let event = "message"
  const dataLines: string[] = []

  lines.forEach((line) => {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim()
      return
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim())
    }
  })

  const dataString = dataLines.join("\n")
  const data = dataString ? JSON.parse(dataString) : null

  return { event, data }
}

const toFriendlyAgentError = ({
  code,
  message,
  retryAfterSeconds,
}: {
  code?: string
  message?: string
  retryAfterSeconds?: number
}): string => {
  const normalizedCode = (code ?? "").toUpperCase()
  const retrySuffix = retryAfterSeconds ? ` Retry in ~${Math.ceil(retryAfterSeconds)}s.` : ""

  if (normalizedCode === "PLAN_LIMIT_REACHED") {
    return "You have reached this month's roadmap limit for your current plan. Upgrade to Pro plan or wait for the monthly reset."
  }

  if (normalizedCode === "GEMINI_RATE_LIMITED") {
    return `The AI service is busy right now.${retrySuffix || " Please retry shortly."}`
  }

  if (normalizedCode === "GEMINI_QUOTA_EXCEEDED") {
    return "Roadmap generation is temporarily unavailable due to backend AI quota limits. Please retry later."
  }

  return `${message || "Failed to generate roadmap"}${retrySuffix}`
}

const consumeSseRoadmapStream = async (
  response: Response,
  onActivity?: (event: AgentActivityEvent) => void,
): Promise<GenerateRoadmapApiResponse> => {
  if (!response.body) {
    throw new Error("Streaming response body is missing")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let finalPayload: GenerateRoadmapApiResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split("\n\n")
    buffer = chunks.pop() ?? ""

    chunks.forEach((chunk) => {
      const trimmed = chunk.trim()
      if (!trimmed) {
        return
      }

      const parsed = parseSseEvent(trimmed)
      if (parsed.event === "activity") {
        onActivity?.(parsed.data as AgentActivityEvent)
        return
      }

      if (parsed.event === "result") {
        finalPayload = parsed.data as GenerateRoadmapApiResponse
        return
      }

      if (parsed.event === "error") {
        const message = typeof parsed.data?.message === "string" ? parsed.data.message : "Agent failed to generate roadmap"
        const code = typeof parsed.data?.code === "string" ? parsed.data.code : undefined
        const retryAfterSeconds =
          typeof parsed.data?.retryAfterSeconds === "number" ? parsed.data.retryAfterSeconds : undefined

        if (code) {
          console.warn("[roadmap.generate] SSE error code", code)
        }

        throw new Error(
          toFriendlyAgentError({
            code,
            message,
            retryAfterSeconds,
          }),
        )
      }
    })
  }

  if (!finalPayload) {
    throw new Error("Roadmap stream ended without a final payload")
  }

  return finalPayload
}

export async function generateMindMapData({
  currentState,
  desiredOutcome,
  sampleData,
  customPrompt,
  theme,
  onActivity,
}: GenerateRoadmapDataProps): Promise<GenerateRoadmapApiResponse> {
  if (sampleData) {
    return {
      initialNodes: toReactFlowSampleNodes(roadmapData.initialNodes as unknown[]),
      initialEdges: roadmapData.initialEdges,
    }
  }

  const response = await fetch("/api/roadmap/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      currentState,
      desiredOutcome,
      customPrompt,
      theme,
    }),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { code?: string; error?: string; message?: string; retryAfterSeconds?: number }
      | null

    throw new Error(
      toFriendlyAgentError({
        code: payload?.code,
        message: payload?.error || payload?.message || "Failed to generate roadmap",
        retryAfterSeconds: payload?.retryAfterSeconds,
      }),
    )
  }

  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("text/event-stream")) {
    return consumeSseRoadmapStream(response, onActivity)
  }

  const payload = (await response.json()) as GenerateRoadmapApiResponse

  return {
    initialNodes: payload.initialNodes,
    initialEdges: payload.initialEdges,
  }
}
