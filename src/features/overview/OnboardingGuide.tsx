import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, X } from "lucide-react";
import type { DashboardState } from "@/lib/api/types";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const STORAGE_KEY = "clarion_onboarding_dismissed";

type Step = {
  id: string;
  title: string;
  description: string;
  href: string;
  done: (state: DashboardState) => boolean;
};

const STEPS: Step[] = [
  {
    id: "team",
    title: "Add your team",
    description: "Invite people from Slack or create members under People / Settings.",
    href: "/people",
    done: (s) => s.members.length >= 2,
  },
  {
    id: "messaging",
    title: "Connect messaging",
    description: "Link Slack so standups and incidents can read your channels.",
    href: "/settings",
    done: (s) => Boolean(s.integrations.capabilities.messaging || s.integrations.capabilities.slack),
  },
  {
    id: "tickets",
    title: "Connect tickets",
    description: "Optional — sync Jira or Linear so board work stays mirrored.",
    href: "/settings",
    done: (s) => Boolean(s.integrations.capabilities.tickets || s.integrations.capabilities.jira),
  },
  {
    id: "standup",
    title: "Run your first standup",
    description: "Paste a standup update and let Clarion match tasks and blockers.",
    href: "/standup",
    done: (s) => s.standups.length > 0,
  },
];

/**
 * First-run checklist for self-serve trials. Dismissible; re-opens via ?onboarding=1.
 */
export const OnboardingGuide = ({ state }: { state: DashboardState }) => {
  const [params, setParams] = useSearchParams();
  const forceOpen = params.get("onboarding") === "1";
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  useEffect(() => {
    if (forceOpen) {
      setDismissed(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [forceOpen]);

  const items = STEPS;
  const allDone = items.every((step) => step.done(state));
  if (dismissed && !forceOpen) return null;
  if (allDone && !forceOpen) return null;

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
    if (forceOpen) {
      params.delete("onboarding");
      setParams(params, { replace: true });
    }
  };

  return (
    <Panel className="border-hairline bg-surface">
      <PanelHeader
        title="Get Clarion ready"
        description="Your org is on a 7-day free trial. Connect tools and run one standup to see the loop."
        actions={
          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 text-ink-faint hover:bg-base-900 hover:text-ink"
            aria-label="Dismiss setup guide"
          >
            <X className="h-4 w-4" />
          </button>
        }
      />
      <ul className="mt-4 space-y-3">
        {items.map((step) => {
          const done = step.done(state);
          return (
            <li key={step.id} className="flex gap-3">
              {done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-signal-positive" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
              )}
              <div className="min-w-0 flex-1">
                <Link
                  to={step.href}
                  className="text-sm font-medium text-ink hover:underline"
                >
                  {step.title}
                </Link>
                <p className="text-2xs text-ink-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
};
