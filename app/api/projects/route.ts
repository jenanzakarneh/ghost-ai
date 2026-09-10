import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { readProjectName, readProjectRoomId } from "@/lib/project-input"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const projects = await prisma.project.findMany({ where: { ownerId: userId } })
  return Response.json({ projects })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const name = await readProjectName(request.clone(), "Untitled Project")
  if (name instanceof Response) return name

  const roomId = await readProjectRoomId(request)
  if (roomId instanceof Response) return roomId

  try {
    const project = await prisma.project.create({
      data: { name, ownerId: userId, ...(roomId && { id: roomId }) },
    })
    return Response.json({ project }, { status: 201 })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Response.json({ error: "Room ID already exists. Reopen the create dialog to generate a new ID." }, { status: 409 })
    }
    throw error
  }
}
