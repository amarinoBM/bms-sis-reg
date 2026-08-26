import type { ComponentProps } from "react";

type ExternalLinkProps = ComponentProps<"a"> & {
  showNewWindowHint?: boolean;
};

export function ExternalLink({
  children,
  className,
  showNewWindowHint = true,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      className={className}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
      {showNewWindowHint && (
        <span className="sr-only"> (opens in a new tab)</span>
      )}
    </a>
  );
}
