import { prisma } from '@/lib/db';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';
import { Webhook } from 'svix';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || '';

async function validateRequest(request: Request) {
    if (!webhookSecret) {
        throw new Error("You need a WEBHOOK_SECRET in your .env");
    }

    const payloadString = await request.text();
    const headerPayload = await headers();

    const svixHeaders = {
        'svix-id': headerPayload.get('svix-id')!,
        'svix-timestamp': headerPayload.get('svix-timestamp')!,
        'svix-signature': headerPayload.get('svix-signature')!,
    };
    const wh = new Webhook(webhookSecret);
    try {
        return wh.verify(payloadString, svixHeaders) as Event;
    } catch (error) {
        console.error("Error verifying webhook", error);
        return Response.error();
    }

}

type EventType = "user.created" | "user.updated" | "*";

type Event = {
    data: Record<string, string | number>;
    object: "event",
    type: EventType,
}

type ClerkEmailAddress = {
    email_address: string;
}

export async function POST(request: NextRequest) {
    if (!webhookSecret) {
        return new Response(JSON.stringify({ message: "CLERK_WEBHOOK_SECRET is not configured" }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    let evt: Event | null = null;
    evt = await validateRequest(request) as Event;
    const eventType: EventType = evt?.type;

    if (eventType === "user.created" || eventType === "user.updated") {
        const { id, ...attributes } = evt.data;
        const emailAddresses = attributes.email_addresses as unknown;
        const primaryEmail = Array.isArray(emailAddresses)
            ? (emailAddresses[0] as ClerkEmailAddress | undefined)?.email_address
            : undefined;

        if (!primaryEmail) {
            return new Response(JSON.stringify({ message: "Missing primary email in webhook payload" }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        console.log(id);
        console.log("User attributes", attributes);

        await prisma.user.upsert({
            where: { extId: id as string },
            create: {
            extId: id as string,
            username: attributes.username ? String(attributes.username) : (String(attributes.first_name) + " " + String(attributes.last_name)),
            email: primaryEmail,
            attributes: attributes,
            },
            update: { attributes },
        })
    }
    // console.log(payload);
    return new Response(JSON.stringify({ message: 'Received' }), {
        headers: { 'Content-Type': 'application/json' },
    });
}
