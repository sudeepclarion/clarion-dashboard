import { useState } from "react";
import { Trash2, UserPlus } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { DashboardState } from "@/lib/api/types";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Avatar } from "@/components/ui/Avatar";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

export const TeamSettings = ({ state }: { state: DashboardState }) => {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  const add = useDashboardMutation(() => api.members.add(name.trim(), role.trim() || undefined), {
    onSuccess: () => {
      setName("");
      setRole("");
    },
  });
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
        description="Names are how Clarion resolves people across standups, Jira and Slack — short forms like “Bikram” are matched to full display names automatically."
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && name.trim()) add.mutate();
          }}
          placeholder="Full name"
          className="w-44"
        />
        <Input
          value={role}
          onChange={(event) => setRole(event.target.value)}
          placeholder="Role (optional)"
          className="w-40"
        />
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
        {state.members.map((member) => (
          <li key={member.id} className="flex items-center gap-3 py-2.5">
            <Avatar name={member.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink">{member.name}</p>
              <p className="text-2xs text-ink-faint">
                {member.role ? `${member.role} · ` : ""}
                {openCounts.get(member.name) ?? 0} open
              </p>
            </div>
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
        ))}
        {!state.members.length ? (
          <li className="py-6 text-center text-xs text-ink-faint">No members yet.</li>
        ) : null}
      </ul>
    </Panel>
  );
};
