import { notFound } from "next/navigation";
import { roadmapRepo } from "@/lib/roadmap-repo";
import { getDbUser } from "@/lib/auth";
import { parseSlugId } from "@/lib/roadmap-repository";
import RoadmapViewer from "./roadmap-viewer";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slugId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);
  if (!parsed) return { title: "Roadmap not found" };

  const roadmap = await roadmapRepo.getById(parsed.id);
  if (!roadmap) return { title: "Roadmap not found" };

  return {
    title: `${roadmap.title} | Decipath`,
    description: `Roadmap: ${roadmap.title}`,
  };
}

export default async function RoadmapPage({ params }: PageProps) {
  const { slugId } = await params;
  const parsed = parseSlugId(slugId);
  if (!parsed) notFound();

  const roadmap = await roadmapRepo.getById(parsed.id);
  if (!roadmap) notFound();

  // Permission check: private roadmaps are only visible to the owner
  const dbUser = await getDbUser();
  const isOwner = dbUser?.id === roadmap.ownerId;

  if (roadmap.visibility === "PRIVATE" && !isOwner) {
    notFound();
  }

  return (
    <RoadmapViewer
      roadmap={{
        id: roadmap.id,
        title: roadmap.title,
        slug: roadmap.slug,
        visibility: roadmap.visibility,
        graph: roadmap.graph,
        isOwner,
        createdAt: roadmap.createdAt.toISOString(),
        updatedAt: roadmap.updatedAt.toISOString(),
      }}
    />
  );
}
