import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toSlugId } from "@/lib/roadmap-repository";
import ProgressClient from "./progress-client";

interface PageProps {
  params: Promise<{ roadmapId: string }>;
}

export const metadata: Metadata = {
  title: "Roadmap Progress | Decipath",
  description: "Complete your roadmap in a dedicated progression workspace.",
};

export default async function RoadmapProgressPage({ params }: PageProps) {
  const { roadmapId } = await params;

  let user;
  try {
    user = await requireDbUser();
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/signin");
    }
    throw err;
  }

  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      title: true,
      slug: true,
      ownerId: true,
      graph: true,
    },
  });

  if (!roadmap || roadmap.ownerId !== user.id) {
    notFound();
  }

  const graph = (roadmap.graph ?? {}) as {
    nodes?: Array<{
      id: string;
      position?: { x?: number; y?: number };
      data?: {
        label?: string;
        icon?: string;
        description?: string;
        detailedDescription?: string;
        timeEstimate?: string;
        tasks?: string[];
        nextSteps?: string[];
        references?: Array<{
          title?: string;
          url?: string;
          snippet?: string;
          relevance?: string;
        }>;
      };
    }>;
    edges?: Array<{ id: string; source: string; target: string }>;
  };

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];

  return (
    <ProgressClient
      roadmap={{
        id: roadmap.id,
        title: roadmap.title,
        slugId: toSlugId(roadmap.slug, roadmap.id),
        nodeCount: nodes.length,
        graph: {
          nodes: nodes.map((node) => ({
            id: node.id,
            type: "customNode" as const,
            data: {
              label: node.data?.label ?? node.id,
              icon: node.data?.icon ?? "Briefcase",
              description: node.data?.description ?? "",
              detailedDescription: node.data?.detailedDescription ?? "",
              timeEstimate: node.data?.timeEstimate ?? "Not specified",
              tasks: Array.isArray(node.data?.tasks) ? node.data?.tasks : [],
              references: Array.isArray(node.data?.references)
                ? node.data.references.map((ref) => ({
                    title: ref?.title ?? "Reference",
                    url: ref?.url ?? "",
                    snippet: ref?.snippet ?? "",
                    relevance: ref?.relevance ?? "",
                  }))
                : [],
              nextSteps: Array.isArray(node.data?.nextSteps)
                ? node.data.nextSteps.filter((step) => typeof step === "string")
                : [],
            },
            position: {
              x: typeof node.position?.x === "number" ? node.position.x : 0,
              y: typeof node.position?.y === "number" ? node.position.y : 0,
            },
          })),
          edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "smoothstep" as const,
            animated: false,
            style: {
              stroke: "rgba(145, 140, 241, 0.6)",
              strokeWidth: 2,
            },
          })),
        },
      }}
    />
  );
}
