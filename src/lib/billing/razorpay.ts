import { createHmac, timingSafeEqual } from "crypto";
import { BillingPeriod, PlanTier, SubscriptionStatus } from "@prisma/client";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

type RazorpaySubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired"
  | "paused";

export type RazorpaySubscriptionEntity = {
  id: string;
  status: RazorpaySubscriptionStatus;
  plan_id?: string;
  current_start?: number;
  current_end?: number;
  ended_at?: number;
  cancel_at_cycle_end?: boolean;
  customer_id?: string;
  short_url?: string;
  notes?: Record<string, string>;
};

export type RazorpayWebhookPayload = {
  event: string;
  created_at?: number;
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };
  };
};

const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

const buildAuthHeader = (): string => {
  const keyId = requireEnv("RAZORPAY_KEY_ID");
  const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

const getPlanIdForPeriod = (period: BillingPeriod): string => {
  const envName = period === BillingPeriod.MONTHLY ? "RAZORPAY_PLAN_ID_PRO_MONTHLY" : "RAZORPAY_PLAN_ID_PRO_YEARLY";
  const planId = requireEnv(envName);

  if (!planId.startsWith("plan_")) {
    throw new Error(
      `Invalid ${envName}. Expected a Razorpay Plan ID starting with \"plan_\", received \"${planId}\".`,
    );
  }

  return planId;
};

const getTotalCount = (period: BillingPeriod): number => {
  return period === BillingPeriod.MONTHLY ? 120 : 20;
};

const mapRazorpayPeriod = (period?: string | null): BillingPeriod | null => {
  if (!period) {
    return null;
  }

  const normalized = period.toUpperCase();
  if (normalized === "MONTHLY") {
    return BillingPeriod.MONTHLY;
  }

  if (normalized === "YEARLY") {
    return BillingPeriod.YEARLY;
  }

  return null;
};

const inferBillingPeriodFromPlanId = (planId?: string | null): BillingPeriod | null => {
  if (!planId) {
    return null;
  }

  const monthly = process.env.RAZORPAY_PLAN_ID_PRO_MONTHLY?.trim();
  const yearly = process.env.RAZORPAY_PLAN_ID_PRO_YEARLY?.trim();

  if (monthly && planId === monthly) {
    return BillingPeriod.MONTHLY;
  }

  if (yearly && planId === yearly) {
    return BillingPeriod.YEARLY;
  }

  return null;
};

const fromUnixSeconds = (value?: number): Date | null => {
  if (!value || !Number.isFinite(value)) {
    return null;
  }

  return new Date(value * 1000);
};

const mapStatus = (status?: string | null): SubscriptionStatus => {
  const normalized = (status ?? "").toLowerCase();

  if (normalized === "active") {
    return SubscriptionStatus.ACTIVE;
  }

  if (normalized === "halted" || normalized === "paused") {
    return SubscriptionStatus.PAST_DUE;
  }

  if (normalized === "cancelled") {
    return SubscriptionStatus.CANCELED;
  }

  if (normalized === "completed" || normalized === "expired") {
    return SubscriptionStatus.EXPIRED;
  }

  return SubscriptionStatus.INCOMPLETE;
};

export const planTierFromSubscriptionStatus = (status: SubscriptionStatus): PlanTier => {
  if (status === SubscriptionStatus.ACTIVE || status === SubscriptionStatus.PAST_DUE) {
    return PlanTier.PRO;
  }

  return PlanTier.FREE;
};

const razorpayRequest = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: buildAuthHeader(),
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const bodyText = await response.text();
  const parsed = bodyText ? (JSON.parse(bodyText) as unknown) : {};

  if (!response.ok) {
    throw new Error(
      `Razorpay request failed (${response.status}): ${
        typeof parsed === "object" && parsed !== null ? JSON.stringify(parsed) : bodyText
      }`,
    );
  }

  return parsed as T;
};

export const createRazorpaySubscriptionCheckout = async ({
  period,
  userId,
  email,
  name,
}: {
  period: BillingPeriod;
  userId: string;
  email: string;
  name: string;
}): Promise<RazorpaySubscriptionEntity> => {
  const payload = {
    plan_id: getPlanIdForPeriod(period),
    total_count: getTotalCount(period),
    quantity: 1,
    customer_notify: 1,
    notify_info: {
      notify_email: email,
    },
    notes: {
      userId,
      period,
      product: "decipath_pro_plan",
      name,
    },
  };

  return razorpayRequest<RazorpaySubscriptionEntity>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getRazorpaySubscription = async ({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<RazorpaySubscriptionEntity> => {
  return razorpayRequest<RazorpaySubscriptionEntity>(`/subscriptions/${subscriptionId}`);
};

export const cancelRazorpaySubscription = async ({
  subscriptionId,
  atPeriodEnd,
}: {
  subscriptionId: string;
  atPeriodEnd: boolean;
}): Promise<RazorpaySubscriptionEntity> => {
  return razorpayRequest<RazorpaySubscriptionEntity>(`/subscriptions/${subscriptionId}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      cancel_at_cycle_end: atPeriodEnd ? 1 : 0,
    }),
  });
};

export const verifyRazorpayWebhookSignature = ({
  payload,
  signature,
}: {
  payload: string;
  signature: string;
}): boolean => {
  const secret = requireEnv("RAZORPAY_WEBHOOK_SECRET");
  const digest = createHmac("sha256", secret).update(payload).digest("hex");

  const digestBuffer = Buffer.from(digest);
  const signatureBuffer = Buffer.from(signature);

  if (digestBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(digestBuffer, signatureBuffer);
};

export const normalizeSubscriptionSnapshot = ({
  entity,
  existingPeriod,
}: {
  entity: RazorpaySubscriptionEntity;
  existingPeriod?: BillingPeriod | null;
}) => {
  const status = mapStatus(entity.status);
  const periodFromNotes = mapRazorpayPeriod(entity.notes?.period ?? null);
  const billingPeriod = periodFromNotes ?? inferBillingPeriodFromPlanId(entity.plan_id ?? null) ?? existingPeriod ?? null;

  return {
    providerCustomerId: entity.customer_id ?? null,
    providerSubscriptionId: entity.id,
    providerPlanId: entity.plan_id ?? null,
    status,
    billingPeriod,
    currentPeriodStart: fromUnixSeconds(entity.current_start),
    currentPeriodEnd: fromUnixSeconds(entity.current_end),
    cancelAtPeriodEnd: Boolean(entity.cancel_at_cycle_end),
    canceledAt: fromUnixSeconds(entity.ended_at),
    metadata: entity as unknown,
  };
};
