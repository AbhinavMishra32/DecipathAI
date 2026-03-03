import { SignIn } from "@clerk/nextjs"
import Spline from "@splinetool/react-spline/next"
import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { hubotSans } from "@/lib/fonts"

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
const hasValidClerkPublishableKey = Boolean(publishableKey && publishableKey.startsWith("pk_"))

const AUTH_SCENE_URL = "https://prod.spline.design/MBuRFh8T2tstsb4D/scene.splinecode"

const clerkAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "w-full border-0 bg-transparent p-0 shadow-none",
    header: "hidden",
    footer: "hidden",
    socialButtonsBlockButton:
      "h-11 rounded-xl border border-white/25 bg-white/[0.06] text-white transition hover:border-indigo-300/60 hover:bg-indigo-500/18",
    socialButtonsBlockButtonText: "text-sm text-white",
    formButtonPrimary:
      "h-11 rounded-xl border border-indigo-300/60 bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-[0_18px_38px_-20px_rgba(99,102,241,0.95)] hover:from-indigo-400 hover:to-sky-400",
    formFieldLabel: "text-sm text-neutral-200",
    formFieldInput:
      "h-11 rounded-xl border border-white/20 bg-black/25 text-white placeholder:text-neutral-400 focus:border-indigo-300/65 focus:ring-indigo-300/45",
    formFieldInputShowPasswordButton: "text-neutral-300 hover:text-white",
    formFieldAction: "text-indigo-300 hover:text-indigo-200",
    formFieldErrorText: "text-rose-300",
    dividerLine: "bg-white/18",
    dividerText: "text-neutral-300",
    identityPreviewText: "text-neutral-200",
    identityPreviewEditButton: "text-indigo-300 hover:text-indigo-200",
  },
} as const

export default function SignInPage() {
  return (
    <main className={`${hubotSans.className} relative min-h-screen overflow-hidden bg-[#05060f] text-white`}>
      <Spline scene={AUTH_SCENE_URL} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(129,140,248,0.28),transparent_44%),radial-gradient(circle_at_82%_82%,rgba(56,189,248,0.12),transparent_34%),linear-gradient(180deg,rgba(2,6,23,0.35)_0%,rgba(2,6,23,0.64)_58%,rgba(2,6,23,0.88)_100%)]" />

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
          <div className="w-full max-w-[560px] rounded-[2rem] border border-white/18 bg-white/[0.07] p-6 shadow-[0_40px_95px_-54px_rgba(0,0,0,0.95)] backdrop-blur-2xl sm:p-9">
            <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Welcome back</h1>
            <p className="mt-3 text-base text-neutral-200/90">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-indigo-200 underline decoration-indigo-200/70 underline-offset-4 hover:text-white">
                Create one
              </Link>
            </p>

            <div className="mt-8">
              {hasValidClerkPublishableKey ? (
                <SignIn forceRedirectUrl="/roadmaps" fallbackRedirectUrl="/roadmaps" appearance={clerkAppearance} />
              ) : (
                <div className="rounded-xl border border-amber-300/45 bg-amber-500/12 p-4 text-sm text-amber-100">
                  Clerk auth is not configured. Set <span className="font-semibold">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span> to enable sign in.
                </div>
              )}
            </div>

            <p className="mt-6 inline-flex items-center gap-2 text-xs text-neutral-300/90">
              <Sparkles className="h-3.5 w-3.5 text-indigo-200" />
              Secure access to your roadmap workspace.
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
