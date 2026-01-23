import type { Metadata } from "next";
import { Geist, Geist_Mono, Sen, Space_Grotesk } from "next/font/google";
import "../../globals.css";
import { cookies } from "next/headers";
import { SidebarProvider } from "../../../components/ui/sidebar";
import { SdSidebar } from "../../../components/SdSidebar";
import React from "react";
import ThemeProvider from "@/components/ThemeProvider";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import UserProfileButton from "@/components/UserProfileButton";
import ThemeSelectorButton from "@/components/ThemeSelectorButton";
import ReactFlowWrapper from "@/components/ReactFlowWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sen = Sen({
  variable: "--font-sen",
  subsets: ["latin"],
})

export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider appearance={{ baseTheme: undefined }}>
            <html lang="en">
                <body className={`${sen.variable} antialiased`}>
                    <ThemeProvider>
                        <SidebarProvider>
                            <div className='relative flex min-h-screen w-screen overflow-hidden bg-gradient-to-b from-slate-100 via-indigo-50/55 to-slate-100 dark:from-[#04060d] dark:via-[#070b18] dark:to-[#04060d]'>
                                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                                    <div className="absolute left-1/2 top-[-16rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-indigo-500/18 blur-[120px] dark:bg-indigo-600/25" />
                                    <div className="absolute right-[-8rem] top-[16rem] h-[18rem] w-[18rem] rounded-full bg-indigo-400/16 blur-[90px] dark:bg-indigo-500/14" />
                                    <div className="absolute left-[-6rem] top-[28rem] h-[16rem] w-[16rem] rounded-full bg-sky-300/16 blur-[80px] dark:bg-sky-500/10" />
                                </div>

                                {/* <SdSidebar /> */}
                                <div className="absolute top-0 right-0 z-50 m-3 flex items-center justify-center gap-3">
                                    <ThemeSelectorButton />
                                    <UserProfileButton />
                                </div>
                                <ReactFlowWrapper>
                                    <div className='flex flex-col w-full bg-gray-50 dark:bg-neutral-950'>
                                        {children}
                                    </div>
                                </ReactFlowWrapper>
                            </div>
                        </SidebarProvider>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
    {/* <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html></> */}
}