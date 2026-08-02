import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Github, Plus, X } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { AllowedRepo, DashboardState } from "@/lib/api/types";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Input } from "@/components/ui/Field";
import { Panel, PanelHeader } from "@/components/ui/Panel";

export const GithubRepoSettings = ({ state }: { state: DashboardState }) => {
  const [repos, setRepos] = useState<AllowedRepo[]>(state.integrations.github.repos);
  const [filter, setFilter] = useState("");
  const [browsing, setBrowsing] = useState(false);

  const available = useQuery({
    queryKey: queryKeys.githubAvailable,
    queryFn: () => api.integrations.github.available(),
    enabled: browsing,
  });

  const save = useDashboardMutation(() => api.integrations.github.save(repos));

  const isDirty =
    JSON.stringify([...repos].sort((a, b) => a.repo.localeCompare(b.repo))) !==
    JSON.stringify([...state.integrations.github.repos].sort((a, b) => a.repo.localeCompare(b.repo)));

  const enabled = new Set(repos.map((entry) => entry.repo.toLowerCase()));
  const candidates = (available.data ?? [])
    .filter((repo) => !enabled.has(repo.fullName.toLowerCase()))
    .filter((repo) => repo.fullName.toLowerCase().includes(filter.toLowerCase()))
    .slice(0, 40);

  return (
    <Panel>
      <PanelHeader
        title="Repository access"
        description="Clarion only reads repos you list here. The deployed branch is what makes “merged to production” and “queued for production” answerable — leave it blank to use the repo default."
        actions={
          isDirty ? (
            <Button variant="primary" icon={<Check className="h-3.5 w-3.5" />} loading={save.isPending} onClick={() => save.mutate()}>
              Save changes
            </Button>
          ) : null
        }
      />

      {save.error ? (
        <Callout tone="error" className="mt-3">
          {save.error.message}
        </Callout>
      ) : null}

      <ul className="mt-3 space-y-1.5">
        {repos.map((entry) => (
          <li
            key={entry.repo}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-base-900/30 px-3 py-2"
          >
            <Github className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink">{entry.repo}</span>
            <span className="text-2xs text-ink-faint">deployed</span>
            <Input
              value={entry.branch ?? ""}
              onChange={(event) =>
                setRepos((current) =>
                  current.map((candidate) =>
                    candidate.repo === entry.repo ? { ...candidate, branch: event.target.value || null } : candidate
                  )
                )
              }
              placeholder="default"
              className="h-7 w-28 font-mono text-2xs"
            />
            <IconButton
              label={`Remove ${entry.repo}`}
              variant="danger"
              onClick={() => setRepos((current) => current.filter((candidate) => candidate.repo !== entry.repo))}
            >
              <X className="h-3 w-3" />
            </IconButton>
          </li>
        ))}
        {!repos.length ? <li className="py-4 text-center text-2xs text-ink-faint">No repos enabled.</li> : null}
      </ul>

      <div className="mt-4 border-t border-hairline pt-3">
        {!browsing ? (
          <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setBrowsing(true)}>
            Browse available repos
          </Button>
        ) : (
          <>
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={available.data ? `Filter ${available.data.length} repos…` : "Loading repos…"}
            />
            {available.error ? (
              <Callout tone="error" className="mt-2">
                {(available.error as Error).message}
              </Callout>
            ) : null}
            <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
              {candidates.map((repo) => (
                <li key={repo.fullName}>
                  <button
                    type="button"
                    onClick={() =>
                      setRepos((current) => [...current, { repo: repo.fullName, branch: repo.defaultBranch }])
                    }
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-raised"
                  >
                    <span className="min-w-0 flex-1 truncate font-mono text-2xs text-ink-muted">
                      {repo.fullName}
                    </span>
                    {repo.private ? <Badge>private</Badge> : null}
                    {repo.language ? <span className="text-2xs text-ink-faint">{repo.language}</span> : null}
                    <span className="font-mono text-[10px] text-ink-faint">{repo.defaultBranch}</span>
                    <Plus className="h-3 w-3 shrink-0 text-cyan-clarion" />
                  </button>
                </li>
              ))}
              {available.data && !candidates.length ? (
                <li className="py-3 text-center text-2xs text-ink-faint">
                  {filter ? "No matches." : "Every accessible repo is already enabled."}
                </li>
              ) : null}
            </ul>
          </>
        )}
      </div>
    </Panel>
  );
};
