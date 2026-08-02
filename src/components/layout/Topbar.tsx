import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Capabilities, DashboardState } from "@/lib/api/types";
import { relativeTime } from "@/lib/format/dates";
import { Dot } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/Button";

/**
 * Categories, not vendors: what matters at a glance is whether Clarion *can* read
 * tickets or transcripts, not which product is behind it.
 */
const INTEGRATIONS: Array<{ key: keyof Capabilities; label: string }> = [
  { key: "ai", label: "AI" },
  { key: "tickets", label: "Tickets" },
  { key: "messaging", label: "Chat" },
  { key: "meetings", label: "Meetings" },
  { key: "docs", label: "Docs" },
  { key: "code", label: "Code" },
];

/** Connection status strip — the manager can see at a glance what is live. */
const IntegrationStatus = ({ capabilities }: { capabilities?: Capabilities }) => (
  <div className="hidden items-center gap-3 md:flex">
    {INTEGRATIONS.map(({ key, label }) => {
      const isOn = Boolean(capabilities?.[key]);
      return (
        <span key={key} className="flex items-center gap-1.5 text-2xs" title={`${label}: ${isOn ? "connected" : "not configured"}`}>
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

export const Topbar = ({ state, isRefreshing, onRefresh, onOpenNav, navIcon }: TopbarProps) => (
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
      <p className="truncate text-xs text-ink-muted">
        <span className="font-medium text-ink">
          {state?.metrics.openTasks ?? 0} open
        </span>
        <span className="mx-1.5 text-ink-faint">·</span>
        {state?.metrics.overdue ?? 0} overdue
        <span className="mx-1.5 text-ink-faint">·</span>
        {state?.metrics.blocked ?? 0} blocked
      </p>
    </div>

    <IntegrationStatus capabilities={state?.integrations.capabilities} />

    <div className="flex items-center gap-2 border-l border-hairline pl-3">
      <span className="hidden text-2xs text-ink-faint sm:block">
        {state ? `updated ${relativeTime(state.generatedAt)}` : "connecting…"}
      </span>
      <IconButton label="Refresh data" onClick={onRefresh} disabled={isRefreshing}>
        <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin text-cyan-clarion")} />
      </IconButton>
    </div>
  </header>
);
