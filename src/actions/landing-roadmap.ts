"use server";

import { prisma } from "@/lib/db";

/**
 * Fetch a simplified roadmap for the landing page preview.
 * Searches for a "software engineer" roadmap by title, falls back to any public roadmap.
 * Returns a branch-heavy subset of nodes and connecting edges.
 */

interface LandingNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    icon?: string;
    description: string;
    timeEstimate: string;
    tasks: string[];
    references: { url: string }[];
    isHighlighted?: boolean;
  };
}

interface LandingEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  style: { stroke: string; strokeWidth: number };
}

export interface LandingRoadmapData {
  nodes: LandingNode[];
  edges: LandingEdge[];
}

const MAX_NODES = 10;

type RawNode = {
  id: string;
  type?: string;
  position?: { x?: number; y?: number };
  data?: {
    label?: string;
    icon?: string;
    description?: string;
    timeEstimate?: string;
    tasks?: string[];
    references?: Array<{ url?: string; title?: string }>;
  };
};

type RawEdge = {
  id?: string;
  source: string;
  target: string;
  type?: string;
  style?: { stroke?: string; strokeWidth?: number };
};

export async function getLandingRoadmap(): Promise<LandingRoadmapData | null> {
  try {
    // Try to find a software engineer roadmap first, fall back to any public roadmap
    let roadmap = await prisma.roadmap.findFirst({
      where: {
        title: { contains: "software engineer", mode: "insensitive" },
      },
      select: { graph: true },
      orderBy: { createdAt: "desc" },
    });

    if (!roadmap) {
      roadmap = await prisma.roadmap.findFirst({
        where: { visibility: "PUBLIC" },
        select: { graph: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!roadmap || !roadmap.graph) {
      return null;
    }

    const graph = roadmap.graph as { nodes?: unknown[]; edges?: unknown[] };
    const rawNodes = (Array.isArray(graph.nodes) ? graph.nodes : []) as RawNode[];
    const rawEdges = (Array.isArray(graph.edges) ? graph.edges : []) as RawEdge[];

    if (rawNodes.length === 0) {
      return null;
    }

    const nodeById = new Map(rawNodes.map((node) => [node.id, node]));
    const outgoingBySource = new Map<string, RawEdge[]>();
    const inDegree = new Map<string, number>();
    const outDegree = new Map<string, number>();

    rawNodes.forEach((node) => {
      inDegree.set(node.id, 0);
      outDegree.set(node.id, 0);
      outgoingBySource.set(node.id, []);
    });

    rawEdges.forEach((edge) => {
      if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
        return;
      }

      const outgoing = outgoingBySource.get(edge.source) ?? [];
      outgoing.push(edge);
      outgoingBySource.set(edge.source, outgoing);

      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      outDegree.set(edge.source, (outDegree.get(edge.source) ?? 0) + 1);
    });

    const roots = rawNodes
      .filter((node) => (inDegree.get(node.id) ?? 0) === 0)
      .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

    const branchingSeed = [...rawNodes].sort((a, b) => {
      const outA = outDegree.get(a.id) ?? 0;
      const outB = outDegree.get(b.id) ?? 0;
      if (outB !== outA) return outB - outA;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    })[0];

    const primaryRoot = branchingSeed ?? roots[0] ?? rawNodes[0];
    const selectedNodeIds = new Set<string>();
    const queue: string[] = [primaryRoot.id];

    while (queue.length > 0 && selectedNodeIds.size < MAX_NODES) {
      const currentId = queue.shift() as string;
      if (selectedNodeIds.has(currentId)) {
        continue;
      }

      selectedNodeIds.add(currentId);

      const outgoing = [...(outgoingBySource.get(currentId) ?? [])]
        .sort((a, b) => {
          const outA = outDegree.get(a.target) ?? 0;
          const outB = outDegree.get(b.target) ?? 0;
          if (outB !== outA) return outB - outA;

          const ay = nodeById.get(a.target)?.position?.y ?? 0;
          const by = nodeById.get(b.target)?.position?.y ?? 0;
          return ay - by;
        })
        .slice(0, 3);

      outgoing.forEach((edge) => {
        if (!selectedNodeIds.has(edge.target)) {
          queue.push(edge.target);
        }
      });
    }

    if (selectedNodeIds.size < MAX_NODES) {
      const extraCandidates = [...rawNodes].sort((a, b) => {
        const degreeA = (inDegree.get(a.id) ?? 0) + (outDegree.get(a.id) ?? 0);
        const degreeB = (inDegree.get(b.id) ?? 0) + (outDegree.get(b.id) ?? 0);
        if (degreeB !== degreeA) return degreeB - degreeA;
        return (a.position?.x ?? 0) - (b.position?.x ?? 0);
      });

      for (const candidate of extraCandidates) {
        if (selectedNodeIds.size >= MAX_NODES) {
          break;
        }
        selectedNodeIds.add(candidate.id);
      }
    }

    const selectedNodes = rawNodes.filter((node) => selectedNodeIds.has(node.id));
    const rightMostNodeId = [...selectedNodes]
      .sort((a, b) => (b.position?.x ?? 0) - (a.position?.x ?? 0))[0]?.id;

    const nodes: LandingNode[] = selectedNodes.map((n, i) => ({
      id: n.id,
      type: n.type || "customNode",
      position: {
        x: typeof n.position?.x === "number" ? n.position.x : i * 260,
        y: typeof n.position?.y === "number" ? n.position.y : 100,
      },
      data: {
        label: n.data?.label ?? n.id,
        icon: n.data?.icon,
        description: n.data?.description ?? "",
        timeEstimate: n.data?.timeEstimate ?? "",
        tasks: Array.isArray(n.data?.tasks) ? n.data.tasks.slice(0, 4) : [],
        references: Array.isArray(n.data?.references)
          ? n.data.references
              .filter((r): r is { url: string } => typeof r?.url === "string")
              .slice(0, 3)
              .map((r) => ({ url: r.url }))
          : [],
        isHighlighted: n.id === rightMostNodeId || i === selectedNodes.length - 1,
      },
    }));

    const edges: LandingEdge[] = rawEdges
      .filter((e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target))
      .map((e) => ({
        id: e.id ?? `${e.source}-${e.target}`,
        source: e.source,
        target: e.target,
        type: e.type || "smoothstep",
        style: {
          stroke: e.style?.stroke ?? "rgba(155, 156, 247, 0.9)",
          strokeWidth: typeof e.style?.strokeWidth === "number" ? e.style.strokeWidth : 2,
        },
      }));

    return { nodes, edges };
  } catch (error) {
    console.error("[landing-roadmap] Failed to fetch roadmap:", error);
    return null;
  }
}
