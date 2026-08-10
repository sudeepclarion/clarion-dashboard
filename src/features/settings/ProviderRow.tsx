import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { ProviderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Dot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Field, Input } from "@/components/ui/Field";
import { queryKeys } from "@/lib/api/queryKeys";

const MANAGED = new Set(["slack", "jira", "github"]);

/** Comma-separated env var names, rendered as code. */
const EnvList = ({ names, muted = false }: { names: string[]; muted?: boolean }) => (
  <>
    {names.map((name, index) => (
      <span key={name}>
        {index > 0 ? ", " : ""}
        <code className={cn("font-mono text-[10px]", muted ? "text-ink-faint" : "text-ink-muted")}>{name}</code>
      </span>
    ))}
  </>
);

const SlackForm = ({
  configured,
  canEdit,
  onDone,
}: {
  configured: boolean;
  canEdit: boolean;
  onDone: () => void;
}) => {
  const [botToken, setBotToken] = useState("");
  const [appToken, setAppToken] = useState("");
  const [adminUsers, setAdminUsers] = useState("");
  const [allowedUsers, setAllowedUsers] = useState("");
  const [open, setOpen] = useState(!configured);

  const save = useDashboardMutation(
    () =>
      api.integrations.putCredentials("slack", {
        botToken,
        appToken: appToken || undefined,
        adminUsers,
        allowedUsers,
      }),
    {
      onSuccess: () => {
        setBotToken("");
        setAppToken("");
        setOpen(false);
        onDone();
      },
    }
  );

  const disconnect = useDashboardMutation(() => api.integrations.deleteCredentials("slack"), {
    onSuccess: () => {
      setOpen(true);
      onDone();
    },
  });

  if (!canEdit) return null;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-hairline/70 bg-base-900/40 p-3">
      {configured && !open ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Update credentials
          </Button>
          <Button size="sm" variant="ghost" loading={disconnect.isPending} onClick={() => disconnect.mutate()}>
            Disconnect
          </Button>
        </div>
      ) : (
        <>
          <Field label="Bot token (xoxb-…)">
            <Input
              type="password"
              autoComplete="off"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="xoxb-…"
            />
          </Field>
          <Field label="App token (xapp-…) — optional, for DMs / @mentions">
            <Input
              type="password"
              autoComplete="off"
              value={appToken}
              onChange={(e) => setAppToken(e.target.value)}
              placeholder="xapp-…"
            />
          </Field>
          <Field label="Admin users (IDs or emails, comma-separated)">
            <Input value={adminUsers} onChange={(e) => setAdminUsers(e.target.value)} placeholder="U0123,you@acme.com" />
          </Field>
          <Field label="Allowed users (blank = everyone)">
            <Input value={allowedUsers} onChange={(e) => setAllowedUsers(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" loading={save.isPending} disabled={!botToken.trim()} onClick={() => save.mutate()}>
              Save Slack
            </Button>
            {configured ? (
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
          {save.error ? (
            <Callout tone="error">{save.error.message}</Callout>
          ) : null}
          {disconnect.error ? (
            <Callout tone="error">{disconnect.error.message}</Callout>
          ) : null}
        </>
      )}
    </div>
  );
};

const JiraForm = ({
  configured,
  canEdit,
  onDone,
}: {
  configured: boolean;
  canEdit: boolean;
  onDone: () => void;
}) => {
  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [projectKey, setProjectKey] = useState("");
  const [boardId, setBoardId] = useState("");
  const [autoCreate, setAutoCreate] = useState(false);
  const [open, setOpen] = useState(!configured);

  const save = useDashboardMutation(
    () =>
      api.integrations.putCredentials("jira", {
        baseUrl,
        email,
        apiToken,
        projectKey: projectKey || "AC",
        boardId: boardId || undefined,
        sprintBoardId: boardId || undefined,
        autoCreateIssues: autoCreate,
      }),
    {
      onSuccess: () => {
        setApiToken("");
        setOpen(false);
        onDone();
      },
    }
  );

  const disconnect = useDashboardMutation(() => api.integrations.deleteCredentials("jira"), {
    onSuccess: () => {
      setOpen(true);
      onDone();
    },
  });

  if (!canEdit) return null;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-hairline/70 bg-base-900/40 p-3">
      {configured && !open ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Update credentials
          </Button>
          <Button size="sm" variant="ghost" loading={disconnect.isPending} onClick={() => disconnect.mutate()}>
            Disconnect
          </Button>
        </div>
      ) : (
        <>
          <Field label="Site URL">
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://yourcompany.atlassian.net"
            />
          </Field>
          <Field label="Atlassian email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="API token">
            <Input
              type="password"
              autoComplete="off"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
            />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Project key">
              <Input value={projectKey} onChange={(e) => setProjectKey(e.target.value)} placeholder="ENG" />
            </Field>
            <Field label="Board ID">
              <Input value={boardId} onChange={(e) => setBoardId(e.target.value)} placeholder="42" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-2xs text-ink-muted">
            <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
            Auto-create Jira issues for new Clarion tasks
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              size="sm"
              loading={save.isPending}
              disabled={!baseUrl.trim() || !email.trim() || !apiToken.trim()}
              onClick={() => save.mutate()}
            >
              Save Jira
            </Button>
            {configured ? (
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
          {save.error ? <Callout tone="error">{save.error.message}</Callout> : null}
          {disconnect.error ? <Callout tone="error">{disconnect.error.message}</Callout> : null}
        </>
      )}
    </div>
  );
};

const GithubForm = ({
  configured,
  canEdit,
  onDone,
}: {
  configured: boolean;
  canEdit: boolean;
  onDone: () => void;
}) => {
  const [token, setToken] = useState("");
  const [defaultOrg, setDefaultOrg] = useState("");
  const [open, setOpen] = useState(!configured);

  const save = useDashboardMutation(
    () =>
      api.integrations.putCredentials("github", {
        token,
        defaultOrg: defaultOrg || undefined,
      }),
    {
      onSuccess: () => {
        setToken("");
        setOpen(false);
        onDone();
      },
    }
  );

  const disconnect = useDashboardMutation(() => api.integrations.deleteCredentials("github"), {
    onSuccess: () => {
      setOpen(true);
      onDone();
    },
  });

  if (!canEdit) return null;

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-hairline/70 bg-base-900/40 p-3">
      {configured && !open ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
            Update credentials
          </Button>
          <Button size="sm" variant="ghost" loading={disconnect.isPending} onClick={() => disconnect.mutate()}>
            Disconnect
          </Button>
        </div>
      ) : (
        <>
          <Field label="Personal access token">
            <Input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} />
          </Field>
          <Field label="Default org (optional)">
            <Input value={defaultOrg} onChange={(e) => setDefaultOrg(e.target.value)} placeholder="acme-org" />
          </Field>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" loading={save.isPending} disabled={!token.trim()} onClick={() => save.mutate()}>
              Save GitHub
            </Button>
            {configured ? (
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
          {save.error ? <Callout tone="error">{save.error.message}</Callout> : null}
          {disconnect.error ? <Callout tone="error">{disconnect.error.message}</Callout> : null}
        </>
      )}
    </div>
  );
};

/**
 * One provider's row: connection status, live test, and (for Slack/Jira/GitHub)
 * org-admin credential forms stored per organization.
 */
export const ProviderRow = ({ provider }: { provider: ProviderStatus }) => {
  const test = useDashboardMutation(() => api.integrations.test(provider.id));
  const me = useQuery({ queryKey: queryKeys.me, queryFn: api.auth.me, staleTime: 60_000 });
  const canEdit = me.data?.role === "admin";
  const managed = MANAGED.has(provider.id);

  return (
    <div className="border-b border-hairline/60 py-3 last:border-0">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-1.5 shrink-0">
          <Dot className={provider.configured ? "bg-signal-positive" : "bg-ink-faint/40"} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink">
            {provider.name}
            <span
              className={cn("text-2xs font-normal", provider.configured ? "text-signal-positive" : "text-ink-faint")}
            >
              {provider.configured ? "connected" : "not configured"}
            </span>
            {provider.docsUrl ? (
              <a
                href={provider.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-2xs text-cyan-clarion hover:underline"
              >
                get credentials <ExternalLink className="h-2.5 w-2.5" />
              </a>
            ) : null}
          </p>

          <p className="mt-0.5 text-2xs leading-relaxed text-ink-muted">{provider.summary}</p>

          {!provider.configured && !managed ? (
            <p className="mt-1.5 text-2xs text-ink-faint">
              Set <EnvList names={provider.requiredEnv} /> in the backend environment and restart it.
              {provider.optionalEnv.length ? (
                <>
                  {" "}
                  Optional: <EnvList names={provider.optionalEnv} muted />.
                </>
              ) : null}
            </p>
          ) : null}

          {!provider.configured && managed && !canEdit ? (
            <p className="mt-1.5 text-2xs text-ink-faint">Ask an org admin to connect {provider.name} in Settings.</p>
          ) : null}

          {test.data ? (
            <Callout tone={test.data.ok ? "success" : "error"} className="mt-2">
              {test.data.detail}
            </Callout>
          ) : null}
          {test.error ? (
            <Callout tone="error" className="mt-2">
              {test.error.message}
            </Callout>
          ) : null}
        </div>

        {provider.configured ? (
          <Button size="sm" loading={test.isPending} onClick={() => test.mutate()}>
            Test
          </Button>
        ) : null}
      </div>

      {provider.id === "slack" ? (
        <SlackForm configured={provider.configured} canEdit={Boolean(canEdit)} onDone={() => undefined} />
      ) : null}
      {provider.id === "jira" ? (
        <JiraForm configured={provider.configured} canEdit={Boolean(canEdit)} onDone={() => undefined} />
      ) : null}
      {provider.id === "github" ? (
        <GithubForm configured={provider.configured} canEdit={Boolean(canEdit)} onDone={() => undefined} />
      ) : null}
    </div>
  );
};
