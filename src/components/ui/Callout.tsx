import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";

type Tone = "info" | "success" | "warning" | "error";

const TONES: Record<Tone, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: "border-cyan-clarion/25 bg-cyan-clarion/[0.06] text-ink-muted",
    icon: <Info className="h-3.5 w-3.5 text-cyan-clarion" />,
  },
  success: {
    wrap: "border-signal-positive/25 bg-signal-positive/[0.06] text-ink-muted",
    icon: <CheckCircle2 className="h-3.5 w-3.5 text-signal-positive" />,
  },
  warning: {
    wrap: "border-signal-caution/25 bg-signal-caution/[0.06] text-ink-muted",
    icon: <AlertTriangle className="h-3.5 w-3.5 text-signal-caution" />,
  },
  error: {
    wrap: "border-signal-critical/30 bg-signal-critical/[0.07] text-ink-muted",
    icon: <XCircle className="h-3.5 w-3.5 text-signal-critical" />,
  },
};

export interface CalloutProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

/** Inline status message — the only way the app reports success or failure. */
export const Callout = ({ tone = "info", children, className, actions }: CalloutProps) => (
  <div
    className={cn(
      "flex items-start gap-2.5 rounded-lg border px-3 py-2 text-xs leading-relaxed",
      TONES[tone].wrap,
      className
    )}
  >
    <span className="mt-0.5 shrink-0">{TONES[tone].icon}</span>
    <div className="min-w-0 flex-1">{children}</div>
    {actions ? <div className="shrink-0">{actions}</div> : null}
  </div>
);
