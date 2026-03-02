"use client";

import { useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
} from "reactflow";
import { useTheme } from "next-themes";
import "reactflow/dist/style.css";

import CustomNode from "@/components/roadmap/custom-node";
import { getLandingRoadmap, type LandingRoadmapData } from "@/actions/landing-roadmap";

const nodeTypes = { customNode: CustomNode };

const REVEAL_DELAY_MS = 460;

/* ── Fallback demo data (used when no roadmap is found in DB) ── */

const fallbackNodes: Node[] = [
  {
    id: "current",
    type: "customNode",
    position: { x: 24, y: 230 },
    data: {
      label: "Current State",
      icon: "compass",
      description: "Identify your baseline skills and constraints before choosing an execution path.",
      timeEstimate: "2-3 days",
      tasks: ["Skill gap audit", "Define constraints", "Set learning cadence"],
      references: [{ url: "https://roadmap.sh" }, { url: "https://developer.mozilla.org" }],
    },
  },
  {
    id: "core",
    type: "customNode",
    position: { x: 300, y: 138 },
    data: {
      label: "Core Skills",
      icon: "code",
      description: "Build foundational concepts and the practical basics needed for consistent progress.",
      timeEstimate: "2-4 weeks",
      tasks: ["Master fundamentals", "Practice daily", "Review weak areas"],
      references: [{ url: "https://react.dev" }, { url: "https://www.typescriptlang.org" }],
    },
  },
  {
    id: "projects",
    type: "customNode",
    position: { x: 560, y: 48 },
    data: {
      label: "Projects",
      icon: "briefcase",
      description: "Convert knowledge into applied outcomes through iterative, portfolio-grade builds.",
      timeEstimate: "3-6 weeks",
      tasks: ["Ship mini project", "Refactor architecture", "Publish outcomes"],
      references: [{ url: "https://github.com" }, { url: "https://vercel.com" }],
    },
  },
  {
    id: "dsa",
    type: "customNode",
    position: { x: 560, y: 255 },
    data: {
      label: "DSA & Problem Solving",
      icon: "calculator",
      description: "Sharpen problem solving depth and interview patterns with consistent practice.",
      timeEstimate: "3-5 weeks",
      tasks: ["Arrays & strings", "Graphs & DP", "Mock interviews"],
      references: [{ url: "https://leetcode.com" }, { url: "https://neetcode.io" }],
    },
  },
  {
    id: "system-design",
    type: "customNode",
    position: { x: 820, y: 70 },
    data: {
      label: "System Design",
      icon: "server",
      description: "Design scalable systems and communicate tradeoffs clearly.",
      timeEstimate: "2-4 weeks",
      tasks: ["Caching", "Queues", "Design interviews"],
      references: [{ url: "https://www.educative.io" }, { url: "https://highscalability.com" }],
    },
  },
  {
    id: "execution",
    type: "customNode",
    position: { x: 840, y: 230 },
    data: {
      label: "Execution",
      icon: "wrench",
      description: "Run focused cycles, track progress, and close gaps with measurable milestones.",
      timeEstimate: "Ongoing",
      tasks: ["Weekly sprint plan", "Progress checkpoints", "Feedback iteration"],
      references: [{ url: "https://linear.app" }, { url: "https://notion.so" }],
    },
  },
  {
    id: "outcome",
    type: "customNode",
    position: { x: 1100, y: 135 },
    data: {
      label: "Outcome",
      icon: "target",
      description: "Reach your target state with a repeatable process you can reuse for future goals.",
      timeEstimate: "Milestone",
      tasks: ["Outcome review", "Portfolio update", "Next roadmap"],
      references: [{ url: "https://www.linkedin.com" }, { url: "https://www.notion.so" }],
      isHighlighted: true,
    },
  },
];

const fallbackEdges: Edge[] = [
  { id: "current-core", source: "current", target: "core", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "core-projects", source: "core", target: "projects", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "core-dsa", source: "core", target: "dsa", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "projects-system-design", source: "projects", target: "system-design", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "projects-execution", source: "projects", target: "execution", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "dsa-execution", source: "dsa", target: "execution", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "system-design-execution", source: "system-design", target: "execution", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
  { id: "execution-outcome", source: "execution", target: "outcome", type: "smoothstep", style: { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 } },
];

/* ── Helpers ── */

function toReactFlowNodes(data: LandingRoadmapData): Node[] {
  return data.nodes.map((n) => ({
    id: n.id,
    type: n.type || "customNode",
    position: n.position,
    data: n.data,
  }));
}

function toReactFlowEdges(data: LandingRoadmapData): Edge[] {
  return data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: e.type || "smoothstep",
    style: e.style ?? { stroke: "rgba(155,156,247,0.9)", strokeWidth: 2 },
  }));
}

/* ── Component ── */

export default function LandingRoadmapPreview() {
  const { theme } = useTheme();
  const [allNodes, setAllNodes] = useState<Node[]>(fallbackNodes);
  const [allEdges, setAllEdges] = useState<Edge[]>(fallbackEdges);
  const [visibleNodeCount, setVisibleNodeCount] = useState(1);
  const [loaded, setLoaded] = useState(false);

  // Fetch real data from DB on mount
  useEffect(() => {
    let cancelled = false;
    getLandingRoadmap().then((result) => {
      if (cancelled) return;
      if (result && result.nodes.length > 0) {
        setAllNodes(toReactFlowNodes(result));
        setAllEdges(toReactFlowEdges(result));
      }
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Sequential reveal animation
  useEffect(() => {
    if (!loaded) return;
    setVisibleNodeCount(1);
    const timer = window.setInterval(() => {
      setVisibleNodeCount((prev) => {
        if (prev >= allNodes.length) {
          window.clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, REVEAL_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [loaded, allNodes.length]);

  const visibleNodeIds = useMemo(
    () => new Set(allNodes.slice(0, visibleNodeCount).map((n) => n.id)),
    [allNodes, visibleNodeCount],
  );

  const visibleNodes = useMemo(
    () => allNodes.slice(0, visibleNodeCount),
    [allNodes, visibleNodeCount],
  );

  const visibleEdges = useMemo(() => {
    const filtered = allEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
    );
    return filtered.map((e, i) => ({
      ...e,
      animated: i === filtered.length - 1,
    }));
  }, [allEdges, visibleNodeIds]);

  return (
    <div className="relative h-[430px] overflow-hidden rounded-3xl border border-indigo-200/60 bg-gray-50 dark:border-indigo-300/20 dark:bg-neutral-950">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        panOnScroll
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        preventScrolling
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.3}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full bg-gray-50 dark:bg-neutral-950"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color={theme === "dark" ? "#94a3b8" : "#a295be"}
          style={{ opacity: theme === "dark" ? 0.3 : 1 }}
        />
      </ReactFlow>
    </div>
  );
}
