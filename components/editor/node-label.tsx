"use client"

import { useState } from "react"
import { useReactFlow } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

interface NodeLabelProps {
  id: string
  label: string
}

export function NodeLabel({ id, label }: NodeLabelProps) {
  const [editing, setEditing] = useState(false)
  const { updateNodeData } = useReactFlow<CanvasNode, CanvasEdge>()

  return (
    <span className="relative inline-grid min-w-8 max-w-full align-middle"
      onDoubleClick={(event) => {
        event.stopPropagation()
        setEditing(true)
      }}>
      <span className={`block whitespace-pre-wrap break-words ${editing ? "invisible" : ""} ${label ? "" : "text-copy-muted"}`}>
        {label || "Label"}{label.endsWith("\n") ? "\u200b" : ""}
      </span>
      {editing && (
        <textarea autoFocus aria-label="Node label" placeholder="Label" value={label} rows={1}
          className="nodrag nopan nowheel absolute inset-0 h-full w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-center text-inherit leading-inherit placeholder:text-copy-muted focus:outline-none"
          style={{ font: "inherit", overflowWrap: "break-word" }}
          onChange={(event) => updateNodeData(id, { label: event.target.value })}
          onBlur={() => setEditing(false)}
          onPointerDown={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            event.stopPropagation()
            if (event.key === "Escape") {
              event.preventDefault()
              setEditing(false)
            }
          }} />
      )}
    </span>
  )
}
