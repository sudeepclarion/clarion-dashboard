import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Sparkles, Users } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Task } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { deadlineTone, formatDate, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { HealthPill, TaskStatusPill } from "@/components/ui/StatusPill";

interface PersonLoad {
  open: number;
  blocked: number;
  overdue: number;
  shipped: number;
}

const loadFor = (tasks: Task[]): PersonLoad => {
  const open = tasks.filter((task) => task.status !== "done");
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  return {
    open: open.length,
    blocked: open.filter((task) => task.status === "blocked").length,
    overdue: open.filter((task) => deadlineTone(task.deadline, task.status) === "overdue").length,
    shipped: tasks.filter((task) => task.completedAt && task.completedAt >= weekAgo).length,
  };
};

const Metric = ({ label, value, tone }: { label: string; value: number; tone?: "critical" | "caution" | "positive" }) => (
  <div className="text-center">
    <p
      className={cn(
        "text-sm font-semibold tabular-nums",
        tone === "critical" && value > 0 && "text-signal-critical",
        tone === "caution" && value > 0 && "text-signal-caution",
        tone === "positive" && value > 0 && "text-signal-positive",
        !tone && "text-ink"
      )}
    >
      {value}
    </p>
    <p className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
  </div>
);

const PersonCard = ({ name, state }: { name: string; state: DashboardState }) => {
  const [expanded, setExpanded] = useState(false);
  const tasks = state.tasks.filter((task) => task.assignees.includes(name));
  const load = loadFor(tasks);
  const summary = state.memberSummaries[name];
  const member = state.members.find((entry) => entry.name === name);

  const ordered = [...tasks].sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (b.status === "done" && a.status !== "done") return -1;
    return (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999");
  });

  return (
    <Panel flush className="overflow-hidden">
      <header className="flex items-start gap-3 p-4">
        <Avatar name={name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{name}</p>
            {member?.role === "manager" ? (
              <Badge className="bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25">Manager</Badge>
            ) : null}
            {(member?.functions ?? []).slice(0, 3).map((fn) => (
              <Badge key={fn} className="bg-base-800 text-ink-muted ring-hairline">
                {fn}
              </Badge>
            ))}
            {summary ? <HealthPill health={summary.health} /> : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-2 border-y border-hairline bg-base-900/30 px-4 py-2.5">
        <Metric label="Open" value={load.open} />
        <Metric label="Blocked" value={load.blocked} tone="caution" />
        <Metric label="Overdue" value={load.overdue} tone="critical" />
        <Metric label="Shipped" value={load.shipped} tone="positive" />
      </div>

      <div className="p-4">
        {summary ? (
          <>
            <p className="text-xs leading-relaxed text-ink-muted">{summary.summary}</p>
            <p className="mt-2 text-[10px] text-ink-faint">
              AI summary · {relativeTime(summary.generatedAt)}
            </p>
          </>
        ) : (
          <p className="text-2xs text-ink-faint">
            No AI summary yet — generate them above to get a written read on momentum and risk.
          </p>
        )}

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 inline-flex items-center gap-1.5 text-2xs text-ink-muted transition-colors hover:text-ink"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? "Hide" : `View ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`}
        </button>

        {expanded ? (
          <ul className="mt-2.5 space-y-1">
            {ordered.map((task) => (
              <li key={task.id}>
                <Link
                  to={`/board?task=${task.id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-raised"
                >
                  <span className="min-w-0 flex-1 truncate text-2xs text-ink-muted">
                    {task.ticket ? (
                      <span className="mr-1.5 font-mono text-[10px] text-cyan-clarion/90">{task.ticket.key}</span>
                    ) : null}
                    {task.title}
                  </span>
                  {task.deadline ? (
                    <span
                      className={cn(
                        "shrink-0 text-[10px] tabular-nums",
                        deadlineTone(task.deadline, task.status) === "overdue"
                          ? "text-signal-critical"
                          : "text-ink-faint"
                      )}
                    >
                      {formatDate(task.deadline)}
                    </span>
                  ) : null}
                  <TaskStatusPill status={task.status} />
                </Link>
              </li>
            ))}
            {!ordered.length ? <li className="px-2 py-2 text-2xs text-ink-faint">No tasks assigned.</li> : null}
          </ul>
        ) : null}
      </div>
    </Panel>
  );
};

export const PeoplePage = ({ state }: { state: DashboardState }) => {
  const aiReady = state.integrations.capabilities.ai;
  const refresh = useDashboardMutation(() => api.members.refreshSummaries());

  const generatedAt = Object.values(state.memberSummaries)[0]?.generatedAt;
  const hasSummaries = Object.keys(state.memberSummaries).length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="People"
        description="Load, momentum and risk per person — with an AI read on each based only on recorded activity."
        actions={
          <>
            {generatedAt ? (
              <Badge>summaries {relativeTime(generatedAt)}</Badge>
            ) : null}
            <Button
              variant="primary"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              disabled={!aiReady || !state.members.length}
              loading={refresh.isPending}
              onClick={() => refresh.mutate()}
            >
              {hasSummaries ? "Refresh summaries" : "Generate summaries"}
            </Button>
          </>
        }
      />

      {!aiReady ? <AiUnavailableNotice feature="Per-person summaries" /> : null}
      {refresh.error ? (
        <Callout tone="error" className="mb-3">
          {refresh.error.message}
        </Callout>
      ) : null}

      {state.members.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.members.map((member) => (
            <PersonCard key={member.id} name={member.name} state={state} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="h-4 w-4" />}
          title="No team members yet"
          description="Add your team in Settings so standups, reports and assignment can resolve people by name."
          action={
            <Link to="/settings">
              <Button variant="primary">Open settings</Button>
            </Link>
          }
        />
      )}
    </>
  );
};
