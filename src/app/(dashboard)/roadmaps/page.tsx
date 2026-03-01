import { redirect } from "next/navigation";
import { requireDbUser, AuthError } from "@/lib/auth";
import { roadmapRepo } from "@/lib/roadmap-repo";
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

  const roadmaps = await roadmapRepo.listByOwner(user.id, 50);

  const items = roadmaps.map((r) => ({
    id: r.id,
    title: r.title,
    slugId: toSlugId(r.slug, r.id),
    visibility: r.visibility,
    nodeCount: r.nodeCount,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <DashboardClient roadmaps={items} username={user.username} />;
}
