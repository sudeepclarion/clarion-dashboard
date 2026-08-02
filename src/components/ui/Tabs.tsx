import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

/** Underlined segment control used for in-page section switching. */
export const Tabs = ({ items, active, onChange, className }: TabsProps) => (
  <div className={cn("flex items-center gap-1 border-b border-hairline", className)}>
    {items.map((item) => {
      const isActive = item.id === active;
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
            isActive
              ? "border-cyan-clarion text-ink"
              : "border-transparent text-ink-muted hover:border-hairline hover:text-ink"
          )}
        >
          {item.label}
          {item.count !== undefined ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] tabular-nums",
                isActive ? "bg-cyan-clarion/15 text-cyan-clarion" : "bg-base-900/70 text-ink-faint"
              )}
            >
              {item.count}
            </span>
          ) : null}
        </button>
      );
    })}
  </div>
);
