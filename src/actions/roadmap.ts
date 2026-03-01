"use server";

import { revalidatePath } from "next/cache";
import { requireDbUser, AuthError } from "@/lib/auth";
import { roadmapRepo } from "@/lib/roadmap-repo";
import { toSlugId } from "@/lib/roadmap-repository";
import type { RoadmapGraph } from "@/lib/roadmap-repository";
import type { Visibility } from "@prisma/client";

// ───────────────────────────────────────────
// Result types
// ───────────────────────────────────────────

type ActionResult<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

// ───────────────────────────────────────────
// Create / Save
// ───────────────────────────────────────────

export async function saveRoadmap({
  title,
  graph,
}: {
  title: string;
  graph: RoadmapGraph;
}): Promise<ActionResult<{ id: string; slugId: string }>> {
  try {
    const user = await requireDbUser();

    if (!title?.trim()) {
      return { success: false, error: "Title is required" };
    }

    const roadmap = await roadmapRepo.createRoadmap({
      title: title.trim(),
      graph,
      ownerId: user.id,
    });

    revalidatePath("/roadmaps");

    return {
      success: true,
      data: {
        id: roadmap.id,
        slugId: toSlugId(roadmap.slug, roadmap.id),
      },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    console.error("[saveRoadmap]", err);
    return { success: false, error: "Failed to save roadmap" };
  }
}

// ───────────────────────────────────────────
// Update graph (auto-save / manual save)
// ───────────────────────────────────────────

export async function updateRoadmapGraph({
  id,
  graph,
}: {
  id: string;
  graph: RoadmapGraph;
}): Promise<ActionResult> {
  try {
    const user = await requireDbUser();
    const existing = await roadmapRepo.getById(id);

    if (!existing) {
      return { success: false, error: "Roadmap not found" };
    }
    if (existing.ownerId !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    await roadmapRepo.updateGraph({ id, graph });
    return { success: true, data: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    console.error("[updateRoadmapGraph]", err);
    return { success: false, error: "Failed to update roadmap" };
  }
}

// ───────────────────────────────────────────
// Visibility toggle
// ───────────────────────────────────────────

export async function updateRoadmapVisibility({
  id,
  visibility,
}: {
  id: string;
  visibility: Visibility;
}): Promise<ActionResult> {
  try {
    const user = await requireDbUser();
    const existing = await roadmapRepo.getById(id);

    if (!existing) {
      return { success: false, error: "Roadmap not found" };
    }
    if (existing.ownerId !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    await roadmapRepo.updateVisibility(id, visibility);
    revalidatePath(`/roadmaps`);
    return { success: true, data: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    console.error("[updateRoadmapVisibility]", err);
    return { success: false, error: "Failed to update visibility" };
  }
}

// ───────────────────────────────────────────
// Delete
// ───────────────────────────────────────────

export async function deleteRoadmap({
  id,
}: {
  id: string;
}): Promise<ActionResult> {
  try {
    const user = await requireDbUser();
    const existing = await roadmapRepo.getById(id);

    if (!existing) {
      return { success: false, error: "Roadmap not found" };
    }
    if (existing.ownerId !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    await roadmapRepo.deleteRoadmap(id);
    revalidatePath("/roadmaps");
    return { success: true, data: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    console.error("[deleteRoadmap]", err);
    return { success: false, error: "Failed to delete roadmap" };
  }
}

// ───────────────────────────────────────────
// Rename
// ───────────────────────────────────────────

export async function renameRoadmap({
  id,
  title,
}: {
  id: string;
  title: string;
}): Promise<ActionResult<{ slugId: string }>> {
  try {
    const user = await requireDbUser();
    const existing = await roadmapRepo.getById(id);

    if (!existing) {
      return { success: false, error: "Roadmap not found" };
    }
    if (existing.ownerId !== user.id) {
      return { success: false, error: "Not authorized" };
    }

    const updated = await roadmapRepo.updateTitle(id, title.trim());
    revalidatePath("/roadmaps");
    return {
      success: true,
      data: { slugId: toSlugId(updated.slug, updated.id) },
    };
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: err.message };
    }
    console.error("[renameRoadmap]", err);
    return { success: false, error: "Failed to rename roadmap" };
  }
}
