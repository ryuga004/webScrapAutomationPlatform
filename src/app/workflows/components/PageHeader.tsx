import Link from "next/link";
import { Plus } from "lucide-react";

// Section heading for the dashboard: title, subtitle and the primary create action.
export function PageHeader() {
  return (
    <div className="mb-10 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight text-on-surface">
          My Automations
        </h2>
        <p className="mt-1 text-on-surface-variant">
          Monitor and manage your active workflow threads.
        </p>
      </div>
      <Link
        href="/workflows/new"
        className="neu-primary hidden items-center gap-2 !rounded-full px-6 py-2.5 text-sm font-bold sm:flex"
      >
        <Plus size={18} />
        New Workflow
      </Link>
    </div>
  );
}
