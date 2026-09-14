import { MarkerType } from "@xyflow/react"
import { NODE_COLORS, type CanvasEdge, type CanvasNode, type NodeShape } from "@/types/canvas"
import { SHAPE_SIZES } from "@/lib/shape-drag"

export interface CanvasTemplate {
  id: string
  name: string
  description: string
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}

function node(id: string, label: string, x: number, y: number, shape: NodeShape, palette: number): CanvasNode {
  return { id, type: "canvasNode", position: { x, y }, ...SHAPE_SIZES[shape],
    data: { label, shape, color: NODE_COLORS[palette].color } }
}

function edge(source: string, target: string): CanvasEdge {
  return { id: `${source}-${target}`, type: "canvasEdge", source, target,
    sourceHandle: "right", targetHandle: "left",
    markerEnd: { type: MarkerType.ArrowClosed, color: "var(--text-primary)" } }
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices", name: "Microservices",
    description: "An API gateway routes clients to independent services and their databases.",
    nodes: [node("client", "Client", 0, 160, "hexagon", 1), node("gateway", "API Gateway", 250, 140, "diamond", 2),
      node("users", "User Service", 520, 40, "pill", 7), node("orders", "Order Service", 520, 280, "pill", 6),
      node("users-db", "User Database", 800, 0, "cylinder", 1), node("orders-db", "Order Database", 800, 240, "cylinder", 3)],
    edges: [edge("client", "gateway"), edge("gateway", "users"), edge("gateway", "orders"), edge("users", "users-db"), edge("orders", "orders-db")],
  },
  {
    id: "ci-cd", name: "CI/CD Pipeline",
    description: "Build and test each commit, then deploy through staging to production.",
    nodes: [node("source", "Source", 0, 0, "hexagon", 1), node("build", "Build", 250, 30, "rectangle", 2),
      node("test", "Test", 520, 30, "rectangle", 3), node("staging", "Staging", 790, 40, "pill", 7),
      node("production", "Production", 1060, 40, "pill", 6)],
    edges: [edge("source", "build"), edge("build", "test"), edge("test", "staging"), edge("staging", "production")],
  },
  {
    id: "event-driven", name: "Event-driven System",
    description: "Publish events to a broker for asynchronous processing and notifications.",
    nodes: [node("producer", "Producer", 0, 160, "pill", 1), node("broker", "Event Broker", 280, 120, "hexagon", 3),
      node("worker", "Worker", 550, 0, "pill", 2), node("notifications", "Notifications", 550, 260, "pill", 7),
      node("store", "Event Store", 830, 0, "cylinder", 6)],
    edges: [edge("producer", "broker"), edge("broker", "worker"), edge("broker", "notifications"), edge("worker", "store")],
  },
]
