"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll, useSpring } from "framer-motion"
import { InteractiveHoverButton } from "./magicui/interactive-hover-button"
import { hubotSans } from "@/lib/fonts"

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
            ? "w-[min(980px,calc(100vw-18px))] border-indigo-300/45 bg-[rgba(8,12,30,0.88)] shadow-[0_24px_55px_-26px_rgba(0,0,0,0.85)]"
            : "w-[min(1120px,calc(100vw-12px))] border-neutral-700/60 bg-[rgba(6,9,24,0.58)] shadow-[0_14px_38px_-24px_rgba(0,0,0,0.8)]"
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
              <p className="text-sm font-medium tracking-wide text-indigo-100">Decipath</p>
              <p className="-mt-0.5 text-[11px] tracking-[0.2em] text-indigo-200/55">AI ROADMAPS</p>
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
                      className="absolute inset-0 -z-10 rounded-full border border-indigo-300/35 bg-indigo-500/22"
                      transition={{ type: "spring", stiffness: 330, damping: 30, mass: 0.55 }}
                    />
                  )}
                  <motion.span
                    whileHover={{ y: -1 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className={`block transition-colors ${isActive ? "text-white" : "text-neutral-200 hover:text-indigo-200"}`}
                  >
                    {item.label}
                  </motion.span>
                </Link>
              )
            })}
          </div>

          <Link href="/signin" className="relative inline-flex overflow-hidden rounded-full">
            <motion.div
              variants={itemVariants}
              className="flex items-center gap-4 flex-shrink-0"
            >
             {/* <ThemeSelectorButton /> */}
              <Link href={"/signin"}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{
                    duration: 0.15,
                    ease: "easeOut",
                  }}
                  className="relative inline-flex overflow-hidden rounded-full"
                >
                  <InteractiveHoverButton className='w-30 h-10'>Sign In</InteractiveHoverButton>
                  {/* <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                  <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-6 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Sign in
                  </span> */}
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    );
}

export default LandingNavbar