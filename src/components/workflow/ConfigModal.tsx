"use client";

import { X } from "lucide-react";
import { getNodeType } from "@/lib/nodes";
import { CAT_CLASSES } from "@/lib/node-ui";
import { useConfigForm } from "@/hooks/useConfigForm";
import { NodeIcon } from "./NodeIcon";
import { ConfigField } from "./config/ConfigField";

interface ConfigModalProps {
  nodeType: string;
  initialConfig: Record<string, unknown>;
  isNew: boolean;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}

export function ConfigModal({
  nodeType,
  initialConfig,
  isNew,
  onSave,
  onClose,
}: ConfigModalProps) {
  const def = getNodeType(nodeType);
  const { config, set, visibleFields, handleSave } = useConfigForm(
    def,
    initialConfig,
    onSave,
  );
  if (!def) return null;
  const cat = CAT_CLASSES[def.category];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
        <div className={`h-1.5 w-full ${cat.dot}`} />
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <NodeIcon name={def.icon} className={cat.text} size={24} />
            <div>
              <h2 className="font-display text-lg font-semibold text-on-surface">
                {def.label}
              </h2>
              <p className="text-xs text-on-surface-variant">{def.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 px-5 pb-2">
          {def.fields.length === 0 && (
            <p className="rounded-lg border border-outline-variant bg-surface-container px-3 py-3 text-sm text-on-surface-variant">
              This node has no settings — it just runs.
            </p>
          )}
          {visibleFields.map((f) => (
            <ConfigField
              key={f.name}
              field={f}
              value={config[f.name]}
              onChange={(v) => set(f.name, v)}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 border-t border-outline-variant bg-surface-container-low px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition-all hover:brightness-110 active:scale-95"
          >
            {isNew ? "Add node" : "Save node"}
          </button>
        </div>
      </div>
    </div>
  );
}
