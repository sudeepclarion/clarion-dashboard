import { Callout } from "@/components/ui/Callout";

/**
 * Shown wherever a feature needs the model. Naming the exact missing setting is the
 * difference between a dead button and a fixable one.
 */
export const AiUnavailableNotice = ({ feature }: { feature: string }) => (
  <Callout tone="warning">
    {feature} needs a reasoning model. Set <code className="font-mono text-[11px]">ANTHROPIC_API_KEY</code> in the
    backend environment and restart it.
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
    {feature} needs {integration}. Set <code className="font-mono text-[11px]">{envVar}</code> in the backend
    environment and restart it.
  </Callout>
);
