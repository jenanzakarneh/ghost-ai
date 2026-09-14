"use client"

import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useRef, type DragEvent } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import { ShapePanel } from "@/components/editor/shape-panel"
import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasEdgeRenderer } from "@/components/editor/canvas-edge"
import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { createShapeNode, readShapeDrag, SHAPE_DRAG_TYPE } from "@/lib/shape-drag"
import { Background, BackgroundVariant, ConnectionMode, MarkerType, MiniMap, ReactFlow } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import "@xyflow/react/dist/style.css"

const edgeTypes = { canvasEdge: CanvasEdgeRenderer, default: CanvasEdgeRenderer }
const defaultEdgeOptions = {
  type: "canvasEdge",
  markerEnd: { type: MarkerType.ArrowClosed, color: "var(--text-primary)" },
  style: { stroke: "var(--text-primary)", strokeWidth: 1.5, strokeLinecap: "round" as const },
}

const nodeTypes = { canvasNode: CanvasNodeRenderer }

export function BaseCanvas() {
  const flow = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const payload = readShapeDrag(event.dataTransfer.getData(SHAPE_DRAG_TYPE))
    if (!payload || !flow.current) return
    const position = flow.current.screenToFlowPosition({ x: event.clientX, y: event.clientY })
    onNodesChange([{ type: "add", item: createShapeNode(payload, position) }])
  }

  return (
    <div className="h-full w-full" onDrop={onDrop} onDragOver={(event) => {
      if (!event.dataTransfer.types.includes(SHAPE_DRAG_TYPE)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = "copy"
    }}>
      <ReactFlow<CanvasNode, CanvasEdge>
        onInit={(instance) => { flow.current = instance }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection) => {
          const edge = { ...defaultEdgeOptions, ...connection }
          onConnect(edge)
        }}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        style={{ background: "var(--bg-base)" }}
        fitView
      >
        <ShapePanel />
        <CanvasControls />
        <MiniMap
          className="overflow-hidden rounded-xl border border-surface-border"
          bgColor="var(--bg-surface)"
          nodeColor="var(--text-muted)"
          maskColor="var(--accent-primary-dim)"
        />
        <Background variant={BackgroundVariant.Dots} color="var(--border-default)" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
