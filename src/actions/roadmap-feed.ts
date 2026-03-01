"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { roadmapRepo } from "@/lib/roadmap-repo";
import { toSlugId } from "@/lib/roadmap-repository";
import type { RoadmapGraph } from "@/lib/roadmap-repository";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type LikeStateResult = {
  liked: boolean;
  likeCount: number;
};

type SaveStateResult = {
  saved: boolean;
  saveCount: number;
  savedRoadmapSlugId: string;
};

type CommentResult = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
  };
  commentCount: number;
};

const now = () => new Date();

const createLikeId = () => `rmlike_${crypto.randomUUID().replace(/-/g, "")}`;
const createSaveId = () => `rmsave_${crypto.randomUUID().replace(/-/g, "")}`;
const createCommentId = () => `rmcomment_${crypto.randomUUID().replace(/-/g, "")}`;

const ensurePublicRoadmapForFeed = async (roadmapId: string) => {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      title: true,
      slug: true,
      graph: true,
      visibility: true,
      ownerId: true,
      owner: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  if (!roadmap || roadmap.visibility !== "PUBLIC") {
    throw new Error("Roadmap is not publicly available");
  }

  return roadmap;
};

const readLikeCount = async (roadmapId: string): Promise<number> => {
  const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::BIGINT AS count
    FROM "RoadmapLike"
    WHERE "roadmapId" = ${roadmapId}
  `;

  return Number(rows[0]?.count ?? 0);
};

const readSaveCount = async (roadmapId: string): Promise<number> => {
  const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::BIGINT AS count
    FROM "RoadmapSave"
    WHERE "sourceRoadmapId" = ${roadmapId}
  `;

  return Number(rows[0]?.count ?? 0);
};

const readCommentCount = async (roadmapId: string): Promise<number> => {
  const rows = await prisma.$queryRaw<Array<{ count: bigint | number }>>`
    SELECT COUNT(*)::BIGINT AS count
    FROM "RoadmapComment"
    WHERE "roadmapId" = ${roadmapId}
  `;

  return Number(rows[0]?.count ?? 0);
};

export async function toggleRoadmapLike({
  roadmapId,
}: {
  roadmapId: string;
}): Promise<ActionResult<LikeStateResult>> {
  try {
    const user = await requireDbUser();
    await ensurePublicRoadmapForFeed(roadmapId);

    const existingLike = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id"
      FROM "RoadmapLike"
      WHERE "roadmapId" = ${roadmapId} AND "userId" = ${user.id}
      LIMIT 1
    `;

    const likeRow = existingLike[0];
    const liked = !likeRow;

    if (likeRow) {
      await prisma.$executeRaw`
        DELETE FROM "RoadmapLike"
        WHERE "id" = ${likeRow.id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "RoadmapLike" ("id", "roadmapId", "userId", "createdAt")
        VALUES (${createLikeId()}, ${roadmapId}, ${user.id}, ${now()})
      `;
    }

    const likeCount = await readLikeCount(roadmapId);

    revalidatePath("/");

    return {
      success: true,
      data: {
        liked,
        likeCount,
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    console.error("[toggleRoadmapLike]", err);
    return { success: false, error: "Failed to toggle like" };
  }
}

export async function savePublicRoadmapToLibrary({
  roadmapId,
}: {
  roadmapId: string;
}): Promise<ActionResult<SaveStateResult>> {
  try {
    const user = await requireDbUser();
    const source = await ensurePublicRoadmapForFeed(roadmapId);

    const existingSaveRows = await prisma.$queryRaw<
      Array<{ savedRoadmapId: string | null }>
    >`
      SELECT "savedRoadmapId"
      FROM "RoadmapSave"
      WHERE "sourceRoadmapId" = ${roadmapId} AND "userId" = ${user.id}
      LIMIT 1
    `;

    const existingSave = existingSaveRows[0];
    if (existingSave?.savedRoadmapId) {
      const existingRoadmap = await prisma.roadmap.findUnique({
        where: { id: existingSave.savedRoadmapId },
        select: { id: true, slug: true },
      });

      if (existingRoadmap) {
        const saveCount = await readSaveCount(roadmapId);
        return {
          success: true,
          data: {
            saved: true,
            saveCount,
            savedRoadmapSlugId: toSlugId(existingRoadmap.slug, existingRoadmap.id),
          },
        };
      }
    }

    const sourceGraph = source.graph as {
      nodes?: unknown[];
      edges?: unknown[];
    };

    const clonedGraph: RoadmapGraph = {
      nodes: Array.isArray(sourceGraph.nodes)
        ? (sourceGraph.nodes as RoadmapGraph["nodes"])
        : [],
      edges: Array.isArray(sourceGraph.edges)
        ? (sourceGraph.edges as RoadmapGraph["edges"])
        : [],
    };

    const clonedRoadmap = await roadmapRepo.createRoadmap({
      title: `${source.title} (from @${source.owner.username})`,
      graph: clonedGraph,
      ownerId: user.id,
      visibility: "PRIVATE",
    });

    await prisma.$executeRaw`
      INSERT INTO "RoadmapSave" (
        "id",
        "sourceRoadmapId",
        "savedRoadmapId",
        "sourceCreatorName",
        "userId",
        "createdAt"
      )
      VALUES (
        ${createSaveId()},
        ${roadmapId},
        ${clonedRoadmap.id},
        ${source.owner.username},
        ${user.id},
        ${now()}
      )
      ON CONFLICT ("userId", "sourceRoadmapId") DO NOTHING
    `;

    const saveCount = await readSaveCount(roadmapId);

    revalidatePath("/");
    revalidatePath("/roadmaps");

    return {
      success: true,
      data: {
        saved: true,
        saveCount,
        savedRoadmapSlugId: toSlugId(clonedRoadmap.slug, clonedRoadmap.id),
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    console.error("[savePublicRoadmapToLibrary]", err);
    return { success: false, error: "Failed to save roadmap" };
  }
}

export async function addRoadmapComment({
  roadmapId,
  content,
}: {
  roadmapId: string;
  content: string;
}): Promise<ActionResult<CommentResult>> {
  try {
    const user = await requireDbUser();
    await ensurePublicRoadmapForFeed(roadmapId);

    const normalized = content.trim();
    if (!normalized) {
      return { success: false, error: "Comment cannot be empty" };
    }

    if (normalized.length > 500) {
      return { success: false, error: "Comment must be under 500 characters" };
    }

    const commentId = createCommentId();
    const createdAt = now();

    await prisma.$executeRaw`
      INSERT INTO "RoadmapComment" (
        "id",
        "roadmapId",
        "userId",
        "content",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        ${commentId},
        ${roadmapId},
        ${user.id},
        ${normalized},
        ${createdAt},
        ${createdAt}
      )
    `;

    const commentCount = await readCommentCount(roadmapId);

    revalidatePath("/");

    return {
      success: true,
      data: {
        id: commentId,
        content: normalized,
        createdAt: createdAt.toISOString(),
        user: {
          id: user.id,
          username: user.username,
        },
        commentCount,
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    console.error("[addRoadmapComment]", err);
    return { success: false, error: "Failed to add comment" };
  }
}
