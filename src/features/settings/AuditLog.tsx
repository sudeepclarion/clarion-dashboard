import type { DashboardState } from "@/lib/api/types";
import { formatDateTime, relativeTime } from "@/lib/format/dates";
import { sourceLabel } from "@/lib/format/status";
import { Badge } from "@/components/ui/Badge";
import { Panel, PanelHeader } from "@/components/ui/Panel";

export const AuditLog = ({ state }: { state: DashboardState }) => (
  <Panel flush>
    <div className="p-4">
      <PanelHeader
        title="Audit log"
        description="Every change Clarion made and what caused it — manual edits, standup ingestion, the assistant, Jira sync and Slack conversations."
      />
    </div>
    <ul className="max-h-[36rem] divide-y divide-hairline/50 overflow-y-auto border-t border-hairline">
      {state.activity.map((entry) => (
        <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5">
          <Badge className="mt-0.5 shrink-0" mono>
            {sourceLabel(entry.type)}
          </Badge>
          <p className="min-w-0 flex-1 text-xs leading-relaxed text-ink-muted">{entry.message}</p>
          <span className="shrink-0 text-2xs text-ink-faint" title={formatDateTime(entry.at)}>
            {relativeTime(entry.at)}
          </span>
        </li>
      ))}
      {!state.activity.length ? (
        <li className="px-4 py-8 text-center text-xs text-ink-faint">No activity recorded yet.</li>
      ) : null}
    </ul>
  </Panel>
);
