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
        const retryAfter =
          typeof parsed.data?.retryAfterSeconds === "number" ? Math.ceil(parsed.data.retryAfterSeconds) : undefined

        const formattedMessage = `${code ? `[${code}] ` : ""}${message}${retryAfter ? ` Retry in ~${retryAfter}s.` : ""}`
        throw new Error(formattedMessage)
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
      initialNodes: roadmapData.initialNodes,
      initialEdges: roadmapData.initialEdges,
    }
  }

  const schema = {
    type: SchemaType.OBJECT,
    properties: {
      aiNodes: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            type: { type: SchemaType.STRING },
            data: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                icon: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                detailedDescription: { type: SchemaType.STRING },
                timeEstimate: { type: SchemaType.STRING },
                nextSteps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
              },
              required: ["label", "icon", "description", "detailedDescription", "timeEstimate", "nextSteps", "tasks"]
            }
          },
          required: ["id", "type", "data"]
        }
      },
      aiEdges: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            source: { type: SchemaType.STRING },
            target: { type: SchemaType.STRING },
            type: { type: SchemaType.STRING },
            animated: { type: SchemaType.BOOLEAN },
            style: {
              type: SchemaType.OBJECT,
              properties: {
                stroke: { type: SchemaType.STRING },
                strokeWidth: { type: SchemaType.NUMBER }
              },
              required: ["stroke", "strokeWidth"]
            }
          },
          required: ["id", "source", "target", "type", "animated", "style"]
        }
      }
    },
    required: ["aiNodes", "aiEdges"]
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    safetySettings: safetySettings,
  });

  const prompt = `Generate a comprehensive and really detailed roadmap for anything that the user asks for based on the following inputs:
  Current situation / position of user: ${currentState}
  Desired Final Goal: ${desiredOutcome}

  1. A "Starting Point" node representing the current state 
  2. At least 10-15 roadmap paths.
  3. Nodes that connect to multiple other nodes
  4. Some paths that converge (e.g., different paths leading to a common advanced stage)
  5. A mix of linear progressions and branching options (have branching options at least 3 times)
  6. Keep the roadmap as detailed and up to date as possible, keep it detailed and more nodes and edges would be awesome, have alot of nodes, and have them connected in a way that makes sense.
  7. Also give 5-8 tasks for every node in order to achieve that path (node), the tasks should be realistic and should be able to be done by the user. the tasks should be exactly for that specific node only, e.g. if the node title is "Learn Python Basics" then the tasks should be 1. Watch a youtube video on python basics, 2. Create a simple python program yourself by the knowledge you gained from the video, 3. Study OOPS concepts in python, 4. Explore different libraries in python like pygame, etc. Start from the very basics and then move to the advanced level of that very node.
  8. The final node representing the desired outcome
  9. Make the roadmap tell in detail about anything the user asks for.
  10. Dont have the label and id CamelCase, use natural english words with spaces (label is the card / node label that tells details about the node as tags and what thing is happening in that node (something other than whats being told in the description))
  11. In detailedDescription provide a detailed description of the node, what it is about, what it does, what it is used for, etc.
  12. The roadmap should be really detailed.

  Requirements for nodes:
  - Unique string IDs (e.g., names of nodes in natural english)
  - type: 'customNode'
  - icon from this list:   
    Briefcase, Book, Server, Cloud, Users, School, Building, Chart, Stethoscope, Code, Gavel, Mic, Paintbrush, Calculator, Tool, Camera, Cutlery, Wrench, Flask, Music, Globe, DollarSign, Airplane, Tree, Package, Heart,
  - Meaningful and specific descriptions related to the chosen category (5-6 sentences).
  - Realistic timeEstimates
  - Relevant nextSteps array

  Requirements for edges:
  - Unique string IDs (e.g. names of nodes in natural english)
  - type: 'smoothstep'
  - animated: false
  - style with stroke: ${theme === "dark" ? "rgb(205, 209, 255)" : "rgba(155, 156, 247, 0.9)"} and strokeWidth: 2

  Ensure the mind map represents a realistic, diverse, and achievable  progression tailored to the provided inputs.
  ${customPrompt && ("This is a custom prompt that the user has given for this particular roadmap: " + customPrompt)}`;

  console.log("Prompt for generating mind map data:", prompt);

  // return {
  //   initialNodes: roadmapData.initialNodes,
  //   initialEdges: roadmapData.initialEdges,
  // }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const generatedData = JSON.parse(responseText);
    console.log("Generated mind map data:", generatedData);


    return {
      initialNodes: generatedData.aiNodes,
      initialEdges: generatedData.aiEdges,
    };
  } catch (error) {
    console.error("Error generating mind map data:", error);
    throw error;
  }
}