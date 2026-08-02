import type { IncidentSeverity, IncidentState, MemberHealth, TaskStatus } from "../api/types";

/**
 * Every status → label + colour decision lives here. Columns, pills, dots, charts
 * and the printable report all read from these maps, so a status can never look
 * like two different things in two places.
 */

export interface StatusStyle {
  label: string;
  /** Tailwind classes for a filled pill. */
  pill: string;
  /** Tailwind class for a solid dot or bar. */
  dot: string;
  /** Tailwind class for a column accent border. */
  accent: string;
}

export const TASK_STATUS_STYLES: Record<TaskStatus, StatusStyle> = {
  backlog: {
    label: "Backlog",
    pill: "bg-state-backlog/12 text-ink-muted ring-1 ring-inset ring-state-backlog/25",
    dot: "bg-state-backlog",
    accent: "border-state-backlog/50",
  },
  in_progress: {
    label: "In Development",
    pill: "bg-state-progress/12 text-state-progress ring-1 ring-inset ring-state-progress/30",
    dot: "bg-state-progress",
    accent: "border-state-progress/60",
  },
  review: {
    label: "In Review",
    pill: "bg-state-review/12 text-state-review ring-1 ring-inset ring-state-review/30",
    dot: "bg-state-review",
    accent: "border-state-review/60",
  },
  blocked: {
    label: "Blocked",
    pill: "bg-state-blocked/12 text-state-blocked ring-1 ring-inset ring-state-blocked/30",
    dot: "bg-state-blocked",
    accent: "border-state-blocked/60",
  },
  done: {
    label: "Done",
    pill: "bg-state-done/12 text-state-done ring-1 ring-inset ring-state-done/30",
    dot: "bg-state-done",
    accent: "border-state-done/60",
  },
};

export const taskStatusStyle = (status: TaskStatus): StatusStyle =>
  TASK_STATUS_STYLES[status] ?? TASK_STATUS_STYLES.backlog;

export const HEALTH_STYLES: Record<MemberHealth, { label: string; pill: string; dot: string }> = {
  on_track: {
    label: "On track",
    pill: "bg-signal-positive/12 text-signal-positive ring-1 ring-inset ring-signal-positive/30",
    dot: "bg-signal-positive",
  },
  at_risk: {
    label: "At risk",
    pill: "bg-signal-caution/12 text-signal-caution ring-1 ring-inset ring-signal-caution/30",
    dot: "bg-signal-caution",
  },
  blocked: {
    label: "Blocked",
    pill: "bg-signal-critical/12 text-signal-critical ring-1 ring-inset ring-signal-critical/30",
    dot: "bg-signal-critical",
  },
  idle: {
    label: "Idle",
    pill: "bg-ink-faint/12 text-ink-faint ring-1 ring-inset ring-ink-faint/25",
    dot: "bg-ink-faint",
  },
  no_data: {
    label: "No data",
    pill: "bg-ink-faint/10 text-ink-faint ring-1 ring-inset ring-ink-faint/20",
    dot: "bg-ink-faint",
  },
};

export const healthStyle = (health: MemberHealth | undefined) =>
  HEALTH_STYLES[health ?? "no_data"] ?? HEALTH_STYLES.no_data;

export const SEVERITY_STYLES: Record<IncidentSeverity, { label: string; pill: string; bar: string }> = {
  critical: {
    label: "Critical",
    pill: "bg-signal-critical/15 text-signal-critical ring-1 ring-inset ring-signal-critical/40",
    bar: "bg-signal-critical",
  },
  high: {
    label: "High",
    pill: "bg-state-blocked/12 text-state-blocked ring-1 ring-inset ring-state-blocked/30",
    bar: "bg-state-blocked",
  },
  medium: {
    label: "Medium",
    pill: "bg-signal-caution/12 text-signal-caution ring-1 ring-inset ring-signal-caution/30",
    bar: "bg-signal-caution",
  },
  low: {
    label: "Low",
    pill: "bg-ink-faint/12 text-ink-faint ring-1 ring-inset ring-ink-faint/25",
    bar: "bg-ink-faint",
  },
};

export const INCIDENT_STATE_STYLES: Record<IncidentState, { label: string; pill: string }> = {
  ongoing: {
    label: "Ongoing",
    pill: "bg-signal-critical/12 text-signal-critical ring-1 ring-inset ring-signal-critical/30",
  },
  mitigated: {
    label: "Mitigated",
    pill: "bg-signal-caution/12 text-signal-caution ring-1 ring-inset ring-signal-caution/30",
  },
  resolved: {
    label: "Resolved",
    pill: "bg-signal-positive/12 text-signal-positive ring-1 ring-inset ring-signal-positive/30",
  },
  unclear: {
    label: "Unclear",
    pill: "bg-ink-faint/12 text-ink-faint ring-1 ring-inset ring-ink-faint/25",
  },
};

/** Where a change came from — shown in the audit feed and update trails. */
export const SOURCE_LABELS: Record<string, string> = {
  manual: "Manual",
  standup: "Standup",
  chat: "Assistant",
  jira: "Jira",
  slack: "Slack",
  client: "Client view",
  report: "Report",
  system: "System",
};

export const sourceLabel = (source: string): string => SOURCE_LABELS[source] ?? source;

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
