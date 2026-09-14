import { auth, currentUser } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import type { Project } from "@/types/project"

export interface ProjectIdentity {
  userId: string
  primaryEmail: string | null
  verifiedEmails: string[]
}

export async function getProjectIdentity(): Promise<ProjectIdentity | null> {
  const { userId } = await auth()
  if (!userId) return null
  const user = await currentUser()
  return {
    userId,
    primaryEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    verifiedEmails: user?.emailAddresses
      .filter((email) => email.verification?.status === "verified")
      .map((email) => email.emailAddress) ?? [],
  }
}

export async function getAccessibleProject(
  roomId: string,
  identity: ProjectIdentity,
): Promise<Project | null> {
  const project = await prisma.project.findFirst({
    where: {
      id: roomId,
      OR: [
        { ownerId: identity.userId },
        { collaborators: { some: { email: { in: identity.verifiedEmails, mode: "insensitive" } } } },
      ],
    },
    select: { id: true, name: true, ownerId: true },
  })
  return project ? { id: project.id, name: project.name, isOwned: project.ownerId === identity.userId } : null
}
