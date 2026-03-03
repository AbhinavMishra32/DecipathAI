import { NextResponse } from "next/server"
import { getDbUser } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { toSlugId } from "@/lib/roadmap-repository"
import { getUserEntitlementSnapshot } from "@/lib/entitlements"

export async function GET() {
  try {
    const user = await getDbUser()
    if (!user) {
      return NextResponse.json({
        roadmapCount: 0,
        activeProgressCount: 0,
        planTier: "FREE",
        planLabel: "Free plan",
        monthlyGenerationUsed: 0,
        monthlyGenerationLimit: 10,
        recentRoadmaps: [],
      })
    }

    const [roadmaps, roadmapCount, entitlement] = await Promise.all([
      prisma.roadmap.findMany({
        where: { ownerId: user.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          updatedAt: true,
        },
      }),
      prisma.roadmap.count({
        where: { ownerId: user.id },
      }),
      getUserEntitlementSnapshot({ userId: user.id }),
    ])

    /* Safely attempt progress count — model may not exist in all migrations */
    let activeProgressCount = 0
    try {
      const progressDelegate = (
        prisma as unknown as {
          roadmapProgress?: {
            count: (args: { where: { userId: string; status: string } }) => Promise<number>
          }
        }
      ).roadmapProgress

      if (progressDelegate) {
        activeProgressCount = await progressDelegate.count({
          where: { userId: user.id, status: "ACTIVE" },
        })
      }
    } catch {
      /* progress model not available — ignore */
    }

    return NextResponse.json({
      roadmapCount,
      activeProgressCount,
      planTier: entitlement.planTier,
      planLabel: entitlement.planLabel,
      monthlyGenerationUsed: entitlement.monthlyGenerationUsed,
      monthlyGenerationLimit: entitlement.monthlyGenerationLimit,
      recentRoadmaps: roadmaps.map((r) => ({
        id: r.id,
        title: r.title,
        slugId: toSlugId(r.slug, r.id),
        updatedAt: r.updatedAt.toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({
      roadmapCount: 0,
      activeProgressCount: 0,
      planTier: "FREE",
      planLabel: "Free plan",
      monthlyGenerationUsed: 0,
      monthlyGenerationLimit: 10,
      recentRoadmaps: [],
    })
  }
}
