"use client"

import { useCanRedo, useCanUndo, useRedo, useUndo } from "@liveblocks/react/suspense"
import { Panel, useReactFlow } from "@xyflow/react"
import { Maximize, Minus, Plus, Redo2, Undo2 } from "lucide-react"
import { CANVAS_ZOOM_OPTIONS, useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

const buttonClassName = "flex h-10 w-10 items-center justify-center rounded-full text-copy-secondary hover:bg-subtle hover:text-copy-primary focus-visible:outline-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-30"

export function CanvasControls() {
  const flow = useReactFlow<CanvasNode, CanvasEdge>()
  const undo = useUndo()
  const redo = useRedo()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  useKeyboardShortcuts(flow, undo, redo)

  return (
    <Panel position="bottom-left" style={{ bottom: 72 }}>
      <div role="group" aria-label="Canvas controls" className="nodrag nopan flex items-center gap-1 rounded-full border border-surface-border bg-surface/95 p-2 shadow-lg backdrop-blur-sm">
        <button type="button" aria-label="Zoom out" title="Zoom out (-)" className={buttonClassName} onClick={() => void flow.zoomOut(CANVAS_ZOOM_OPTIONS)}>
          <Minus className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Fit view" title="Fit view" className={buttonClassName} onClick={() => void flow.fitView(CANVAS_ZOOM_OPTIONS)}>
          <Maximize className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Zoom in" title="Zoom in (+)" className={buttonClassName} onClick={() => void flow.zoomIn(CANVAS_ZOOM_OPTIONS)}>
          <Plus className="h-5 w-5" />
        </button>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-surface-border" />
        <button type="button" aria-label="Undo" title="Undo (Cmd/Ctrl+Z)" disabled={!canUndo} className={buttonClassName} onClick={undo}>
          <Undo2 className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Redo" title="Redo (Cmd/Ctrl+Shift+Z or Cmd/Ctrl+Y)" disabled={!canRedo} className={buttonClassName} onClick={redo}>
          <Redo2 className="h-5 w-5" />
        </button>
      </div>
    </Panel>
  )
}
