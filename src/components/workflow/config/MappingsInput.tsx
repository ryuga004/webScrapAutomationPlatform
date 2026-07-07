import { X } from "lucide-react";
import type { Mapping } from "@/lib/nodes";
import { CONFIG_INPUT } from "@/lib/node-ui";

interface MappingsInputProps {
  value: Mapping[] | undefined;
  onChange: (v: Mapping[]) => void;
}

// Editable list of "column = value" rows for dataset-shaped node config.
export function MappingsInput({ value, onChange }: MappingsInputProps) {
  const rows = value ?? [];
  const update = (i: number, patch: Partial<Mapping>) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={row.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder="column"
            className={CONFIG_INPUT}
          />
          <span className="text-on-surface-variant">=</span>
          <input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value or {{variable}}"
            className={CONFIG_INPUT}
          />
          <button
            onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            className="text-on-surface-variant hover:text-error"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...rows, { key: "", value: "" }])}
        className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
      >
        + Add column
      </button>
    </div>
  );
}
