import { useState } from "react";
import { Plus } from "lucide-react";
import type { DashboardState, Task, TaskStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { taskStatusStyle } from "@/lib/format/status";
import { TaskCard } from "./TaskCard";

/**
 * One board column, including its own drop target. Drag state is owned by the page
 * so a card can move between columns; the column only reports the drop.
 */
export const BoardColumn = ({
  status,
  tasks,
  state,
  onOpen,
  onDropTask,
  dragging,
  setDragging,
  onAdd,
}: {
  status: TaskStatus;
  tasks: Task[];
  state: DashboardState;
  onOpen: (task: Task) => void;
  onDropTask: (task: Task, status: TaskStatus) => void;
  dragging: Task | null;
  setDragging: (task: Task | null) => void;
  onAdd: (status: TaskStatus) => void;
}) => {
  const [isTarget, setIsTarget] = useState(false);
  const style = taskStatusStyle(status);
  const sprintName = (sprintId: string | null): string | null =>
    state.sprints.find((sprint) => sprint.id === sprintId)?.name ?? null;

  return (
    <div
      onDragOver={(event) => {
        if (!dragging) return;
        event.preventDefault();
        setIsTarget(true);
      }}
      onDragLeave={() => setIsTarget(false)}
      onDrop={() => {
        setIsTarget(false);
        if (dragging && dragging.status !== status) onDropTask(dragging, status);
        setDragging(null);
      }}
      className={cn(
        "flex min-h-[12rem] w-[17.5rem] shrink-0 flex-col rounded-xl border bg-base-900/30 transition-colors",
        "lg:w-auto lg:min-w-0 lg:flex-1",
        isTarget ? "border-cyan-clarion/50 bg-cyan-clarion/[0.04]" : "border-hairline"
      )}
    >
      <header className={cn("flex items-center gap-2 border-b-2 px-3 py-2.5", style.accent)}>
        <span className="text-xs font-semibold text-ink">{style.label}</span>
        <span className="rounded bg-base-900/70 px-1.5 py-0.5 text-[10px] tabular-nums text-ink-faint">
          {tasks.length}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          aria-label={`Add task to ${style.label}`}
          onClick={() => onAdd(status)}
          className="text-ink-faint transition-colors hover:text-cyan-clarion"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            sprintName={sprintName(task.sprintId)}
            onOpen={onOpen}
            draggable
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            isDragging={dragging?.id === task.id}
          />
        ))}
        {!tasks.length ? (
          <p className="px-2 py-6 text-center text-2xs text-ink-faint">Nothing here.</p>
        ) : null}
      </div>
    </div>
  );
};
