import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full rounded-lg border border-hairline bg-base-900/60 px-3 text-xs text-ink placeholder:text-ink-faint " +
  "transition-colors focus:border-cyan-clarion/50 focus:outline-none focus:ring-1 focus:ring-cyan-clarion/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export interface FieldProps {
  label?: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint, so form spacing is identical everywhere. */
export const Field = ({ label, hint, children, className }: FieldProps) => (
  <label className={cn("block space-y-1.5", className)}>
    {label ? (
      <span className="block text-2xs font-medium uppercase tracking-wide text-ink-faint">{label}</span>
    ) : null}
    {children}
    {hint ? <span className="block text-2xs text-ink-faint">{hint}</span> : null}
  </label>
);

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn(CONTROL, "h-9", className)} {...props} />
);

export const Textarea = ({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea rows={rows} className={cn(CONTROL, "resize-y py-2 leading-relaxed", className)} {...props} />
);

export const Select = ({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    className={cn(CONTROL, "h-9 cursor-pointer appearance-none bg-[right_0.6rem_center] pr-8", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
      backgroundRepeat: "no-repeat",
    }}
    {...props}
  >
    {children}
  </select>
);
