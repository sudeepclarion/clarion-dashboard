import { Callout } from "@/components/ui/Callout";

/**
 * Shown wherever a feature needs the model. Clarion hosts the model —
 * customers should not see ANTHROPIC_API_KEY instructions.
 */
export const AiUnavailableNotice = ({ feature }: { feature: string }) => (
  <Callout tone="warning">
    {feature} needs Clarion AI, which is temporarily unavailable. Try again shortly or contact support.
  </Callout>
);

export const IntegrationRequiredNotice = ({
  integration,
  feature,
  envVar,
}: {
  integration: string;
  feature: string;
  envVar: string;
}) => (
  <Callout tone="warning">
    {feature} needs {integration}. Connect it under Settings → Integrations
    {envVar ? (
      <>
        {" "}
        (env <code className="font-mono text-[11px]">{envVar}</code> if self-hosting)
      </>
    ) : null}
    .
  </Callout>
);
