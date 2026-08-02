import { Navigate, Route, Routes } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { AssistantPage } from "@/features/assistant/AssistantPage";
import { BoardPage } from "@/features/board/BoardPage";
import { ClientsPage } from "@/features/clients/ClientsPage";
import { IncidentsPage } from "@/features/incidents/IncidentsPage";
import { MeetingsPage } from "@/features/meetings/MeetingsPage";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { PeoplePage } from "@/features/people/PeoplePage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { ReviewPage } from "@/features/review/ReviewPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { SprintsPage } from "@/features/sprints/SprintsPage";
import { StandupPage } from "@/features/standup/StandupPage";

/** First-load placeholder that mirrors the real layout, to avoid a jump. */
const LoadingState = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-20" />
      ))}
    </div>
    <Skeleton className="h-64" />
  </div>
);

export const App = () => {
  const dashboard = useDashboard();

  return (
    <AppShell
      state={dashboard.data}
      isRefreshing={dashboard.isFetching}
      onRefresh={() => void dashboard.refetch()}
    >
      {dashboard.isLoading ? (
        <LoadingState />
      ) : dashboard.error || !dashboard.data ? (
        <EmptyState
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Cannot reach the Clarion API"
          description={
            <>
              {(dashboard.error as Error | null)?.message ??
                "The backend did not respond."}{" "}
              Start it with <code className="font-mono text-[11px]">npm run dev</code> in{" "}
              <code className="font-mono text-[11px]">clarion-backend</code>.
            </>
          }
          action={
            <Button variant="primary" onClick={() => void dashboard.refetch()}>
              Try again
            </Button>
          }
        />
      ) : (
        <Routes>
          <Route path="/" element={<OverviewPage state={dashboard.data} />} />
          <Route path="/board" element={<BoardPage state={dashboard.data} />} />
          <Route path="/standup" element={<StandupPage state={dashboard.data} />} />
          <Route path="/sprints" element={<SprintsPage state={dashboard.data} />} />
          <Route path="/meetings" element={<MeetingsPage state={dashboard.data} />} />
          <Route path="/people" element={<PeoplePage state={dashboard.data} />} />
          <Route path="/review" element={<ReviewPage state={dashboard.data} />} />
          <Route path="/incidents" element={<IncidentsPage state={dashboard.data} />} />
          <Route path="/clients" element={<ClientsPage state={dashboard.data} />} />
          <Route path="/reports" element={<ReportsPage state={dashboard.data} />} />
          <Route path="/assistant" element={<AssistantPage state={dashboard.data} />} />
          <Route path="/settings" element={<SettingsPage state={dashboard.data} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AppShell>
  );
};

