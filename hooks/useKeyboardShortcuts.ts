"use client"

import { useEffect } from "react"
import type { ReactFlowInstance } from "@xyflow/react"
import type { CanvasEdge, CanvasNode } from "@/types/canvas"

export const CANVAS_ZOOM_OPTIONS = { duration: 200 }

export function useKeyboardShortcuts(
  flow: ReactFlowInstance<CanvasNode, CanvasEdge>,
  undo: () => void,
  redo: () => void,
) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.altKey) return
      const target = event.composedPath()[0]
      if (target instanceof HTMLElement && (
        target.isContentEditable || target.closest("input, textarea, select, [role='textbox']")
      )) return

      const key = event.key.toLowerCase()
      if (event.metaKey || event.ctrlKey) {
        if (key === "z") {
          event.preventDefault()
          if (event.shiftKey) redo()
          else undo()
        } else if (key === "y") {
          event.preventDefault()
          redo()
        }
        return
      }

      if (key === "+" || key === "=") {
        event.preventDefault()
        void flow.zoomIn(CANVAS_ZOOM_OPTIONS)
      } else if (key === "-") {
        event.preventDefault()
        void flow.zoomOut(CANVAS_ZOOM_OPTIONS)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [flow, undo, redo])
}
