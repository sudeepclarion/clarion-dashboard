import { useSearchParams } from "react-router-dom";
import type { DashboardState } from "@/lib/api/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { AuditLog } from "./AuditLog";
import { IntegrationSettings } from "./IntegrationSettings";
import { TeamSettings } from "./TeamSettings";

/** Composition only — each tab's content is its own module. */
export const SettingsPage = ({ state }: { state: DashboardState }) => {
  // The tab lives in the URL so a settings link can point at a specific section.
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "team";
  const setTab = (next: string): void => {
    const updated = new URLSearchParams(params);
    updated.set("tab", next);
    setParams(updated, { replace: true });
  };

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Team, connections and the audit trail."
      />

      <Tabs
        className="mb-4"
        active={tab}
        onChange={setTab}
        items={[
          { id: "team", label: "Team", count: state.members.length },
          { id: "integrations", label: "Integrations" },
          { id: "activity", label: "Audit log", count: state.activity.length },
        ]}
      />

      {tab === "team" ? <TeamSettings state={state} /> : null}
      {tab === "integrations" ? <IntegrationSettings state={state} /> : null}
      {tab === "activity" ? <AuditLog state={state} /> : null}
    </>
  );
};
