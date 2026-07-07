"use client";

import { Palette } from "@/components/workflow/Palette";
import { ConfigModal } from "@/components/workflow/ConfigModal";
import { useWorkflowEditor } from "@/hooks/useWorkflowEditor";
import { EditorHeader } from "./components/EditorHeader";
import { EditorCanvas } from "./components/EditorCanvas";
import { EditorToast } from "./components/EditorToast";

export function WorkflowEditorScreen() {
  const editor = useWorkflowEditor();

  return (
    <div className="neu-base flex h-screen flex-col">
      <EditorHeader
        name={editor.name}
        onNameChange={editor.setName}
        saving={editor.saving}
        onSave={editor.handleSave}
      />

      <div className="flex flex-1 overflow-hidden">
        <Palette onAdd={editor.handleAdd} />

        <EditorCanvas
          loading={editor.loading}
          isEmpty={editor.isEmpty}
          nodes={editor.nodes}
          edges={editor.edges}
          onNodesChange={editor.onNodesChange}
          onEdgesChange={editor.onEdgesChange}
          onConnect={editor.onConnect}
          onReconnectStart={editor.onReconnectStart}
          onReconnect={editor.onReconnect}
          onReconnectEnd={editor.onReconnectEnd}
          onNodeDoubleClick={editor.onNodeDoubleClick}
          onDrop={editor.onDrop}
          onDragOver={editor.onDragOver}
        />
      </div>

      {editor.modal && (
        <ConfigModal
          nodeType={editor.modal.nodeType}
          initialConfig={editor.modal.config}
          isNew={editor.modal.mode === "add"}
          onSave={editor.handleModalSave}
          onClose={editor.closeModal}
        />
      )}

      {editor.toast && <EditorToast message={editor.toast} />}
    </div>
  );
}
