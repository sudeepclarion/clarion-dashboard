import { useState } from "react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, TaskDraft, TaskStatus } from "@/lib/api/types";
import { TASK_STATUSES } from "@/lib/api/types";
import { taskStatusStyle } from "@/lib/format/status";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

const EMPTY: TaskDraft = {
  title: "",
  description: "",
  assignees: [],
  status: "backlog",
  deadline: "",
  sprintId: "",
  prd: "",
};

export interface NewTaskDialogProps {
  open: boolean;
  state: DashboardState;
  /** Pre-selects the column the task was created from. */
  defaultStatus?: TaskStatus;
  defaultSprintId?: string;
  onClose: () => void;
}

export const NewTaskDialog = ({ open, state, defaultStatus, defaultSprintId, onClose }: NewTaskDialogProps) => {
  const [draft, setDraft] = useState<TaskDraft>({
    ...EMPTY,
    status: defaultStatus ?? "backlog",
    sprintId: defaultSprintId ?? "",
  });

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]): void =>
    setDraft((current) => ({ ...current, [key]: value }));

  const create = useDashboardMutation((payload: TaskDraft) => api.tasks.create(payload), {
    onSuccess: () => {
      setDraft({ ...EMPTY, status: defaultStatus ?? "backlog", sprintId: defaultSprintId ?? "" });
      onClose();
    },
  });

  const submit = (): void => {
    if (!draft.title.trim()) return;
    create.mutate({
      ...draft,
      title: draft.title.trim(),
      deadline: draft.deadline || null,
      sprintId: draft.sprintId || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      description="Anything created here is auditable the same way standup- and assistant-created work is."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!draft.title.trim()} loading={create.isPending} onClick={submit}>
            Create task
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {create.error ? <Callout tone="error">{create.error.message}</Callout> : null}

        <Field label="Title">
          <Input
            autoFocus
            value={draft.title}
            onChange={(event) => set("title", event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Add retry handling to the payment webhook"
          />
        </Field>

        <Field label="Description">
          <Textarea rows={3} value={draft.description} onChange={(event) => set("description", event.target.value)} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status">
            <Select value={draft.status} onChange={(event) => set("status", event.target.value as TaskStatus)}>
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {taskStatusStyle(status).label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Deadline">
            <Input type="date" value={draft.deadline ?? ""} onChange={(event) => set("deadline", event.target.value)} />
          </Field>

          <Field label="Sprint">
            <Select value={draft.sprintId ?? ""} onChange={(event) => set("sprintId", event.target.value)}>
              <option value="">No sprint</option>
              {state.sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Assignees" hint="Ctrl/Cmd-click for more than one">
            <select
              multiple
              value={draft.assignees}
              onChange={(event) =>
                set("assignees", [...event.target.selectedOptions].map((option) => option.value))
              }
              className="h-20 w-full rounded-lg border border-hairline bg-base-900/60 px-2 py-1.5 text-xs text-ink focus:border-cyan-clarion/50 focus:outline-none"
            >
              {state.members.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="PRD" hint="A link or the document text.">
          <Textarea rows={2} value={draft.prd} onChange={(event) => set("prd", event.target.value)} />
        </Field>
      </div>
    </Modal>
  );
};
