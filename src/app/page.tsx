'use client';

import React from 'react'
import Link from 'next/link';
import { motion } from 'framer-motion';
import Spline from '@splinetool/react-spline';
import {
  ArrowRight,
  BookmarkCheck,
  BrainCircuit,
  Compass,
  GitBranch,
  LockKeyhole,
  MoonStar,
  PenSquare,
  Sparkles,
  Target,
  TimerReset,
  Waypoints,
  Workflow,
} from 'lucide-react';

import LandingNavbar from '../components/LandingNavbar';
import { FlipWords } from '../components/ui/flip-words';
import { hubotSans } from '@/lib/fonts';
import { VelocityScroll } from '@/components/magicui/scroll-based-velocity';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';
import LandingIntroOverlay from '@/components/LandingIntroOverlay';

type FeatureCard = {
  title: string
  description: string
  icon: LucideIcon
}

type FlowStep = {
  title: string
  description: string
  icon: LucideIcon
}

const featureCards: FeatureCard[] = [
  {
    title: 'AI-Powered Roadmap Generation',
    description: 'Describe where you are and where you want to go. Decipath creates a deep roadmap in seconds.',
    icon: Sparkles,
  },
  {
    title: 'Interactive Graph View',
    description: 'Every milestone becomes a clickable node with connected context, so you see the full decision tree.',
    icon: Waypoints,
  },
  {
    title: 'Actionable Tasks Per Step',
    description: 'Each node includes focused tasks, next steps, and realistic time estimates you can execute immediately.',
    icon: PenSquare,
  },
  {
    title: 'Branching + Converging Paths',
    description: 'Explore alternate routes, prerequisites, and merged tracks without losing the bigger picture.',
    icon: GitBranch,
  },
  {
    title: 'Theme-Aware Experience',
    description: 'A cohesive visual system across light and dark surfaces with consistent readability and contrast.',
    icon: MoonStar,
  },
  {
    title: 'Saved Progress + Secure Access',
    description: 'Sign in, save roadmaps, return later, and continue from the exact point you left off.',
    icon: BookmarkCheck,
  },
]

const flowSteps: FlowStep[] = [
  {
    title: 'Define your starting point',
    description: 'Tell Decipath your current state and constraints.',
    icon: Compass,
  },
  {
    title: 'Set the target',
    description: 'Describe what success looks like in concrete terms.',
    icon: Target,
  },
  {
    title: 'Generate the map',
    description: 'Get a multi-branch roadmap with timelines and dependencies.',
    icon: Workflow,
  },
  {
    title: 'Execute node by node',
    description: 'Open a node, complete tasks, and move forward with clarity.',
    icon: Waypoints,
  },
]

const proofStats = [
  { value: '10-15+', label: 'Roadmap paths generated' },
  { value: '5-8', label: 'Actionable tasks per node' },
  { value: '1 click', label: 'To inspect node details' },
  { value: 'Any goal', label: 'Career, study, startup, projects' },
]


const orbitUseCases = [
  'Career transitions',
  'Learning new tech',
  'Startup planning',
  'Project launches',
  'Exam prep',
  'Portfolio growth',
  'Interview prep',
  'Skill roadmaps',
]

const ORBIT_RING_SIZE = 260
const ORBIT_OUTER_RING_STROKE = 1.5
const ORBIT_OUTER_RADIUS = (ORBIT_RING_SIZE - ORBIT_OUTER_RING_STROKE) / 2
const ORBIT_INNER_RADIUS = 85
const ORBIT_PHASE_RADIANS = -Math.PI / 2

const getOrbitPoint = (index: number, total: number, radius: number) => {
  const angle = ORBIT_PHASE_RADIANS + (2 * Math.PI * index) / total
  const cx = ORBIT_RING_SIZE / 2
  const cy = ORBIT_RING_SIZE / 2

  return {
    angle,
    cx,
    cy,
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

const featureLayout = [
  { index: 0, className: 'lg:col-span-7 lg:row-span-2', tone: 'from-indigo-500/25 via-indigo-500/10 to-transparent' },
  { index: 1, className: 'lg:col-span-5', tone: 'from-sky-500/20 via-indigo-500/8 to-transparent' },
  { index: 2, className: 'lg:col-span-5', tone: 'from-violet-500/18 via-indigo-500/8 to-transparent' },
  { index: 3, className: 'lg:col-span-4', tone: 'from-indigo-400/18 via-indigo-500/8 to-transparent' },
  { index: 4, className: 'lg:col-span-4', tone: 'from-slate-400/14 via-indigo-500/8 to-transparent' },
  { index: 5, className: 'lg:col-span-4', tone: 'from-indigo-300/16 via-indigo-500/8 to-transparent' },
]

const Page = () => {
  return (
    <main className={`${hubotSans.className} relative min-h-screen overflow-x-hidden bg-neutral-50 text-neutral-900 dark:bg-neutral-950 dark:text-white`}>
      <LandingIntroOverlay />

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-24rem] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-300/35 blur-[140px] dark:bg-indigo-600/30" />
        <div className="absolute right-[-8rem] top-[28rem] h-[20rem] w-[20rem] rounded-full bg-indigo-300/25 blur-[110px] dark:bg-indigo-400/20" />
        <div className="absolute left-[-8rem] top-[45rem] h-[20rem] w-[20rem] rounded-full bg-sky-300/20 blur-[100px] dark:bg-sky-400/14" />
      </div>

      <LandingNavbar />

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white/80 p-6 shadow-[0_28px_90px_-44px_rgba(99,102,241,0.42)] backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/70 dark:shadow-[0_28px_90px_-44px_rgba(99,102,241,0.75)] sm:p-9"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.24),transparent_50%)]" />
            <div className="pointer-events-none absolute -right-20 top-8 h-52 w-52 rounded-full border border-indigo-300/20" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/55 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/12 dark:text-indigo-100 sm:text-sm">
                <BrainCircuit className="h-3.5 w-3.5" />
                Custom AI roadmaps that you can actually execute
              </div>

              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.03] text-neutral-950 dark:text-white sm:text-6xl">
                Plan your next move with
                <span className="block bg-gradient-to-r from-indigo-700 via-indigo-500 to-sky-500 bg-clip-text text-transparent dark:from-indigo-100 dark:via-indigo-300 dark:to-sky-200">
                  confidence, not guesswork
                </span>
              </h1>

              <div className="mt-5 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-lg">
                Decipath turns uncertainty into a live execution map so you can move from
                <span className="mx-2 inline-flex text-indigo-600 dark:text-indigo-200">
                  <FlipWords words={['confusion', 'overthinking', 'stalled progress']} duration={2800} />
                </span>
                to forward momentum.
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild className="h-11 rounded-full bg-indigo-500 px-6 text-sm text-white hover:bg-indigo-400">
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-full border-indigo-400/45 bg-indigo-500/10 px-6 text-sm text-indigo-700 hover:border-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-900 dark:border-indigo-300/45 dark:text-indigo-100 dark:hover:border-indigo-200 dark:hover:bg-indigo-500/20 dark:hover:text-white"
                >
                  <Link href="/signin">Sign In</Link>
                </Button>
              </div>

              <div className="mt-9 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white/70 backdrop-blur-xl dark:divide-neutral-800/90 dark:border-neutral-800/90 dark:bg-neutral-900/55">
                {proofStats.map((stat) => (
                  <div key={stat.label} className="flex items-end justify-between px-4 py-3 sm:px-5">
                    <p className="text-lg font-semibold text-indigo-700 dark:text-indigo-100 sm:text-xl">{stat.value}</p>
                    <p className="text-right text-xs text-neutral-500 dark:text-neutral-400 sm:text-sm">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.12 }}
            className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-indigo-300/35 bg-[linear-gradient(160deg,rgba(244,247,255,0.96),rgba(232,239,255,0.95))] shadow-[0_30px_90px_-42px_rgba(99,102,241,0.42)] dark:border-indigo-300/25 dark:bg-[linear-gradient(160deg,rgba(13,18,41,0.96),rgba(8,9,20,0.95))] dark:shadow-[0_30px_90px_-42px_rgba(99,102,241,0.7)]"
          >
            <Spline
              scene="https://prod.spline.design/mED5xBp0MzF2r0xi/scene.splinecode"
              className="absolute inset-0 h-full w-full"
            />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,0.28),transparent_42%),radial-gradient(circle_at_78%_74%,rgba(56,189,248,0.17),transparent_40%),linear-gradient(180deg,rgba(244,247,255,0.20)_0%,rgba(244,247,255,0.02)_42%,rgba(244,247,255,0.34)_100%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,0.34),transparent_42%),radial-gradient(circle_at_78%_74%,rgba(56,189,248,0.2),transparent_40%),linear-gradient(180deg,rgba(7,10,26,0.10)_0%,rgba(7,10,26,0.04)_44%,rgba(7,10,26,0.50)_100%)]" />

            <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between p-6 sm:p-7">
              <div className="max-w-sm space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/45 bg-indigo-500/12 px-3 py-1 text-xs text-indigo-700 backdrop-blur-sm dark:border-indigo-300/35 dark:bg-indigo-500/18 dark:text-indigo-100">
                  <Waypoints className="h-3.5 w-3.5" />
                  Live roadmap canvas
                </div>
                <h3 className="text-2xl font-semibold leading-tight text-white drop-shadow-[0_3px_20px_rgba(15,23,42,0.6)] sm:text-3xl">
                  See the path before you commit.
                </h3>
                <p className="max-w-[26rem] rounded-2xl border border-indigo-200/65 bg-white/78 px-4 py-3 text-xs leading-relaxed text-neutral-700 shadow-[0_16px_36px_-30px_rgba(79,70,229,0.7)] backdrop-blur-md dark:border-indigo-200/25 dark:bg-neutral-950/68 dark:text-neutral-200 sm:text-sm">
                  This view shows how Decipath connects milestones, dependencies, and next actions into one execution map.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start rounded-2xl border border-neutral-200/85 bg-white/76 px-4 py-3 text-[11px] leading-relaxed text-neutral-700 shadow-[0_18px_42px_-34px_rgba(56,189,248,0.9)] backdrop-blur-md dark:border-neutral-700/85 dark:bg-neutral-950/68 dark:text-neutral-200 sm:self-end sm:text-xs">
                <span className="rounded-full border border-indigo-300/60 bg-indigo-500/10 px-2.5 py-1">Milestones</span>
                <span className="rounded-full border border-sky-300/60 bg-sky-500/10 px-2.5 py-1">Dependencies</span>
                <span className="rounded-full border border-violet-300/60 bg-violet-500/10 px-2.5 py-1">Actionable tasks</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative mt-2 w-full overflow-hidden">
        <div className="relative flex w-full items-center justify-center text-indigo-700 dark:text-indigo-100">
          <VelocityScroll>Anything you want to achieve can be mapped</VelocityScroll>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-neutral-50 via-neutral-50/70 to-transparent dark:from-neutral-950 dark:via-neutral-950/70" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-neutral-50 via-neutral-50/70 to-transparent dark:from-neutral-950 dark:via-neutral-950/70" />
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300/85">
          <Workflow className="h-4 w-4" />
          Product Architecture
        </div>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-neutral-950 dark:text-white sm:text-4xl">
          Custom building blocks for deep planning, not template-level output
        </h2>

        <div className="mt-8 grid auto-rows-[minmax(165px,auto)] gap-4 lg:grid-cols-12">
          {featureLayout.map((layout, displayIndex) => {
            const feature = featureCards[layout.index]
            const Icon = feature.icon

            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.38, delay: displayIndex * 0.05 }}
                className={`group relative overflow-hidden rounded-[1.6rem] border border-neutral-200 bg-white/75 p-5 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/75 ${layout.className}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${layout.tone}`} />
                <div className="pointer-events-none absolute -right-4 -top-6 text-[96px] font-semibold leading-none text-neutral-900/[0.05] dark:text-white/[0.05]">
                  {String(displayIndex + 1).padStart(2, '0')}
                </div>

                <div className="relative flex h-full flex-col">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-300/50 bg-indigo-500/12 px-3 py-1 text-xs text-indigo-700 dark:border-indigo-300/40 dark:bg-indigo-500/14 dark:text-indigo-100">
                    <Icon className="h-3.5 w-3.5" />
                    Decipath Capability
                  </div>

                  <h3 className="mt-4 max-w-xl text-xl font-medium text-neutral-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{feature.description}</p>

                  <div className="mt-auto pt-5 text-xs uppercase tracking-[0.18em] text-indigo-600/75 dark:text-indigo-200/70">Built into the core workflow</div>
                </div>
              </motion.article>
            )
          })}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-white/70 p-6 sm:p-9 dark:border-neutral-800 dark:bg-neutral-900/45">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(99,102,241,0.18),transparent_45%)]" />

          <h2 className="relative text-3xl font-semibold text-neutral-900 dark:text-white sm:text-4xl">How it flows</h2>
          <p className="relative mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300 sm:text-base">
            One clean loop from intent to execution, with enough depth for complex goals.
          </p>

          <div className="relative mt-9 grid gap-8 lg:grid-cols-4">
            {flowSteps.map((step, index) => {
              const StepIcon = step.icon

              return (
                <div key={step.title} className="relative">
                  {index < flowSteps.length - 1 && (
                    <div className="pointer-events-none absolute left-[74px] top-8 hidden h-px w-[calc(100%-52px)] bg-gradient-to-r from-indigo-300/60 to-transparent lg:block" />
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, delay: index * 0.08 }}
                    className="relative"
                  >
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.25rem] border border-indigo-300/60 bg-indigo-500/14 text-indigo-700 shadow-[0_16px_36px_-18px_rgba(99,102,241,0.6)] dark:border-indigo-300/45 dark:bg-indigo-500/18 dark:text-indigo-100 dark:shadow-[0_16px_36px_-18px_rgba(99,102,241,0.8)]">
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-indigo-600/75 dark:text-indigo-200/70">Step {index + 1}</p>
                      <h3 className="mt-1 text-lg text-neutral-900 dark:text-white">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{step.description}</p>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="use-cases" className="mx-auto w-full max-w-[1180px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-neutral-200 bg-white/80 p-7 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/70">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300/80">
              <TimerReset className="h-4 w-4" />
              Works Across Domains
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-neutral-900 dark:text-white sm:text-4xl">Use it for any path you want to build</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300 sm:text-base">
              Decipath adapts the same structured engine to career moves, technical upskilling, startup execution, and long-term learning plans.
            </p>
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-100/70 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/60 dark:text-neutral-300">
              The roadmap evolves as your context changes. You are not locked into one rigid path.
            </div>
          </div>

          <div className="relative h-[390px] overflow-hidden rounded-[2rem] border border-indigo-300/45 bg-[linear-gradient(150deg,rgba(244,247,255,0.96),rgba(231,238,255,0.95))] dark:border-indigo-300/25 dark:bg-[linear-gradient(150deg,rgba(13,17,40,0.96),rgba(7,8,18,0.95))]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2),transparent_62%)]" />

            <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2">
              <svg viewBox={`0 0 ${ORBIT_RING_SIZE} ${ORBIT_RING_SIZE}`} className="pointer-events-none absolute inset-0 h-full w-full">
                <circle
                  cx={ORBIT_RING_SIZE / 2}
                  cy={ORBIT_RING_SIZE / 2}
                  r={ORBIT_OUTER_RADIUS}
                  stroke="currentColor"
                  className="text-indigo-400/45 dark:text-indigo-300/20"
                  strokeWidth={ORBIT_OUTER_RING_STROKE}
                  fill="none"
                />
                <circle
                  cx={ORBIT_RING_SIZE / 2}
                  cy={ORBIT_RING_SIZE / 2}
                  r={ORBIT_INNER_RADIUS}
                  stroke="currentColor"
                  className="text-indigo-300/45 dark:text-indigo-300/28"
                  strokeWidth="1.2"
                  fill="none"
                />
                {orbitUseCases.map((label, index) => {
                  const point = getOrbitPoint(index, orbitUseCases.length, ORBIT_OUTER_RADIUS)

                  return (
                    <line
                      key={`orbit-line-${label}`}
                      x1={point.cx}
                      y1={point.cy}
                      x2={point.x}
                      y2={point.y}
                      stroke="currentColor"
                      className="text-indigo-400/45 dark:text-indigo-300/30"
                      strokeWidth="1.25"
                    />
                  )
                })}
              </svg>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-indigo-300/55 bg-indigo-500/16 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-200/45 dark:bg-indigo-500/22 dark:text-indigo-50">
                Your Goal
              </div>

              {orbitUseCases.map((label, index) => {
                const point = getOrbitPoint(index, orbitUseCases.length, ORBIT_OUTER_RADIUS)

                return (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.92, y: 8, filter: 'blur(4px)' }}
                    whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.35, delay: index * 0.06 }}
                    className="absolute w-max -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-indigo-200/80 bg-white/92 px-3 py-1 text-xs text-indigo-700 shadow-[0_10px_28px_-18px_rgba(99,102,241,0.65)] dark:border-neutral-700/80 dark:bg-neutral-950/80 dark:text-indigo-100 dark:shadow-[0_10px_28px_-18px_rgba(99,102,241,0.85)] sm:text-sm"
                    style={{ left: `${point.x - 5}px`, top: `${point.y - 10}px` }}
                  >
                    {label}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1180px] px-4 pb-20 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.45 }}
          className="relative isolate overflow-hidden rounded-[2.2rem] border border-indigo-300/45 bg-[linear-gradient(130deg,rgba(196,205,255,0.75),rgba(229,236,255,0.9)_46%,rgba(245,248,255,0.98))] p-8 sm:p-12 dark:border-indigo-300/30 dark:bg-[linear-gradient(130deg,rgba(57,64,166,0.28),rgba(19,25,56,0.9)_46%,rgba(8,10,22,0.98))]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(129,140,248,0.34),transparent_46%)]" />
          <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[240px] w-[240px] rounded-full border border-indigo-200/20" />

          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <h2 className="max-w-2xl text-3xl font-semibold text-neutral-900 dark:text-white sm:text-4xl">
                Build your next roadmap with a system that actually feels premium
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-indigo-800/90 dark:text-indigo-100/90 sm:text-base">
                Decipath gives you structure, flexibility, and momentum from your first step to your final milestone.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild className="h-11 rounded-full bg-indigo-600 px-6 text-sm text-white hover:bg-indigo-500 dark:bg-white dark:text-neutral-950 dark:hover:bg-indigo-100">
                  <Link href="/signup">
                    Create My Roadmap
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white/75 px-4 py-2 text-xs text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-950/62 dark:text-neutral-300">
                  <LockKeyhole className="h-3.5 w-3.5 text-indigo-200" />
                  Secure auth + saved roadmap history
                </div>
              </div>
            </div>

            <div className="min-w-[220px] space-y-3">
              <div className="rounded-2xl border border-indigo-300/55 bg-indigo-500/14 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-300/35 dark:bg-indigo-500/18 dark:text-indigo-100">
                Structured AI planning engine
              </div>
              <div className="rounded-2xl border border-neutral-300 bg-white/70 px-4 py-3 text-sm text-neutral-700 dark:border-neutral-700/80 dark:bg-neutral-950/70 dark:text-neutral-200">
                Interactive graph + actionable tasking
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  )
}

export default Page;
