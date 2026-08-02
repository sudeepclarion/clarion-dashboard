const DAY_MS = 86_400_000;

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const isoDaysAgo = (days: number): string =>
  new Date(Date.now() - days * DAY_MS).toISOString().slice(0, 10);

export const isoDaysAhead = (days: number): string =>
  new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10);

/** "12 Aug" / "12 Aug 2025" when the year differs from today's. */
export const formatDate = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return "—";
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** "3d ago", "in 2d", "just now" — the form a manager scans fastest. */
export const relativeTime = (value: string | null | undefined): string => {
  if (!value) return "—";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "—";

  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const suffix = diff < 0 ? " ago" : "";
  const prefix = diff > 0 ? "in " : "";

  if (abs < 60_000) return "just now";
  if (abs < 3_600_000) return `${prefix}${Math.round(abs / 60_000)}m${suffix}`;
  if (abs < DAY_MS) return `${prefix}${Math.round(abs / 3_600_000)}h${suffix}`;
  if (abs < 30 * DAY_MS) return `${prefix}${Math.round(abs / DAY_MS)}d${suffix}`;
  return formatDate(value);
};

export const daysBetween = (from: string, to: string): number =>
  Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS);

export type DeadlineTone = "none" | "overdue" | "soon" | "scheduled";

/** Deadline urgency, shared by cards, tables and the overview. */
export const deadlineTone = (
  deadline: string | null,
  status: string,
  soonWindowDays = 2
): DeadlineTone => {
  if (!deadline) return "none";
  if (status === "done") return "scheduled";
  const today = todayIso();
  if (deadline < today) return "overdue";
  if (deadline <= isoDaysAhead(soonWindowDays)) return "soon";
  return "scheduled";
};
