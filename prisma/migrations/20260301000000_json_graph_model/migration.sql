-- DropForeignKey
ALTER TABLE "Edge" DROP CONSTRAINT IF EXISTS "Edge_roadmapId_fkey";
ALTER TABLE "Node" DROP CONSTRAINT IF EXISTS "Node_roadmapId_fkey";
ALTER TABLE "NodeData" DROP CONSTRAINT IF EXISTS "NodeData_nodeId_fkey";
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_nodeId_fkey";
ALTER TABLE "Style" DROP CONSTRAINT IF EXISTS "Style_edgeId_fkey";
ALTER TABLE "Roadmap" DROP CONSTRAINT IF EXISTS "Roadmap_recentUserId_fkey";
ALTER TABLE "Roadmap" DROP CONSTRAINT IF EXISTS "Roadmap_savedUserId_fkey";

-- DropTable (old normalized tables)
DROP TABLE IF EXISTS "Style";
DROP TABLE IF EXISTS "Task";
DROP TABLE IF EXISTS "NodeData";
DROP TABLE IF EXISTS "Node";
DROP TABLE IF EXISTS "Edge";

-- Drop old Roadmap table and recreate with new schema
DROP TABLE IF EXISTS "Roadmap";

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "graph" JSONB NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Roadmap_ownerId_updatedAt_idx" ON "Roadmap"("ownerId", "updatedAt" DESC);
CREATE INDEX "Roadmap_slug_idx" ON "Roadmap"("slug");

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove old User relation columns (they no longer exist in schema)
ALTER TABLE "User" DROP COLUMN IF EXISTS "recentRoadmaps";
ALTER TABLE "User" DROP COLUMN IF EXISTS "savedRoadmaps";
