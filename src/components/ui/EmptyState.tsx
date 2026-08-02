import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({ icon, title, description, action, className }: EmptyStateProps) => (
  <div
    className={cn(
      "grid-backdrop flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline px-6 py-12 text-center",
      className
    )}
  >
    {icon ? (
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-surface-raised text-ink-faint ring-1 ring-inset ring-hairline">
        {icon}
      </span>
    ) : null}
    <p className="text-sm font-medium text-ink">{title}</p>
    {description ? (
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-ink-muted">{description}</p>
    ) : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);
