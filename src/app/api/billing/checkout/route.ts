import { NextRequest, NextResponse } from "next/server";
import { BillingPeriod, BillingProvider, PlanTier, Prisma, SubscriptionStatus } from "@prisma/client";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  createRazorpaySubscriptionCheckout,
  normalizeSubscriptionSnapshot,
  planTierFromSubscriptionStatus,
} from "@/lib/billing/razorpay";

type CheckoutBody = {
  period?: "MONTHLY" | "YEARLY";
};

const parseBillingPeriod = (period: unknown): BillingPeriod | null => {
  if (period === BillingPeriod.MONTHLY || period === BillingPeriod.YEARLY) {
    return period;
  }

  return null;
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser();
    const body = (await request.json()) as CheckoutBody;
    const billingPeriod = parseBillingPeriod(body.period);

    if (!billingPeriod) {
      return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
    }

    const existing = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    });

    if (existing?.status === SubscriptionStatus.ACTIVE && (await prisma.user.findUnique({ where: { id: user.id }, select: { planTier: true } }))?.planTier === PlanTier.PRO) {
      return NextResponse.json({ error: "Pro plan is already active" }, { status: 409 });
    }

    const subscription = await createRazorpaySubscriptionCheckout({
      period: billingPeriod,
      userId: user.id,
      email: user.email,
      name: user.username,
    });

    const normalized = normalizeSubscriptionSnapshot({
      entity: subscription,
      existingPeriod: billingPeriod,
    });

    await prisma.$transaction(async (tx) => {
      await tx.userSubscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
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
        update: {
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
          planTier: planTierFromSubscriptionStatus(normalized.status),
        },
      });
    });

    if (!subscription.short_url) {
      return NextResponse.json({ error: "Unable to create checkout link" }, { status: 502 });
    }

    return NextResponse.json({
      checkoutUrl: subscription.short_url,
      providerSubscriptionId: subscription.id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    const message = error instanceof Error ? error.message : "Failed to initialize checkout";
    const isRazorpayBadRequest =
      message.includes("Razorpay request failed (400)") &&
      (message.includes("BAD_REQUEST_ERROR") || message.toLowerCase().includes("does not exist"));

    if (isRazorpayBadRequest || message.includes("Expected a Razorpay Plan ID starting with \"plan_\"")) {
      return NextResponse.json(
        {
          error:
            "Razorpay plan configuration is invalid. Verify RAZORPAY_PLAN_ID_PRO_MONTHLY and RAZORPAY_PLAN_ID_PRO_YEARLY use real plan_ IDs from the same mode (both Test or both Live) as your Razorpay key.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
