"use client"

import { useTheme } from "next-themes"
import { useState, useEffect, useCallback } from "react"
import { hubotSans } from "@/lib/fonts"
import { Moon, Sun, Desktop, Keyboard, Info } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import DecipathLogo from "@/components/DecipathLogo"

const themeOptions = [
  {
    value: "light",
    label: "Light",
    icon: Sun,
    description: "Clean light appearance",
  },
  {
    value: "dark",
    label: "Dark",
    icon: Moon,
    description: "Easy on the eyes",
  },
  {
    value: "system",
    label: "System",
    icon: Desktop,
    description: "Match your device",
  },
] as const

const shortcuts = [
  { keys: ["⌘", "B"], description: "Toggle sidebar pin" },
  { keys: ["⌘", "K"], description: "Open search" },
  { keys: ["⌘", "↵"], description: "Generate roadmap" },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [billingStatus, setBillingStatus] = useState<{
    planTier: "FREE" | "PRO"
    planLabel: string
    pricing: {
      currency: string
      proMonthly: number
      proYearly: number
    }
    usage: {
      monthlyGenerationUsed: number
      monthlyGenerationLimit: number
      monthlyGenerationRemaining: number
      periodEnd: string
    }
    subscription: {
      provider: "RAZORPAY"
      status: string
      billingPeriod: "MONTHLY" | "YEARLY" | null
      currentPeriodEnd: string | null
      cancelAtPeriodEnd: boolean
    } | null
  } | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingMessage, setBillingMessage] = useState<string | null>(null)

  const loadBillingStatus = useCallback(async () => {
    const response = await fetch("/api/billing/status")
    if (!response.ok) {
      return
    }

    const payload = (await response.json()) as typeof billingStatus
    setBillingStatus(payload)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }

    loadBillingStatus().catch(() => {})
  }, [mounted, loadBillingStatus])

  const startCheckout = async (period: "MONTHLY" | "YEARLY") => {
    setBillingLoading(true)
    setBillingMessage(null)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period }),
      })
      const payload = (await response.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null
      if (!response.ok || !payload?.checkoutUrl) {
        setBillingMessage(payload?.error ?? "Unable to start checkout right now.")
        return
      }

      window.location.href = payload.checkoutUrl
    } finally {
      setBillingLoading(false)
    }
  }

  const cancelPro = async () => {
    setBillingLoading(true)
    setBillingMessage(null)
    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ atPeriodEnd: true }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      if (!response.ok) {
        setBillingMessage(payload?.error ?? "Unable to cancel subscription right now.")
        return
      }

      setBillingMessage("Your Pro plan will be canceled at the end of the current billing period.")
      await loadBillingStatus()
    } finally {
      setBillingLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className={`${hubotSans.className} mx-auto max-w-2xl px-6 py-12 sm:px-8`}>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Settings
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Manage your preferences and account settings.
      </p>

      {/* ── Appearance ──────────────────────────────────────── */}
      <section className="mt-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Sun weight="duotone" className="h-4 w-4 text-indigo-500" />
          Appearance
        </div>
        <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
          Choose how Decipath looks for you.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon
            const active = theme === opt.value

            return (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-4 text-left transition-all duration-150",
                  active
                    ? "border-indigo-300/50 bg-indigo-50/50 ring-1 ring-indigo-400/25 dark:border-indigo-500/25 dark:bg-indigo-500/[0.08] dark:ring-indigo-500/15"
                    : "border-slate-200/60 bg-white/70 hover:border-slate-300/70 hover:bg-slate-50/70 dark:border-neutral-800/60 dark:bg-neutral-900/30 dark:hover:border-neutral-700 dark:hover:bg-neutral-800/30",
                )}
              >
                <Icon
                  weight={active ? "fill" : "regular"}
                  className={cn(
                    "h-5 w-5",
                    active
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                />
                <p
                  className={cn(
                    "mt-3 text-[13px] font-semibold",
                    active
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-slate-700 dark:text-slate-300",
                  )}
                >
                  {opt.label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {opt.description}
                </p>
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Billing ─────────────────────────────────────────── */}
      <section className="mt-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Moon weight="duotone" className="h-4 w-4 text-indigo-500" />
          Billing & plan
        </div>
        <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/70 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/30">
          {!billingStatus ? (
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Loading plan details...</p>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-slate-200">{billingStatus.planLabel}</p>
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
                    {billingStatus.usage.monthlyGenerationUsed}/{billingStatus.usage.monthlyGenerationLimit} roadmap generations used this month
                  </p>
                </div>
                <span className="rounded-full border border-slate-200/60 bg-slate-50/70 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-neutral-700/60 dark:bg-neutral-800/70 dark:text-slate-400">
                  Renews monthly
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200/70 dark:bg-neutral-800/70">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        (billingStatus.usage.monthlyGenerationUsed / Math.max(1, billingStatus.usage.monthlyGenerationLimit)) * 100,
                      ),
                    )}%`,
                  }}
                />
              </div>

              {billingStatus.planTier === "FREE" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => startCheckout("MONTHLY")}
                    disabled={billingLoading}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-[12px] font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    Upgrade (₹{billingStatus.pricing.proMonthly}/mo)
                  </button>
                  <button
                    onClick={() => startCheckout("YEARLY")}
                    disabled={billingLoading}
                    className="rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-slate-200 dark:hover:bg-neutral-800"
                  >
                    Upgrade (₹{billingStatus.pricing.proYearly}/yr)
                  </button>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={cancelPro}
                    disabled={billingLoading || Boolean(billingStatus.subscription?.cancelAtPeriodEnd)}
                    className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-600/40 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
                  >
                    {billingStatus.subscription?.cancelAtPeriodEnd ? "Cancellation scheduled" : "Cancel at period end"}
                  </button>
                  {billingStatus.subscription?.currentPeriodEnd && (
                    <p className="self-center text-[11px] text-slate-500 dark:text-slate-400">
                      Current period ends on {new Date(billingStatus.subscription.currentPeriodEnd).toLocaleDateString()}.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
          {billingMessage && (
            <p className="mt-3 text-[12px] text-slate-600 dark:text-slate-300">{billingMessage}</p>
          )}
        </div>
      </section>

      {/* ── Keyboard shortcuts ─────────────────────────────── */}
      <section className="mt-10">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Keyboard weight="duotone" className="h-4 w-4 text-indigo-500" />
          Keyboard shortcuts
        </div>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/60 bg-white/70 dark:border-neutral-800/60 dark:bg-neutral-900/30">
          {shortcuts.map((shortcut, index) => (
            <div
              key={shortcut.description}
              className={cn(
                "flex items-center justify-between px-4 py-3",
                index !== shortcuts.length - 1 &&
                  "border-b border-slate-100/70 dark:border-neutral-800/40",
              )}
            >
              <span className="text-[13px] text-slate-600 dark:text-slate-300">
                {shortcut.description}
              </span>
              <div className="flex items-center gap-1">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-slate-200/60 bg-slate-50/70 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:border-neutral-700/60 dark:bg-neutral-800/70 dark:text-slate-400"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────── */}
      <section className="mt-10 pb-12">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Info weight="duotone" className="h-4 w-4 text-indigo-500" />
          About Decipath
        </div>
        <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/70 p-5 dark:border-neutral-800/60 dark:bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <DecipathLogo
              size={40}
              subtitle="AI-powered roadmap generator"
              markClassName="rounded-xl"
              className="gap-3"
              nameClassName="text-[13px] font-semibold text-slate-800 dark:text-slate-200"
              subtitleClassName="mt-1 text-[11px] normal-case tracking-normal text-slate-500 dark:text-slate-400"
            />
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
            Generate deep, interactive roadmaps from any goal. Every milestone
            becomes a clickable node with connected context, actionable tasks,
            and realistic time estimates you can execute immediately.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200/60 bg-slate-50/60 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-slate-400">
              AI Generation
            </span>
            <span className="rounded-full border border-slate-200/60 bg-slate-50/60 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-slate-400">
              Interactive Graphs
            </span>
            <span className="rounded-full border border-slate-200/60 bg-slate-50/60 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-slate-400">
              Progress Tracking
            </span>
            <span className="rounded-full border border-slate-200/60 bg-slate-50/60 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:border-neutral-800/60 dark:bg-neutral-900/40 dark:text-slate-400">
              Community Feed
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
