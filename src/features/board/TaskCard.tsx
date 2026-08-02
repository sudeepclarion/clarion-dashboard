import { AlarmClock, FileText, GitBranch, MessageSquare, RotateCcw } from "lucide-react";
import type { Task } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { deadlineTone, formatDate } from "@/lib/format/dates";
import { AvatarGroup } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";

const DEADLINE_TONES = {
  overdue: "text-signal-critical",
  soon: "text-signal-caution",
  scheduled: "text-ink-faint",
  none: "text-ink-faint",
} as const;

export interface TaskCardProps {
  task: Task;
  sprintName: string | null;
  onOpen: (task: Task) => void;
  /** Drag handlers are supplied by the board so the card stays presentational. */
  draggable?: boolean;
  onDragStart?: (task: Task) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

/**
 * One task at a glance. The card answers four questions without opening anything:
 * what it is, who owns it, when it is due, and what happened last.
 */
export const TaskCard = ({
  task,
  sprintName,
  onOpen,
  draggable = false,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: TaskCardProps) => {
  const tone = deadlineTone(task.deadline, task.status);
  const moves = Math.max(0, task.deadlineHistory.length - 1);
  const lastNote = task.updates.at(-1)?.note;

  return (
    <article
      draggable={draggable}
      onDragStart={() => onDragStart?.(task)}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task)}
      className={cn(
        "group cursor-pointer rounded-lg border border-hairline bg-surface p-3 transition-all duration-150",
        "hover:border-cyan-clarion/30 hover:bg-surface-raised",
        isDragging && "opacity-40",
        draggable && "active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <p className="min-w-0 flex-1 text-xs font-medium leading-snug text-ink">{task.title}</p>
      </div>

      {task.ticket ? (
        <div className="mt-2">
          <Badge mono className="text-cyan-clarion/90">
            {task.ticket.key}
          </Badge>
        </div>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-2xs">
        <AvatarGroup names={task.assignees} max={3} />

        {task.deadline ? (
          <span className={cn("inline-flex items-center gap-1 tabular-nums", DEADLINE_TONES[tone])}>
            <AlarmClock className="h-3 w-3" />
            {formatDate(task.deadline)}
            {moves ? (
              <span title={`Deadline moved ${moves} time${moves === 1 ? "" : "s"}`} className="inline-flex items-center gap-0.5">
                <RotateCcw className="h-2.5 w-2.5" />
                {moves}
              </span>
            ) : null}
          </span>
        ) : null}

        {sprintName ? (
          <span className="inline-flex items-center gap-1 text-ink-faint">
            <GitBranch className="h-3 w-3" />
            {sprintName}
          </span>
        ) : null}

        {task.prd ? (
          <span className="inline-flex items-center gap-1 text-ink-faint" title="Has a PRD">
            <FileText className="h-3 w-3" />
            PRD
          </span>
        ) : null}

        {task.updates.length ? (
          <span className="inline-flex items-center gap-1 text-ink-faint" title={`${task.updates.length} updates`}>
            <MessageSquare className="h-3 w-3" />
            {task.updates.length}
          </span>
        ) : null}
      </div>

      {lastNote ? (
        <p className="mt-2.5 line-clamp-2 border-l-2 border-hairline pl-2 text-2xs leading-relaxed text-ink-faint">
          {lastNote}
        </p>
      ) : null}
    </article>
  );
};
