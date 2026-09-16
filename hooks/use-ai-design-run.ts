"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useCreateFeedMessage, useRoom, useSelf } from "@liveblocks/react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { z } from "zod"
import { AI_CHAT_FEED_ID, aiChatMessageSchema } from "@/types/tasks"

const designRunSchema = z.object({
  runId: z.string().trim().min(1),
  publicToken: z.string().trim().min(1),
})

interface DesignRun {
  runId: string
  publicToken: string
}

export function useAiDesignRun() {
  const room = useRoom()
  const self = useSelf()
  const createMessage = useCreateFeedMessage()
  const [activeRun, setActiveRun] = useState<DesignRun | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const busyRef = useRef(false)
  const settledRuns = useRef(new Set<string>())
  const { run, error } = useRealtimeRun(activeRun?.runId, {
    accessToken: activeRun?.publicToken,
    enabled: Boolean(activeRun),
    // Isolate cached results and errors between consecutive runs.
    id: activeRun?.runId,
  })

  const publishAssistant = useCallback((content: string) => {
    return Promise.resolve().then(() => createMessage(AI_CHAT_FEED_ID, aiChatMessageSchema.parse({
      sender: { id: "ghost-ai", name: "Ghost AI" },
      role: "assistant",
      content,
      timestamp: new Date().toISOString(),
    }))).catch(() => {
      // A broken chat connection cannot carry its own error message.
      setDeliveryError(content + " This notice could not be shared with the room.")
    })
  }, [createMessage])

  useEffect(() => {
    if (!activeRun || settledRuns.current.has(activeRun.runId)) return
    const current = run?.id === activeRun.runId ? run : undefined
    if (!current?.isCompleted && !error) return
    settledRuns.current.add(activeRun.runId)
    const content = current?.isCompleted
      ? current.isSuccess
        ? "Your design is ready. The canvas reflects the updated architecture."
        : "The design run did not complete successfully. Any changes already applied remain on the canvas."
      : "Live run tracking was interrupted. The design may still be running; canvas updates will continue to appear."
    void publishAssistant(content).finally(() => {
      setActiveRun(null)
      busyRef.current = false
    })
  }, [activeRun, run, error, publishAssistant])

  async function submit(prompt: string): Promise<boolean> {
    if (busyRef.current || !self) return false
    const message = aiChatMessageSchema.safeParse({
      sender: { id: self.id, name: self.info.name || self.id },
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    })
    if (!message.success) return false
    busyRef.current = true
    setIsSubmitting(true)
    setDeliveryError(null)
    let sent = false
    let tracking = false
    try {
      await createMessage(AI_CHAT_FEED_ID, message.data)
      sent = true
      const response = await fetch("/api/ai/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message.data.content, roomId: room.id }),
      })
      if (!response.ok) {
        await publishAssistant("The design request could not be started. Please try again.")
        return sent
      }
      const result = designRunSchema.safeParse(await response.json().catch(() => null))
      if (!result.success) {
        await publishAssistant("The design service did not return valid run credentials. The request may have started, but live tracking is unavailable.")
        return sent
      }
      tracking = true
      setActiveRun(result.data)
      return sent
    } catch {
      await publishAssistant(sent
        ? "The design request could not be confirmed. It may have started; check the canvas before trying again."
        : "Your message could not be sent. Please try again.")
      return sent
    } finally {
      setIsSubmitting(false)
      if (!tracking) busyRef.current = false
    }
  }

  return { submit, isSubmitting, isRunning: activeRun !== null, deliveryError }
}
