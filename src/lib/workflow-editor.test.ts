import { describe, it, expect } from "vitest";
import type { Edge, Node } from "@xyflow/react";
import {
  makeNode,
  nextNodePosition,
  seedNodes,
  serializeWorkflow,
  toEditorEdges,
  toEditorNodes,
} from "./workflow-editor";

describe("nextNodePosition", () => {
  it("seeds the first node at a fixed origin", () => {
    expect(nextNodePosition([])).toEqual({ x: 80, y: 120 });
  });

  it("places the next node to the right of the rightmost one", () => {
    const nodes = [
      makeNode("start", {}, { x: 80, y: 120 }),
      makeNode("click", {}, { x: 400, y: 300 }),
    ];
    expect(nextNodePosition(nodes)).toEqual({ x: 660, y: 300 });
  });
});

describe("seedNodes", () => {
  it("creates a single Start node", () => {
    const nodes = seedNodes();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].data).toMatchObject({ nodeType: "start", config: {} });
  });
});

describe("toEditorNodes / toEditorEdges", () => {
  it("maps API nodes into webbot nodes", () => {
    const [node] = toEditorNodes([
      { id: "n1", type: "click", position: { x: 1, y: 2 }, config: { a: 1 } },
    ]);
    expect(node).toMatchObject({
      id: "n1",
      type: "webbot",
      position: { x: 1, y: 2 },
      data: { nodeType: "click", config: { a: 1 } },
    });
  });

  it("applies shared edge options to every edge", () => {
    const [edge] = toEditorEdges([{ id: "e1", source: "n1", target: "n2" }]);
    expect(edge).toMatchObject({ id: "e1", source: "n1", target: "n2", type: "deletable" });
  });
});

describe("serializeWorkflow", () => {
  it("flattens node data and normalizes edge handles", () => {
    const nodes: Node[] = [makeNode("start", { x: 1 }, { x: 80, y: 120 })];
    const edges: Edge[] = [{ id: "e1", source: "a", target: "b" }];
    const payload = serializeWorkflow("My flow", { x: 0, y: 0, zoom: 1 }, nodes, edges);

    expect(payload.name).toBe("My flow");
    expect(payload.nodes[0]).toMatchObject({ type: "start", config: { x: 1 } });
    expect(payload.edges[0]).toEqual({
      id: "e1",
      source: "a",
      target: "b",
      sourceHandle: null,
      targetHandle: null,
    });
  });
});
