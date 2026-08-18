import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Coffee, Hash } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState, OrgAgentConfig, Standup, StandupMemberEntry } from "@/lib/api/types";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

const StandupSlackChannels = ({ slackReady }: { slackReady: boolean }) => {
  const queryClient = useQueryClient();
  const configQuery = useQuery({
    queryKey: queryKeys.agentConfig,
    queryFn: () => api.agents.config(),
  });
  const channelsQuery = useQuery({
    queryKey: ["integrations", "slack", "channels"],
    queryFn: () => api.integrations.slack.channels(),
    enabled: slackReady,
  });

  const [selected, setSelected] = useState<string[]>([]);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    if (!configQuery.data || draftReady) return;
    setSelected(configQuery.data.standupPostChannelIds ?? []);
    setDraftReady(true);
  }, [configQuery.data, draftReady]);

  const save = useDashboardMutation(
    (channelIds: string[]) =>
      api.agents.saveConfig({ standupPostChannelIds: channelIds } as Partial<OrgAgentConfig>),
    {
      onSuccess: (data) => {
        setSelected(data.standupPostChannelIds ?? []);
        void queryClient.invalidateQueries({ queryKey: queryKeys.agentConfig });
        void queryClient.invalidateQueries({ queryKey: queryKeys.state });
      },
    }
  );

  const channels = useMemo(() => {
    const rows = channelsQuery.data ?? [];
    return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }, [channelsQuery.data]);

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!slackReady) {
    return (
      <Panel>
        <PanelHeader
          title="Post standup to Slack"
          description="Connect Slack in Settings → Integrations to choose channels."
        />
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader
        title="Post standup to Slack"
        description="Checked channels get the day-close ship log when day-end runs (scheduled or manual). Bot must be a member of the channel."
      />
      {channelsQuery.isLoading ? (
        <p className="mt-3 text-2xs text-ink-faint">Loading channels…</p>
      ) : channelsQuery.isError ? (
        <Callout tone="error" className="mt-3">
          Could not load Slack channels. Check Slack credentials / bot scopes.
        </Callout>
      ) : (
        <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {channels.length ? (
            channels.map((ch) => (
              <li key={ch.id}>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={selected.includes(ch.id)}
                    onChange={() => toggle(ch.id)}
                    disabled={!ch.isMember}
                  />
                  <Hash className="h-3.5 w-3.5 text-ink-faint" />
                  <span className={!ch.isMember ? "text-ink-faint" : undefined}>{ch.name}</span>
                  {!ch.isMember ? (
                    <span className="text-2xs text-ink-faint">invite bot first</span>
                  ) : null}
                </label>
              </li>
            ))
          ) : (
            <li className="text-2xs text-ink-faint">No channels returned from Slack.</li>
          )}
        </ul>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          disabled={save.isPending}
          onClick={() => save.mutate(selected)}
        >
          Save channels
        </Button>
        <span className="text-2xs text-ink-faint">
          {selected.length ? `${selected.length} selected` : "None — no channel post"}
        </span>
      </div>
    </Panel>
  );
};

export const StandupPage = ({ state }: { state: DashboardState }) => {
  const dailyStandups = useMemo(
    () => state.standups.filter(isDaily),
    [state.standups]
  );
  const today = dailyStandups[0];
  const slackReady = Boolean(state.integrations.capabilities.slack);
  const dayClose =
    state.agentConfig?.dayCloseTime && state.agentConfig?.timezone
      ? `${state.agentConfig.dayCloseTime} (${state.agentConfig.timezone})`
      : null;

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Standup"
        description="Ship log from day-close: code (commits/PRs) and non-code signals from Slack/meetings. Optionally post the same summary to Slack channels you select."
      />

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <Panel>
            <PanelHeader
              title={today ? `Team standup · ${today.date}` : "Today's standup"}
              description={
                today?.status === "published"
                  ? "Published from day-close seal (Gatherer ship log)."
                  : "Appears after day-close."
              }
            />

            {!today ? (
              <EmptyState
                className="mt-4"
                icon={<Coffee className="h-4 w-4" />}
                title="No standup yet today"
                description="Run day-close from Decide (or wait for the scheduled close) to publish the ship log."
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
                  {dayClose ? <Badge>Day-close {dayClose}</Badge> : null}
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
            At day-close Clarion seals GitHub + Gatherer into this ship log, posts it to any checked
            Slack channels, then DMs managers the Decide pack separately.
          </Callout>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <StandupSlackChannels slackReady={slackReady} />

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
              <EmptyState
                className="m-4"
                icon={<ClipboardList className="h-4 w-4" />}
                title="No history yet"
                description="Published standups will show up here."
              />
            )}
          </Panel>

          <Callout tone="info">
            Schedule lives under Settings → Agents (day-close time).
          </Callout>
        </div>
      </div>
    </>
  );
};
