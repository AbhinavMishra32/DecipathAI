import { memo, useState } from "react"
import { Handle, Position } from "reactflow"
import { Briefcase, Book, Code, Server, Cloud, Users, School, Building2, LineChart, Plus } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

const icons = {
  briefcase: Briefcase,
  book: Book,
  code: Code,
  server: Server,
  cloud: Cloud,
  users: Users,
  school: School,
  building: Building2,
  chart: LineChart,
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
  const IconComponent =
    data.icon && icons[data.icon as keyof typeof icons] ? icons[data.icon as keyof typeof icons] : Briefcase

  const [hovered, setHovered] = useState(false)

  const buttonVariants = {
    initial: { scale: 0, rotate: -180, filter: "blur(40px)", opacity: 0 },
    animate: {
      scale: 1,
      rotate: 0,
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
    exit: {
      scale: 0,
      rotate: 180,
      filter: "blur(40px)",
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
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
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={`group relative px-4 py-3 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.4)] hover:shadow-[0_10px_35px_-13px_rgba(0,0,0,0.5)] dark:shadow-[0_5px_60px_-15px_rgba(154,157,241,0.2)] rounded-lg border-2 border-indigo-300/80 transition-all duration-300 hover:scale-105 ${data.isHighlighted
          ? "border-indigo-500 dark:border-2 dark:border-indigo-500 bg-indigo-200/10 dark:bg-indigo-700/10 backdrop-blur-sm"
          : "border-gray-200 dark:border-neutral-700 dark:border-2 bg-white dark:bg-neutral-900/20 backdrop-blur-sm"
          } ${data.isExpanded ? "scale-110 shadow-lg dark:shadow-2xl" : ""}`}
        style={{
          width: data.isExpanded ? "240px" : "220px",
          fontSize: "3.75rem",
        }}
        onMouseEnter={() => setTimeout(() => setHovered(true), 300)}
        onMouseLeave={() => setTimeout(() => setHovered(false), 1000)}
      >
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          className={`!w-3 !h-3 !-left-1.5 !border-2 !border-white ${data.isHighlighted ? "!bg-indigo-500 dark:!bg-indigo-600" : "!bg-indigo-400 dark:!bg-indigo-500"
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
              className="absolute -top-3 -right-3 text-sm bg-indigo-100 dark:bg-indigo-900 border-2 dark:border border-indigo-500 dark:border-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-500 rounded-full"
            >
              <button className="p-2 rounded-full w-full h-full" onClick={() => {}}>
                <Plus />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-lg ${data.isHighlighted ? "bg-indigo-200 dark:bg-indigo-300" : "bg-indigo-100 dark:bg-indigo-100"}`}
            >
              <IconComponent
                className={`w-4 h-4 ${data.isHighlighted ? "text-indigo-600 dark:text-black" : "text-gray-600 dark:text-black"}`}
              />
            </div>
            <h2
              className={`text-sm font-semibold ${data.isHighlighted ? "text-indigo-800 dark:text-white" : "text-gray-800 dark:text-white"}`}
            >
              {data.label}
            </h2>
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{data.description}</div>

          <div className="text-xs">
            <span className="font-medium text-gray-700 dark:text-gray-400">Time:</span>
            <span className="ml-1 text-gray-600 dark:text-gray-400">{data.timeEstimate}</span>
          </div>

          {data.nextSteps && (
            <div className="flex gap-1 flex-wrap mt-1">
              {data.nextSteps.map((step, index) => (
                <span
                  key={index}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium border-[1px] border-indigo-200 dark:border-indigo-900 dark:border-[1px] backdrop-blur-3xl ${data.isHighlighted
                    ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-gray-200"
                    : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-800 dark:text-gray-300"
                    }`}
                >
                  {step}
                </span>
              ))}
            </div>
          )}
        </div>

        <Handle
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          className={`!w-3 !h-3 !-right-1.5 !border-2 !border-white ${data.isHighlighted ? "!bg-indigo-500 dark:!bg-indigo-600" : "!bg-indigo-400 dark:!bg-indigo-500"
            }`}
        />
      </motion.div>
    </AnimatePresence>
  )
}

export default memo(CustomNode)

