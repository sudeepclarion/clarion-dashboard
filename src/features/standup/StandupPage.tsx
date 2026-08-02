import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, Sparkles } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, Standup, StandupChange } from "@/lib/api/types";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const PLACEHOLDER = `Rahul:
- Finished the payment webhook, PR is up for review
- Starting the refund flow, should be done by Friday

Priya:
- Still blocked on staging access for the KYC service
- Fixed the IIFL Homes config issue from yesterday`;

/**
 * One applied change. Showing the diff — not just "done" — is the point: the manager
 * has to be able to audit what the model did to their board.
 */
const AppliedChange = ({ change }: { change: StandupChange }) => (
  <li className="rounded-lg border border-hairline bg-base-900/40 p-3">
    <div className="flex flex-wrap items-center gap-2">
      <Avatar name={change.member} size="xs" />
      <span className="text-xs font-medium text-ink">{change.member}</span>
      <Badge
        className={
          change.action === "created"
            ? "bg-signal-positive/10 text-signal-positive ring-signal-positive/25"
            : "bg-state-progress/10 text-state-progress ring-state-progress/25"
        }
      >
        {change.action}
      </Badge>
      <Link
        to={`/board?task=${change.taskId}`}
        className="min-w-0 flex-1 truncate text-xs text-cyan-clarion hover:underline"
      >
        {change.taskTitle}
      </Link>
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

    {change.blocker ? (
      <p className="mt-2 rounded-md bg-signal-critical/[0.07] px-2 py-1.5 text-2xs text-signal-critical">
        Blocker: {change.blocker}
      </p>
    ) : null}
  </li>
);

const HistoryEntry = ({ standup }: { standup: Standup }) => {
  const [open, setOpen] = useState(false);

  return (
    <li className="border-b border-hairline/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-raised/60"
      >
        <span className="flex-1 text-xs text-ink">{formatDateTime(standup.createdAt)}</span>
        <Badge>{standup.appliedChanges.length} changes</Badge>
        <span className="text-2xs text-ink-faint">{relativeTime(standup.createdAt)}</span>
      </button>

      {open ? (
        <div className="space-y-3 px-4 pb-4">
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-base-900/60 p-3 text-2xs leading-relaxed text-ink-muted">
            {standup.rawText}
          </pre>
          <ul className="space-y-1.5">
            {standup.appliedChanges.map((change, index) => (
              <li key={index} className="flex items-center gap-2 text-2xs text-ink-muted">
                <ArrowRight className="h-3 w-3 shrink-0 text-ink-faint" />
                <span className="font-medium text-ink">{change.member}</span>
                {change.action}
                <Link to={`/board?task=${change.taskId}`} className="truncate text-cyan-clarion hover:underline">
                  {change.taskTitle}
                </Link>
              </li>
            ))}
          </ul>
          {standup.unattributedNotes ? (
            <Callout tone="info">Unattributed: {standup.unattributedNotes}</Callout>
          ) : null}
        </div>
      ) : null}
    </li>
  );
};

export const StandupPage = ({ state }: { state: DashboardState }) => {
  const [text, setText] = useState("");
  const aiReady = state.integrations.capabilities.ai;

  const ingest = useDashboardMutation((raw: string) => api.standups.ingest(raw), {
    onSuccess: () => setText(""),
  });

  return (
    <>
      <PageHeader
        eyebrow="Daily intake"
        title="Standup"
        description="Paste the raw morning updates. Clarion matches each item to existing work, moves statuses, records deadlines with the reason they changed, and flags blockers — then shows you exactly what it did."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Panel>
            <PanelHeader
              title="Today's updates"
              description="One person per block, name first. Casing, nicknames and typos are fine."
            />

            {!aiReady ? <AiUnavailableNotice feature="Standup parsing" /> : null}

            <Textarea
              rows={16}
              className="mt-3 font-mono text-2xs leading-relaxed"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              disabled={!aiReady}
            />

            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                icon={<Sparkles className="h-4 w-4" />}
                disabled={!aiReady || !text.trim()}
                loading={ingest.isPending}
                onClick={() => ingest.mutate(text)}
              >
                {ingest.isPending ? "Reading the standup…" : "Apply to the board"}
              </Button>
              <p className="text-2xs text-ink-faint">
                {state.members.length} team {state.members.length === 1 ? "member" : "members"} recognised
              </p>
            </div>

            {ingest.error ? (
              <Callout tone="error" className="mt-3">
                {ingest.error.message}
              </Callout>
            ) : null}
          </Panel>

          {ingest.data ? (
            <Panel>
              <PanelHeader
                title={`${ingest.data.appliedChanges.length} ${ingest.data.appliedChanges.length === 1 ? "change" : "changes"} applied`}
                description="Every edit Clarion made, with the note it recorded on each task."
              />
              {ingest.data.appliedChanges.length ? (
                <ul className="mt-3 space-y-2">
                  {ingest.data.appliedChanges.map((change, index) => (
                    <AppliedChange key={index} change={change} />
                  ))}
                </ul>
              ) : (
                <Callout tone="info" className="mt-3">
                  Nothing actionable was found in that paste — no tasks were created or changed.
                </Callout>
              )}
              {ingest.data.unattributedNotes ? (
                <Callout tone="warning" className="mt-3">
                  Could not attribute to a known member: {ingest.data.unattributedNotes}
                </Callout>
              ) : null}
            </Panel>
          ) : null}
        </div>

        <div className="xl:col-span-2">
          <Panel flush>
            <div className="p-4">
              <PanelHeader title="History" description="Every standup, with its raw text kept for audit." />
            </div>
            {state.standups.length ? (
              <ul className="max-h-[36rem] overflow-y-auto border-t border-hairline">
                {state.standups.map((standup) => (
                  <HistoryEntry key={standup.id} standup={standup} />
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={<ClipboardList className="h-4 w-4" />}
                  title="No standups yet"
                  description="The first paste will appear here alongside what it changed."
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
};
