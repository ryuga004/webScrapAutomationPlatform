"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEdges((eds) => eds.filter((edge) => edge.id !== id));
          }}
          title="Remove connection"
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
          className={`nodrag nopan flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant bg-surface text-on-surface-variant shadow transition-opacity hover:border-rose-400 hover:text-rose-600 ${
            selected ? "opacity-100" : "opacity-0 hover:opacity-100"
          }`}
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </EdgeLabelRenderer>
    </>
  );
}
