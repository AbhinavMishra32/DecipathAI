"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  ChatCircle,
  Copy,
  Heart,
  Play,
  SignIn,
  Sparkle,
  X,
} from "@phosphor-icons/react";
import {
  addRoadmapComment,
  savePublicRoadmapToLibrary,
  toggleRoadmapLike,
} from "@/actions/roadmap-feed";
import { hubotSans } from "@/lib/fonts";

type FeedComment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
};

type FeedPost = {
  roadmapId: string;
  title: string;
  slugId: string;
  creator: {
    id: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  likeCount: number;
  commentCount: number;
  saveCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  savedRoadmapSlugId: string | null;
  graphPreview: {
    nodes: Array<{ id: string; label: string; x: number; y: number }>;
    edges: Array<{ source: string; target: string }>;
  };
  graphFull: {
    nodes: Array<{ id: string; label: string; x: number; y: number }>;
    edges: Array<{ source: string; target: string }>;
  };
  comments: FeedComment[];
};

interface HomeFeedClientProps {
  posts: FeedPost[];
  currentUser: {
    id: string;
    username: string;
  } | null;
}

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

function RoadmapCanvas({
  nodes,
  edges,
  large = false,
}: {
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ source: string; target: string }>;
  large?: boolean;
}) {
  const normalized = useMemo(() => {
    if (nodes.length === 0) {
      return {
        points: [] as Array<{ id: string; label: string; x: number; y: number }>,
      };
    }

    const xs = nodes.map((node) => node.x);
    const ys = nodes.map((node) => node.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    return {
      points: nodes.map((node) => ({
        ...node,
        x: ((node.x - minX) / width) * 88 + 6,
        y: ((node.y - minY) / height) * 58 + 6,
      })),
    };
  }, [nodes]);

  const pointById = useMemo(
    () => new Map(normalized.points.map((point) => [point.id, point])),
    [normalized.points],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-200/70 bg-gradient-to-b from-white to-indigo-50/70 p-3 dark:border-indigo-300/15 dark:from-neutral-900/60 dark:to-indigo-900/20">
      <svg viewBox="0 0 100 70" className={`w-full rounded-lg bg-white/85 dark:bg-neutral-950/50 ${large ? "h-64" : "h-48"}`}>
        {edges.map((edge, index) => {
          const source = pointById.get(edge.source);
          const target = pointById.get(edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={`${edge.source}-${edge.target}-${index}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="rgba(99,102,241,0.55)"
              strokeWidth={large ? "1.1" : "1"}
              strokeLinecap="round"
            />
          );
        })}

        {normalized.points.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={large ? "2.3" : "2"} fill="rgba(99,102,241,0.95)" />
            {large && (
              <text
                x={Math.min(94, node.x + 2.2)}
                y={Math.max(4, node.y - 2.8)}
                fontSize="2"
                fill="rgba(71,85,105,0.95)"
              >
                {node.label.length > 16 ? `${node.label.slice(0, 16)}…` : node.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function HomeFeedClient({ posts, currentUser }: HomeFeedClientProps) {
  const [items, setItems] = useState(posts);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);

  const selectedPost = useMemo(
    () => items.find((item) => item.roadmapId === selectedRoadmapId) ?? null,
    [items, selectedRoadmapId],
  );

  const hasPosts = items.length > 0;

  const likePost = (roadmapId: string) => {
    if (!currentUser) return;

    startTransition(async () => {
      const result = await toggleRoadmapLike({ roadmapId });
      if (!result.success) return;

      setItems((prev) =>
        prev.map((item) =>
          item.roadmapId === roadmapId
            ? {
                ...item,
                likedByMe: result.data.liked,
                likeCount: result.data.likeCount,
              }
            : item,
        ),
      );
    });
  };

  const saveCopy = (roadmapId: string) => {
    if (!currentUser) return;

    startTransition(async () => {
      const result = await savePublicRoadmapToLibrary({ roadmapId });
      if (!result.success) return;

      setItems((prev) =>
        prev.map((item) =>
          item.roadmapId === roadmapId
            ? {
                ...item,
                savedByMe: true,
                saveCount: result.data.saveCount,
                savedRoadmapSlugId: result.data.savedRoadmapSlugId,
              }
            : item,
        ),
      );
    });
  };

  const submitComment = (roadmapId: string) => {
    if (!currentUser) return;

    const content = (commentDrafts[roadmapId] ?? "").trim();
    if (!content) return;

    startTransition(async () => {
      const result = await addRoadmapComment({ roadmapId, content });
      if (!result.success) return;

      setItems((prev) =>
        prev.map((item) =>
          item.roadmapId === roadmapId
            ? {
                ...item,
                commentCount: result.data.commentCount,
                comments: [
                  {
                    id: result.data.id,
                    content: result.data.content,
                    createdAt: result.data.createdAt,
                    user: result.data.user,
                  },
                  ...item.comments,
                ].slice(0, 8),
              }
            : item,
        ),
      );

      setCommentDrafts((prev) => ({ ...prev, [roadmapId]: "" }));
    });
  };

  return (
    <main className={`${hubotSans.className} min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white`}>
      <div className="mx-auto w-full max-w-[1300px] px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[2rem] border border-neutral-200 bg-white/75 p-6 shadow-[0_24px_70px_-45px_rgba(79,70,229,0.8)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/65 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300/85">Community Roadmaps</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Discover roadmaps from the community</h1>
          <p className="mt-3 max-w-3xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            Browse public roadmap cards, open any roadmap in a rich detail modal, then jump to the full roadmap page.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-3 py-1 text-indigo-700 dark:border-indigo-300/35 dark:text-indigo-200">Roadmap previews</span>
            <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-3 py-1 text-indigo-700 dark:border-indigo-300/35 dark:text-indigo-200">Creator spotlight</span>
            <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-3 py-1 text-indigo-700 dark:border-indigo-300/35 dark:text-indigo-200">Save to library</span>
          </div>
        </section>

        {!currentUser && (
          <div className="mb-6 rounded-xl border border-indigo-300/35 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-900 dark:text-indigo-100">
            <Link href="/signin" className="inline-flex items-center gap-2 font-semibold underline underline-offset-4">
              <SignIn className="h-4 w-4" weight="bold" />
              Sign in
            </Link>
            <span className="ml-2">to like, comment, and save community roadmaps.</span>
          </div>
        )}

        {!hasPosts ? (
          <div className="rounded-2xl border border-dashed border-indigo-300/30 bg-white/60 p-10 text-center text-sm text-neutral-600 dark:border-indigo-300/20 dark:bg-neutral-900/40 dark:text-neutral-300">
            No public roadmaps yet. Once creators publish, they appear here.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((post) => (
              <article
                key={post.roadmapId}
                className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white/80 shadow-[0_18px_60px_-44px_rgba(59,71,111,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_-42px_rgba(79,70,229,0.62)] dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <button
                  onClick={() => setSelectedRoadmapId(post.roadmapId)}
                  className="relative block w-full text-left"
                >
                  <RoadmapCanvas nodes={post.graphPreview.nodes} edges={post.graphPreview.edges} />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      <Play weight="fill" className="h-3.5 w-3.5" />
                      Open details
                    </span>
                  </div>
                </button>

                <div className="p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">@{post.creator.username}</p>
                  <h2 className="mt-1 line-clamp-2 text-base font-semibold text-neutral-900 dark:text-white">{post.title}</h2>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    {post.nodeCount} nodes · {post.likeCount} likes · {timeAgo(post.createdAt)}
                  </p>
                  <button
                    onClick={() => setSelectedRoadmapId(post.roadmapId)}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 transition hover:text-indigo-600 dark:text-indigo-200"
                  >
                    View roadmap details
                    <ArrowSquareOut className="h-3.5 w-3.5" weight="bold" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:p-6">
          <div className="max-h-[94vh] w-full max-w-5xl overflow-hidden rounded-[1.6rem] border border-indigo-300/35 bg-white/95 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.8)] dark:border-indigo-300/20 dark:bg-neutral-950/95">
            <div className="flex items-center justify-between border-b border-neutral-200/80 px-5 py-3 dark:border-neutral-800">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Community Roadmap</p>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{selectedPost.title}</h3>
              </div>
              <button
                onClick={() => setSelectedRoadmapId(null)}
                className="rounded-lg border border-neutral-200 bg-white p-2 text-neutral-500 transition hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4" weight="bold" />
              </button>
            </div>

            <div className="grid max-h-[calc(94vh-68px)] gap-5 overflow-y-auto p-5 lg:grid-cols-[1.35fr,0.95fr]">
              <div>
                <RoadmapCanvas large nodes={selectedPost.graphFull.nodes} edges={selectedPost.graphFull.edges} />
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-indigo-300/45 bg-indigo-500/10 px-2.5 py-1 text-indigo-700 dark:border-indigo-300/35 dark:text-indigo-200">@{selectedPost.creator.username}</span>
                  <span className="rounded-full border border-neutral-300/70 bg-neutral-100/70 px-2.5 py-1 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">{selectedPost.nodeCount} nodes</span>
                  <span className="rounded-full border border-neutral-300/70 bg-neutral-100/70 px-2.5 py-1 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">Updated {timeAgo(selectedPost.updatedAt)}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => likePost(selectedPost.roadmapId)}
                    disabled={!currentUser || isPending}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      selectedPost.likedByMe
                        ? "border-pink-300/45 bg-pink-500/20 text-pink-700 dark:text-pink-200"
                        : "border-indigo-300/45 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/20 dark:text-indigo-200"
                    } disabled:opacity-60`}
                  >
                    <Heart weight={selectedPost.likedByMe ? "fill" : "bold"} className="h-3.5 w-3.5" />
                    Like ({selectedPost.likeCount})
                  </button>

                  <button
                    onClick={() => saveCopy(selectedPost.roadmapId)}
                    disabled={!currentUser || isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300/45 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-500/20 disabled:opacity-60 dark:text-indigo-200"
                  >
                    <Copy weight="bold" className="h-3.5 w-3.5" />
                    {selectedPost.savedByMe ? `Saved (${selectedPost.saveCount})` : `Save copy (${selectedPost.saveCount})`}
                  </button>

                  <Link
                    href={`/roadmaps/${selectedPost.slugId}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                  >
                    <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                    Open full roadmap page
                  </Link>

                  {selectedPost.savedRoadmapSlugId && (
                    <Link
                      href={`/roadmaps/${selectedPost.savedRoadmapSlugId}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/45 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-200"
                    >
                      <Sparkle weight="duotone" className="h-3.5 w-3.5" />
                      Open saved copy
                    </Link>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-200 bg-white/75 p-4 dark:border-neutral-800 dark:bg-neutral-900/55">
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Comments ({selectedPost.commentCount})</p>
                <div className="mt-3 space-y-2">
                  {selectedPost.comments.length === 0 ? (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">No comments yet.</p>
                  ) : (
                    selectedPost.comments.map((comment) => (
                      <div key={comment.id} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950/60">
                        <p className="text-[11px] text-indigo-700 dark:text-indigo-300">@{comment.user.username}</p>
                        <p className="mt-1 text-xs text-neutral-700 dark:text-neutral-200">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={commentDrafts[selectedPost.roadmapId] ?? ""}
                    onChange={(event) =>
                      setCommentDrafts((prev) => ({
                        ...prev,
                        [selectedPost.roadmapId]: event.target.value,
                      }))
                    }
                    placeholder={currentUser ? "Add a comment" : "Sign in to comment"}
                    disabled={!currentUser || isPending}
                    className="h-9 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-xs text-neutral-900 outline-none ring-indigo-400/30 placeholder:text-neutral-500 focus:ring dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
                  />
                  <button
                    onClick={() => submitComment(selectedPost.roadmapId)}
                    disabled={!currentUser || isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    <ChatCircle weight="bold" className="h-3.5 w-3.5" />
                    Post
                  </button>
                </div>

                {!currentUser && (
                  <Link href="/signin" className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-indigo-700 underline underline-offset-4 dark:text-indigo-200">
                    <SignIn className="h-3.5 w-3.5" weight="bold" />
                    Sign in to interact
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
