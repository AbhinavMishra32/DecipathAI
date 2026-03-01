"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import {
  Globe,
  Lock,
  Trash,
  Plus,
  Sparkle,
  Clock,
  GitBranch,
  ArrowSquareOut,
  PlayCircle,
  Target,
  CheckCircle,
} from "@phosphor-icons/react";
import { deleteRoadmap } from "@/actions/roadmap";
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
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
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
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const progressByRoadmapId = useMemo(
    () => new Map(progress.map((entry) => [entry.roadmapId, entry])),
    [progress],
  );

  const recentGenerated = useMemo(
    () =>
      [...items]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 6),
    [items],
  );

  const savedLibrary = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [items],
  );

  const activeRuns = progress.filter((entry) => entry.status === "ACTIVE").length;
  const completedRuns = progress.filter((entry) => entry.status === "COMPLETED").length;
  const avgCompletion =
    progress.length > 0
      ? Math.round(
          progress.reduce((sum, entry) => sum + entry.percentComplete, 0) /
            progress.length,
        )
      : 0;

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Delete this roadmap? This cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    const result = await deleteRoadmap({ id });
    if (result.success) {
      setItems((prev) => prev.filter((roadmap) => roadmap.id !== id));
      setProgress((prev) => prev.filter((entry) => entry.roadmapId !== id));
    }
    setDeletingId(null);
  }, []);

  if (items.length === 0) {
    return (
      <div className={`${hubotSans.className} mx-auto max-w-7xl px-6 py-14 sm:px-8`}>
        <div className="rounded-3xl border border-dashed border-indigo-200/70 bg-white/60 px-8 py-16 text-center backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/35">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Your roadmap studio is empty
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Generate your first roadmap and it will appear here in recent and saved views.
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            <Plus weight="bold" className="h-4 w-4" />
            Create roadmap
          </Link>
        </div>
      </div>
    );
  }

  const featured = recentGenerated[0] ?? null;

  return (
    <div className={`${hubotSans.className} mx-auto max-w-[92rem] px-6 py-10 sm:px-8`}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Roadmaps Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {username}. Browse recent generations and jump into saved progression.
          </p>
        </div>

        <Link
          href="/create"
          className="inline-flex items-center gap-2 rounded-xl border border-indigo-300/50 bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500 dark:border-indigo-400/30"
        >
          <Plus weight="bold" className="h-4 w-4" />
          Generate roadmap
        </Link>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-indigo-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Saved roadmaps</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{items.length}</p>
        </div>
        <div className="rounded-xl border border-indigo-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Active progress runs</p>
          <p className="mt-1 text-2xl font-semibold text-indigo-600 dark:text-indigo-300">{activeRuns}</p>
        </div>
        <div className="rounded-xl border border-indigo-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Completed runs</p>
          <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-300">{completedRuns}</p>
        </div>
        <div className="rounded-xl border border-indigo-200/70 bg-white/75 p-4 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Average completion</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{avgCompletion}%</p>
        </div>
      </div>

      {progress.length > 0 && (
        <div className="mb-8 rounded-2xl border border-indigo-200/70 bg-white/65 p-4 backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/45">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Sparkle weight="duotone" className="h-4 w-4" />
            Recently active progression
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {progress.slice(0, 4).map((entry) => (
              <Link
                key={entry.roadmapId}
                href={`/roadmaps/progress/${entry.roadmapId}`}
                className="rounded-xl border border-indigo-200/60 bg-white/80 p-3 transition hover:border-indigo-300/80 hover:bg-indigo-50/60 dark:border-indigo-300/15 dark:bg-neutral-900/40 dark:hover:bg-indigo-900/20"
              >
                <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {entry.roadmapTitle}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Current: {entry.currentNodeLabel}</p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500"
                    style={{ width: `${entry.percentComplete}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.25fr,1.75fr]">
        <section className="rounded-2xl border border-indigo-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/50">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Recently generated
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Newest creations first</span>
          </div>

          {featured && (
            <div className="mb-4 rounded-xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 to-white p-4 dark:border-indigo-300/20 dark:from-indigo-900/25 dark:to-neutral-900/60">
              <p className="text-[11px] uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Featured newest</p>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-slate-900 dark:text-white">{featured.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/70 bg-white/80 px-2 py-0.5 dark:border-indigo-300/20 dark:bg-neutral-900/50">
                  <GitBranch weight="bold" className="h-3 w-3" />
                  {featured.nodeCount} nodes
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/70 bg-white/80 px-2 py-0.5 dark:border-indigo-300/20 dark:bg-neutral-900/50">
                  <Clock weight="bold" className="h-3 w-3" />
                  {timeAgo(featured.createdAt)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/roadmaps/progress/${featured.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                >
                  <PlayCircle weight="bold" className="h-3.5 w-3.5" />
                  {progressByRoadmapId.has(featured.id) ? "Continue" : "Start progression"}
                </Link>
                <Link
                  href={`/roadmaps/${featured.slugId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
                >
                  <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                  Open map
                </Link>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {recentGenerated.slice(1).map((roadmap) => {
              const run = progressByRoadmapId.get(roadmap.id);

              return (
                <div
                  key={roadmap.id}
                  className="rounded-xl border border-indigo-200/60 bg-white/80 p-3 dark:border-indigo-300/15 dark:bg-neutral-900/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{roadmap.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Created {timeAgo(roadmap.createdAt)} • {roadmap.nodeCount} nodes
                      </p>
                    </div>
                    {run ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        <Target weight="bold" className="h-3 w-3" />
                        {run.percentComplete}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        New
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-indigo-200/70 bg-white/75 p-5 shadow-sm backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/50">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Saved roadmap library</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Continue from dedicated progression workspace</span>
          </div>

          <div className="space-y-3">
            {savedLibrary.map((roadmap) => {
              const run = progressByRoadmapId.get(roadmap.id);

              return (
                <div
                  key={roadmap.id}
                  className="rounded-xl border border-indigo-200/70 bg-white/80 p-4 transition hover:border-indigo-300/80 dark:border-indigo-300/15 dark:bg-neutral-900/45"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{roadmap.title}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        {roadmap.visibility === "PUBLIC" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                            <Globe weight="bold" className="h-3 w-3" />
                            Public
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                            <Lock weight="bold" className="h-3 w-3" />
                            Private
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/70 bg-white/80 px-2 py-0.5 text-slate-600 dark:border-indigo-300/20 dark:bg-neutral-900/50 dark:text-slate-300">
                          <GitBranch weight="bold" className="h-3 w-3" />
                          {roadmap.nodeCount} nodes
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200/70 bg-white/80 px-2 py-0.5 text-slate-600 dark:border-indigo-300/20 dark:bg-neutral-900/50 dark:text-slate-300">
                          <Clock weight="bold" className="h-3 w-3" />
                          Updated {timeAgo(roadmap.updatedAt)}
                        </span>
                        {run?.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                            <CheckCircle weight="bold" className="h-3 w-3" />
                            Completed
                          </span>
                        )}
                      </div>

                      {run && (
                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{run.completedTasks}/{run.totalTasks} tasks complete</span>
                            <span>{run.percentComplete}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-700/50">
                            <div
                              className="h-1.5 rounded-full bg-indigo-500"
                              style={{ width: `${run.percentComplete}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/roadmaps/progress/${roadmap.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                      >
                        <PlayCircle weight="bold" className="h-3.5 w-3.5" />
                        {run ? "Continue" : "Start"}
                      </Link>

                      <Link
                        href={`/roadmaps/${roadmap.slugId}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-slate-200"
                      >
                        Open
                      </Link>

                      <button
                        onClick={() => handleDelete(roadmap.id)}
                        disabled={deletingId === roadmap.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200/70 bg-white/80 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-400/30 dark:bg-neutral-900/40 dark:text-red-400"
                      >
                        <Trash weight="bold" className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
