/**
 * Prisma-backed implementation of RoadmapRepository.
 *
 * This is the ONLY file that imports from `@prisma/client` for roadmap
 * persistence. All consumers depend on the interface in `roadmap-repository.ts`.
 */

import type { PrismaClient, Visibility } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  slugify,
  type CreateRoadmapParams,
  type RoadmapDetail,
  type RoadmapGraph,
  type RoadmapRepository,
  type RoadmapSummary,
  type UpdateGraphParams,
} from "./roadmap-repository";

// ───────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────

/** Type-safe cast of Prisma Json to our domain graph type. */
function toGraph(json: unknown): RoadmapGraph {
  const g = json as RoadmapGraph;
  return {
    nodes: Array.isArray(g?.nodes) ? g.nodes : [],
    edges: Array.isArray(g?.edges) ? g.edges : [],
  };
}

function toDetail(row: {
  id: string;
  title: string;
  slug: string;
  visibility: Visibility;
  graph: unknown;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapDetail {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    visibility: row.visibility,
    graph: toGraph(row.graph),
    ownerId: row.ownerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSummary(row: {
  id: string;
  title: string;
  slug: string;
  visibility: Visibility;
  graph: unknown;
  createdAt: Date;
  updatedAt: Date;
}): RoadmapSummary {
  const g = toGraph(row.graph);
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    visibility: row.visibility,
    nodeCount: g.nodes.length,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ───────────────────────────────────────────
// Implementation
// ───────────────────────────────────────────

export class PrismaRoadmapRepository implements RoadmapRepository {
  constructor(private readonly db: PrismaClient) {}

  async createRoadmap(params: CreateRoadmapParams): Promise<RoadmapDetail> {
    const slug = slugify(params.title);
    const row = await this.db.roadmap.create({
      data: {
        title: params.title,
        slug,
        visibility: params.visibility ?? "PRIVATE",
        graph: params.graph as unknown as Prisma.InputJsonValue,
        ownerId: params.ownerId,
      },
    });
    return toDetail(row);
  }

  async updateGraph(params: UpdateGraphParams): Promise<RoadmapDetail> {
    const row = await this.db.roadmap.update({
      where: { id: params.id },
      data: {
        graph: params.graph as unknown as Prisma.InputJsonValue,
      },
    });
    return toDetail(row);
  }

  async updateTitle(id: string, title: string): Promise<RoadmapDetail> {
    const row = await this.db.roadmap.update({
      where: { id },
      data: {
        title,
        slug: slugify(title),
      },
    });
    return toDetail(row);
  }

  async updateVisibility(
    id: string,
    visibility: Visibility,
  ): Promise<RoadmapDetail> {
    const row = await this.db.roadmap.update({
      where: { id },
      data: { visibility },
    });
    return toDetail(row);
  }

  async listByOwner(
    ownerId: string,
    limit: number = 20,
  ): Promise<RoadmapSummary[]> {
    const rows = await this.db.roadmap.findMany({
      where: { ownerId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
    return rows.map(toSummary);
  }

  async getById(id: string): Promise<RoadmapDetail | null> {
    const row = await this.db.roadmap.findUnique({ where: { id } });
    return row ? toDetail(row) : null;
  }

  async deleteRoadmap(id: string): Promise<void> {
    await this.db.roadmap.delete({ where: { id } });
  }
}
