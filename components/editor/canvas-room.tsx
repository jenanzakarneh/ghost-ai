"use client"

import { Component, useState, type ReactNode } from "react"
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
  useErrorListener,
  useLostConnectionListener,
} from "@liveblocks/react/suspense"
import { BaseCanvas } from "@/components/editor/base-canvas"

export interface CanvasTemplateControls {
  templatesOpen: boolean
  onTemplatesOpenChange: (open: boolean) => void
}

interface CanvasRoomProps extends CanvasTemplateControls {
  roomId: string
}

interface CanvasErrorBoundaryProps {
  children: ReactNode
}

interface CanvasErrorBoundaryState {
  hasError: boolean
}

class CanvasErrorBoundary extends Component<CanvasErrorBoundaryProps, CanvasErrorBoundaryState> {
  state: CanvasErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): CanvasErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="font-medium text-copy-primary">Unable to connect to the canvas.</p>
          <p className="text-sm text-copy-muted">Check your connection and reload to try again.</p>
        </div>
      )
    }
    return this.props.children
  }
}

// Keep connection listeners mounted while the canvas is suspended on room storage.
function CanvasConnection(props: CanvasTemplateControls) {
  const [failed, setFailed] = useState(false)
  useErrorListener((error) => {
    if (error.context.type === "ROOM_CONNECTION_ERROR") setFailed(true)
  })
  useLostConnectionListener((event) => {
    if (event === "failed") setFailed(true)
  })
  if (failed) throw new Error("Canvas connection failed")

  return (
    <ClientSideSuspense fallback={
      <div role="status" className="flex h-full items-center justify-center text-sm text-copy-muted">
        Loading canvas…
      </div>
    }>
      <BaseCanvas {...props} />
    </ClientSideSuspense>
  )
}

export function CanvasRoom({ roomId, ...props }: CanvasRoomProps) {
  return (
    <div className="h-full w-full" aria-label="System design canvas">
      <CanvasErrorBoundary key={roomId}>
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider id={roomId} initialPresence={{ cursor: null, thinking: false }}>
            <CanvasConnection {...props} />
          </RoomProvider>
        </LiveblocksProvider>
      </CanvasErrorBoundary>
    </div>
  )
}
