import { runs, tasks } from "@trigger.dev/sdk"
import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { prisma } from "@/lib/prisma"
import { specRequestSchema } from "@/lib/spec-generation"
import type { generateSpec } from "@/trigger/generate-spec"

export async function POST(request: Request) {
  try {
    const identity = await getProjectIdentity()
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })
    const parsed = specRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Invalid spec request" }, { status: 400 })
    const project = await getAccessibleProject(parsed.data.roomId, identity)
    if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })
    const run = await tasks.trigger<typeof generateSpec>("generate-spec", {
      ...parsed.data, projectId: project.id, roomId: project.id,
    })
    try {
      await prisma.taskRun.create({
        data: { runId: run.id, projectId: project.id, userId: identity.userId },
      })
    } catch (error) {
      // Compensate for a persistence failure across the two services.
      await runs.cancel(run.id).catch(() => undefined)
      throw error
    }
    return Response.json({ runId: run.id }, { status: 202 })
  } catch {
    return Response.json({ error: "Unable to start spec task" }, { status: 503 })
  }
}
