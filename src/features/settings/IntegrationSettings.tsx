import { RefreshCw } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { CategoryStatus, DashboardState } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format/dates";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Badge, Dot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { ProviderRow } from "./ProviderRow";
import { GithubRepoSettings } from "./GithubRepoSettings";

/**
 * Integrations, grouped by what they are *for* rather than by vendor.
 *
 * The whole screen renders from the backend's catalogue, so a provider added under
 * `integrations/<category>/` shows up here — with its setup instructions and a
 * working test button — without any change to this file.
 */

const CategoryPanel = ({ category }: { category: CategoryStatus }) => {
  const connected = category.providers.filter((provider) => provider.configured).length;

  return (
    <Panel>
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            {category.label}
            {connected ? (
              <Badge className="bg-signal-positive/10 text-signal-positive ring-signal-positive/25">
                {connected} connected
              </Badge>
            ) : (
              <Badge className="text-ink-faint">none connected</Badge>
            )}
          </span>
        }
        description={category.purpose}
      />
      <div className="mt-2">
        {category.providers.map((provider) => (
          <ProviderRow key={provider.id} provider={provider} />
        ))}
      </div>
    </Panel>
  );
};

const TrackerSyncPanel = ({ state }: { state: DashboardState }) => {
  const sync = useDashboardMutation(() => api.integrations.jira.sync());
  const lastSync = state.integrations.jira.lastSync;
  const tracker = state.integrations.activeTracker;

  return (
    <Panel>
      <PanelHeader
        title="Ticket sync"
        description={
          tracker
            ? `New tickets are created in ${tracker.name}. Pull imports new tickets and refreshes linked ones — the tracker wins on pull. Finished tickets untouched for two weeks are skipped so the board stays useful.`
            : "No issue tracker is connected, so there is nothing to sync."
        }
        actions={
          tracker ? (
            <Button
              icon={<RefreshCw className={cn("h-3.5 w-3.5", sync.isPending && "animate-spin")} />}
              loading={sync.isPending}
              onClick={() => sync.mutate()}
            >
              Sync now
            </Button>
          ) : null
        }
      />

      {lastSync ? (
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Last sync", relativeTime(lastSync.at)],
            ["Source", lastSync.providerId],
            ["Tickets", lastSync.total],
            ["Imported", lastSync.imported],
            ["Updated", lastSync.updated],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-2xs text-ink-faint">{label}</dt>
              <dd className="text-xs font-medium tabular-nums text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : tracker ? (
        <p className="mt-3 text-2xs text-ink-faint">Never synced.</p>
      ) : null}

      {sync.error ? (
        <Callout tone="error" className="mt-3">
          {sync.error.message}
        </Callout>
      ) : null}
      {sync.data ? (
        <Callout tone="success" className="mt-3">
          {sync.data.imported} imported, {sync.data.updated} updated of {sync.data.total} tickets.
        </Callout>
      ) : null}
    </Panel>
  );
};

export const IntegrationSettings = ({ state }: { state: DashboardState }) => {
  const { categories, capabilities } = state.integrations;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title="How connections work"
          description="Slack, Jira and GitHub credentials are stored for the active Clarion team (switch teams in the top bar). Other providers still use backend environment variables. Anything unconfigured is absent from the assistant's toolset."
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <Badge
              key={category.category}
              className={
                category.enabled
                  ? "bg-signal-positive/10 text-signal-positive ring-signal-positive/25"
                  : "text-ink-faint"
              }
            >
              {category.label}
            </Badge>
          ))}
        </div>
      </Panel>

      {/* The model is not an integration category, but it gates most features. */}
      <Panel>
        <PanelHeader
          title="Reasoning model"
          description={`Powers standup parsing, meeting extraction, reports, client views, incident analysis and the assistant. Currently ${state.ai.model} at ${state.ai.effort} effort.`}
        />
        <div className="mt-2 flex items-center gap-2">
          <Dot className={capabilities.ai ? "bg-signal-positive" : "bg-ink-faint/40"} />
          <span className="text-xs text-ink-muted">
            {capabilities.ai ? (
              "connected"
            ) : (
              <>
                not configured — set <code className="font-mono text-[10px]">ANTHROPIC_API_KEY</code> in the
                backend environment and restart it.
              </>
            )}
          </span>
        </div>
      </Panel>

      {categories.map((category) => (
        <CategoryPanel key={category.category} category={category} />
      ))}

      {capabilities.tickets ? <TrackerSyncPanel state={state} /> : null}
      {capabilities.code ? <GithubRepoSettings state={state} /> : null}
    </div>
  );
};
