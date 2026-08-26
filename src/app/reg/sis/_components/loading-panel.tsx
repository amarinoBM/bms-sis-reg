type LoadingPanelProps = {
  message?: string;
};

export function LoadingPanel({ message = "Loading student information…" }: LoadingPanelProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-border bg-card p-6 text-body text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span
        className="size-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
        aria-hidden="true"
      />
      <span>{message}</span>
    </div>
  );
}
