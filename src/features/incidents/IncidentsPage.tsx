import { useState } from "react";
import { ChevronDown, ChevronRight, Radar, Siren } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Incident, IncidentReport } from "@/lib/api/types";
import { SEVERITY_STYLES } from "@/lib/format/status";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice, IntegrationRequiredNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { IncidentStatePill, SeverityPill } from "@/components/ui/StatusPill";

const WINDOWS = [
  { hours: 24, label: "Last 24 hours" },
  { hours: 48, label: "Last 48 hours" },
  { hours: 72, label: "Last 72 hours" },
  { hours: 168, label: "Last week" },
];

const IncidentRow = ({ incident }: { incident: Incident }) => (
  <article className="rounded-lg border border-hairline bg-base-900/40 p-3">
    <div className={`mb-2.5 h-0.5 w-10 rounded-full ${SEVERITY_STYLES[incident.severity].bar}`} aria-hidden />

    <div className="flex flex-wrap items-center gap-2">
      <h3 className="min-w-0 flex-1 text-xs font-semibold text-ink">{incident.title}</h3>
      <SeverityPill severity={incident.severity} />
      <IncidentStatePill status={incident.status} />
    </div>

    <p className="mt-1.5 text-2xs text-ink-faint">
      {incident.channel}
      {incident.firstSeen ? ` · first seen ${incident.firstSeen}` : ""}
      {incident.peopleInvolved.length ? ` · ${incident.peopleInvolved.join(", ")}` : ""}
    </p>

    <p className="mt-2 text-xs leading-relaxed text-ink-muted">{incident.summary}</p>

    {incident.suggestedAction ? (
      <p className="mt-2 rounded-md bg-cyan-clarion/[0.06] px-2.5 py-1.5 text-2xs text-ink-muted">
        <span className="font-medium text-cyan-clarion">Suggested next step </span>
        {incident.suggestedAction}
      </p>
    ) : null}
  </article>
);

const ReportPanel = ({ report, defaultOpen }: { report: IncidentReport; defaultOpen: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  const counts = report.incidents.reduce<Record<string, number>>((acc, incident) => {
    acc[incident.severity] = (acc[incident.severity] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Panel flush>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">
              {report.source === "triage" && report.triageDate
                ? `Triage ${report.triageDate} · ${report.triageSlot ?? "—"} IST`
                : `Last ${report.windowHours}h`}
            </h2>
            {report.source === "triage" ? (
              <Badge className="bg-violet-electric/10 text-violet-electric ring-violet-electric/25">
                triage
              </Badge>
            ) : null}
            {report.incidents.length ? (
              <>
                {(["critical", "high", "medium", "low"] as const)
                  .filter((severity) => counts[severity])
                  .map((severity) => (
                    <Badge key={severity} className={SEVERITY_STYLES[severity].pill}>
                      {counts[severity]} {severity}
                    </Badge>
                  ))}
              </>
            ) : (
              <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">clean</Badge>
            )}
          </div>
          <p className="mt-1 text-2xs text-ink-faint">
            {formatDateTime(report.generatedAt)}
            {report.source === "triage"
              ? " · from daily triage"
              : ` · ${report.messagesScanned} messages across ${report.channelsScanned.length} channels`}
          </p>
        </div>
        <span className="shrink-0 text-2xs text-ink-faint">{relativeTime(report.generatedAt)}</span>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-hairline p-4">
          {report.overview ? (
            <p className="text-xs leading-relaxed text-ink-muted">{report.overview}</p>
          ) : null}
          {report.incidents.length ? (
            report.incidents.map((incident, index) => <IncidentRow key={index} incident={incident} />)
          ) : (
            <Callout tone="success">No incidents were detected in this window.</Callout>
          )}
          <p className="text-[10px] text-ink-faint">Scanned: {report.channelsScanned.join(", ")}</p>
        </div>
      ) : null}
    </Panel>
  );
};

export const IncidentsPage = ({ state }: { state: DashboardState }) => {
  const [hours, setHours] = useState(48);
  const capabilities = state.integrations.capabilities;
  const canScan = capabilities.slack && capabilities.ai;

  const scan = useDashboardMutation(() => api.incidents.scan(hours));

  return (
    <>
      <PageHeader
        eyebrow="Reliability"
        title="Incidents"
        description="Clarion reads Slack (manual scan) and daily triage for outages, user-facing bugs, failed deploys, and urgent escalations — each triage slot is stored as its own dated report."
        actions={
          <>
            <Select value={hours} onChange={(event) => setHours(Number(event.target.value))} className="w-40">
              {WINDOWS.map((window) => (
                <option key={window.hours} value={window.hours}>
                  {window.label}
                </option>
              ))}
            </Select>
            <Button
              variant="primary"
              icon={<Radar className="h-3.5 w-3.5" />}
              disabled={!canScan}
              loading={scan.isPending}
              onClick={() => scan.mutate()}
            >
              {scan.isPending ? "Scanning Slack…" : "Run scan"}
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        {!capabilities.slack ? (
          <IntegrationRequiredNotice integration="Slack" feature="Incident scanning" envVar="SLACK_BOT_TOKEN" />
        ) : null}
        {capabilities.slack && !capabilities.ai ? <AiUnavailableNotice feature="Incident analysis" /> : null}
        {scan.error ? <Callout tone="error">{scan.error.message}</Callout> : null}

        {state.incidentReports.length ? (
          state.incidentReports.map((report, index) => (
            <ReportPanel key={report.id} report={report} defaultOpen={index === 0} />
          ))
        ) : (
          <EmptyState
            icon={<Siren className="h-4 w-4" />}
            title="No scans yet"
            description="Run a scan to turn the last few days of Slack into a ranked incident report you can act on."
          />
        )}

        <Panel>
          <PanelHeader
            title="How the scan stays accurate"
            description="Each channel is analysed in bounded batches so a busy workspace costs more calls, never a bigger context. A thread about one problem is grouped into a single incident, and the executive overview is written only from the extracted incidents — never from raw messages."
          />
        </Panel>
      </div>
    </>
  );
};
