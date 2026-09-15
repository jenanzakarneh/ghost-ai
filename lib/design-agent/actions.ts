import type { MutableFlow } from "@liveblocks/react-flow/node"
import { NODE_COLORS, NODE_SHAPES, type CanvasEdge, type CanvasNode } from "@/types/canvas"
import { SHAPE_SIZES } from "@/lib/shape-drag"

export class DesignActionError extends Error {}

export const ACTIONS = ["addNode", "moveNode", "resizeNode", "updateNodeData", "deleteNode", "addEdge", "deleteEdge"] as const
export interface DesignAction {
  action: typeof ACTIONS[number]
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  label?: string
  shape?: typeof NODE_SHAPES[number]
  color?: string
  source?: string
  target?: string
}

export const actionSchema = {
  type: "object" as const,
  properties: {
    action: { type: "string" as const, enum: [...ACTIONS] }, id: { type: "string" as const },
    x: { type: "number" as const }, y: { type: "number" as const }, width: { type: "number" as const }, height: { type: "number" as const },
    label: { type: "string" as const }, shape: { type: "string" as const, enum: [...NODE_SHAPES] },
    color: { type: "string" as const, enum: NODE_COLORS.map(({ color }) => color) },
    source: { type: "string" as const }, target: { type: "string" as const },
  }, required: ["action", "id"], additionalProperties: false,
}

export function parseAction(value: unknown): DesignAction {
  if (!value || typeof value !== "object") throw new DesignActionError("Invalid action")
  const a = value as DesignAction
  if (!ACTIONS.includes(a.action) || typeof a.id !== "string" || !a.id.trim() || a.id.length > 160) throw new DesignActionError("Invalid action or ID")
  for (const key of ["x", "y", "width", "height"] as const) {
    if (a[key] !== undefined && (typeof a[key] !== "number" || !Number.isFinite(a[key]) || Math.abs(a[key]) > 100000)) throw new DesignActionError("Invalid dimensions or position")
  }
  if (a.shape !== undefined && !NODE_SHAPES.includes(a.shape)) throw new DesignActionError("Invalid shape")
  if (a.color !== undefined && !NODE_COLORS.some(({ color }) => color === a.color)) throw new DesignActionError("Invalid color")
  if (a.label !== undefined && (typeof a.label !== "string" || a.label.length > 500)) throw new DesignActionError("Invalid label")
  if (["addNode", "moveNode"].includes(a.action) && (a.x === undefined || a.y === undefined)) throw new DesignActionError("Position required")
  if (a.action === "resizeNode" && (a.width === undefined || a.height === undefined || a.width < 80 || a.height < 60 || a.width > 2000 || a.height > 2000)) throw new DesignActionError("Invalid size")
  if (a.action === "addNode" && (a.label === undefined || !a.shape || !a.color)) throw new DesignActionError("Node data required")
  if (a.action === "addEdge" && (typeof a.source !== "string" || typeof a.target !== "string" || !a.source || !a.target)) throw new DesignActionError("Endpoints required")
  return a
}

function checkPlacement(flow: MutableFlow<CanvasNode, CanvasEdge>, node: CanvasNode) {
  const size = SHAPE_SIZES[node.data.shape]
  const width = node.width ?? size.width, height = node.height ?? size.height
  for (const other of flow.nodes) {
    if (other.id === node.id) continue
    const otherSize = SHAPE_SIZES[other.data.shape] ?? SHAPE_SIZES.rectangle
    if (node.position.x < other.position.x + (other.width ?? otherSize.width) + 60 &&
      node.position.x + width + 60 > other.position.x &&
      node.position.y < other.position.y + (other.height ?? otherSize.height) + 60 &&
      node.position.y + height + 60 > other.position.y) throw new DesignActionError("Keep at least 60px between nodes")
  }
}

export function applyAction(flow: MutableFlow<CanvasNode, CanvasEdge>, input: unknown) {
  const a = parseAction(input)
  const node = flow.getNode(a.id)
  if (!["addNode", "addEdge", "deleteEdge"].includes(a.action) && !node) throw new DesignActionError("Node no longer exists; read the canvas again")
  const position = { x: Math.round((a.x ?? 0) / 20) * 20, y: Math.round((a.y ?? 0) / 20) * 20 }
  switch (a.action) {
    case "addNode": {
      if (node) throw new DesignActionError("Node ID already exists")
      const next: CanvasNode = { id: a.id, type: "canvasNode", position, ...SHAPE_SIZES[a.shape!], data: { label: a.label!, shape: a.shape!, color: a.color! } }
      checkPlacement(flow, next)
      flow.addNode(next)
      return position
    }
    case "moveNode": checkPlacement(flow, { ...node!, position }); flow.updateNode(a.id, { position }); return position
    case "resizeNode": checkPlacement(flow, { ...node!, width: a.width, height: a.height }); flow.updateNode(a.id, { width: a.width, height: a.height }); break
    case "updateNodeData": {
      const data = { ...node!.data, ...(a.label !== undefined && { label: a.label }), ...(a.shape && { shape: a.shape }), ...(a.color && { color: a.color }) }
      if (a.shape) checkPlacement(flow, { ...node!, data })
      flow.updateNodeData(a.id, data)
      break
    }
    case "deleteNode":
      flow.removeEdges(flow.edges.filter(e => e.source === a.id || e.target === a.id).map(e => e.id))
      flow.removeNode(a.id)
      break
    case "addEdge":
      if (flow.getEdge(a.id)) throw new DesignActionError("Edge ID already exists")
      if (!flow.getNode(a.source!) || !flow.getNode(a.target!)) throw new DesignActionError("Edge endpoints no longer exist")
      flow.addEdge({ id: a.id, type: "canvasEdge", source: a.source!, target: a.target!, sourceHandle: "right", targetHandle: "left", data: { label: a.label ?? "" }, markerEnd: { type: "arrowclosed", color: "var(--text-primary)" } })
      return flow.getNode(a.source!)!.position
    case "deleteEdge":
      if (!flow.getEdge(a.id)) throw new DesignActionError("Edge no longer exists")
      flow.removeEdge(a.id)
  }
  return node?.position ?? null
}
