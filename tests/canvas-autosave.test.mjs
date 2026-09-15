import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import ts from "typescript"

function load(file, dependencies = {}) {
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
const snapshots = load("lib/canvas-snapshot.ts", { "@/types/canvas": load("types/canvas.ts") })
const canvas = { nodes: [{ id: "n", type: "canvasNode", position: { x: 0, y: 0 }, data: { label: "A", shape: "rectangle", color: "#1F1F1F" } }], edges: [] }
const context = { params: Promise.resolve({ projectId: "project" }) }
function api({ identity = {}, accessible = true, path = "blob-url", fail = false } = {}) {
  const calls = []
  return { calls, ...load("app/api/projects/[projectId]/canvas/route.ts", {
    "@/lib/canvas-snapshot": snapshots,
    "@/lib/project-access": {
      getProjectIdentity: async () => identity,
      getAccessibleProject: async () => accessible ? { id: "project" } : null,
    },
    "@/lib/prisma": { prisma: { project: {
      findUnique: async () => ({ canvasJsonPath: path }),
      update: async (args) => calls.push(["update", args]),
    } } },
    "@vercel/blob": {
      put: async (...args) => { calls.push(["put", ...args]); if (fail) throw Error(); return { url: "saved-url" } },
      get: async (...args) => { calls.push(["get", ...args]); if (fail) throw Error(); return { statusCode: 200, stream: new Response(JSON.stringify(canvas)).body } },
    },
  }) }
}
const request = (value) => new Request("https://example.com", { method: "PUT", body: JSON.stringify(value) })
test("canvas routes reject anonymous and inaccessible projects before Blob access", async () => {
  for (const [options, status] of [[{ identity: null }, 401], [{ accessible: false }, 403]]) {
    const route = api(options)
    for (const method of ["GET", "PUT"]) assert.equal((await route[method](request(canvas), context)).status, status)
    assert.deepEqual(route.calls, [])
  }
})
test("save writes JSON privately and persists only its returned URL", async () => {
  const route = api()
  assert.equal((await route.PUT(request(canvas), context)).status, 200)
  assert.equal(route.calls[0][1], "canvas/project.json")
  assert.deepEqual(JSON.parse(route.calls[0][2]), canvas)
  assert.equal(route.calls[0][3].access, "private")
  assert.deepEqual(route.calls[1], ["update", { where: { id: "project" }, data: { canvasJsonPath: "saved-url" } }])
})
test("load handles absent snapshots and bypasses Blob cache for saved data", async () => {
  const absent = api({ path: null })
  assert.deepEqual(await (await absent.GET(null, context)).json(), { canvas: null })
  assert.deepEqual(absent.calls, [])
  const route = api()
  const response = await route.GET(null, context)
  assert.equal(response.headers.get("Cache-Control"), "no-store")
  assert.deepEqual(await response.json(), { canvas })
  assert.deepEqual(route.calls[0], ["get", "blob-url", { access: "private", useCache: false }])
})
test("invalid input and storage failures never report successful persistence", async () => {
  const route = api()
  assert.equal((await route.PUT(request({ nodes: [{}], edges: [] }), context)).status, 400)
  assert.deepEqual(route.calls, [])
  const failed = api({ fail: true })
  assert.equal((await failed.PUT(request(canvas), context)).status, 503)
  assert.equal((await failed.GET(null, context)).status, 503)
  assert.ok(!failed.calls.some(([name]) => name === "update"))
})
test("serialization preserves graph edits but ignores selection and measurement", () => {
  assert.equal(snapshots.serializeCanvas(canvas), snapshots.serializeCanvas({ ...canvas, nodes: [{ ...canvas.nodes[0], selected: true, dragging: true, measured: { width: 100 } }] }))
  assert.equal(snapshots.isCanvasSnapshot({ ...canvas, edges: [{ id: "e", source: "n", target: "missing" }] }), false)
})

function hookHarness(options) {
  const slots = [], effects = []
  let cursor = 0
  const react = {
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = initial
      return [slots[i], (next) => { slots[i] = typeof next === "function" ? next(slots[i]) : next }]
    },
    useRef(initial) {
      const i = cursor++
      return slots[i] ??= { current: initial }
    },
    useEffectEvent(fn) {
      const i = cursor++
      const slot = slots[i] ??= { fn, event: (...args) => slot.fn(...args) }
      slot.fn = fn
      return slot.event
    },
    useEffect(fn, deps) {
      const i = cursor++
      if (!slots[i] || deps.some((dep, j) => dep !== slots[i].deps[j])) {
        effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() } })
      }
    },
  }
  const { useCanvasAutosave } = load("hook/use-canvas-autosave.ts", { react, "@/lib/canvas-snapshot": snapshots })
  return {
    useRender(next = {}) { Object.assign(options, next); cursor = 0; useCanvasAutosave(options); effects.splice(0).forEach((fn) => fn()) },
    cleanup() { slots.forEach((slot) => slot?.cleanup?.()) },
  }
}
const settle = () => new Promise((resolve) => setImmediate(resolve))
test("nonempty rooms skip load; edits debounce to one latest save", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const calls = [], statuses = []
  t.mock.method(globalThis, "fetch", async (_url, options) => { calls.push(options); return Response.json({ saved: true }) })
  const hook = hookHarness({ projectId: "p", ...canvas, saveRequest: 0, onSaveStatus: (s) => statuses.push(s), hasContent: async () => true, restore: async () => assert.fail("must skip") })
  hook.useRender(); await settle(); hook.useRender()
  t.mock.timers.tick(2000); await settle()
  assert.equal(calls.length, 0)
  assert.ok(!statuses.includes("saving"))
  const changed = { nodes: [{ ...canvas.nodes[0], data: { ...canvas.nodes[0].data, label: "Latest" } }] }
  hook.useRender(changed)
  t.mock.timers.tick(999); await settle(); assert.equal(calls.length, 0)
  t.mock.timers.tick(1); await settle()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, "PUT")
  assert.equal(JSON.parse(calls[0].body).nodes[0].data.label, "Latest")
  assert.equal(statuses.at(-1), "saved")
  hook.cleanup()
})
test("failed loads block empty autosave and manual Save retries recovery", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  let fail = true
  const calls = [], statuses = []
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(options?.method ?? "GET")
    return fail ? new Response(null, { status: 503 }) : Response.json({ canvas })
  })
  let restored = null
  const hook = hookHarness({ projectId: "p", nodes: [], edges: [], saveRequest: 0, onSaveStatus: (s) => statuses.push(s), hasContent: async () => false, restore: async (value) => { restored = value; return true } })
  hook.useRender(); await settle(); hook.useRender(); t.mock.timers.tick(2000); await settle()
  assert.deepEqual(calls, ["GET"])
  assert.equal(statuses.at(-1), "error")
  fail = false
  hook.useRender({ saveRequest: 1 }); await settle()
  assert.deepEqual(restored, canvas)
  assert.deepEqual(calls, ["GET", "GET"])
  hook.cleanup()
})

test("restored snapshots establish the baseline without an automatic PUT", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] })
  const calls = [], statuses = []
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(options?.method ?? "GET")
    return Response.json({ canvas })
  })
  const hook = hookHarness({ projectId: "p", nodes: [], edges: [], saveRequest: 0,
    onSaveStatus: (s) => statuses.push(s), hasContent: async () => false, restore: async () => true })
  hook.useRender(); await settle(); hook.useRender(canvas)
  t.mock.timers.tick(2000); await settle()
  assert.deepEqual(calls, ["GET"])
  assert.ok(!statuses.includes("saving"))
  hook.useRender({ saveRequest: 1 })
  t.mock.timers.tick(1000); await settle()
  assert.deepEqual(calls, ["GET", "PUT"])
  assert.equal(statuses.at(-1), "saved")
  hook.cleanup()
})
