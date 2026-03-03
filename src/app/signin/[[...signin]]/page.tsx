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
      "h-11 rounded-xl border border-white/22 bg-white/[0.06] text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-white/35 hover:bg-white/[0.1] active:translate-y-0 active:scale-100",
    socialButtonsBlockButtonText: "text-sm text-white",
    formButtonPrimary:
      "h-11 rounded-xl border border-white/32 bg-[#7ea6ff]/72 text-white backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_18px_34px_-22px_rgba(83,111,209,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8eb3ff]/78 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.42),0_24px_40px_-22px_rgba(83,111,209,0.95)] active:translate-y-0",
    formFieldLabel: "text-sm text-neutral-100",
    formFieldInput:
      "h-11 rounded-xl border border-white/20 bg-black/28 text-white placeholder:text-neutral-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] transition-all duration-300 focus:border-white/36 focus:ring-white/20 focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_0_0_1px_rgba(255,255,255,0.18)]",
    formFieldInputShowPasswordButton: "text-neutral-300 hover:text-white",
    formFieldAction: "text-neutral-300 transition-colors duration-200 hover:text-white",
    formFieldErrorText: "text-rose-300",
    dividerLine: "bg-white/18",
    dividerText: "text-neutral-300",
    identityPreviewText: "text-neutral-100",
    identityPreviewEditButton: "text-neutral-300 transition-colors duration-200 hover:text-white",
  },
} as const

export default function SignInPage() {
  return (
    <main className={`${hubotSans.className} relative min-h-screen overflow-hidden bg-[#05060f] text-white`}>
      <AuthSplineScene scene={AUTH_SCENE_URL} className="absolute inset-0 h-full w-full auth-enter" />
      <div className="pointer-events-none absolute inset-0 bg-black/38 auth-enter" />

      <div className="pointer-events-none relative z-10 mx-auto flex min-h-screen w-full max-w-[1240px] flex-col px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <header className="pointer-events-auto flex items-center justify-between">
          <Link href="/" className="auth-enter inline-flex items-center gap-2 text-sm text-white/90">
            <svg width="28" height="34" viewBox="0 0 104 116" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect width="89" height="89" rx="28" fill="white" />
              <rect x="15" y="27" width="89" height="89" rx="28" fill="white" style={{ mixBlendMode: "difference" }} />
            </svg>
            <span className="tracking-wide">Decipath</span>
          </Link>

          <Link
            href="/"
            className="auth-enter auth-enter-1 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/40 px-3 py-1.5 text-xs text-white/85 transition-all duration-300 hover:-translate-y-0.5 hover:bg-black/55"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to website
          </Link>
        </header>

        <section className="flex flex-1 items-center justify-center py-8 sm:py-10">
          <div className="auth-enter auth-enter-2 relative w-full max-w-[520px] pointer-events-auto">
            <div className="pointer-events-none absolute -inset-[1px] rounded-[2.2rem] border border-white/12" />
            <div className="pointer-events-none absolute inset-[1px] rounded-[2.15rem] bg-white/[0.02]" />

            <div className="auth-card-float auth-scan relative rounded-[2.15rem] border border-white/18 bg-[#0b1020]/62 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_45px_70px_-55px_rgba(0,0,0,0.96)] backdrop-blur-[14px] sm:p-9">
              <div className="auth-enter auth-enter-3 inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/[0.05] px-3 py-1 text-xs text-neutral-100">
                <span className="auth-dot-pulse h-2 w-2 rounded-full bg-sky-300" />
                Resume your execution map
              </div>

              <h1 className="auth-enter auth-enter-4 mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Return to your roadmap.
                <span className="block text-slate-200/95">Execute the next move.</span>
              </h1>
              <p className="auth-enter auth-enter-5 mt-3 text-sm leading-relaxed text-neutral-200/90">
                Your next steps are already mapped. Sign in and keep shipping.
              </p>
              <p className="auth-enter auth-enter-5 mt-2 text-sm text-neutral-300/95">
                New here?{" "}
                <Link
                  href="/signup"
                  className="text-slate-200 underline decoration-white/40 underline-offset-4 transition-colors duration-200 hover:text-white"
                >
                  Create your Decipath account
                </Link>
              </p>

              <div className="auth-enter auth-enter-6 mt-8 [&_.cl-card]:!bg-transparent [&_.cl-card]:!shadow-none [&_.cl-main]:!bg-transparent [&_.cl-rootBox]:!bg-transparent [&_.cl-header]:!hidden [&_.cl-footer]:!hidden">
                {hasValidClerkPublishableKey ? (
                  <SignIn forceRedirectUrl="/roadmaps" fallbackRedirectUrl="/roadmaps" appearance={clerkAppearance} />
                ) : (
                  <div className="rounded-xl border border-white/20 bg-black/30 p-4 text-sm text-neutral-200">
                    Clerk auth is not configured. Set <span className="font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to enable sign in.
                  </div>
                )}
              </div>

              <p className="auth-enter auth-enter-7 mt-6 inline-flex items-center gap-2 text-xs text-neutral-300/90">
                <Sparkles className="h-3.5 w-3.5 text-neutral-200" />
                Private sign-in. Instant access to your full execution system.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
