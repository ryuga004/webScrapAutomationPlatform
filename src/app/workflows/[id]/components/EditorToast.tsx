export function EditorToast({ message }: { message: string }) {
  return (
    <div className="neu-raised fixed bottom-6 left-1/2 z-50 -translate-x-1/2 px-5 py-2.5 text-sm font-medium text-on-surface">
      {message}
    </div>
  );
}
