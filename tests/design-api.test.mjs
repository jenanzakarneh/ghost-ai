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


function setup({ userId = "user", accessible = true, owner = "user", fail = "" } = {}) {
  const calls = []
  const record = (name, result) => async (args, payload) => {
    calls.push({ name, args, payload })
    if (fail === name) throw new Error("private upstream details")
    return result
  }
  const dependencies = {
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
    design: load("app/api/ai/design/route.ts", dependencies).POST,
    token: load("app/api/ai/design/token/route.ts", dependencies).POST,
    calls,
  }
}
const request = (body) => new Request("http://localhost/api/ai/design", {
  method: "POST", body: typeof body === "string" ? body : JSON.stringify(body),
})
const valid = { prompt: "Design a queue", roomId: "project", projectId: "project", userId: "attacker" }

test("anonymous requests cannot trigger or mint tokens", async () => {
  const api = setup({ userId: null })
  assert.equal((await api.design(request(valid))).status, 401)
  assert.equal((await api.token(request({ runId: "run_1" }))).status, 401)
  assert.deepEqual(api.calls, [])
})
test("invalid design inputs and mismatched rooms cannot trigger", async () => {
  for (const body of ["{", "null", [], {}, { ...valid, prompt: " " }, { ...valid, roomId: "other" }]) {
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
  assert.deepEqual(api.calls[1], { name: "trigger", args: "design-agent", payload: { prompt: valid.prompt, roomId: "project" } })
  assert.deepEqual(api.calls[2].args, { data: { runId: "run_1", projectId: "project", userId: "user" } })
})
test("upstream failures are generic and failed persistence cancels the untracked run", async () => {
  for (const fail of ["access", "trigger", "create"]) {
    const api = setup({ fail })
    const response = await api.design(request(valid))
    assert.equal(response.status, 503)
    assert.equal((await response.json()).error, "Unable to start design task")
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
  assert.deepEqual(api.calls[1].args, { scopes: { read: { runs: ["run_1"] } }, expirationTime: "15m" })
})
test("token infrastructure failures do not expose private details", async () => {
  for (const fail of ["find", "token"]) {
    const api = setup({ fail })
    const response = await api.token(request({ runId: "run_1" }))
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { error: "Unable to issue run token" })
  }
})

function agentSetup(fail = "") {
  const calls = []
  class LiveblocksError extends Error { status = 409 }
  class DesignActionError extends Error {}
  const client = {
    createFeed: async () => { if (fail === "existing") throw new LiveblocksError() },
    createFeedMessage: async ({ data }) => { calls.push(data.phase) },
    setPresence: async (_room, { data }) => { calls.push(data) },
  }
  const { designAgent } = load("trigger/design-agent.ts", {
    "@trigger.dev/sdk": { task: config => config, logger: { warn() {} } },
    "@liveblocks/node": { LiveblocksError },
    "@/lib/liveblocks": { getLiveblocks: () => client },
    "@liveblocks/react-flow/node": { mutateFlow: async (_options, cb) => cb({ toJSON: () => ({ nodes: [], edges: [] }) }) },
    "@/lib/design-agent/actions": { DesignActionError, actionSchema: {}, applyAction: () => { if (fail === "action") throw new DesignActionError("invalid"); if (fail === "storage") throw new Error("network"); return { x: 100, y: 200 } } },
    "@/types/canvas": { NODE_COLORS: [{}, {}, { textColor: "purple" }], NODE_SHAPES: [] },
    "@/lib/shape-drag": { SHAPE_SIZES: {} },
    "@ai-sdk/google": { createGoogleGenerativeAI: () => () => "gemini" },
    ai: { jsonSchema: x => x, tool: x => x, stepCountIs: () => {}, generateText: async ({ tools }) => {
      if (fail === "generation") throw new Error("provider failure")
      await tools.applyAction.execute({ id: "x", action: "addNode" })
      return { finishReason: fail === "limit" ? "tool-calls" : "stop" }
    } },
  })
  return { designAgent, calls }
}

test("design task publishes progress, handles existing feeds, and clears presence", async () => {
  const before = process.env.GOOGLE_AI_API_KEY
  process.env.GOOGLE_AI_API_KEY = "mock-key"
  try {
    for (const fail of ["", "existing", "generation", "action", "storage", "limit"]) {
      const { designAgent, calls } = agentSetup(fail)
      assert.equal(designAgent.retry.maxAttempts, 1)
      const run = designAgent.run({ prompt: "queue", roomId: "project" }, { ctx: { run: { id: "run_1" } }, signal: new AbortController().signal })
      if (["generation", "action", "storage", "limit"].includes(fail)) {
        await assert.rejects(run)
        assert.ok(calls.includes("error"))
        assert.ok(!calls.includes("complete"))
      } else {
        assert.deepEqual(await run, { roomId: "project", applied: 1 })
        assert.ok(calls.includes("complete"))
      }
      assert.ok(calls.includes("start"))
      assert.ok(calls.includes("processing"))
      assert.deepEqual(calls.at(-1), { cursor: null, thinking: false })
    }
  } finally {
    if (before === undefined) delete process.env.GOOGLE_AI_API_KEY
    else process.env.GOOGLE_AI_API_KEY = before
  }
})
