export async function readProjectName(request: Request, defaultName?: string) {
  let body: unknown
  try {
    const text = await request.text()
    body = text.trim() ? JSON.parse(text) : {}
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Expected a JSON object" }, { status: 400 })
  }

  const name = "name" in body ? body.name : defaultName
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "Name must be a non-empty string" }, { status: 400 })
  }

  return name.trim()
}

export async function readProjectRoomId(request: Request) {
  const text = await request.text()
  const body: unknown = text.trim() ? JSON.parse(text) : {}
  if (!body || typeof body !== "object" || !("roomId" in body)) return undefined
  if (typeof body.roomId !== "string" || body.roomId.length > 93 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*-[a-f0-9]{12}$/.test(body.roomId)) {
    return Response.json({ error: "Invalid room ID" }, { status: 400 })
  }
  return body.roomId
}
