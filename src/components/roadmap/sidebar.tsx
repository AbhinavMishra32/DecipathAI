"use client";
import type React from "react";
import type { MindMapNode, NodeReference, SuccessStory } from "@/types";
import {
  AirplaneTilt,
  BookOpenText,
  Briefcase,
  Buildings,
  Calculator,
  Camera,
  ChartLineUp,
  Cloud,
  Code,
  CurrencyDollar,
  Flask,
  GlobeHemisphereWest,
  Gavel,
  GraduationCap,
  HardDrives,
  Heartbeat,
  MicrophoneStage,
  Package,
  PaintBrush,
  UsersThree,
  Clock,
  ListChecks,
  ArrowUpRight,
  Circle,
} from "@phosphor-icons/react"
import { motion, AnimatePresence } from "framer-motion"

interface SidebarProps {
  selectedNode: MindMapNode | null
}

const normalizeIconToken = (value?: string): string => (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

const iconLibrary: Record<string, React.ElementType> = {
  briefcase: Briefcase,
  career: Briefcase,
  job: Briefcase,
  work: Briefcase,

  book: BookOpenText,
  books: BookOpenText,
  learning: BookOpenText,
  education: BookOpenText,

  code: Code,
  coding: Code,
  programming: Code,
  development: Code,

  server: HardDrives,
  backend: HardDrives,
  systems: HardDrives,

  cloud: Cloud,

  users: UsersThree,
  people: UsersThree,
  team: UsersThree,

  school: GraduationCap,
  student: GraduationCap,

  building: Buildings,
  building2: Buildings,
  organization: Buildings,
  tree: Buildings,

  chart: ChartLineUp,
  analytics: ChartLineUp,
  growth: ChartLineUp,

  stethoscope: Heartbeat,
  heart: Heartbeat,
  health: Heartbeat,

  gavel: Gavel,
  law: Gavel,
  legal: Gavel,

  mic: MicrophoneStage,
  microphone: MicrophoneStage,
  music: MicrophoneStage,

  paintbrush: PaintBrush,
  design: PaintBrush,
  art: PaintBrush,

  calculator: Calculator,
  finance: Calculator,
  dollarsign: CurrencyDollar,
  money: CurrencyDollar,

  camera: Camera,
  media: Camera,

  flask: Flask,
  cutlery: Flask,

  globe: GlobeHemisphereWest,

  airplane: AirplaneTilt,
  travel: AirplaneTilt,

  package: Package,
}

const isHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

const containsFictionalMarker = (value: string): boolean =>
  /(fictional|hypothetical|imaginary|composite|placeholder|made\s*up|example\s+persona|sample\s+persona|anonymous\s+practitioner)/i.test(
    value,
  )

const getSourceLabel = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Open source"
  }
}

const Sidebar: React.FC<SidebarProps> = ({ selectedNode }) => {
  let IconComponent: React.ElementType = Briefcase
  try {
    const key = normalizeIconToken(selectedNode?.data.icon)
    IconComponent = iconLibrary[key] ?? Briefcase
  } catch (error) {
    console.error("Error loading icon:", error)
  }

  const contentVariants = {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
  }

  try {
    const tasks = selectedNode?.data.tasks ?? []
    const nextSteps = selectedNode?.data.nextSteps ?? []
    const references: NodeReference[] = Array.isArray(selectedNode?.data.references)
      ? selectedNode.data.references.filter(
          (reference) => typeof reference?.url === "string" && isHttpUrl(reference.url.trim()),
        )
      : []
    const successStories: SuccessStory[] = Array.isArray(selectedNode?.data.successStories)
      ? selectedNode.data.successStories.filter(
          (story) =>
            typeof story?.sourceUrl === "string" &&
            isHttpUrl(story.sourceUrl.trim()) &&
            !containsFictionalMarker(`${story.person} ${story.achievement} ${story.summary}`),
        )
      : []

    return (
      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="fixed inset-y-0 right-0 z-50 w-[min(420px,92vw)] transform-gpu border-l-2 border-slate-200 bg-white/88 p-4 backdrop-blur-md will-change-transform dark:border-slate-700 dark:bg-neutral-950/84"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(155, 155, 155, 0.25) transparent",
            }}
          >
            <style jsx>{`
              .decipath-sidebar-scroll::-webkit-scrollbar {
                width: 7px;
              }
              .decipath-sidebar-scroll::-webkit-scrollbar-track {
                background: transparent;
              }
              .decipath-sidebar-scroll::-webkit-scrollbar-thumb {
                background-color: rgba(155, 155, 155, 0.25);
                border-radius: 20px;
                border: transparent;
              }
            `}</style>

            <div className="decipath-sidebar-scroll relative h-[calc(100vh-2rem)] overflow-y-auto pr-1">
              <motion.div
                key={selectedNode.id}
                initial="initial"
                animate="animate"
                exit="exit"
                variants={contentVariants}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4 p-2 rounded-xl transform-gpu"
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-indigo-100 p-2 dark:bg-indigo-500/20">
                      <IconComponent size={18} weight="duotone" className="text-indigo-700 dark:text-indigo-200" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedNode.data.label}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{selectedNode.data.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-700 dark:text-slate-200">
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    <Clock size={12} />
                    <span className="font-medium">Time:</span>
                    <span>{selectedNode.data.timeEstimate}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                    <ListChecks size={12} />
                    <span>{tasks.length + nextSteps.length} action items</span>
                  </span>
                </div>

                {selectedNode.data.detailedDescription && (
                  <section>
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Context</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{selectedNode.data.detailedDescription}</p>
                  </section>
                )}

                <section className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Execution Plan</h3>

                  {tasks.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Tasks</p>
                      <ul className="space-y-1.5">
                        {tasks.map((task, index) => (
                          <li key={`${task}-${index}`} className="flex items-start gap-2 text-sm">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-medium text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed text-slate-800 dark:text-slate-200">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {nextSteps.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs uppercase tracking-wide text-indigo-500 dark:text-indigo-300">Next Steps</p>
                      <ul className="space-y-1.5">
                        {nextSteps.map((step, index) => (
                          <li key={`${step}-${index}`} className="flex items-start gap-2 text-sm">
                            <Circle size={7} weight="fill" className="mt-1.5 shrink-0 text-indigo-500 dark:text-indigo-300" />
                            <span className="leading-relaxed text-slate-800 dark:text-slate-200">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tasks.length === 0 && nextSteps.length === 0 && (
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      No action steps are available for this node yet.
                    </p>
                  )}
                </section>

                {references.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Evidence & Sources</h3>
                    <ul className="space-y-2.5">
                      {references.map((reference, index) => (
                        <li
                          key={`${reference.url}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <a
                            href={reference.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-2 font-medium text-indigo-700 hover:underline dark:text-indigo-300"
                          >
                            <span className="truncate">{reference.title}</span>
                            <ArrowUpRight size={14} weight="bold" className="shrink-0" />
                          </a>
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-600 dark:text-slate-400">{getSourceLabel(reference.url)}</p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{reference.snippet}</p>
                          <p className="mt-1 text-[11px] uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
                            {reference.relevance}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {successStories.length > 0 && (
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-800 dark:text-slate-200">Outcomes from Similar Paths</h3>
                    <ul className="space-y-2.5">
                      {successStories.map((story, index) => (
                        <li
                          key={`${story.sourceUrl}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <p className="text-xs uppercase tracking-wide text-indigo-500 dark:text-indigo-300/80">After: {story.afterNode}</p>
                          <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                            {story.person}: {story.achievement}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{story.summary}</p>
                          <a
                            href={story.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-700 hover:underline dark:text-indigo-300"
                          >
                            {getSourceLabel(story.sourceUrl)}
                            <ArrowUpRight size={12} weight="bold" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </motion.div>

              <div className="pointer-events-none sticky bottom-0 h-14 bg-gradient-to-t from-white/90 to-transparent dark:from-neutral-950/85" />

            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    )
  } catch (error) {
    console.error("Error rendering Sidebar:", error)
    return null
  }
}

export default Sidebar
