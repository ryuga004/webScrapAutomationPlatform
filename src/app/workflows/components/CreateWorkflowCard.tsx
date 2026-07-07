import Link from "next/link";
import { Plus } from "lucide-react";

// The dashed "add" tile that always trails the workflow grid.
export function CreateWorkflowCard() {
  return (
    <Link
      href="/workflows/new"
      className="neu-pressed group flex h-full min-h-[280px] flex-col items-center justify-center p-6 text-center transition-colors hover:text-primary"
    >
      <div className="neu-raised-sm mb-4 flex h-16 w-16 items-center justify-center !rounded-full text-on-surface-variant transition-transform duration-300 group-hover:scale-105 group-hover:text-primary">
        <Plus size={30} />
      </div>
      <h4 className="font-display text-lg font-bold text-on-surface-variant group-hover:text-primary">
        Create New Workflow
      </h4>
      <p className="mt-2 max-w-[220px] text-sm text-on-surface-variant">
        Start building a new automation from scratch.
      </p>
    </Link>
  );
}
