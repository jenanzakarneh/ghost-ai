"use client"

import { Circle, Cylinder, Diamond, Hexagon, RectangleHorizontal, RectangleEllipsis } from "lucide-react"
import { Panel } from "@xyflow/react"
import { NODE_SHAPES } from "@/types/canvas"
import { SHAPE_DRAG_TYPE, SHAPE_SIZES } from "@/lib/shape-drag"

const icons = { rectangle: RectangleHorizontal, diamond: Diamond, circle: Circle, pill: RectangleEllipsis, cylinder: Cylinder, hexagon: Hexagon }

export function ShapePanel() {
  return (
    <Panel position="bottom-center">
      <div aria-label="Shapes" className="flex gap-1 rounded-full border border-surface-border bg-surface/95 p-2 shadow-lg backdrop-blur-sm">
        {NODE_SHAPES.map((shape) => {
          const Icon = icons[shape]
          return (
            <button key={shape} type="button" draggable aria-label={`Drag ${shape} onto canvas`} title={`Drag ${shape} onto canvas`}
              className="flex h-10 w-10 cursor-grab items-center justify-center rounded-full text-copy-secondary hover:bg-subtle hover:text-copy-primary focus-visible:outline-2 focus-visible:outline-brand active:cursor-grabbing"
              onDragStart={(event) => {
                event.dataTransfer.setData(SHAPE_DRAG_TYPE, JSON.stringify({ shape, ...SHAPE_SIZES[shape] }))
                event.dataTransfer.effectAllowed = "copy"
              }}>
              <Icon className="pointer-events-none h-5 w-5" />
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
