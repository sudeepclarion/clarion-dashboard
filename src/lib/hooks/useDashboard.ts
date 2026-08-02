import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import { api } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DashboardState } from "@/lib/api/types";

/** How often the dashboard silently refreshes while a tab is open. */
const REFRESH_MS = 30_000;

/**
 * The whole dashboard reads from one query. Any mutation invalidates it, so a change
 * made anywhere (board, chat, standup) is reflected everywhere without per-screen
 * cache plumbing.
 */
export const useDashboard = () =>
  useQuery({
    queryKey: queryKeys.state,
    queryFn: api.dashboard.state,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

/**
 * A mutation that refreshes dashboard state on success. Every write in the app uses
 * this, which is why the UI is never stale after an action.
 */
export const useDashboardMutation = <TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: Omit<UseMutationOptions<TData, Error, TVariables>, "mutationFn">
) => {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn,
    ...options,
    onSuccess: async (data, variables, onMutateResult, context) => {
      await options?.onSuccess?.(data, variables, onMutateResult, context);
      await queryClient.invalidateQueries({ queryKey: queryKeys.state });
    },
  });
};

/** Derived lookups that several screens need. */
export const dashboardHelpers = (state: DashboardState | undefined) => ({
  memberNames: state?.members.map((member) => member.name) ?? [],
  sprintName: (sprintId: string | null): string | null =>
    state?.sprints.find((sprint) => sprint.id === sprintId)?.name ?? null,
  taskById: (taskId: string) => state?.tasks.find((task) => task.id === taskId),
  jiraBrowseUrl: (key: string | null | undefined): string | null => {
    const baseUrl = state?.integrations.jira.baseUrl;
    return baseUrl && key ? `${baseUrl}/browse/${key}` : null;
  },
});
