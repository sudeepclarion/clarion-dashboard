import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Trash2, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import {
  MEMBER_FUNCTIONS,
  type DashboardState,
  type Member,
  type MemberFunction,
  type TeamRole,
} from "@/lib/api/types";
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

const FUNCTION_LABELS: Record<MemberFunction, string> = {
  app: "App",
  backend: "Backend",
  mobile: "Mobile",
  sdk: "SDK",
  reports: "Reports",
  qa: "QA",
  product: "Product",
  devops: "DevOps",
};

const effectiveStaffable = (member: Member): boolean => {
  if (typeof member.acceptsWorkAssignments === "boolean") return member.acceptsWorkAssignments;
  return member.role !== "manager";
};

const MemberRow = ({
  member,
  openCount,
}: {
  member: Member;
  openCount: number;
}) => {
  const teamRole: TeamRole = member.role === "manager" ? "manager" : "member";
  const functions = Array.isArray(member.functions) ? member.functions : [];
  const tags = Array.isArray(member.tags) ? member.tags : [];
  const [tagDraft, setTagDraft] = useState(tags.join(", "));
  const [customFnDraft, setCustomFnDraft] = useState("");
  const staffable = effectiveStaffable(member);

  const curatedOn = new Set(
    functions.filter((f) => (MEMBER_FUNCTIONS as readonly string[]).includes(f.toLowerCase()))
  );
  const customFunctions = functions.filter(
    (f) => !(MEMBER_FUNCTIONS as readonly string[]).includes(f.toLowerCase())
  );

  const update = useDashboardMutation(
    (changes: {
      role?: TeamRole;
      functions?: string[];
      tags?: string[];
      acceptsWorkAssignments?: boolean | null;
    }) => api.members.update(member.id, changes)
  );
  const remove = useDashboardMutation((id: string) => api.members.remove(id));

  const toggleFunction = (fn: MemberFunction) => {
    const key = fn.toLowerCase();
    const without = functions.filter((f) => f.toLowerCase() !== key);
    const next = curatedOn.has(fn) ? without : [...without, fn];
    update.mutate({ functions: next });
  };

  const addCustomFunction = () => {
    const label = customFnDraft.trim();
    if (!label) return;
    if (functions.some((f) => f.toLowerCase() === label.toLowerCase())) {
      setCustomFnDraft("");
      return;
    }
    update.mutate({ functions: [...functions, label] });
    setCustomFnDraft("");
  };

  const removeFunction = (label: string) => {
    update.mutate({
      functions: functions.filter((f) => f.toLowerCase() !== label.toLowerCase()),
    });
  };

  const commitTags = () => {
    const next = tagDraft
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const same =
      next.length === tags.length && next.every((t, i) => t.toLowerCase() === tags[i]?.toLowerCase());
    if (!same) update.mutate({ tags: next });
  };

  return (
    <li className="space-y-2.5 border-b border-hairline/60 py-3 last:border-b-0">
      <div className="flex items-center gap-3">
        <Avatar name={member.name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-xs font-medium text-ink">{member.name}</p>
            {teamRole === "manager" ? (
              <Badge className="bg-cyan-clarion/10 text-cyan-clarion ring-cyan-clarion/25">
                Manager
              </Badge>
            ) : null}
            {!staffable ? (
              <Badge className="bg-base-800 text-ink-muted ring-hairline">Not staffed</Badge>
            ) : null}
          </div>
          <p className="text-2xs text-ink-faint">{openCount} open</p>
        </div>
        <Select
          value={teamRole}
          disabled={update.isPending}
          onChange={(event) => update.mutate({ role: event.target.value as TeamRole })}
          className="w-32"
          aria-label={`Clarion role for ${member.name}`}
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
      </div>

      <div className="pl-11">
        <p className="mb-1.5 text-2xs text-ink-faint">Job functions (staffing)</p>
        <div className="flex flex-wrap gap-1.5">
          {MEMBER_FUNCTIONS.map((fn) => {
            const on = curatedOn.has(fn);
            return (
              <button
                key={fn}
                type="button"
                disabled={update.isPending}
                onClick={() => toggleFunction(fn)}
                className={
                  on
                    ? "rounded-md bg-cyan-clarion/15 px-2 py-0.5 text-2xs text-cyan-clarion ring-1 ring-cyan-clarion/30"
                    : "rounded-md bg-base-900/60 px-2 py-0.5 text-2xs text-ink-muted ring-1 ring-hairline hover:text-ink"
                }
              >
                {FUNCTION_LABELS[fn]}
              </button>
            );
          })}
          {customFunctions.map((fn) => (
            <button
              key={fn}
              type="button"
              disabled={update.isPending}
              onClick={() => removeFunction(fn)}
              title="Click to remove"
              className="rounded-md bg-violet-electric/15 px-2 py-0.5 text-2xs text-violet-electric ring-1 ring-violet-electric/30"
            >
              {fn} ×
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input
            value={customFnDraft}
            onChange={(event) => setCustomFnDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomFunction();
              }
            }}
            placeholder="Add custom function (e.g. collector)"
            className="w-56"
            aria-label={`Custom function for ${member.name}`}
          />
          <Button
            variant="ghost"
            disabled={!customFnDraft.trim() || update.isPending}
            onClick={addCustomFunction}
          >
            Add
          </Button>
          <Input
            value={tagDraft}
            onChange={(event) => setTagDraft(event.target.value)}
            onBlur={commitTags}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTags();
              }
            }}
            placeholder="Tags (comma-separated)"
            className="w-48"
            aria-label={`Tags for ${member.name}`}
          />
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-2xs text-ink-muted">
            <input
              type="checkbox"
              checked={staffable}
              disabled={update.isPending}
              onChange={(event) =>
                update.mutate({ acceptsWorkAssignments: event.target.checked })
              }
            />
            Accepts work assignments
          </label>
        </div>
      </div>
      {update.error ? (
        <Callout tone="error" className="ml-11">
          {update.error.message}
        </Callout>
      ) : null}
    </li>
  );
};

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
          description="Clarion role (Member/Manager) controls approvals and Slack auth. Job functions + tags control who Decider/Working staff onto tickets."
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

        <ul className="mt-4">
          {state.members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              openCount={openCounts.get(member.name) ?? 0}
            />
          ))}
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
