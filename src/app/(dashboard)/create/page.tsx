"use client";
import { useCallback, useState, useEffect } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Node,
  type Edge,
  useReactFlow,
  Position,
  addEdge,
  SelectionMode,
  Connection,
} from "reactflow"
import dagre from "dagre"
import "reactflow/dist/style.css"

import CustomNode from "../../../components/roadmap/custom-node"
import Sidebar from "../../../components/roadmap/sidebar"
import ControlsComponent from "../../../components/roadmap/controls"

import { generateMindMapData, type AgentActivityEvent } from "@/utils/aiUtils"
import { type MindMapNode, MindMapEdge } from "../../types"
import LoadingAnimationPage from "@/components/roadmap/LoadingAnimationPage"
import { AnimatePresence } from "framer-motion"
import RoadmapControls from "../../../components/roadmap/dock"
import { useTheme } from "next-themes";
import TaskDisplay from "@/components/roadmap/task-display";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveRoadmap } from "@/actions/saveRoadmap";
import { useSelectedNode } from "@/hooks/useSelectedNode";
import { hubotSans } from "@/lib/fonts";

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 240
const nodeHeight = 160
const nodeTypes = {
  customNode: CustomNode,
}

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "LR") => {
  if (!nodes || !edges || nodes.length === 0 || edges.length === 0) {
    console.error("Invalid input for getLayoutedElements:", { nodes, edges })
    return { nodes: [], edges: [] }
  }

  const isHorizontal = direction === "LR"
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

const CareerPossibilities = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null)
  const [agentEvents, setAgentEvents] = useState<AgentActivityEvent[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const { getNode, getEdges, setEdges: setEdgesReactFlow } = useReactFlow()
  const { theme } = useTheme();

  const resetSelection = useCallback(() => {
    setSelectedNode(null)
    setEdges((eds) =>
      eds.map((ed) => ({ ...ed, style: { ...ed.style, stroke: "rgba(155, 156, 247, 0.9)", strokeWidth: 2 } })),
    )
    setNodes((nds) => nds.map((nd) => ({ ...nd, data: { ...nd.data, isExpanded: false } })))
  }, [setEdges, setNodes])

  const onInit = useCallback(() => {
    console.log("Flow initialized")
  }, [])

  const highlightPath = useCallback(
    (nodeId: string) => {
      const highlightedEdges = new Set<string>()
      const nodesToHighlight = new Set<string>([nodeId])

      const traversePath = (currentId: string) => {
        const incomingEdges = getEdges().filter((e) => e.target === currentId)
        incomingEdges.forEach((edge) => {
          if (!highlightedEdges.has(edge.id)) {
            highlightedEdges.add(edge.id)
            nodesToHighlight.add(edge.source)
            traversePath(edge.source)
          }
        })
      }

      traversePath(nodeId)

      setEdgesReactFlow((eds) =>
        eds.map((ed) => ({
          ...ed,
          type: "smoothstep",
          style: {
            ...ed.style,
            stroke: highlightedEdges.has(ed.id) ? `${theme === "dark" ? "rgb(205, 209, 255)" : "rgba(88, 74, 212)"}` : `${theme === "dark" ? "rgba(155, 156, 247, 0.9)" : "rgba(145, 140, 241, 0.6)"}`,
            strokeWidth: highlightedEdges.has(ed.id) ? 3 : 2,
          },
          animated: highlightedEdges.has(ed.id),
        })),
      )

      setNodes((nds) =>
        nds.map((nd) => ({
          ...nd,
          data: { ...nd.data, isHighlighted: nodesToHighlight.has(nd.id) },
        })),
      )
    },
    [getEdges, setEdgesReactFlow, setNodes],
  )

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node as MindMapNode)
      console.log("Node clicked:", node)
      highlightPath(node.id)
      setNodes((nds) =>
        nds.map((nd) => ({
          ...nd,
          data: { ...nd.data, isExpanded: nd.id === node.id },
        })),
      )
    },
    [highlightPath, setNodes],
  )

  const onPaneClick = useCallback(() => {
    resetSelection()
    highlightPath("root")
  }, [resetSelection])

  const generateNewMindMap = useCallback(
    async (currentState: string, desiredOutcome: string, customPrompt?: string | null) => {
      setIsGenerating(true)
      setAgentEvents([
        {
          id: `bootstrap-${Date.now()}`,
          type: "status",
          title: "Booting research agent",
          detail: "Preparing objective understanding and query strategy.",
          timestamp: new Date().toISOString(),
        },
      ])
      try {
        const { initialNodes, initialEdges } = await generateMindMapData({
          currentState,
          desiredOutcome,
          sampleData: false,
          customPrompt,
          theme,
          onActivity: (event) => {
            setAgentEvents((previous) => [...previous.slice(-29), event])
          },
        })
        saveRoadmap({ nodes: initialNodes, edges: initialEdges, title: "First roadmap" });
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)
        setNodes(layoutedNodes)
        setEdges(layoutedEdges)
        setIsInitialized(true)
      } catch (error) {
        setAgentEvents((previous) => [
          ...previous.slice(-29),
          {
            id: `error-${Date.now()}`,
            type: "error",
            title: "Generation failed",
            detail: error instanceof Error ? error.message : "Unknown generation error.",
            timestamp: new Date().toISOString(),
          },
        ])
        console.error("Error generating new mind map:", error)
      } finally {
        setIsGenerating(false)
      }
    },
    [setNodes, setEdges],
  )

  const onConnect = useCallback((connection: Edge | Connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges])

  return (
    <>
      {selectedNode && (
        <TaskDisplay selectedNode={selectedNode} />
      )}
      <div className={`${hubotSans.className} flex flex-col w-full h-screen relative`}>
        {!isGenerating && !isInitialized && (
          <div className={`p-4 bg-gray-50 dark:bg-neutral-950 ${!isInitialized && "h-full"} flex items-center`}>
            <ControlsComponent
              onGenerateNewMindMap={generateNewMindMap}
              isGenerating={isGenerating}
              isInitialized={isInitialized}
              selectedNode={selectedNode}
            />
          </div>
        )}
        <div className="flex-grow relative">
          {isGenerating ? (
            <LoadingAnimationPage activity={agentEvents} />
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onInit={onInit}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              panOnScroll
              selectionMode={SelectionMode.Full}
              selectionOnDrag={true}
              multiSelectionKeyCode="Control"
              fitView
              minZoom={0.5}
              maxZoom={1.5}
              defaultViewport={{ x: 0, y: 0, zoom: 1.2 }}
              attributionPosition="bottom-left"
              className="bg-gray-50 dark:bg-neutral-950 h-full"
            >
              <Controls />
            {/* <div className="fixed z-50 top-0 left-0 w-10 h-10 bg-red-400"></div> */}
              <Background variant={BackgroundVariant.Dots} gap={16} size={1} color={`${theme === "dark" ? "#94a3b8" : "#a295be"}`} style={{ opacity: theme === "dark" ? 0.3 : 1 }} />
            </ReactFlow>
          )}
        </div>
        <div>
          <AnimatePresence>
            {selectedNode && (
              console.log("Selected node for sidebar:", selectedNode),
              <Sidebar selectedNode={selectedNode} key={selectedNode.id} />
            )}
          </AnimatePresence>
        </div>
        {/* <RoadmapControls /> */}
      </div>
    </>
  )
}

export default CareerPossibilities
