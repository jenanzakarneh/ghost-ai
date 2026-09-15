"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { isCanvasSnapshot, serializeCanvas, type CanvasSnapshot, type CanvasSaveStatus } from "@/lib/canvas-snapshot"

interface AutosaveOptions extends CanvasSnapshot {
  projectId: string
  hasContent: () => Promise<boolean>
  restore: (snapshot: CanvasSnapshot) => Promise<boolean>
  saveRequest: number
  onSaveStatus: (status: CanvasSaveStatus) => void
}

export function useCanvasAutosave({ projectId, nodes, edges, hasContent, restore, saveRequest, onSaveStatus }: AutosaveOptions) {
  const [ready, setReady] = useState(false)
  const serialized = serializeCanvas({ nodes, edges })
  const lastSaved = useRef(serialized)
  const lastSaveRequest = useRef(saveRequest)
  const inFlight = useRef<Promise<void> | null>(null)
  const report = useEffectEvent(onSaveStatus)
  const isReady = useEffectEvent(() => ready)
  const load = useEffectEvent(async (signal: AbortSignal) => {
    if (await hasContent()) return
    const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/canvas`, { signal, cache: "no-store" })
    if (!response.ok) throw new Error("Load failed")
    const { canvas } = await response.json()
    if (canvas !== null && !isCanvasSnapshot(canvas)) throw new Error("Invalid canvas")
    if (signal.aborted) return
    if (canvas !== null && await restore(canvas)) lastSaved.current = serializeCanvas(canvas)
  })

  useEffect(() => {
    if (isReady()) return
    const controller = new AbortController()
    report("saved")
    void load(controller.signal).then(() => {
      if (!controller.signal.aborted) setReady(true)
    }).catch(() => {
      if (!controller.signal.aborted) report("error")
    })
    return () => controller.abort()
  }, [projectId, saveRequest])

  useEffect(() => {
    if (!ready) return
    const manualSave = saveRequest !== lastSaveRequest.current
    lastSaveRequest.current = saveRequest
    if (!manualSave && lastSaved.current === serialized && !inFlight.current) return
    let cancelled = false
    const timer = setTimeout(async () => {
      // Never allow an older request from this editor to finish after a newer one.
      await inFlight.current
      if (cancelled) return
      if (!manualSave && lastSaved.current === serialized) { report("saved"); return }
      const save = async () => {
        report("saving")
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/canvas`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: serialized,
          })
          if (!response.ok) throw new Error("Save failed")
          lastSaved.current = serialized
          if (!cancelled) report("saved")
        } catch {
          if (!cancelled) report("error")
        }
      }
      inFlight.current = save()
      await inFlight.current
      inFlight.current = null
    }, 1000)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [projectId, ready, serialized, saveRequest])
}
