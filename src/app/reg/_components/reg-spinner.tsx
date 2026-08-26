import { cn } from "@/lib/utils";

type RegSpinnerProps = {
  size?: "sm" | "md";
  variant?: "default" | "onPrimary";
  className?: string;
};

export function RegSpinner({
  size = "md",
  variant = "default",
  className,
}: RegSpinnerProps) {
  return (
    <span
      className={cn(
        size === "sm" ? "size-4" : "size-5",
        "animate-spin rounded-full border-2",
        variant === "onPrimary"
          ? "border-primary-foreground/30 border-t-primary-foreground"
          : "border-muted-foreground/30 border-t-primary",
        className,
      )}
      aria-hidden="true"
    />
  );
}
