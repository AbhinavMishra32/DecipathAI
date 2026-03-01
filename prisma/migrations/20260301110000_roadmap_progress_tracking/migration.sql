-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateTable
CREATE TABLE "RoadmapProgress" (
    "id" TEXT NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentNodeId" TEXT,
    "completedNodeIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "completedAt" TIMESTAMP(3),
    "roadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapTaskProgress" (
    "id" TEXT NOT NULL,
    "progressId" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "taskIndex" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapTaskProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapProgress_userId_roadmapId_key" ON "RoadmapProgress"("userId", "roadmapId");
CREATE INDEX "RoadmapProgress_userId_updatedAt_idx" ON "RoadmapProgress"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapTaskProgress_progressId_nodeId_taskIndex_key" ON "RoadmapTaskProgress"("progressId", "nodeId", "taskIndex");
CREATE INDEX "RoadmapTaskProgress_progressId_nodeId_idx" ON "RoadmapTaskProgress"("progressId", "nodeId");

-- AddForeignKey
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapProgress" ADD CONSTRAINT "RoadmapProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapTaskProgress" ADD CONSTRAINT "RoadmapTaskProgress_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "RoadmapProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
