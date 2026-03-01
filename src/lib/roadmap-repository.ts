/**
 * Roadmap Repository — persistence interface & Prisma implementation.
 *
 * The interface is intentionally decoupled from Prisma so the storage
 * backend can be swapped (e.g. to a KV store or in-memory adapter for tests)
 * without touching any consumer code.
 */

import type { Visibility } from "@prisma/client";

// ───────────────────────────────────────────
// Domain types  (storage-agnostic)
// ───────────────────────────────────────────

/** A single node in the roadmap graph (mirrors ReactFlow + app enrichment). */
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    description: string;
    detailedDescription: string;
    timeEstimate: string;
    nextSteps?: string[];
    tasks?: string[];
    references?: Array<{
      title: string;
      url: string;
      snippet: string;
      relevance: string;
    }>;
    successStories?: Array<{
      person: string;
      achievement: string;
      summary: string;
      sourceUrl: string;
      afterNode: string;
    }>;
    [key: string]: unknown; // forward-compat for future data fields
  };
}

/** A single edge in the roadmap graph. */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

/** The full graph document stored in the `graph` JSON column. */
export interface RoadmapGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ───────────────────────────────────────────
// Read projections
// ───────────────────────────────────────────

/** Lightweight summary for list views (dashboard). */
export interface RoadmapSummary {
  id: string;
  title: string;
  slug: string;
  visibility: Visibility;
  nodeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Full detail for the roadmap view page. */
export interface RoadmapDetail {
  id: string;
  title: string;
  slug: string;
  visibility: Visibility;
  graph: RoadmapGraph;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

// ───────────────────────────────────────────
// Write params
// ───────────────────────────────────────────

export interface CreateRoadmapParams {
  title: string;
  graph: RoadmapGraph;
  ownerId: string;
  visibility?: Visibility;
}

export interface UpdateGraphParams {
  id: string;
  graph: RoadmapGraph;
}

// ───────────────────────────────────────────
// Repository interface
// ───────────────────────────────────────────

export interface RoadmapRepository {
  /** Persist a new roadmap and return its full detail. */
  createRoadmap(params: CreateRoadmapParams): Promise<RoadmapDetail>;

  /** Replace the graph snapshot for an existing roadmap. */
  updateGraph(params: UpdateGraphParams): Promise<RoadmapDetail>;

  /** Update the title (also regenerates the slug). */
  updateTitle(id: string, title: string): Promise<RoadmapDetail>;

  /** Toggle visibility between PRIVATE and PUBLIC. */
  updateVisibility(id: string, visibility: Visibility): Promise<RoadmapDetail>;

  /** List roadmaps owned by the given user, ordered by last updated. */
  listByOwner(ownerId: string, limit?: number): Promise<RoadmapSummary[]>;

  /** Fetch a roadmap by its cuid. Returns null if not found. */
  getById(id: string): Promise<RoadmapDetail | null>;

  /** Delete a roadmap. */
  deleteRoadmap(id: string): Promise<void>;
}

// ───────────────────────────────────────────
// Slug helper
// ───────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Build the canonical URL segment for a roadmap: `{slug}--{id}`.
 * The id suffix guarantees uniqueness while the slug keeps URLs readable.
 */
export function toSlugId(slug: string, id: string): string {
  return `${slug}--${id}`;
}

/** Parse a `{slug}--{id}` segment back into its parts. */
export function parseSlugId(slugId: string): { slug: string; id: string } | null {
  const idx = slugId.lastIndexOf("--");
  if (idx === -1) return null;
  return {
    slug: slugId.slice(0, idx),
    id: slugId.slice(idx + 2),
  };
}
