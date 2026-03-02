"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion"
import { InteractiveHoverButton } from "./magicui/interactive-hover-button"
import { hubotSans } from "@/lib/fonts"
import ThemeSelectorButton from "./ThemeSelectorButton"

const navigation = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Use Cases", href: "#use-cases" },
]

const SCROLL_TRIGGER = 24

const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState<string>("")

  const { scrollY, scrollYProgress } = useScroll()
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 34,
    mass: 0.3,
  })

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > SCROLL_TRIGGER
    setIsScrolled((prev) => (prev === next ? prev : next))
  })

  const sectionIds = useMemo(() => navigation.map((item) => item.href.replace("#", "")), [])

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))

    if (!sections.length) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) {
          setActiveSection(visible[0].target.id)
        }
      },
      {
        root: null,
        rootMargin: "-32% 0px -52% 0px",
        threshold: [0.2, 0.35, 0.5, 0.75],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [sectionIds])

  return (
    <motion.header
      initial={{ y: -22, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4"
      aria-label="Primary"
    >
      <motion.nav
        className={`relative mx-auto h-[74px] overflow-hidden rounded-full border transition-[width,transform,background-color,box-shadow,border-color] duration-500 ease-out ${
          isScrolled
            ? "w-[min(980px,calc(100vw-18px))] border-indigo-300/55 bg-white/88 shadow-[0_24px_55px_-26px_rgba(59,71,111,0.35)] dark:border-indigo-300/45 dark:bg-[rgba(8,12,30,0.88)] dark:shadow-[0_24px_55px_-26px_rgba(0,0,0,0.85)]"
            : "w-[min(1120px,calc(100vw-12px))] border-neutral-200 bg-white/70 shadow-[0_14px_38px_-24px_rgba(59,71,111,0.3)] dark:border-neutral-700/60 dark:bg-[rgba(6,9,24,0.58)] dark:shadow-[0_14px_38px_-24px_rgba(0,0,0,0.8)]"
        }`}
        animate={{ scale: isScrolled ? 0.988 : 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/12 via-transparent to-indigo-400/12" />
        <div className="pointer-events-none absolute inset-[1px] rounded-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.08),transparent_55%)]" />

        <div className="relative flex h-full items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Decipath home" className="group inline-flex items-center gap-2.5">
            <motion.div whileHover={{ rotate: -5, scale: 1.04 }} transition={{ duration: 0.2, ease: "easeOut" }}>
              <svg
                width="30"
                height="39"
                viewBox="0 0 104 116"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="89" height="89" rx="28" fill="white" />
                <rect
                  x="15"
                  y="27"
                  width="89"
                  height="89"
                  rx="28"
                  fill="white"
                  style={{ mixBlendMode: "difference" }}
                />
              </svg>
            </motion.div>
            <div className="hidden md:block">
              <p className="text-sm font-medium tracking-wide text-indigo-700 dark:text-indigo-100">Decipath</p>
              <p className="-mt-0.5 text-[11px] tracking-[0.2em] text-indigo-500/80 dark:text-indigo-200/55">AI ROADMAPS</p>
            </div>
          </Link>

          <div id="navigation" className={`hidden items-center gap-2 sm:flex ${hubotSans.className}`}>
            {navigation.map((item) => {
              const sectionId = item.href.replace("#", "")
              const isActive = activeSection === sectionId

              return (
                <Link href={item.href} key={item.label} className="relative rounded-full px-4 py-2 text-sm">
                  {isActive && (
                    <motion.span
                      layoutId="landing-nav-active"
                      className="absolute inset-0 -z-10 rounded-full border border-indigo-300/45 bg-indigo-500/18 dark:border-indigo-300/35 dark:bg-indigo-500/22"
                      transition={{ type: "spring", stiffness: 330, damping: 30, mass: 0.55 }}
                    />
                  )}
                  <motion.span
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`block transition-colors ${isActive ? "text-neutral-900 dark:text-white" : "text-neutral-600 hover:text-indigo-700 dark:text-neutral-200 dark:hover:text-indigo-200"}`}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeSelectorButton className="h-10 w-10 rounded-full border border-indigo-300/55 bg-white/85 dark:border-indigo-300/35 dark:bg-neutral-900/55" />
            <Link href="/signin" className="relative inline-flex overflow-hidden rounded-full">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <InteractiveHoverButton className="h-10 min-w-[132px]">Sign In</InteractiveHoverButton>
              </motion.div>
            </Link>
          </div>
        </div>

        <motion.div
          className="pointer-events-none absolute bottom-0 left-0 h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-indigo-200/85 to-transparent"
          style={{ scaleX: smoothProgress }}
        />
      </motion.nav>
    </motion.header>
  )
}

export default LandingNavbar
