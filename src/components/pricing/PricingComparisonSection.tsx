import Link from "next/link"
import { Button } from "@/components/ui/button"

export type PricingPlanCard = {
  key: "FREE" | "PRO" | "PREMIUM"
  name: string
  price: string
  cadence: string
  description: string
  bullets: string[]
  ctaLabel: string
  ctaHref: string
  highlighted?: boolean
}

const PRICING_PLANS: PricingPlanCard[] = [
  {
    key: "FREE",
    name: "Free",
    price: "₹0",
    cadence: "to start",
    description: "Best for trying Decipath before upgrading.",
    bullets: [
      "2 roadmap generations",
      "Basic AI depth and research",
      "Save and revisit your roadmaps",
    ],
    ctaLabel: "Start free",
    ctaHref: "/signup",
  },
  {
    key: "PRO",
    name: "Pro",
    price: "₹499",
    cadence: "per month",
    description: "For individual builders who need steady monthly output.",
    bullets: [
      "10 roadmap generations per month",
      "Advanced research depth",
      "Better pathway synthesis",
    ],
    ctaLabel: "Choose Pro",
    ctaHref: "/settings",
    highlighted: true,
  },
  {
    key: "PREMIUM",
    name: "Premium",
    price: "₹999",
    cadence: "per month",
    description: "For power users, teams, and high-velocity planning.",
    bullets: [
      "30 roadmap generations per month",
      "Deepest planning and search capacity",
      "Maximum roadmap complexity support",
    ],
    ctaLabel: "Choose Premium",
    ctaHref: "/settings",
  },
]

type FeatureRow = {
  feature: string
  free: string
  pro: string
  premium: string
}

const FEATURE_ROWS: FeatureRow[] = [
  {
    feature: "Roadmap generations",
    free: "2 included",
    pro: "10 / month",
    premium: "30 / month",
  },
  {
    feature: "Research depth",
    free: "Basic",
    pro: "Advanced",
    premium: "Advanced+",
  },
  {
    feature: "Search capacity",
    free: "Starter",
    pro: "Expanded",
    premium: "Highest",
  },
  {
    feature: "Best for",
    free: "Trying Decipath",
    pro: "Serious solo workflows",
    premium: "Power users and teams",
  },
]

export default function PricingComparisonSection({
  detailed = false,
}: {
  detailed?: boolean
}) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white/75 p-6 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/70 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(99,102,241,0.2),transparent_45%)]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-neutral-950 dark:text-white sm:text-4xl">Pricing plans</h2>
            <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
              Start with 2 free roadmaps, then upgrade when you need more monthly capacity.
            </p>
          </div>
          {detailed ? null : (
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/pricing">See full pricing</Link>
            </Button>
          )}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`rounded-[1.4rem] border p-5 sm:p-6 ${
                plan.highlighted
                  ? "border-indigo-300/60 bg-indigo-500/10 shadow-[0_20px_44px_-30px_rgba(79,70,229,0.8)] dark:border-indigo-300/40 dark:bg-indigo-500/12"
                  : "border-neutral-200 bg-white/85 dark:border-neutral-800 dark:bg-neutral-900/55"
              }`}
            >
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{plan.name}</p>
              <div className="mt-2 flex items-end gap-2">
                <p className="text-3xl font-semibold text-indigo-700 dark:text-indigo-100">{plan.price}</p>
                <p className="pb-1 text-xs uppercase tracking-[0.16em] text-neutral-500 dark:text-neutral-400">{plan.cadence}</p>
              </div>
              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{plan.description}</p>

              <div className="mt-4 space-y-2">
                {plan.bullets.map((bullet) => (
                  <p key={bullet} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                    <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-indigo-500/80" />
                    {bullet}
                  </p>
                ))}
              </div>

              <Button
                asChild
                className={`mt-6 h-10 w-full rounded-xl text-sm ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white hover:bg-indigo-500"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-indigo-100"
                }`}
              >
                <Link href={plan.ctaHref}>{plan.ctaLabel}</Link>
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-800">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-neutral-100/70 dark:bg-neutral-900/70">
              <tr>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200">Feature</th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200">Free</th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200">Pro</th>
                <th className="px-4 py-3 font-medium text-neutral-700 dark:text-neutral-200">Premium</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_ROWS.map((row) => (
                <tr key={row.feature} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="px-4 py-3 text-neutral-800 dark:text-neutral-100">{row.feature}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{row.free}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{row.pro}</td>
                  <td className="px-4 py-3 text-neutral-600 dark:text-neutral-300">{row.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {detailed ? (
          <div className="mt-6 rounded-2xl border border-neutral-200/70 bg-white/70 p-4 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300">
            Free includes 2 roadmap generations to evaluate fit. Pro and Premium quotas reset monthly. Choose yearly on paid tiers for discounted effective pricing.
          </div>
        ) : null}
      </div>
    </section>
  )
}
