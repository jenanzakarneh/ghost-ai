"use client"

import { NodeToolbar, Position, useReactFlow } from "@xyflow/react"
import { Check } from "lucide-react"
import { NODE_COLORS, type CanvasEdge, type CanvasNode } from "@/types/canvas"

interface NodeColorToolbarProps {
  id: string
  color: string
  selected: boolean
}

const colorNames = ["Neutral", "Blue", "Purple", "Orange", "Red", "Pink", "Green", "Teal"]

export function NodeColorToolbar({ id, color, selected }: NodeColorToolbarProps) {
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>()

  return (
    <NodeToolbar nodeId={id} isVisible={selected} position={Position.Top} offset={12}
      role="group" aria-label="Node colors"
      className="nodrag nopan nowheel flex gap-1.5 rounded-xl border border-surface-border bg-surface p-2 shadow-lg"
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}>
      {NODE_COLORS.map((pair, index) => {
        const active = pair.color === color
        return (
          <button key={pair.color} type="button" aria-label={`${colorNames[index]} color theme`}
            title={colorNames[index]} aria-pressed={active}
            className={`flex h-6 w-6 items-center justify-center rounded-full border transition-shadow hover:shadow-[0_0_4px_1px_currentColor] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current ${active ? "ring-1 ring-current ring-offset-2 ring-offset-surface" : ""}`}
            style={{ backgroundColor: pair.color, color: pair.textColor, borderColor: pair.textColor }}
            onClick={() => updateNodeData(id, { color: pair.color })}>
            {active && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
          </button>
        )
      })}
    </NodeToolbar>
  )
}
