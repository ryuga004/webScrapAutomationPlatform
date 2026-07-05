"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointerClick, X } from "lucide-react";
import { getNodeType } from "@/lib/nodes";
import type { FieldDef, LocatorValue, Mapping } from "@/lib/nodes";
import { CAT_CLASSES } from "@/lib/node-ui";
import { LOCATOR_TYPES, ELEMENT_ROLES } from "@/lib/types";
import type { LocatorType } from "@/lib/types";
import { NodeIcon } from "./NodeIcon";

const INPUT =
  "w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary";

export function ConfigModal({
  nodeType,
  initialConfig,
  isNew,
  onSave,
  onClose,
}: {
  nodeType: string;
  initialConfig: Record<string, unknown>;
  isNew: boolean;
  onSave: (config: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const def = getNodeType(nodeType);
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);
  if (!def) return null;
  const cat = CAT_CLASSES[def.category];

  const set = (name: string, value: unknown) =>
    setConfig((c) => ({ ...c, [name]: value }));

  const visibleFields = def.fields.filter((f) => !f.showIf || f.showIf(config));

  function handleSave() {
    for (const f of visibleFields) {
      if (!f.required) continue;
      const v = config[f.name];
      const empty =
        v == null ||
        (f.kind === "locator" && !(v as LocatorValue)?.selector) ||
        (typeof v === "string" && v.trim() === "");
      if (empty) {
        alert(`"${f.label}" is required.`);
        return;
      }
    }
    onSave(config);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10">
      <div className="w-full max-w-[520px] overflow-hidden rounded-2xl bg-surface shadow-2xl">
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
            <p className="rounded-lg bg-surface-container px-3 py-3 text-sm text-on-surface-variant">
              This node has no settings — it just runs.
            </p>
          )}
          {visibleFields.map((f) => (
            <Field
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-bright"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:opacity-90"
          >
            {isNew ? "Add node" : "Save node"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-on-surface">
        {field.label}
        {field.required && <span className="text-error"> *</span>}
      </label>
      <FieldInput field={field} value={value} onChange={onChange} />
      {field.help && (
        <p className="mt-1 text-xs text-on-surface-variant">{field.help}</p>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={INPUT}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={INPUT}
        />
      );
    case "select":
      return (
        <select
          value={(value as string) ?? field.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={INPUT}
        >
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "locator":
      return <LocatorInput value={value as LocatorValue} onChange={onChange} />;
    case "mappings":
      return <MappingsInput value={value as Mapping[]} onChange={onChange} />;
    case "variable":
    case "text":
    case "url":
    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={INPUT}
        />
      );
  }
}

function LocatorInput({
  value,
  onChange,
}: {
  value: LocatorValue | undefined;
  onChange: (v: LocatorValue) => void;
}) {
  const v: LocatorValue = value ?? { by: "text", selector: "" };
  const meta = LOCATOR_TYPES.find((t) => t.value === v.by);
  const [picking, setPicking] = useState(false);
  const [pickMsg, setPickMsg] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Ask the WebBot extension to enter element-picker mode on the target tab.
  const pickFromPage = () => {
    if (picking) return;
    setPickMsg(null);
    setPicking(true);
    const onMsg = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.__webbot !== "PICK_RESULT") return;
      finish();
      if (d.error) {
        setPickMsg(d.error);
        return;
      }
      if (!d.cancelled && d.locator) {
        onChange({ by: "text", selector: "", ...d.locator } as LocatorValue);
        if (d.count > 1) setPickMsg(`Matched ${d.count} similar elements.`);
      }
    };
    const timer = window.setTimeout(() => {
      finish();
      setPickMsg("No response — is the WebBot extension installed and enabled?");
    }, 120000);
    function finish() {
      window.clearTimeout(timer);
      window.removeEventListener("message", onMsg);
      cleanupRef.current = null;
      setPicking(false);
    }
    cleanupRef.current = finish;
    window.addEventListener("message", onMsg);
    window.postMessage({ __webbot: "PICK_REQUEST" }, "*");
  };

  // Tear down the listener if the modal closes mid-pick.
  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <div className="space-y-2 rounded-lg border border-outline-variant bg-surface-container-low p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-on-surface-variant">Find by</span>
          <select
            value={v.by}
            onChange={(e) => {
              const by = e.target.value as LocatorType;
              onChange({ ...v, by, role: by === "role" ? (v.role ?? "button") : undefined });
            }}
            className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
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
            className="rounded-md border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-sm text-on-surface outline-none focus:border-primary"
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
          className={INPUT}
        />
        <button
          type="button"
          onClick={pickFromPage}
          disabled={picking}
          title="Click an element on your target tab to fill this automatically"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-60"
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

function MappingsInput({
  value,
  onChange,
}: {
  value: Mapping[] | undefined;
  onChange: (v: Mapping[]) => void;
}) {
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
            className={INPUT}
          />
          <span className="text-on-surface-variant">=</span>
          <input
            value={row.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder="value or {{variable}}"
            className={INPUT}
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
        className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:border-primary"
      >
        + Add column
      </button>
    </div>
  );
}
