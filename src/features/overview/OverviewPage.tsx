import { useNavigate } from "react-router-dom";
import {
  AlarmClock,
  ArrowUpRight,
  Ban,
  CalendarRange,
  CheckCircle2,
  CircleDot,
  Siren,
  UserPlus,
} from "lucide-react";
import type { DashboardState, Task } from "@/lib/api/types";
import { deadlineTone, formatDate, relativeTime } from "@/lib/format/dates";
import { sourceLabel, taskStatusStyle } from "@/lib/format/status";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Badge, Dot } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatCard } from "@/components/ui/StatCard";
import { TaskStatusPill } from "@/components/ui/StatusPill";
import { DataTable } from "@/components/ui/Table";

const ATTENTION_LIMIT = 8;

/**
 * Ranks the work that needs the manager today: overdue first, then blocked, then
 * due soon. Everything else is noise on a morning dashboard.
 */
const attentionQueue = (tasks: Task[]): Task[] => {
  const weight = (task: Task): number => {
    const tone = deadlineTone(task.deadline, task.status);
    if (tone === "overdue") return 0;
    if (task.status === "blocked") return 1;
    if (tone === "soon") return 2;
    return 9;
  };

  return tasks
    .filter((task) => task.status !== "done" && weight(task) < 9)
    .sort((a, b) => weight(a) - weight(b) || (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))
    .slice(0, ATTENTION_LIMIT);
};

const StatusDistribution = ({ state }: { state: DashboardState }) => {
  const total = state.metrics.totalTasks || 1;

  return (
    <Panel>
      <PanelHeader title="Work distribution" description="Every task on the board, by state." />
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-base-900">
        {state.statuses.map((status) => {
          const count = state.metrics.byStatus[status] ?? 0;
          if (!count) return null;
          return (
            <div
              key={status}
              className={taskStatusStyle(status).dot}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${taskStatusStyle(status).label}: ${count}`}
            />
          );
        })}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {state.statuses.map((status) => {
          const style = taskStatusStyle(status);
          return (
            <div key={status} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-2xs text-ink-muted">
                <Dot className={style.dot} />
                {style.label}
              </dt>
              <dd className="text-xs font-medium tabular-nums text-ink">
                {state.metrics.byStatus[status] ?? 0}
              </dd>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
};

const SprintPanel = ({ state }: { state: DashboardState }) => {
  const navigate = useNavigate();
  const active = state.sprints.find((sprint) => sprint.active) ?? state.sprints[0];

  if (!active) {
    return (
      <Panel>
        <PanelHeader title="Sprint" description="No sprint planned yet." />
        <EmptyState
          className="mt-4 py-8"
          icon={<CalendarRange className="h-4 w-4" />}
          title="No sprints"
          description="Plan a sprint to track a committed scope against a date range."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title={active.name}
        eyebrow={active.active ? "Active sprint" : "Latest sprint"}
        description={active.goal || "No goal set."}
        actions={
          <button
            type="button"
            onClick={() => navigate("/sprints")}
            className="inline-flex items-center gap-1 text-2xs text-cyan-clarion hover:underline"
          >
            Open <ArrowUpRight className="h-3 w-3" />
          </button>
        }
      />
      <div className="mt-4 space-y-2">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-ink-muted">
            {active.progress.done} of {active.progress.total} complete
          </span>
          <span className="font-semibold tabular-nums text-ink">{active.progress.percentComplete}%</span>
        </div>
        <ProgressBar percent={active.progress.percentComplete} />
        <div className="flex items-center justify-between pt-1 text-2xs text-ink-faint">
          <span>
            {formatDate(active.startDate)} → {formatDate(active.endDate)}
          </span>
          {active.progress.blocked ? (
            <span className="text-state-blocked">{active.progress.blocked} blocked</span>
          ) : null}
        </div>
      </div>
    </Panel>
  );
};

const ActivityFeed = ({ state }: { state: DashboardState }) => (
  <Panel flush>
    <div className="p-4">
      <PanelHeader title="Recent activity" description="Every change, and what caused it." />
    </div>
    <ul className="max-h-80 divide-y divide-hairline/50 overflow-y-auto border-t border-hairline">
      {state.activity.slice(0, 25).map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
          <Badge className="mt-0.5 shrink-0" mono>
            {sourceLabel(entry.type)}
          </Badge>
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">{entry.message}</p>
          <span className="shrink-0 text-2xs text-ink-faint">{relativeTime(entry.at)}</span>
        </li>
      ))}
      {!state.activity.length ? (
        <li className="px-4 py-8 text-center text-xs text-ink-faint">Nothing has happened yet.</li>
      ) : null}
    </ul>
  </Panel>
);

export const OverviewPage = ({ state }: { state: DashboardState }) => {
  const navigate = useNavigate();
  const { metrics } = state;
  const attention = attentionQueue(state.tasks);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="Where the team stands right now, and what needs you today."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Open work"
          value={metrics.openTasks}
          hint={`${metrics.totalTasks} total`}
          icon={<CircleDot className="h-4 w-4" />}
          onClick={() => navigate("/board")}
        />
        <StatCard
          label="Overdue"
          value={metrics.overdue}
          tone={metrics.overdue ? "critical" : "neutral"}
          hint="past deadline"
          icon={<AlarmClock className="h-4 w-4" />}
          onClick={() => navigate("/board?filter=overdue")}
        />
        <StatCard
          label="Blocked"
          value={metrics.blocked}
          tone={metrics.blocked ? "caution" : "neutral"}
          hint="needs unblocking"
          icon={<Ban className="h-4 w-4" />}
          onClick={() => navigate("/board?status=blocked")}
        />
        <StatCard
          label="Due this week"
          value={metrics.dueThisWeek}
          hint="next 7 days"
          icon={<CalendarRange className="h-4 w-4" />}
          onClick={() => navigate("/board")}
        />
        <StatCard
          label="Shipped"
          value={metrics.completedThisWeek}
          tone={metrics.completedThisWeek ? "positive" : "neutral"}
          hint="closed in 7 days"
          icon={<CheckCircle2 className="h-4 w-4" />}
          onClick={() => navigate("/review")}
        />
        <StatCard
          label="Live incidents"
          value={metrics.openIncidents}
          tone={metrics.openIncidents ? "critical" : "neutral"}
          hint="from the last scan"
          icon={<Siren className="h-4 w-4" />}
          onClick={() => navigate("/incidents")}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Panel flush>
            <div className="p-4">
              <PanelHeader
                title="Needs attention"
                description="Overdue, blocked, or due within two days — highest urgency first."
                actions={
                  <button
                    type="button"
                    onClick={() => navigate("/board")}
                    className="inline-flex items-center gap-1 text-2xs text-cyan-clarion hover:underline"
                  >
                    Full board <ArrowUpRight className="h-3 w-3" />
                  </button>
                }
              />
            </div>
            <div className="border-t border-hairline">
              <DataTable
                rows={attention}
                rowKey={(task) => task.id}
                onRowClick={(task) => navigate(`/board?task=${task.id}`)}
                empty={
                  <div className="px-4 py-10 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-signal-positive" />
                    <p className="text-xs text-ink-muted">
                      Nothing overdue, blocked, or due in the next two days.
                    </p>
                  </div>
                }
                columns={[
                  {
                    key: "title",
                    header: "Task",
                    className: "text-ink",
                    render: (task) => (
                      <div className="flex min-w-0 items-center gap-2">
                        {task.ticket ? (
                          <Badge mono className="text-cyan-clarion/90">
                            {task.ticket.key}
                          </Badge>
                        ) : null}
                        <span className="truncate font-medium">{task.title}</span>
                      </div>
                    ),
                  },
                  {
                    key: "owner",
                    header: "Owner",
                    render: (task) => <AvatarGroup names={task.assignees} />,
                  },
                  {
                    key: "status",
                    header: "Status",
                    render: (task) => <TaskStatusPill status={task.status} />,
                  },
                  {
                    key: "deadline",
                    header: "Deadline",
                    render: (task) => {
                      const tone = deadlineTone(task.deadline, task.status);
                      return (
                        <span
                          className={cn(
                            "tabular-nums",
                            tone === "overdue" && "font-medium text-signal-critical",
                            tone === "soon" && "text-signal-caution"
                          )}
                        >
                          {formatDate(task.deadline)}
                        </span>
                      );
                    },
                  },
                ]}
              />
            </div>
          </Panel>

          <ActivityFeed state={state} />
        </div>

        <div className="space-y-4">
          <SprintPanel state={state} />
          <StatusDistribution state={state} />

          {metrics.unassigned ? (
            <Panel>
              <PanelHeader
                title="Unowned work"
                description={`${metrics.unassigned} open ${metrics.unassigned === 1 ? "task has" : "tasks have"} no assignee.`}
                actions={
                  <button
                    type="button"
                    onClick={() => navigate("/board?assignee=unassigned")}
                    className="inline-flex items-center gap-1 text-2xs text-cyan-clarion hover:underline"
                  >
                    Assign <UserPlus className="h-3 w-3" />
                  </button>
                }
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
};
