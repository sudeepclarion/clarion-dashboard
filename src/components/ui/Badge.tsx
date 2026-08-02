import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  mono?: boolean;
  title?: string;
}

/** Neutral chip. Semantic variants come from the status style maps. */
export const Badge = ({ children, className, mono = false, title }: BadgeProps) => (
  <span
    title={title}
    className={cn(
      "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium whitespace-nowrap",
      "bg-base-900/60 text-ink-muted ring-1 ring-inset ring-hairline",
      mono && "font-mono tracking-tight",
      className
    )}
  >
    {children}
  </span>
);

export interface DotProps {
  className?: string;
  pulse?: boolean;
}

export const Dot = ({ className, pulse = false }: DotProps) => (
  <span
    aria-hidden
    className={cn("inline-block h-1.5 w-1.5 shrink-0 rounded-full", pulse && "animate-pulse-dot", className)}
  />
);
