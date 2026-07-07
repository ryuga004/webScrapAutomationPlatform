"use client";

import { useState } from "react";
import type { LocatorValue, NodeTypeDef } from "@/lib/nodes";

/** Config state + required-field validation for the node config modal. */
export function useConfigForm(
  def: NodeTypeDef | undefined,
  initialConfig: Record<string, unknown>,
  onSave: (config: Record<string, unknown>) => void,
) {
  const [config, setConfig] = useState<Record<string, unknown>>(initialConfig);

  const set = (name: string, value: unknown) =>
    setConfig((c) => ({ ...c, [name]: value }));

  const visibleFields = (def?.fields ?? []).filter(
    (f) => !f.showIf || f.showIf(config),
  );

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

  return { config, set, visibleFields, handleSave };
}
