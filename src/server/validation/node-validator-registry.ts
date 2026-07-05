import { getNodeType, type FieldDef, type LocatorValue } from "@/lib/nodes";
import type { WorkflowNode } from "@/lib/workflow";

// Strategy + Registry.
//
// Each node type can have its own validation strategy (a NodeValidator). The
// registry resolves a validator by node type, falling back to a schema-driven
// default that reads the node's declared `fields` from the node registry
// (src/lib/nodes.ts) and enforces `required` for currently-visible fields.
//
// Adding stricter rules for one node type = register a NodeValidator for it;
// the engine and other nodes are untouched (Open/Closed).

export interface NodeValidator {
  /** Return a list of human-readable problems; empty means valid. */
  validate(config: Record<string, unknown>): string[];
}

function isEmpty(field: FieldDef, value: unknown): boolean {
  if (value == null) return true;
  if (field.kind === "locator") return !(value as LocatorValue)?.selector;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

/** Default: enforce `required` on every field whose `showIf` currently passes. */
function schemaValidator(type: string): NodeValidator {
  return {
    validate(config) {
      const def = getNodeType(type);
      if (!def) return [`Unknown node type "${type}"`];
      const errors: string[] = [];
      for (const f of def.fields) {
        if (f.showIf && !f.showIf(config)) continue;
        if (f.required && isEmpty(f, config[f.name])) {
          errors.push(`${def.label}: "${f.label}" is required`);
        }
      }
      return errors;
    },
  };
}

export class NodeValidatorRegistry {
  private readonly overrides = new Map<string, NodeValidator>();

  register(type: string, validator: NodeValidator): this {
    this.overrides.set(type, validator);
    return this;
  }

  resolve(type: string): NodeValidator {
    return this.overrides.get(type) ?? schemaValidator(type);
  }

  /** Validate every node in a workflow; returns all collected errors. */
  validateNodes(nodes: WorkflowNode[]): string[] {
    return nodes.flatMap((n) => this.resolve(n.type).validate(n.config));
  }
}

// Composition of the default registry. Register per-type overrides here.
export const nodeValidatorRegistry = new NodeValidatorRegistry();
