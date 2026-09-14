"use client"

import type { NodeProps } from "@xyflow/react"
import { NODE_COLORS, type CanvasNode } from "@/types/canvas"

export function CanvasNodeRenderer({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-xl border px-3 text-center text-sm ${selected ? "border-brand" : "border-surface-border"}`}
      style={{ backgroundColor: data.color, color: NODE_COLORS.find((item) => item.color === data.color)?.textColor ?? NODE_COLORS[0].textColor }}>
      <span className="break-words whitespace-pre-wrap">{data.label}</span>
    </div>
  )
}
