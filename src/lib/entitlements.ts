import {
  GenerationStatus,
  PlanTier,
  Prisma,
  PrismaClient,
  SubscriptionStatus,
  UsageMetric,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getPlanDefinition,
  inferPaidPlanTierFromProviderPlanId,
  type PlanCapabilities,
} from "@/lib/plans";

type TxClient = Prisma.TransactionClient;

type EntitlementSnapshot = {
  userId: string;
  planTier: PlanTier;
  planLabel: string;
  limits: PlanCapabilities;
  periodStart: Date;
  periodEnd: Date;
  monthlyGenerationUsed: number;
  monthlyGenerationLimit: number;
  monthlyGenerationRemaining: number;
};

type QuotaReservation =
  | {
      ok: true;
      generationRunId: string;
      entitlement: EntitlementSnapshot;
    }
  | {
      ok: false;
      generationRunId: string;
      entitlement: EntitlementSnapshot;
      code: "PLAN_LIMIT_REACHED";
      message: string;
    };

const getClient = (tx?: TxClient): PrismaClient | TxClient => {
  return tx ?? prisma;
};

export const getCurrentUtcMonthWindow = (at = new Date()): { periodStart: Date; periodEnd: Date } => {
  const periodStart = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
};

const resolveEffectivePlanTier = ({
  planTier,
  subscriptionStatus,
  providerPlanId,
}: {
  planTier: PlanTier;
  subscriptionStatus: SubscriptionStatus | null;
  providerPlanId?: string | null;
}): PlanTier => {
  if (subscriptionStatus === SubscriptionStatus.ACTIVE || subscriptionStatus === SubscriptionStatus.PAST_DUE) {
    const inferred = inferPaidPlanTierFromProviderPlanId(providerPlanId);

    if (inferred) {
      return inferred;
    }

    if (planTier === ("PRO" as PlanTier) || planTier === ("PREMIUM" as PlanTier)) {
      return planTier;
    }

    return PlanTier.PRO;
  }

  if (
    subscriptionStatus === SubscriptionStatus.CANCELED ||
    subscriptionStatus === SubscriptionStatus.EXPIRED ||
    subscriptionStatus === SubscriptionStatus.INCOMPLETE
  ) {
    return PlanTier.FREE;
  }

  return planTier;
};

export const getUserEntitlementSnapshot = async ({
  userId,
  tx,
}: {
  userId: string;
  tx?: TxClient;
}): Promise<EntitlementSnapshot> => {
  const client = getClient(tx);
  const { periodStart, periodEnd } = getCurrentUtcMonthWindow();

  const [user, usageBucket] = await Promise.all([
    client.user.findUnique({
      where: { id: userId },
      select: {
        planTier: true,
        subscription: {
          select: {
            status: true,
            providerPlanId: true,
          },
        },
      },
    }),
    client.usageBucket.findUnique({
      where: {
        userId_metric_periodStart: {
          userId,
          metric: UsageMetric.ROADMAP_GENERATION,
          periodStart,
        },
      },
      select: {
        used: true,
      },
    }),
  ]);

  const effectiveTier = resolveEffectivePlanTier({
    planTier: user?.planTier ?? PlanTier.FREE,
    subscriptionStatus: user?.subscription?.status ?? null,
    providerPlanId: user?.subscription?.providerPlanId ?? null,
  });
  const plan = getPlanDefinition(effectiveTier);

  const monthlyGenerationUsed = usageBucket?.used ?? 0;
  const monthlyGenerationLimit = plan.capabilities.monthlyGenerationLimit;

  return {
    userId,
    planTier: effectiveTier,
    planLabel: plan.label,
    limits: plan.capabilities,
    periodStart,
    periodEnd,
    monthlyGenerationUsed,
    monthlyGenerationLimit,
    monthlyGenerationRemaining: Math.max(0, monthlyGenerationLimit - monthlyGenerationUsed),
  };
};

export const reserveRoadmapGenerationQuota = async ({
  userId,
  requestId,
  currentStatePreview,
  desiredOutcomePreview,
}: {
  userId: string;
  requestId?: string;
  currentStatePreview?: string;
  desiredOutcomePreview?: string;
}): Promise<QuotaReservation> => {
  return prisma.$transaction(async (tx) => {
    const entitlement = await getUserEntitlementSnapshot({ userId, tx });

    const usageBucket = await tx.usageBucket.upsert({
      where: {
        userId_metric_periodStart: {
          userId,
          metric: UsageMetric.ROADMAP_GENERATION,
          periodStart: entitlement.periodStart,
        },
      },
      create: {
        userId,
        metric: UsageMetric.ROADMAP_GENERATION,
        periodStart: entitlement.periodStart,
        periodEnd: entitlement.periodEnd,
        used: 0,
      },
      update: {},
      select: {
        id: true,
        used: true,
      },
    });

    const updatedBucket = await tx.usageBucket.updateMany({
      where: {
        id: usageBucket.id,
        used: {
          lt: entitlement.monthlyGenerationLimit,
        },
      },
      data: {
        used: {
          increment: 1,
        },
      },
    });

    if (updatedBucket.count === 0) {
      const rejectedRun = await tx.roadmapGenerationRun.create({
        data: {
          userId,
          requestId,
          status: GenerationStatus.REJECTED_QUOTA,
          planTierSnapshot: entitlement.planTier,
          periodStart: entitlement.periodStart,
          periodEnd: entitlement.periodEnd,
          monthlyLimit: entitlement.monthlyGenerationLimit,
          monthlyUsedBefore: usageBucket.used,
          monthlyUsedAfter: usageBucket.used,
          maxSearchCalls: entitlement.limits.maxSearchCalls,
          maxSubqueriesPerCall: entitlement.limits.maxSubqueriesPerSearchCall,
          maxResultsPerQuery: entitlement.limits.maxResultsPerQuery,
          maxSearchDepth: entitlement.limits.maxSearchDepth,
          pathwayPlanningMaxSteps: entitlement.limits.pathwayPlanningMaxSteps,
          roadmapSynthesisMaxSteps: entitlement.limits.roadmapSynthesisMaxSteps,
          currentStatePreview,
          desiredOutcomePreview,
          errorCode: "PLAN_LIMIT_REACHED",
          errorMessage: "Monthly roadmap generation limit reached",
          finishedAt: new Date(),
        },
        select: { id: true },
      });

      return {
        ok: false,
        generationRunId: rejectedRun.id,
        entitlement,
        code: "PLAN_LIMIT_REACHED",
        message: "You have reached this month's roadmap generation limit for your current plan.",
      };
    }

    const currentUsage = await tx.usageBucket.findUnique({
      where: { id: usageBucket.id },
      select: { used: true },
    });

    const usedAfter = currentUsage?.used ?? usageBucket.used + 1;

    const generationRun = await tx.roadmapGenerationRun.create({
      data: {
        userId,
        requestId,
        status: GenerationStatus.STARTED,
        planTierSnapshot: entitlement.planTier,
        periodStart: entitlement.periodStart,
        periodEnd: entitlement.periodEnd,
        monthlyLimit: entitlement.monthlyGenerationLimit,
        monthlyUsedBefore: usageBucket.used,
        monthlyUsedAfter: usedAfter,
        maxSearchCalls: entitlement.limits.maxSearchCalls,
        maxSubqueriesPerCall: entitlement.limits.maxSubqueriesPerSearchCall,
        maxResultsPerQuery: entitlement.limits.maxResultsPerQuery,
        maxSearchDepth: entitlement.limits.maxSearchDepth,
        pathwayPlanningMaxSteps: entitlement.limits.pathwayPlanningMaxSteps,
        roadmapSynthesisMaxSteps: entitlement.limits.roadmapSynthesisMaxSteps,
        currentStatePreview,
        desiredOutcomePreview,
      },
      select: { id: true },
    });

    return {
      ok: true,
      generationRunId: generationRun.id,
      entitlement: {
        ...entitlement,
        monthlyGenerationUsed: usedAfter,
        monthlyGenerationRemaining: Math.max(0, entitlement.monthlyGenerationLimit - usedAfter),
      },
    };
  });
};

export const completeRoadmapGenerationRun = async ({
  runId,
  status,
  searchCallsUsed,
  errorCode,
  errorMessage,
}: {
  runId: string;
  status: GenerationStatus;
  searchCallsUsed: number;
  errorCode?: string;
  errorMessage?: string;
}) => {
  await prisma.roadmapGenerationRun.update({
    where: { id: runId },
    data: {
      status,
      searchCallsUsed,
      errorCode,
      errorMessage,
      finishedAt: new Date(),
    },
  });
};

export type { EntitlementSnapshot, QuotaReservation };
