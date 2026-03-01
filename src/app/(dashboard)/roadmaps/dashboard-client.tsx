"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  Trash,
  Plus,
  MapTrifold,
  Clock,
  GitBranch,
  CheckCircle,
  Target,
  PlayCircle,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";
import { deleteRoadmap } from "@/actions/roadmap";
import {
  startOrResumeRoadmapProgress,
  toggleRoadmapTaskProgress,
  advanceRoadmapProgress,
  type RoadmapProgressSnapshot,
} from "@/actions/roadmap-progress";
import { hubotSans } from "@/lib/fonts";

interface RoadmapItem {
  id: string;
  title: string;
  slugId: string;
  visibility: string;
  nodeCount: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardClientProps {
  roadmaps: RoadmapItem[];
  progressRuns: {
    roadmapId: string;
    roadmapTitle: string;
    roadmapSlugId: string;
    status: "ACTIVE" | "COMPLETED";
    currentNodeLabel: string;
    totalTasks: number;
    completedTasks: number;
    percentComplete: number;
    updatedAt: string;
  }[];
  username: string;
}

type ProgressSummary = DashboardClientProps["progressRuns"][number];

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function DashboardClient({
  roadmaps,
  progressRuns,
  username,
}: DashboardClientProps) {
  const [items, setItems] = useState(roadmaps);
  const [progress, setProgress] = useState<ProgressSummary[]>(progressRuns);
  const [snapshots, setSnapshots] = useState<Record<string, RoadmapProgressSnapshot>>({});
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(
    progressRuns[0]?.roadmapId ?? roadmaps[0]?.id ?? null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingRoadmapId, setLoadingRoadmapId] = useState<string | null>(null);
  const [savingTaskKey, setSavingTaskKey] = useState<string | null>(null);
  const [advancingRoadmapId, setAdvancingRoadmapId] = useState<string | null>(null);

  const activeRoadmap = useMemo(
    () => items.find((item) => item.id === activeRoadmapId) ?? null,
    [activeRoadmapId, items],
  );

  const activeSummary = useMemo(
    () => progress.find((entry) => entry.roadmapId === activeRoadmapId) ?? null,
    [activeRoadmapId, progress],
  );

  const activeSnapshot = activeRoadmapId ? snapshots[activeRoadmapId] : undefined;

  const upsertProgressSummaryFromSnapshot = useCallback(
    (snapshot: RoadmapProgressSnapshot) => {
      const summary: ProgressSummary = {
        roadmapId: snapshot.roadmapId,
        roadmapTitle: snapshot.roadmapTitle,
        roadmapSlugId: snapshot.roadmapSlugId,
        status: snapshot.status,
        currentNodeLabel: snapshot.currentNode?.label ?? "Completed",
        totalTasks: snapshot.totalTasks,
        completedTasks: snapshot.completedTasks,
        percentComplete: snapshot.percentComplete,
        updatedAt: new Date().toISOString(),
      };

      setProgress((prev) => {
        const index = prev.findIndex((entry) => entry.roadmapId === summary.roadmapId);
        if (index === -1) {
          return [summary, ...prev];
        }
        const clone = [...prev];
        clone[index] = summary;
        return clone.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });

      setSnapshots((prev) => ({
        ...prev,
        [snapshot.roadmapId]: snapshot,
      }));
    },
    [],
  );

  const handleStartOrContinue = useCallback(
    async (roadmapId: string) => {
      setLoadingRoadmapId(roadmapId);
      const result = await startOrResumeRoadmapProgress({ roadmapId });
      if (result.success) {
        upsertProgressSummaryFromSnapshot(result.data);
        setActiveRoadmapId(roadmapId);
      }
      setLoadingRoadmapId(null);
    },
    [upsertProgressSummaryFromSnapshot],
  );

  const handleToggleTask = useCallback(
    async (nodeId: string, taskIndex: number, completed: boolean) => {
      if (!activeRoadmapId) {
        return;
      }

      const taskKey = `${activeRoadmapId}:${nodeId}:${taskIndex}`;
      setSavingTaskKey(taskKey);
      const result = await toggleRoadmapTaskProgress({
        roadmapId: activeRoadmapId,
        nodeId,
        taskIndex,
        completed,
      });

      if (result.success) {
        upsertProgressSummaryFromSnapshot(result.data);
      }

      setSavingTaskKey(null);
    },
    [activeRoadmapId, upsertProgressSummaryFromSnapshot],
  );

  const handleAdvance = useCallback(
    async (nextNodeId?: string) => {
      if (!activeRoadmapId) {
        return;
      }

      setAdvancingRoadmapId(activeRoadmapId);
      const result = await advanceRoadmapProgress({
        roadmapId: activeRoadmapId,
        nextNodeId,
      });

      if (result.success) {
        upsertProgressSummaryFromSnapshot(result.data);
      }

      setAdvancingRoadmapId(null);
    },
    [activeRoadmapId, upsertProgressSummaryFromSnapshot],
  );

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("Delete this roadmap? This cannot be undone.")) return;

      setDeletingId(id);
      const result = await deleteRoadmap({ id });
      if (result.success) {
        setItems((prev) => prev.filter((r) => r.id !== id));
        setProgress((prev) => prev.filter((entry) => entry.roadmapId !== id));
        setSnapshots((prev) => {
          const clone = { ...prev };
          delete clone[id];
          return clone;
        });
        if (activeRoadmapId === id) {
          const next = items.find((entry) => entry.id !== id)?.id ?? null;
          setActiveRoadmapId(next);
        }
      }
      setDeletingId(null);
    },
    [activeRoadmapId, items],
  );

  return (
    <div className={`${hubotSans.className} mx-auto max-w-7xl px-6 py-14 sm:px-8`}>
      {/* Header */}
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Progress Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {username}. Continue active roadmaps or start a new one.
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 rounded-xl border border-indigo-300/50 bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 dark:border-indigo-400/30 dark:shadow-indigo-600/30"
        >
          <Plus weight="bold" className="h-4 w-4" />
          New roadmap
        </Link>
      </div>

      {progress.length > 0 && (
        <div className="mb-8 rounded-2xl border border-indigo-200/70 bg-white/65 p-5 backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Sparkle weight="duotone" className="h-4 w-4" />
            Active progression across your saved roadmaps
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {progress.map((entry) => (
              <button
                key={entry.roadmapId}
                onClick={() => setActiveRoadmapId(entry.roadmapId)}
                className={`rounded-xl border p-3 text-left transition ${
                  activeRoadmapId === entry.roadmapId
                    ? "border-indigo-300 bg-indigo-50/70 dark:border-indigo-400/30 dark:bg-indigo-900/20"
                    : "border-indigo-200/60 bg-white/70 hover:border-indigo-300/70 dark:border-indigo-300/15 dark:bg-neutral-900/35"
                }`}
              >
                <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {entry.roadmapTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Current: {entry.currentNodeLabel}
                </p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ width: `${entry.percentComplete}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                  {entry.completedTasks}/{entry.totalTasks} tasks complete ({entry.percentComplete}%)
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200/70 bg-white/50 py-20 text-center backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/30">
          <MapTrifold
            weight="thin"
            className="h-16 w-16 text-indigo-400/60 dark:text-indigo-300/40"
          />
          <h2 className="mt-4 text-lg font-medium text-slate-700 dark:text-slate-300">
            No roadmaps yet
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Create your first roadmap to get started.
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
          >
            <Plus weight="bold" className="h-4 w-4" />
            Create roadmap
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr,1.8fr]">
          <div className="space-y-4">
            {items.map((roadmap) => {
              const progressForRoadmap = progress.find(
                (entry) => entry.roadmapId === roadmap.id,
              );

              return (
                <div
                  key={roadmap.id}
                  className={`group relative rounded-2xl border bg-white/70 p-5 shadow-sm backdrop-blur-sm transition dark:bg-neutral-900/50 ${
                    activeRoadmapId === roadmap.id
                      ? "border-indigo-300/80 shadow-md dark:border-indigo-400/30"
                      : "border-indigo-200/70 hover:border-indigo-300/80 dark:border-indigo-300/15"
                  }`}
                >
                  <button
                    onClick={(e) => handleDelete(roadmap.id, e)}
                    disabled={deletingId === roadmap.id}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    aria-label="Delete roadmap"
                  >
                    <Trash weight="bold" className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setActiveRoadmapId(roadmap.id)}
                    className="w-full text-left"
                  >
                    <h3 className="line-clamp-2 pr-8 text-base font-semibold text-slate-900 dark:text-white">
                      {roadmap.title}
                    </h3>
                  </button>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <GitBranch weight="bold" className="h-3.5 w-3.5" />
                      {roadmap.nodeCount} nodes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock weight="bold" className="h-3.5 w-3.5" />
                      {timeAgo(roadmap.updatedAt)}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {roadmap.visibility === "PUBLIC" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                        <Globe weight="bold" className="h-3 w-3" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                        <Lock weight="bold" className="h-3 w-3" />
                        Private
                      </span>
                    )}

                    {progressForRoadmap && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <Target weight="bold" className="h-3 w-3" />
                        {progressForRoadmap.percentComplete}% complete
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleStartOrContinue(roadmap.id)}
                      disabled={loadingRoadmapId === roadmap.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                    >
                      <PlayCircle weight="bold" className="h-3.5 w-3.5" />
                      {progressForRoadmap ? "Continue" : "Start from Node 1"}
                    </button>

                    <Link
                      href={`/roadmaps/${roadmap.slugId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
                    >
                      Open map
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-indigo-200/70 bg-white/75 p-6 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/55">
            {activeRoadmap ? (
              activeSnapshot ? (
                <div>
                  <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                        Current roadmap
                      </p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">
                        {activeSnapshot.roadmapTitle}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {activeSnapshot.completedTasks}/{activeSnapshot.totalTasks} tasks complete • {activeSnapshot.percentComplete}% done
                      </p>
                    </div>
                    <Link
                      href={`/roadmaps/${activeSnapshot.roadmapSlugId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
                    >
                      Open visual roadmap
                    </Link>
                  </div>

                  <div className="mb-6 h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${activeSnapshot.percentComplete}%` }}
                    />
                  </div>

                  {activeSnapshot.status === "COMPLETED" || !activeSnapshot.currentNode ? (
                    <div className="rounded-xl border border-green-200/80 bg-green-50/70 p-4 dark:border-green-400/20 dark:bg-green-950/30">
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-800 dark:text-green-300">
                        <CheckCircle weight="duotone" className="h-4 w-4" />
                        This roadmap run is completed
                      </p>
                      <p className="mt-1 text-xs text-green-700 dark:text-green-300/90">
                        You finished all required nodes in this tracked path.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-4 dark:border-indigo-300/20 dark:bg-indigo-900/15">
                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                          Current node
                        </p>
                        <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                          {activeSnapshot.currentNode.label}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                          {activeSnapshot.currentNode.description}
                        </p>
                      </div>

                      <div className="mt-5">
                        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Task checklist
                        </p>
                        <div className="space-y-2">
                          {activeSnapshot.currentNode.tasks.length === 0 ? (
                            <p className="rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs text-slate-500 dark:border-indigo-300/15 dark:bg-neutral-900/40 dark:text-slate-400">
                              This node has no explicit tasks. You can proceed to the next node.
                            </p>
                          ) : (
                            activeSnapshot.currentNode.tasks.map((task) => {
                              const taskKey = `${activeSnapshot.roadmapId}:${activeSnapshot.currentNode?.id}:${task.index}`;
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
                                        activeSnapshot.currentNode!.id,
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

                      <div className="mt-6 rounded-xl border border-indigo-200/70 bg-white/80 p-4 dark:border-indigo-300/15 dark:bg-neutral-900/40">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          Next branch
                        </p>
                        {!activeSnapshot.canAdvance ? (
                          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                            Complete all current tasks to unlock the next node options.
                          </p>
                        ) : activeSnapshot.nextNodeOptions.length === 0 ? (
                          <button
                            onClick={() => handleAdvance()}
                            disabled={advancingRoadmapId === activeSnapshot.roadmapId}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
                          >
                            <CheckCircle weight="bold" className="h-3.5 w-3.5" />
                            Finish roadmap run
                          </button>
                        ) : activeSnapshot.nextNodeOptions.length === 1 ? (
                          <button
                            onClick={() =>
                              handleAdvance(activeSnapshot.nextNodeOptions[0].id)
                            }
                            disabled={advancingRoadmapId === activeSnapshot.roadmapId}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                          >
                            <ArrowRight weight="bold" className="h-3.5 w-3.5" />
                            Proceed to {activeSnapshot.nextNodeOptions[0].label}
                          </button>
                        ) : (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {activeSnapshot.nextNodeOptions.map((node) => (
                              <button
                                key={node.id}
                                onClick={() => handleAdvance(node.id)}
                                disabled={advancingRoadmapId === activeSnapshot.roadmapId}
                                className="rounded-lg border border-indigo-200/70 bg-indigo-50/70 px-3 py-2 text-left text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-300/20 dark:bg-indigo-900/20 dark:text-indigo-200 dark:hover:bg-indigo-900/35 disabled:opacity-60"
                              >
                                Continue via {node.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-indigo-300/60 bg-indigo-50/35 px-8 text-center dark:border-indigo-300/20 dark:bg-indigo-900/10">
                  <Target weight="thin" className="h-14 w-14 text-indigo-400/70" />
                  <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {activeRoadmap.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Start or continue this roadmap to unlock node-by-node task progression.
                  </p>
                  <button
                    onClick={() => handleStartOrContinue(activeRoadmap.id)}
                    disabled={loadingRoadmapId === activeRoadmap.id}
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    <PlayCircle weight="bold" className="h-4 w-4" />
                    Start progression
                  </button>
                </div>
              )
            ) : (
              <div className="flex h-full min-h-[360px] items-center justify-center rounded-xl border border-dashed border-indigo-300/60 bg-indigo-50/35 px-8 text-center text-sm text-slate-500 dark:border-indigo-300/20 dark:bg-indigo-900/10 dark:text-slate-400">
                Select a roadmap to manage progress.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
