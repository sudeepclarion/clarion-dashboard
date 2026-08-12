import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Play } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { AgentProposal, DashboardState, DeciderPlan } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";

const statusTone = (status: string): string => {
  if (status === "executed" || status === "approved") {
    return "bg-signal-positive/10 text-signal-positive ring-signal-positive/25";
  }
  if (status === "pending_auth" || status === "waiting_up" || status === "waiting_down") {
    return "bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25";
  }
  if (status === "rejected") {
    return "bg-signal-danger/10 text-signal-danger ring-signal-danger/25";
  }
  if (status === "deferred") {
    return "bg-violet-electric/10 text-violet-electric ring-violet-electric/25";
  }
  return "bg-base-900/60 text-ink-muted";
};

const ProposalList = ({ title, items }: { title: string; items: AgentProposal[] }) => (
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

export const DailyPage = ({ state }: { state: DashboardState }) => {
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

  const dayClose = useDashboardMutation(() => api.agents.dayClose(), {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.state });
      void queryClient.invalidateQueries({ queryKey: queryKeys.workingMemory });
    },
  });

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
