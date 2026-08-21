import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-base-900 font-semibold hover:opacity-90 disabled:bg-ink/40 disabled:text-base-900/70",
  secondary:
    "bg-surface-raised text-ink ring-1 ring-inset ring-hairline hover:bg-surface-overlay hover:ring-ink/25",
  ghost: "text-ink-muted hover:bg-surface-raised hover:text-ink",
  danger:
    "bg-signal-critical/10 text-signal-critical ring-1 ring-inset ring-signal-critical/30 hover:bg-signal-critical/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-2xs gap-1.5",
  md: "h-9 px-3.5 text-xs gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = ({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-lg transition-all duration-150",
      "disabled:cursor-not-allowed disabled:opacity-60",
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  >
    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
    {children}
  </button>
);

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: Variant;
}

/** Square, icon-only action — used in table rows and card headers. */
export const IconButton = ({ label, variant = "ghost", className, children, ...props }: IconButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    className={cn(
      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors",
      "disabled:cursor-not-allowed disabled:opacity-50",
      VARIANTS[variant],
      className
    )}
    {...props}
  >
    {children}
  </button>
);
