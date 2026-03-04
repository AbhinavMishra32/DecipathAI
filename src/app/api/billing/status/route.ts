import { NextResponse } from "next/server";
import { BillingProvider, PlanTier, Prisma, UsageMetric } from "@prisma/client";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlanDefinition } from "@/lib/plans";
import {
  getRazorpaySubscription,
  normalizeSubscriptionSnapshot,
  resolvePlanTierFromSubscription,
} from "@/lib/billing/razorpay";

const toErrorLog = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
};

const getUtcMonthWindow = () => {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0));
  return { periodStart, periodEnd };
};

export async function GET() {
  const requestId = `billing_status_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  let step = "init";

  console.info("[billing/status] request_started", { requestId });

  try {
    step = "require_db_user";
    const user = await requireDbUser();
    console.info("[billing/status] user_resolved", { requestId, userId: user.id });

    step = "resolve_period_window";
    const { periodStart, periodEnd } = getUtcMonthWindow();

    step = "load_user_and_subscription";
    const initialDbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        planTier: true,
        subscription: {
          select: {
            provider: true,
            providerSubscriptionId: true,
            providerPlanId: true,
            providerCustomerId: true,
            status: true,
            billingPeriod: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            canceledAt: true,
          },
        },
      },
    });

    let usageBucket: { used: number } | null = null;
    try {
      step = "load_usage_bucket";
      usageBucket = await prisma.usageBucket.findUnique({
        where: {
          userId_metric_periodStart: {
            userId: user.id,
            metric: UsageMetric.ROADMAP_GENERATION,
            periodStart,
          },
        },
        select: { used: true },
      });
    } catch (usageError) {
      console.error("[billing/status] usage_bucket_failed", {
        requestId,
        userId: user.id,
        periodStart: periodStart.toISOString(),
        error: toErrorLog(usageError),
      });
      usageBucket = null;
    }

    let dbUser = initialDbUser;

    const shouldAttemptSync =
      dbUser?.subscription?.provider === BillingProvider.RAZORPAY &&
      Boolean(dbUser.subscription.providerSubscriptionId);

    if (shouldAttemptSync) {
      try {
        step = "razorpay_fetch_subscription";
        const providerSubscription = await getRazorpaySubscription({
          subscriptionId: dbUser!.subscription!.providerSubscriptionId,
        });

        step = "normalize_subscription_snapshot";
        const normalized = normalizeSubscriptionSnapshot({
          entity: providerSubscription,
          existingPeriod: dbUser?.subscription?.billingPeriod ?? null,
        });

        const nextTier = resolvePlanTierFromSubscription({
          status: normalized.status,
          providerPlanId: normalized.providerPlanId,
          currentPlanTier: dbUser?.planTier,
        });

        step = "persist_subscription_sync";
        await prisma.$transaction(async (tx) => {
          await tx.userSubscription.update({
            where: { userId: user.id },
            data: {
              provider: BillingProvider.RAZORPAY,
              providerCustomerId: normalized.providerCustomerId,
              providerSubscriptionId: normalized.providerSubscriptionId,
              providerPlanId: normalized.providerPlanId,
              status: normalized.status,
              billingPeriod: normalized.billingPeriod,
              currentPeriodStart: normalized.currentPeriodStart,
              currentPeriodEnd: normalized.currentPeriodEnd,
              cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
              canceledAt: normalized.canceledAt,
              metadata: normalized.metadata as Prisma.InputJsonValue,
            },
          });

          await tx.user.update({
            where: { id: user.id },
            data: {
              planTier: nextTier,
            },
          });
        });

        dbUser = {
          ...dbUser!,
          planTier: nextTier,
          subscription: {
            ...dbUser!.subscription!,
            provider: BillingProvider.RAZORPAY,
            providerSubscriptionId: normalized.providerSubscriptionId,
            providerPlanId: normalized.providerPlanId,
            providerCustomerId: normalized.providerCustomerId,
            status: normalized.status,
            billingPeriod: normalized.billingPeriod,
            currentPeriodStart: normalized.currentPeriodStart,
            currentPeriodEnd: normalized.currentPeriodEnd,
            cancelAtPeriodEnd: normalized.cancelAtPeriodEnd,
            canceledAt: normalized.canceledAt,
          },
        };
        console.info("[billing/status] subscription_synced", {
          requestId,
          userId: user.id,
          providerSubscriptionId: normalized.providerSubscriptionId,
          status: normalized.status,
          planTier: nextTier,
        });
      } catch (syncError) {
        console.error("[billing/status] subscription_sync_failed", {
          requestId,
          userId: user.id,
          providerSubscriptionId: dbUser?.subscription?.providerSubscriptionId ?? null,
          error: toErrorLog(syncError),
        });
      }
    }

    step = "build_response";
    const tier = dbUser?.planTier ?? PlanTier.FREE;
    const plan = getPlanDefinition(tier);
    const monthlyGenerationLimit = plan.capabilities.monthlyGenerationLimit;
    const monthlyGenerationUsed = usageBucket?.used ?? 0;

    console.info("[billing/status] request_succeeded", {
      requestId,
      userId: user.id,
      planTier: tier,
      monthlyGenerationUsed,
      monthlyGenerationLimit,
    });

    return NextResponse.json({
      requestId,
      planTier: tier,
      planLabel: plan.label,
      pricing: {
        currency: plan.pricing.currency,
        proMonthly: getPlanDefinition(PlanTier.PRO).pricing.monthly,
        proYearly: getPlanDefinition(PlanTier.PRO).pricing.yearly,
        premiumMonthly: getPlanDefinition(PlanTier.PREMIUM).pricing.monthly,
        premiumYearly: getPlanDefinition(PlanTier.PREMIUM).pricing.yearly,
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
      console.warn("[billing/status] auth_failed", {
        requestId,
        step,
        error: toErrorLog(error),
      });
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error("[billing/status] request_failed", {
      requestId,
      step,
      error: toErrorLog(error),
    });

    return NextResponse.json({ error: "Failed to fetch billing status", requestId }, { status: 500 });
  }
}
