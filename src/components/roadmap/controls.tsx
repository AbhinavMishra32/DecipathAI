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
              <div className="relative">
                <Target className="absolute left-3 top-2.5 h-5 w-5 text-indigo-400" />
                <Input
                  placeholder="Where do you want to go? (e.g., 'Launch successfully')"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="pl-10 py-3 rounded-lg text-sm dark:bg-neutral-900 text-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-2 border-gray-300 dark:border-neutral-800"
                />
              </div>
              <div className='relative'>
                <textarea
                  placeholder='Custom Prompt'
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className='w-full h-20 p-2 rounded-lg text-sm bg-gray-50 dark:bg-neutral-900 text-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-2 border-gray-300 focus:ring-red-400 dark:border-neutral-800'
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-500 text-white font-light text-lg shadow-md transition-all duration-300 ease-in-out transform hover:scale-105"
                disabled={isGenerating}
                onMouseEnter={() => setIsHoveringButton(true)}
                onMouseLeave={() => setIsHoveringButton(false)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Crafting Your Mind Galaxy...
                  </>
                ) : (
                  <>
                    Create your Roadmap
                    <Sparkles className={`h-[10px] w-[10px] ${isHoveringButton && "animate-pulse"}`} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          {/* </div> */}

        </Card>
        {/* <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          style={{ opacity: 0.3, zIndex: -1}}
        />  */}
      </>
    )
  }
  return (
    // <div className='absolute z-50 top-0 left-0 w-[200px] h-[200px] bg-red-400'></div>
    <></>
  )
}

export default Controls;