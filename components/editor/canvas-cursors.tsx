"use client"

import { useAuth } from "@clerk/nextjs"
import { useOther, useOthersConnectionIds } from "@liveblocks/react/suspense"
import { useViewport } from "@xyflow/react"

function ParticipantCursor({ connectionId, userId }: { connectionId: number; userId: string }) {
  const other = useOther(connectionId, (participant) => participant)
  const { x, y, zoom } = useViewport()
  const cursor = other.presence.cursor
  if (other.id === userId || !cursor) return null

  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate(${cursor.x * zoom + x}px, ${cursor.y * zoom + y}px)`, color: other.info.color }}>
      <svg width="18" height="22" viewBox="0 0 18 22" fill="currentColor">
        <path d="M1 1L16 13L9 14L6 21Z" stroke="var(--bg-base)" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className="absolute left-4 top-4 whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-base" style={{ backgroundColor: other.info.color }}>
        {other.info.name}
      </span>
    </div>
  )
}

export function CanvasCursors() {
  const { userId } = useAuth()
  const connectionIds = useOthersConnectionIds()

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {userId && connectionIds.map((connectionId) => (
        <ParticipantCursor key={connectionId} connectionId={connectionId} userId={userId} />
      ))}
    </div>
  )
}
