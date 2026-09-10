import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { readProjectName } from "@/lib/project-input"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({ where: { ownerId: userId } })
  return Response.json({ projects })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const name = await readProjectName(request, "Untitled Project")
  if (name instanceof Response) return name

  const project = await prisma.project.create({ data: { name, ownerId: userId } })
  return Response.json({ project }, { status: 201 })
}
