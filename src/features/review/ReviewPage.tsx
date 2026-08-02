import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Activity, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState } from "@/lib/api/types";
import { formatDate, isoDaysAgo } from "@/lib/format/dates";
import { sourceLabel } from "@/lib/format/status";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { TaskStatusPill } from "@/components/ui/StatusPill";
import { DataTable } from "@/components/ui/Table";

const PRESETS = [
  { label: "Last 7 days", days: 6 },
  { label: "Last 14 days", days: 13 },
  { label: "Last 30 days", days: 29 },
];

/**
 * The deterministic counterpart to the AI weekly report: what the record actually
 * says happened in a window. No model is involved, so it is instant and is the
 * evidence a manager checks the generated report against.
 */
export const ReviewPage = ({ state }: { state: DashboardState }) => {
  const [window, setWindow] = useState({ from: isoDaysAgo(6), to: isoDaysAgo(0) });

  const review = useQuery({
    queryKey: queryKeys.review(window.from, window.to),
    queryFn: () => api.reports.review(window),
  });

  return (
    <>
      <PageHeader
        eyebrow="Evidence"
        title="Weekly review"
        description="Exactly who touched what in a date window, and every deadline that moved with the reason it was given."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setWindow({ from: isoDaysAgo(preset.days), to: isoDaysAgo(0) })}
                className="rounded-md bg-surface-raised px-2.5 py-1.5 text-2xs text-ink-muted ring-1 ring-inset ring-hairline transition-colors hover:text-ink"
              >
                {preset.label}
              </button>
            ))}
            <Field label="From">
              <Input
                type="date"
                value={window.from}
                onChange={(event) => setWindow({ ...window, from: event.target.value })}
                className="w-36"
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={window.to}
                onChange={(event) => setWindow({ ...window, to: event.target.value })}
                className="w-36"
              />
            </Field>
          </div>
        }
      />

      {review.error ? <Callout tone="error">{(review.error as Error).message}</Callout> : null}

      <div className="space-y-4">
        <Panel flush>
          <div className="p-4">
            <PanelHeader
              title="Deadline & commitment log"
              description="Every deadline set or moved in this window, and how the change was communicated."
            />
          </div>
          <div className="border-t border-hairline">
            {review.isLoading ? (
              <div className="p-4">
                <SkeletonRows rows={3} />
              </div>
            ) : (
              <DataTable
                rows={review.data?.deadlineEvents ?? []}
                rowKey={(event) => `${event.taskId}-${event.at}-${event.to}`}
                empty={
                  <div className="px-4 py-10 text-center">
                    <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-signal-positive" />
                    <p className="text-xs text-ink-muted">No deadlines were set or moved in this window.</p>
                  </div>
                }
                columns={[
                  {
                    key: "task",
                    header: "Task",
                    className: "text-ink",
                    render: (event) => (
                      <Link to={`/board?task=${event.taskId}`} className="truncate hover:underline">
                        {event.task}
                      </Link>
                    ),
                  },
                  { key: "owner", header: "Owner", render: (event) => event.owner },
                  {
                    key: "change",
                    header: "Change",
                    render: (event) => (
                      <span className="tabular-nums">
                        <span className="text-ink-faint">{event.from ?? "none"}</span>
                        <span className="mx-1.5 text-ink-faint">→</span>
                        <span className="font-medium text-ink">{event.to}</span>
                      </span>
                    ),
                  },
                  { key: "reason", header: "How it was communicated", render: (event) => event.reason },
                  {
                    key: "source",
                    header: "Source",
                    render: (event) => <Badge>{sourceLabel(event.source)}</Badge>,
                  },
                  { key: "at", header: "When", render: (event) => formatDate(event.at) },
                ]}
              />
            )}
          </div>
        </Panel>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Who worked on what</h2>

          {review.isLoading ? (
            <SkeletonRows rows={4} />
          ) : review.data?.members.length ? (
            <div className="space-y-3">
              {review.data.members.map((row) => (
                <Panel key={row.member}>
                  <header className="flex items-center gap-2.5">
                    <Avatar name={row.member} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{row.member}</p>
                      <p className="text-2xs text-ink-faint">
                        {row.touched.length} {row.touched.length === 1 ? "task" : "tasks"} touched ·{" "}
                        {row.completed} completed
                        {row.blocked ? ` · ${row.blocked} blocked` : ""}
                      </p>
                    </div>
                  </header>

                  {row.touched.length ? (
                    <ul className="mt-3 space-y-2.5">
                      {row.touched.map((task) => (
                        <li key={task.id} className="border-l-2 border-hairline pl-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link to={`/board?task=${task.id}`} className="text-xs font-medium text-ink hover:underline">
                              {task.title}
                            </Link>
                            <TaskStatusPill status={task.status} />
                            {task.completedInWindow ? (
                              <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">
                                completed
                              </Badge>
                            ) : null}
                            {task.deadline ? (
                              <span className="text-2xs text-ink-faint">deadline {formatDate(task.deadline)}</span>
                            ) : null}
                          </div>
                          {task.updates.length ? (
                            <ul className="mt-1.5 space-y-1">
                              {task.updates.map((update, index) => (
                                <li key={index} className="text-2xs leading-relaxed text-ink-muted">
                                  {update.note}
                                  <span className="ml-1.5 text-ink-faint">({formatDate(update.at)})</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-2xs text-ink-faint">No recorded activity in this window.</p>
                  )}
                </Panel>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="h-4 w-4" />}
              title="No team members"
              description="Add your team in Settings to see per-person activity here."
            />
          )}
        </div>
      </div>

      {!state.integrations.capabilities.ai ? (
        <Callout tone="info" className="mt-4">
          This page never calls a model — it reads the recorded history directly. The written weekly report on the
          Reports page does need a model.
        </Callout>
      ) : null}
    </>
  );
};
