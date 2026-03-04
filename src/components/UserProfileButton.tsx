"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { twMerge } from "tailwind-merge";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const hasValidClerkPublishableKey = Boolean(
  publishableKey && publishableKey.startsWith("pk_"),
);

export default function UserProfileButton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  if (!hasValidClerkPublishableKey) {
    return (
      <div
        className={twMerge(
          "flex h-10 items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300",
          className,
        )}
        {...props}
      >
        <div className="h-6 w-6 rounded-full border border-indigo-300/70 bg-indigo-50 dark:border-indigo-300/35 dark:bg-neutral-800" />
        <div className="hidden flex-col sm:flex sm:leading-tight">
          <p className="max-w-[120px] truncate text-xs text-slate-700 dark:text-slate-200">
            Account
          </p>
          <p className="text-right text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
            Clerk disabled
          </p>
        </div>
      </div>
    );
  }

  return <ClerkUserProfileButton className={className} {...props} />;
}

function ClerkUserProfileButton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  const { user } = useUser();
  const { theme } = useTheme();

  return (
    <div
      className={twMerge(
        "flex h-10 items-center gap-1.5 rounded-lg border border-indigo-200/70 bg-white/70 px-3 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-xl transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-300 dark:hover:bg-neutral-800/60",
        className,
      )}
      {...props}
    >
      <UserButton
        appearance={{
          baseTheme: theme === "dark" ? dark : undefined,
          elements: {
            userButtonAvatarBox:
              "h-6 w-6 ring-1 ring-indigo-300/70 dark:ring-indigo-300/35",
          },
        }}
      />

      <div className="hidden flex-col sm:flex sm:leading-tight">
        <p className="max-w-[120px] truncate text-xs text-slate-700 dark:text-slate-200">
          {user?.username || user?.fullName || "Account"}
        </p>
        <p className="text-right text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
          Account
        </p>
      </div>
    </div>
  );
}
