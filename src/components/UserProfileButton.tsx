"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { twMerge } from "tailwind-merge";

export default function UserProfileButton({ className, ...props }: { className?: string; [key: string]: unknown }) {
  const { user } = useUser();
  const { theme } = useTheme();

export default function UserProfileButton({ className, ...props }: { className?: string, [key: string]: any }) {
    const { user } = useUser();
    const { theme } = useTheme();

    return (
        <div className={twMerge("flex items-center justify-center bg-opacity-40 dark:bg-neutral-200/40 border-2 border-gray-200 shadow-sm dark:border-neutral-800 backdrop-blur-md p-1 rounded-full", className)} {...props} style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255, 0.03)" : "#f9fafb", borderWidth: 1 }}>
            <div className="px-3 flex flex-col mr-[1px]">
                <p className="text-gray-700 dark:text-gray-300 text-sm">{user?.username || user?.fullName}</p>
                <p className="text-right text-gray-500 dark:text-gray-400 text-xs">Free account</p>
            </div>
            <UserButton
                appearance={{
                    baseTheme: theme === "dark" ? dark : undefined,
                    elements: {
                        userButtonAvatarBox: "w-8 h-8",
                        // userButtonBox: { blockSize: 30 },
                    }
                }}
            // showName
            />
        </div>
    );
}