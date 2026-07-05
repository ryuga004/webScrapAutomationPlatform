import { describe, it, expect } from "vitest";
import { NodeValidatorRegistry } from "./node-validator-registry";
import type { WorkflowNode } from "@/lib/workflow";

const node = (type: string, config: Record<string, unknown>): WorkflowNode => ({
  id: "n",
  type,
  position: { x: 0, y: 0 },
  config,
});

describe("NodeValidatorRegistry (schema-driven default)", () => {
  const reg = new NodeValidatorRegistry();

  it("passes a node whose required fields are filled", () => {
    expect(reg.validateNodes([node("goto", { url: "https://x.com" })])).toEqual([]);
  });

  it("flags a missing required text field", () => {
    const errors = reg.validateNodes([node("goto", {})]);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("URL");
  });

  it("flags a missing required locator field", () => {
    // forEach loop requires the "Items to loop over" locator.
    const errors = reg.validateNodes([node("loop", { mode: "forEach" })]);
    expect(errors.some((e) => e.includes("Items to loop over"))).toBe(true);
  });

  it("respects showIf — a hidden field is not required", () => {
    // In forEach mode the whileExists-only "Next page" locator must not be required.
    const errors = reg.validateNodes([
      node("loop", { mode: "forEach", locator: { by: "css", selector: ".row" } }),
    ]);
    expect(errors).toEqual([]);
  });

  it("enforces a field only when its showIf matches", () => {
    // whileExists mode requires the "Next page" button locator.
    const errors = reg.validateNodes([node("loop", { mode: "whileExists" })]);
    expect(errors.some((e) => e.includes("Next page"))).toBe(true);
  });

  it("reports unknown node types", () => {
    expect(reg.validateNodes([node("nonsense", {})])[0]).toContain("Unknown node type");
  });

  it("supports per-type override strategies (Open/Closed)", () => {
    const custom = new NodeValidatorRegistry();
    custom.register("note", {
      validate: (c) => (c.text ? [] : ["custom: text required"]),
    });
    expect(custom.validateNodes([node("note", {})])).toEqual(["custom: text required"]);
    expect(custom.validateNodes([node("note", { text: "hi" })])).toEqual([]);
  });
});
