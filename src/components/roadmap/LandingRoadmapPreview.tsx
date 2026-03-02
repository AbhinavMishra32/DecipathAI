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

const nodeTypes = { customNode: CustomNode };

const revealDelayMs = 460;

const roadmapNodes: Node[] = [
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
    position: { x: 580, y: 72 },
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
    id: "execution",
    type: "customNode",
    position: { x: 762, y: 154 },
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
    position: { x: 1010, y: 40 },
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

const roadmapEdges: Edge[] = [
  {
    id: "current-core",
    source: "current",
    target: "core",
    type: "smoothstep",
    style: {
      stroke: "rgba(155, 156, 247, 0.9)",
      strokeWidth: 2,
    },
  },
  {
    id: "core-projects",
    source: "core",
    target: "projects",
    type: "smoothstep",
    style: {
      stroke: "rgba(155, 156, 247, 0.9)",
      strokeWidth: 2,
    },
  },
  {
    id: "projects-execution",
    source: "projects",
    target: "execution",
    type: "smoothstep",
    style: {
      stroke: "rgba(155, 156, 247, 0.9)",
      strokeWidth: 2,
    },
  },
  {
    id: "core-execution",
    source: "core",
    target: "execution",
    type: "smoothstep",
    style: {
      stroke: "rgba(155, 156, 247, 0.9)",
      strokeWidth: 2,
    },
  },
  {
    id: "execution-outcome",
    source: "execution",
    target: "outcome",
    type: "smoothstep",
    style: {
      stroke: "rgba(155, 156, 247, 0.9)",
      strokeWidth: 2,
    },
  },
];

export default function LandingRoadmapPreview() {
  const { theme } = useTheme();
  const [visibleNodeCount, setVisibleNodeCount] = useState(1);

  useEffect(() => {
    setVisibleNodeCount(1);
    const timer = window.setInterval(() => {
      setVisibleNodeCount((current) => {
        if (current >= roadmapNodes.length) {
          window.clearInterval(timer);
          return current;
        }

        return current + 1;
      });
    }, revealDelayMs);

    return () => window.clearInterval(timer);
  }, []);

  const visibleNodeIds = useMemo(
    () => new Set(roadmapNodes.slice(0, visibleNodeCount).map((node) => node.id)),
    [visibleNodeCount],
  );

  const visibleNodes = useMemo(
    () => roadmapNodes.slice(0, visibleNodeCount),
    [visibleNodeCount],
  );

  const visibleEdges = useMemo(() => {
    const filtered = roadmapEdges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target),
    );

    return filtered.map((edge, index) => ({
      ...edge,
      animated: index === filtered.length - 1,
    }));
  }, [visibleNodeIds]);

  return (
    <div className="relative h-[430px] overflow-hidden rounded-3xl border border-indigo-300/35 bg-white/65 backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-950/58">
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling
        fitView={false}
        minZoom={0.58}
        maxZoom={0.58}
        defaultViewport={{ x: -26, y: -6, zoom: 0.58 }}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full bg-transparent"
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
