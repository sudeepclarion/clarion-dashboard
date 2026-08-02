import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ExternalLink, Plus, RefreshCw, Ticket, Trash2 } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { Client, ClientItem, DashboardState } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/format/dates";
import { taskStatusStyle } from "@/lib/format/status";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { AiUnavailableNotice } from "@/components/layout/AiUnavailableNotice";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const BUCKETS = [
  {
    key: "criticalIssues" as const,
    title: "Critical issues",
    tone: "text-signal-critical",
    empty: "No critical issues detected.",
  },
  {
    key: "futureRequirements" as const,
    title: "Upcoming requirements",
    tone: "text-state-progress",
    empty: "No upcoming requirements captured.",
  },
  {
    key: "misc" as const,
    title: "Other details",
    tone: "text-ink-muted",
    empty: "Nothing else tracked.",
  },
];

const ItemRow = ({
  item,
  clientId,
  jiraBaseUrl,
}: {
  item: ClientItem;
  clientId: string;
  jiraBaseUrl: string;
}) => {
  const createTicket = useDashboardMutation(() => api.clients.createTicket(clientId, item.id));

  return (
    <li className="flex items-start gap-2.5 rounded-lg border border-hairline bg-base-900/30 px-3 py-2.5">
      <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">{item.text}</p>

      <div className="flex shrink-0 items-center gap-1.5">
        {item.status ? (
          <span
            className={cn(
              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px]",
              taskStatusStyle(item.status).pill
            )}
          >
            {taskStatusStyle(item.status).label}
          </span>
        ) : null}

        {item.ticketKey && jiraBaseUrl ? (
          <a
            href={`${jiraBaseUrl}/browse/${item.ticketKey}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[10px] text-cyan-clarion hover:underline"
          >
            {item.ticketKey}
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        ) : item.ticketKey ? (
          <Badge mono>{item.ticketKey}</Badge>
        ) : null}

        {item.taskId ? (
          <Link to={`/board?task=${item.taskId}`} className="text-[10px] text-cyan-clarion hover:underline">
            on board
          </Link>
        ) : (
          <Button
            size="sm"
            icon={<Ticket className="h-3 w-3" />}
            loading={createTicket.isPending}
            onClick={() => createTicket.mutate()}
          >
            Track it
          </Button>
        )}
      </div>
    </li>
  );
};

const ClientDetail = ({ client, state }: { client: Client; state: DashboardState }) => {
  const refresh = useDashboardMutation(() => api.clients.refresh(client.id));
  const remove = useDashboardMutation(() => api.clients.remove(client.id));
  const jiraBaseUrl = state.integrations.jira.baseUrl;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={client.name}
          eyebrow="Client"
          description={
            client.generatedAt
              ? `Rebuilt from board tasks, incidents and standups ${relativeTime(client.generatedAt)}.`
              : "Not populated yet."
          }
          actions={
            <>
              <Button
                icon={<RefreshCw className={cn("h-3.5 w-3.5", refresh.isPending && "animate-spin")} />}
                loading={refresh.isPending}
                disabled={!state.integrations.capabilities.ai}
                onClick={() => refresh.mutate()}
              >
                Rebuild
              </Button>
              <IconButton
                label="Stop tracking this client"
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Stop tracking ${client.name}?`)) remove.mutate();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </>
          }
        />
        {refresh.error ? (
          <Callout tone="error" className="mt-3">
            {refresh.error.message}
          </Callout>
        ) : null}
      </Panel>

      {BUCKETS.map((bucket) => {
        const items = client[bucket.key];
        return (
          <Panel key={bucket.key}>
            <PanelHeader
              title={
                <span className="flex items-center gap-2">
                  <span className={bucket.tone}>{bucket.title}</span>
                  <span className="rounded bg-base-900/70 px-1.5 py-0.5 text-[10px] tabular-nums text-ink-faint">
                    {items.length}
                  </span>
                </span>
              }
            />
            {items.length ? (
              <ul className="mt-3 space-y-2">
                {items.map((item) => (
                  <ItemRow key={item.id} item={item} clientId={client.id} jiraBaseUrl={jiraBaseUrl} />
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-2xs text-ink-faint">{bucket.empty}</p>
            )}
          </Panel>
        );
      })}
    </div>
  );
};

export const ClientsPage = ({ state }: { state: DashboardState }) => {
  const [name, setName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(state.clients[0]?.id ?? null);

  const add = useDashboardMutation((clientName: string) => api.clients.add(clientName), {
    onSuccess: (client) => {
      setName("");
      setSelectedId(client.id);
    },
  });

  const selected = state.clients.find((client) => client.id === selectedId) ?? state.clients[0];
  const aiReady = state.integrations.capabilities.ai;

  return (
    <>
      <PageHeader
        eyebrow="Accounts"
        title="Clients"
        description="Per-client risk, assembled from every task, incident and standup line that mentions them — so an escalation never lives only in someone's inbox."
      />

      {!aiReady ? <AiUnavailableNotice feature="Client views" /> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <aside className="space-y-3 lg:col-span-1">
          <Panel>
            <PanelHeader title="Track a client" />
            <div className="mt-3 flex gap-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && name.trim()) add.mutate(name.trim());
                }}
                placeholder="IIFL Homes"
                disabled={!aiReady}
              />
              <Button
                variant="primary"
                icon={<Plus className="h-3.5 w-3.5" />}
                disabled={!aiReady || !name.trim()}
                loading={add.isPending}
                onClick={() => add.mutate(name.trim())}
              />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              Adding a client immediately populates their view from existing context.
            </p>
            {add.error ? (
              <Callout tone="error" className="mt-3">
                {add.error.message}
              </Callout>
            ) : null}
            {add.data?.warning ? (
              <Callout tone="warning" className="mt-3">
                {add.data.warning}
              </Callout>
            ) : null}
          </Panel>

          {state.clients.length ? (
            <Panel flush>
              <ul className="divide-y divide-hairline/60">
                {state.clients.map((client) => {
                  const isActive = client.id === selected?.id;
                  return (
                    <li key={client.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(client.id)}
                        className={cn(
                          "flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors",
                          isActive ? "bg-surface-raised" : "hover:bg-surface-raised/60"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            client.criticalIssues.length ? "bg-signal-critical" : "bg-ink-faint/40"
                          )}
                        />
                        <span className={cn("min-w-0 flex-1 truncate text-xs", isActive ? "text-ink" : "text-ink-muted")}>
                          {client.name}
                        </span>
                        {client.criticalIssues.length ? (
                          <span className="shrink-0 text-[10px] tabular-nums text-signal-critical">
                            {client.criticalIssues.length}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : null}
        </aside>

        <div className="lg:col-span-3">
          {selected ? (
            <ClientDetail client={selected} state={state} />
          ) : (
            <EmptyState
              icon={<Building2 className="h-4 w-4" />}
              title="No clients tracked"
              description="Add a client on the left. Clarion will scan the board, incidents and standups for anything that mentions them and organise it into critical issues, upcoming requirements and other details."
            />
          )}
        </div>
      </div>
    </>
  );
};
