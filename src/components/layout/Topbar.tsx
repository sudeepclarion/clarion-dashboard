import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { Capabilities, DashboardState } from "@/lib/api/types";
import { relativeTime } from "@/lib/format/dates";
import {
  clearActiveTeamId,
  clearSessionToken,
  getActiveTeamId,
  setActiveTeamId,
} from "@/lib/auth";
import { Dot } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Select } from "@/components/ui/Field";

const INTEGRATIONS: Array<{ key: keyof Capabilities; label: string }> = [
  { key: "ai", label: "AI" },
  { key: "tickets", label: "Tickets" },
  { key: "messaging", label: "Chat" },
  { key: "meetings", label: "Meetings" },
  { key: "docs", label: "Docs" },
  { key: "code", label: "Code" },
];

const IntegrationStatus = ({ capabilities }: { capabilities?: Capabilities }) => (
  <div className="hidden items-center gap-3 md:flex">
    {INTEGRATIONS.map(({ key, label }) => {
      const isOn = Boolean(capabilities?.[key]);
      return (
        <span
          key={key}
          className="flex items-center gap-1.5 text-2xs"
          title={`${label}: ${isOn ? "connected" : "not configured"}`}
        >
          <Dot className={isOn ? "bg-signal-positive" : "bg-ink-faint/50"} />
          <span className={isOn ? "text-ink-muted" : "text-ink-faint"}>{label}</span>
        </span>
      );
    })}
  </div>
);

export interface TopbarProps {
  state?: DashboardState;
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenNav: () => void;
  navIcon: ReactNode;
}

export const Topbar = ({ state, isRefreshing, onRefresh, onOpenNav, navIcon }: TopbarProps) => {
  const queryClient = useQueryClient();
  const [teamId, setTeamId] = useState(getActiveTeamId() ?? "");

  const teams = useQuery({
    queryKey: queryKeys.teams,
    queryFn: () => api.teams.list(),
  });

  useEffect(() => {
    const list = teams.data;
    if (!list?.length) return;
    const current = getActiveTeamId();
    if (!current || !list.some((team) => team.id === current)) {
      setActiveTeamId(list[0].id);
      setTeamId(list[0].id);
      void queryClient.invalidateQueries({ queryKey: queryKeys.state });
    } else {
      setTeamId(current);
    }
  }, [teams.data, queryClient]);

  const createTeam = useMutation({
    mutationFn: (name: string) => api.teams.create(name),
    onSuccess: async (team) => {
      setActiveTeamId(team.id);
      setTeamId(team.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.teams });
      await queryClient.invalidateQueries({ queryKey: queryKeys.state });
    },
  });

  const switchTeam = (next: string): void => {
    if (next === "__new__") {
      const name = window.prompt("Name for the new team");
      if (name?.trim()) createTeam.mutate(name.trim());
      return;
    }
    setActiveTeamId(next);
    setTeamId(next);
    void queryClient.invalidateQueries();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hairline bg-base-800/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        type="button"
        aria-label="Open navigation"
        onClick={onOpenNav}
        className="text-ink-muted hover:text-ink lg:hidden"
      >
        {navIcon}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={teamId}
            onChange={(event) => switchTeam(event.target.value)}
            className="w-44"
            aria-label="Active team"
          >
            {(teams.data ?? []).map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
            <option value="__new__">+ New team…</option>
          </Select>
          <p className="truncate text-xs text-ink-muted">
            <span className="font-medium text-ink">{state?.metrics.openTasks ?? 0} open</span>
            <span className="mx-1.5 text-ink-faint">·</span>
            <span className={(state?.metrics.overdue ?? 0) > 0 ? "text-signal-critical" : undefined}>
              {state?.metrics.overdue ?? 0} overdue
            </span>
            <span className="mx-1.5 text-ink-faint">·</span>
            <span className={(state?.metrics.blocked ?? 0) > 0 ? "text-signal-caution" : undefined}>
              {state?.metrics.blocked ?? 0} blocked
            </span>
          </p>
        </div>
      </div>

      <IntegrationStatus capabilities={state?.integrations.capabilities} />

      <div className="flex items-center gap-2 border-l border-hairline pl-3">
        <span className="hidden text-2xs text-ink-faint sm:block">
          {state ? `updated ${relativeTime(state.generatedAt)}` : "connecting…"}
        </span>
        <IconButton label="Refresh data" onClick={onRefresh} disabled={isRefreshing}>
          <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-ink")} />
        </IconButton>
        <ThemeToggle />
        <IconButton
          label="Sign out"
          onClick={() => {
            clearSessionToken();
            clearActiveTeamId();
            window.location.assign("/login");
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
        </IconButton>
      </div>
    </header>
  );
};
