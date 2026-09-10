import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
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
