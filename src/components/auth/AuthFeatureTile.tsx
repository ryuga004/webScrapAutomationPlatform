import type { ComponentType } from "react";

type IconType = ComponentType<{ size?: number; className?: string }>;

interface AuthFeatureTileProps {
  icon: IconType;
  title: string;
  description: string;
}

// Small marketing bento cell highlighting one product capability.
export function AuthFeatureTile({ icon: Icon, title, description }: AuthFeatureTileProps) {
  return (
    <div className="neu-raised flex flex-col gap-3 p-6">
      <span className="neu-raised-sm flex h-10 w-10 items-center justify-center !rounded-full text-primary">
        <Icon size={18} />
      </span>
      <h3 className="font-display font-semibold text-on-surface">{title}</h3>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
