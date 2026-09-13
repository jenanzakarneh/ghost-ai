import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loadedModule = { exports: {} }
  new Function("require", "module", "exports", source)(
    (name) => {
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
      return dependencies[name]
    }, loadedModule, loadedModule.exports,
  )
  return loadedModule.exports
}

function setup(userId = "owner", ownerId = "owner") {
  const calls = []
  const project = Object.fromEntries(["findMany", "create", "findUnique", "update", "delete"].map((method) => [
    method, async (args) => {
      calls.push({ method, args })
      if (method === "findUnique") return ownerId === null ? null : { ownerId }
      if (method === "findMany") return []
      return { id: "project", ...args.data }
    },
  ]))
  const dependencies = {
    "@clerk/nextjs/server": { auth: async () => ({ userId }) },
    "@/lib/prisma": { prisma: { project } },
    "@/lib/project-input": load("lib/project-input.ts"),
  }
  return {
    ...load("app/api/projects/route.ts", dependencies),
    ...load("app/api/projects/[projectId]/route.ts", dependencies),
    calls,
  }
}

const context = { params: Promise.resolve({ projectId: "project" }) }
const request = (body) => new Request("http://localhost/api/projects", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
})

test("all endpoints reject anonymous users before database access", async () => {
  const api = setup(null)
  for (const method of ["GET", "POST", "PATCH", "DELETE"]) {
    assert.equal((await api[method](request({ name: "test" }), context)).status, 401)
  }
  assert.deepEqual(api.calls, [])
})

test("list is scoped to authenticated owner", async () => {
  const api = setup()
  assert.deepEqual(await (await api.GET()).json(), { projects: [] })
  assert.deepEqual(api.calls[0].args, { where: { ownerId: "owner" } })
})

test("create defaults name and ignores injected owner and ID", async () => {
  for (const body of [{}, "", { ownerId: "attacker", id: "injected" }]) {
    const api = setup()
    assert.equal((await api.POST(request(body))).status, 201)
    assert.deepEqual(api.calls[0].args, { data: { name: "Untitled Project", ownerId: "owner" } })
  }
})

test("non-owners cannot rename or delete; missing projects return 404", async () => {
  for (const [owner, status] of [["someone-else", 403], [null, 404]]) {
    const api = setup("owner", owner)
    for (const method of ["PATCH", "DELETE"]) {
      assert.equal((await api[method](request({ name: "test" }), context)).status, status)
    }
    assert.ok(api.calls.every(({ method }) => method === "findUnique"))
  }
})

test("invalid input never mutates projects", async () => {
  for (const body of ["{", "null", "[]", { name: 123 }, { name: "  " }, { name: null }]) {
    const api = setup()
    assert.equal((await api.POST(request(body))).status, 400)
    assert.equal((await api.PATCH(request(body), context)).status, 400)
    assert.ok(api.calls.every(({ method }) => method === "findUnique"))
  }
  assert.equal((await setup().PATCH(request({}), context)).status, 400)
})

test("owner can create, rename only the name, and delete", async () => {
  const api = setup()
  assert.equal((await api.POST(request({ name: " Example " }))).status, 201)
  assert.equal((await api.PATCH(request({ name: " Renamed ", ownerId: "attacker" }), context)).status, 200)
  assert.deepEqual(api.calls.find(({ method }) => method === "update").args, {
    where: { id: "project", ownerId: "owner" }, data: { name: "Renamed" },
  })
  assert.equal((await api.DELETE(request(), context)).status, 204)
  assert.deepEqual(api.calls.at(-1).args, { where: { id: "project", ownerId: "owner" } })
})

test("proxy returns JSON 401 for project APIs and preserves page protection", async () => {
  const { default: proxy } = load("proxy.ts", {
    "@clerk/nextjs/server": {
      clerkMiddleware: (handler) => handler,
      createRouteMatcher: (patterns) => (request) => patterns.some((pattern) =>
        new RegExp(`^${pattern}$`).test(new URL(request.url).pathname)),
    },
  })
  let protectedPage = false
  const auth = Object.assign(async () => ({ userId: null }), {
    protect: async () => { protectedPage = true },
  })
  for (const path of ["/api/projects", "/api/projects/project"]) {
    const response = await proxy(auth, new Request(`http://localhost${path}`))
    assert.equal(response.status, 401)
    assert.deepEqual(await response.json(), { error: "Unauthorized" })
  }
  assert.equal(protectedPage, false)
  await proxy(auth, new Request("http://localhost/editor"))
  assert.equal(protectedPage, true)
})

test("create persists a validated room ID and rejects malformed IDs", async () => {
  const api = setup()
  const response = await api.POST(request({ name: "Payments", roomId: "payments-abcdef123456", ownerId: "attacker" }))
  assert.equal(response.status, 201)
  assert.deepEqual(api.calls[0].args.data, { name: "Payments", id: "payments-abcdef123456", ownerId: "owner" })
  for (const roomId of [null, 123, "../project", "no-suffix", "a".repeat(94)]) {
    const invalid = setup()
    assert.equal((await invalid.POST(request({ name: "Payments", roomId }))).status, 400)
    assert.equal(invalid.calls.length, 0)
  }
})

test("duplicate room ID returns conflict without overwriting a project", async () => {
  const api = load("app/api/projects/route.ts", {
    "@clerk/nextjs/server": { auth: async () => ({ userId: "owner" }) },
    "@/lib/prisma": { prisma: { project: { create: async () => { throw { code: "P2002" } } } } },
    "@/lib/project-input": load("lib/project-input.ts"),
  })
  assert.equal((await api.POST(request({ name: "Payments", roomId: "payments-abcdef123456" }))).status, 409)
})

test("editor data uses authenticated ownership and only verified collaborator emails", async () => {
  let query
  const { getEditorProjects } = load("lib/projects.ts", {
    "@clerk/nextjs/server": {
      auth: { protect: async () => ({ userId: "owner" }) },
      currentUser: async () => ({ emailAddresses: [
        { emailAddress: "verified@example.com", verification: { status: "verified" } },
        { emailAddress: "unverified@example.com", verification: { status: "unverified" } },
      ] }),
    },
    "@/lib/prisma": { prisma: { project: { findMany: async (args) => {
      query = args
      return [{ id: "mine", name: "Mine", ownerId: "owner" }, { id: "shared", name: "Shared", ownerId: "other" }]
    } } } },
  })
  assert.deepEqual(await getEditorProjects(), {
    ownedProjects: [{ id: "mine", name: "Mine", isOwned: true }],
    sharedProjects: [{ id: "shared", name: "Shared", isOwned: false }],
  })
  assert.deepEqual(query.where.OR, [
    { ownerId: "owner" },
    { collaborators: { some: { email: { in: ["verified@example.com"], mode: "insensitive" } } } },
  ])
})

function actionHarness(activeId) {
  const values = []
  let cursor = 0
  const navigation = []
  const { useProjectActions } = load("hooks/use-project-actions.ts", {
    react: {
      useState: (initial) => {
        const index = cursor++
        if (!(index in values)) values[index] = initial
        return [values[index], (value) => { values[index] = value }]
      },
      useRef: (initial) => {
        const index = cursor++
        if (!(index in values)) values[index] = { current: initial }
        return values[index]
      },
    },
    "next/navigation": { useRouter: () => Object.fromEntries(["push", "replace", "refresh"].map((method) => [method, (...args) => navigation.push([method, ...args])])) },
  })
  return { navigation, render: function useRender() { cursor = 0; return useProjectActions(activeId) } }
}

test("project actions submit previewed ID, navigate, refresh, and redirect active deletion", async (t) => {
  const requests = []
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, ...options })
    return options.method === "DELETE" ? new Response(null, { status: 204 }) : Response.json({ project: { id: "created" } })
  })
  const harness = actionHarness("active")
  harness.render().openCreateDialog()
  harness.render().setProjectName("Payments Platform")
  const create = harness.render()
  assert.match(create.roomIdPreview, /^payments-platform-[a-f0-9]{12}$/)
  await create.submitCreate()
  assert.deepEqual(JSON.parse(requests[0].body), { name: "Payments Platform", roomId: create.roomIdPreview })
  assert.deepEqual(harness.navigation.shift(), ["push", "/editor/created"])
  harness.render().openRenameDialog({ id: "active", name: "Original", isOwned: true })
  assert.equal(harness.render().projectName, "Original")
  harness.render().setProjectName("Renamed")
  await harness.render().submitRename()
  assert.equal(requests.at(-1).url, "/api/projects/active")
  assert.deepEqual(JSON.parse(requests.at(-1).body), { name: "Renamed" })
  assert.deepEqual(harness.navigation.shift(), ["refresh"])
  harness.render().openDeleteDialog({ id: "other", name: "Other", isOwned: true })
  await harness.render().submitDelete()
  assert.deepEqual(harness.navigation.shift(), ["refresh"])
  harness.render().openDeleteDialog({ id: "active", name: "Active", isOwned: true })
  await harness.render().submitDelete()
  assert.deepEqual(harness.navigation, [["replace", "/editor"], ["refresh"]])
})

test("project actions prevent duplicate submissions and retain dialog on failure", async (t) => {
  let finish
  let calls = 0
  t.mock.method(globalThis, "fetch", () => {
    calls++
    return new Promise((resolve) => { finish = resolve })
  })
  const harness = actionHarness()
  harness.render().openRenameDialog({ id: "project", name: "Original", isOwned: true })
  const pending = harness.render().submitRename()
  assert.equal(harness.render().isLoading, true)
  await harness.render().submitRename()
  harness.render().closeDialog()
  assert.equal(harness.render().dialog, "rename")
  assert.equal(calls, 1)
  finish(Response.json({ error: "Forbidden" }, { status: 403 }))
  await pending
  assert.equal(harness.render().error, "Forbidden")
  assert.equal(harness.render().isLoading, false)
  assert.equal(harness.render().dialog, "rename")
  assert.deepEqual(harness.navigation, [])
})


test("workspace identity excludes unverified emails and skips profile lookup for anonymous users", async () => {
  for (const userId of [null, "owner"]) {
    let profileReads = 0
    const { getProjectIdentity } = load("lib/project-access.ts", {
      "@clerk/nextjs/server": {
        auth: async () => ({ userId }),
        currentUser: async () => {
          profileReads++
          return {
            primaryEmailAddress: { emailAddress: "primary@example.com" },
            emailAddresses: [
              { emailAddress: "primary@example.com", verification: { status: "verified" } },
              { emailAddress: "unverified@example.com", verification: { status: "unverified" } },
            ],
          }
        },
      },
      "@/lib/prisma": {},
    })
    assert.deepEqual(await getProjectIdentity(), userId ? {
      userId, primaryEmail: "primary@example.com", verifiedEmails: ["primary@example.com"],
    } : null)
    assert.equal(profileReads, userId ? 1 : 0)
  }
})

test("workspace access query scopes the requested room to owner or verified collaborators", async () => {
  const identity = { userId: "owner", primaryEmail: null, verifiedEmails: ["member@example.com"] }
  for (const project of [null, { id: "room", name: "Room", ownerId: "owner" }, { id: "room", name: "Room", ownerId: "other" }]) {
    const { getAccessibleProject } = load("lib/project-access.ts", {
      "@clerk/nextjs/server": {},
      "@/lib/prisma": { prisma: { project: { findFirst: async ({ where }) => {
        assert.deepEqual(where, {
          id: "room", OR: [
            { ownerId: "owner" },
            { collaborators: { some: { email: { in: ["member@example.com"], mode: "insensitive" } } } },
          ],
        })
        return project
      } } } },
    })
    assert.deepEqual(await getAccessibleProject("room", identity), project ? {
      id: "room", name: "Room", isOwned: project.ownerId === "owner",
    } : null)
  }
})

test("workspace redirects anonymous visitors and denies unavailable projects before loading sidebar data", async () => {
  for (const state of ["anonymous", "missing", "unauthorized", "owner", "collaborator"]) {
    const calls = []
    const activeProject = ["owner", "collaborator"].includes(state) ? { id: "room", name: "Room", isOwned: state === "owner" } : null
    const { default: Page } = load("app/editor/[roomId]/page.tsx", {
      "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
      "next/navigation": { redirect: (path) => { throw new Error(`redirect:${path}`) } },
      "@/components/editor/access-denied": { AccessDenied: "denied" },
      "@/components/editor/editor-home": { EditorHome: "workspace" },
      "@/lib/project-access": {
        getProjectIdentity: async () => state === "anonymous" ? null : { userId: "user" },
        getAccessibleProject: async (roomId) => { calls.push(roomId); return activeProject },
      },
      "@/lib/projects": { getEditorProjects: async () => { calls.push("list"); return { ownedProjects: [], sharedProjects: [] } } },
    })
    const render = () => Page({ params: Promise.resolve({ roomId: "room" }) })
    if (state === "anonymous") {
      await assert.rejects(render, /redirect:\/sign-in/)
      assert.deepEqual(calls, [])
    } else {
      const result = await render()
      assert.equal(result.type, activeProject ? "workspace" : "denied")
      assert.deepEqual(calls, activeProject ? ["room", "list"] : ["room"])
      if (activeProject) assert.deepEqual(result.props.activeProject, activeProject)
    }
  }
})

function sharingApi({ signedIn = true, access = true, owner = true, existing = false } = {}) {
  const calls = []
  const collaborators = load("lib/collaborators.ts", { "@clerk/nextjs/server": {} })
  const api = load("app/api/projects/[projectId]/collaborators/route.ts", {
    "@/lib/project-access": {
      getProjectIdentity: async () => signedIn ? { userId: "owner", verifiedEmails: ["owner@example.com"] } : null,
      getAccessibleProject: async () => access ? { id: "project", isOwned: owner } : null,
    },
    "@/lib/collaborators": { ...collaborators, enrichCollaborators: async (items) => items },
    "@/lib/prisma": { prisma: { projectCollaborator: Object.fromEntries(
      ["findMany", "findFirst", "create", "deleteMany"].map((method) => [method, async (args) => {
        calls.push({ method, args })
        if (method === "findMany") return [{ id: "member", email: "member@example.com" }]
        if (method === "findFirst") return existing ? { id: "member" } : null
        return { id: "member", ...args.data }
      }]),
    ) } },
  })
  return { ...api, calls }
}

test("sharing API denies anonymous and nonmembers, and makes collaborator access read-only", async () => {
  for (const options of [{ signedIn: false }, { access: false }, { owner: false }]) {
    const api = sharingApi(options)
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await api[method](request({ email: "member@example.com" }), context)
      assert.equal(response.status, options.signedIn === false ? 401 : options.access === false || method !== "GET" ? 403 : 200)
    }
    assert.ok(api.calls.every(({ method }) => method === "findMany"))
  }
})

test("sharing validates and normalizes invitations, rejects duplicates, and scopes removal", async () => {
  for (const body of ["{", {}, { email: "invalid" }, { email: 123 }, { email: "owner@example.com" }]) {
    const api = sharingApi()
    assert.equal((await api.POST(request(body), context)).status, 400)
    assert.equal(api.calls.length, 0)
  }
  assert.equal((await sharingApi({ existing: true }).POST(request({ email: "member@example.com" }), context)).status, 409)
  const api = sharingApi()
  assert.equal((await api.POST(request({ email: " MEMBER@Example.com " }), context)).status, 201)
  assert.deepEqual(api.calls.find(({ method }) => method === "create").args.data, { projectId: "project", email: "member@example.com" })
  assert.equal((await api.DELETE(request({ email: "MEMBER@example.com" }), context)).status, 204)
  assert.deepEqual(api.calls.at(-1).args.where, { projectId: "project", email: { equals: "member@example.com", mode: "insensitive" } })
})

test("Clerk enrichment matches exact verified emails and falls back for missing users or service errors", async () => {
  const items = [{ id: "one", email: "member@example.com" }, { id: "two", email: "unknown@example.com" }]
  const { enrichCollaborators } = load("lib/collaborators.ts", {
    "@clerk/nextjs/server": { clerkClient: async () => ({ users: { getUserList: async () => ({
      totalCount: 1, data: [{ firstName: "Member", lastName: "Name", imageUrl: "https://example.com/avatar", emailAddresses: [
        { emailAddress: "MEMBER@example.com", verification: { status: "verified" } },
        { emailAddress: "unknown@example.com", verification: { status: "unverified" } },
      ] }],
    }) } }) },
  })
  assert.deepEqual(await enrichCollaborators(items), [
    { ...items[0], displayName: "Member Name", imageUrl: "https://example.com/avatar" }, items[1],
  ])
  const fallback = load("lib/collaborators.ts", { "@clerk/nextjs/server": { clerkClient: async () => { throw new Error("unavailable") } } })
  assert.deepEqual(await fallback.enrichCollaborators(items), items)
})

test("sharing dialog state loads member permissions and restricts mutations", async (t) => {
  for (const owner of [false, true]) {
    const values = []
    let cursor = 0
    let effect
    const calls = []
    const { useProjectSharing } = load("hooks/use-project-sharing.ts", {
      react: {
        useState: (initial) => {
          const index = cursor++
          if (!(index in values)) values[index] = initial
          return [values[index], (value) => { values[index] = value }]
        },
        useRef: (initial) => {
          const index = cursor++
          if (!(index in values)) values[index] = { current: initial }
          return values[index]
        },
        useCallback: (callback) => callback,
        useEffect: (callback) => { effect = callback },
      },
    })
    function useRender() { cursor = 0; return useProjectSharing("project") }
    t.mock.method(globalThis, "fetch", async (_url, options) => {
      calls.push(options?.method || "GET")
      return options?.method ? new Response(null, { status: 204 }) : Response.json({ collaborators: [], isOwner: owner })
    })
    useRender()
    const cleanup = effect()
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(useRender().isOwner, owner)
    assert.equal(useRender().isLoading, false)
    useRender().setEmail("member@example.com")
    await useRender().invite()
    await useRender().remove("member@example.com")
    assert.deepEqual(calls, owner ? ["GET", "POST", "GET", "DELETE", "GET"] : ["GET"])
    cleanup()
    t.mock.restoreAll()
  }
})
