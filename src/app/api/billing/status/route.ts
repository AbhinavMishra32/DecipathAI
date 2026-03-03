import { NextResponse } from "next/server";
import { PlanTier, UsageMetric } from "@prisma/client";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FREE_MONTHLY_LIMIT = 10;
const PRO_MONTHLY_LIMIT = 120;

const getUtcMonthWindow = () => {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
};

export async function GET() {
  try {
    const user = await requireDbUser();
    const { periodStart, periodEnd } = getUtcMonthWindow();

    const [dbUser, usageBucket] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          planTier: true,
          subscription: {
            select: {
              provider: true,
              providerSubscriptionId: true,
              status: true,
              billingPeriod: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      }),
      prisma.usageBucket.findUnique({
        where: {
          userId_metric_periodStart: {
            userId: user.id,
            metric: UsageMetric.ROADMAP_GENERATION,
            periodStart,
          },
        },
        select: { used: true },
      }),
    ]);

    const tier = dbUser?.planTier ?? PlanTier.FREE;
    const monthlyGenerationLimit = tier === PlanTier.PRO ? PRO_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
    const monthlyGenerationUsed = usageBucket?.used ?? 0;

    return NextResponse.json({
      planTier: tier,
      planLabel: tier === PlanTier.PRO ? "Pro plan" : "Free plan",
      pricing: {
        currency: "INR",
        proMonthly: 499,
        proYearly: 4999,
      },
      usage: {
        monthlyGenerationUsed,
        monthlyGenerationLimit,
        monthlyGenerationRemaining: Math.max(0, monthlyGenerationLimit - monthlyGenerationUsed),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
      },
      subscription: dbUser?.subscription
        ? {
            provider: dbUser.subscription.provider,
            providerSubscriptionId: dbUser.subscription.providerSubscriptionId,
            status: dbUser.subscription.status,
            billingPeriod: dbUser.subscription.billingPeriod,
            currentPeriodEnd: dbUser.subscription.currentPeriodEnd?.toISOString() ?? null,
            cancelAtPeriodEnd: dbUser.subscription.cancelAtPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ error: "Failed to fetch billing status" }, { status: 500 });
  }
}
