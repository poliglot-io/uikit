import type { Meta, StoryObj } from "@storybook/react";
import { NetworkGraph } from "./network-graph";

const meta = {
  title: "UI Kit/NetworkGraph",
  component: NetworkGraph,
  tags: ["autodocs"],
  // The graph fills its container, so give it the full canvas rather than the
  // centered default (which collapses a full-width child).
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NetworkGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A small project knowledge graph: a project made of teams, the people on
 * them, the services they own, the repositories those services build from,
 * and a couple of open issues. `type` is a qname that drives node color, so
 * each kind of entity reads as its own hue.
 */
const nodes = [
  { id: "atlas", label: "Atlas Platform", type: "ex:Project" },

  { id: "team-core", label: "Core", type: "ex:Team" },
  { id: "team-payments", label: "Payments", type: "ex:Team" },
  { id: "team-growth", label: "Growth", type: "ex:Team" },

  { id: "ava", label: "Ava Chen", type: "ex:Person" },
  { id: "liam", label: "Liam Patel", type: "ex:Person" },
  { id: "noah", label: "Noah Kim", type: "ex:Person" },
  { id: "mia", label: "Mia Rossi", type: "ex:Person" },
  { id: "ethan", label: "Ethan Wu", type: "ex:Person" },

  { id: "gateway", label: "API Gateway", type: "ex:Service" },
  { id: "billing", label: "Billing Service", type: "ex:Service" },
  { id: "auth", label: "Auth Service", type: "ex:Service" },
  { id: "web", label: "Web App", type: "ex:Service" },

  { id: "repo-api", label: "atlas-api", type: "ex:Repository" },
  { id: "repo-web", label: "atlas-web", type: "ex:Repository" },
  { id: "repo-infra", label: "atlas-infra", type: "ex:Repository" },

  { id: "iss-checkout", label: "Flaky checkout", type: "ex:Issue" },
  { id: "iss-ratelimit", label: "429s under load", type: "ex:Issue" },
];

const edges = [
  // Teams make up the project
  { source: "team-core", target: "atlas", label: "partOf" },
  { source: "team-payments", target: "atlas", label: "partOf" },
  { source: "team-growth", target: "atlas", label: "partOf" },

  // People belong to teams
  { source: "ava", target: "team-core", label: "memberOf" },
  { source: "liam", target: "team-core", label: "memberOf" },
  { source: "noah", target: "team-payments", label: "memberOf" },
  { source: "mia", target: "team-payments", label: "memberOf" },
  { source: "ethan", target: "team-growth", label: "memberOf" },

  // Teams own services
  { source: "team-core", target: "gateway", label: "owns" },
  { source: "team-core", target: "auth", label: "owns" },
  { source: "team-payments", target: "billing", label: "owns" },
  { source: "team-growth", target: "web", label: "owns" },

  // Service dependencies
  { source: "web", target: "gateway", label: "dependsOn" },
  { source: "gateway", target: "auth", label: "dependsOn" },
  { source: "gateway", target: "billing", label: "dependsOn" },
  { source: "billing", target: "auth", label: "dependsOn" },

  // Services build from repositories
  { source: "gateway", target: "repo-api", label: "builtFrom" },
  { source: "billing", target: "repo-api", label: "builtFrom" },
  { source: "web", target: "repo-web", label: "builtFrom" },
  { source: "auth", target: "repo-infra", label: "builtFrom" },

  // Open issues
  { source: "iss-checkout", target: "billing", label: "affects" },
  { source: "iss-checkout", target: "mia", label: "assignedTo" },
  { source: "iss-ratelimit", target: "gateway", label: "affects" },
  { source: "iss-ratelimit", target: "ava", label: "assignedTo" },
  { source: "iss-ratelimit", target: "iss-checkout", label: "blocks" },
];

export const Default: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[560px] w-full rounded-md border">
        <NetworkGraph nodes={nodes} edges={edges} hideTooltips={false} />
      </div>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[320px] w-full rounded-md border">
        <NetworkGraph
          nodes={[]}
          edges={[]}
          emptyMessage="No entities to display."
        />
      </div>
    </div>
  ),
};
