import { NextRequest, NextResponse } from "next/server";
import { Prisma, SubscriptionStatus } from "@prisma/client";
import { AuthError, requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  cancelRazorpaySubscription,
  normalizeSubscriptionSnapshot,
  planTierFromSubscriptionStatus,
} from "@/lib/billing/razorpay";

type CancelBody = {
  atPeriodEnd?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const user = await requireDbUser();
    const body = (await request.json().catch(() => ({}))) as CancelBody;
    const atPeriodEnd = body.atPeriodEnd !== false;

    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const canceled = await cancelRazorpaySubscription({
      subscriptionId: subscription.providerSubscriptionId,
      atPeriodEnd,
    });

    const normalized = normalizeSubscriptionSnapshot({
      entity: canceled,
      existingPeriod: subscription.billingPeriod,
    });

    const nextStatus = atPeriodEnd
      ? subscription.status
      : normalized.status === SubscriptionStatus.INCOMPLETE
        ? SubscriptionStatus.CANCELED
        : normalized.status;

    await prisma.$transaction(async (tx) => {
      await tx.userSubscription.update({
        where: { userId: user.id },
        data: {
          status: nextStatus,
          currentPeriodStart: normalized.currentPeriodStart,
          currentPeriodEnd: normalized.currentPeriodEnd,
          cancelAtPeriodEnd: atPeriodEnd,
          canceledAt: normalized.canceledAt,
          metadata: normalized.metadata as Prisma.InputJsonValue,
        },
      });

      if (!atPeriodEnd) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            planTier: planTierFromSubscriptionStatus(nextStatus),
          },
        });
      }
    });

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      cancelAtPeriodEnd: atPeriodEnd,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to cancel subscription",
      },
      { status: 500 },
    );
  }
}
