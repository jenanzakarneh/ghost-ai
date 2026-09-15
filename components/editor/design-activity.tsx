"use client"

import { useFeedMessages, useFeeds } from "@liveblocks/react"
import { Panel } from "@xyflow/react"

function StatusMessages() {
  const { messages, error } = useFeedMessages("design-status")
  if (error) return <p className="text-xs text-copy-muted">AI activity is temporarily unavailable.</p>
  if (!messages?.length) return null
  const recent = [...messages].sort((a, b) => a.createdAt - b.createdAt).slice(-4)
  return (
    <div role="status" aria-live="polite" className="space-y-1">
      {recent.map(({ id, data }) => {
        if (!data || typeof data !== "object" || !("message" in data) || typeof data.message !== "string") return null
        return <p key={id} className="text-xs text-copy-secondary">{data.message}</p>
      })}
    </div>
  )
}

export function DesignActivity() {
  const { feeds } = useFeeds()
  if (!feeds?.some(feed => feed.feedId === "design-status")) return null
  return (
    <Panel position="top-left" className="max-w-72 rounded-xl border border-surface-border bg-surface p-3">
      <h2 className="mb-2 text-xs font-medium text-ai-text">AI activity</h2>
      <StatusMessages />
    </Panel>
  )
}
