import { NextRequest, NextResponse } from "next/server"
import { generateText, tool } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

export const runtime = "nodejs"

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
        "Gemini quota exceeded for this API key/project. Add billing or use a key/project with active quota, then retry.",
      retryAfterSeconds,
      rawMessage,
    }
  }

  if (normalized.includes("rate limit") || normalized.includes("429")) {
    return {
      code: "GEMINI_RATE_LIMITED",
      userMessage: "Gemini rate limit hit. Please retry shortly.",
      retryAfterSeconds,
      rawMessage,
    }
  }

  if (normalized.includes("valid json object")) {
    return {
      code: "MODEL_INVALID_JSON",
      userMessage: "The model returned invalid JSON. Please retry.",
      rawMessage,
    }
  }

  return {
    code: "ROADMAP_GENERATION_FAILED",
    userMessage: rawMessage,
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
      if (!url) {
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

      if (!sourceUrl) {
        return null
      }

      return {
        person: safeString(record.person, "Anonymous practitioner"),
        achievement: safeString(record.achievement, "Reached measurable progress"),
        summary: safeString(record.summary, "Applied the same step sequence and achieved strong outcomes."),
        sourceUrl,
        afterNode: safeString(record.afterNode, "Previous milestone"),
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

  if (rawNodes.length === 0 || rawEdges.length === 0) {
    throw new Error("Generated roadmap payload is empty")
  }

  const normalizedNodes: RoadmapNode[] = rawNodes.map((entry, index) => {
    const nodeRecord = (entry ?? {}) as Record<string, unknown>
    const dataRecord = (nodeRecord.data ?? {}) as Record<string, unknown>
    const label = safeString(dataRecord.label, `Step ${index + 1}`)
    const chosenIcon = safeString(dataRecord.icon, "Briefcase")
    const icon = ICONS.includes(chosenIcon as (typeof ICONS)[number]) ? chosenIcon : "Briefcase"

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
        tasks: (() => {
          const tasks = safeStringArray(dataRecord.tasks)
          return tasks.length > 0 ? tasks : ["Execute this milestone with measurable output"]
        })(),
        references: normalizeReferences(dataRecord.references).slice(0, 6),
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

const buildSystemPrompt = (theme: string | null) => {
  const edgeStroke = theme === "dark" ? "rgb(205, 209, 255)" : "rgba(79, 70, 229, 0.62)"

  return `You are Decipath's agentic research planner.

Hard requirements:
1. Use tavily_search tool multiple times before writing the final roadmap.
2. Run at least 4 distinct Tavily queries covering:
   - foundational learning path
   - execution frameworks
   - real-world examples and case studies
   - role-specific / domain-specific best practices
3. Never invent references. Every URL must come from Tavily tool results.
4. Return ONLY valid JSON. No markdown, no prose.

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
- each node must include 3-6 executable tasks
- each node should include 2-4 references
- each non-root node should include at least 1 success story connected to a prior milestone via "afterNode"`
}

const buildUserPrompt = ({
  currentState,
  desiredOutcome,
  customPrompt,
}: {
  currentState: string
  desiredOutcome: string
  customPrompt?: string | null
}) => {
  return `Create a factual, research-backed roadmap.

Current state: ${currentState}
Desired outcome: ${desiredOutcome}
${customPrompt ? `Custom constraints: ${customPrompt}` : ""}

Use web evidence to justify node selection and include concrete references + success stories per node.`
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

  const response = await fetch("https://api.tavily.com/search", {
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
  })

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
        let stepCounter = 0

        try {
          const google = createGoogleGenerativeAI({ apiKey: geminiApiKey })
          log.info("Agent initialized", {
            model: "gemini-2.0-flash",
            maxSteps: 10,
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
          const result = await generateText({
            model: google("gemini-2.0-flash"),
            maxSteps: 10,
            maxRetries: 0,
            temperature: 0.2,
            system: buildSystemPrompt(theme || null),
            prompt: buildUserPrompt({ currentState, desiredOutcome, customPrompt }),
            tools: {
              tavily_search: tool({
                description:
                  "Search the web for factual evidence, references, implementation guides, and success stories relevant to roadmap planning.",
                parameters: z.object({
                  query: z.string().min(3),
                  maxResults: z.number().int().min(1).max(8).default(5),
                  searchDepth: z.enum(["basic", "advanced"]).default("advanced"),
                }),
                execute: async ({ query, maxResults, searchDepth }) => {
                  log.info("Tool call started: tavily_search", { query, maxResults, searchDepth })
                  pushActivity(
                    createActivityEvent({
                      type: "tool-call",
                      title: "Tavily search started",
                      detail: `Query: ${query}`,
                      payload: { query, maxResults, searchDepth },
                    }),
                  )

                  const toolStartedAt = Date.now()
                  const searchPayload = await runTavilySearch({
                    apiKey: tavilyApiKey,
                    query,
                    maxResults,
                    searchDepth,
                    log,
                  })

                  searchPayload.results.forEach((entry) => {
                    if (!sourceRegistry.has(entry.url)) {
                      sourceRegistry.set(entry.url, entry)
                    }
                  })

                  log.info("Tool call finished: tavily_search", {
                    query,
                    elapsedMs: Date.now() - toolStartedAt,
                    resultCount: searchPayload.results.length,
                    sourceRegistrySize: sourceRegistry.size,
                  })

                  pushActivity(
                    createActivityEvent({
                      type: "tool-result",
                      title: "Tavily search completed",
                      detail: `Retrieved ${searchPayload.results.length} references for "${query}".`,
                      payload: {
                        query,
                        answer: searchPayload.answer,
                        topResults: searchPayload.results.slice(0, 4),
                      },
                    }),
                  )

                  return {
                    query,
                    answer: searchPayload.answer,
                    results: searchPayload.results,
                  }
                },
              }),
            },
            onStepFinish: ({ finishReason, text, toolCalls, toolResults }) => {
              stepCounter += 1
              const callCount = Array.isArray(toolCalls) ? toolCalls.length : 0
              const resultCount = Array.isArray(toolResults) ? toolResults.length : 0
              log.info("Model step finished", {
                step: stepCounter,
                finishReason: String(finishReason),
                toolCalls: callCount,
                toolResults: resultCount,
                textPreview: preview(safeString(text), 200),
              })

              pushActivity(
                createActivityEvent({
                  type: "step",
                  title: `Reasoning step ${stepCounter} complete`,
                  detail: `finishReason=${String(finishReason)}; toolCalls=${callCount}; toolResults=${resultCount}`,
                  payload: {
                    preview: safeString(text).slice(0, 260),
                  },
                }),
              )
            },
          })

          log.info("Model generation finished", {
            elapsedMs: Date.now() - modelStartedAt,
            outputLength: result.text.length,
            stepCount: stepCounter,
            sourceCount: sourceRegistry.size,
          })

          pushActivity(
            createActivityEvent({
              type: "analysis",
              title: "Synthesizing roadmap",
              detail: "Converting researched evidence into roadmap nodes, references, and success stories.",
            }),
          )

          const jsonText = extractJsonObject(result.text)
          log.debug("Extracted JSON payload from model output", {
            jsonLength: jsonText.length,
          })

          const normalized = normalizeRoadmapPayload(JSON.parse(jsonText), theme || null)
          const fallbackReferences = Array.from(sourceRegistry.values()).slice(0, 3)
          const enrichedNodes = normalized.aiNodes.map((node) => {
            if (node.data.references.length > 0 || fallbackReferences.length === 0) {
              return node
            }

            return {
              ...node,
              data: {
                ...node.data,
                references: fallbackReferences,
              },
            }
          })

          const nodesMissingReferences = normalized.aiNodes.filter((node) => node.data.references.length === 0).length
          log.info("Roadmap normalization completed", {
            nodeCount: enrichedNodes.length,
            edgeCount: normalized.aiEdges.length,
            nodesMissingReferences,
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
