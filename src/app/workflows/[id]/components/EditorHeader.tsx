import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Logo } from "@/components/Logo";

interface EditorHeaderProps {
  name: string;
  onNameChange: (name: string) => void;
  saving: boolean;
  onSave: () => void;
}

export function EditorHeader({ name, onNameChange, saving, onSave }: EditorHeaderProps) {
  return (
    <header className="neu-base z-50 flex h-16 items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link href="/workflows" className="flex items-center gap-2">
          <Logo size={28} className="rounded-md" />
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            WebBot
          </span>
        </Link>
        <div className="h-6 w-px bg-outline-variant/60" />
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/workflows" className="text-on-surface-variant hover:text-primary">
            Workflows
          </Link>
          <ChevronRight size={16} className="text-on-surface-variant" />
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            className="neu-pressed w-72 px-3 py-1.5 font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/40"
          />
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-on-surface-variant sm:inline">
          Run this workflow from the WebBot browser extension
        </span>
        <button
          onClick={onSave}
          disabled={saving}
          className="neu-interactive rounded-lg px-5 py-2 text-xs font-semibold uppercase tracking-wide text-primary disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </header>
  );
}
