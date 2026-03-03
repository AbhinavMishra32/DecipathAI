import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { BillingProvider, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  normalizeSubscriptionSnapshot,
  planTierFromSubscriptionStatus,
  verifyRazorpayWebhookSignature,
  type RazorpayWebhookPayload,
} from "@/lib/billing/razorpay";

export const runtime = "nodejs";

const toProviderEventId = (payload: string, headerValue: string | null, parsed: RazorpayWebhookPayload): string => {
  if (headerValue && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  const hash = createHash("sha256").update(payload).digest("hex").slice(0, 24);
  return `${parsed.event}:${parsed.created_at ?? 0}:${hash}`;
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-razorpay-signature");
  const eventHeader = request.headers.get("x-razorpay-event-id");

  if (!signature) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
  }

  const payload = await request.text();
  if (!verifyRazorpayWebhookSignature({ payload, signature })) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
  }

  let parsed: RazorpayWebhookPayload;
  try {
    parsed = JSON.parse(payload) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const providerEventId = toProviderEventId(payload, eventHeader, parsed);

  const existingEvent = await prisma.billingWebhookEvent.findUnique({
    where: { providerEventId },
    select: { id: true, processedAt: true },
  });

  if (existingEvent) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const webhookEvent = await prisma.billingWebhookEvent.create({
    data: {
      provider: BillingProvider.RAZORPAY,
      providerEventId,
      eventType: parsed.event,
      payload: parsed as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  const subscriptionEntity = parsed.payload?.subscription?.entity;
  if (!subscriptionEntity) {
    await prisma.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
        processingError: "No subscription payload present",
      },
    });

    return NextResponse.json({ ok: true, ignored: true });
  }

  const existingSubscription = await prisma.userSubscription.findUnique({
    where: { providerSubscriptionId: subscriptionEntity.id },
    select: {
      userId: true,
      billingPeriod: true,
    },
  });

  const userIdFromNotes = subscriptionEntity.notes?.userId;
  const resolvedUserId = userIdFromNotes ?? existingSubscription?.userId;

  if (!resolvedUserId) {
    await prisma.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
        processingError: "Missing user mapping in subscription notes",
      },
    });

    return NextResponse.json({ ok: true, ignored: true });
  }

  const normalized = normalizeSubscriptionSnapshot({
    entity: subscriptionEntity,
    existingPeriod: existingSubscription?.billingPeriod,
  });

  await prisma.$transaction(async (tx) => {
    await tx.userSubscription.upsert({
      where: { userId: resolvedUserId },
      create: {
        userId: resolvedUserId,
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
      where: { id: resolvedUserId },
      data: {
        planTier: planTierFromSubscriptionStatus(normalized.status),
      },
    });

    await tx.billingWebhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        processedAt: new Date(),
        processingError: null,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
