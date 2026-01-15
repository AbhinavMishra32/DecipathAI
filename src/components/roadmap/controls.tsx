import React, { useState } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Loader2,
  Target,
  Compass,
  Sparkles,
  BrainCircuit,
  GitBranch,
  PenSquare,
} from 'lucide-react'
import { hubotSans } from '@/lib/fonts';

interface ControlsProps {
  onGenerateNewMindMap: (situation: string, goal: string, customPrompt?: string | null) => void
  isGenerating: boolean
  isInitialized: boolean
  selectedNode: unknown
}

const featureHighlights = [
  {
    title: "Branching Path Intelligence",
    description: "Get alternate routes and converging milestones instead of flat step lists.",
    icon: GitBranch,
  },
  {
    title: "Task-Centric Nodes",
    description: "Every roadmap node is paired with practical tasks you can execute immediately.",
    icon: PenSquare,
  },
]

const Controls: React.FC<ControlsProps> = ({ onGenerateNewMindMap, isGenerating, isInitialized }) => {
  const [situation, setSituation] = useState('')
  const [goal, setGoal] = useState('')
  const [customPrompt, setCustomPrompt] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSituation = situation.trim()
    const trimmedGoal = goal.trim()

    if (!trimmedSituation || !trimmedGoal) {
      setValidationError("Please fill both Current Position and Desired Outcome.")
      return
    }

    setValidationError(null)
    onGenerateNewMindMap(trimmedSituation, trimmedGoal, customPrompt)
  }

  if (isInitialized && isGenerating) {
    return null
  }

  if (!isInitialized) {
    return (
      <div className="mx-auto w-full max-w-[1120px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-indigo-200/75 bg-white/68 shadow-[0_32px_80px_-48px_rgba(79,70,229,0.75)] backdrop-blur-2xl dark:border-indigo-300/20 dark:bg-[#080c19]/70 dark:shadow-[0_36px_90px_-52px_rgba(79,70,229,0.95)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(99,102,241,0.22),transparent_44%)] dark:bg-[radial-gradient(circle_at_14%_8%,rgba(99,102,241,0.3),transparent_42%)]" />
          <div className="pointer-events-none absolute -right-16 top-12 h-44 w-44 rounded-full border border-indigo-300/30" />

          <div className="relative grid gap-8 p-6 md:grid-cols-[0.95fr_1.05fr] md:p-8 lg:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/45 bg-indigo-500/14 px-3 py-1 text-xs text-indigo-100 dark:border-indigo-300/35 dark:bg-indigo-500/20 sm:text-sm">
                <BrainCircuit className="h-3.5 w-3.5" />
                Plan with Decipath AI Engine
              </div>

              <div>
                <h2 className={`${hubotSans.className} text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-[2.15rem]`}>
                  Create a roadmap that actually tells you what to do next
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                  Describe your current state and your destination. Decipath will build a connected action map with milestones,
                  tasks, and realistic progression paths.
                </p>
              </div>

              <div className="space-y-3">
                {featureHighlights.map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-indigo-200/70 bg-white/75 p-4 backdrop-blur-sm dark:border-indigo-300/18 dark:bg-neutral-900/55"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 rounded-lg border border-indigo-300/55 bg-indigo-500/18 p-2 text-indigo-600 dark:text-indigo-200">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">{item.title}</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-[1.4rem] border border-indigo-200/70 bg-white/80 p-5 backdrop-blur-xl dark:border-indigo-300/20 dark:bg-neutral-900/65 sm:p-6">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.18em] text-indigo-500/90 dark:text-indigo-300/80">
                  Current Position
                </label>
                <div className="relative">
                  <Compass className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                  <Input
                    placeholder="Where are you now?"
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    className="h-11 rounded-xl border-indigo-200 bg-white/90 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-400 dark:border-indigo-300/25 dark:bg-neutral-950/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.18em] text-indigo-500/90 dark:text-indigo-300/80">
                  Desired Outcome
                </label>
                <div className="relative">
                  <Target className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-indigo-500 dark:text-indigo-300" />
                  <Input
                    placeholder="Where do you want to go?"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="h-11 rounded-xl border-indigo-200 bg-white/90 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:ring-indigo-400 dark:border-indigo-300/25 dark:bg-neutral-950/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-[0.18em] text-indigo-500/90 dark:text-indigo-300/80">
                  Custom Prompt (Optional)
                </label>
                <textarea
                  placeholder="Any special constraints, preferences, timeline, or focus areas..."
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="h-28 w-full resize-none rounded-xl border border-indigo-200 bg-white/90 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-indigo-300/25 dark:bg-neutral-950/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-base font-medium text-white shadow-[0_18px_40px_-22px_rgba(79,70,229,0.9)] transition-all duration-300 hover:from-indigo-500 hover:to-indigo-400"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crafting Your Mind Map...
                  </>
                ) : (
                  <>
                    Generate Roadmap
                    <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {validationError && (
                <p className="text-sm text-red-500 dark:text-red-300">{validationError}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    )
  }

  return <></>
}

export default Controls;
