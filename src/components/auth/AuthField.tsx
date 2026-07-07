import type { ComponentType, InputHTMLAttributes } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: IconType;
  label: string;
}

// Labelled input with a leading icon, styled as a recessed soft-UI well.
export function AuthField({ icon: Icon, label, ...input }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-on-surface">{label}</label>
      <div className="neu-pressed relative flex items-center">
        <Icon
          size={18}
          className="pointer-events-none absolute left-3 text-on-surface-variant"
        />
        <input
          {...input}
          className="w-full bg-transparent py-2.5 pl-10 pr-4 text-sm text-on-surface outline-none"
        />
      </div>
    </div>
  );
}
