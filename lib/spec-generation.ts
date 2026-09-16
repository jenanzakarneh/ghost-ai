import { z } from "zod"
import { isCanvasSnapshot } from "@/lib/canvas-snapshot"
import { aiChatMessageSchema } from "@/types/tasks"

const specContextSchema = z.object({
  roomId: z.string().trim().min(1),
  chatHistory: z.array(aiChatMessageSchema),
  nodes: z.array(z.unknown()),
  edges: z.array(z.unknown()),
})

export const specRequestSchema = specContextSchema.refine(isCanvasSnapshot, {
  message: "Invalid canvas snapshot",
})

export const specTaskSchema = specContextSchema.extend({
  projectId: z.string().trim().min(1),
}).refine(isCanvasSnapshot, { message: "Invalid canvas snapshot" })
  .refine(value => value.projectId === value.roomId, { message: "Project and room must match" })

export const specTokenRequestSchema = z.object({ runId: z.string().trim().min(1) })
