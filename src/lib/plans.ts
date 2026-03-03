import { BillingPeriod, PlanTier } from "@prisma/client";

export type PlanCapabilities = {
  monthlyGenerationLimit: number;
  maxSearchCalls: number;
  maxSubqueriesPerSearchCall: number;
  maxResultsPerQuery: number;
  maxSearchDepth: "basic" | "advanced";
  pathwayPlanningMaxSteps: number;
  roadmapSynthesisMaxSteps: number;
};

export type PlanDefinition = {
  tier: PlanTier;
  label: string;
  pricing: {
    currency: "INR";
    monthly: number;
    yearly: number;
  };
  capabilities: PlanCapabilities;
};

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  FREE: {
    tier: PlanTier.FREE,
    label: "Free plan",
    pricing: {
      currency: "INR",
      monthly: 0,
      yearly: 0,
    },
    capabilities: {
      monthlyGenerationLimit: 10,
      maxSearchCalls: 6,
      maxSubqueriesPerSearchCall: 1,
      maxResultsPerQuery: 2,
      maxSearchDepth: "basic",
      pathwayPlanningMaxSteps: 4,
      roadmapSynthesisMaxSteps: 5,
    },
  },
  PRO: {
    tier: PlanTier.PRO,
    label: "Pro plan",
    pricing: {
      currency: "INR",
      monthly: 499,
      yearly: 4999,
    },
    capabilities: {
      monthlyGenerationLimit: 120,
      maxSearchCalls: 24,
      maxSubqueriesPerSearchCall: 3,
      maxResultsPerQuery: 5,
      maxSearchDepth: "advanced",
      pathwayPlanningMaxSteps: 8,
      roadmapSynthesisMaxSteps: 9,
    },
  },
};

export const PRO_BILLING_OPTIONS: Record<BillingPeriod, { amountInr: number; label: string }> = {
  MONTHLY: { amountInr: 499, label: "Pro plan (monthly)" },
  YEARLY: { amountInr: 4999, label: "Pro plan (yearly)" },
};

export const getPlanDefinition = (tier: PlanTier): PlanDefinition => {
  return PLAN_DEFINITIONS[tier] ?? PLAN_DEFINITIONS.FREE;
};
