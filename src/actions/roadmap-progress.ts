"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toSlugId, type RoadmapGraph } from "@/lib/roadmap-repository";

type ProgressStatus = "ACTIVE" | "COMPLETED";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type ProgressTask = {
  index: number;
  title: string;
  completed: boolean;
};

type NodeOption = {
  id: string;
  label: string;
};

export type RoadmapProgressSnapshot = {
  roadmapId: string;
  roadmapTitle: string;
  roadmapSlugId: string;
  status: ProgressStatus;
  progressId: string;
  currentNodeId: string | null;
  completedNodeIds: string[];
  totalNodes: number;
  totalTasks: number;
  completedTasks: number;
  percentComplete: number;
  currentNode: {
    id: string;
    label: string;
    description: string;
    detailedDescription: string;
    tasks: ProgressTask[];
  } | null;
  nextNodeOptions: NodeOption[];
  canAdvance: boolean;
};

type RuntimeGraph = {
  nodeById: Map<string, RoadmapGraph["nodes"][number]>;
  outgoing: Map<string, string[]>;
  incomingCount: Map<string, number>;
  rootNodeId: string | null;
};

const toGraph = (value: unknown): RoadmapGraph => {
  const graph = (value ?? {}) as RoadmapGraph;
  return {
    nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    edges: Array.isArray(graph.edges) ? graph.edges : [],
  };
};

const buildRuntimeGraph = (graph: RoadmapGraph): RuntimeGraph => {
  const nodeById = new Map<string, RoadmapGraph["nodes"][number]>();
  const outgoing = new Map<string, string[]>();
  const incomingCount = new Map<string, number>();

  graph.nodes.forEach((node) => {
    nodeById.set(node.id, node);
    incomingCount.set(node.id, 0);
  });

  graph.edges.forEach((edge) => {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      return;
    }

    const out = outgoing.get(edge.source) ?? [];
    out.push(edge.target);
    outgoing.set(edge.source, out);

    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1);
  });

  const rootNodeId =
    graph.nodes.find((node) => (incomingCount.get(node.id) ?? 0) === 0)?.id ??
    graph.nodes[0]?.id ??
    null;

  return {
    nodeById,
    outgoing,
    incomingCount,
    rootNodeId,
  };
};

const dedupe = (values: string[]): string[] => Array.from(new Set(values));

type ProgressRow = {
  id: string;
  status: ProgressStatus;
  currentNodeId: string | null;
  completedNodeIds: string[] | null;
};

type TaskProgressRow = {
  nodeId: string;
  taskIndex: number;
};

const now = () => new Date();

const createProgressId = () => `prog_${crypto.randomUUID().replace(/-/g, "")}`;
const createTaskProgressId = () => `ptask_${crypto.randomUUID().replace(/-/g, "")}`;

const readTaskProgresses = async (progressId: string): Promise<TaskProgressRow[]> => {
  return prisma.$queryRaw<TaskProgressRow[]>`
    SELECT "nodeId", "taskIndex"
    FROM "RoadmapTaskProgress"
    WHERE "progressId" = ${progressId}
  `;
};

const readProgressByUserRoadmap = async ({
  userId,
  roadmapId,
}: {
  userId: string;
  roadmapId: string;
}): Promise<{
  id: string;
  status: ProgressStatus;
  currentNodeId: string | null;
  completedNodeIds: string[];
  taskProgresses: TaskProgressRow[];
} | null> => {
  const rows = await prisma.$queryRaw<ProgressRow[]>`
    SELECT "id", "status", "currentNodeId", "completedNodeIds"
    FROM "RoadmapProgress"
    WHERE "userId" = ${userId} AND "roadmapId" = ${roadmapId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    return null;
  }

  const taskProgresses = await readTaskProgresses(row.id);
  return {
    id: row.id,
    status: row.status,
    currentNodeId: row.currentNodeId,
    completedNodeIds: Array.isArray(row.completedNodeIds) ? row.completedNodeIds : [],
    taskProgresses,
  };
};

const readProgressById = async (progressId: string): Promise<{
  id: string;
  status: ProgressStatus;
  currentNodeId: string | null;
  completedNodeIds: string[];
  taskProgresses: TaskProgressRow[];
}> => {
  const rows = await prisma.$queryRaw<ProgressRow[]>`
    SELECT "id", "status", "currentNodeId", "completedNodeIds"
    FROM "RoadmapProgress"
    WHERE "id" = ${progressId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) {
    throw new Error("Progress not found");
  }

  const taskProgresses = await readTaskProgresses(row.id);
  return {
    id: row.id,
    status: row.status,
    currentNodeId: row.currentNodeId,
    completedNodeIds: Array.isArray(row.completedNodeIds) ? row.completedNodeIds : [],
    taskProgresses,
  };
};

const snapshotFromState = ({
  roadmap,
  graph,
  progress,
}: {
  roadmap: { id: string; title: string; slug: string };
  graph: RoadmapGraph;
  progress: {
    id: string;
    status: ProgressStatus;
    currentNodeId: string | null;
    completedNodeIds: string[];
    taskProgresses: Array<{ nodeId: string; taskIndex: number }>;
  };
}): RoadmapProgressSnapshot => {
  const runtime = buildRuntimeGraph(graph);
  const completedNodeIds = dedupe(progress.completedNodeIds);
  const currentNodeId = progress.currentNodeId ?? runtime.rootNodeId;
  const currentNode = currentNodeId ? runtime.nodeById.get(currentNodeId) ?? null : null;

  const completionSet = new Set(
    progress.taskProgresses.map((item) => `${item.nodeId}:${item.taskIndex}`),
  );

  const totalTasks = graph.nodes.reduce(
    (sum, node) => sum + (Array.isArray(node.data.tasks) ? node.data.tasks.length : 0),
    0,
  );

  const completedTasks = graph.nodes.reduce((sum, node) => {
    const tasks = Array.isArray(node.data.tasks) ? node.data.tasks : [];
    const completedForNode = tasks.reduce(
      (count, _task, index) =>
        completionSet.has(`${node.id}:${index}`) ? count + 1 : count,
      0,
    );
    return sum + completedForNode;
  }, 0);

  const currentTasks = currentNode
    ? (Array.isArray(currentNode.data.tasks) ? currentNode.data.tasks : []).map(
        (task, index) => ({
          index,
          title: task,
          completed: completionSet.has(`${currentNode.id}:${index}`),
        }),
      )
    : [];

  const allCurrentTasksCompleted = currentTasks.every((task) => task.completed);
  const rawNextNodes = currentNode
    ? runtime.outgoing.get(currentNode.id) ?? []
    : [];

  const nextNodeOptions = rawNextNodes
    .filter((nodeId) => !completedNodeIds.includes(nodeId))
    .map((nodeId) => {
      const node = runtime.nodeById.get(nodeId);
      return {
        id: nodeId,
        label: node?.data.label ?? nodeId,
      };
    });

  const percentComplete =
    totalTasks > 0
      ? Math.min(100, Math.round((completedTasks / totalTasks) * 100))
      : 0;

  return {
    roadmapId: roadmap.id,
    roadmapTitle: roadmap.title,
    roadmapSlugId: toSlugId(roadmap.slug, roadmap.id),
    status: progress.status,
    progressId: progress.id,
    currentNodeId,
    completedNodeIds,
    totalNodes: graph.nodes.length,
    totalTasks,
    completedTasks,
    percentComplete,
    currentNode: currentNode
      ? {
          id: currentNode.id,
          label: currentNode.data.label,
          description: currentNode.data.description,
          detailedDescription: currentNode.data.detailedDescription,
          tasks: currentTasks,
        }
      : null,
    nextNodeOptions,
    canAdvance: allCurrentTasksCompleted,
  };
};

const getOwnedRoadmapOrThrow = async ({
  roadmapId,
  userId,
}: {
  roadmapId: string;
  userId: string;
}) => {
  const roadmap = await prisma.roadmap.findUnique({
    where: { id: roadmapId },
    select: {
      id: true,
      slug: true,
      title: true,
      ownerId: true,
      graph: true,
    },
  });

  if (!roadmap) {
    throw new Error("Roadmap not found");
  }

  if (roadmap.ownerId !== userId) {
    throw new Error("Not authorized");
  }

  return {
    ...roadmap,
    graph: toGraph(roadmap.graph),
  };
};

const getOrCreateProgress = async ({
  roadmapId,
  userId,
  rootNodeId,
}: {
  roadmapId: string;
  userId: string;
  rootNodeId: string | null;
}) => {
  await prisma.$executeRaw`
    INSERT INTO "RoadmapProgress" (
      "id", "status", "currentNodeId", "completedNodeIds", "roadmapId", "userId", "createdAt", "updatedAt"
    )
    VALUES (
      ${createProgressId()},
      ${"ACTIVE" as ProgressStatus},
      ${rootNodeId},
      ARRAY[]::TEXT[],
      ${roadmapId},
      ${userId},
      ${now()},
      ${now()}
    )
    ON CONFLICT ("userId", "roadmapId") DO NOTHING
  `;

  const progress = await readProgressByUserRoadmap({ userId, roadmapId });
  if (!progress) {
    throw new Error("Failed to initialize roadmap progress");
  }

  return progress;
};

export async function startOrResumeRoadmapProgress({
  roadmapId,
}: {
  roadmapId: string;
}): Promise<ActionResult<RoadmapProgressSnapshot>> {
  try {
    const user = await requireDbUser();
    const roadmap = await getOwnedRoadmapOrThrow({ roadmapId, userId: user.id });
    const runtime = buildRuntimeGraph(roadmap.graph);

    const progress = await getOrCreateProgress({
      roadmapId,
      userId: user.id,
      rootNodeId: runtime.rootNodeId,
    });

    return {
      success: true,
      data: snapshotFromState({
        roadmap,
        graph: roadmap.graph,
        progress,
      }),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start roadmap progress",
    };
  }
}

export async function toggleRoadmapTaskProgress({
  roadmapId,
  nodeId,
  taskIndex,
  completed,
}: {
  roadmapId: string;
  nodeId: string;
  taskIndex: number;
  completed: boolean;
}): Promise<ActionResult<RoadmapProgressSnapshot>> {
  try {
    const user = await requireDbUser();
    const roadmap = await getOwnedRoadmapOrThrow({ roadmapId, userId: user.id });
    const runtime = buildRuntimeGraph(roadmap.graph);
    const node = runtime.nodeById.get(nodeId);

    if (!node) {
      return { success: false, error: "Node not found in roadmap" };
    }

    const tasks = Array.isArray(node.data.tasks) ? node.data.tasks : [];
    if (taskIndex < 0 || taskIndex >= tasks.length) {
      return { success: false, error: "Task not found" };
    }

    const progress = await getOrCreateProgress({
      roadmapId,
      userId: user.id,
      rootNodeId: runtime.rootNodeId,
    });

    if (completed) {
      await prisma.$executeRaw`
        INSERT INTO "RoadmapTaskProgress" (
          "id", "progressId", "nodeId", "taskIndex", "completedAt"
        )
        VALUES (
          ${createTaskProgressId()},
          ${progress.id},
          ${nodeId},
          ${taskIndex},
          ${now()}
        )
        ON CONFLICT ("progressId", "nodeId", "taskIndex")
        DO UPDATE SET "completedAt" = ${now()}
      `;
    } else {
      await prisma.$executeRaw`
        DELETE FROM "RoadmapTaskProgress"
        WHERE "progressId" = ${progress.id}
          AND "nodeId" = ${nodeId}
          AND "taskIndex" = ${taskIndex}
      `;
    }

    const latestProgress = await readProgressById(progress.id);

    revalidatePath("/roadmaps");

    return {
      success: true,
      data: snapshotFromState({
        roadmap,
        graph: roadmap.graph,
        progress: latestProgress,
      }),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to update task progress",
    };
  }
}

export async function advanceRoadmapProgress({
  roadmapId,
  nextNodeId,
}: {
  roadmapId: string;
  nextNodeId?: string;
}): Promise<ActionResult<RoadmapProgressSnapshot>> {
  try {
    const user = await requireDbUser();
    const roadmap = await getOwnedRoadmapOrThrow({ roadmapId, userId: user.id });
    const runtime = buildRuntimeGraph(roadmap.graph);

    const progress = await getOrCreateProgress({
      roadmapId,
      userId: user.id,
      rootNodeId: runtime.rootNodeId,
    });

    const currentNodeId = progress.currentNodeId ?? runtime.rootNodeId;
    if (!currentNodeId) {
      return { success: false, error: "No valid current node found" };
    }

    const currentNode = runtime.nodeById.get(currentNodeId);
    if (!currentNode) {
      return { success: false, error: "Current node is invalid" };
    }

    const completionSet = new Set(
      progress.taskProgresses.map((item) => `${item.nodeId}:${item.taskIndex}`),
    );

    const currentTasks = Array.isArray(currentNode.data.tasks)
      ? currentNode.data.tasks
      : [];

    const allCurrentTasksCompleted = currentTasks.every((_task, index) =>
      completionSet.has(`${currentNodeId}:${index}`),
    );

    if (!allCurrentTasksCompleted) {
      return {
        success: false,
        error: "Complete all tasks in the current node before proceeding",
      };
    }

    const nextCandidates = (runtime.outgoing.get(currentNodeId) ?? []).filter(
      (id) => !progress.completedNodeIds.includes(id),
    );

    const completedNodeIds = dedupe([...progress.completedNodeIds, currentNodeId]);

    if (nextCandidates.length === 0) {
      await prisma.$executeRaw`
        UPDATE "RoadmapProgress"
        SET
          "status" = ${"COMPLETED" as ProgressStatus},
          "currentNodeId" = ${null},
          "completedNodeIds" = ${completedNodeIds}::text[],
          "completedAt" = ${now()},
          "updatedAt" = ${now()}
        WHERE "id" = ${progress.id}
      `;
    } else {
      if (!nextNodeId) {
        return {
          success: false,
          error: "Choose the next branch node to continue",
        };
      }

      if (!nextCandidates.includes(nextNodeId)) {
        return {
          success: false,
          error: "Selected node is not a valid next branch",
        };
      }

      await prisma.$executeRaw`
        UPDATE "RoadmapProgress"
        SET
          "status" = ${"ACTIVE" as ProgressStatus},
          "currentNodeId" = ${nextNodeId},
          "completedNodeIds" = ${completedNodeIds}::text[],
          "completedAt" = ${null},
          "updatedAt" = ${now()}
        WHERE "id" = ${progress.id}
      `;
    }

    const latestProgress = await readProgressById(progress.id);

    revalidatePath("/roadmaps");

    return {
      success: true,
      data: snapshotFromState({
        roadmap,
        graph: roadmap.graph,
        progress: latestProgress,
      }),
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }

    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : "Failed to advance roadmap progression",
    };
  }
}
