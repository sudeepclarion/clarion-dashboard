import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, CheckCircle2, Download, Mic, Video } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { AvailableMeeting, DashboardState, MeetingChange, MeetingRecord } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";

const WINDOWS = [
  { days: 3, label: "Last 3 days" },
  { days: 7, label: "Last week" },
  { days: 14, label: "Last 2 weeks" },
  { days: 30, label: "Last 30 days" },
];

const ACTION_STYLES: Record<MeetingChange["action"], string> = {
  created: "bg-signal-positive/10 text-signal-positive ring-signal-positive/25",
  updated: "bg-state-progress/10 text-state-progress ring-state-progress/25",
  skipped: "bg-ink-faint/10 text-ink-faint ring-ink-faint/20",
};

/**
 * One extracted item. Skipped items are shown too, with the reason — a manager needs
 * to see what Clarion chose *not* to act on as much as what it did.
 */
const ChangeRow = ({ change }: { change: MeetingChange }) => (
  <li className="rounded-lg border border-hairline bg-base-900/40 p-3">
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={ACTION_STYLES[change.action]}>{change.action}</Badge>
      {change.taskId ? (
        <Link to={`/board?task=${change.taskId}`} className="min-w-0 flex-1 truncate text-xs text-cyan-clarion hover:underline">
          {change.taskTitle}
        </Link>
      ) : (
        <span className="min-w-0 flex-1 truncate text-xs text-ink">{change.taskTitle}</span>
      )}
      {change.owner ? <Badge>{change.owner}</Badge> : <Badge className="text-ink-faint">no owner named</Badge>}
    </div>

    <p className="mt-1.5 text-2xs leading-relaxed text-ink-muted">{change.summary}</p>

    {change.changes.length ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {change.changes.map((entry, index) => (
          <span key={index} className="rounded bg-base-900/70 px-1.5 py-0.5 font-mono text-[10px] text-ink-faint">
            {entry}
          </span>
        ))}
      </div>
    ) : null}

    {change.reason ? (
      <p className="mt-2 rounded-md bg-signal-caution/[0.07] px-2 py-1.5 text-2xs text-signal-caution">
        {change.reason}
      </p>
    ) : null}
  </li>
);

const IngestedMeeting = ({ meeting }: { meeting: MeetingRecord }) => {
  const [showTranscript, setShowTranscript] = useState(false);
  const applied = meeting.appliedChanges.filter((change) => change.action !== "skipped").length;

  return (
    <Panel>
      <PanelHeader
        title={meeting.title}
        eyebrow={meeting.providerName}
        description={
          <>
            {formatDateTime(meeting.startedAt)} · {meeting.participants.length || "unknown"} participants ·
            ingested {relativeTime(meeting.ingestedAt)}
          </>
        }
        actions={<Badge>{applied} applied</Badge>}
      />

      {meeting.decisions.length ? (
        <div className="mt-4">
          <h3 className="eyebrow mb-2">Decisions</h3>
          <ul className="space-y-1.5">
            {meeting.decisions.map((decision, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-signal-positive" />
                {decision}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {meeting.risks.length ? (
        <div className="mt-4">
          <h3 className="eyebrow mb-2">Risks raised</h3>
          <ul className="space-y-1.5">
            {meeting.risks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-signal-caution" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {meeting.appliedChanges.length ? (
        <div className="mt-4">
          <h3 className="eyebrow mb-2">Board changes</h3>
          <ul className="space-y-2">
            {meeting.appliedChanges.map((change, index) => (
              <ChangeRow key={index} change={change} />
            ))}
          </ul>
        </div>
      ) : (
        <Callout tone="info" className="mt-4">
          No commitments were found in this call — nothing was created or changed.
        </Callout>
      )}

      <button
        type="button"
        onClick={() => setShowTranscript((value) => !value)}
        className="mt-4 text-2xs text-ink-muted transition-colors hover:text-ink"
      >
        {showTranscript ? "▾ Hide transcript" : "▸ Show transcript"}
      </button>
      {showTranscript ? (
        <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-base-900/60 p-3 text-2xs leading-relaxed text-ink-muted">
          {meeting.transcript}
        </pre>
      ) : null}
    </Panel>
  );
};

const AvailableRow = ({ meeting, aiReady }: { meeting: AvailableMeeting; aiReady: boolean }) => {
  const ingest = useDashboardMutation(() => api.meetings.ingest(meeting.providerId, meeting.id));

  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-hairline/60 px-4 py-3 last:border-0">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-base-900/60 text-ink-faint">
        {meeting.providerId === "google-meet" ? <Video className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium text-ink">{meeting.title}</p>
        <p className="mt-0.5 text-2xs text-ink-faint">
          {meeting.providerName} · {formatDateTime(meeting.startedAt)}
          {meeting.durationMinutes ? ` · ${meeting.durationMinutes} min` : ""}
          {meeting.participants.length ? ` · ${meeting.participants.slice(0, 3).join(", ")}` : ""}
        </p>
      </div>

      {!meeting.hasTranscript ? (
        <Badge className="text-ink-faint">no transcript</Badge>
      ) : meeting.ingested ? (
        <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">ingested</Badge>
      ) : (
        <Button
          size="sm"
          icon={<Download className="h-3 w-3" />}
          disabled={!aiReady}
          loading={ingest.isPending}
          onClick={() => ingest.mutate()}
        >
          Extract work
        </Button>
      )}

      {ingest.error ? (
        <p className="w-full text-2xs text-signal-critical">{ingest.error.message}</p>
      ) : null}
    </li>
  );
};

export const MeetingsPage = ({ state }: { state: DashboardState }) => {
  const [tab, setTab] = useState("available");
  const [days, setDays] = useState(7);

  const capabilities = state.integrations.capabilities;
  const aiReady = capabilities.ai;

  const available = useQuery({
    queryKey: ["meetings", "available", days],
    queryFn: () => api.meetings.available({ days, limit: 40 }),
    enabled: capabilities.meetings && tab === "available",
  });

  const connectedProviders = state.integrations.categories
    .find((category) => category.category === "meetings")
    ?.providers.filter((provider) => provider.configured) ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Calls"
        title="Meetings"
        description="Pull a transcript and Clarion turns what was actually committed into tracked work — with the owner and date that were agreed. Discussion stays discussion."
        actions={
          <>
            {connectedProviders.map((provider) => (
              <Badge key={provider.id} className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">
                {provider.name}
              </Badge>
            ))}
            {tab === "available" ? (
              <Select value={days} onChange={(event) => setDays(Number(event.target.value))} className="w-36">
                {WINDOWS.map((window) => (
                  <option key={window.days} value={window.days}>
                    {window.label}
                  </option>
                ))}
              </Select>
            ) : null}
          </>
        }
      />

      {!capabilities.meetings ? (
        <Callout tone="warning" className="mb-4">
          No meeting platform is connected. Google Meet needs{" "}
          <code className="font-mono text-[11px]">GOOGLE_CLIENT_ID</code>,{" "}
          <code className="font-mono text-[11px]">GOOGLE_CLIENT_SECRET</code> and{" "}
          <code className="font-mono text-[11px]">GOOGLE_REFRESH_TOKEN</code>; Fireflies needs{" "}
          <code className="font-mono text-[11px]">FIREFLIES_API_KEY</code>; Zoom needs its three{" "}
          <code className="font-mono text-[11px]">ZOOM_*</code> values.
        </Callout>
      ) : null}
      {capabilities.meetings && !aiReady ? <AiUnavailableNotice feature="Transcript extraction" /> : null}

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        items={[
          { id: "available", label: "Recent calls" },
          { id: "ingested", label: "Processed", count: state.meetings.length },
        ]}
      />

      {tab === "available" ? (
        <Panel flush>
          {!capabilities.meetings ? (
            <div className="p-4">
              <EmptyState
                icon={<Video className="h-4 w-4" />}
                title="No meeting platform connected"
                description="Connect Google Meet, Fireflies or Zoom in Settings to list recent calls here."
              />
            </div>
          ) : available.isLoading ? (
            <div className="p-4">
              <SkeletonRows rows={4} />
            </div>
          ) : available.error ? (
            <div className="p-4">
              <Callout tone="error">{(available.error as Error).message}</Callout>
            </div>
          ) : available.data?.length ? (
            <ul>
              {available.data.map((meeting) => (
                <AvailableRow key={`${meeting.providerId}-${meeting.id}`} meeting={meeting} aiReady={aiReady} />
              ))}
            </ul>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<Video className="h-4 w-4" />}
                title="No recorded calls in this window"
                description="Only meetings with a transcript can be processed. Transcripts must be enabled before the call starts."
              />
            </div>
          )}
        </Panel>
      ) : (
        <div className="space-y-4">
          {state.meetings.length ? (
            state.meetings.map((meeting) => <IngestedMeeting key={meeting.id} meeting={meeting} />)
          ) : (
            <EmptyState
              icon={<ArrowRight className={cn("h-4 w-4")} />}
              title="Nothing processed yet"
              description="Extract work from a recent call and the decisions, risks and board changes will appear here."
            />
          )}
        </div>
      )}
    </>
  );
};
