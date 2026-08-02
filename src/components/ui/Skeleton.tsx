import { cn } from "@/lib/cn";

/** Shimmering placeholder — keeps layout stable while a query resolves. */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden rounded-lg bg-surface-raised", className)}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
  </div>
);

export const SkeletonRows = ({ rows = 5, className }: { rows?: number; className?: string }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-10 w-full" />
    ))}
  </div>
);
