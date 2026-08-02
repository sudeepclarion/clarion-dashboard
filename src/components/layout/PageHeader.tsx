import type { ReactNode } from "react";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

/** Every page opens the same way: context, title, one-line purpose, actions. */
export const PageHeader = ({ eyebrow, title, description, actions }: PageHeaderProps) => (
  <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
      <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">{description}</p>
      ) : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
  </header>
);
