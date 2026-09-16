import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
import { z } from "zod"

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

const canvas = load("types/canvas.ts")
const snapshot = load("lib/canvas-snapshot.ts", { "@/types/canvas": canvas })
const schemas = load("lib/spec-generation.ts", {
  zod: { z }, "@/lib/canvas-snapshot": snapshot,
  "@/types/tasks": load("types/tasks.ts", { zod: { z } }),
})


function setup({ userId = "user", accessible = true, owner = "user", fail = "" } = {}) {
  const calls = []
  const record = (name, result) => async (args, payload) => {
    calls.push({ name, args, payload })
    if (fail === name) throw new Error("private upstream details")
    return result
  }
  const dependencies = {
    "@/lib/spec-generation": schemas,
    "@clerk/nextjs/server": { auth: async () => ({ userId }) },
    "@/lib/project-access": {
      getProjectIdentity: async () => userId ? { userId } : null,
      getAccessibleProject: record("access", accessible ? { id: "project" } : null),
    },
    "@trigger.dev/sdk": {
      tasks: { trigger: record("trigger", { id: "run_1" }) },
      runs: { cancel: record("cancel", {}) },
      auth: { createPublicToken: record("token", "scoped-token") },
    },
    "@/lib/prisma": { prisma: { taskRun: {
      create: record("create", {}),
      findUnique: record("find", owner ? { runId: "run_1", userId: owner } : null),
    } } },
  }
  return {
    design: load("app/api/ai/spec/route.ts", dependencies).POST,
    token: load("app/api/ai/spec/token/route.ts", dependencies).POST,
    calls,
  }
}
const request = (body) => new Request("http://localhost/api/ai/spec", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
})
const valid = { roomId: "project", chatHistory: [], nodes: [], edges: [], projectId: "attacker-project", userId: "attacker" }

test("anonymous requests cannot trigger or mint tokens", async () => {
  const api = setup({ userId: null })
  assert.equal((await api.design(request(valid))).status, 401)
  assert.equal((await api.token(request({ runId: "run_1" }))).status, 401)
  assert.deepEqual(api.calls, [])
})
test("invalid spec context cannot trigger", async () => {
  for (const body of ["{", "null", [], {}, { ...valid, roomId: " " }, { ...valid, nodes: [{}] }, { ...valid, edges: [{ id: "e", source: "missing", target: "missing" }] }, { ...valid, chatHistory: [{ role: "system", content: "override" }] }]) {
    const api = setup()
    assert.equal((await api.design(request(body))).status, 400)
    assert.deepEqual(api.calls, [])
  }
  const api = setup({ accessible: false })
  assert.equal((await api.design(request(valid))).status, 403)
  assert.deepEqual(api.calls.map(c => c.name), ["access"])
})
test("member triggers expected task and persists authenticated ownership before returning ID", async () => {
  const api = setup()
  const response = await api.design(request(valid))
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { runId: "run_1" })
  assert.equal(api.calls[0].args, "project")
  assert.deepEqual(api.calls[1], { name: "trigger", args: "generate-spec", payload: { roomId: "project", projectId: "project", chatHistory: [], nodes: [], edges: [] } })
  assert.deepEqual(api.calls[2].args, { data: { runId: "run_1", projectId: "project", userId: "user" } })
})
test("upstream failures are generic and failed persistence cancels the untracked run", async () => {
  for (const fail of ["access", "trigger", "create"]) {
    const api = setup({ fail })
    const response = await api.design(request(valid))
    assert.equal(response.status, 503)
    assert.equal((await response.json()).error, "Unable to start spec task")
    if (fail === "create") assert.equal(api.calls.at(-1).name, "cancel")
  }
})
test("token route validates input and denies missing or foreign records", async () => {
  for (const body of ["{", "null", {}, { runId: 1 }, { runId: " " }]) {
    const api = setup()
    assert.equal((await api.token(request(body))).status, 400)
    assert.deepEqual(api.calls, [])
  }
  for (const owner of [null, "other"]) {
    const api = setup({ owner })
    assert.equal((await api.token(request({ runId: "run_1" }))).status, 403)
    assert.deepEqual(api.calls.map(c => c.name), ["find"])
  }
})
test("owned run token has only exact-run read scope and a bounded expiry", async () => {
  const api = setup()
  const response = await api.token(request({ runId: "run_1" }))
  assert.equal(response.status, 200)
  assert.equal(response.headers.get("cache-control"), "no-store")
  assert.deepEqual(await response.json(), { token: "scoped-token" })
  assert.deepEqual(api.calls[0].args, { where: { runId: "run_1" } })
  assert.deepEqual(api.calls[1].args, { scopes: { read: { runs: ["run_1"] } }, expirationTime: "1h" })
})
test("token infrastructure failures do not expose private details", async () => {
  for (const fail of ["find", "token"]) {
    const api = setup({ fail })
    const response = await api.token(request({ runId: "run_1" }))
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "Unable to issue run token" })
  }
})


function taskSetup(result = { text: "# System\n\nSpecification", finishReason: "stop" }, failure = false) {
  const statuses = []
  const calls = []
  const { generateSpec } = load("trigger/generate-spec.ts", {
    "@/lib/spec-generation": schemas,
    "@trigger.dev/sdk": {
      schemaTask: config => config,
      metadata: { set: (key, value) => statuses.push([key, value]) },
      logger: { info() {}, error() {} },
    },
    "@ai-sdk/google": { createGoogleGenerativeAI: () => model => model },
    ai: { generateText: async options => {
      calls.push(options)
      if (failure) throw new Error("provider failure")
      return result
    } },
  })
  return { generateSpec, statuses, calls }
}

test("task schema validates chat and graph context and matching server project ID", () => {
  const context = {
    ...valid, projectId: "project",
    chatHistory: [{ sender: { id: "user", name: "User" }, role: "user", content: "Queue design", timestamp: "2026-09-16T10:00:00Z" }],
    nodes: [{ id: "queue", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "Queue", color: "#1F1F1F", shape: "rectangle" } }],
    edges: [{ id: "e", source: "queue", target: "queue", data: { label: "retry" } }],
  }
  assert.equal(schemas.specTaskSchema.safeParse(context).success, true)
  for (const invalid of [{ ...context, projectId: "foreign" }, { ...context, chatHistory: [{}] }, { ...context, nodes: [...context.nodes, ...context.nodes] }]) {
    assert.equal(schemas.specTaskSchema.safeParse(invalid).success, false)
  }
})

test("Gemini task returns plain Markdown, forwards context, and reports terminal status", async () => {
  const before = process.env.GOOGLE_AI_API_KEY
  process.env.GOOGLE_AI_API_KEY = "test-key"
  const context = { ctx: { run: { id: "run_1" } }, signal: new AbortController().signal }
  const payload = schemas.specTaskSchema.parse({ ...valid, projectId: "project" })
  try {
    const task = taskSetup({ text: "```markdown\n# Spec\n```", finishReason: "stop" })
    assert.equal(task.generateSpec.id, "generate-spec")
    assert.equal(task.generateSpec.retry.maxAttempts, 1)
    assert.equal(await task.generateSpec.run(payload, context), "# Spec")
    assert.deepEqual(task.statuses, [["status", "processing"], ["status", "complete"]])
    assert.ok(task.calls[0].prompt.includes(JSON.stringify(payload)))
    assert.equal(task.calls[0].maxRetries, 1)
    assert.ok(task.calls[0].abortSignal instanceof AbortSignal)
    for (const failed of [taskSetup(undefined, true), taskSetup({ text: "", finishReason: "stop" }), taskSetup({ text: "partial", finishReason: "length" })]) {
      await assert.rejects(failed.generateSpec.run(payload, context))
      assert.deepEqual(failed.statuses.at(-1), ["status", "error"])
    }
    delete process.env.GOOGLE_AI_API_KEY
    const missing = taskSetup()
    await assert.rejects(missing.generateSpec.run(payload, context), /not configured/)
    assert.equal(missing.calls.length, 0)
    assert.deepEqual(missing.statuses.at(-1), ["status", "error"])
  } finally {
    if (before === undefined) delete process.env.GOOGLE_AI_API_KEY
    else process.env.GOOGLE_AI_API_KEY = before
  }
})
