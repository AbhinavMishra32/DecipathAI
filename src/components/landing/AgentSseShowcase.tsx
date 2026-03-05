"use client"

import { useEffect, useMemo, useState } from "react"
import LoadingAnimationPage from "@/components/roadmap/LoadingAnimationPage"
import type { AgentActivityEvent } from "@/utils/aiUtils"

type ScriptedEvent = Omit<AgentActivityEvent, "id" | "timestamp">

const SCRIPT: ScriptedEvent[] = [
  {
    type: "status",
    title: "Agent initialized",
    detail: "Preparing objective decomposition and research plan.",
    payload: {
      showcase: {
        kind: "agent-thought",
      },
    },
  },
  {
    type: "status",
    title: "Roadmap blueprint drafted",
    detail: "Planning milestone lanes, dependencies, and parallel tracks.",
    payload: {
      showcase: {
        kind: "blueprint",
        nodes: [
          { id: "node-1", label: "Define target role", pathwayIds: ["path-foundation"] },
          { id: "node-2", label: "Gap analysis", pathwayIds: ["path-foundation"] },
          { id: "node-3", label: "Skill sprint", pathwayIds: ["path-acceleration"] },
          { id: "node-4", label: "Proof project", pathwayIds: ["path-acceleration", "path-execution"] },
          { id: "node-5", label: "Applications + interviews", pathwayIds: ["path-execution"] },
          { id: "node-6", label: "Weekly operating cadence", pathwayIds: ["path-execution"] },
        ],
      },
    },
  },
  {
    type: "tool-call",
    title: "Labor market scan",
    detail: "Benchmarking current analyst role expectations across hiring markets.",
    payload: {
      query: "entry level data analyst job descriptions SQL Tableau stakeholder communication",
      queries: [
        "entry level data analyst job descriptions SQL Tableau stakeholder communication",
        "data analyst hiring trends 2026 portfolio expectations",
        "junior data analyst interview process case study questions",
      ],
      objective: "Calibrate roadmap milestones to real hiring signals and screening patterns",
      nextNodeLabels: ["Define target role", "Gap analysis"],
      showcase: {
        kind: "node-research",
        nodeId: "node-1",
        nodeLabel: "Define target role",
        state: "researching",
        query: "entry level data analyst job descriptions SQL Tableau stakeholder communication",
      },
    },
  },
  {
    type: "step",
    title: "Role profile validated",
    detail: "Target role now anchored on SQL depth, BI storytelling, and business KPI fluency.",
    payload: {
      showcase: {
        kind: "node-research",
        nodeId: "node-1",
        nodeLabel: "Define target role",
        state: "researched",
        referencesCount: 8,
      },
    },
  },
  {
    type: "tool-call",
    title: "Web research",
    detail: "Collecting evidence for role transition timelines and hiring signals.",
    payload: {
      query: "data analyst roadmap 2026 hiring requirements",
      queries: [
        "data analyst roadmap 2026 hiring requirements",
        "entry level data analyst portfolio project examples",
      ],
      objective: "Build a realistic pathway from current skill baseline to first analyst offer",
      nextNodeLabels: ["Gap analysis", "Skill sprint"],
      showcase: {
        kind: "node-research",
        nodeId: "node-2",
        nodeLabel: "Gap analysis",
        state: "researching",
        query: "data analyst roadmap 2026 hiring requirements",
      },
    },
  },
  {
    type: "step",
    title: "Evidence synthesized",
    detail: "Prioritized SQL, BI tooling, and portfolio depth based on current market signals.",
    payload: {
      showcase: {
        kind: "node-research",
        nodeId: "node-2",
        nodeLabel: "Gap analysis",
        state: "researched",
        referencesCount: 6,
      },
    },
  },
  {
    type: "step",
    title: "Gap analysis node finalized",
    detail: "Baseline competencies mapped to learning backlog with measurable proficiency checkpoints.",
    payload: {
      showcase: {
        kind: "node-card",
        nodeId: "node-2",
        nodeLabel: "Gap analysis",
      },
    },
  },
  {
    type: "tool-call",
    title: "Learning path research",
    detail: "Comparing high-signal SQL and analytics curricula for sequencing and time-to-skill.",
    payload: {
      query: "best SQL analytics learning path project based 12 week curriculum",
      queries: [
        "best SQL analytics learning path project based 12 week curriculum",
        "tableau power bi learning sequence for analysts",
      ],
      objective: "Design a focused skill sprint with weekly outcomes and review milestones",
      nextNodeLabels: ["Skill sprint", "Proof project"],
      showcase: {
        kind: "node-research",
        nodeId: "node-3",
        nodeLabel: "Skill sprint",
        state: "researching",
        query: "best SQL analytics learning path project based 12 week curriculum",
      },
    },
  },
  {
    type: "step",
    title: "Skill sprint evidence locked",
    detail: "Sequenced sprint now balances SQL rigor, BI communication, and business framing drills.",
    payload: {
      showcase: {
        kind: "node-research",
        nodeId: "node-3",
        nodeLabel: "Skill sprint",
        state: "researched",
        referencesCount: 7,
      },
    },
  },
  {
    type: "step",
    title: "Skill sprint card generated",
    detail: "Node includes weekly deliverables, scorecards, and evidence checkpoints.",
    payload: {
      showcase: {
        kind: "node-card",
        nodeId: "node-3",
        nodeLabel: "Skill sprint",
      },
    },
  },
  {
    type: "tool-call",
    title: "Web search",
    detail: "Finding high-leverage project blueprints and interview prep frameworks.",
    payload: {
      query: "data analytics portfolio project ideas with business impact",
      objective: "Assemble execution-ready project milestones",
      nextNodeLabels: ["Proof project", "Applications + interviews"],
      showcase: {
        kind: "node-research",
        nodeId: "node-4",
        nodeLabel: "Proof project",
        state: "researching",
        query: "data analytics portfolio project ideas with business impact",
      },
    },
  },
  {
    type: "step",
    title: "Node card generated",
    detail: "Proof project node now includes deliverables, review checkpoints, and timeline.",
    payload: {
      showcase: {
        kind: "node-card",
        nodeId: "node-4",
        nodeLabel: "Proof project",
      },
    },
  },
  {
    type: "tool-call",
    title: "Interview loop research",
    detail: "Gathering interview frameworks, hiring manager rubrics, and communication playbooks.",
    payload: {
      query: "data analyst interview rubric sql case study stakeholder communication",
      queries: [
        "data analyst interview rubric sql case study stakeholder communication",
        "analytics case study presentation structure hiring manager",
      ],
      objective: "Create an applications and interview execution loop with measurable conversion targets",
      nextNodeLabels: ["Applications + interviews", "Weekly operating cadence"],
      showcase: {
        kind: "node-research",
        nodeId: "node-5",
        nodeLabel: "Applications + interviews",
        state: "researching",
        query: "data analyst interview rubric sql case study stakeholder communication",
      },
    },
  },
  {
    type: "step",
    title: "Interview loop synthesized",
    detail: "Defined pipeline targets, interview prep cadence, and post-application iteration cycle.",
    payload: {
      showcase: {
        kind: "node-research",
        nodeId: "node-5",
        nodeLabel: "Applications + interviews",
        state: "researched",
        referencesCount: 5,
      },
    },
  },
  {
    type: "step",
    title: "Execution cadence generated",
    detail: "Weekly operating rhythm now aligns deep work blocks with application and review cycles.",
    payload: {
      showcase: {
        kind: "node-card",
        nodeId: "node-6",
        nodeLabel: "Weekly operating cadence",
      },
    },
  },
  {
    type: "status",
    title: "Pathway quality check",
    detail: "Validating timeline feasibility, dependency ordering, and milestone load balancing.",
  },
  {
    type: "complete",
    title: "Roadmap complete",
    detail: "Research-backed pathway synthesis complete with actionable milestones, checkpoints, and execution rhythm.",
  },
]

const toActivityEvent = (event: ScriptedEvent, index: number): AgentActivityEvent => ({
  ...event,
  id: `landing-agent-${index}-${Date.now()}`,
  timestamp: new Date().toISOString(),
})

export default function AgentSseShowcase() {
  const initialEvent = useMemo(() => [toActivityEvent(SCRIPT[0], 0)], [])
  const [activity, setActivity] = useState<AgentActivityEvent[]>(initialEvent)

  useEffect(() => {
    let index = 1

    const interval = window.setInterval(() => {
      setActivity((prev) => {
        if (index >= SCRIPT.length) {
          index = 1
          return [toActivityEvent(SCRIPT[0], 0)]
        }

        const nextEvent = toActivityEvent(SCRIPT[index], index)
        index += 1
        return [...prev.slice(-27), nextEvent]
      })
    }, 1400)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <div className="relative">
      <div className="absolute left-4 top-4 z-20 rounded-full border border-emerald-300/60 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-300/30 dark:text-emerald-200">
        Live agent activity stream
      </div>
      <LoadingAnimationPage embedded activity={activity} />
    </div>
  )
}
