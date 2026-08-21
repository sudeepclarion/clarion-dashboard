import { cn } from "@/lib/cn";

/** Minimal B&W mark — double chevron up (≫ rotated). */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    className={cn("h-8 w-8 text-ink", className)}
    role="img"
    aria-label="Clarion"
    focusable="false"
  >
    <rect
      x="0.75"
      y="0.75"
      width="38.5"
      height="38.5"
      rx="8"
      fill="rgb(var(--surface))"
      stroke="rgb(var(--ink))"
      strokeWidth="1.5"
    />
    <path
      d="M12 20 L20 12 L28 20"
      fill="none"
      stroke="rgb(var(--ink))"
      strokeWidth="2.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
    <path
      d="M12 28 L20 20 L28 28"
      fill="none"
      stroke="rgb(var(--ink))"
      strokeWidth="2.4"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

export const Wordmark = ({ className }: { className?: string }) => (
  <span className={cn("text-[15px] font-semibold tracking-[-0.02em] text-ink", className)}>
    Clarion
  </span>
);
