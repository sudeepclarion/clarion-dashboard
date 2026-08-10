import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  Bot,
  Building2,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  Settings,
  Siren,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoMark, Wordmark } from "@/components/brand/Logo";
import type { DashboardState } from "@/lib/api/types";
import { Topbar } from "./Topbar";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  /** Numeric badge showing work that needs attention. */
  badge?: (state: DashboardState) => number | undefined;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/**
 * Navigation is grouped by what the manager is doing, not by data model: run the
 * day, review the week, then configure. Badges only ever show things that need
 * attention — never neutral totals — so a badge always means "look here".
 */
const NAV: NavSection[] = [
  {
    title: "Operate",
    items: [
      { to: "/", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
      {
        to: "/board",
        label: "Board",
        icon: <KanbanSquare className="h-4 w-4" />,
        badge: (state) => state.metrics.blocked || undefined,
      },
      { to: "/standup", label: "Standup", icon: <ClipboardList className="h-4 w-4" /> },
      { to: "/daily", label: "Daily", icon: <CalendarDays className="h-4 w-4" /> },
      { to: "/meetings", label: "Meetings", icon: <Video className="h-4 w-4" /> },
      { to: "/sprints", label: "Sprints", icon: <CalendarRange className="h-4 w-4" /> },
    ],
  },
  {
    title: "Understand",
    items: [
      { to: "/people", label: "People", icon: <Users className="h-4 w-4" /> },
      { to: "/review", label: "Weekly review", icon: <Activity className="h-4 w-4" /> },
      {
        to: "/incidents",
        label: "Incidents",
        icon: <Siren className="h-4 w-4" />,
        badge: (state) => state.metrics.openIncidents || undefined,
      },
      {
        to: "/clients",
        label: "Clients",
        icon: <Building2 className="h-4 w-4" />,
        badge: (state) => state.metrics.openCriticalClientIssues || undefined,
      },
      { to: "/reports", label: "Reports", icon: <ClipboardList className="h-4 w-4" /> },
    ],
  },
  {
    title: "Assist",
    items: [
      { to: "/assistant", label: "Assistant", icon: <Bot className="h-4 w-4" /> },
      { to: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    ],
  },
];

const NavLinks = ({ state, onNavigate }: { state?: DashboardState; onNavigate?: () => void }) => (
  <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
    {NAV.map((section) => (
      <div key={section.title}>
        <p className="eyebrow px-2 pb-2">{section.title}</p>
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const badge = state && item.badge ? item.badge(state) : undefined;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                      isActive
                        ? "bg-surface-raised text-ink ring-1 ring-inset ring-hairline"
                        : "text-ink-muted hover:bg-surface-raised/60 hover:text-ink"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={cn("shrink-0", isActive ? "text-cyan-clarion" : "text-ink-faint")}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {badge ? (
                        <span className="rounded bg-signal-critical/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-signal-critical">
                          {badge}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </nav>
);

const SidebarFooter = ({ state }: { state?: DashboardState }) => (
  <div className="border-t border-hairline px-4 py-3">
    <p className="text-2xs text-ink-faint">
      Reasoning model
      <span className="ml-1.5 font-mono text-[10px] text-ink-muted">{state?.ai.model ?? "—"}</span>
    </p>
    <p className="mt-0.5 text-2xs text-ink-faint">
      Effort <span className="font-mono text-[10px] text-ink-muted">{state?.ai.effort ?? "—"}</span>
    </p>
  </div>
);

export interface AppShellProps {
  state?: DashboardState;
  isRefreshing: boolean;
  onRefresh: () => void;
  children: ReactNode;
}

export const AppShell = ({ state, isRefreshing, onRefresh, children }: AppShellProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-hairline bg-base-900/50 lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-hairline px-4">
          <LogoMark className="h-7 w-7" />
          <Wordmark />
        </div>
        <NavLinks state={state} />
        <SidebarFooter state={state} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-base-900/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col border-r border-hairline bg-base-800">
            <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-7 w-7" />
                <Wordmark />
              </div>
              <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4 text-ink-muted" />
              </button>
            </div>
            <NavLinks state={state} onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter state={state} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          state={state}
          isRefreshing={isRefreshing}
          onRefresh={onRefresh}
          onOpenNav={() => setMobileOpen(true)}
          navIcon={<Menu className="h-4 w-4" />}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {state && state.members.length < 1 ? (
            <div className="border-b border-signal-caution/30 bg-signal-caution/10 px-4 py-2.5 text-center text-xs text-signal-caution sm:px-6 lg:px-8">
              This team has no members yet (minimum 1).{" "}
              <NavLink to="/settings?tab=team" className="font-medium underline hover:text-ink">
                Add people from Slack in Settings → Team
              </NavLink>{" "}
              before triage or Jira sync.
            </div>
          ) : null}
          <div className="mx-auto w-full max-w-[100rem] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
