import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { prisma } from "@/lib/prisma"
import { specTokenRequestSchema } from "@/lib/spec-generation"

export async function POST(request: Request) {
  const headers = { "Cache-Control": "no-store" }
  try {
    const { userId } = await auth()
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401, headers })
    const parsed = specTokenRequestSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return Response.json({ error: "Invalid run ID" }, { status: 400, headers })
    const run = await prisma.taskRun.findUnique({ where: { runId: parsed.data.runId } })
    if (!run || run.userId !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403, headers })
    }
    const token = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [run.runId] } }, expirationTime: "1h",
    })
    return Response.json({ token }, { headers })
  } catch {
    return Response.json({ error: "Unable to issue run token" }, { status: 503, headers })
  }
}
