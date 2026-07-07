import type { FieldDef, LocatorValue, Mapping } from "@/lib/nodes";
import { CONFIG_INPUT } from "@/lib/node-ui";
import { LocatorInput } from "./LocatorInput";
import { MappingsInput } from "./MappingsInput";

interface FieldProps {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

// A labelled config field with its help text and kind-specific control.
export function ConfigField({ field, value, onChange }: FieldProps) {
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

function FieldInput({ field, value, onChange }: FieldProps) {
  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={CONFIG_INPUT}
        />
      );
    case "number":
      return (
        <input
          type="number"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={CONFIG_INPUT}
        />
      );
    case "select":
      return (
        <select
          value={(value as string) ?? field.default ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={CONFIG_INPUT}
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
          className={CONFIG_INPUT}
        />
      );
  }
}
