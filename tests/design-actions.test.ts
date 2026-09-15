import { test } from "node:test"
import assert from "node:assert/strict"
import { LiveObject } from "@liveblocks/client"
import { mutateFlow } from "@liveblocks/react-flow/node"
import { applyAction, parseAction } from "../lib/design-agent/actions"
import type { CanvasNode, CanvasEdge } from "../types/canvas"

test("all seven actions use the real collaborative flow utility and preserve unrelated content", async () => {
  const root = new LiveObject({})
  const client = { mutateStorage: async (_: string, callback: Parameters<typeof mutateFlow>[0]["client"]["mutateStorage"] extends (id: string, cb: infer C) => unknown ? C : never) => { await callback({ root }) } }
  await mutateFlow<CanvasNode, CanvasEdge>({ client, roomId: "test" }, flow => {
    const add = (id: string, x: number) => applyAction(flow, { action: "addNode", id, x, y: 0, shape: "rectangle", color: "#1F1F1F", label: id })
    add("a", 1); add("b", 400); add("untouched", 1000)
    assert.equal(flow.getNode("a")!.position.x, 0)
    applyAction(flow, { action: "moveNode", id: "a", x: 20, y: 200 })
    applyAction(flow, { action: "resizeNode", id: "a", width: 200, height: 120 })
    applyAction(flow, { action: "updateNodeData", id: "a", label: "Service", color: "#10233D" })
    assert.equal(flow.getNode("a")!.data.shape, "rectangle")
    assert.equal(flow.getNode("a")!.data.label, "Service")
    assert.equal(flow.getNode("a")!.width, 200)
    applyAction(flow, { action: "addEdge", id: "e", source: "a", target: "b" })
    applyAction(flow, { action: "deleteEdge", id: "e" })
    assert.equal(flow.edges.length, 0)
    applyAction(flow, { action: "addEdge", id: "e2", source: "a", target: "b" })
    applyAction(flow, { action: "deleteNode", id: "a" })
    assert.equal(flow.edges.length, 0)
    assert.equal(flow.getNode("untouched")!.position.x, 1000)
    assert.throws(() => add("b", 800), /already exists/)
    assert.throws(() => add("overlap", 420), /60px/)
    assert.throws(() => applyAction(flow, { action: "addEdge", id: "bad", source: "missing", target: "b" }), /endpoints/)
    assert.throws(() => applyAction(flow, { action: "moveNode", id: "missing", x: 0, y: 0 }), /no longer exists/)
    assert.equal(flow.nodes.length, 2)
  })
})

test("rejects malformed model actions before mutation", () => {
  for (const input of [null, {}, { action: "wipe", id: "x" }, { action: "moveNode", id: "x", x: Infinity, y: 0 }, { action: "resizeNode", id: "x", width: 1, height: 1 }, { action: "updateNodeData", id: "x", shape: "triangle" }, { action: "updateNodeData", id: "x", color: "red" }, { action: "addEdge", id: "x" }]) assert.throws(() => parseAction(input))
})
