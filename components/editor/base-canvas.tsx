"use client"

import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useRef, type DragEvent } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import { ShapePanel } from "@/components/editor/shape-panel"
import { CanvasNodeRenderer } from "@/components/editor/canvas-node"
import { createShapeNode, readShapeDrag, SHAPE_DRAG_TYPE } from "@/lib/shape-drag"
import { Background, BackgroundVariant, ConnectionMode, MiniMap, ReactFlow } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"
import "@xyflow/react/dist/style.css"

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
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        connectionMode={ConnectionMode.Loose}
        colorMode="dark"
        style={{ background: "var(--bg-base)" }}
        fitView
      >
        <ShapePanel />
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
