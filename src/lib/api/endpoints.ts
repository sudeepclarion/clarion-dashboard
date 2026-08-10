import { http, loginRequest } from "./http";
import type {
  ActivityEntry,
  AvailableMeeting,
  CategoryStatus,
  DocumentHit,
  MeetingRecord,
  ProviderHealth,
  AllowedRepo,
  AvailableRepo,
  Capabilities,
  ChatMessage,
  ChatTurnResult,
  Client,
  ClientItem,
  DashboardMetrics,
  DashboardState,
  IncidentReport,
  TicketSyncRecord,
  Member,
  MemberStats,
  MemberSummary,
  Page,
  ReportSummary,
  ReviewResult,
  Sprint,
  Standup,
  Task,
  TaskDraft,
  TaskPatch,
  TaskStatus,
  TeamActivityReport,
  WeeklyReport,
} from "./types";

export type AuthUserRole = "admin" | "member";

export interface AuthUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: AuthUserRole;
  status: "active" | "disabled";
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

/**
 * Every backend call the app can make, named after the intent rather than the URL.
 * Components and hooks import from here and never build a path themselves.
 */
export const api = {
  auth: {
    login: (email: string, password: string) => loginRequest<LoginResult>(email, password),
    me: () => http.get<AuthUser>("/auth/me"),
  },

  dashboard: {
    state: () => http.get<DashboardState>("/state"),
    metrics: () => http.get<DashboardMetrics>("/metrics"),
    activity: (limit = 100) => http.get<ActivityEntry[]>("/activity", { limit }),
    health: () =>
      http.get<{
        status: string;
        model: string;
        capabilities: Capabilities;
        auth?: { jwt: boolean; apiSecret: boolean; usersStore: boolean };
      }>("/health"),
  },

  tasks: {
    list: (query?: {
      status?: TaskStatus[];
      assignee?: string;
      sprintId?: string;
      q?: string;
      overdueOnly?: boolean;
      includeDone?: boolean;
      offset?: number;
      limit?: number;
    }) => http.get<Page<Task>>("/tasks", query),
    get: (id: string) => http.get<Task>(`/tasks/${id}`),
    create: (draft: TaskDraft) => http.post<Task>("/tasks", draft),
    update: (id: string, patch: TaskPatch) =>
      http.patch<{ task: Task; changes: string[] }>(`/tasks/${id}`, patch),
    setStatus: (id: string, status: TaskStatus, note?: string) =>
      http.post<{ task: Task; changes: string[] }>(`/tasks/${id}/status`, { status, note }),
    remove: (id: string) => http.delete<void>(`/tasks/${id}`),
    bulk: (selection: { taskIds?: string[]; filter?: Record<string, unknown> }, set: TaskPatch) =>
      http.post<{ matched: number; updated: number }>("/tasks/bulk", { ...selection, set }),
    linkTicket: (id: string, key: string) => http.post<Task>(`/tasks/${id}/jira/link`, { key }),
    createTicket: (id: string) => http.post<Task>(`/tasks/${id}/jira/create`),
  },

  members: {
    list: () => http.get<MemberStats[]>("/members"),
    add: (name: string, role?: string) => http.post<Member>("/members", { name, role }),
    update: (id: string, changes: { name?: string; role?: string | null }) =>
      http.patch<Member>(`/members/${id}`, changes),
    remove: (id: string) => http.delete<void>(`/members/${id}`),
    refreshSummaries: () => http.post<Record<string, MemberSummary>>("/members/summaries"),
  },

  sprints: {
    list: () => http.get<Sprint[]>("/sprints"),
    create: (draft: { name: string; goal?: string; startDate: string; endDate: string }) =>
      http.post<Sprint>("/sprints", draft),
    update: (id: string, changes: { name?: string; goal?: string; startDate?: string; endDate?: string }) =>
      http.patch<Sprint>(`/sprints/${id}`, changes),
    remove: (id: string) => http.delete<void>(`/sprints/${id}`),
    addTasks: (id: string, taskIds: string[]) => http.post<{ moved: number }>(`/sprints/${id}/tasks`, { taskIds }),
    removeTasks: (id: string, taskIds: string[]) =>
      http.delete<{ moved: number }>(`/sprints/${id}/tasks`, { taskIds }),
    mirrorToJira: (id: string, options?: { boardId?: string; start?: boolean }) =>
      http.post<{ movedIssues: number; linkedTickets: number; started: boolean }>(
        `/sprints/${id}/jira/mirror`,
        options ?? {}
      ),
  },

  standups: {
    list: (limit = 30) => http.get<Standup[]>("/standups", { limit }),
    ingest: (text: string) => http.post<Standup>("/standups", { text }),
  },

  reports: {
    listWeekly: () => http.get<ReportSummary[]>("/reports/weekly"),
    getWeekly: (id: string) => http.get<WeeklyReport>(`/reports/weekly/${id}`),
    generateWeekly: (window?: { from?: string; to?: string }) =>
      http.post<WeeklyReport>("/reports/weekly", window ?? {}),
    removeWeekly: (id: string) => http.delete<void>(`/reports/weekly/${id}`),
    teamActivity: (days: number) => http.post<TeamActivityReport>("/reports/team-activity", { days }),
    review: (window: { from: string; to: string }) => http.get<ReviewResult>("/reports/review", window),
  },

  clients: {
    list: () => http.get<Client[]>("/clients"),
    add: (name: string) => http.post<Client & { warning?: string }>("/clients", { name }),
    refresh: (id: string) => http.post<Client>(`/clients/${id}/refresh`),
    remove: (id: string) => http.delete<void>(`/clients/${id}`),
    createTicket: (clientId: string, itemId: string) =>
      http.post<{ item: ClientItem; taskId: string }>(`/clients/${clientId}/items/${itemId}/ticket`),
  },

  incidents: {
    list: () => http.get<IncidentReport[]>("/incidents"),
    latest: () => http.get<IncidentReport | null>("/incidents/latest"),
    scan: (hours: number) => http.post<IncidentReport>("/incidents/scan", { hours }),
  },

  chat: {
    history: (limit = 50) => http.get<{ history: ChatMessage[] }>("/chat", { limit }),
    send: (message: string) => http.post<ChatTurnResult>("/chat", { message }),
    clear: () => http.delete<void>("/chat"),
    tools: () =>
      http.get<Array<{ name: string; description: string; access: string; requires: string | null }>>(
        "/chat/tools"
      ),
  },

  meetings: {
    providers: () => http.get<Array<{ id: string; name: string }>>("/meetings/providers"),
    /** Recent calls across every connected platform, with ingestion state. */
    available: (query?: { days?: number; limit?: number }) =>
      http.get<AvailableMeeting[]>("/meetings/available", query),
    /** Meetings already processed, with what each changed on the board. */
    list: (limit = 30) => http.get<MeetingRecord[]>("/meetings", { limit }),
    get: (id: string) => http.get<MeetingRecord>(`/meetings/${id}`),
    ingest: (providerId: string, meetingId: string) =>
      http.post<MeetingRecord>("/meetings/ingest", { providerId, meetingId }),
  },

  docs: {
    providers: () => http.get<Array<{ id: string; name: string }>>("/docs/providers"),
    search: (q: string, limit = 5) => http.get<DocumentHit[]>("/docs/search", { q, limit }),
  },

  integrations: {
    /** The full catalogue, grouped by category. */
    catalogue: () =>
      http.get<{ capabilities: Capabilities; categories: CategoryStatus[] }>("/integrations"),
    /** Live credential check for one provider, by id. */
    test: (providerId: string) => http.post<ProviderHealth>(`/integrations/${providerId}/test`),
    putCredentials: (providerId: "slack" | "jira" | "github", body: Record<string, unknown>) =>
      http.put<unknown>(`/integrations/${providerId}/credentials`, body),
    deleteCredentials: (providerId: "slack" | "jira" | "github") =>
      http.delete<unknown>(`/integrations/${providerId}/credentials`),
    jira: {
      test: () => http.post<{ user: string; board: string; projectKey: string }>("/integrations/jira/test"),
      sync: () => http.post<TicketSyncRecord>("/integrations/jira/sync"),
    },
    slack: {
      test: () => http.post<{ team: string; bot: string }>("/integrations/slack/test"),
      channels: () =>
        http.get<Array<{ id: string; name: string; isMember: boolean; topic: string; memberCount: number }>>(
          "/integrations/slack/channels"
        ),
    },
    github: {
      test: () => http.post<{ user: string; repos: AllowedRepo[] }>("/integrations/github/test"),
      repos: () => http.get<AllowedRepo[]>("/integrations/github/repos"),
      available: () => http.get<AvailableRepo[]>("/integrations/github/repos/available"),
      save: (repos: AllowedRepo[]) => http.put<AllowedRepo[]>("/integrations/github/repos", { repos }),
    },
  },
};
