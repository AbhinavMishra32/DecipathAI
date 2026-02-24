"use server";

import { auth } from "@clerk/nextjs/server";

type PersistableNode = {
  id: string
  type?: string
  data?: {
    label?: string
    description?: string
    detailedDescription?: string
    icon?: string
    nextSteps?: string[]
    tasks?: string[]
    timeEstimate?: string
  }
}

type PersistableEdge = {
  id: string
  source: string
  target: string
  type?: string
  animated?: boolean
}

type SaveRoadmapResult =
  | { success: true; data: unknown }
  | { success: false; error: string }

export async function saveRoadmap({
    nodes,
    edges,
    title,
}: {
        nodes: PersistableNode[];
        edges: PersistableEdge[];
        title: string;
    }): Promise<SaveRoadmapResult> {
    const { userId } = await auth();
    if (!userId) {
        return { success: false, error: "User not authenticated" };
    }

    if (!Array.isArray(nodes) || !Array.isArray(edges) || !title) {
        return { success: false, error: "Invalid input: nodes and edges must be arrays and title must be provided" };
    }

    if (!process.env.DATABASE_URL) {
        return { success: false, error: "Database is not configured" };
    }

  try {
    const { prisma } = await import("@/lib/db");

    const roadmap = await prisma.roadmap.upsert({
      where: {
        id: `${title}-${Date.now()}`
      },
      update: {},
      create: {
        title,
        savedUser: {
            connect: {
                id: userId
            }
        },
        nodes: {
          createMany: {
            data: nodes.map((node) => ({
              nodeId: node.id,
              type: node.type || 'default',
              label: node.data?.label || '',
              description: node.data?.description || '',
              detailedDescription: node.data?.detailedDescription || '',
              icon: node.data?.icon || '',
              nextSteps: node.data?.nextSteps || [],
              tasks: node.data?.tasks || [],
              timeEstimate: node.data?.timeEstimate || ''
            }))
          }
        },
        edges: {
          createMany: {
            data: edges.map((edge) => ({
              id: edge.id,
              edgeId: edge.id,
              source: edge.source,
              target: edge.target,
              type: edge.type || 'smoothstep',
              animated: edge.animated || false
            }))
          }
        }
      },
      include: {
        nodes: true,
        edges: true
      }
    });

    return { success: true, data: roadmap };
  } catch (error) {
    console.error('Error in saveRoadmap:', error);
    return { success: false, error: `Failed to save roadmap: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}
