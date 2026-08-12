import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Coffee } from "lucide-react";
import type { DashboardState, Standup, StandupMemberEntry } from "@/lib/api/types";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const isDaily = (standup: Standup): boolean =>
  (standup.kind ?? (standup.members?.length ? "daily" : "paste")) === "daily";

const MemberCard = ({ entry }: { entry: StandupMemberEntry }) => (
  <li className="rounded-lg border border-hairline bg-base-900/40 p-4">
    <div className="flex flex-wrap items-center gap-2">
      <Avatar name={entry.member} size="sm" />
      <span className="text-sm font-medium text-ink">{entry.member}</span>
      {entry.onLeave ? (
        <Badge className="bg-signal-warning/10 text-signal-warning ring-signal-warning/25">On leave</Badge>
      ) : entry.code?.length || entry.nonCode?.length || entry.yesterday?.length ? (
        <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">Ship log</Badge>
      ) : entry.repliedAt ? (
        <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">Replied</Badge>
      ) : (
        <Badge className="bg-ink-faint/10 text-ink-faint ring-ink-faint/20">No activity</Badge>
      )}
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div>
        <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">Shipped</p>
        {entry.code?.length || entry.nonCode?.length || entry.yesterday?.length ? (
          <ul className="mt-1.5 space-y-1">
            {(entry.code ?? []).map((item, index) => (
              <li key={`c-${index}`} className="text-2xs leading-relaxed text-ink-muted">
                {item.repo ? <span className="font-mono text-cyan-clarion">{item.repo} · </span> : null}
                {item.summary}
              </li>
            ))}
            {(entry.nonCode ?? []).map((item, index) => (
              <li key={`n-${index}`} className="text-2xs leading-relaxed text-ink-muted">
                {item.summary}
              </li>
            ))}
            {!entry.code?.length && !entry.nonCode?.length
              ? (entry.yesterday ?? []).map((line, index) => (
                  <li key={index} className="text-2xs leading-relaxed text-ink-muted">
                    {line}
                  </li>
                ))
              : null}
          </ul>
        ) : (
          <p className="mt-1.5 text-2xs text-ink-faint">No clear activity detected</p>
        )}
      </div>
      <div>
        <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">Today&apos;s focus</p>
        <p className="mt-1.5 whitespace-pre-wrap text-2xs leading-relaxed text-ink">
          {entry.todayFocus?.trim() || "—"}
        </p>
      </div>
    </div>
  </li>
);

const HistoryRow = ({ standup }: { standup: Standup }) => {
  const [open, setOpen] = useState(false);
  const daily = isDaily(standup);
  const replied = standup.members?.filter((m) => m.repliedAt || m.onLeave).length ?? 0;
  const total = standup.members?.length ?? 0;

  return (
    <li className="border-b border-hairline/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-raised/60"
      >
        <span className="flex-1 text-xs text-ink">
          {standup.date || formatDateTime(standup.createdAt)}
        </span>
        <Badge>{daily ? `${replied}/${total} replies` : `${standup.appliedChanges?.length ?? 0} paste`}</Badge>
        <Badge>{standup.status ?? "published"}</Badge>
        <span className="text-2xs text-ink-faint">{relativeTime(standup.updatedAt || standup.createdAt)}</span>
      </button>
      {open && daily ? (
        <ul className="space-y-2 px-4 pb-4">
          {(standup.members ?? []).map((entry) => (
            <MemberCard key={entry.member} entry={entry} />
          ))}
        </ul>
      ) : null}
      {open && !daily ? (
        <pre className="mx-4 mb-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-base-900/60 p-3 text-2xs text-ink-muted">
          {standup.rawText || "(empty paste)"}
        </pre>
      ) : null}
    </li>
  );
};

export const StandupPage = ({ state }: { state: DashboardState }) => {
  const dailyStandups = useMemo(
    () => state.standups.filter(isDaily),
    [state.standups]
  );
  const today = dailyStandups[0];
  const agentsV2 = state.agentConfig?.agentsV2Enabled === true;

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Standup"
        description={
          agentsV2
            ? "Ship log from day-close: code (commits/PRs) and non-code signals from Slack/meetings. No morning DMs — Working handles decisions in Slack after Decide runs."
            : "Each morning at 10:00 IST the bot tells every member what they worked on yesterday (from repos & triage) and asks for today's focus. At 11:00 IST triage publishes this page."
        }
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Panel>
            <PanelHeader
              title={today ? `Team standup · ${today.date}` : "Today's standup"}
              description={
                agentsV2
                  ? today?.status === "published"
                    ? "Published from day-close seal (Gatherer ship log)."
                    : "Appears after day-close when Agents v2 is enabled."
                  : today?.status === "collecting"
                    ? "Check-in DMs are out — waiting on replies. The board view finalizes after 11:00 triage."
                    : today?.status === "published"
                      ? "Published from the 11:00 triage run."
                      : "Appears after the 10:00 check-in (or 11:00 triage if check-in was missed)."
              }
            />

            {!today ? (
              <EmptyState
                className="mt-4"
                icon={<Coffee className="h-4 w-4" />}
                title="No standup yet today"
                description={
                  agentsV2
                    ? "Run day-close from Decide (or wait for the scheduled close) to publish the ship log."
                    : "At 10:00 IST members get a Slack DM with yesterday's inferred work and a question about today's focus."
                }
              />
            ) : (
              <>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge>{today.status}</Badge>
                  <Badge>
                    {(today.members ?? []).filter((m) => m.onLeave).length} on leave
                  </Badge>
                  <Badge>
                    {(today.members ?? []).filter(
                      (m) =>
                        (m.code?.length ?? 0) > 0 ||
                        (m.nonCode?.length ?? 0) > 0 ||
                        (m.yesterday?.length ?? 0) > 0
                    ).length}{" "}
                    with ship log
                  </Badge>
                </div>
                <ul className="mt-4 space-y-3">
                  {(today.members ?? []).map((entry) => (
                    <MemberCard key={entry.member} entry={entry} />
                  ))}
                </ul>
              </>
            )}
          </Panel>

          <Callout tone="info">
            {agentsV2
              ? "Code entries come from GitHub at day-close; non-code from allowlisted Slack and meetings gathered during the day."
              : "Someone on leave yesterday can still show engineering activity today — yesterday's column always comes from repos / PRs, not from whether they said they were off."}
          </Callout>
        </div>

        <div className="xl:col-span-2">
          <Panel flush>
            <div className="p-4">
              <PanelHeader
                title="History"
                description="Prior daily standups (and any legacy paste ingest)."
              />
            </div>
            {state.standups.length ? (
              <ul className="max-h-[36rem] overflow-y-auto border-t border-hairline">
                {state.standups.map((standup) => (
                  <HistoryRow key={standup.id} standup={standup} />
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState
                  icon={<ClipboardList className="h-4 w-4" />}
                  title="No standups yet"
                  description="The first 10:00 check-in will appear here."
                />
              </div>
            )}
          </Panel>

          <Panel className="mt-4">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-cyan-clarion" />
              <div className="text-2xs leading-relaxed text-ink-muted">
                <p className="font-medium text-ink">Schedule (IST)</p>
                <p className="mt-1">10:00 — Slack check-in to every team member</p>
                <p>11:00 — Triage runs once; this page is published / refreshed</p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
};
