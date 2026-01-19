"use client"

import React from "react"
import { motion } from "framer-motion"

const LoadingAnimation: React.FC<{ theme?: "light" | "dark" }> = ({ theme = "dark" }) => {
  const isDark = theme === "dark"
  const palette = isDark
    ? {
        nodeSurface: "bg-gray-900/40 border-gray-800",
        nodeGlow: "bg-indigo-500/5",
        nodeShimmer: "via-indigo-500/20",
        pulseRing: "border-indigo-500/30",
        innerHighlight: "from-white/5",
        baseStroke: "rgba(155, 156, 247, 0.6)",
        activeStroke: "rgba(59, 130, 246, 0.65)",
        dashStroke: "rgba(196, 181, 253, 0.45)",
        ambientOne: "bg-indigo-500/20",
        ambientTwo: "bg-violet-500/18",
      }
    : {
        nodeSurface: "bg-white/84 border-indigo-200/95",
        nodeGlow: "bg-indigo-500/12",
        nodeShimmer: "via-indigo-500/35",
        pulseRing: "border-indigo-500/35",
        innerHighlight: "from-white/70",
        baseStroke: "rgba(99, 102, 241, 0.42)",
        activeStroke: "rgba(79, 70, 229, 0.72)",
        dashStroke: "rgba(79, 70, 229, 0.42)",
        ambientOne: "bg-indigo-500/16",
        ambientTwo: "bg-sky-400/16",
      }

  const nodes = [
    { x: 0, y: 80, connections: [1, 2] },
    { x: 160, y: 20, connections: [5] },
    { x: 140, y: 160, connections: [3, 4] },
    { x: 320, y: 100, connections: [5, 6] },
    { x: 300, y: 200, connections: [6] },
    { x: 480, y: 40, connections: [] },
    { x: 460, y: 140, connections: [7] },
    { x: 600, y: 120, connections: [] },
  ]

  return (
    <motion.div
      className="relative h-[260px] w-[680px]"
      initial={{ opacity: 0.92, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <motion.div
        className={`pointer-events-none absolute -left-14 -top-14 h-40 w-40 rounded-full blur-[70px] ${palette.ambientOne}`}
        animate={{ opacity: [0.2, 0.45, 0.2], x: [0, 16, 0], y: [0, -10, 0] }}
        transition={{ duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      />
      <motion.div
        className={`pointer-events-none absolute -bottom-10 right-0 h-36 w-36 rounded-full blur-[65px] ${palette.ambientTwo}`}
        animate={{ opacity: [0.2, 0.5, 0.2], x: [0, -14, 0], y: [0, 10, 0] }}
        transition={{ duration: 5.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.4 }}
      />
      <motion.div
        className={`pointer-events-none absolute inset-y-0 -left-24 w-28 bg-gradient-to-r from-transparent ${palette.nodeShimmer} to-transparent`}
        animate={{ x: [-120, 860] }}
        transition={{ duration: 1.9, repeat: Number.POSITIVE_INFINITY, repeatDelay: 1.2, ease: "linear" }}
      />

      <svg className="absolute inset-0 w-full h-full">
        {nodes.map((node, index) => (
          <React.Fragment key={`connections-${index}`}>
            {node.connections.map((targetIndex, connectionIndex) => {
              const start = { x: node.x + 40, y: node.y + 25 }
              const end = { x: nodes[targetIndex].x + 40, y: nodes[targetIndex].y + 25 }
              const midX = (start.x + end.x) / 2

              const path = `M ${start.x} ${start.y}
                           H ${midX}
                           V ${end.y}
                           H ${end.x}`

              return (
                <g key={`${index}-${connectionIndex}`}>
                  <motion.path
                    d={path}
                    stroke={palette.baseStroke}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="square"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.75,
                      delay: index * 0.15 + 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 3,
                      ease: "linear",
                    }}
                  />
                  <motion.path
                    d={path}
                    stroke={palette.activeStroke}
                    strokeWidth="2.25"
                    fill="none"
                    strokeLinecap="square"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                      duration: 0.9,
                      delay: index * 0.15 + 0.2,
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 2.2,
                      ease: "linear",
                    }}
                  />
                  <motion.path
                    d={path}
                    stroke={palette.dashStroke}
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="7 10"
                    animate={{ strokeDashoffset: [0, -70] }}
                    transition={{
                      duration: 1.2,
                      delay: index * 0.1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  />
                </g>
              )
            })}
          </React.Fragment>
        ))}
      </svg>

      {nodes.map((node, index) => (
        <motion.div key={`node-${index}`} className="absolute" style={{ left: node.x, top: node.y, zIndex: 10 }}>
          <motion.div
            className={`relative h-[50px] w-[80px] overflow-hidden rounded-lg border backdrop-blur-sm ${palette.nodeSurface}`}
            style={{
              boxShadow: isDark
                ? "0 0 70px 2px rgba(149, 130, 246, 0.1), 0 0 30px 4px rgba(149, 130, 246, 0.05)"
                : "0 0 64px 1px rgba(79, 70, 229, 0.11), 0 0 28px 3px rgba(99, 102, 241, 0.06)",
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: [1, 1.04, 1] }}
            transition={{
              duration: 1.8,
              delay: index * 0.15,
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1.9,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className={`pointer-events-none absolute -inset-3 rounded-xl blur-xl ${palette.nodeGlow}`}
              animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.98, 1.06, 0.98] }}
              transition={{
                duration: 1.6,
                delay: index * 0.1,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1.4,
                ease: "easeInOut",
              }}
            />

            <motion.div
              className={`absolute inset-0 ${palette.nodeGlow}`}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />

            <motion.div
              className={`absolute inset-0 bg-gradient-to-r from-transparent ${palette.nodeShimmer} to-transparent`}
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{
                duration: 0.85,
                delay: index * 0.15,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 2.1,
              }}
            />

            <motion.div
              className={`absolute inset-0 rounded-lg border-2 ${palette.pulseRing}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{
                duration: 1.15,
                delay: index * 0.15,
                repeat: Number.POSITIVE_INFINITY,
                repeatDelay: 1.85,
              }}
            />

            <div className={`absolute inset-0 bg-gradient-to-b ${palette.innerHighlight} to-transparent`} />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default LoadingAnimation
