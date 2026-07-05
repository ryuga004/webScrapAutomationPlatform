import { describe, it, expect } from "vitest";
import { parseWorkflowInput, ValidationError } from "./validate-workflow";

const base = {
  name: "Test",
  nodes: [{ id: "n1", type: "start", position: { x: 1, y: 2 }, config: {} }],
  edges: [],
};

describe("parseWorkflowInput", () => {
  it("accepts a valid workflow", () => {
    const out = parseWorkflowInput(base);
    expect(out.name).toBe("Test");
    expect(out.nodes[0]).toMatchObject({ id: "n1", type: "start" });
  });

  it("rejects a non-object body", () => {
    expect(() => parseWorkflowInput(null)).toThrow(ValidationError);
    expect(() => parseWorkflowInput("nope")).toThrow(ValidationError);
  });

  it("requires a name", () => {
    expect(() => parseWorkflowInput({ ...base, name: "   " })).toThrow(ValidationError);
  });

  it("rejects unknown node types", () => {
    expect(() =>
      parseWorkflowInput({
        ...base,
        nodes: [{ id: "n1", type: "bogus", position: { x: 0, y: 0 }, config: {} }],
      }),
    ).toThrow(ValidationError);
  });

  it("requires edge source and target", () => {
    expect(() =>
      parseWorkflowInput({
        ...base,
        edges: [{ id: "e1", source: "n1" }],
      }),
    ).toThrow(ValidationError);
  });

  it("generates ids and coerces positions when missing", () => {
    const out = parseWorkflowInput({
      name: "T",
      nodes: [{ type: "start", config: {} }],
      edges: [],
    });
    expect(out.nodes[0].id).toBeTruthy();
    expect(out.nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it("parses a viewport when present", () => {
    const out = parseWorkflowInput({ ...base, viewport: { x: 10, y: 20, zoom: 2 } });
    expect(out.viewport).toEqual({ x: 10, y: 20, zoom: 2 });
  });
});
