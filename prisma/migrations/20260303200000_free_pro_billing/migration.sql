-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('RAZORPAY');

-- CreateEnum
CREATE TYPE "BillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UsageMetric" AS ENUM ('ROADMAP_GENERATION');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED', 'REJECTED_QUOTA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL DEFAULT 'RAZORPAY',
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT NOT NULL,
    "providerPlanId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "billingPeriod" "BillingPeriod",
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "canceledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL DEFAULT 'RAZORPAY',
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processingError" TEXT,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageBucket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" "UsageMetric" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapGenerationRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "status" "GenerationStatus" NOT NULL DEFAULT 'STARTED',
    "planTierSnapshot" "PlanTier" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "monthlyLimit" INTEGER NOT NULL,
    "monthlyUsedBefore" INTEGER NOT NULL,
    "monthlyUsedAfter" INTEGER,
    "maxSearchCalls" INTEGER NOT NULL,
    "searchCallsUsed" INTEGER NOT NULL DEFAULT 0,
    "maxSubqueriesPerCall" INTEGER NOT NULL,
    "maxResultsPerQuery" INTEGER NOT NULL,
    "maxSearchDepth" TEXT NOT NULL,
    "pathwayPlanningMaxSteps" INTEGER NOT NULL,
    "roadmapSynthesisMaxSteps" INTEGER NOT NULL,
    "currentStatePreview" TEXT,
    "desiredOutcomePreview" TEXT,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoadmapGenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSubscription_userId_key" ON "UserSubscription"("userId");
CREATE UNIQUE INDEX "UserSubscription_providerSubscriptionId_key" ON "UserSubscription"("providerSubscriptionId");
CREATE INDEX "UserSubscription_provider_status_currentPeriodEnd_idx" ON "UserSubscription"("provider", "status", "currentPeriodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "BillingWebhookEvent_providerEventId_key" ON "BillingWebhookEvent"("providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "UsageBucket_userId_metric_periodStart_key" ON "UsageBucket"("userId", "metric", "periodStart");
CREATE INDEX "UsageBucket_userId_metric_periodStart_idx" ON "UsageBucket"("userId", "metric", "periodStart" DESC);

-- CreateIndex
CREATE INDEX "RoadmapGenerationRun_userId_createdAt_idx" ON "RoadmapGenerationRun"("userId", "createdAt" DESC);
CREATE INDEX "RoadmapGenerationRun_status_createdAt_idx" ON "RoadmapGenerationRun"("status", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UsageBucket" ADD CONSTRAINT "UsageBucket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoadmapGenerationRun" ADD CONSTRAINT "RoadmapGenerationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
