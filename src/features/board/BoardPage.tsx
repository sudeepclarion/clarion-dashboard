import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { KanbanSquare, LayoutGrid, Plus, RefreshCw, Rows3, Search } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Task, TaskStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { deadlineTone, formatDate, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { TaskStatusPill } from "@/components/ui/StatusPill";
import { DataTable } from "@/components/ui/Table";
import { BoardColumn } from "./BoardColumn";
import { applyFilters, type Filters } from "./boardFilters";
import { NewTaskDialog } from "./NewTaskDialog";
import { TaskDrawer } from "./TaskDrawer";

type ViewMode = "board" | "table";

export const BoardPage = ({ state }: { state: DashboardState }) => {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>("board");
  const [dragging, setDragging] = useState<Task | null>(null);
  const [creatingIn, setCreatingIn] = useState<TaskStatus | null>(null);

  const [filters, setFilters] = useState<Filters>(() => ({
    search: "",
    assignee: params.get("assignee") ?? "",
    sprintId: "",
    onlyOverdue: params.get("filter") === "overdue",
    showDone: false,
  }));

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]): void =>
    setFilters((current) => ({ ...current, [key]: value }));

  // A `?task=` param deep-links straight into a task from anywhere in the app.
  const selectedId = params.get("task");
  const selected = selectedId ? state.tasks.find((task) => task.id === selectedId) : undefined;

  const openTask = (task: Task): void => {
    const next = new URLSearchParams(params);
    next.set("task", task.id);
    setParams(next, { replace: true });
  };

  const closeTask = (): void => {
    const next = new URLSearchParams(params);
    next.delete("task");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => applyFilters(state.tasks, filters), [state.tasks, filters]);

  const moveTask = useDashboardMutation(({ task, status }: { task: Task; status: TaskStatus }) =>
    api.tasks.setStatus(task.id, status)
  );

  const syncJira = useDashboardMutation(() => api.integrations.jira.sync());

  const statusParam = params.get("status") as TaskStatus | null;
  const columns = statusParam ? [statusParam] : state.statuses;

  return (
    <>
      <PageHeader
        eyebrow="Delivery"
        title="Board"
        description="Every piece of tracked work, whoever or whatever created it. Drag a card to change its state."
        actions={
          <>
            {state.integrations.capabilities.jira ? (
              <Button
                icon={<RefreshCw className={cn("h-3.5 w-3.5", syncJira.isPending && "animate-spin")} />}
                loading={syncJira.isPending}
                onClick={() => syncJira.mutate()}
              >
                Sync Jira
              </Button>
            ) : null}
            <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreatingIn("backlog")}>
              New task
            </Button>
          </>
        }
      />

      {syncJira.error ? (
        <Callout tone="error" className="mb-3">
          {syncJira.error.message}
        </Callout>
      ) : null}
      {syncJira.data ? (
        <Callout tone="success" className="mb-3">
          Jira sync complete — {syncJira.data.imported} imported, {syncJira.data.updated} updated of{" "}
          {syncJira.data.total} board tickets.
        </Callout>
      ) : null}

      <Panel className="mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[13rem] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-faint" />
            <Input
              value={filters.search}
              onChange={(event) => setFilter("search", event.target.value)}
              placeholder="Search title, ticket key or owner…"
              className="pl-8"
            />
          </div>

          <Select
            value={filters.assignee}
            onChange={(event) => setFilter("assignee", event.target.value)}
            className="w-40"
          >
            <option value="">All owners</option>
            <option value="unassigned">Unassigned</option>
            {state.members.map((member) => (
              <option key={member.id} value={member.name}>
                {member.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.sprintId}
            onChange={(event) => setFilter("sprintId", event.target.value)}
            className="w-40"
          >
            <option value="">All sprints</option>
            <option value="none">No sprint</option>
            {state.sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </Select>

          <label className="flex items-center gap-1.5 text-2xs text-ink-muted">
            <input
              type="checkbox"
              checked={filters.onlyOverdue}
              onChange={(event) => setFilter("onlyOverdue", event.target.checked)}
              className="h-3.5 w-3.5 rounded border-hairline bg-base-900 accent-cyan-clarion"
            />
            Overdue only
          </label>

          <label className="flex items-center gap-1.5 text-2xs text-ink-muted">
            <input
              type="checkbox"
              checked={filters.showDone}
              onChange={(event) => setFilter("showDone", event.target.checked)}
              className="h-3.5 w-3.5 rounded border-hairline bg-base-900 accent-cyan-clarion"
            />
            Include done
          </label>

          <div className="ml-auto flex items-center gap-1 rounded-lg bg-base-900/60 p-0.5">
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs transition-colors",
                view === "board" ? "bg-surface-raised text-ink" : "text-ink-faint hover:text-ink"
              )}
            >
              <LayoutGrid className="h-3 w-3" /> Board
            </button>
            <button
              type="button"
              onClick={() => setView("table")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-2xs transition-colors",
                view === "table" ? "bg-surface-raised text-ink" : "text-ink-faint hover:text-ink"
              )}
            >
              <Rows3 className="h-3 w-3" /> Table
            </button>
          </div>
        </div>

        <p className="mt-2.5 text-2xs text-ink-faint">
          Showing {filtered.length} of {state.tasks.length} tasks
        </p>
      </Panel>

      {!state.tasks.length ? (
        <EmptyState
          icon={<KanbanSquare className="h-4 w-4" />}
          title="No work tracked yet"
          description="Create a task, paste a standup, or sync a Jira board to populate Clarion."
          action={
            <Button variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreatingIn("backlog")}>
              New task
            </Button>
          }
        />
      ) : view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {columns.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              state={state}
              tasks={filtered.filter((task) => task.status === status)}
              onOpen={openTask}
              onDropTask={(task, nextStatus) => moveTask.mutate({ task, status: nextStatus })}
              dragging={dragging}
              setDragging={setDragging}
              onAdd={setCreatingIn}
            />
          ))}
        </div>
      ) : (
        <Panel flush>
          <DataTable
            rows={filtered}
            rowKey={(task) => task.id}
            onRowClick={openTask}
            empty={<div className="px-4 py-10 text-center text-xs text-ink-faint">No tasks match these filters.</div>}
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
              { key: "owner", header: "Owner", render: (task) => <AvatarGroup names={task.assignees} /> },
              { key: "status", header: "Status", render: (task) => <TaskStatusPill status={task.status} /> },
              {
                key: "sprint",
                header: "Sprint",
                render: (task) => state.sprints.find((sprint) => sprint.id === task.sprintId)?.name ?? "—",
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
              {
                key: "updated",
                header: "Updated",
                render: (task) => <span className="text-ink-faint">{relativeTime(task.updatedAt)}</span>,
              },
            ]}
          />
        </Panel>
      )}

      {selected ? <TaskDrawer task={selected} state={state} onClose={closeTask} /> : null}

      {creatingIn ? (
        <NewTaskDialog
          open
          state={state}
          defaultStatus={creatingIn}
          onClose={() => setCreatingIn(null)}
        />
      ) : null}
    </>
  );
};
