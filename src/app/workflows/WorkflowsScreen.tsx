"use client";

import { Workflow as WorkflowIcon } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useDownloadExtension } from "@/hooks/useDownloadExtension";
import { Sidebar, type NavItem } from "./components/Sidebar";
import { DashboardNav } from "./components/DashboardNav";
import { PageHeader } from "./components/PageHeader";
import { WorkflowCard } from "./components/WorkflowCard";
import { CreateWorkflowCard } from "./components/CreateWorkflowCard";
import { EmptyState } from "./components/EmptyState";

const NAV: NavItem[] = [
  { label: "Automations", icon: WorkflowIcon, href: "/workflows", active: true },
];

export function WorkflowsScreen() {
  const { user, logout } = useAuth();
  const { loading, query, setQuery, filteredWorkflows, deleteWorkflow } =
    useWorkflows();
  const { downloading, downloadExtension } = useDownloadExtension();
  const noMatches = !loading && filteredWorkflows.length === 0 && query.length > 0;

  return (
    <div className="neu-base min-h-screen text-on-surface">
      <Sidebar navigation={NAV} onLogout={logout} />

      <main className="min-h-screen md:ml-64">
        <DashboardNav
          query={query}
          onQueryChange={setQuery}
          downloading={downloading}
          onDownload={downloadExtension}
          user={user}
        />

        <div className="p-6 pt-4 md:p-10 md:pt-6">
          <PageHeader />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
            {loading ? (
              <div className="neu-raised p-8 text-on-surface-variant md:col-span-2 lg:col-span-12">
                Loading…
              </div>
            ) : noMatches ? (
              <div className="neu-raised p-8 md:col-span-2 lg:col-span-12">
                <EmptyState query={query} />
              </div>
            ) : (
              <>
                {filteredWorkflows.map((wf, i) => (
                  <div
                    key={wf.id}
                    className={
                      i === 0
                        ? "md:col-span-2 lg:col-span-8"
                        : "md:col-span-1 lg:col-span-4"
                    }
                  >
                    <WorkflowCard workflow={wf} onDelete={deleteWorkflow} />
                  </div>
                ))}
                <div className="md:col-span-1 lg:col-span-4">
                  <CreateWorkflowCard />
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
