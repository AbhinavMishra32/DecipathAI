import Link from "next/link"
import { ArrowRight } from "lucide-react"
import LandingNavbar from "@/components/LandingNavbar"
import PricingComparisonSection from "@/components/pricing/PricingComparisonSection"
import { hubotSans } from "@/lib/fonts"
import { Button } from "@/components/ui/button"

export default function PricingPage() {
  return (
    <main className={`${hubotSans.className} min-h-screen bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white`}>
      <LandingNavbar />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-10 pt-32 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-neutral-200 bg-white/75 p-7 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/70 sm:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300/85">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Simple plans for every stage</h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
            Start with 2 free roadmaps right after signup. When you need higher monthly generation capacity and deeper planning support, upgrade to Pro or Premium.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-11 rounded-full bg-indigo-600 px-6 text-white hover:bg-indigo-500">
              <Link href="/signup">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-full px-6">
              <Link href="/settings">Manage billing</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-16 sm:px-6 lg:px-8">
        <PricingComparisonSection detailed />
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-neutral-200 bg-white/75 p-7 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/70 sm:p-10">
          <h2 className="text-2xl font-semibold sm:text-3xl">How billing and limits work</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
            <p>The Free plan is designed for onboarding and includes 2 roadmap generations.</p>
            <p>Paid plans run on recurring billing cycles, and generation quotas reset at the start of each cycle.</p>
            <p>When your current plan quota is reached, Decipath prompts you to upgrade before starting additional roadmap generations.</p>
            <p>Your saved roadmaps and account history remain available across all plan tiers.</p>
          </div>
        </div>
      </section>
    </main>
  )
}
