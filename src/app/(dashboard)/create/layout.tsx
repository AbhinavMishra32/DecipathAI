import { Sen } from "next/font/google";
import "../../globals.css";
import React from "react";
import ThemeProvider from "@/components/ThemeProvider";
import UserProfileButton from "@/components/UserProfileButton";
import ThemeSelectorButton from "@/components/ThemeSelectorButton";
import ReactFlowWrapper from "@/components/ReactFlowWrapper";
import Link from "next/link";

const sen = Sen({
  variable: "--font-sen",
  subsets: ["latin"],
})

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ThemeProvider>
            <div className={`${sen.variable} relative flex min-h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-100 via-indigo-50/55 to-slate-100 antialiased dark:from-[#04060d] dark:via-[#070b18] dark:to-[#04060d]`}>
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-indigo-500/18 blur-[120px] dark:bg-indigo-600/25" />
                    <div className="absolute right-[-8rem] top-[16rem] h-[18rem] w-[18rem] rounded-full bg-indigo-400/16 blur-[90px] dark:bg-indigo-500/14" />
                    <div className="absolute left-[-6rem] top-[28rem] h-[16rem] w-[16rem] rounded-full bg-sky-300/16 blur-[80px] dark:bg-sky-500/10" />
                </div>

                <aside className="z-20 hidden w-[17.5rem] shrink-0 flex-col border-r border-indigo-300/20 bg-white/75 px-4 py-5 backdrop-blur-sm dark:border-indigo-300/15 dark:bg-neutral-900/55 lg:flex">
                    <div className="mb-5 rounded-xl border border-indigo-200/70 bg-indigo-50/70 px-3 py-2 dark:border-indigo-300/20 dark:bg-indigo-900/20">
                        <p className="text-xs uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Decipath</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Workspace</p>
                    </div>

                    <nav className="space-y-2">
                        <Link
                            href="/"
                            className="inline-flex w-full items-center gap-2 rounded-lg border border-indigo-200/70 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-200"
                        >
                            <span aria-hidden>•</span>
                            Home Feed
                        </Link>
                        <Link
                            href="/roadmaps"
                            className="inline-flex w-full items-center gap-2 rounded-lg border border-indigo-200/70 bg-white/85 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 dark:border-indigo-300/20 dark:bg-neutral-900/45 dark:text-slate-200"
                        >
                            <span aria-hidden>•</span>
                            Dashboard
                        </Link>
                        <Link
                            href="/create"
                            className="inline-flex w-full items-center gap-2 rounded-lg border border-indigo-300/40 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
                        >
                            <span aria-hidden>•</span>
                            Create roadmap
                        </Link>
                    </nav>

                    <div className="mt-auto flex items-center gap-2">
                        <ThemeSelectorButton />
                        <UserProfileButton />
                    </div>
                </aside>

                <ReactFlowWrapper>
                    <div className='relative flex min-h-screen w-full flex-col bg-transparent'>
                        {children}
                    </div>
                </ReactFlowWrapper>
            </div>
        </ThemeProvider>
    );
}
