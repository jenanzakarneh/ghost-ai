import { clerkClient } from "@clerk/nextjs/server"
import type { Collaborator } from "@/types/collaborator"

export async function enrichCollaborators(collaborators: Collaborator[]): Promise<Collaborator[]> {
  if (!collaborators.length) return []
  try {
    const client = await clerkClient()
    const profiles = new Map<string, { displayName?: string; imageUrl: string }>()
    for (let index = 0; index < collaborators.length; index += 100) {
      const emails = collaborators.slice(index, index + 100).map(({ email }) => email)
      let offset = 0
      while (true) {
        const { data, totalCount } = await client.users.getUserList({ emailAddress: emails, limit: 100, offset })
        for (const user of data) {
          for (const email of user.emailAddresses) {
            if (email.verification?.status !== "verified") continue
            profiles.set(email.emailAddress.toLowerCase(), {
              displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || undefined,
              imageUrl: user.imageUrl,
            })
          }
        }
        offset += data.length
        if (!data.length || offset >= totalCount) break
      }
    }
    return collaborators.map((collaborator) => ({ ...collaborator, ...profiles.get(collaborator.email.toLowerCase()) }))
  } catch {
    // Profile enrichment must not prevent managing email-based access.
    return collaborators
  }
}

export async function readCollaboratorEmail(request: Request): Promise<string | Response> {
  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const email = body && typeof body === "object" && "email" in body && typeof body.email === "string"
    ? body.email.trim().toLowerCase() : ""
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address" }, { status: 400 })
  }
  return email
}
