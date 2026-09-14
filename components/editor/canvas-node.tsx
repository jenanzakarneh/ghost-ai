"use client"

import { Handle, Position, NodeResizer, type NodeProps } from "@xyflow/react"
import type { CanvasNode } from "@/types/canvas"
import { NodeShapeVisual } from "@/components/editor/node-shape"
import { NodeColorToolbar } from "@/components/editor/node-color-toolbar"
import { NodeLabel } from "@/components/editor/node-label"

export function CanvasNodeRenderer({ id, data, selected }: NodeProps<CanvasNode>) {
  return (
    <div className="group h-full w-full">
      <NodeColorToolbar id={id} color={data.color} selected={selected} />
      <NodeResizer isVisible={selected} minWidth={80} minHeight={60}
        lineStyle={{ borderColor: "var(--border-subtle)" }}
        handleStyle={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--text-muted)", width: 6, height: 6 }} />
      <NodeShapeVisual shape={data.shape} color={data.color} selected={selected}>
        <NodeLabel id={id} label={data.label} />
      </NodeShapeVisual>
      {[Position.Top, Position.Right, Position.Bottom, Position.Left].map((position) => (
        <Handle key={position} id={position} type="source" position={position}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{ width: 7, height: 7, background: "var(--text-primary)", border: "1px solid var(--bg-base)" }} />
      ))}
    </div>
  )
}
