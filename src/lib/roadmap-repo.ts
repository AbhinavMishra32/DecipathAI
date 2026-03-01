/**
 * Singleton roadmap repository instance.
 *
 * Import this from anywhere that needs roadmap persistence.
 * Swapping backends is a one-line change here.
 */

import { prisma } from "./db";
import type { RoadmapRepository } from "./roadmap-repository";
import { PrismaRoadmapRepository } from "./roadmap-repository-prisma";

export const roadmapRepo: RoadmapRepository = new PrismaRoadmapRepository(prisma);
