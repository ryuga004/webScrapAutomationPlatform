import Link from "next/link";
import { AlertTriangle, Pencil, Trash } from "lucide-react";
import type { Workflow } from "@/lib/workflow";

interface WorkflowFooterProps {
  workflow: Workflow;
  onDelete: () => void;
}

export function WorkflowFooter({ workflow, onDelete }: WorkflowFooterProps) {
  const failed = workflow.lastRun && !workflow.lastRun.ok;
  return (
    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
      <div className="flex items-center gap-1 text-sm text-on-surface-variant">
        {failed && <AlertTriangle size={14} className="text-error" />}
        <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDelete}
          className="neu-interactive rounded-lg px-3 py-2 text-sm font-bold text-error flex items-center gap-1"
        >
          Delete <Trash size={14} />
        </button>
        <Link
          href={`/workflows/${workflow.id}`}
          className="neu-primary rounded-lg px-5 py-2 text-sm font-bold flex items-center gap-1"
        >
          Edit <Pencil size={14} />
        </Link>
      </div>
    </div>
  );
}
