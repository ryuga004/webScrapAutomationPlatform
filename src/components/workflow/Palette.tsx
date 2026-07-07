"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Search } from "lucide-react";
import { nodesByCategory } from "@/lib/nodes";
import { CAT_CLASSES } from "@/lib/node-ui";
import { DRAG_MIME } from "@/lib/workflow-editor";
import { NodeIcon } from "./NodeIcon";

export function Palette({ onAdd }: { onAdd: (type: string) => void }) {
  const [query, setQuery] = useState("");
  const groups = useMemo(() => nodesByCategory(), []);
  const q = query.trim().toLowerCase();

  const onDragStart = (e: DragEvent, type: string) => {
    e.dataTransfer.setData(DRAG_MIME, type);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="neu-base z-40 flex h-full w-[248px] flex-col p-3">
      <div className="neu-raised-sm mb-3 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant">
            Node Palette
          </span>
          <Search size={16} className="text-on-surface-variant" />
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search nodes…"
          className="neu-pressed w-full px-3 py-1.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {groups.map(({ category, nodes }) => {
          const cat = CAT_CLASSES[category.key];
          const filtered = q
            ? nodes.filter(
                (n) =>
                  n.label.toLowerCase().includes(q) ||
                  n.description.toLowerCase().includes(q),
              )
            : nodes;
          if (filtered.length === 0) return null;
          return (
            <details key={category.key} open className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg p-2 hover:text-primary">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-on-surface">
                    {category.label}
                  </span>
                </div>
                <span className="text-xs text-on-surface-variant">
                  {filtered.length}
                </span>
              </summary>
              <div className="mt-1 space-y-2 pl-1">
                {filtered.map((n) => (
                  <button
                    key={n.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, n.type)}
                    onClick={() => onAdd(n.type)}
                    title={`${n.description} — drag onto the canvas or click to add`}
                    className="neu-interactive flex w-full cursor-grab items-center gap-2 rounded-xl px-2.5 py-2 text-left active:cursor-grabbing"
                  >
                    <NodeIcon name={n.icon} className={`${cat.text} shrink-0`} size={16} />
                    <span className="truncate text-[13px] text-on-surface">{n.label}</span>
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </aside>
  );
}
