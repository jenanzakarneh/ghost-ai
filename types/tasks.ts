import { z } from "zod"

export const AI_STATUS_FEED_ID = "ai-status-feed"

export interface AiStatusMessage {
  text?: string
}

// Validate untrusted feed data without coupling it to a generation task type.
export const aiStatusMessageSchema = {
  safeParse(value: unknown): { success: true; data: AiStatusMessage } | { success: false } {
    if (!value || typeof value !== "object" || Array.isArray(value)) return { success: false }
    if ("text" in value) {
      if (typeof value.text !== "string") return { success: false }
      return { success: true, data: { text: value.text } }
    }
    return { success: true, data: {} }
  },
}

export const AI_CHAT_FEED_ID = "ai-chat"

export const aiChatMessageSchema = z.object({
  sender: z.object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
  timestamp: z.string().datetime(),
})
