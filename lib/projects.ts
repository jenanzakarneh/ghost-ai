import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { ProjectLists } from "@/types/project"

export async function getEditorProjects(): Promise<ProjectLists> {
  const { userId } = await auth.protect()
  const user = await currentUser()
  const emails = user?.emailAddresses
    .filter((email) => email.verification?.status === "verified")
    .map((email) => email.emailAddress) ?? []
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { collaborators: { some: { email: { in: emails, mode: "insensitive" } } } },
      ],
    },
    select: { id: true, name: true, ownerId: true },
    orderBy: { updatedAt: "desc" },
  })
  const items = projects.map(({ id, name, ownerId }) => ({ id, name, isOwned: ownerId === userId }))
  return {
    ownedProjects: items.filter((project) => project.isOwned),
    sharedProjects: items.filter((project) => !project.isOwned),
  }
}
