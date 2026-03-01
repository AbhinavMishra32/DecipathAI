"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ReactFlow, {
  Background,
  Controls,
  BackgroundVariant,
  MarkerType,
  type Edge,
  type Node,
} from "reactflow";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  FlagBanner,
  PlayCircle,
  Sparkle,
  Target,
} from "@phosphor-icons/react";
import CustomNode from "@/components/roadmap/custom-node";
import {
  startOrResumeRoadmapProgress,
  toggleRoadmapTaskProgress,
  advanceRoadmapProgress,
  type RoadmapProgressSnapshot,
} from "@/actions/roadmap-progress";
import { hubotSans } from "@/lib/fonts";
import "reactflow/dist/style.css";

const progressNodeTypes = { customNode: CustomNode };

type RoadmapGraphNode = {
  id: string;
  type: "customNode";
  data: {
    label: string;
    icon?: string;
    description: string;
    detailedDescription: string;
    timeEstimate: string;
    nextSteps?: string[];
    tasks: string[];
    references?: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: string;
    }>;
  };
  position: { x: number; y: number };
};

type RoadmapGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
  style: {
    stroke: string;
    strokeWidth: number;
  };
};

interface ProgressClientProps {
  roadmap: {
    id: string;
    title: string;
    slugId: string;
    nodeCount: number;
    graph: {
      nodes: RoadmapGraphNode[];
      edges: RoadmapGraphEdge[];
    };
  };
}

function RoadmapProgressVisual({
  roadmap,
  snapshot,
  selectedNextNodeId,
  onSelectNextNode,
}: {
  roadmap: ProgressClientProps["roadmap"];
  snapshot: RoadmapProgressSnapshot;
  selectedNextNodeId: string | null;
  onSelectNextNode: (nodeId: string) => void;
}) {
  const completedNodeIds = useMemo(
    () => new Set(snapshot.completedNodeIds),
    [snapshot.completedNodeIds],
  );
  const nextNodeIds = useMemo(
    () => new Set(snapshot.nextNodeOptions.map((node) => node.id)),
    [snapshot.nextNodeOptions],
  );
  const currentNodeId = snapshot.currentNodeId;

  const trail = useMemo(() => {
    if (!currentNodeId) {
      return {
        edgeIds: new Set<string>(),
        nodeIds: new Set<string>(),
      };
    }

    const incomingByTarget = new Map<string, Array<{ id: string; source: string }>>();
    roadmap.graph.edges.forEach((edge) => {
      const incoming = incomingByTarget.get(edge.target) ?? [];
      incoming.push({ id: edge.id, source: edge.source });
      incomingByTarget.set(edge.target, incoming);
    });

    const visitedNodes = new Set<string>([currentNodeId]);
    const queue: string[] = [currentNodeId];
    const ancestorEdges = new Set<string>();

    while (queue.length > 0) {
      const nodeId = queue.shift() as string;
      const incoming = incomingByTarget.get(nodeId) ?? [];

      incoming.forEach((edge) => {
        ancestorEdges.add(edge.id);
        if (!visitedNodes.has(edge.source)) {
          visitedNodes.add(edge.source);
          queue.push(edge.source);
        }
      });
    }

    return {
      edgeIds: ancestorEdges,
      nodeIds: visitedNodes,
    };
  }, [currentNodeId, roadmap.graph.edges]);

  const previewNodes = useMemo<Node[]>(() => {
    return roadmap.graph.nodes.map((node) => {
      const isCurrent = currentNodeId === node.id;
      const isNext = nextNodeIds.has(node.id);
      const isCompleted = completedNodeIds.has(node.id);
      const isSelectedNext = selectedNextNodeId === node.id;
      const isTrailNode = trail.nodeIds.has(node.id);
      const shouldBePurpleTrail = isCurrent || isCompleted || isTrailNode;

      return {
        id: node.id,
        type: "customNode",
        position: node.position,
        data: {
          ...node.data,
          isHighlighted: shouldBePurpleTrail || isNext,
          isExpanded: isCurrent,
          highlightTone: isNext ? "amber" : "indigo",
          description: isCurrent
            ? node.data.description
            : isSelectedNext
              ? `Selected next node • ${node.data.description}`
              : isCompleted
                ? `Completed milestone • ${node.data.description}`
                : node.data.description,
        },
      };
    });
  }, [completedNodeIds, currentNodeId, nextNodeIds, roadmap.graph.nodes, selectedNextNodeId, trail.nodeIds]);

  const previewEdges = useMemo<Edge[]>(() => {
    return roadmap.graph.edges.map((edge) => {
      const isAncestorPath = trail.edgeIds.has(edge.id);
      const isNextPath = nextNodeIds.has(edge.target) || nextNodeIds.has(edge.source);

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: isAncestorPath || isNextPath,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        style: {
          stroke: isAncestorPath
            ? "rgba(99, 102, 241, 0.95)"
            : isNextPath
              ? "rgba(234, 179, 8, 0.95)"
              : "rgba(148, 163, 184, 0.55)",
          strokeWidth: isAncestorPath || isNextPath ? 3 : 1.8,
        },
      };
    });
  }, [nextNodeIds, roadmap.graph.edges, trail.edgeIds]);

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-b from-white/90 to-indigo-50/60 p-4 dark:border-indigo-300/20 dark:from-neutral-900/65 dark:to-indigo-900/20">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            Progression map
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Purple is your completed/current path. Yellow nodes are valid next branches.
          </p>
        </div>
        <div className="rounded-full border border-indigo-200/70 bg-white/80 px-2.5 py-1 text-[11px] text-slate-600 dark:border-indigo-300/20 dark:bg-neutral-900/50 dark:text-slate-300">
          {snapshot.completedTasks}/{snapshot.totalTasks} tasks complete
        </div>
      </div>

      <div className="h-[500px] overflow-hidden rounded-xl border border-indigo-200/70 bg-white/70 dark:border-indigo-300/15 dark:bg-neutral-950/45">
        <ReactFlow
          nodes={previewNodes}
          edges={previewEdges}
          nodeTypes={progressNodeTypes}
          onNodeClick={(_event, node) => {
            if (!snapshot.canAdvance || snapshot.nextNodeOptions.length === 0) {
              return;
            }

            if (nextNodeIds.has(node.id)) {
              onSelectNextNode(node.id);
            }
          }}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={1.6}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          zoomOnDoubleClick={false}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
          className="!bg-transparent"
        >
          <Controls />
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color="rgba(99, 102, 241, 0.32)"
          />
        </ReactFlow>
      </div>

      {snapshot.canAdvance && snapshot.nextNodeOptions.length > 1 && (
        <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-400/30 dark:bg-amber-900/25 dark:text-amber-200">
          Click a yellow node on the map to choose your next branch.
        </div>
      )}
    </div>
  );
}

export default function ProgressClient({ roadmap }: ProgressClientProps) {
  const [snapshot, setSnapshot] = useState<RoadmapProgressSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNextNodeId, setSelectedNextNodeId] = useState<string | null>(null);
  const [savingTaskKey, setSavingTaskKey] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const hydrate = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await startOrResumeRoadmapProgress({ roadmapId: roadmap.id });
    if (!result.success) {
      setError(result.error ?? "Unable to load progression state.");
      setLoading(false);
      return;
    }

    setSnapshot(result.data);
    setLoading(false);
  }, [roadmap.id]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!snapshot || !snapshot.canAdvance) {
      setSelectedNextNodeId(null);
      return;
    }

    const options = snapshot.nextNodeOptions;
    if (options.length === 1) {
      setSelectedNextNodeId(options[0].id);
      return;
    }

    if (!selectedNextNodeId || !options.some((node) => node.id === selectedNextNodeId)) {
      setSelectedNextNodeId(null);
    }
  }, [selectedNextNodeId, snapshot]);

  const handleToggleTask = useCallback(
    async (nodeId: string, taskIndex: number, completed: boolean) => {
      const taskKey = `${roadmap.id}:${nodeId}:${taskIndex}`;
      setSavingTaskKey(taskKey);

      const result = await toggleRoadmapTaskProgress({
        roadmapId: roadmap.id,
        nodeId,
        taskIndex,
        completed,
      });

      if (result.success) {
        setSnapshot(result.data);
      }

      setSavingTaskKey(null);
    },
    [roadmap.id],
  );

  const handleAdvance = useCallback(
    async (nextNodeId?: string) => {
      setAdvancing(true);
      const result = await advanceRoadmapProgress({
        roadmapId: roadmap.id,
        nextNodeId,
      });

      if (result.success) {
        setSnapshot(result.data);
        setSelectedNextNodeId(null);
      }

      setAdvancing(false);
    },
    [roadmap.id],
  );

  const completion = snapshot?.percentComplete ?? 0;

  return (
    <div className={`${hubotSans.className} mx-auto max-w-[95rem] px-6 py-8 sm:px-8`}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
          >
            <ArrowLeft weight="bold" className="h-3.5 w-3.5" />
            Back to dashboard
          </Link>

          <Link
            href={`/roadmaps/${roadmap.slugId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
          >
            Open visual roadmap
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-indigo-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/50">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              Progress workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
              {roadmap.title}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Dedicated workspace for completing this roadmap with task tracking and branch progression.
            </p>
          </div>

          {snapshot && (
            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-2 text-right dark:border-indigo-300/20 dark:bg-indigo-900/20">
              <p className="text-[11px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Status</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {snapshot.status === "COMPLETED" ? "Completed" : "In progress"}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-3 dark:border-indigo-300/15 dark:bg-neutral-900/45">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Total nodes</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{roadmap.nodeCount}</p>
          </div>
          <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-3 dark:border-indigo-300/15 dark:bg-neutral-900/45">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Completion</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{completion}%</p>
          </div>
          <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-3 dark:border-indigo-300/15 dark:bg-neutral-900/45">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Current node</p>
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">
              {snapshot?.currentNode?.label ?? "Completed"}
            </p>
          </div>
          <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-3 dark:border-indigo-300/15 dark:bg-neutral-900/45">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Tasks done</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              {snapshot ? `${snapshot.completedTasks}/${snapshot.totalTasks}` : "-"}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-indigo-200/70 bg-white/70 p-10 text-center text-sm text-slate-500 dark:border-indigo-300/15 dark:bg-neutral-900/45 dark:text-slate-400">
          Loading progression state...
        </div>
      ) : error || !snapshot ? (
        <div className="rounded-2xl border border-red-200/70 bg-red-50/70 p-6 text-sm text-red-700 dark:border-red-400/30 dark:bg-red-900/20 dark:text-red-300">
          {error ?? "Unable to load progression state."}
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            <RoadmapProgressVisual
              roadmap={roadmap}
              snapshot={snapshot}
              selectedNextNodeId={selectedNextNodeId}
              onSelectNextNode={setSelectedNextNodeId}
            />

            {snapshot.status === "COMPLETED" || !snapshot.currentNode ? (
              <div className="rounded-xl border border-green-200/80 bg-green-50/70 p-4 dark:border-green-400/20 dark:bg-green-950/30">
                <p className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-300">
                  <CheckCircle weight="duotone" className="h-4 w-4" />
                  Roadmap run completed
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-300/90">
                  You have completed every required step in this progression run.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-300/20 dark:bg-indigo-900/15">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                  Current node details
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                  {snapshot.currentNode.label}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {snapshot.currentNode.detailedDescription || snapshot.currentNode.description}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-5">
            {snapshot.currentNode && snapshot.status !== "COMPLETED" && (
              <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-4 dark:border-indigo-300/15 dark:bg-neutral-900/45">
                <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Task checklist</p>
                <div className="space-y-2">
                  {snapshot.currentNode.tasks.length === 0 ? (
                    <p className="rounded-lg border border-indigo-200/70 bg-indigo-50/60 px-3 py-2 text-xs text-slate-600 dark:border-indigo-300/20 dark:bg-indigo-900/20 dark:text-slate-300">
                      This node has no explicit tasks. You can proceed to the next node.
                    </p>
                  ) : (
                    snapshot.currentNode.tasks.map((task) => {
                      const taskKey = `${snapshot.roadmapId}:${snapshot.currentNode?.id}:${task.index}`;
                      return (
                        <label
                          key={task.index}
                          className="flex cursor-pointer items-start gap-3 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2.5 text-sm transition hover:bg-indigo-50/70 dark:border-indigo-300/15 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/70"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            disabled={savingTaskKey === taskKey}
                            onChange={(event) =>
                              handleToggleTask(
                                snapshot.currentNode!.id,
                                task.index,
                                event.target.checked,
                              )
                            }
                            className="mt-0.5 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span
                            className={task.completed ? "line-through text-slate-400" : "text-slate-700 dark:text-slate-200"}
                          >
                            {task.title}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-4 dark:border-indigo-300/15 dark:bg-neutral-900/45">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Next branch controls</p>

              {!snapshot.canAdvance ? (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Complete all current tasks to unlock next-node progression.
                </p>
              ) : snapshot.nextNodeOptions.length === 0 ? (
                <button
                  onClick={() => handleAdvance()}
                  disabled={advancing}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
                >
                  <FlagBanner weight="bold" className="h-3.5 w-3.5" />
                  Finish roadmap run
                </button>
              ) : snapshot.nextNodeOptions.length === 1 ? (
                <button
                  onClick={() => handleAdvance(snapshot.nextNodeOptions[0].id)}
                  disabled={advancing}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                >
                  <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                  Proceed to {snapshot.nextNodeOptions[0].label}
                </button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pick a yellow node on the map and continue.
                  </p>
                  <button
                    onClick={() => {
                      if (selectedNextNodeId) {
                        handleAdvance(selectedNextNodeId);
                      }
                    }}
                    disabled={!selectedNextNodeId || advancing}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-60"
                  >
                    <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                    {selectedNextNodeId
                      ? `Go to ${
                          snapshot.nextNodeOptions.find((node) => node.id === selectedNextNodeId)?.label ??
                          "selected node"
                        }`
                      : "Select next yellow node"}
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-white/80 p-4 dark:border-indigo-300/15 dark:bg-neutral-900/45">
              <p className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Journey summary</p>
              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-center gap-1.5">
                  <Target weight="bold" className="h-3.5 w-3.5 text-indigo-500" />
                  {snapshot.completedNodeIds.length} completed nodes
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock weight="bold" className="h-3.5 w-3.5 text-indigo-500" />
                  {snapshot.completedTasks} completed tasks
                </p>
                <p className="flex items-center gap-1.5">
                  <Sparkle weight="bold" className="h-3.5 w-3.5 text-indigo-500" />
                  {snapshot.nextNodeOptions.length} available next options
                </p>
              </div>
            </div>

            <button
              onClick={() => void hydrate()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
            >
              <PlayCircle weight="bold" className="h-3.5 w-3.5" />
              Refresh progression state
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
