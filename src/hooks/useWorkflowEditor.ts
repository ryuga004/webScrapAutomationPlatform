"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useParams, useRouter } from "next/navigation";
import {
  addEdge,
  reconnectEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { useAuth } from "@/components/AuthProvider";
import type { WebbotNodeData } from "@/components/workflow/NodeCard";
import { getNodeType } from "@/lib/nodes";
import { defaultConfig } from "@/lib/node-format";
import {
  DRAG_MIME,
  EDGE_OPTIONS,
  makeNode,
  nextNodePosition,
  seedNodes,
  serializeWorkflow,
  toEditorEdges,
  toEditorNodes,
} from "@/lib/workflow-editor";

export type ModalState =
  | { mode: "add"; nodeType: string; config: Record<string, unknown> }
  | {
      mode: "edit";
      nodeId: string;
      nodeType: string;
      config: Record<string, unknown>;
    };

/** All state and behaviour for the workflow editor canvas. */
export function useWorkflowEditor() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const isNew = id === "new";

  const [name, setName] = useState("Untitled workflow");
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const rf = useReactFlow();
  const { authFetch } = useAuth();

  // Tracks whether an in-progress edge reconnect landed on a valid handle.
  const reconnectOk = useRef(true);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  // Load an existing workflow, or seed a blank one with a Start node.
  useEffect(() => {
    if (isNew) {
      setNodes(seedNodes());
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await authFetch(`/api/workflows/${id}`);
      if (!res.ok) {
        if (!cancelled) {
          setLoading(false);
          setToast("Workflow not found");
        }
        return;
      }
      const { workflow } = await res.json();
      if (cancelled) return;
      setName(workflow.name);
      setNodes(toEditorNodes(workflow.nodes));
      setEdges(toEditorEdges(workflow.edges));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, setNodes, setEdges, authFetch]);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, ...EDGE_OPTIONS }, eds)),
    [setEdges],
  );

  // Drag an edge's endpoint off a handle to disconnect it. If it lands on
  // another handle we rewire it; if it's dropped in empty space we remove it.
  const onReconnectStart = useCallback(() => {
    reconnectOk.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      reconnectOk.current = true;
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds));
    },
    [setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!reconnectOk.current) {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [setEdges],
  );

  // Click a palette node → configure it in a modal before it lands on the canvas.
  const handleAdd = useCallback((type: string) => {
    const def = getNodeType(type);
    if (!def) return;
    setModal({ mode: "add", nodeType: type, config: defaultConfig(def) });
  }, []);

  // Drag a palette node → drop it straight onto the canvas at the cursor.
  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData(DRAG_MIME);
      const def = type ? getNodeType(type) : undefined;
      if (!def) return;
      const position = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setNodes((nds) => [...nds, makeNode(type, defaultConfig(def), position)]);
    },
    [rf, setNodes],
  );

  const onNodeDoubleClick = useCallback((_: unknown, node: Node) => {
    const d = node.data as WebbotNodeData;
    setModal({
      mode: "edit",
      nodeId: node.id,
      nodeType: d.nodeType,
      config: d.config,
    });
  }, []);

  const handleModalSave = useCallback(
    (config: Record<string, unknown>) => {
      if (!modal) return;
      if (modal.mode === "edit") {
        setNodes((nds) =>
          nds.map((n) =>
            n.id === modal.nodeId
              ? { ...n, data: { ...(n.data as WebbotNodeData), config } }
              : n,
          ),
        );
      } else {
        setNodes((nds) => [
          ...nds,
          makeNode(modal.nodeType, config, nextNodePosition(nds)),
        ]);
      }
      setModal(null);
    },
    [modal, setNodes],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = serializeWorkflow(name, rf.getViewport(), nodes, edges);
      const res = await authFetch(isNew ? "/api/workflows" : `/api/workflows/${id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        flash(data.error ?? "Save failed");
        return;
      }
      if (isNew) router.replace(`/workflows/${data.workflow.id}`);
      else flash("Saved");
    } finally {
      setSaving(false);
    }
  }, [name, nodes, edges, rf, isNew, id, router, authFetch, flash]);

  const isEmpty = useMemo(() => nodes.length <= 1, [nodes.length]);

  return {
    name,
    setName,
    nodes,
    edges,
    modal,
    loading,
    saving,
    toast,
    isEmpty,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
    onNodeDoubleClick,
    onDragOver,
    onDrop,
    handleAdd,
    handleModalSave,
    handleSave,
    closeModal: () => setModal(null),
  };
}
