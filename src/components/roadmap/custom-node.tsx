import { memo, useMemo, useState } from "react"
import { Handle, Position } from "reactflow"
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
  Heartbeat,
  MicrophoneStage,
  Package,
  PaintBrush,
  Plus,
  HardDrives,
  UsersThree,
  Wrench,
  Clock,
  Link,
  ListChecks,
} from "@phosphor-icons/react"
import { AnimatePresence, motion, type Variants } from "framer-motion"

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
  graduationcap: GraduationCap,

  building: Buildings,
  building2: Buildings,
  organization: Buildings,

  chart: ChartLineUp,
  analytics: ChartLineUp,
  growth: ChartLineUp,

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

  wrench: Wrench,
  tool: Wrench,

  camera: Camera,
  media: Camera,

  flask: Flask,
  science: Flask,

  globe: GlobeHemisphereWest,

  dollarsign: CurrencyDollar,
  money: CurrencyDollar,

  airplane: AirplaneTilt,
  travel: AirplaneTilt,

  package: Package,
  logistics: Package,

  heart: Heartbeat,
  health: Heartbeat,
}

const toDomain = (url: string): string | null => {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function CustomNode({
  data,
  isConnectable,
}: {
  data: {
    label: string
    icon?: string
    description: string
    timeEstimate: string
    nextSteps?: string[]
    tasks: string[]
    references?: { url: string }[]
    isExpanded?: boolean
    // isExpandedDetailed?: boolean
    isHighlighted?: boolean
  }
  isConnectable: boolean
}) {
  const IconComponent = useMemo(() => {
    const key = normalizeIconToken(data.icon)
    return iconLibrary[key] ?? Briefcase
  }, [data.icon])

  const sourceTags = Array.from(
    new Set((data.references ?? []).map((reference) => toDomain(reference.url)).filter((domain): domain is string => Boolean(domain))),
  ).slice(0, 2)

  const roadmapTags = [
    `${data.tasks.length} tasks`,
    `${(data.references ?? []).length} refs`,
    ...sourceTags,
  ]

  const [hovered, setHovered] = useState(false)

  const buttonVariants: Variants = {
    initial: { scale: 0.9, y: 4, opacity: 0 },
    animate: {
      scale: 1,
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.18,
        ease: "easeOut",
      },
    },
    exit: {
      scale: 0.95,
      y: 4,
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "easeIn",
      },
    },
    hover: {
      scale: 1.1,
      rotate: [0, -10, 10, -10, 10, 0],
      transition: {
        rotate: {
          duration: 0.5,
          ease: "easeInOut",
        },
      },
    },
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 6 }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        className={`group relative rounded-2xl border-2 px-4 py-3.5 transition-all duration-200 transform-gpu ${data.isHighlighted
          ? "border-indigo-500 bg-indigo-50/70 shadow-[0_16px_40px_-20px_rgba(79,70,229,0.45)] dark:border-indigo-400 dark:bg-indigo-900/15"
          : "border-gray-200 bg-white/95 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.32)] dark:border-neutral-700 dark:bg-neutral-900/35"
          } ${data.isExpanded ? "scale-[1.04]" : "hover:scale-[1.02]"}`}
        style={{
          width: data.isExpanded ? "272px" : "252px",
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className={`!h-3 !w-3 !-left-1.5 !border-2 !border-white ${data.isHighlighted ? "!bg-indigo-500 dark:!bg-indigo-400" : "!bg-indigo-400 dark:!bg-indigo-500"
            }`}
        />
        <AnimatePresence>
          {data.isExpanded && hovered && (
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              whileHover="hover"
              className="absolute -right-2 -top-2 rounded-full border border-indigo-300 bg-indigo-50 p-0.5 text-sm dark:border-indigo-500 dark:bg-indigo-950"
            >
              <button className="p-2 rounded-full w-full h-full" onClick={() => {}}>
                <Plus size={14} weight="bold" className="text-indigo-600 dark:text-indigo-200" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5">
            <div
              className={`mt-0.5 rounded-xl p-2 ${data.isHighlighted ? "bg-indigo-200/70 dark:bg-indigo-400/20" : "bg-indigo-100/80 dark:bg-indigo-400/15"}`}
            >
              <IconComponent
                size={18}
                weight="duotone"
                className={`${data.isHighlighted ? "text-indigo-700 dark:text-indigo-100" : "text-indigo-600 dark:text-indigo-200"}`}
              />
            </div>
            <div className="min-w-0">
              <h2
                className={`truncate text-[15px] font-semibold leading-5 ${data.isHighlighted ? "text-indigo-900 dark:text-indigo-50" : "text-slate-900 dark:text-white"}`}
              >
                {data.label}
              </h2>
              <p className="mt-0.5 text-[11px] uppercase tracking-wide text-slate-500/90 dark:text-slate-400">Roadmap milestone</p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{data.description}</p>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-1 dark:bg-slate-800/80">
              <Clock size={11} />
              {data.timeEstimate}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-1 dark:bg-slate-800/80">
              <ListChecks size={11} />
              {data.tasks.length} tasks
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/90 px-2 py-1 dark:bg-slate-800/80">
              <Link size={11} />
              {(data.references ?? []).length} refs
            </span>
          </div>

          {roadmapTags.length > 0 && (
            <div className="mt-0.5 flex flex-wrap gap-1">
              {roadmapTags.map((tag, index) => (
                <span
                  key={index}
                  className={`rounded-full border px-2 py-[3px] text-[10px] font-medium leading-[1.1] ${data.isHighlighted
                    ? "border-indigo-200 bg-indigo-100/80 text-indigo-700 dark:border-indigo-500/70 dark:bg-indigo-900/25 dark:text-indigo-200"
                    : "border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-600/80 dark:bg-slate-800/70 dark:text-slate-200"
                    }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className={`!h-3 !w-3 !-right-1.5 !border-2 !border-white ${data.isHighlighted ? "!bg-indigo-500 dark:!bg-indigo-400" : "!bg-indigo-400 dark:!bg-indigo-500"
            }`}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(CustomNode)
