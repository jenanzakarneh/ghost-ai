import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { enrichCollaborators, readCollaboratorEmail } from "@/lib/collaborators"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ projectId: string }>
}

async function authorize(context: RouteContext, ownerOnly = false) {
  const identity = await getProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const { projectId } = await context.params
  const project = await getAccessibleProject(projectId, identity)
  if (!project || (ownerOnly && !project.isOwned)) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }
  return { project, identity }
}

export async function GET(_request: Request, context: RouteContext) {
  const access = await authorize(context)
  if (access instanceof Response) return access
  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId: access.project.id },
    select: { id: true, email: true },
    orderBy: { email: "asc" },
  })
  return Response.json({ collaborators: await enrichCollaborators(collaborators), isOwner: access.project.isOwned })
}

export async function POST(request: Request, context: RouteContext) {
  const access = await authorize(context, true)
  if (access instanceof Response) return access
  const email = await readCollaboratorEmail(request)
  if (email instanceof Response) return email
  if (access.identity.verifiedEmails.some((address) => address.toLowerCase() === email)) {
    return Response.json({ error: "You already own this project" }, { status: 400 })
  }
  const existing = await prisma.projectCollaborator.findFirst({
    where: { projectId: access.project.id, email: { equals: email, mode: "insensitive" } },
  })
  if (existing) return Response.json({ error: "This collaborator already has access" }, { status: 409 })
  try {
    const collaborator = await prisma.projectCollaborator.create({
      data: { projectId: access.project.id, email },
      select: { id: true, email: true },
    })
    return Response.json({ collaborator }, { status: 201 })
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return Response.json({ error: "This collaborator already has access" }, { status: 409 })
    }
    throw error
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const access = await authorize(context, true)
  if (access instanceof Response) return access
  const email = await readCollaboratorEmail(request)
  if (email instanceof Response) return email
  await prisma.projectCollaborator.deleteMany({
    where: { projectId: access.project.id, email: { equals: email, mode: "insensitive" } },
  })
  return new Response(null, { status: 204 })
}
