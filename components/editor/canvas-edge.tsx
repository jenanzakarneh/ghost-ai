"use client"

import { useState } from "react"
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, useReactFlow, type EdgeProps } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export function CanvasEdgeRenderer({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, selected, data }: EdgeProps<CanvasEdge>) {
  const [hovered, setHovered] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const { updateEdgeData } = useReactFlow<CanvasNode, CanvasEdge>()
  const label = data?.label ?? ""
  const active = hovered || selected || draft !== null
  const [path, labelX, labelY] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, borderRadius: 0 })

  function save() {
    if (draft === null) return
    updateEdgeData(id, { label: draft })
    setDraft(null)
  }

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onDoubleClick={(event) => { event.stopPropagation(); setDraft(label) }}>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={24}
        style={{ ...style, stroke: "var(--text-primary)", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round", opacity: active ? 1 : 0.55, transition: "opacity 150ms" }} />
      {(label || active) && (
        <EdgeLabelRenderer>
          <div className="nodrag nopan nowheel pointer-events-auto absolute rounded-full border border-surface-border bg-surface px-2 py-0.5 text-xs text-copy-secondary"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => { event.stopPropagation(); if (draft === null) setDraft(label) }}
            onKeyDown={(event) => event.stopPropagation()}>
            {draft !== null ? (
              <span className="relative inline-grid min-w-12 align-middle">
                <span aria-hidden="true" className="invisible whitespace-pre">{draft || "Label"} </span>
                <input autoFocus aria-label="Edge label" value={draft} placeholder="Label"
                  className="absolute inset-0 w-full min-w-0 border-0 bg-transparent p-0 text-center text-inherit outline-none placeholder:text-copy-faint"
                  style={{ font: "inherit" }}
                  onChange={(event) => setDraft(event.target.value)} onBlur={save}
                  onKeyDown={(event) => {
                    event.stopPropagation()
                    if (!event.nativeEvent.isComposing && (event.key === "Enter" || event.key === "Escape")) {
                      event.preventDefault()
                      save()
                    }
                  }} />
              </span>
            ) : label || <span className="text-copy-faint">Double-click to label</span>}
          </div>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}
