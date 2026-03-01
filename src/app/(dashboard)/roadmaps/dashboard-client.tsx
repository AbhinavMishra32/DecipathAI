"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Lock,
  Trash,
  Plus,
  MapTrifold,
  Clock,
  GitBranch,
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
  username: string;
}

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
  username,
}: DashboardClientProps) {
  const router = useRouter();
  const [items, setItems] = useState(roadmaps);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm("Delete this roadmap? This cannot be undone.")) return;

      setDeletingId(id);
      const result = await deleteRoadmap({ id });
      if (result.success) {
        setItems((prev) => prev.filter((r) => r.id !== id));
      }
      setDeletingId(null);
    },
    [],
  );

  return (
    <div
      className={`${hubotSans.className} mx-auto max-w-5xl px-6 py-20 sm:px-8`}
    >
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Your roadmaps
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {username}
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((roadmap) => (
            <Link
              key={roadmap.id}
              href={`/roadmaps/${roadmap.slugId}`}
              className="group relative flex flex-col rounded-2xl border border-indigo-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm transition hover:border-indigo-300/80 hover:shadow-md dark:border-indigo-300/15 dark:bg-neutral-900/50 dark:hover:border-indigo-400/30"
            >
              {/* Delete button */}
              <button
                onClick={(e) => handleDelete(roadmap.id, e)}
                disabled={deletingId === roadmap.id}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                aria-label="Delete roadmap"
              >
                <Trash weight="bold" className="h-4 w-4" />
              </button>

              {/* Title */}
              <h3 className="line-clamp-2 pr-8 text-base font-semibold text-slate-900 dark:text-white">
                {roadmap.title}
              </h3>

              {/* Info row */}
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

              {/* Visibility badge */}
              <div className="mt-auto pt-4">
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
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
