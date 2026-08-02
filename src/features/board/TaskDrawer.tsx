import { useEffect, useState } from "react";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Task, TaskPatch, TaskStatus } from "@/lib/api/types";
import { TASK_STATUSES } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format/dates";
import { sourceLabel, taskStatusStyle } from "@/lib/format/status";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";

interface DraftState {
  status: TaskStatus;
  assignees: string[];
  deadline: string;
  deadlineReason: string;
  sprintId: string;
  description: string;
  note: string;
  prd: string;
}

const toDraft = (task: Task): DraftState => ({
  status: task.status,
  assignees: task.assignees,
  deadline: task.deadline ?? "",
  deadlineReason: "",
  sprintId: task.sprintId ?? "",
  description: task.description,
  note: "",
  prd: "",
});

/**
 * Build a patch containing only what actually changed. Sending untouched fields
 * would pollute the audit trail with no-op "changes".
 */
const buildPatch = (task: Task, draft: DraftState): TaskPatch => {
  const patch: TaskPatch = {};
  if (draft.status !== task.status) patch.status = draft.status;
  if (draft.description !== task.description) patch.description = draft.description;
  if (draft.sprintId !== (task.sprintId ?? "")) patch.sprintId = draft.sprintId || null;
  if (draft.assignees.join("|") !== task.assignees.join("|")) patch.assignees = draft.assignees;
  if (draft.deadline && draft.deadline !== task.deadline) {
    patch.deadline = draft.deadline;
    patch.deadlineReason = draft.deadlineReason || "Updated from the dashboard";
  }
  if (draft.note.trim()) patch.note = draft.note.trim();
  if (draft.prd.trim()) patch.prd = draft.prd.trim();
  return patch;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="border-t border-hairline pt-4">
    <h3 className="eyebrow mb-2.5">{title}</h3>
    {children}
  </section>
);

const JiraPanel = ({ task, state }: { task: Task; state: DashboardState }) => {
  const [key, setKey] = useState("");
  const link = useDashboardMutation((issueKey: string) => api.tasks.linkTicket(task.id, issueKey));
  const create = useDashboardMutation(() => api.tasks.createTicket(task.id));
  const browseUrl = task.ticket ? `${state.integrations.jira.baseUrl}/browse/${task.ticket.key}` : null;

  if (task.ticket) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <a
            href={browseUrl ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-clarion hover:underline"
          >
            {task.ticket.key}
            <ExternalLink className="h-3 w-3" />
          </a>
          <Badge>{task.ticket.statusName ?? "unknown"}</Badge>
        </div>
        <p className="text-2xs text-ink-faint">
          Synced {formatDateTime(task.ticket.syncedAt)}. Status, deadline and assignee changes here update the ticket
          automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={key}
          onChange={(event) => setKey(event.target.value.toUpperCase())}
          placeholder={`${state.integrations.jira.projectKey}-123`}
          className="w-32 font-mono"
        />
        <Button
          icon={<Link2 className="h-3.5 w-3.5" />}
          loading={link.isPending}
          disabled={!key.trim()}
          onClick={() => link.mutate(key.trim())}
        >
          Link existing
        </Button>
        <Button icon={<Plus className="h-3.5 w-3.5" />} loading={create.isPending} onClick={() => create.mutate()}>
          Create ticket
        </Button>
      </div>
      {link.error ? <Callout tone="error">{link.error.message}</Callout> : null}
      {create.error ? <Callout tone="error">{create.error.message}</Callout> : null}
    </div>
  );
};

export interface TaskDrawerProps {
  task: Task;
  state: DashboardState;
  onClose: () => void;
}

/**
 * The full record for one task: editable fields plus the complete deadline and
 * update history. History is read-only and always visible — it is the evidence
 * behind the weekly report.
 */
export const TaskDrawer = ({ task, state, onClose }: TaskDrawerProps) => {
  const [draft, setDraft] = useState<DraftState>(() => toDraft(task));

  // Re-seed when the underlying task changes (a refetch, or a different task).
  useEffect(() => setDraft(toDraft(task)), [task]);

  const set = <K extends keyof DraftState>(key: K, value: DraftState[K]): void =>
    setDraft((current) => ({ ...current, [key]: value }));

  const save = useDashboardMutation((patch: TaskPatch) => api.tasks.update(task.id, patch), {
    onSuccess: () => onClose(),
  });
  const remove = useDashboardMutation(() => api.tasks.remove(task.id), { onSuccess: () => onClose() });

  const patch = buildPatch(task, draft);
  const hasChanges = Object.keys(patch).length > 0;
  const capabilities = state.integrations.capabilities;

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={task.title}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-2xs ${taskStatusStyle(task.status).pill}`}>
            {taskStatusStyle(task.status).label}
          </span>
          <span className="font-mono text-2xs text-ink-faint">{task.id}</span>
          <span className="text-2xs text-ink-faint">created {formatDate(task.createdAt)}</span>
        </span>
      }
      footer={
        <>
          <Button
            variant="danger"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            loading={remove.isPending}
            onClick={() => {
              if (window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
                remove.mutate();
              }
            }}
          >
            Delete
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!hasChanges} loading={save.isPending} onClick={() => save.mutate(patch)}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {save.error ? <Callout tone="error">{save.error.message}</Callout> : null}

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

          <Field label="Sprint">
            <Select value={draft.sprintId} onChange={(event) => set("sprintId", event.target.value)}>
              <option value="">No sprint</option>
              {state.sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Assignees" hint="Ctrl/Cmd-click to select more than one">
            <select
              multiple
              value={draft.assignees}
              onChange={(event) =>
                set("assignees", [...event.target.selectedOptions].map((option) => option.value))
              }
              className="h-24 w-full rounded-lg border border-hairline bg-base-900/60 px-2 py-1.5 text-xs text-ink focus:border-cyan-clarion/50 focus:outline-none"
            >
              {state.members.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </Field>

          <div className="space-y-3">
            <Field label="Deadline">
              <Input type="date" value={draft.deadline} onChange={(event) => set("deadline", event.target.value)} />
            </Field>
            {draft.deadline && draft.deadline !== task.deadline ? (
              <Field label="Why is it moving?" hint="Recorded in deadline history and used in the weekly report.">
                <Input
                  value={draft.deadlineReason}
                  onChange={(event) => set("deadlineReason", event.target.value)}
                  placeholder="Client pushed the release"
                />
              </Field>
            ) : null}
          </div>
        </div>

        <Field label="Description">
          <Textarea rows={3} value={draft.description} onChange={(event) => set("description", event.target.value)} />
        </Field>

        <Field label="Add a progress note" hint="Appended to the update trail with today's timestamp.">
          <Textarea
            rows={2}
            value={draft.note}
            onChange={(event) => set("note", event.target.value)}
            placeholder="Webhook retries deployed to staging; waiting on QA sign-off."
          />
        </Field>

        {capabilities.jira ? (
          <Section title="Jira">
            <JiraPanel task={task} state={state} />
          </Section>
        ) : null}

        <Section title="PRD">
          {task.prd ? (
            task.prd.type === "link" ? (
              <a
                href={task.prd.content}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-clarion hover:underline"
              >
                {task.prd.content}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-base-900/70 p-3 text-2xs leading-relaxed text-ink-muted">
                {task.prd.content}
              </pre>
            )
          ) : (
            <p className="text-2xs text-ink-faint">Nothing attached yet.</p>
          )}
          <Textarea
            className="mt-2"
            rows={2}
            value={draft.prd}
            onChange={(event) => set("prd", event.target.value)}
            placeholder="Paste a PRD link or the document text to attach it"
          />
        </Section>

        {task.deadlineHistory.length ? (
          <Section title="Deadline history">
            <ol className="space-y-2">
              {[...task.deadlineHistory].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="border-l-2 border-hairline pl-3">
                  <p className="text-xs text-ink">
                    <span className="tabular-nums text-ink-muted">{entry.from ?? "none"}</span>
                    <span className="mx-1.5 text-ink-faint">→</span>
                    <span className="font-medium tabular-nums">{entry.to}</span>
                  </p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    {entry.reason} · {sourceLabel(entry.source)} · {formatDate(entry.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        {task.updates.length ? (
          <Section title={`Update trail (${task.updates.length})`}>
            <ol className="space-y-2">
              {[...task.updates].reverse().map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="border-l-2 border-hairline pl-3">
                  <p className="text-xs leading-relaxed text-ink-muted">{entry.note}</p>
                  <p className="mt-0.5 text-2xs text-ink-faint">
                    {sourceLabel(entry.by)} · {formatDateTime(entry.at)}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
        ) : null}
      </div>
    </Modal>
  );
};
