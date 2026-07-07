import { Workflow as WorkflowIcon } from "lucide-react";
import type { Workflow } from "@/lib/workflow";
import { StatusBadge } from "./StatusBadge";
import { WorkflowMetrics } from "./WorkflowMetrics";
import { WorkflowFooter } from "./WorkflowFooter";

interface WorkflowCardProps {
  workflow: Workflow;
  onDelete: (workflow: Workflow) => void;
}

export function WorkflowCard({ workflow, onDelete }: WorkflowCardProps) {
  const active = workflow.lastRun?.ok;
  return (
    <div className="neu-raised group relative flex h-full flex-col overflow-hidden p-6 transition-all duration-300">
      {active && <span className="absolute left-0 top-0 h-full w-1.5 rounded-l-2xl bg-primary" />}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="neu-pressed flex h-12 w-12 items-center justify-center text-primary">
            <WorkflowIcon size={22} />
          </div>
          <div>
            <h4 className="font-display text-lg font-bold leading-tight text-on-surface">
              {workflow.name}
            </h4>
            <StatusBadge lastRun={workflow.lastRun} />
          </div>
        </div>
      </div>

      <WorkflowMetrics nodes={workflow.nodes.length} connections={workflow.edges.length} />
      <WorkflowFooter workflow={workflow} onDelete={() => onDelete(workflow)} />
    </div>
  );
}
