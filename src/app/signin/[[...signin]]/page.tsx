import { SignIn } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"

import AuthSplineScene from "@/components/AuthSplineScene"
import { hubotSans } from "@/lib/fonts"

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
const hasValidClerkPublishableKey = Boolean(publishableKey && publishableKey.startsWith("pk_"))

const AUTH_SCENE_URL = "https://prod.spline.design/MBuRFh8T2tstsb4D/scene.splinecode"

const clerkAppearance = {
  elements: {
    rootBox: "!w-full !bg-transparent",
    cardBox: "!w-full !bg-transparent",
    main: "!bg-transparent",
    card: "!w-full !border-0 !bg-transparent !p-0 !shadow-none",
    header: "hidden",
    footer: "hidden",
    socialButtonsBlockButton:
      "h-11 rounded-xl border border-white/24 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] text-white backdrop-blur-sm transition hover:border-indigo-300/60 hover:bg-white/[0.14]",
    socialButtonsBlockButtonText: "text-sm text-white",
    formButtonPrimary:
      "h-11 rounded-xl border border-indigo-200/70 bg-gradient-to-r from-indigo-500 via-indigo-400 to-sky-400 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_18px_34px_-18px_rgba(56,189,248,0.7)] hover:from-indigo-400 hover:via-indigo-300 hover:to-sky-300",
    formFieldLabel: "text-sm text-neutral-100",
    formFieldInput:
      "h-11 rounded-xl border border-white/22 bg-black/30 text-white placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] focus:border-indigo-300/70 focus:ring-indigo-300/50",
    formFieldInputShowPasswordButton: "text-neutral-300 hover:text-white",
    formFieldAction: "text-indigo-200 hover:text-white",
    formFieldErrorText: "text-rose-300",
    dividerLine: "bg-white/18",
    dividerText: "text-neutral-300",
    identityPreviewText: "text-neutral-100",
    identityPreviewEditButton: "text-indigo-200 hover:text-white",
  },
} as const

export default function SignInPage() {
  return (
    <main className={`${hubotSans.className} relative min-h-screen overflow-hidden bg-[#05060f] text-white`}>
      <AuthSplineScene scene={AUTH_SCENE_URL} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(129,140,248,0.12),transparent_48%),linear-gradient(180deg,rgba(2,6,23,0.12)_0%,rgba(2,6,23,0.2)_58%,rgba(2,6,23,0.34)_100%)]" />
      <div className="pointer-events-none absolute bottom-4 right-4 z-[140] h-12 w-[11rem] rounded-tl-[1rem] bg-gradient-to-tl from-[#01020a] via-[#01020a]/96 to-transparent backdrop-blur-sm sm:h-14 sm:w-[13rem]" />
      <div className="pointer-events-none absolute bottom-9 right-4 z-[141] h-8 w-32 rounded-lg bg-[#01020a]/95 blur-[1px] sm:h-9 sm:w-36" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/90">
            <svg width="28" height="34" viewBox="0 0 104 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="89" height="89" rx="28" fill="white" />
              <rect x="15" y="27" width="89" height="89" rx="28" fill="white" style={{ mixBlendMode: "difference" }} />
            </svg>
            <span className="tracking-wide">Decipath</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/30 px-3 py-1.5 text-xs text-white/85 backdrop-blur-md transition hover:bg-black/45"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to website
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="relative w-full max-w-[520px] pointer-events-auto">
            <div className="pointer-events-none absolute -inset-[1px] rounded-[2.2rem] bg-[linear-gradient(150deg,rgba(255,255,255,0.28),rgba(255,255,255,0.04)_38%,rgba(99,102,241,0.32)_75%,rgba(56,189,248,0.16))]" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[2.15rem] bg-[radial-gradient(circle_at_24%_10%,rgba(255,255,255,0.14),transparent_38%),radial-gradient(circle_at_84%_88%,rgba(56,189,248,0.12),transparent_42%)]" />

            <div className="relative rounded-[2.15rem] border border-white/16 bg-[linear-gradient(165deg,rgba(7,10,28,0.74),rgba(5,7,18,0.58))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_42px_90px_-50px_rgba(0,0,0,0.98)] backdrop-blur-[18px] sm:p-9">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.06] px-3 py-1 text-xs text-neutral-100">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-300 to-sky-300" />
                Roadmap workspace access
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome back</h1>
              <p className="mt-4 text-[15px] leading-relaxed text-neutral-200/90">
                Sign in to resume your active roadmap with context-rich milestones, dependencies, and next-best actions.
              </p>
              <p className="mt-2 text-sm text-neutral-300/95">
                New to Decipath?{" "}
                <Link href="/signup" className="text-indigo-200 underline decoration-indigo-200/70 underline-offset-4 hover:text-white">
                  Create your account
                </Link>
              </p>

              <div className="mt-8 [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-main]:!bg-transparent [&_.cl-rootBox]:!bg-transparent [&_.cl-header]:!hidden [&_.cl-footer]:!hidden">
                {hasValidClerkPublishableKey ? (
                  <SignIn forceRedirectUrl="/roadmaps" fallbackRedirectUrl="/roadmaps" appearance={clerkAppearance} />
                ) : (
                  <div className="rounded-xl border border-white/20 bg-black/35 p-4 text-sm text-neutral-200">
                    Clerk auth is not configured. Set <span className="font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to enable sign in.
                  </div>
                )}
              </div>

              <p className="mt-6 inline-flex items-center gap-2 text-xs text-neutral-300/90">
                <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
                Secure authentication with instant access to your execution map.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

