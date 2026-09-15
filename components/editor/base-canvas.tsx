"use client"

import { LiveMap, LiveObject } from "@liveblocks/client"
import { useCanvasAutosave } from "@/hook/use-canvas-autosave"
import { useLiveblocksFlow } from "@liveblocks/react-flow"
import { useEffect, useRef, type DragEvent } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import { ShapePanel } from "@/components/editor/shape-panel"
import { CanvasControls } from "@/components/editor/canvas-controls"
import { CanvasParticipants } from "@/components/editor/canvas-participants"
import { DesignActivity } from "@/components/editor/design-activity"
import { CanvasCursors } from "@/components/editor/canvas-cursors"
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

import { useRoom, useUpdateMyPresence } from "@liveblocks/react/suspense"
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal"
import type { CanvasTemplate } from "@/components/editor/starter-templates"
import type { CanvasTemplateControls } from "@/components/editor/canvas-room"

export function BaseCanvas({ templatesOpen, onTemplatesOpenChange, saveRequest, onSaveStatus }: CanvasTemplateControls) {
  const room = useRoom()
  const updateMyPresence = useUpdateMyPresence()
  const pendingFit = useRef<string[] | null>(null)
  const flow = useRef<ReactFlowInstance<CanvasNode, CanvasEdge> | null>(null)
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDelete } =
    useLiveblocksFlow<CanvasNode, CanvasEdge>({
      suspense: true,
      nodes: { initial: [] },
      edges: { initial: [] },
    })

  async function hasContent() {
    const { root } = await room.getStorage()
    const sharedFlow = root.get("flow")
    if (!(sharedFlow instanceof LiveObject)) throw new Error("Canvas storage unavailable")
    const sharedNodes = sharedFlow.get("nodes")
    const sharedEdges = sharedFlow.get("edges")
    if (!(sharedNodes instanceof LiveMap) || !(sharedEdges instanceof LiveMap)) throw new Error("Canvas storage unavailable")
    return sharedNodes.size > 0 || sharedEdges.size > 0
  }

  useCanvasAutosave({
    projectId: room.id, nodes, edges, saveRequest, onSaveStatus, hasContent,
    restore: async (snapshot) => {
      if (await hasContent()) return false
      pendingFit.current = snapshot.nodes.map((node) => node.id)
      room.batch(() => {
        onNodesChange(snapshot.nodes.map((item) => ({ type: "add", item })))
        onEdgesChange(snapshot.edges.map((item) => ({ type: "add", item })))
      })
      return true
    },
  })

  useEffect(() => {
    const ids = pendingFit.current
    if (!ids || !flow.current || !ids.every((id) => nodes.some((node) => node.id === id))) return
    pendingFit.current = null
    void flow.current.fitView({ nodes: ids.map((id) => ({ id })), duration: 200 })
  }, [nodes])

  function importTemplate(template: CanvasTemplate) {
    const prefix = crypto.randomUUID()
    const importedNodes = template.nodes.map((node) => ({ ...structuredClone(node), id: `${prefix}-${node.id}` }))
    const importedEdges = template.edges.map((edge) => ({ ...structuredClone(edge), id: `${prefix}-${edge.id}`,
      source: `${prefix}-${edge.source}`, target: `${prefix}-${edge.target}` }))
    pendingFit.current = importedNodes.map((node) => node.id)
    room.batch(() => {
      onEdgesChange(edges.map((edge) => ({ type: "remove", id: edge.id })))
      onNodesChange(nodes.map((node) => ({ type: "remove", id: node.id })))
      onNodesChange(importedNodes.map((item) => ({ type: "add", item })))
      onEdgesChange(importedEdges.map((item) => ({ type: "add", item })))
    })
  }

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
      <StarterTemplatesModal open={templatesOpen} onOpenChange={onTemplatesOpenChange} onImport={importTemplate} />
      <ReactFlow<CanvasNode, CanvasEdge>
        onInit={(instance) => { flow.current = instance }}
        onMouseMove={(event) => {
          if (!flow.current) return
          updateMyPresence({ cursor: flow.current.screenToFlowPosition(
            { x: event.clientX, y: event.clientY }, { snapToGrid: false }
          ) })
        }}
        onMouseLeave={() => updateMyPresence({ cursor: null })}
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
        <CanvasParticipants />
        <CanvasCursors />
        <DesignActivity />
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
