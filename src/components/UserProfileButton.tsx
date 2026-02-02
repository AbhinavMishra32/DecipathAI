"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { twMerge } from "tailwind-merge";

export default function UserProfileButton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  const { user } = useUser();
  const { theme } = useTheme();

  return (
    <div
      className={twMerge(
        "flex items-center justify-center rounded-full border border-indigo-200/75 bg-white/75 p-1.5 shadow-[0_14px_35px_-24px_rgba(79,70,229,0.7)] backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-900/60 dark:shadow-[0_16px_40px_-24px_rgba(79,70,229,0.8)]",
        className,
      )}
      {...props}
    >
      <div className="hidden px-3 sm:flex sm:flex-col sm:leading-tight">
        <p className="max-w-[130px] truncate text-sm text-slate-700 dark:text-slate-200">{user?.username || user?.fullName || "Account"}</p>
        <p className="text-right text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Free account</p>
      </div>
      <UserButton
        appearance={{
          baseTheme: theme === "dark" ? dark : undefined,
          elements: {
            userButtonAvatarBox:
              "h-8 w-8 ring-2 ring-indigo-300/70 dark:ring-indigo-300/35",
          },
        }}
      />
    </div>
  );
}
