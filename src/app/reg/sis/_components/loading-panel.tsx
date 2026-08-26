import { RegSpinner } from "@/app/reg/_components/reg-spinner";

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
      <RegSpinner />
      <span>{message}</span>
    </div>
  );
}
