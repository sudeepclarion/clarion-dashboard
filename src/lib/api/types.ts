/** Mirrors the backend's persisted shapes. One place to look when the API changes. */

export const TASK_STATUSES = ["backlog", "in_progress", "review", "blocked", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type ChangeSource =
  | "manual"
  | "standup"
  | "chat"
  | "jira"
  | "slack"
  | "client"
  | "report"
  | "system";

export type TeamRole = "manager" | "member";

export interface Member {
  id: string;
  name: string;
  role: TeamRole | null;
  createdAt: string;
}

export interface MemberStats {
  member: Member;
  open: number;
  blocked: number;
  overdue: number;
  completedThisWeek: number;
}

export type MemberHealth = "on_track" | "at_risk" | "blocked" | "idle" | "no_data";

export interface MemberSummary {
  summary: string;
  health: MemberHealth;
  generatedAt: string;
}

export interface TaskUpdate {
  at: string;
  by: string;
  note: string;
}

export interface DeadlineChange {
  at: string;
  from: string | null;
  to: string;
  reason: string;
  source: ChangeSource;
}

/** A link to a ticket in whichever tracker created it. */
export interface TicketLink {
  providerId: string;
  key: string;
  id: string;
  statusName: string | null;
  url: string;
  syncedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignees: string[];
  status: TaskStatus;
  deadline: string | null;
  deadlineHistory: DeadlineChange[];
  sprintId: string | null;
  prd: { type: "link" | "text"; content: string; updatedAt: string } | null;
  updates: TaskUpdate[];
  ticket: TicketLink | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SprintProgress {
  total: number;
  done: number;
  blocked: number;
  percentComplete: number;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  jiraSprint: { id: string; name: string; boardId: string; started: boolean } | null;
  createdAt: string;
  active: boolean;
  progress: SprintProgress;
}

export interface StandupChange {
  member: string;
  action: "created" | "updated";
  taskId: string;
  taskTitle: string;
  summary: string;
  changes: string[];
  blocker: string | null;
}

export interface Standup {
  id: string;
  createdAt: string;
  rawText: string;
  unattributedNotes: string;
  appliedChanges: StandupChange[];
}

export interface ReportSummary {
  id: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  source?: "manual" | "scheduled";
}

export interface TriageDecision {
  kind: "approve_all" | "approve_some" | "edit" | "reject";
  approvedActionIds: string[];
  notes: string;
  rawReply: string;
  at: string;
}

export interface TriageDaySlot {
  slot: string;
  runId: string;
  status: string;
  managerBrief: string;
  engineeringSummary: string;
  actionCount: number;
  decision: TriageDecision | null;
}

export interface TriageDayReport {
  orgId: string;
  date: string;
  slots: TriageDaySlot[];
  combinedSummary: string;
  communicationsDigest: string;
  updatedAt: string;
}

export interface TriageRun {
  id: string;
  orgId: string;
  date: string;
  slot: string;
  status: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface TriageRunStart {
  started: true;
  orgId: string;
  date: string;
  slot: string;
  status: "running";
}

export interface MeetingChange {
  action: "created" | "updated" | "skipped";
  taskId: string | null;
  taskTitle: string;
  owner: string | null;
  summary: string;
  changes: string[];
  reason: string | null;
}

export interface MeetingRecord {
  id: string;
  providerId: string;
  providerName: string;
  externalId: string;
  title: string;
  startedAt: string;
  participants: string[];
  ingestedAt: string;
  transcript: string;
  decisions: string[];
  risks: string[];
  appliedChanges: MeetingChange[];
}

export interface AvailableMeeting {
  id: string;
  title: string;
  startedAt: string;
  durationMinutes: number | null;
  participants: string[];
  hasTranscript: boolean;
  providerId: string;
  providerName: string;
  ingested: boolean;
  ingestedMeetingId: string | null;
}

export interface DocumentHit {
  id: string;
  title: string;
  url: string;
  container: string | null;
  updatedAt: string;
  author: string | null;
  providerId: string;
  providerName: string;
}

export interface WeeklyReport extends ReportSummary {
  content: string;
}

export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentState = "ongoing" | "mitigated" | "resolved" | "unclear";

export interface Incident {
  title: string;
  severity: IncidentSeverity;
  status: IncidentState;
  channel: string;
  summary: string;
  peopleInvolved: string[];
  firstSeen: string;
  suggestedAction: string;
}

export interface IncidentReport {
  id: string;
  generatedAt: string;
  windowHours: number;
  channelsScanned: string[];
  messagesScanned: number;
  overview: string;
  incidents: Incident[];
  source?: "scan" | "triage";
  triageDate?: string | null;
  triageSlot?: string | null;
}

export interface ClientItem {
  id: string;
  text: string;
  ticketKey: string | null;
  taskId: string | null;
  status: TaskStatus | null;
  source?: "analysis" | "triage";
  triageDate?: string | null;
  triageSlot?: string | null;
  disposition?: "open" | "resolved" | "monitoring" | null;
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
  generatedAt: string | null;
  criticalIssues: ClientItem[];
  futureRequirements: ClientItem[];
  misc: ClientItem[];
}

export interface ActivityEntry {
  id: string;
  type: ChangeSource;
  message: string;
  meta: Record<string, unknown>;
  at: string;
}

export interface ChatAction {
  tool: string;
  input: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: string;
  actions: ChatAction[];
}

export interface Capabilities {
  ai: boolean;
  jira: boolean;
  jiraBoard: boolean;
  slack: boolean;
  slackSocket: boolean;
  github: boolean;
  messaging: boolean;
  tickets: boolean;
  meetings: boolean;
  docs: boolean;
  code: boolean;
}

export const PROVIDER_CATEGORIES = ["messaging", "tickets", "meetings", "docs", "code"] as const;
export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number];

export interface ProviderStatus {
  id: string;
  name: string;
  category: ProviderCategory;
  summary: string;
  configured: boolean;
  requiredEnv: string[];
  optionalEnv: string[];
  docsUrl: string | null;
}

export interface CategoryStatus {
  category: ProviderCategory;
  label: string;
  purpose: string;
  enabled: boolean;
  providers: ProviderStatus[];
}

export interface ProviderMeta {
  id: string;
  name: string;
  category: ProviderCategory;
  summary: string;
  requiredEnv: string[];
  optionalEnv?: string[];
  docsUrl?: string;
}

export interface ProviderHealth {
  ok: boolean;
  detail: string;
}

export interface AllowedRepo {
  repo: string;
  branch: string | null;
  contributors: string[];
  scannedAt: string | null;
}

export interface GithubRepoCatalogEntry {
  fullName: string;
  private: boolean;
  description: string | null;
  updatedAt: string;
  language: string | null;
  defaultBranch: string;
  mainBranch: string | null;
  contributors: string[];
  scannedAt: string | null;
}

export interface GithubMainBranchScanJob {
  status: "idle" | "running" | "completed" | "failed";
  startedAt: string | null;
  finishedAt: string | null;
  total: number;
  done: number;
  currentRepo: string | null;
  scanned: number;
  failed: Array<{ repo: string; error: string }>;
  error: string | null;
}

export interface TicketSyncRecord {
  providerId: string;
  at: string;
  total: number;
  imported: number;
  updated: number;
  unchanged: number;
  skippedStaleDone: number;
}

export interface DashboardMetrics {
  totalTasks: number;
  openTasks: number;
  byStatus: Partial<Record<TaskStatus, number>>;
  overdue: number;
  dueThisWeek: number;
  blocked: number;
  unassigned: number;
  completedThisWeek: number;
  activeSprint: { name: string; percentComplete: number; endDate: string } | null;
  openCriticalClientIssues: number;
  openIncidents: number;
}

export interface DashboardState {
  generatedAt: string;
  statuses: TaskStatus[];
  metrics: DashboardMetrics;
  members: Member[];
  memberSummaries: Record<string, MemberSummary>;
  tasks: Task[];
  sprints: Sprint[];
  standups: Standup[];
  reports: ReportSummary[];
  incidentReports: IncidentReport[];
  clients: Client[];
  activity: ActivityEntry[];
  meetings: MeetingRecord[];
  integrations: {
    capabilities: Capabilities;
    categories: CategoryStatus[];
    activeTracker: ProviderMeta | null;
    jira: {
      baseUrl: string;
      projectKey: string;
      boardId: string;
      autoCreateIssues: boolean;
      lastSync: TicketSyncRecord | null;
    };
    github: { repos: AllowedRepo[] };
  };
  ai: { model: string; effort: string };
}

export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  returned: number;
}

export interface ReviewResult {
  members: Array<{
    member: string;
    completed: number;
    blocked: number;
    touched: Array<{
      id: string;
      title: string;
      status: TaskStatus;
      deadline: string | null;
      completedInWindow: boolean;
      updates: Array<{ note: string; at: string }>;
    }>;
  }>;
  deadlineEvents: Array<{
    taskId: string;
    task: string;
    owner: string;
    from: string | null;
    to: string;
    reason: string;
    source: string;
    at: string;
  }>;
}

export interface TeamActivityReport {
  generatedAt: string;
  periodDays: number;
  since: string;
  members: Array<{
    member: string;
    stats: { open: number; closed: number; updates: number };
    current: Array<{ title: string; status: TaskStatus; ticket: string | null; deadline: string | null }>;
    closed: Array<{ title: string; ticket: string | null; closedAt: string }>;
    currentSummary: string;
    periodSummary: string;
  }>;
}

export interface ChatTurnResult {
  reply: string;
  actions: ChatAction[];
  toolCalls: number;
  boardChanged: boolean;
}

export interface ChatJob {
  id: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  finishedAt: string | null;
  result: ChatTurnResult | null;
  error: string | null;
}

export interface AvailableRepo {
  fullName: string;
  private: boolean;
  description: string | null;
  updatedAt: string;
  language: string | null;
  defaultBranch: string;
}

export interface TaskPatch {
  title?: string;
  description?: string;
  assignees?: string[];
  status?: TaskStatus;
  deadline?: string;
  deadlineReason?: string;
  sprintId?: string | null;
  prd?: string;
  note?: string;
}

export interface TaskDraft {
  title: string;
  description?: string;
  assignees?: string[];
  status?: TaskStatus;
  deadline?: string | null;
  sprintId?: string | null;
  prd?: string;
}
