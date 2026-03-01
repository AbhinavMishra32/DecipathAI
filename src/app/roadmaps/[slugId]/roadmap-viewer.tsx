"use client";

import { useCallback, useState, useMemo } from "react";
import Link from "next/link";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
  useReactFlow,
  SelectionMode,
  addEdge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "@/components/roadmap/custom-node";
import Sidebar from "@/components/roadmap/sidebar";
import TaskDisplay from "@/components/roadmap/task-display";
import { useTheme } from "next-themes";
import { hubotSans } from "@/lib/fonts";
import type { RoadmapGraph } from "@/lib/roadmap-repository";
import type { MindMapNode } from "@/app/types";
import { updateRoadmapVisibility } from "@/actions/roadmap";
import {
  Globe,
  Lock,
  LinkSimple,
  Check,
  Brain,
  House,
  GitBranch,
  Graph,
  ListChecks,
  BookOpen,
} from "@phosphor-icons/react";
import type { Visibility } from "@prisma/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const nodeTypes = { customNode: CustomNode };
const LAYOUT_SAVE_THRESHOLD_PX = 1;

interface RoadmapViewerProps {
  roadmap: {
    id: string;
    title: string;
    slug: string;
    visibility: string;
    graph: RoadmapGraph;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export default function RoadmapViewer({ roadmap }: RoadmapViewerProps) {
  const { theme } = useTheme();
  const { getEdges, setEdges: setEdgesReactFlow } = useReactFlow();

  // Hydrate graph from server data
  const initialNodes = useMemo<Node[]>(
    () =>
      roadmap.graph.nodes.map((n) => ({
        id: n.id,
        type: n.type || "customNode",
        position: n.position,
        data: n.data,
      })),
    [roadmap.graph.nodes],
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      roadmap.graph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: e.type || "smoothstep",
        animated: e.animated,
        style: e.style ?? {
          stroke: "rgba(155, 156, 247, 0.9)",
          strokeWidth: 2,
        },
      })),
    [roadmap.graph.edges],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [visibility, setVisibility] = useState<Visibility>(
    roadmap.visibility as Visibility,
  );
  const [copied, setCopied] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [saveLayoutError, setSaveLayoutError] = useState<string | null>(null);

  const roadmapRundown = useMemo(() => {
    const idToLabel = new Map<string, string>();
    roadmap.graph.nodes.forEach((node) => {
      idToLabel.set(node.id, node.data.label || node.id);
    });

    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();
    roadmap.graph.edges.forEach((edge) => {
      const next = outgoing.get(edge.source) ?? [];
      next.push(edge.target);
      outgoing.set(edge.source, next);

      const prev = incoming.get(edge.target) ?? [];
      prev.push(edge.source);
      incoming.set(edge.target, prev);
    });

    const forkNodes = roadmap.graph.nodes
      .filter((node) => (outgoing.get(node.id)?.length ?? 0) >= 2)
      .map((node) => ({
        id: node.id,
        label: node.data.label,
        branches: outgoing.get(node.id)?.map((targetId) => idToLabel.get(targetId) ?? targetId) ?? [],
      }));

    const mergeNodes = roadmap.graph.nodes
      .filter((node) => (incoming.get(node.id)?.length ?? 0) >= 2)
      .map((node) => ({
        id: node.id,
        label: node.data.label,
        prerequisites: incoming.get(node.id)?.map((sourceId) => idToLabel.get(sourceId) ?? sourceId) ?? [],
      }));

    const domainCount = new Map<string, number>();
    const domainExamples = new Map<string, string[]>();
    roadmap.graph.nodes.forEach((node) => {
      const refs = Array.isArray(node.data.references) ? node.data.references : [];
      refs.forEach((ref) => {
        try {
          const host = new URL(ref.url).hostname.replace(/^www\./, "");
          domainCount.set(host, (domainCount.get(host) ?? 0) + 1);
          const examples = domainExamples.get(host) ?? [];
          if (!examples.includes(node.data.label)) {
            examples.push(node.data.label);
          }
          domainExamples.set(host, examples);
        } catch {
          return;
        }
      });
    });

    const topDomains = [...domainCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([domain, count]) => ({
        domain,
        count,
        examples: (domainExamples.get(domain) ?? []).slice(0, 3),
      }));

    const inDegree = new Map<string, number>();
    roadmap.graph.nodes.forEach((node) => inDegree.set(node.id, 0));
    roadmap.graph.edges.forEach((edge) => {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    });

    const queue = roadmap.graph.nodes
      .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
      .map((node) => node.id);
    const topoOrder: string[] = [];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      topoOrder.push(current);
      (outgoing.get(current) ?? []).forEach((neighbor) => {
        const nextDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, nextDegree);
        if (nextDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    const orderedLabels = (topoOrder.length > 0 ? topoOrder : roadmap.graph.nodes.map((n) => n.id))
      .map((id) => idToLabel.get(id) ?? id)
      .slice(0, 12);

    const taskCounts = roadmap.graph.nodes.map((node) => (Array.isArray(node.data.tasks) ? node.data.tasks.length : 0));
    const referenceCounts = roadmap.graph.nodes.map((node) =>
      Array.isArray(node.data.references) ? node.data.references.length : 0,
    );

    const avgTasks = taskCounts.length > 0 ? taskCounts.reduce((sum, n) => sum + n, 0) / taskCounts.length : 0;
    const avgReferences =
      referenceCounts.length > 0 ? referenceCounts.reduce((sum, n) => sum + n, 0) / referenceCounts.length : 0;

    return {
      nodeCount: roadmap.graph.nodes.length,
      edgeCount: roadmap.graph.edges.length,
      forkNodes,
      mergeNodes,
      topDomains,
      orderedLabels,
      avgTasks: avgTasks.toFixed(1),
      avgReferences: avgReferences.toFixed(1),
    };
  }, [roadmap.graph.edges, roadmap.graph.nodes]);

  // ── Path highlighting ────────────────────────
  const highlightPath = useCallback(
    (nodeId: string) => {
      const highlightedEdges = new Set<string>();
      const nodesToHighlight = new Set<string>([nodeId]);

      const traversePath = (currentId: string) => {
        const incomingEdges = getEdges().filter((e) => e.target === currentId);
        incomingEdges.forEach((edge) => {
          if (!highlightedEdges.has(edge.id)) {
            highlightedEdges.add(edge.id);
            nodesToHighlight.add(edge.source);
            traversePath(edge.source);
          }
        });
      };
      traversePath(nodeId);

      setEdgesReactFlow((eds) =>
        eds.map((ed) => ({
          ...ed,
          type: "smoothstep",
          style: {
            ...ed.style,
            stroke: highlightedEdges.has(ed.id)
              ? theme === "dark"
                ? "rgb(205, 209, 255)"
                : "rgba(88, 74, 212)"
              : theme === "dark"
                ? "rgba(155, 156, 247, 0.9)"
                : "rgba(145, 140, 241, 0.6)",
            strokeWidth: highlightedEdges.has(ed.id) ? 3 : 2,
          },
          animated: highlightedEdges.has(ed.id),
        })),
      );

      setNodes((nds) =>
        nds.map((nd) => ({
          ...nd,
          data: { ...nd.data, isHighlighted: nodesToHighlight.has(nd.id) },
        })),
      );
    },
    [getEdges, setEdgesReactFlow, setNodes, theme],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node as MindMapNode);
      highlightPath(node.id);
      setNodes((nds) =>
        nds.map((nd) => ({
          ...nd,
          data: { ...nd.data, isExpanded: nd.id === node.id },
        })),
      );
    },
    [highlightPath, setNodes],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setEdges((eds) =>
      eds.map((ed) => ({
        ...ed,
        style: {
          ...ed.style,
          stroke: "rgba(155, 156, 247, 0.9)",
          strokeWidth: 2,
        },
      })),
    );
    setNodes((nds) =>
      nds.map((nd) => ({
        ...nd,
        data: { ...nd.data, isExpanded: false },
      })),
    );
  }, [setEdges, setNodes]);

  const onConnect = useCallback(
    (connection: Edge | Connection) =>
      setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  const saveGraphLayout = useCallback(
    async (nextNodes: Node[]) => {
      if (!roadmap.isOwner) {
        return;
      }

      const graph = {
        nodes: nextNodes.map((node) => ({
          id: node.id,
          type: (node.type as string) || "customNode",
          position: node.position,
          data: node.data as RoadmapGraph["nodes"][number]["data"],
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type || "smoothstep",
          animated: edge.animated ?? false,
          style: {
            stroke: (edge.style?.stroke as string | undefined) ??
              (theme === "dark"
                ? "rgb(205, 209, 255)"
                : "rgba(79, 70, 229, 0.62)"),
            strokeWidth:
              typeof edge.style?.strokeWidth === "number"
                ? edge.style.strokeWidth
                : 2,
          },
        })),
      };

      setIsSavingLayout(true);
      setSaveLayoutError(null);

      try {
        const response = await fetch(`/api/roadmaps/${roadmap.id}/layout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ graph }),
        });

        const payload = (await response.json().catch(() => null)) as
          | { success?: boolean; error?: string }
          | null;

        if (!response.ok || !payload?.success) {
          const errorMessage = payload?.error || "Failed to save roadmap layout";
          setSaveLayoutError(errorMessage);
          console.error("[roadmap-viewer] Failed to save node position", errorMessage);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to save roadmap layout";
        setSaveLayoutError(errorMessage);
        console.error("[roadmap-viewer] Failed to save node position", errorMessage);
      } finally {
        setIsSavingLayout(false);
      }
    },
    [edges, roadmap.id, roadmap.isOwner, theme],
  );

  const onNodeDragStop = useCallback(
    async (_: React.MouseEvent, draggedNode: Node) => {
      if (!roadmap.isOwner) {
        return;
      }

      const originalNode = nodes.find((node) => node.id === draggedNode.id);
      if (!originalNode) {
        return;
      }

      const deltaX = draggedNode.position.x - originalNode.position.x;
      const deltaY = draggedNode.position.y - originalNode.position.y;
      const distanceMoved = Math.hypot(deltaX, deltaY);

      if (distanceMoved < LAYOUT_SAVE_THRESHOLD_PX) {
        return;
      }

      const nextNodes = nodes.map((node) =>
        node.id === draggedNode.id
          ? {
              ...node,
              position: draggedNode.position,
            }
          : node,
      );

      setNodes(nextNodes);
      await saveGraphLayout(nextNodes);
    },
    [nodes, roadmap.isOwner, saveGraphLayout, setNodes],
  );

  // ── Visibility toggle ───────────────────────
  const toggleVisibility = useCallback(async () => {
    const next = visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC";
    setVisibility(next); // optimistic
    const result = await updateRoadmapVisibility({
      id: roadmap.id,
      visibility: next,
    });
    if (!result.success) {
      setVisibility(visibility); // revert
    }
  }, [visibility, roadmap.id]);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <>
      {selectedNode && <TaskDisplay selectedNode={selectedNode} />}
      <div
        className={`${hubotSans.className} flex flex-col w-full h-screen relative`}
      >
        {/* ── Top bar ─────────────────────────── */}
        <div className="absolute left-4 top-4 z-50 flex items-center gap-2">
          <Link
            href="/roadmaps"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60"
          >
            <House weight="bold" className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60">
                <Brain weight="bold" className="h-3.5 w-3.5" />
                Why this works for you
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[92vw] max-w-2xl overflow-y-auto border-indigo-200/70 bg-white/95 text-slate-900 dark:border-indigo-300/20 dark:bg-neutral-950/95 dark:text-slate-100"
            >
              <SheetHeader>
                <SheetTitle className="text-left">Why this plan works for your goal</SheetTitle>
                <SheetDescription className="text-left">
                  A user-focused walkthrough of how this roadmap helps you move from where you are to where you want to be.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <section className="rounded-xl border border-indigo-200/70 bg-indigo-50/60 p-4 dark:border-indigo-300/20 dark:bg-indigo-500/10">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Graph className="h-4 w-4" weight="bold" />
                    Your path to the outcome
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    This plan breaks your journey into {roadmapRundown.nodeCount} milestones so you can make steady progress without guessing your next move.
                    It also gives you multiple routes when helpful, then brings them back together before major outcome checkpoints so effort stays focused.
                  </p>
                  {roadmapRundown.forkNodes.length > 0 && (
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {roadmapRundown.forkNodes.slice(0, 5).map((fork) => (
                        <p key={`fork-${fork.id}`}>
                          <span className="font-semibold">After {fork.label}, you can choose:</span> {fork.branches.join(" • ")}
                        </p>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-xl border border-indigo-200/70 bg-white/70 p-4 dark:border-indigo-300/20 dark:bg-neutral-900/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <GitBranch className="h-4 w-4" weight="bold" />
                    Why this leads to that
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    Key milestones are sequenced so each one unlocks the next. You build foundations first, then apply them at higher-leverage stages,
                    which reduces rework and helps you avoid jumping ahead too early.
                  </p>
                  {roadmapRundown.mergeNodes.length > 0 ? (
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {roadmapRundown.mergeNodes.slice(0, 5).map((merge) => (
                        <p key={`merge-${merge.id}`}>
                          <span className="font-semibold">Before {merge.label}, complete:</span> {merge.prerequisites.join(" • ")}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">This plan follows one main sequence without combined checkpoint stages.</p>
                  )}
                </section>

                <section className="rounded-xl border border-indigo-200/70 bg-white/70 p-4 dark:border-indigo-300/20 dark:bg-neutral-900/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4" weight="bold" />
                    Why you can trust these steps
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    The recommendations are backed by real sources so each step is grounded in practical evidence, not generic advice.
                  </p>
                  {roadmapRundown.topDomains.length > 0 ? (
                    <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      {roadmapRundown.topDomains.map((entry) => (
                        <p key={`domain-${entry.domain}`}>
                          <span className="font-semibold">{entry.domain}</span> ({entry.count} sources) — informs {entry.examples.join(" • ")}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">No source breakdown was available in this roadmap snapshot.</p>
                  )}
                </section>

                <section className="rounded-xl border border-indigo-200/70 bg-white/70 p-4 dark:border-indigo-300/20 dark:bg-neutral-900/50">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <ListChecks className="h-4 w-4" weight="bold" />
                    How to execute this plan
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    Each milestone gives you around {roadmapRundown.avgTasks} concrete actions, supported by about {roadmapRundown.avgReferences} sources.
                    That balance is designed so you can act quickly while staying aligned with proven guidance.
                  </p>
                  <div className="mt-3 rounded-lg border border-indigo-200/60 bg-indigo-50/55 p-3 text-xs text-slate-700 dark:border-indigo-300/20 dark:bg-indigo-500/10 dark:text-slate-300">
                    <p className="font-semibold">Suggested run order (first {roadmapRundown.orderedLabels.length} milestones):</p>
                    <p className="mt-1 leading-relaxed">{roadmapRundown.orderedLabels.join(" → ")}</p>
                  </div>
                </section>
              </div>
            </SheetContent>
          </Sheet>

          <h1 className="rounded-xl border border-indigo-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-white">
            {roadmap.title}
          </h1>

          {roadmap.isOwner && (
            <>
              <button
                onClick={toggleVisibility}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60"
              >
                {visibility === "PUBLIC" ? (
                  <>
                    <Globe weight="bold" className="h-3.5 w-3.5 text-green-500" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock weight="bold" className="h-3.5 w-3.5 text-amber-500" />
                    Private
                  </>
                )}
              </button>

              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60"
              >
                {copied ? (
                  <>
                    <Check weight="bold" className="h-3.5 w-3.5 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkSimple weight="bold" className="h-3.5 w-3.5" />
                    Copy link
                  </>
                )}
              </button>

              {isSavingLayout && (
                <div className="rounded-lg border border-indigo-200/70 bg-white/70 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300">
                  Saving layout...
                </div>
              )}

              {saveLayoutError && (
                <div className="rounded-lg border border-red-200/70 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-700 shadow-sm backdrop-blur-xl dark:border-red-300/20 dark:bg-red-900/30 dark:text-red-300">
                  Layout save failed
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Flow ────────────────────────────── */}
        <div className="flex-grow relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeDragStop}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            panOnScroll
            selectionMode={SelectionMode.Full}
            selectionOnDrag
            multiSelectionKeyCode="Control"
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
            attributionPosition="bottom-left"
            className="bg-gray-50 dark:bg-neutral-950 h-full"
          >
            <Controls />
            <Background
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color={theme === "dark" ? "#94a3b8" : "#a295be"}
              style={{ opacity: theme === "dark" ? 0.3 : 1 }}
            />
          </ReactFlow>
        </div>
        <div>
          <Sidebar selectedNode={selectedNode} />
        </div>
      </div>
    </>
  );
}
