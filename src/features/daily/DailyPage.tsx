import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState, TriageDayReport } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format/dates";
import { renderMarkdown } from "@/lib/format/markdown";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";

const statusTone = (status: string): string => {
  if (status === "applied") return "bg-signal-positive/10 text-signal-positive ring-signal-positive/25";
  if (status === "awaiting_approval") return "bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25";
  if (status === "rejected" || status === "failed") return "bg-signal-danger/10 text-signal-danger ring-signal-danger/25";
  return "bg-base-900/60 text-ink-muted";
};

const DayCard = ({ report }: { report: TriageDayReport }) => {
  const [open, setOpen] = useState(false);

  return (
    <Panel flush>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{formatDate(report.date)}</p>
          <p className="text-2xs text-ink-faint">
            {report.slots.length} triage slot{report.slots.length === 1 ? "" : "s"} · updated{" "}
            {formatDateTime(report.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {report.slots.map((slot) => (
            <Badge key={slot.runId} className={statusTone(slot.status)}>
              {slot.slot} · {slot.status.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </button>

      {open ? (
        <div className="space-y-4 border-t border-hairline p-4">
          {report.combinedSummary ? (
            <div>
              <PanelHeader title="Day standup" description="Both triage slots plus communications, rolled up." />
              <div
                className="prose-clarion mt-3 whitespace-pre-wrap text-xs text-ink-muted"
                dangerouslySetInnerHTML={{
                  __html: renderMarkdown(report.combinedSummary),
                }}
              />
            </div>
          ) : null}

          {report.slots.map((slot) => (
            <div key={slot.runId} className="rounded-lg border border-hairline bg-base-900/20 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-2xs text-ink">{slot.slot}</span>
                <Badge className={statusTone(slot.status)}>{slot.status.replace(/_/g, " ")}</Badge>
                <span className="text-2xs text-ink-faint">{slot.actionCount} proposed action(s)</span>
                {slot.decision ? (
                  <span className="text-2xs text-ink-faint">
                    decision {slot.decision.kind}
                    {slot.decision.approvedActionIds.length
                      ? ` · ${slot.decision.approvedActionIds.join(", ")}`
                      : ""}
                  </span>
                ) : null}
              </div>
              {slot.engineeringSummary ? (
                <div className="mb-3">
                  <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-ink-faint">Engineering</p>
                  <pre className="whitespace-pre-wrap font-sans text-2xs text-ink-muted">{slot.engineeringSummary}</pre>
                </div>
              ) : null}
              {slot.managerBrief ? (
                <div
                  className="prose-clarion text-xs"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(slot.managerBrief) }}
                />
              ) : (
                <p className="text-2xs text-ink-faint">No brief stored for this slot.</p>
              )}
            </div>
          ))}

          {report.communicationsDigest ? (
            <div>
              <p className="mb-1 text-2xs font-medium uppercase tracking-wide text-ink-faint">Communications</p>
              <pre className="whitespace-pre-wrap font-sans text-2xs text-ink-muted">{report.communicationsDigest}</pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
};

export const DailyPage = (_props: { state: DashboardState }) => {
  const days = useQuery({
    queryKey: queryKeys.triageDays,
    queryFn: () => api.triage.days(30),
  });

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Daily triage"
        description="Morning and afternoon triage reports (weekends: one at 15:00 IST). Treat these as the day’s standup — engineering, Slack, and proposed actions."
      />

      {days.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : days.error ? (
        <Callout tone="error">{(days.error as Error).message}</Callout>
      ) : !days.data?.length ? (
        <EmptyState
          icon={<CalendarDays className="h-4 w-4" />}
          title="No triage reports yet"
          description="Clarion runs triage at 10:00 and 15:00 IST on weekdays (15:00 only on weekends). Reports appear here after each run."
        />
      ) : (
        <ul className="space-y-3">
          {days.data.map((report) => (
            <li key={report.date}>
              <DayCard report={report} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
