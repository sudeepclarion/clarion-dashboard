import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Check, ChevronDown, ChevronRight, Play } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  AgentProposal,
  DashboardState,
  DeciderPlan,
  TriageDayReport,
} from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format/dates";
import { renderMarkdown } from "@/lib/format/markdown";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select, Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";

const statusTone = (status: string): string => {
  if (status === "applied" || status === "executed" || status === "approved") {
    return "bg-signal-positive/10 text-signal-positive ring-signal-positive/25";
  }
  if (
    status === "awaiting_approval" ||
    status === "pending_auth" ||
    status === "waiting_up" ||
    status === "waiting_down"
  ) {
    return "bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25";
  }
  if (status === "rejected" || status === "failed") {
    return "bg-signal-danger/10 text-signal-danger ring-signal-danger/25";
  }
  if (status === "running" || status === "deferred") {
    return "bg-violet-electric/10 text-violet-electric ring-violet-electric/25";
  }
  return "bg-base-900/60 text-ink-muted";
};

const ProposalList = ({
  title,
  items,
}: {
  title: string;
  items: AgentProposal[];
}) => (
  <Panel>
    <PanelHeader title={title} description={`${items.length} item(s)`} />
    {items.length ? (
      <ul className="mt-3 space-y-2">
        {items.map((p) => (
          <li key={p.id} className="rounded-lg border border-hairline bg-base-900/30 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{p.title}</span>
              <Badge className={statusTone(p.status)}>{p.status.replace(/_/g, " ")}</Badge>
              <Badge>{p.kind}</Badge>
            </div>
            <p className="mt-1 text-2xs text-ink-muted">{p.description}</p>
            {p.waitingOn ? (
              <p className="mt-1 text-2xs text-ink-faint">Waiting on {p.waitingOn}</p>
            ) : null}
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-3 text-2xs text-ink-faint">None</p>
    )}
  </Panel>
);

const DeciderSummary = ({ plan }: { plan: DeciderPlan }) => (
  <div className="grid gap-4 lg:grid-cols-2">
    <Panel>
      <PanelHeader title="Solved" description={`${plan.solved.length}`} />
      <ul className="mt-3 space-y-1">
        {plan.solved.length ? (
          plan.solved.map((s, i) => (
            <li key={i} className="text-2xs text-ink-muted">
              • {s.summary}
            </li>
          ))
        ) : (
          <li className="text-2xs text-ink-faint">—</li>
        )}
      </ul>
    </Panel>
    <Panel>
      <PanelHeader title="Not solved" description={`${plan.notSolved.length}`} />
      <ul className="mt-3 space-y-1">
        {plan.notSolved.length ? (
          plan.notSolved.map((s, i) => (
            <li key={i} className="text-2xs text-ink-muted">
              • {s.summary} <span className="text-ink-faint">({s.why})</span>
            </li>
          ))
        ) : (
          <li className="text-2xs text-ink-faint">—</li>
        )}
      </ul>
    </Panel>
  </div>
);

const DecideView = ({ state }: { state: DashboardState }) => {
  const queryClient = useQueryClient();
  const proposals = state.proposals;
  const open = proposals?.open ?? [];
  const latest = proposals?.latestDecider ?? null;

  const wm = useQuery({
    queryKey: queryKeys.workingMemory,
    queryFn: () => api.agents.workingMemory(),
  });

  const weekly = useQuery({
    queryKey: queryKeys.weeklyReports,
    queryFn: () => api.agents.weeklyReports(),
  });

  const dayClose = useDashboardMutation(
    () => api.agents.dayClose(),
    {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: queryKeys.state });
        void queryClient.invalidateQueries({ queryKey: queryKeys.workingMemory });
      },
    }
  );

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Decide"
        description="Day-close Decider plan and open proposals. Approve in Slack DMs (Working agent) — dashboard is read-only for auth."
        actions={
          <Button
            variant="primary"
            icon={<Play className="h-3.5 w-3.5" />}
            loading={dayClose.isPending}
            onClick={() => dayClose.mutate()}
          >
            Run day-close
          </Button>
        }
      />

      {dayClose.error ? (
        <Callout tone="error" className="mb-3">
          {dayClose.error.message}
        </Callout>
      ) : null}
      {dayClose.isSuccess && dayClose.data ? (
        <Callout tone="info" className="mb-3">
          Day-close sealed {dayClose.data.date} · {dayClose.data.proposalCount} proposal(s). Working
          DMs managers in Slack.
        </Callout>
      ) : null}

      {latest ? (
        <div className="mb-4 space-y-4">
          <p className="text-2xs text-ink-faint">
            Last Decider · {formatDate(latest.date)} · {formatDateTime(latest.deciderRunAt)}
          </p>
          <DeciderSummary plan={latest} />
        </div>
      ) : (
        <EmptyState
          className="mb-4"
          icon={<CalendarDays className="h-4 w-4" />}
          title="No Decider plan yet"
          description="Run day-close after Gatherer has signals, or wait for the scheduled close."
        />
      )}

      <div className="mb-4 grid gap-4 xl:grid-cols-2">
        <ProposalList title="Open proposals" items={open} />
        <Panel>
          <PanelHeader
            title="Working memory"
            description="Recently done, conflicts, notes (read-only)"
          />
          {wm.isLoading ? (
            <Skeleton className="mt-3 h-24 w-full" />
          ) : wm.error ? (
            <Callout tone="error" className="mt-3">
              {(wm.error as Error).message}
            </Callout>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">
                  Recently done
                </p>
                <ul className="mt-1 space-y-1">
                  {(wm.data?.recentlyDone ?? proposals?.recentlyDone ?? []).slice(0, 12).map((r, i) => (
                    <li key={i} className="text-2xs text-ink-muted">
                      {r.summary}
                    </li>
                  ))}
                  {!(wm.data?.recentlyDone ?? proposals?.recentlyDone)?.length ? (
                    <li className="text-2xs text-ink-faint">—</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">
                  Conflicts
                </p>
                <ul className="mt-1 space-y-1">
                  {(wm.data?.conflicts ?? proposals?.conflicts ?? []).slice(-8).map((c, i) => (
                    <li key={i} className="text-2xs text-ink-muted">
                      {c.summary}
                      {c.waitingOn ? ` · waiting ${c.waitingOn}` : ""}
                    </li>
                  ))}
                  {!(wm.data?.conflicts ?? proposals?.conflicts)?.length ? (
                    <li className="text-2xs text-ink-faint">—</li>
                  ) : null}
                </ul>
              </div>
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Weekly agent reports" description="From daily executions (purged after report)" />
        {weekly.isLoading ? (
          <Skeleton className="mt-3 h-16 w-full" />
        ) : weekly.data?.length ? (
          <ul className="mt-3 space-y-2">
            {weekly.data.slice(0, 6).map((r) => (
              <li key={`${r.weekStart}-${r.weekEnd}`} className="rounded-lg border border-hairline p-3">
                <p className="text-2xs font-medium text-ink">
                  {r.weekStart} → {r.weekEnd} · {r.executionCount} actions
                </p>
                <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap font-sans text-2xs text-ink-muted">
                  {r.summary}
                </pre>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-2xs text-ink-faint">No weekly reports yet.</p>
        )}
      </Panel>
    </>
  );
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
              <PanelHeader title="Day standup" description="11:00 triage rollup — engineering, Slack, and proposals." />
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

const LegacyTriageView = () => {
  const queryClient = useQueryClient();
  const [slot, setSlot] = useState<string>("");
  const [watching, setWatching] = useState(false);
  const [focusDraft, setFocusDraft] = useState("");

  const days = useQuery({
    queryKey: queryKeys.triageDays,
    queryFn: () => api.triage.days(30),
  });

  const focusQuery = useQuery({
    queryKey: queryKeys.triageFocus,
    queryFn: () => api.triage.focus(),
  });

  useEffect(() => {
    if (focusQuery.data?.focus !== undefined) setFocusDraft(focusQuery.data.focus);
  }, [focusQuery.data?.focus]);

  const status = useQuery({
    queryKey: ["triage", "status"],
    queryFn: () => api.triage.status(),
    refetchInterval: watching ? 3000 : false,
  });

  const saveFocus = useDashboardMutation((text: string) => api.triage.saveFocus(text), {
    onSuccess: (data) => {
      setFocusDraft(data.focus);
      void queryClient.invalidateQueries({ queryKey: queryKeys.triageFocus });
    },
  });

  const run = useDashboardMutation((chosen?: string) => api.triage.run(chosen || undefined), {
    onSuccess: () => {
      setWatching(true);
      void queryClient.invalidateQueries({ queryKey: queryKeys.triageDays });
      void queryClient.invalidateQueries({ queryKey: ["triage", "status"] });
    },
  });

  const latestStatus = status.data?.latest?.status;
  const running = watching || latestStatus === "running" || run.isPending;
  const focusDirty = focusDraft !== (focusQuery.data?.focus ?? "");

  useEffect(() => {
    if (!watching) return;
    if (latestStatus && latestStatus !== "running") {
      setWatching(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.triageDays });
    }
  }, [latestStatus, watching, queryClient]);

  return (
    <>
      <PageHeader
        eyebrow="Operate"
        title="Daily triage"
        description="Once daily at 11:00 IST: engineering + Slack signals and proposed actions for manager approval. Enable Agents v2 in Settings for the Gatherer → Decider → Working spine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
              className="h-9 w-36"
              aria-label="Triage slot"
            >
              <option value="">Now (current time)</option>
              <option value="11:00">11:00 IST</option>
            </Select>
            <Button
              variant="primary"
              icon={<Play className="h-3.5 w-3.5" />}
              loading={running}
              disabled={running}
              onClick={() => run.mutate(slot)}
            >
              Run triage
            </Button>
          </div>
        }
      />

      <Panel className="mb-4">
        <PanelHeader
          title="Manager focus"
          description="Extra instructions applied to every triage run across Slack, GitHub, and the board."
          actions={
            focusDirty ? (
              <Button
                variant="primary"
                icon={<Check className="h-3.5 w-3.5" />}
                loading={saveFocus.isPending}
                onClick={() => saveFocus.mutate(focusDraft)}
              >
                Save focus
              </Button>
            ) : null
          }
        />
        <Textarea
          rows={3}
          value={focusDraft}
          onChange={(event) => setFocusDraft(event.target.value)}
          placeholder="Also find Able Credit client escalations and whether refunds are blocked…"
          className="mt-3"
        />
        {saveFocus.error ? (
          <Callout tone="error" className="mt-2">
            {saveFocus.error.message}
          </Callout>
        ) : null}
      </Panel>

      {run.error ? (
        <Callout tone="error" className="mb-3">
          {run.error.message}
        </Callout>
      ) : null}
      {run.isSuccess && run.data ? (
        <Callout tone="info" className="mb-3">
          Triage started for {run.data.date} · {run.data.slot} IST.
        </Callout>
      ) : null}
      {watching && latestStatus === "running" ? (
        <Callout tone="info" className="mb-3">
          Triage is still running…
        </Callout>
      ) : null}

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
          description="Clarion runs triage once daily at 11:00 IST."
          action={
            <Button
              variant="primary"
              icon={<Play className="h-3.5 w-3.5" />}
              loading={running}
              onClick={() => run.mutate(slot)}
            >
              Run triage
            </Button>
          }
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

export const DailyPage = ({ state }: { state: DashboardState }) => {
  if (state.agentConfig?.agentsV2Enabled !== false) {
    return <DecideView state={state} />;
  }
  return <LegacyTriageView />;
};
