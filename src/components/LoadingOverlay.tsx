interface LoadingOverlayProps {
  open: boolean;
  message?: string;
}

export function LoadingOverlay({ open, message = "Generating summary…" }: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-nerdy-nav/25 backdrop-blur-[2px] animate-fade-in">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white p-8 shadow-card-hover">
        <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-nerdy-purple/25 border-t-nerdy-purple animate-spin" />
        <p className="text-center text-sm font-medium text-nerdy-ink">{message}</p>
        <p className="mt-2 text-center text-xs text-nerdy-muted">One moment.</p>
      </div>
    </div>
  );
}
