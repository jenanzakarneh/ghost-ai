import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"
import { z } from "zod"

function load(file, dependencies) {
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const loadedModule = { exports: {} }
  new Function("require", "module", "exports", source)((name) => {
    assert.ok(name in dependencies, name)
    return dependencies[name]
  }, loadedModule, loadedModule.exports)
  return loadedModule.exports
}
const schemas = load("types/tasks.ts", { zod: { z } })
const settle = () => new Promise((resolve) => setImmediate(resolve))
function harness({ send = async () => {} } = {}) {
  const slots = [], effects = [], messages = [], subscriptions = []
  let cursor = 0, realtime = {}
  const react = {
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = initial
      return [slots[i], (next) => { slots[i] = next }]
    },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useCallback(fn, deps) {
      const i = cursor++
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) slots[i] = { fn, deps }
      return slots[i].fn
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i][j])) {
        slots[i] = deps
        effects.push(fn)
      }
    },
  }
  const createMessage = async (feed, data) => { await send(data); messages.push({ feed, ...data }) }
  const { useAiDesignRun } = load("hooks/use-ai-design-run.ts", {
    react, zod: { z }, "@/types/tasks": schemas,
    "@liveblocks/react": {
      useRoom: () => ({ id: "room-1" }),
      useSelf: () => ({ id: "user-1", info: { name: "Alice" } }),
      useCreateFeedMessage: () => createMessage,
    },
    "@trigger.dev/react-hooks": {
      useRealtimeRun: (id, options) => { subscriptions.push({ id, ...options }); return realtime },
    },
  })
  return {
    messages, subscriptions,
    useRender(next = realtime) {
      realtime = next; cursor = 0
      const result = useAiDesignRun()
      effects.splice(0).forEach((fn) => fn())
      return result
    },
  }
}

test("publishes chat before the exact API request and subscribes with returned credentials", async (t) => {
  const h = harness()
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(h.messages.length, 1)
    assert.equal(h.messages[0].feed, "ai-chat")
    assert.equal(h.messages[0].role, "user")
    assert.equal(url, "/api/ai/design")
    assert.equal(options.method, "POST")
    assert.deepEqual(JSON.parse(options.body), { prompt: "Design a queue", roomId: "room-1" })
    return Response.json({ runId: "run-1", publicToken: "public-token" })
  })
  assert.equal(h.useRender().isRunning, false)
  assert.equal(h.subscriptions.at(-1).enabled, false)
  assert.equal(await h.useRender().submit("  Design a queue  "), true)
  assert.equal(h.useRender().isRunning, true)
  assert.equal(h.subscriptions.at(-1).accessToken, "public-token")
  assert.equal(h.subscriptions.at(-1).id, "run-1")
})

test("blocks duplicate submissions while sending and running", async (t) => {
  let release
  const h = harness({ send: () => new Promise((resolve) => { release = resolve }) })
  let calls = 0
  t.mock.method(globalThis, "fetch", async () => { calls++; return Response.json({ runId: "run-1", publicToken: "token" }) })
  const hook = h.useRender()
  const first = hook.submit("Build")
  assert.equal(await hook.submit("Duplicate"), false)
  assert.equal(h.useRender().isSubmitting, true)
  release(); await first
  assert.equal(await h.useRender().submit("Duplicate"), false)
  assert.equal(calls, 1)
})

test("completion publishes once and consecutive runs ignore stale cached results", async (t) => {
  const h = harness()
  let count = 0
  t.mock.method(globalThis, "fetch", async () => Response.json({ runId: `run-${++count}`, publicToken: "token" }))
  await h.useRender().submit("First")
  const completed = { run: { id: "run-1", isCompleted: true, isSuccess: true } }
  h.useRender(completed); h.useRender({ ...completed }); await settle()
  assert.equal(h.useRender().isRunning, false)
  assert.equal(h.messages.filter((m) => m.role === "assistant").length, 1)
  await h.useRender().submit("Second")
  assert.equal(h.useRender(completed).isRunning, true)
  h.useRender({ run: { id: "run-2", isCompleted: true, isSuccess: true } }); await settle()
  assert.equal(h.useRender().isRunning, false)
  assert.equal(h.messages.filter((m) => m.role === "assistant").length, 2)
})

test("failed and cancelled runs report shared failure and release the composer", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ runId: "run-1", publicToken: "token" }))
  for (const status of ["FAILED", "CANCELED", "TIMED_OUT", "CRASHED", "EXPIRED"]) {
    const h = harness()
    await h.useRender().submit("Build")
    h.useRender({ run: { id: "run-1", status, isCompleted: true, isSuccess: false } }); await settle()
    assert.equal(h.useRender().isRunning, false)
    assert.match(h.messages.at(-1).content, /did not complete successfully/)
  }
})

test("HTTP errors, malformed credentials, and transport failures become shared chat notices", async (t) => {
  for (const response of [() => new Response(null, { status: 400 }), () => Response.json({ runId: "run-1" }), () => { throw Error("offline") }]) {
    const h = harness()
    t.mock.method(globalThis, "fetch", async () => response())
    assert.equal(await h.useRender().submit("Build"), true)
    assert.equal(h.useRender().isRunning, false)
    assert.equal(h.useRender().isSubmitting, false)
    assert.equal(h.messages.at(-1).role, "assistant")
  }
})

test("failed user delivery prevents triggering and retains the draft; failed notices have local fallback", async (t) => {
  const h = harness({ send: async () => { throw Error("offline") } })
  t.mock.method(globalThis, "fetch", () => assert.fail("must not trigger"))
  assert.equal(await h.useRender().submit("Build"), false)
  assert.match(h.useRender().deliveryError, /could not be shared/)
  assert.equal(h.useRender().isSubmitting, false)
})

test("subscription errors report tracking loss without claiming task failure", async (t) => {
  const h = harness()
  t.mock.method(globalThis, "fetch", async () => Response.json({ runId: "run-1", publicToken: "token" }))
  await h.useRender().submit("Build")
  h.useRender({ error: Error("disconnected") }); await settle()
  assert.equal(h.useRender().isRunning, false)
  assert.match(h.messages.at(-1).content, /may still be running/)
})
