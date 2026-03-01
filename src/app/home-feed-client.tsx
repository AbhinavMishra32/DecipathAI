"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  ChatCircle,
  Copy,
  Heart,
  House,
  SignIn,
  Sparkle,
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

function MiniRoadmapPreview({
  nodes,
  edges,
}: {
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ source: string; target: string }>;
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
    <div className="overflow-hidden rounded-xl border border-indigo-200/70 bg-gradient-to-b from-white to-indigo-50/60 p-3 dark:border-indigo-300/15 dark:from-neutral-900/55 dark:to-indigo-900/20">
      <svg viewBox="0 0 100 70" className="h-36 w-full rounded-lg bg-white/80 dark:bg-neutral-950/45">
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
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          );
        })}

        {normalized.points.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="3"
              fill="rgba(99,102,241,0.95)"
            />
            <text
              x={Math.min(94, node.x + 2.4)}
              y={Math.max(4, node.y - 3.2)}
              fontSize="2.4"
              fill="rgba(71,85,105,0.95)"
            >
              {node.label.length > 13 ? `${node.label.slice(0, 13)}…` : node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function HomeFeedClient({ posts, currentUser }: HomeFeedClientProps) {
  const [items, setItems] = useState(posts);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

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
                ].slice(0, 5),
              }
            : item,
        ),
      );

      setCommentDrafts((prev) => ({ ...prev, [roadmapId]: "" }));
      setExpandedComments((prev) => ({ ...prev, [roadmapId]: true }));
    });
  };

  return (
    <main className={`${hubotSans.className} min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white`}>
      <div className="mx-auto grid min-h-screen w-full max-w-[100rem] gap-0 px-0 lg:grid-cols-[17.5rem,1fr]">
        <aside className="border-b border-indigo-300/20 bg-neutral-900/85 px-4 py-5 backdrop-blur-sm lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
          <div className="mb-4 flex items-center gap-2">
            <div className="rounded-lg border border-indigo-300/35 bg-indigo-500/15 p-2">
              <House className="h-4 w-4 text-indigo-200" weight="duotone" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Decipath Feed</p>
              <p className="text-xs text-indigo-200/80">Home is default</p>
            </div>
          </div>

          {currentUser ? (
            <div className="mb-4 rounded-xl border border-indigo-300/25 bg-indigo-500/10 px-3 py-2 text-xs text-indigo-100">
              Signed in as @{currentUser.username}
            </div>
          ) : (
            <Link
              href="/signin"
              className="mb-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-indigo-300/35 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20"
            >
              <SignIn weight="bold" className="h-3.5 w-3.5" />
              Sign in
            </Link>
          )}

          <div className="space-y-2">
            <Link
              href="/feed"
              className="inline-flex w-full items-center gap-1.5 rounded-lg border border-indigo-300/30 bg-indigo-500/15 px-3 py-2 text-xs font-semibold text-indigo-100"
            >
              <House weight="duotone" className="h-3.5 w-3.5" />
              Home Feed
            </Link>
            <Link
              href="/roadmaps"
              className="inline-flex w-full items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
              Dashboard
            </Link>
          </div>

          <div className="mt-5 rounded-xl border border-indigo-300/20 bg-neutral-950/50 p-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-indigo-200/85">Community actions</p>
            <p className="mt-1 text-xs text-neutral-300">Like, comment, and save any public roadmap as your own private copy.</p>
          </div>
        </aside>

        <div className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">
          <section className="mb-6 rounded-2xl border border-indigo-300/20 bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-200/85">Home feed</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            Explore public roadmaps from the community
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-neutral-300">
            View real roadmap structures, like and comment, and save any roadmap as your own private copy with creator attribution.
          </p>
          </section>

          {!hasPosts ? (
            <div className="rounded-2xl border border-dashed border-indigo-300/25 bg-neutral-900/45 p-10 text-center text-sm text-neutral-300">
              No public roadmaps yet. Once users publish roadmaps, they will appear here.
            </div>
          ) : (
            <div className="space-y-5">
              {items.map((post) => {
                const showAllComments = expandedComments[post.roadmapId] ?? false;
                const commentsToShow = showAllComments ? post.comments : post.comments.slice(0, 2);

                return (
                  <article
                    key={post.roadmapId}
                    className="rounded-2xl border border-indigo-300/20 bg-neutral-900/50 p-4 shadow-[0_16px_50px_-36px_rgba(99,102,241,0.65)] backdrop-blur-sm sm:p-5"
                  >
                    <div className="grid gap-5 xl:grid-cols-[1.6fr,1fr]">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full border border-indigo-300/30 bg-indigo-500/10 px-2.5 py-1 text-indigo-100">
                            by @{post.creator.username}
                          </span>
                          <span className="rounded-full border border-neutral-700 bg-neutral-800/70 px-2.5 py-1 text-neutral-300">
                            {timeAgo(post.createdAt)}
                          </span>
                          <span className="rounded-full border border-neutral-700 bg-neutral-800/70 px-2.5 py-1 text-neutral-300">
                            {post.nodeCount} nodes
                          </span>
                        </div>

                        <h2 className="text-lg font-semibold text-white sm:text-xl">{post.title}</h2>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => likePost(post.roadmapId)}
                            disabled={!currentUser || isPending}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                              post.likedByMe
                                ? "border-pink-300/45 bg-pink-500/20 text-pink-100"
                                : "border-indigo-300/30 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
                            } disabled:opacity-60`}
                          >
                            <Heart weight={post.likedByMe ? "fill" : "bold"} className="h-3.5 w-3.5" />
                            Like ({post.likeCount})
                          </button>

                          <button
                            onClick={() => saveCopy(post.roadmapId)}
                            disabled={!currentUser || isPending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20 disabled:opacity-60"
                          >
                            <Copy weight="bold" className="h-3.5 w-3.5" />
                            {post.savedByMe ? `Saved (${post.saveCount})` : `Save copy (${post.saveCount})`}
                          </button>

                          <Link
                            href={`/roadmaps/${post.slugId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500"
                          >
                            <ArrowSquareOut weight="bold" className="h-3.5 w-3.5" />
                            View map
                          </Link>

                          {post.savedRoadmapSlugId && (
                            <Link
                              href={`/roadmaps/${post.savedRoadmapSlugId}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25"
                            >
                              <Sparkle weight="duotone" className="h-3.5 w-3.5" />
                              Open saved copy
                            </Link>
                          )}
                        </div>

                        <div className="mt-4 rounded-xl border border-indigo-300/20 bg-neutral-950/55 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-semibold text-neutral-200">Comments ({post.commentCount})</p>
                            {post.comments.length > 2 && (
                              <button
                                onClick={() =>
                                  setExpandedComments((prev) => ({
                                    ...prev,
                                    [post.roadmapId]: !showAllComments,
                                  }))
                                }
                                className="text-xs text-indigo-200 transition hover:text-indigo-100"
                              >
                                {showAllComments ? "Show less" : "Show more"}
                              </button>
                            )}
                          </div>

                          <div className="space-y-2">
                            {commentsToShow.length === 0 ? (
                              <p className="text-xs text-neutral-400">No comments yet.</p>
                            ) : (
                              commentsToShow.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="rounded-lg border border-neutral-700 bg-neutral-900/65 px-3 py-2"
                                >
                                  <p className="text-[11px] text-indigo-200">@{comment.user.username}</p>
                                  <p className="mt-1 text-xs text-neutral-200">{comment.content}</p>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="mt-3 flex gap-2">
                            <input
                              value={commentDrafts[post.roadmapId] ?? ""}
                              onChange={(event) =>
                                setCommentDrafts((prev) => ({
                                  ...prev,
                                  [post.roadmapId]: event.target.value,
                                }))
                              }
                              placeholder={
                                currentUser
                                  ? "Add a comment"
                                  : "Sign in to comment"
                              }
                              disabled={!currentUser || isPending}
                              className="h-9 flex-1 rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 text-xs text-white outline-none ring-indigo-400/30 placeholder:text-neutral-500 focus:ring"
                            />
                            <button
                              onClick={() => submitComment(post.roadmapId)}
                              disabled={!currentUser || isPending}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                            >
                              <ChatCircle weight="bold" className="h-3.5 w-3.5" />
                              Post
                            </button>
                          </div>
                        </div>
                      </div>

                      <MiniRoadmapPreview
                        nodes={post.graphPreview.nodes}
                        edges={post.graphPreview.edges}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
