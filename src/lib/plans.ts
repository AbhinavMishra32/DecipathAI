import { BillingPeriod, type PlanTier } from "@prisma/client";

export type AppPlanTier = "FREE" | "PRO" | "PREMIUM";
export type PaidPlanTier = Exclude<AppPlanTier, "FREE">;

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
  tier: AppPlanTier;
  label: string;
  pricing: {
    currency: "INR";
    monthly: number;
    yearly: number;
  };
  capabilities: PlanCapabilities;
};

export const PLAN_DEFINITIONS: Record<AppPlanTier, PlanDefinition> = {
  FREE: {
    tier: "FREE",
    label: "Free plan",
    pricing: {
      currency: "INR",
      monthly: 0,
      yearly: 0,
    },
    capabilities: {
      monthlyGenerationLimit: 2,
      maxSearchCalls: 6,
      maxSubqueriesPerSearchCall: 1,
      maxResultsPerQuery: 2,
      maxSearchDepth: "basic",
      pathwayPlanningMaxSteps: 4,
      roadmapSynthesisMaxSteps: 5,
    },
  },
  PRO: {
    tier: "PRO",
    label: "Pro plan",
    pricing: {
      currency: "INR",
      monthly: 499,
      yearly: 4999,
    },
    capabilities: {
      monthlyGenerationLimit: 10,
      maxSearchCalls: 16,
      maxSubqueriesPerSearchCall: 2,
      maxResultsPerQuery: 5,
      maxSearchDepth: "advanced",
      pathwayPlanningMaxSteps: 6,
      roadmapSynthesisMaxSteps: 7,
    },
  },
  PREMIUM: {
    tier: "PREMIUM",
    label: "Premium plan",
    pricing: {
      currency: "INR",
      monthly: 999,
      yearly: 9999,
    },
    capabilities: {
      monthlyGenerationLimit: 30,
      maxSearchCalls: 30,
      maxSubqueriesPerSearchCall: 4,
      maxResultsPerQuery: 7,
      maxSearchDepth: "advanced",
      pathwayPlanningMaxSteps: 10,
      roadmapSynthesisMaxSteps: 12,
    },
  },
};

export const PAID_BILLING_OPTIONS: Record<PaidPlanTier, Record<BillingPeriod, { amountInr: number; label: string }>> = {
  PRO: {
    MONTHLY: { amountInr: 499, label: "Pro plan (monthly)" },
    YEARLY: { amountInr: 4999, label: "Pro plan (yearly)" },
  },
  PREMIUM: {
    MONTHLY: { amountInr: 999, label: "Premium plan (monthly)" },
    YEARLY: { amountInr: 9999, label: "Premium plan (yearly)" },
  },
};

export const inferPaidPlanTierFromProviderPlanId = (planId?: string | null): PaidPlanTier | null => {
  if (!planId) {
    return null;
  }

  const proMonthly = process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY?.trim();
  const proYearly = process.env.RAZORPAY_PLAN_ID_PRO_YEARLY?.trim();
  const premiumMonthly = process.env.RAZORPAY_PLAN_ID_PREMIUM_MONTHLY?.trim();
  const premiumYearly = process.env.RAZORPAY_PLAN_ID_PREMIUM_YEARLY?.trim();

  if (planId === proMonthly || planId === proYearly) {
    return "PRO";
  }

  if (planId === premiumMonthly || planId === premiumYearly) {
    return "PREMIUM";
  }

  return null;
};

export const getPlanDefinition = (tier?: PlanTier | AppPlanTier | null): PlanDefinition => {
  if (tier === "PREMIUM") {
    return PLAN_DEFINITIONS.PREMIUM;
  }

  if (tier === "PRO") {
    return PLAN_DEFINITIONS.PRO;
  }

  return PLAN_DEFINITIONS.FREE;
};
