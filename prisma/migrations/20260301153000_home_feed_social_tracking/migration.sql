-- CreateTable
CREATE TABLE "RoadmapLike" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapComment" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapSave" (
    "id" TEXT NOT NULL,
    "sourceRoadmapId" TEXT NOT NULL,
    "savedRoadmapId" TEXT,
    "sourceCreatorName" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoadmapSave_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapLike_userId_roadmapId_key" ON "RoadmapLike"("userId", "roadmapId");
CREATE INDEX "RoadmapLike_roadmapId_createdAt_idx" ON "RoadmapLike"("roadmapId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RoadmapComment_roadmapId_createdAt_idx" ON "RoadmapComment"("roadmapId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapSave_userId_sourceRoadmapId_key" ON "RoadmapSave"("userId", "sourceRoadmapId");
CREATE INDEX "RoadmapSave_sourceRoadmapId_createdAt_idx" ON "RoadmapSave"("sourceRoadmapId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "RoadmapLike" ADD CONSTRAINT "RoadmapLike_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapLike" ADD CONSTRAINT "RoadmapLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoadmapComment" ADD CONSTRAINT "RoadmapComment_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapComment" ADD CONSTRAINT "RoadmapComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RoadmapSave" ADD CONSTRAINT "RoadmapSave_sourceRoadmapId_fkey" FOREIGN KEY ("sourceRoadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapSave" ADD CONSTRAINT "RoadmapSave_savedRoadmapId_fkey" FOREIGN KEY ("savedRoadmapId") REFERENCES "Roadmap"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapSave" ADD CONSTRAINT "RoadmapSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
