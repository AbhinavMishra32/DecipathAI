import { Prisma } from "@prisma/client";
import { getDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toSlugId } from "@/lib/roadmap-repository";
import HomeFeedClient from "./home-feed-client";

const FEED_LIMIT = 20;

type CountRow = {
  roadmapId: string;
  count: bigint | number;
};

type CommentRow = {
  id: string;
  roadmapId: string;
  content: string;
  createdAt: Date;
  userId: string;
  username: string;
  rn: number;
};

type LikeUserRow = {
  roadmapId: string;
};

type SaveUserRow = {
  sourceRoadmapId: string;
  savedRoadmapId: string | null;
  savedRoadmapSlug: string | null;
};

export default async function HomePage() {
  const currentUser = await getDbUser();

  const publicRoadmaps = await prisma.roadmap.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    take: FEED_LIMIT,
    select: {
      id: true,
      title: true,
      slug: true,
      graph: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });

  const roadmapIds = publicRoadmaps.map((roadmap) => roadmap.id);

  const [likeCounts, commentCounts, saveCounts, topComments, likedByMe, savedByMe] =
    roadmapIds.length === 0
      ? [[], [], [], [], [], []]
      : await Promise.all([
          prisma.$queryRaw<CountRow[]>(Prisma.sql`
            SELECT "roadmapId", COUNT(*)::BIGINT AS count
            FROM "RoadmapLike"
            WHERE "roadmapId" IN (${Prisma.join(roadmapIds)})
            GROUP BY "roadmapId"
          `),
          prisma.$queryRaw<CountRow[]>(Prisma.sql`
            SELECT "roadmapId", COUNT(*)::BIGINT AS count
            FROM "RoadmapComment"
            WHERE "roadmapId" IN (${Prisma.join(roadmapIds)})
            GROUP BY "roadmapId"
          `),
          prisma.$queryRaw<CountRow[]>(Prisma.sql`
            SELECT "sourceRoadmapId" AS "roadmapId", COUNT(*)::BIGINT AS count
            FROM "RoadmapSave"
            WHERE "sourceRoadmapId" IN (${Prisma.join(roadmapIds)})
            GROUP BY "sourceRoadmapId"
          `),
          prisma.$queryRaw<CommentRow[]>(Prisma.sql`
            SELECT *
            FROM (
              SELECT
                c."id",
                c."roadmapId",
                c."content",
                c."createdAt",
                u."id" AS "userId",
                u."username",
                ROW_NUMBER() OVER (PARTITION BY c."roadmapId" ORDER BY c."createdAt" DESC) AS rn
              FROM "RoadmapComment" c
              INNER JOIN "User" u ON u."id" = c."userId"
              WHERE c."roadmapId" IN (${Prisma.join(roadmapIds)})
            ) ranked
            WHERE ranked.rn <= 5
            ORDER BY ranked."roadmapId", ranked."createdAt" DESC
          `),
          currentUser
            ? prisma.$queryRaw<LikeUserRow[]>(Prisma.sql`
                SELECT "roadmapId"
                FROM "RoadmapLike"
                WHERE "userId" = ${currentUser.id}
                AND "roadmapId" IN (${Prisma.join(roadmapIds)})
              `)
            : Promise.resolve([]),
          currentUser
            ? prisma.$queryRaw<SaveUserRow[]>(Prisma.sql`
                SELECT
                  s."sourceRoadmapId",
                  s."savedRoadmapId",
                  r."slug" AS "savedRoadmapSlug"
                FROM "RoadmapSave" s
                LEFT JOIN "Roadmap" r ON r."id" = s."savedRoadmapId"
                WHERE s."userId" = ${currentUser.id}
                AND s."sourceRoadmapId" IN (${Prisma.join(roadmapIds)})
              `)
            : Promise.resolve([]),
        ]);

  const likeCountByRoadmapId = new Map(
    likeCounts.map((row) => [row.roadmapId, Number(row.count)]),
  );
  const commentCountByRoadmapId = new Map(
    commentCounts.map((row) => [row.roadmapId, Number(row.count)]),
  );
  const saveCountByRoadmapId = new Map(
    saveCounts.map((row) => [row.roadmapId, Number(row.count)]),
  );

  const commentsByRoadmapId = new Map<
    string,
    Array<{
      id: string;
      content: string;
      createdAt: string;
      user: {
        id: string;
        username: string;
      };
    }>
  >();

  topComments.forEach((row) => {
    const existing = commentsByRoadmapId.get(row.roadmapId) ?? [];
    existing.push({
      id: row.id,
      content: row.content,
      createdAt: row.createdAt.toISOString(),
      user: {
        id: row.userId,
        username: row.username,
      },
    });
    commentsByRoadmapId.set(row.roadmapId, existing);
  });

  const likedRoadmapIdSet = new Set(likedByMe.map((row) => row.roadmapId));
  const savedByRoadmapId = new Map(
    savedByMe.map((row) => [
      row.sourceRoadmapId,
      {
        savedRoadmapId: row.savedRoadmapId,
        savedRoadmapSlug: row.savedRoadmapSlug,
      },
    ]),
  );

  const posts = publicRoadmaps.map((roadmap) => {
    const graph = (roadmap.graph ?? {}) as {
      nodes?: Array<{
        id: string;
        position?: { x?: number; y?: number };
        data?: { label?: string };
      }>;
      edges?: Array<{ source: string; target: string }>;
    };

    const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
    const edges = Array.isArray(graph.edges) ? graph.edges : [];

    const savedRecord = savedByRoadmapId.get(roadmap.id);

    return {
      roadmapId: roadmap.id,
      title: roadmap.title,
      slugId: toSlugId(roadmap.slug, roadmap.id),
      creator: {
        id: roadmap.owner.id,
        username: roadmap.owner.username,
      },
      createdAt: roadmap.createdAt.toISOString(),
      updatedAt: roadmap.updatedAt.toISOString(),
      nodeCount: nodes.length,
      likeCount: likeCountByRoadmapId.get(roadmap.id) ?? 0,
      commentCount: commentCountByRoadmapId.get(roadmap.id) ?? 0,
      saveCount: saveCountByRoadmapId.get(roadmap.id) ?? 0,
      likedByMe: likedRoadmapIdSet.has(roadmap.id),
      savedByMe: Boolean(savedRecord?.savedRoadmapId),
      savedRoadmapSlugId:
        savedRecord?.savedRoadmapId && savedRecord.savedRoadmapSlug
          ? toSlugId(savedRecord.savedRoadmapSlug, savedRecord.savedRoadmapId)
          : null,
      graphPreview: {
        nodes: nodes.slice(0, 12).map((node) => ({
          id: node.id,
          label: node.data?.label ?? node.id,
          x: typeof node.position?.x === "number" ? node.position.x : 0,
          y: typeof node.position?.y === "number" ? node.position.y : 0,
        })),
        edges: edges.slice(0, 18).map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      },
      comments: commentsByRoadmapId.get(roadmap.id) ?? [],
    };
  });

  return (
    <HomeFeedClient
      posts={posts}
      currentUser={
        currentUser
          ? {
              id: currentUser.id,
              username: currentUser.username,
            }
          : null
      }
    />
  );
}
