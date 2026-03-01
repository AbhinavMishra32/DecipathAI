/**
 * Auth helpers — resolve Clerk identity to internal DB user.
 *
 * Clerk stores its user id in `User.extId`. All backend code
 * should call `requireDbUser()` to get the internal cuid.
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";

export interface DbUser {
  id: string;       // internal cuid
  extId: string;    // Clerk user id
  username: string;
  email: string;
}

/**
 * Resolve the current Clerk session to the internal DB user.
 * Throws if not authenticated or user doesn't exist in DB yet.
 */
export async function requireDbUser(): Promise<DbUser> {
  const { userId } = await auth();
  if (!userId) {
    throw new AuthError("Not authenticated");
  }

  const existingUser = await prisma.user.findUnique({
    where: { extId: userId },
    select: { id: true, extId: true, username: true, email: true },
  });

  if (existingUser) {
    return existingUser;
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new AuthError("Authenticated session found but Clerk user profile was unavailable.");
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new AuthError("No email found on your Clerk profile.");
  }

  const username =
    clerkUser.username?.trim() ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0] ||
    "User";

  const attributes = {
    clerkId: clerkUser.id,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    imageUrl: clerkUser.imageUrl,
  };

  const created = await prisma.user.upsert({
    where: { extId: userId },
    update: {
      username,
      email,
      attributes,
    },
    create: {
      extId: userId,
      username,
      email,
      attributes,
    },
    select: { id: true, extId: true, username: true, email: true },
  });

  return created;
}

/**
 * Same as requireDbUser but returns null instead of throwing
 * when not authenticated.
 */
export async function getDbUser(): Promise<DbUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    return await requireDbUser();
  } catch {
    return null;
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}
