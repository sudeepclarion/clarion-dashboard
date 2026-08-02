import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import type { ProviderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Dot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";

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

/**
 * One provider's row: whether it is connected, what it unlocks, the exact
 * environment variables to set when it is not, and a live credential check.
 *
 * Every field comes from the backend's provider metadata, so this component never
 * needs to know which providers exist.
 */
export const ProviderRow = ({ provider }: { provider: ProviderStatus }) => {
  const test = useDashboardMutation(() => api.integrations.test(provider.id));

  return (
    <div className="flex flex-wrap items-start gap-3 border-b border-hairline/60 py-3 last:border-0">
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

        {!provider.configured ? (
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
  );
};
