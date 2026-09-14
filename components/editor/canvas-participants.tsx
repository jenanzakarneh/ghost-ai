"use client"

import { UserButton, useAuth } from "@clerk/nextjs"
import { shallow, useOthersMapped } from "@liveblocks/react/suspense"
import { Panel } from "@xyflow/react"
import { useState } from "react"

function ParticipantAvatar({ name, avatar }: { name: string; avatar: string }) {
  const [failedImage, setFailedImage] = useState<string | null>(null)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"

  return (
    <span role="img" aria-label={name} className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-elevated text-xs font-medium text-copy-primary ring-2 ring-surface-border">
      {avatar && failedImage !== avatar ? (
        // Remote Clerk profile URLs are supplied by authenticated room metadata.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" className="size-full object-cover" onError={() => setFailedImage(avatar)} />
      ) : initials}
    </span>
  )
}

export function CanvasParticipants() {
  const { userId } = useAuth()
  const others = useOthersMapped((other) => ({ id: other.id, info: other.info }), shallow)
  const collaborators = userId ? others.filter(([, other]) => other.id !== userId) : []

  return (
    <Panel position="top-right" className="nodrag nopan flex items-center gap-3 rounded-2xl border border-surface-border bg-surface/95 p-3" aria-label="Room participants">
      {collaborators.length > 0 && (
        <>
          <div className="pointer-events-none flex items-center -space-x-2">
            {collaborators.slice(0, 5).map(([connectionId, other]) => (
              <ParticipantAvatar key={connectionId} name={other.info.name} avatar={other.info.avatar} />
            ))}
            {collaborators.length > 5 && (
              <span className="relative flex size-8 items-center justify-center rounded-full bg-elevated text-xs font-medium text-copy-primary ring-2 ring-surface-border" aria-label={`${collaborators.length - 5} more collaborators`}>
                +{collaborators.length - 5}
              </span>
            )}
          </div>
          <div aria-hidden="true" className="h-6 w-px bg-surface-border" />
        </>
      )}
      <UserButton appearance={{ elements: { avatarBox: { width: "2rem", height: "2rem" } } }} />
    </Panel>
  )
}
