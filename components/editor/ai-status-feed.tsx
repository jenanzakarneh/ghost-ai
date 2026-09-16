"use client"

import { useEffect, useState } from "react"
import { useCreateFeed, useFeedMessages, useFeeds } from "@liveblocks/react"
import { AI_STATUS_FEED_ID, aiStatusMessageSchema } from "@/types/tasks"

function LatestStatus() {
  const { messages, error } = useFeedMessages(AI_STATUS_FEED_ID)
  if (error) return <p className="text-copy-muted">AI status is temporarily unavailable.</p>
  const latest = messages?.reduce<(typeof messages)[number] | undefined>(
    (current, message) => !current || message.createdAt >= current.createdAt ? message : current,
    undefined,
  )
  const parsed = aiStatusMessageSchema.safeParse(latest?.data)
  return parsed.success && parsed.data.text ? <p className="whitespace-pre-wrap wrap-anywhere">{parsed.data.text}</p> : null
}

export function AiStatusFeed() {
  const { feeds, error } = useFeeds()
  const createFeed = useCreateFeed()
  const [creationFailed, setCreationFailed] = useState(false)
  const exists = feeds?.some((feed) => feed.feedId === AI_STATUS_FEED_ID)

  useEffect(() => {
    if (exists !== false || error) return
    let cancelled = false
    void createFeed(AI_STATUS_FEED_ID).catch(() => {
      if (!cancelled) setCreationFailed(true)
    })
    return () => { cancelled = true }
  }, [createFeed, exists, error])

  if (exists) return <LatestStatus />
  if (error || creationFailed) return <p className="text-copy-muted">AI status is temporarily unavailable.</p>
  return null
}
