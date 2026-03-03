import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
}

const createPrismaClient = () =>
    new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : []
    });

const canReusePrismaClient = (client: PrismaClient | undefined): client is PrismaClient => {
    if (!client) {
        return false;
    }

    // In dev, a stale global PrismaClient can survive HMR after schema/model updates.
    // Recreate if newly-added model delegates are missing.
    const delegates = client as unknown as Record<string, unknown>;
    return (
        "roadmapProgress" in delegates &&
        "userSubscription" in delegates &&
        "usageBucket" in delegates &&
        "roadmapGenerationRun" in delegates &&
        "billingWebhookEvent" in delegates
    );
};

export const prisma = canReusePrismaClient(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
