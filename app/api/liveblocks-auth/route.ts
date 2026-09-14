import { currentUser } from "@clerk/nextjs/server"
import { getAccessibleProject, getProjectIdentity } from "@/lib/project-access"
import { getLiveblocks, LiveblocksConfigurationError } from "@/lib/liveblocks"
import { getCursorColor } from "@/lib/cursor-color"

export async function POST(request: Request) {
  const identity = await getProjectIdentity()
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 })

  let input: unknown
  try {
    input = await request.json()
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  if (!input || typeof input !== "object" || !("room" in input)
    || typeof input.room !== "string" || !/^[a-zA-Z0-9_-]{1,128}$/.test(input.room)) {
    return Response.json({ error: "A valid room ID is required" }, { status: 400 })
  }

  const project = await getAccessibleProject(input.room, identity)
  if (!project) return Response.json({ error: "Forbidden" }, { status: 403 })

  const user = await currentUser()
  if (!user || user.id !== identity.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const liveblocks = getLiveblocks()
    await liveblocks.getOrCreateRoom(project.id, { defaultAccesses: [] })
    const session = liveblocks.prepareSession(identity.userId, {
      userInfo: {
        name: user.fullName?.trim() || user.username || "Collaborator",
        avatar: user.imageUrl,
        color: getCursorColor(identity.userId),
      },
    })
    session.allow(project.id, session.FULL_ACCESS)
    const { body, status } = await session.authorize()
    return new Response(body, {
      status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    })
  } catch (error) {
    if (error instanceof LiveblocksConfigurationError) {
      console.error("[Liveblocks configuration]", error.message)
    }
    return Response.json({ error: "Unable to authorize collaboration" }, { status: 503 })
  }
}
