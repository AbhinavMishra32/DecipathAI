import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireDbUser } from "@/lib/auth";
import { roadmapRepo } from "@/lib/roadmap-repo";
import type { RoadmapGraph } from "@/lib/roadmap-repository";

type UpdateLayoutBody = {
  graph?: RoadmapGraph;
};

const toGraph = (value: unknown): RoadmapGraph => {
  const graph = (value ?? {}) as RoadmapGraph;
  return {
    nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    edges: Array.isArray(graph.edges) ? graph.edges : [],
  };
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const user = await requireDbUser();

    const roadmap = await roadmapRepo.getById(id);
    if (!roadmap) {
      return NextResponse.json({ success: false, error: "Roadmap not found" }, { status: 404 });
    }

    if (roadmap.ownerId !== user.id) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }

    const body = (await request.json()) as UpdateLayoutBody;
    const graph = toGraph(body.graph);

    if (graph.nodes.length === 0) {
      return NextResponse.json({ success: false, error: "Graph nodes are required" }, { status: 400 });
    }

    await roadmapRepo.updateGraph({ id, graph });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save layout",
      },
      { status: 500 },
    );
  }
}
