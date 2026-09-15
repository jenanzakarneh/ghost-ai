import { get, put } from "@vercel/blob"
import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { isCanvasSnapshot } from "@/lib/canvas-snapshot"
import { prisma } from "@/lib/prisma"

interface RouteContext { params: Promise<{ projectId: string }> }
const headers = { "Cache-Control": "no-store" }

async function authorize(context: RouteContext) {
  const identity = await getProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const { projectId } = await context.params
  const project = await getAccessibleProject(projectId, identity)
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })
  return project
}

export async function GET(_request: Request, context: RouteContext) {
  const project = await authorize(context)
  if (project instanceof Response) return project
  try {
    const saved = await prisma.project.findUnique({ where: { id: project.id }, select: { canvasJsonPath: true } })
    if (!saved?.canvasJsonPath) return Response.json({ canvas: null }, { headers })
    const blob = await get(saved.canvasJsonPath, { access: "private", useCache: false })
    if (!blob || blob.statusCode !== 200) throw new Error("Snapshot unavailable")
    const canvas: unknown = await new Response(blob.stream).json()
    if (!isCanvasSnapshot(canvas)) throw new Error("Invalid snapshot")
    return Response.json({ canvas }, { headers })
  } catch {
    return Response.json({ error: "Unable to load canvas" }, { status: 503, headers })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const project = await authorize(context)
  if (project instanceof Response) return project
  const canvas: unknown = await request.json().catch(() => null)
  if (!isCanvasSnapshot(canvas)) return Response.json({ error: "Invalid canvas" }, { status: 400 })
  try {
    const blob = await put(`canvas/${project.id}.json`, JSON.stringify(canvas), {
      access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true,
    })
    await prisma.project.update({ where: { id: project.id }, data: { canvasJsonPath: blob.url } })
    return Response.json({ saved: true }, { headers })
  } catch {
    return Response.json({ error: "Unable to save canvas" }, { status: 503, headers })
  }
}
