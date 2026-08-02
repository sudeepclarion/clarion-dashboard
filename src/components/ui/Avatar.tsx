import { cn } from "@/lib/cn";
import { initials } from "@/lib/format/status";

export interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md";
  className?: string;
}

const SIZES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-7 w-7 text-2xs",
  md: "h-9 w-9 text-xs",
} as const;

/**
 * Initials avatar with a deterministic hue per person, so the same teammate is the
 * same colour on every screen without storing anything.
 */
export const Avatar = ({ name, size = "sm", className }: AvatarProps) => {
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return (
    <span
      title={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ring-white/10",
        SIZES[size],
        className
      )}
      style={{
        backgroundColor: `hsl(${hue} 55% 22%)`,
        color: `hsl(${hue} 85% 78%)`,
      }}
    >
      {initials(name)}
    </span>
  );
};

export const AvatarGroup = ({ names, max = 3 }: { names: string[]; max?: number }) => {
  if (!names.length) {
    return <span className="text-2xs text-ink-faint">Unassigned</span>;
  }
  const shown = names.slice(0, max);
  const overflow = names.length - shown.length;

  return (
    <span className="flex items-center -space-x-1.5">
      {shown.map((name) => (
        <Avatar key={name} name={name} size="xs" className="ring-2 ring-surface" />
      ))}
      {overflow > 0 ? (
        <span className="ml-2.5 text-2xs text-ink-faint">+{overflow}</span>
      ) : null}
    </span>
  );
};
