"use client"

import { useEffect, useMemo, useState } from "react"
import { useCreateFeed, useFeedMessages, useFeeds } from "@liveblocks/react"
import { AI_CHAT_FEED_ID, aiChatMessageSchema } from "@/types/tasks"

export function useAiChatFeed() {
  const { feeds, error: feedsError } = useFeeds()
  const createFeed = useCreateFeed()
  const [creationFailed, setCreationFailed] = useState(false)
  const exists = feeds?.some((feed) => feed.feedId === AI_CHAT_FEED_ID)
  const history = useFeedMessages(AI_CHAT_FEED_ID)

  useEffect(() => {
    if (exists !== false || feedsError) return
    let cancelled = false
    void createFeed(AI_CHAT_FEED_ID).catch(() => {
      if (!cancelled) setCreationFailed(true)
    })
    return () => { cancelled = true }
  }, [createFeed, exists, feedsError])

  const messages = useMemo(() => (history.messages ?? [])
    .flatMap((message) => {
      const parsed = aiChatMessageSchema.safeParse(message.data)
      return parsed.success ? [{ id: message.id, createdAt: message.createdAt, ...parsed.data }] : []
    })
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id)), [history.messages])

  return {
    ...history,
    messages,
    ready: exists === true && !history.isLoading && !history.error,
    unavailable: Boolean(feedsError || (!exists && creationFailed) || history.error),
  }
}
