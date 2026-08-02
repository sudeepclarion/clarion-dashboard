import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, FileDown, FileText, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState } from "@/lib/api/types";
import { formatDate, formatDateTime, isoDaysAgo } from "@/lib/format/dates";
import { renderMarkdown } from "@/lib/format/markdown";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { openTeamReport } from "./teamReportDocument";

const LOOKBACKS = [7, 15, 30, 60];

const WeeklyReportEntry = ({ id, label, generatedAt }: { id: string; label: string; generatedAt: string }) => {
  const [open, setOpen] = useState(false);

  const report = useQuery({
    queryKey: queryKeys.report(id),
    queryFn: () => api.reports.getWeekly(id),
    enabled: open,
  });

  const remove = useDashboardMutation(() => api.reports.removeWeekly(id));

  return (
    <Panel flush>
      <div className="flex items-center gap-3 p-4">
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
            <p className="truncate text-sm font-medium text-ink">{label}</p>
            <p className="text-2xs text-ink-faint">generated {formatDateTime(generatedAt)}</p>
          </div>
        </button>
        <IconButton
          label="Delete report"
          variant="danger"
          onClick={() => {
            if (window.confirm("Delete this saved report?")) remove.mutate();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      {open ? (
        <div className="border-t border-hairline p-5">
          {report.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          ) : report.error ? (
            <Callout tone="error">{(report.error as Error).message}</Callout>
          ) : (
            <div
              className="prose-clarion"
              // Model-authored Markdown, escaped before rendering by renderMarkdown.
              dangerouslySetInnerHTML={{ __html: renderMarkdown(report.data?.content ?? "") }}
            />
          )}
        </div>
      ) : null}
    </Panel>
  );
};

export const ReportsPage = ({ state }: { state: DashboardState }) => {
  const aiReady = state.integrations.capabilities.ai;
  const [window_, setWindow] = useState({ from: isoDaysAgo(6), to: isoDaysAgo(0) });
  const [lookback, setLookback] = useState(15);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const generateWeekly = useDashboardMutation(() => api.reports.generateWeekly(window_));

  const buildTeamReport = useDashboardMutation(() => api.reports.teamActivity(lookback), {
    onSuccess: (report) => setPopupBlocked(!openTeamReport(report)),
  });

  return (
    <>
      <PageHeader
        eyebrow="Reporting"
        title="Reports"
        description="Written from recorded activity only — closures, progress notes and deadline changes. If the data is thin, the report says so instead of inventing work."
      />

      {!aiReady ? <AiUnavailableNotice feature="Written reports" /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Weekly performance report"
            description="Per-member sections covering what shipped, deadline adherence and blockers, plus cross-cutting risks. Each member's section is written from their own data, then synthesised."
          />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="From">
              <Input
                type="date"
                value={window_.from}
                onChange={(event) => setWindow({ ...window_, from: event.target.value })}
                className="w-36"
              />
            </Field>
            <Field label="To">
              <Input
                type="date"
                value={window_.to}
                onChange={(event) => setWindow({ ...window_, to: event.target.value })}
                className="w-36"
              />
            </Field>
            <Button
              variant="primary"
              icon={<Sparkles className="h-3.5 w-3.5" />}
              disabled={!aiReady || !state.members.length}
              loading={generateWeekly.isPending}
              onClick={() => generateWeekly.mutate()}
            >
              {generateWeekly.isPending ? "Writing…" : "Generate"}
            </Button>
          </div>

          {!state.members.length ? (
            <Callout tone="warning" className="mt-3">
              Add team members first — the report is organised per person.
            </Callout>
          ) : null}
          {generateWeekly.error ? (
            <Callout tone="error" className="mt-3">
              {generateWeekly.error.message}
            </Callout>
          ) : null}
          {generateWeekly.data ? (
            <Callout tone="success" className="mt-3">
              Report saved for {formatDate(generateWeekly.data.weekStart)} → {formatDate(generateWeekly.data.weekEnd)}.
            </Callout>
          ) : null}
        </Panel>

        <Panel>
          <PanelHeader
            title="Team activity report"
            description="A print-ready document: what each person is driving right now, plus a recap of the period. Opens in a new tab — choose “Save as PDF”."
          />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <Field label="Look back">
              <Select value={lookback} onChange={(event) => setLookback(Number(event.target.value))} className="w-32">
                {LOOKBACKS.map((days) => (
                  <option key={days} value={days}>
                    {days} days
                  </option>
                ))}
              </Select>
            </Field>
            <Button
              variant="primary"
              icon={<FileDown className="h-3.5 w-3.5" />}
              disabled={!aiReady || !state.members.length}
              loading={buildTeamReport.isPending}
              onClick={() => buildTeamReport.mutate()}
            >
              {buildTeamReport.isPending ? "Building…" : "Export"}
            </Button>
          </div>

          {buildTeamReport.error ? (
            <Callout tone="error" className="mt-3">
              {buildTeamReport.error.message}
            </Callout>
          ) : null}
          {popupBlocked ? (
            <Callout tone="warning" className="mt-3">
              Your browser blocked the new tab. Allow pop-ups for this site and export again.
            </Callout>
          ) : null}
        </Panel>
      </div>

      <div className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Saved reports</h2>
        {state.reports.length ? (
          <div className="space-y-3">
            {state.reports.map((report) => (
              <WeeklyReportEntry
                key={report.id}
                id={report.id}
                label={`${formatDate(report.weekStart)} → ${formatDate(report.weekEnd)}`}
                generatedAt={report.generatedAt}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText className="h-4 w-4" />}
            title="No saved reports"
            description="Generate a weekly report above. Saved reports keep their full text so you can compare weeks later."
          />
        )}
      </div>
    </>
  );
};
