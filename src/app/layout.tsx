import type { Metadata } from "next";
import { Geist, Geist_Mono, Sen } from "next/font/google";
import "./globals.css";
import React from "react";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});


export const metadata: Metadata = {
    title: "Decipath | AI Roadmap Generator",
    description: "Generate any roadmap you want",
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
const hasValidClerkPublishableKey = Boolean(
    publishableKey && publishableKey.startsWith("pk_"),
);


export default async function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    let appContent = children;

    if (hasValidClerkPublishableKey && publishableKey) {
        const [{ ClerkProvider }, { dark }] = await Promise.all([
            import("@clerk/nextjs"),
            import("@clerk/themes"),
        ]);

        appContent = (
            <ClerkProvider
                publishableKey={publishableKey}
                appearance={{
                    baseTheme: dark,
                    elements: {
                        footer: "hidden",
                    },
                }}
            >
                {children}
            </ClerkProvider>
        );
    }

    return (
        <html lang="en">
            <body>
                {appContent}
                <Analytics />
            </body>
        </html>
    );
}