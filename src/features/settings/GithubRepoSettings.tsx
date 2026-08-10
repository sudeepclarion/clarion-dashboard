import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Github, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState, GithubMainBranchScanJob, GithubRepoCatalogEntry } from "@/lib/api/types";
import { useDashboardMutation } from "@/lib/hooks/useDashboard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { Panel, PanelHeader } from "@/components/ui/Panel";

const fallbackFromState = (state: DashboardState): GithubRepoCatalogEntry[] =>
  state.integrations.github.repos.map((entry) => ({
    fullName: entry.repo,
    private: false,
    description: null,
    updatedAt: entry.scannedAt ?? "",
    language: null,
    defaultBranch: entry.branch ?? "main",
    mainBranch: entry.branch,
    contributors: entry.contributors ?? [],
    scannedAt: entry.scannedAt ?? null,
  }));

export const GithubRepoSettings = ({ state }: { state: DashboardState }) => {
  const queryClient = useQueryClient();
  const [scanJob, setScanJob] = useState<GithubMainBranchScanJob | null>(null);

  const catalog = useQuery({
    queryKey: queryKeys.githubCatalog,
    queryFn: () => api.integrations.github.catalog(),
  });

  const scan = useDashboardMutation(() => api.integrations.github.scanMain(), {
    onSuccess: (job) => {
      setScanJob(job);
    },
  });

  const scanning = scanJob?.status === "running" || scan.isPending;

  useEffect(() => {
    if (scanJob?.status !== "running") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const job = await api.integrations.github.scanMainStatus();
        if (cancelled) return;
        setScanJob(job);
        if (job.status === "completed" || job.status === "failed") {
          void queryClient.invalidateQueries({ queryKey: queryKeys.githubCatalog });
          void queryClient.invalidateQueries({ queryKey: queryKeys.state });
        }
      } catch {
        /* keep last known job; next poll retries */
      }
    };

    void tick();
    const id = window.setInterval(() => void tick(), 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [scanJob?.status, queryClient]);

  const repos = catalog.data ?? fallbackFromState(state);
  const scannedCount = repos.filter((repo) => repo.scannedAt).length;

  return (
    <Panel>
      <PanelHeader
        title="GitHub repositories"
        description="Every repo your GitHub token can access. Main branch search picks the branch with the most recent commits and maps authors to Clarion team members."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              loading={catalog.isFetching}
              disabled={scanning}
              onClick={() => void catalog.refetch()}
            >
              Refresh list
            </Button>
            <Button
              variant="primary"
              icon={<Search className="h-3.5 w-3.5" />}
              loading={scanning}
              onClick={() => scan.mutate()}
            >
              Main branch search
            </Button>
          </div>
        }
      />

      {scan.error ? (
        <Callout tone="error" className="mt-3">
          {scan.error.message}
        </Callout>
      ) : null}
      {scanJob?.status === "running" ? (
        <Callout tone="info" className="mt-3">
          Scanning {scanJob.done}/{scanJob.total || "…"}
          {scanJob.currentRepo ? ` · ${scanJob.currentRepo}` : ""}. This can take a few minutes —
          leave this page open.
        </Callout>
      ) : null}
      {scanJob?.status === "completed" ? (
        <Callout tone="success" className="mt-3">
          Scanned {scanJob.scanned} of {scanJob.total} repos
          {scanJob.failed.length ? ` · ${scanJob.failed.length} failed` : ""}.
        </Callout>
      ) : null}
      {scanJob?.status === "failed" ? (
        <Callout tone="error" className="mt-3">
          {scanJob.error ?? "Main branch search failed."}
        </Callout>
      ) : null}
      {catalog.error ? (
        <Callout tone="error" className="mt-3">
          {(catalog.error as Error).message}
        </Callout>
      ) : null}

      <p className="mt-3 text-2xs text-ink-faint">
        {catalog.isLoading && !repos.length
          ? "Loading repositories…"
          : `${repos.length} accessible · ${scannedCount} with main branch scanned`}
      </p>

      <ul className="mt-3 space-y-1.5">
        {repos.map((repo) => (
          <li
            key={repo.fullName}
            className="flex flex-wrap items-start gap-2 rounded-lg border border-hairline bg-base-900/30 px-3 py-2.5"
          >
            <Github className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-faint" />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-mono text-2xs text-ink">{repo.fullName}</span>
                {repo.private ? <Badge>private</Badge> : null}
                {repo.language ? <span className="text-2xs text-ink-faint">{repo.language}</span> : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-ink-faint">
                <span>
                  main{" "}
                  <span className="font-mono text-ink-muted">
                    {repo.mainBranch ?? repo.defaultBranch}
                    {!repo.mainBranch ? " (default)" : ""}
                  </span>
                </span>
                {repo.scannedAt ? (
                  <span>scanned {new Date(repo.scannedAt).toLocaleString()}</span>
                ) : (
                  <span>not scanned yet</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {repo.contributors.length ? (
                  repo.contributors.map((name) => <Badge key={name}>{name}</Badge>)
                ) : (
                  <span className="text-2xs text-ink-faint">
                    {repo.scannedAt
                      ? "No matching team members on this branch"
                      : "Run main branch search to find contributors"}
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
        {!catalog.isLoading && !repos.length ? (
          <li className="py-4 text-center text-2xs text-ink-faint">
            No repositories visible to this GitHub token.
          </li>
        ) : null}
      </ul>
    </Panel>
  );
};
