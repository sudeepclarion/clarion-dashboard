import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState, OrgAgentConfig } from "@/lib/api/types";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

export const AgentSettings = ({ state }: { state: DashboardState }) => {
  const queryClient = useQueryClient();
  const configQuery = useQuery({
    queryKey: queryKeys.agentConfig,
    queryFn: () => api.agents.config(),
  });
  const goalsQuery = useQuery({
    queryKey: queryKeys.agentGoals,
    queryFn: () => api.agents.goals(),
  });

  const [draft, setDraft] = useState<Partial<OrgAgentConfig> | null>(null);
  const [allowlistText, setAllowlistText] = useState("");
  const [goalText, setGoalText] = useState("");
  const [goalHorizon, setGoalHorizon] = useState<"vision" | "yearly" | "quarterly">("quarterly");

  useEffect(() => {
    if (!configQuery.data) return;
    setDraft(configQuery.data);
    setAllowlistText(configQuery.data.slackChannelAllowlist.join("\n"));
  }, [configQuery.data]);

  const save = useDashboardMutation(
    (patch: Partial<OrgAgentConfig>) => api.agents.saveConfig(patch),
    {
      onSuccess: (data) => {
        setDraft(data);
        setAllowlistText(data.slackChannelAllowlist.join("\n"));
        void queryClient.invalidateQueries({ queryKey: queryKeys.agentConfig });
        void queryClient.invalidateQueries({ queryKey: queryKeys.state });
      },
    }
  );

  const saveGoal = useDashboardMutation(
    () =>
      api.agents.saveGoal({
        scope: "team",
        scopeId: "default",
        horizon: goalHorizon,
        text: goalText.trim(),
      }),
    {
      onSuccess: () => {
        setGoalText("");
        void queryClient.invalidateQueries({ queryKey: queryKeys.agentGoals });
      },
    }
  );

  const managers = state.members.filter((m) => m.role === "manager");
  const cfg = draft ?? configQuery.data;

  const toggleUpline = (memberId: string) => {
    if (!cfg) return;
    const set = new Set(cfg.uplineMemberIds ?? []);
    if (set.has(memberId)) set.delete(memberId);
    else set.add(memberId);
    setDraft({ ...cfg, uplineMemberIds: [...set] });
  };

  const persist = () => {
    if (!cfg) return;
    const channels = allowlistText
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    save.mutate({
      timezone: cfg.timezone,
      dayCloseTime: cfg.dayCloseTime,
      agentsV2Enabled: cfg.agentsV2Enabled,
      slackChannelAllowlist: channels,
      uplineMemberIds: cfg.uplineMemberIds ?? [],
      reminderPolicy: cfg.reminderPolicy,
    });
  };

  if (configQuery.isLoading || !cfg) {
    return <p className="text-2xs text-ink-faint">Loading agent config…</p>;
  }

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="Agents spine"
          description="Gatherer → Decider → Working. Disable only as an emergency kill switch."
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={cfg.agentsV2Enabled !== false}
            onChange={(e) => setDraft({ ...cfg, agentsV2Enabled: e.target.checked })}
          />
          Agents spine enabled (default on)
        </label>
        {cfg.agentsV2Enabled !== false ? (
          <Badge className="mt-2 bg-signal-positive/10 text-signal-positive ring-signal-positive/25">
            Active — Decide + ship-log standup
          </Badge>
        ) : (
          <Badge className="mt-2 bg-signal-danger/10 text-signal-danger ring-signal-danger/25">
            Disabled — day-close / gather / working DMs off
          </Badge>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Day-close schedule" description="Timezone and local time for seal + Decider." />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-2xs text-ink-faint">Timezone</label>
            <Input
              className="mt-1"
              value={cfg.timezone}
              onChange={(e) => setDraft({ ...cfg, timezone: e.target.value })}
              placeholder="Asia/Kolkata"
            />
          </div>
          <div>
            <label className="text-2xs text-ink-faint">Day-close time (HH:MM)</label>
            <Input
              className="mt-1"
              value={cfg.dayCloseTime}
              onChange={(e) => setDraft({ ...cfg, dayCloseTime: e.target.value })}
              placeholder="18:00"
            />
          </div>
          <div>
            <label className="text-2xs text-ink-faint">Remind pending auth (hours)</label>
            <Input
              className="mt-1"
              type="number"
              min={1}
              value={cfg.reminderPolicy?.remindPendingAuthHours ?? 4}
              onChange={(e) =>
                setDraft({
                  ...cfg,
                  reminderPolicy: { remindPendingAuthHours: Number(e.target.value) || 4 },
                })
              }
            />
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Slack channel allowlist"
          description="Gatherer only reads these channel IDs (one per line). Empty = no channel ingress."
        />
        <Textarea
          className="mt-3 font-mono"
          rows={4}
          value={allowlistText}
          onChange={(e) => setAllowlistText(e.target.value)}
          placeholder="C01234567"
        />
      </Panel>

      <Panel>
        <PanelHeader
          title="Auth ladder"
          description="Managers approve day-close proposals. Upline (e.g. CEO) receives EM pushback and can resolve waiting_up."
        />
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">Managers</p>
            <ul className="mt-1 flex flex-wrap gap-2">
              {managers.length ? (
                managers.map((m) => (
                  <Badge key={m.id}>{m.name}</Badge>
                ))
              ) : (
                <span className="text-2xs text-ink-faint">No managers — set roles on Team tab</span>
              )}
            </ul>
          </div>
          <div>
            <p className="text-2xs font-medium uppercase tracking-wide text-ink-faint">Upline</p>
            <ul className="mt-2 space-y-1">
              {state.members.map((m) => {
                const on = (cfg.uplineMemberIds ?? []).includes(m.id);
                return (
                  <li key={m.id}>
                    <label className="flex items-center gap-2 text-sm text-ink">
                      <input type="checkbox" checked={on} onChange={() => toggleUpline(m.id)} />
                      {m.name}
                      <span className="text-2xs text-ink-faint">({m.role})</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Goals (Decider context)"
          description="Read-only context for day-close planning — company/team horizons."
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Select
            value={goalHorizon}
            onChange={(e) => setGoalHorizon(e.target.value as typeof goalHorizon)}
            className="h-9 w-36"
          >
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
            <option value="vision">Vision</option>
          </Select>
          <Input
            className="min-w-[12rem] flex-1"
            value={goalText}
            onChange={(e) => setGoalText(e.target.value)}
            placeholder="Ship payments reliability this quarter…"
          />
          <Button
            variant="secondary"
            disabled={!goalText.trim()}
            loading={saveGoal.isPending}
            onClick={() => saveGoal.mutate()}
          >
            Add goal
          </Button>
        </div>
        {goalsQuery.data?.length ? (
          <ul className="mt-3 space-y-1">
            {goalsQuery.data.map((g) => (
              <li key={`${g.scope}-${g.scopeId}-${g.horizon}`} className="text-2xs text-ink-muted">
                <Badge className="mr-2">{g.horizon}</Badge>
                {g.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-2xs text-ink-faint">No goals yet.</p>
        )}
      </Panel>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          icon={<Check className="h-3.5 w-3.5" />}
          loading={save.isPending}
          onClick={persist}
        >
          Save agent settings
        </Button>
        {save.error ? (
          <Callout tone="error">{save.error.message}</Callout>
        ) : null}
        {save.isSuccess ? <p className="text-2xs text-ink-faint">Saved</p> : null}
      </div>
    </div>
  );
};
