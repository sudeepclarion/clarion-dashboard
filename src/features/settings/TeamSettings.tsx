import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState, TeamRole } from "@/lib/api/types";
import { getActiveTeamId } from "@/lib/auth";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input, Select } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const ROLE_OPTIONS: Array<{ value: TeamRole; label: string }> = [
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
];

export const TeamSettings = ({ state }: { state: DashboardState }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [selectedSlack, setSelectedSlack] = useState<Record<string, boolean>>({});
  const [slackRole, setSlackRole] = useState<TeamRole>("member");
  const [filter, setFilter] = useState("");
  const teamId = getActiveTeamId();
  const slackReady = state.integrations.capabilities.slack;

  const directory = useQuery({
    queryKey: ["teams", "slack-directory"],
    queryFn: () => api.teams.slackDirectory(),
    enabled: slackReady,
  });

  const add = useDashboardMutation(() => api.members.add(name.trim(), role), {
    onSuccess: () => {
      setName("");
      setRole("member");
    },
  });
  const updateRole = useDashboardMutation(
    ({ id, next }: { id: string; next: TeamRole }) => api.members.update(id, { role: next })
  );
  const remove = useDashboardMutation((id: string) => api.members.remove(id));
  const addFromSlack = useDashboardMutation(
    () => {
      if (!teamId) throw new Error("No active team");
      const users = Object.entries(selectedSlack)
        .filter(([, on]) => on)
        .map(([slackUserId]) => ({ slackUserId, role: slackRole }));
      return api.teams.addFromSlack(teamId, users);
    },
    {
      onSuccess: () => setSelectedSlack({}),
    }
  );

  const openCounts = new Map(
    state.members.map((member) => [
      member.name,
      state.tasks.filter((task) => task.assignees.includes(member.name) && task.status !== "done")
        .length,
    ])
  );

  const filteredSlack = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = directory.data ?? [];
    if (!q) return rows.slice(0, 80);
    return rows
      .filter(
        (user) =>
          user.realName.toLowerCase().includes(q) ||
          user.name.toLowerCase().includes(q) ||
          (user.email ?? "").toLowerCase().includes(q)
      )
      .slice(0, 80);
  }, [directory.data, filter]);

  const selectedCount = Object.values(selectedSlack).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {!state.members.length ? (
        <Callout tone="warning">
          Add at least one team member before triage, board sync, or the assistant can run for this
          team. Prefer picking people from Slack below so names match DMs.
        </Callout>
      ) : null}

      <Panel>
        <PanelHeader
          title="Team workspace"
          description="Each Clarion team is its own board, triage, and reports. Membership is not the whole Jira project — only people you add here."
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && name.trim()) add.mutate();
            }}
            placeholder="Full name (as in Slack)"
            className="w-44"
          />
          <Select
            value={role}
            onChange={(event) => setRole(event.target.value as TeamRole)}
            className="w-36"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            variant="primary"
            icon={<UserPlus className="h-3.5 w-3.5" />}
            disabled={!name.trim()}
            loading={add.isPending}
            onClick={() => add.mutate()}
          >
            Add member
          </Button>
        </div>

        {add.error ? (
          <Callout tone="error" className="mt-3">
            {add.error.message}
          </Callout>
        ) : null}

        <ul className="mt-4 divide-y divide-hairline/60">
          {state.members.map((member) => {
            const teamRole: TeamRole = member.role === "manager" ? "manager" : "member";
            return (
              <li key={member.id} className="flex items-center gap-3 py-2.5">
                <Avatar name={member.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-medium text-ink">{member.name}</p>
                    {teamRole === "manager" ? (
                      <Badge className="bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25">
                        Manager
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-2xs text-ink-faint">{openCounts.get(member.name) ?? 0} open</p>
                </div>
                <Select
                  value={teamRole}
                  disabled={updateRole.isPending}
                  onChange={(event) =>
                    updateRole.mutate({ id: member.id, next: event.target.value as TeamRole })
                  }
                  className="w-32"
                  aria-label={`Role for ${member.name}`}
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <IconButton
                  label={`Remove ${member.name}`}
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Remove ${member.name}? Their tasks stay on the board.`)) {
                      remove.mutate(member.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </li>
            );
          })}
          {!state.members.length ? (
            <li className="py-6 text-center text-xs text-ink-faint">No members yet.</li>
          ) : null}
        </ul>
      </Panel>

      <Panel>
        <PanelHeader
          title="Add from Slack"
          description="Pick people from your Slack workspace. Their display names become Clarion members for this team only."
          actions={
            !slackReady ? (
              <Link to="/settings?tab=integrations" className="text-2xs text-cyan-clarion hover:underline">
                Connect Slack first
              </Link>
            ) : null
          }
        />

        {!slackReady ? (
          <p className="mt-3 text-xs text-ink-faint">Slack must be connected under Integrations.</p>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter Slack users…"
                className="w-56"
              />
              <Select
                value={slackRole}
                onChange={(event) => setSlackRole(event.target.value as TeamRole)}
                className="w-36"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Add as {option.label}
                  </option>
                ))}
              </Select>
              <Button
                variant="primary"
                icon={<Users className="h-3.5 w-3.5" />}
                disabled={!selectedCount || !teamId}
                loading={addFromSlack.isPending}
                onClick={() => addFromSlack.mutate()}
              >
                Add selected ({selectedCount})
              </Button>
            </div>
            {directory.isLoading ? (
              <p className="mt-3 text-xs text-ink-faint">Loading Slack directory…</p>
            ) : null}
            {directory.error ? (
              <Callout tone="error" className="mt-3">
                {(directory.error as Error).message}
              </Callout>
            ) : null}
            {addFromSlack.error ? (
              <Callout tone="error" className="mt-3">
                {addFromSlack.error.message}
              </Callout>
            ) : null}
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {filteredSlack.map((user) => (
                <li key={user.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-base-900/50">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedSlack[user.id])}
                      onChange={(event) =>
                        setSelectedSlack((prev) => ({ ...prev, [user.id]: event.target.checked }))
                      }
                    />
                    <span className="min-w-0 flex-1 truncate text-xs text-ink">{user.realName}</span>
                    <span className="truncate text-2xs text-ink-faint">{user.email ?? user.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
};
