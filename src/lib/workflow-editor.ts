import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { WebbotNodeData } from "@/components/workflow/NodeCard";

/** MIME type used to carry a node type through an HTML5 drag from the palette. */
export const DRAG_MIME = "application/webbot-node";

/** Shared visual options applied to every edge on the canvas. */
export const EDGE_OPTIONS = {
  type: "deletable",
  style: { stroke: "#22d3ee", strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: "#22d3ee" },
} as const;

let idSeq = 1;

/** Monotonic, collision-resistant id for a freshly created node. */
export function newNodeId(): string {
  return `n${Date.now()}_${idSeq++}`;
}

/** A single Start node to seed a brand-new, empty workflow. */
export function seedNodes(): Node[] {
  return [
    {
      id: newNodeId(),
      type: "webbot",
      position: { x: 80, y: 120 },
      data: { nodeType: "start", config: {} } satisfies WebbotNodeData,
    },
  ];
}

/** Position for a click-added node: to the right of the rightmost existing one. */
export function nextNodePosition(nodes: Node[]): { x: number; y: number } {
  if (nodes.length === 0) return { x: 80, y: 120 };
  const rightmost = nodes.reduce(
    (acc, n) => (n.position.x > acc.x ? { x: n.position.x, y: n.position.y } : acc),
    { x: 0, y: 120 },
  );
  return { x: rightmost.x + 260, y: rightmost.y };
}

/** Build a canvas node from a type + config at a given position. */
export function makeNode(
  nodeType: string,
  config: Record<string, unknown>,
  position: { x: number; y: number },
): Node {
  return {
    id: newNodeId(),
    type: "webbot",
    position,
    data: { nodeType, config } satisfies WebbotNodeData,
  };
}

interface RawNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

interface RawEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

/** Map an API workflow's nodes into React Flow nodes. */
export function toEditorNodes(raw: RawNode[]): Node[] {
  return raw.map((n) => ({
    id: n.id,
    type: "webbot",
    position: n.position,
    data: { nodeType: n.type, config: n.config } satisfies WebbotNodeData,
  }));
}

/** Map an API workflow's edges into styled React Flow edges. */
export function toEditorEdges(raw: RawEdge[]): Edge[] {
  return raw.map((e) => ({ ...e, ...EDGE_OPTIONS }));
}

/** Serialize the current canvas into the API save payload. */
export function serializeWorkflow(
  name: string,
  viewport: { x: number; y: number; zoom: number },
  nodes: Node[],
  edges: Edge[],
) {
  return {
    name,
    viewport,
    nodes: nodes.map((n) => {
      const d = n.data as WebbotNodeData;
      return { id: n.id, type: d.nodeType, position: n.position, config: d.config };
    }),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
  };
}
