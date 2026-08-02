import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatTone = "neutral" | "positive" | "caution" | "critical" | "accent";

const TONES: Record<StatTone, { value: string; icon: string }> = {
  neutral: { value: "text-ink", icon: "text-ink-faint bg-base-900/60" },
  positive: { value: "text-signal-positive", icon: "text-signal-positive bg-signal-positive/10" },
  caution: { value: "text-signal-caution", icon: "text-signal-caution bg-signal-caution/10" },
  critical: { value: "text-signal-critical", icon: "text-signal-critical bg-signal-critical/10" },
  accent: { value: "text-cyan-clarion", icon: "text-cyan-clarion bg-cyan-clarion/10" },
};

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  onClick?: () => void;
}

/**
 * One headline number. Clickable variants navigate to the filtered view that
 * explains the number — a KPI a manager can't drill into is decoration.
 */
export const StatCard = ({ label, value, hint, icon, tone = "neutral", onClick }: StatCardProps) => {
  const Element = onClick ? "button" : "div";
  return (
    <Element
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cn(
        "panel flex items-start gap-3 p-3.5 text-left",
        onClick && "transition-colors hover:border-cyan-clarion/30 hover:bg-surface-raised"
      )}
    >
      {icon ? (
        <span className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg", TONES[tone].icon)}>
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
        <p className={cn("mt-0.5 text-xl font-semibold tabular-nums leading-tight", TONES[tone].value)}>
          {value}
        </p>
        {hint ? <p className="mt-0.5 truncate text-2xs text-ink-faint">{hint}</p> : null}
      </div>
    </Element>
  );
};
