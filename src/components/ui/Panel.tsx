import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface PanelProps {
  children: ReactNode;
  className?: string;
  /** Removes internal padding for tables and lists that manage their own. */
  flush?: boolean;
}

export const Panel = ({ children, className, flush = false }: PanelProps) => (
  <section className={cn("panel", flush ? "" : "p-4", className)}>{children}</section>
);

export interface PanelHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
  className?: string;
}

export const PanelHeader = ({ title, description, actions, eyebrow, className }: PanelHeaderProps) => (
  <header className={cn("flex items-start justify-between gap-4", className)}>
    <div className="min-w-0">
      {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p> : null}
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
  </header>
);

/** Full-bleed divider inside a panel. */
export const PanelDivider = ({ className }: { className?: string }) => (
  <div className={cn("-mx-4 my-4 h-px bg-hairline", className)} />
);
