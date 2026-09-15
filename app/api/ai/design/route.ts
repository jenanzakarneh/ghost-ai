import { runs, tasks } from "@trigger.dev/sdk"
import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import type { designAgent } from "@/trigger/design-agent"

export async function POST(request: Request) {
  try {
    const identity = await getProjectIdentity()
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== "object" ||
      !("prompt" in body) || typeof body.prompt !== "string" || !body.prompt.trim() ||
      !("roomId" in body) || typeof body.roomId !== "string" || !body.roomId.trim() ||
      !("projectId" in body) || typeof body.projectId !== "string" || body.projectId !== body.roomId) {
      return Response.json({ error: "Invalid design request" }, { status: 400 })
    }
    const project = await getAccessibleProject(body.projectId, identity)
    if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })
    const run = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt: body.prompt, roomId: project.id,
    })
    try {
      await prisma.taskRun.create({
        data: { runId: run.id, projectId: project.id, userId: identity.userId },
      })
    } catch (error) {
      // The services cannot share a transaction; cancel an untracked run if possible.
      await runs.cancel(run.id).catch(() => undefined)
      throw error
    }
    return Response.json({ runId: run.id }, { status: 202 })
  } catch {
    return Response.json({ error: "Unable to start design task" }, { status: 503 })
  }
}
