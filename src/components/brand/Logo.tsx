import { cn } from "@/lib/cn";

/** The mark from the Clarion site: three signals converging into one focused node. */
export const LogoMark = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} role="img" aria-label="Clarion" focusable="false">
    <defs>
      <linearGradient id="clarion-mark" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00F2FE" />
        <stop offset="1" stopColor="#7000FF" />
      </linearGradient>
    </defs>
    <rect x="0.75" y="0.75" width="38.5" height="38.5" rx="11" fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />
    <path d="M11 12.5h7.5M11 20h11.5M11 27.5h7.5" stroke="url(#clarion-mark)" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M22.5 20 29 20" stroke="#00F2FE" strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="29.5" cy="20" r="3.6" fill="url(#clarion-mark)" />
  </svg>
);

export const Wordmark = ({ className }: { className?: string }) => (
  <span className={cn("text-[15px] font-semibold tracking-[-0.02em] text-ink", className)}>Clarion</span>
);
