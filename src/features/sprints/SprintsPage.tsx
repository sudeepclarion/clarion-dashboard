import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarRange, ChevronDown, ChevronRight, Plus, Search, Trash2, Upload } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Sprint, Task } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { daysBetween, deadlineTone, formatDate, isoDaysAhead, todayIso } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TaskStatusPill } from "@/components/ui/StatusPill";
import { DataTable } from "@/components/ui/Table";

const VISIBLE_TASK_STEP = 50;

const PlanSprint = ({ state }: { state: DashboardState }) => {
  const [draft, setDraft] = useState({
    name: "",
    goal: "",
    startDate: todayIso(),
    endDate: isoDaysAhead(13),
  });

  const create = useDashboardMutation(() => api.sprints.create(draft), {
    onSuccess: () => setDraft({ name: "", goal: "", startDate: todayIso(), endDate: isoDaysAhead(13) }),
  });

  const isValid = draft.name.trim() && draft.startDate && draft.endDate && draft.endDate >= draft.startDate;

  return (
    <Panel>
      <PanelHeader
        title="Plan a sprint"
        description={`${state.sprints.length} ${state.sprints.length === 1 ? "sprint" : "sprints"} so far. Two weeks is the default window.`}
      />

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Name">
          <Input
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Sprint 12"
          />
        </Field>
        <Field label="Start">
          <Input
            type="date"
            value={draft.startDate}
            onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
          />
        </Field>
        <Field label="End">
          <Input
            type="date"
            value={draft.endDate}
            onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
          />
        </Field>
        <Field label="Goal" className="lg:col-span-2">
          <Input
            value={draft.goal}
            onChange={(event) => setDraft({ ...draft, goal: event.target.value })}
            placeholder="Ship the refund flow end to end"
          />
        </Field>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button
          variant="primary"
          icon={<Plus className="h-3.5 w-3.5" />}
          disabled={!isValid}
          loading={create.isPending}
          onClick={() => create.mutate()}
        >
          Create sprint
        </Button>
        {draft.startDate && draft.endDate && draft.endDate >= draft.startDate ? (
          <p className="text-2xs text-ink-faint">
            {daysBetween(draft.startDate, draft.endDate) + 1} days
          </p>
        ) : null}
      </div>

      {create.error ? (
        <Callout tone="error" className="mt-3">
          {create.error.message}
        </Callout>
      ) : null}
    </Panel>
  );
};

const SprintPanel = ({
  sprint,
  state,
  backlog,
}: {
  sprint: Sprint;
  state: DashboardState;
  backlog: Task[];
}) => {
  const [open, setOpen] = useState(sprint.active);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(VISIBLE_TASK_STEP);
  const [taskToAdd, setTaskToAdd] = useState("");

  const tasks = state.tasks.filter((task) => task.sprintId === sprint.id);
  const remove = useDashboardMutation(() => api.sprints.remove(sprint.id));
  const removeTask = useDashboardMutation((taskId: string) => api.sprints.removeTasks(sprint.id, [taskId]));
  const addTask = useDashboardMutation((taskId: string) => api.sprints.addTasks(sprint.id, [taskId]), {
    onSuccess: () => setTaskToAdd(""),
  });
  const mirror = useDashboardMutation(() => api.sprints.mirrorToJira(sprint.id));

  const search = query.trim().toLowerCase();
  const filtered = search
    ? tasks.filter((task) =>
        `${task.title} ${task.ticket?.key ?? ""} ${task.assignees.join(" ")} ${task.status}`
          .toLowerCase()
          .includes(search)
      )
    : tasks;

  const daysLeft = daysBetween(todayIso(), sprint.endDate);

  return (
    <Panel flush>
      <header className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-ink">{sprint.name}</h2>
              {sprint.active ? (
                <Badge className="bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25">Active</Badge>
              ) : null}
              {sprint.jiraSprint ? (
                <Badge mono title="Mirrored to Jira">
                  Jira {sprint.jiraSprint.id}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-2xs text-ink-faint">
              {formatDate(sprint.startDate)} → {formatDate(sprint.endDate)}
              {sprint.active && daysLeft >= 0 ? ` · ${daysLeft} days left` : ""}
              {sprint.goal ? ` · ${sprint.goal}` : ""}
            </p>
          </div>
        </button>

        <div className="flex w-48 shrink-0 items-center gap-2">
          <ProgressBar
            percent={sprint.progress.percentComplete}
            tone={sprint.progress.blocked ? "caution" : "accent"}
            className="flex-1"
          />
          <span className="w-16 shrink-0 text-right text-2xs tabular-nums text-ink-muted">
            {sprint.progress.done}/{sprint.progress.total}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {state.integrations.capabilities.jira ? (
            <IconButton
              label="Mirror this sprint onto the Jira Scrum board"
              onClick={() => mirror.mutate()}
              disabled={mirror.isPending}
            >
              <Upload className="h-3.5 w-3.5" />
            </IconButton>
          ) : null}
          <IconButton
            label="Delete sprint"
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete ${sprint.name}? Its tasks are kept and simply detached.`)) {
                remove.mutate();
              }
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </header>

      {mirror.error ? (
        <Callout tone="error" className="mx-4 mb-4">
          {mirror.error.message}
        </Callout>
      ) : null}
      {mirror.data ? (
        <Callout tone="success" className="mx-4 mb-4">
          Mirrored to Jira — {mirror.data.movedIssues} of {mirror.data.linkedTickets} linked tickets moved
          {mirror.data.started ? " and the sprint was started." : "."}
        </Callout>
      ) : null}

      {open ? (
        <div className="border-t border-hairline">
          {tasks.length > 10 ? (
            <div className="relative border-b border-hairline p-3">
              <Search className="pointer-events-none absolute left-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisible(VISIBLE_TASK_STEP);
                }}
                placeholder={`Search ${tasks.length} tasks…`}
                className="pl-8"
              />
            </div>
          ) : null}

          <DataTable
            rows={filtered.slice(0, visible)}
            rowKey={(task) => task.id}
            empty={
              <div className="px-4 py-8 text-center text-xs text-ink-faint">
                {search ? `No tasks match "${query}".` : "No tasks in this sprint yet."}
              </div>
            }
            columns={[
              {
                key: "title",
                header: "Task",
                className: "text-ink",
                render: (task) => (
                  <Link to={`/board?task=${task.id}`} className="flex min-w-0 items-center gap-2 hover:underline">
                    {task.ticket ? (
                      <Badge mono className="text-cyan-clarion/90">
                        {task.ticket.key}
                      </Badge>
                    ) : null}
                    <span className="truncate">{task.title}</span>
                  </Link>
                ),
              },
              { key: "owner", header: "Owner", render: (task) => <AvatarGroup names={task.assignees} /> },
              { key: "status", header: "Status", render: (task) => <TaskStatusPill status={task.status} /> },
              {
                key: "deadline",
                header: "Deadline",
                render: (task) => (
                  <span
                    className={cn(
                      "tabular-nums",
                      deadlineTone(task.deadline, task.status) === "overdue" && "text-signal-critical"
                    )}
                  >
                    {formatDate(task.deadline)}
                  </span>
                ),
              },
              {
                key: "actions",
                header: "",
                headerClassName: "w-10",
                render: (task) => (
                  <IconButton
                    label="Remove from sprint"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeTask.mutate(task.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </IconButton>
                ),
              },
            ]}
          />

          {filtered.length > visible ? (
            <div className="border-t border-hairline p-3">
              <Button size="sm" onClick={() => setVisible((value) => value + VISIBLE_TASK_STEP)}>
                Show {Math.min(VISIBLE_TASK_STEP, filtered.length - visible)} more
              </Button>
            </div>
          ) : null}

          {backlog.length ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-hairline p-3">
              <Select
                value={taskToAdd}
                onChange={(event) => setTaskToAdd(event.target.value)}
                className="w-full sm:w-80"
              >
                <option value="">Add unplanned work to this sprint…</option>
                {backlog.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.ticket ? `${task.ticket.key} — ` : ""}
                    {task.title}
                  </option>
                ))}
              </Select>
              <Button disabled={!taskToAdd} loading={addTask.isPending} onClick={() => addTask.mutate(taskToAdd)}>
                Add
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
};

export const SprintsPage = ({ state }: { state: DashboardState }) => {
  const backlog = state.tasks.filter((task) => !task.sprintId && task.status !== "done");

  return (
    <>
      <PageHeader
        eyebrow="Planning"
        title="Sprints"
        description="Committed scope against a date range, with live progress. Sprints can be mirrored onto a Jira Scrum board."
      />

      <div className="space-y-4">
        <PlanSprint state={state} />

        {state.sprints.length ? (
          state.sprints.map((sprint) => (
            <SprintPanel key={sprint.id} sprint={sprint} state={state} backlog={backlog} />
          ))
        ) : (
          <EmptyState
            icon={<CalendarRange className="h-4 w-4" />}
            title="No sprints yet"
            description="Create one above, or ask the assistant to plan a sprint and move the right work into it."
          />
        )}
      </div>
    </>
  );
};
