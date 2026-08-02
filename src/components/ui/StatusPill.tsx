import { cn } from "@/lib/cn";
import type { IncidentSeverity, IncidentState, MemberHealth, TaskStatus } from "@/lib/api/types";
import {
  INCIDENT_STATE_STYLES,
  SEVERITY_STYLES,
  healthStyle,
  taskStatusStyle,
} from "@/lib/format/status";
import { Dot } from "./Badge";

const BASE = "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs font-medium whitespace-nowrap";

export const TaskStatusPill = ({ status, className }: { status: TaskStatus; className?: string }) => {
  const style = taskStatusStyle(status);
  return (
    <span className={cn(BASE, style.pill, className)}>
      <Dot className={style.dot} />
      {style.label}
    </span>
  );
};

export const HealthPill = ({ health, className }: { health: MemberHealth | undefined; className?: string }) => {
  const style = healthStyle(health);
  return (
    <span className={cn(BASE, style.pill, className)}>
      <Dot className={style.dot} pulse={health === "blocked"} />
      {style.label}
    </span>
  );
};

export const SeverityPill = ({ severity, className }: { severity: IncidentSeverity; className?: string }) => (
  <span className={cn(BASE, "uppercase tracking-wide", SEVERITY_STYLES[severity].pill, className)}>
    {SEVERITY_STYLES[severity].label}
  </span>
);

export const IncidentStatePill = ({ status, className }: { status: IncidentState; className?: string }) => (
  <span className={cn(BASE, INCIDENT_STATE_STYLES[status].pill, className)}>
    {INCIDENT_STATE_STYLES[status].label}
  </span>
);
