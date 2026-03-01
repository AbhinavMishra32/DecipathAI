import { redirect } from "next/navigation";
import { requireDbUser, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toSlugId } from "@/lib/roadmap-repository";
import DashboardClient from "./dashboard-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Roadmaps | Decipath",
  description: "View and manage your roadmaps",
};

export default async function RoadmapsDashboardPage() {
  let user;
  try {
    user = await requireDbUser();
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/signin");
    }
    throw err;
  }

  const roadmaps = await prisma.roadmap.findMany({
    where: { ownerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      slug: true,
      visibility: true,
      graph: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const progressDelegate = (
    prisma as unknown as {
      roadmapProgress?: {
        findMany: typeof prisma.roadmapProgress.findMany;
      };
    }
  ).roadmapProgress;

  const progressRuns = progressDelegate
    ? await progressDelegate.findMany({
        where: { userId: user.id },
        include: {
          taskProgresses: {
            select: {
              nodeId: true,
              taskIndex: true,
            },
          },
        },
      })
    : [];

  const graphForRoadmap = new Map<string, { nodes: Array<{ id: string; data?: { label?: string; tasks?: string[] } }> }>();
  roadmaps.forEach((roadmap) => {
    const graph = (roadmap.graph ?? {}) as {
      nodes?: Array<{ id: string; data?: { label?: string; tasks?: string[] } }>;
    };
    graphForRoadmap.set(roadmap.id, {
      nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    });
  });

  const items = roadmaps.map((roadmap) => {
    const graph = graphForRoadmap.get(roadmap.id);
    return {
      id: roadmap.id,
      title: roadmap.title,
      slugId: toSlugId(roadmap.slug, roadmap.id),
      visibility: roadmap.visibility,
      nodeCount: graph?.nodes.length ?? 0,
      createdAt: roadmap.createdAt.toISOString(),
      updatedAt: roadmap.updatedAt.toISOString(),
    };
  });

  const progress = progressRuns
    .map((run) => {
      const graph = graphForRoadmap.get(run.roadmapId);
      const roadmap = roadmaps.find((entry) => entry.id === run.roadmapId);
      if (!graph || !roadmap) {
        return null;
      }

      const nodeById = new Map<string, { label: string; tasks: string[] }>();
      graph.nodes.forEach((node) => {
        nodeById.set(node.id, {
          label: node.data?.label ?? node.id,
          tasks: Array.isArray(node.data?.tasks) ? node.data.tasks : [],
        });
      });

      const totalTasks = Array.from(nodeById.values()).reduce(
        (sum, node) => sum + node.tasks.length,
        0,
      );
      const completedTasks = run.taskProgresses.filter((task) => {
        const tasks = nodeById.get(task.nodeId)?.tasks ?? [];
        return task.taskIndex >= 0 && task.taskIndex < tasks.length;
      }).length;

      const currentNodeLabel = run.currentNodeId
        ? (nodeById.get(run.currentNodeId)?.label ?? run.currentNodeId)
        : "Completed";

      return {
        roadmapId: run.roadmapId,
        roadmapTitle: roadmap.title,
        roadmapSlugId: toSlugId(roadmap.slug, roadmap.id),
        status: run.status,
        currentNodeLabel,
        totalTasks,
        completedTasks,
        percentComplete:
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        updatedAt: run.updatedAt.toISOString(),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <DashboardClient
      roadmaps={items}
      progressRuns={progress}
      username={user.username}
    />
  );
}
