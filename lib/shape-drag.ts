import { NODE_COLORS, NODE_SHAPES, type CanvasNode, type NodeShape } from "@/types/canvas"

export const SHAPE_DRAG_TYPE = "application/x-ghost-shape"

export interface ShapeSize { width: number; height: number }
export interface ShapeDragPayload extends ShapeSize { shape: NodeShape }

export const SHAPE_SIZES: Record<NodeShape, ShapeSize> = {
  rectangle: { width: 180, height: 100 },
  diamond: { width: 180, height: 180 },
  circle: { width: 120, height: 120 },
  pill: { width: 180, height: 80 },
  cylinder: { width: 140, height: 160 },
  hexagon: { width: 160, height: 140 },
}

export function readShapeDrag(raw: string): ShapeDragPayload | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== "object" || !("shape" in value)
      || !NODE_SHAPES.includes(value.shape as NodeShape)
      || !("width" in value) || !("height" in value)) return null
    const shape = value.shape as NodeShape
    const size = SHAPE_SIZES[shape]
    if (value.width !== size.width || value.height !== size.height) return null
    return { shape, ...size }
  } catch { return null }
}

let nodeCounter = 0

export function createShapeNode(payload: ShapeDragPayload, position: { x: number; y: number }): CanvasNode {
  return {
    id: `${payload.shape}-${Date.now()}-${++nodeCounter}`,
    type: "canvasNode",
    position,
    width: payload.width,
    height: payload.height,
    data: { label: "", color: NODE_COLORS[0].color, shape: payload.shape },
  }
}
