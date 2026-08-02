import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  percent: number;
  className?: string;
  tone?: "accent" | "positive" | "caution";
}

const TONES = {
  accent: "bg-gradient-to-r from-cyan-clarion to-violet-electric",
  positive: "bg-signal-positive",
  caution: "bg-signal-caution",
} as const;

export const ProgressBar = ({ percent, className, tone = "accent" }: ProgressBarProps) => (
  <div
    role="progressbar"
    aria-valuenow={Math.round(percent)}
    aria-valuemin={0}
    aria-valuemax={100}
    className={cn("h-1.5 w-full overflow-hidden rounded-full bg-base-900", className)}
  >
    <div
      className={cn("h-full rounded-full transition-[width] duration-500", TONES[tone])}
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);
