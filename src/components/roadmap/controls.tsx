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
    onGenerateNewMindMap(situation, goal, customPrompt)
  }

  if (isInitialized && isGenerating) {
    return null
  }

  if (!isInitialized) {
    return (
      <>
        <Card className={`${hubotSans.className} w-full max-w-2xl mx-auto rounded-3xl overflow-hidden shadow-none border-none bg-gray-50 dark:bg-neutral-950`}>
          <CardHeader className="p-6 text-center">
            <CardTitle className="text-2xl font-light text-gray-700 dark:text-gray-200 flex items-center gap-2">
              Create Your AI Roadmap
            </CardTitle>
          </CardHeader>
          {/* <div className='w-[80vh] mx-auto'> */}
          <CardContent className="p-6 bg-gray-50 dark:bg-neutral-950">
            <p className="text-slate-600 dark:text-gray-300 mb-4 text-sm">
              Our AI-powered mind map creator helps you explore connections, discover new paths, and illuminate your thinking process.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Compass className="absolute left-3 top-2.5 h-5 w-5 text-indigo-400" />
                <Input
                  placeholder="Where are you now? (e.g., 'Starting a new project')"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  className="pl-10 py-3 rounded-lg text-sm dark:bg-neutral-900 text-gray-600 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 border-2 border-gray-300 dark:border-neutral-800"
                />
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