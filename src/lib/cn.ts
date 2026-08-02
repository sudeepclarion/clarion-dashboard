import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Class merge used by every component.
 *
 * `twMerge` makes conflicting Tailwind utilities last-wins, so a caller's
 * `className` always beats a component's default — `<Select className="w-36" />`
 * actually renders at 9rem instead of losing to the control's own `w-full`.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
