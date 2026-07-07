"use client";

import { MousePointerClick } from "lucide-react";
import type { LocatorValue } from "@/lib/nodes";
import { CONFIG_INPUT } from "@/lib/node-ui";
import { LOCATOR_TYPES, ELEMENT_ROLES } from "@/lib/types";
import type { LocatorType } from "@/lib/types";
import { useElementPicker } from "@/hooks/useElementPicker";

const SELECT =
  "rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm text-on-surface outline-none focus:border-primary";

interface LocatorInputProps {
  value: LocatorValue | undefined;
  onChange: (v: LocatorValue) => void;
}

// How to find an element on the page: strategy + identifier, with a one-click
// "Pick" that defers to the browser extension's element picker.
export function LocatorInput({ value, onChange }: LocatorInputProps) {
  const v: LocatorValue = value ?? { by: "text", selector: "" };
  const meta = LOCATOR_TYPES.find((t) => t.value === v.by);
  const { picking, pickMsg, pickFromPage } = useElementPicker((locator) =>
    onChange(locator),
  );

  return (
    <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-on-surface-variant">Find by</span>
          <select
            value={v.by}
            onChange={(e) => {
              const by = e.target.value as LocatorType;
              onChange({ ...v, by, role: by === "role" ? (v.role ?? "button") : undefined });
            }}
            className={SELECT}
          >
            {LOCATOR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        {v.by === "role" && (
          <select
            value={v.role ?? "button"}
            onChange={(e) => onChange({ ...v, role: e.target.value })}
            className={SELECT}
          >
            {ELEMENT_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={v.selector}
          onChange={(e) => onChange({ ...v, selector: e.target.value })}
          placeholder={meta?.placeholder ?? "Identifier"}
          className={CONFIG_INPUT}
        />
        <button
          type="button"
          onClick={pickFromPage}
          disabled={picking}
          title="Click an element on your target tab to fill this automatically"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10 disabled:opacity-60"
        >
          <MousePointerClick size={15} />
          {picking ? "Picking…" : "Pick"}
        </button>
      </div>
      {picking && (
        <p className="text-xs text-primary">
          Switch to the tab you want to automate and click an element (Shift =
          all similar, Esc = cancel).
        </p>
      )}
      {pickMsg && <p className="text-xs text-amber-600">{pickMsg}</p>}
      {meta && !picking && <p className="text-xs text-on-surface-variant">{meta.hint}</p>}
    </div>
  );
}
