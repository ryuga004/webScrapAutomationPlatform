"use client";

import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RequireAuth } from "@/components/RequireAuth";
import { WorkflowEditorScreen } from "./WorkflowEditorScreen";

export default function WorkflowEditorPage() {
  return (
    <RequireAuth>
      <ReactFlowProvider>
        <WorkflowEditorScreen />
      </ReactFlowProvider>
    </RequireAuth>
  );
}
