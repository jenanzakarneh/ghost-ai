import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" }
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401, headers })
    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || !("runId" in body) ||
      typeof body.runId !== "string" || !body.runId.trim()) {
      return Response.json({ error: "Invalid run ID" }, { status: 400, headers })
    }
    const run = await prisma.taskRun.findUnique({ where: { runId: body.runId } })
    if (!run || run.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers })
    }
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [run.runId] } }, expirationTime: "15m",
    })
    return Response.json({ token }, { headers })
  } catch {
    return Response.json({ error: "Unable to issue run token" }, { status: 503, headers })
  }
}
