import { type DragEvent, useMemo } from "react";
import {
  Background,
  Controls,
  ReactFlow,
  type ReactFlowProps,
} from "@xyflow/react";
import { NodeCard } from "@/components/workflow/NodeCard";
import { DeletableEdge } from "@/components/workflow/DeletableEdge";
import { EDGE_OPTIONS } from "@/lib/workflow-editor";

type FlowHandlers = Pick<
  ReactFlowProps,
  | "nodes"
  | "edges"
  | "onNodesChange"
  | "onEdgesChange"
  | "onConnect"
  | "onReconnectStart"
  | "onReconnect"
  | "onReconnectEnd"
  | "onNodeDoubleClick"
>;

interface EditorCanvasProps extends FlowHandlers {
  loading: boolean;
  isEmpty: boolean;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
}

export function EditorCanvas({
  loading,
  isEmpty,
  onDrop,
  onDragOver,
  ...flow
}: EditorCanvasProps) {
  const nodeTypes = useMemo(() => ({ webbot: NodeCard }), []);
  const edgeTypes = useMemo(() => ({ deletable: DeletableEdge }), []);

  return (
    <div className="neu-base relative flex-1" onDrop={onDrop} onDragOver={onDragOver}>
      {loading ? (
        <div className="flex h-full items-center justify-center text-on-surface-variant">
          Loading…
        </div>
      ) : (
        <ReactFlow
          {...flow}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={EDGE_OPTIONS}
          fitView
          fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={28} size={1.4} color="#c3cbe6" />
          <Controls className="!rounded-2xl !border-none neu-raised-sm" />
        </ReactFlow>
      )}

      {!loading && isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="neu-raised px-5 py-2.5 text-sm text-on-surface-variant">
            Drag a node from the palette, or click one to add it →
          </p>
        </div>
      )}
    </div>
  );
}
