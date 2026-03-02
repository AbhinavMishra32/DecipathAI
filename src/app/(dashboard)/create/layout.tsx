import { Sen } from "next/font/google";
import "../../globals.css";
import React from "react";
import ThemeProvider from "@/components/ThemeProvider";
import ReactFlowWrapper from "@/components/ReactFlowWrapper";
import WorkspaceNavSidebar from "@/components/WorkspaceNavSidebar";

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
                <WorkspaceNavSidebar />

                <ReactFlowWrapper>
                    <div className='relative flex min-h-screen w-full flex-col bg-transparent'>
                        {children}
                    </div>
                </ReactFlowWrapper>
            </div>
        </ThemeProvider>
    );
}
