import { NODE_SHAPES, type CanvasNode, type CanvasEdge } from "@/types/canvas"

export interface CanvasSnapshot { nodes: CanvasNode[]; edges: CanvasEdge[] }
export type CanvasSaveStatus = "saving" | "saved" | "error"

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (!record(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) return false
  const ids = new Set<string>()
  for (const node of value.nodes) {
    if (!record(node) || typeof node.id !== "string" || !node.id || ids.has(node.id) ||
      node.type !== "canvasNode" || !record(node.position) ||
      !Number.isFinite(node.position.x) || !Number.isFinite(node.position.y) ||
      !record(node.data) || typeof node.data.label !== "string" || typeof node.data.color !== "string" ||
      !NODE_SHAPES.includes(node.data.shape as (typeof NODE_SHAPES)[number])) return false
    ids.add(node.id)
  }
  const edgeIds = new Set<string>()
  for (const edge of value.edges) {
    if (!record(edge) || typeof edge.id !== "string" || !edge.id || edgeIds.has(edge.id) ||
      typeof edge.source !== "string" || typeof edge.target !== "string" ||
      !ids.has(edge.source) || !ids.has(edge.target) ||
      (edge.data !== undefined && (!record(edge.data) ||
        (edge.data.label !== undefined && typeof edge.data.label !== "string")))) return false
    edgeIds.add(edge.id)
  }
  return true
}

// Selection, drag state and measured dimensions are local renderer state.
export function serializeCanvas({ nodes, edges }: CanvasSnapshot): string {
  return JSON.stringify({
    nodes: nodes.map(({ selected, dragging, measured, ...node }) => {
      void selected; void dragging; void measured
      return node
    }),
    edges: edges.map(({ selected, ...edge }) => { void selected; return edge }),
  })
}
