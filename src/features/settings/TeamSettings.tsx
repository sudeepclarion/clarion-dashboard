import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState, TeamRole } from "@/lib/api/types";
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

  const openCounts = new Map(
    state.members.map((member) => [
      member.name,
      state.tasks.filter((task) => task.assignees.includes(member.name) && task.status !== "done").length,
    ])
  );

  return (
    <Panel>
      <PanelHeader
        title="Team"
        description="Names match people across standups, Jira and Slack. Managers receive triage approval DMs and get full Clarion tools in Slack — independent of Slack Admin users."
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
      {updateRole.error ? (
        <Callout tone="error" className="mt-3">
          {updateRole.error.message}
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
  );
};
