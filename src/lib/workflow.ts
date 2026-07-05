// A workflow is a graph: atomic nodes connected by edges. Each node carries the
// config it was given in the add/edit modal, keyed by the field names its type
// declares in the node registry (src/lib/nodes.ts).
//
// This module is types-only and safe to import from client components. All
// persistence lives behind the repositories in src/server.

export interface WorkflowNode {
  id: string;
  type: string; // matches a NodeTypeDef.type
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  sourceHandle?: string | null;
  target: string;
  targetHandle?: string | null;
}

export interface NodeRunResult {
  nodeId: string;
  type: string;
  label: string;
  ok: boolean;
  message?: string;
  errorType?: string;
  detail?: string;
  durationMs: number;
  screenshot?: string;
  iteration?: number; // set for nodes run inside a loop
}

export interface WorkflowRunResult {
  ok: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  nodes: NodeRunResult[];
  /** Named datasets collected during the run (for CSV preview/export). */
  datasets?: Record<string, Record<string, string>[]>;
  /** URLs of exported CSV files, keyed by dataset name. */
  csv?: Record<string, string>;
  /** URLs of exported .txt files, keyed by file name. */
  txt?: Record<string, string>;
  /** Text file contents, keyed by file name (for preview). */
  texts?: Record<string, string>;
  error?: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
  lastRun?: WorkflowRunResult;
}

export interface WorkflowInput {
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}
