import type { Meta, StoryObj } from "@storybook/react-vite";
import { NetworkGraph } from "./network-graph";
import { makeDenseGraph, makeIriLabelGraph } from "./network-graph.fixtures";

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

/**
 * Every label is a long IRI — the common case in a real RDF view. Use this to
 * judge label truncation/ellipsis and node sizing without hundreds of nodes in
 * the way. Tooltips are on so the full IRI and properties are inspectable.
 */
const iriGraph = makeIriLabelGraph();
export const IriLabels: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[560px] w-full rounded-md border">
        <NetworkGraph
          nodes={iriGraph.nodes}
          edges={iriGraph.edges}
          hideTooltips={false}
        />
      </div>
    </div>
  ),
};

/**
 * ~150 nodes with dense, hub-biased relationships and IRI labels — close to a
 * typical production view. The stress case for node sizing, label
 * de-cluttering, edge-label legibility, and orbiting/hovering at scale.
 */
const denseGraph = makeDenseGraph(150, 3);
export const DenseMedium: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[680px] w-full rounded-md border">
        <NetworkGraph
          nodes={denseGraph.nodes}
          edges={denseGraph.edges}
          hideTooltips={false}
        />
      </div>
    </div>
  ),
};

/**
 * ~400 nodes — the upper end of what our visualizations render. Mostly for
 * checking that the graph stays readable (and performant) at scale.
 */
const denseLargeGraph = makeDenseGraph(400, 3, 99);
export const DenseLarge: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[720px] w-full rounded-md border">
        <NetworkGraph
          nodes={denseLargeGraph.nodes}
          edges={denseLargeGraph.edges}
          hideTooltips={false}
        />
      </div>
    </div>
  ),
};

/**
 * The same ~150-node graph with a hub node selected. Demonstrates the
 * highlight de-cluttering: only the selected node and its neighbors stay lit
 * and labeled, the rest dims out — readable even at this density.
 */
export const DenseSelected: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[680px] w-full rounded-md border">
        <NetworkGraph
          nodes={denseGraph.nodes}
          edges={denseGraph.edges}
          selectedId="n54"
          hideTooltips={false}
        />
      </div>
    </div>
  ),
};

/**
 * Multiple relationships between the same two resources. Each edge bows onto its
 * own arc so every relationship — and its label — stays legible instead of
 * stacking on a single line. Includes a self-loop (`mentions`) and a 2× / 3× /
 * 4× parallel bundle to exercise the fan-out.
 */
const multiEdgeNodes = [
  { id: "alice", label: "Alice", type: "ex:Person" },
  { id: "bob", label: "Bob", type: "ex:Person" },
  { id: "acme", label: "Acme Corp", type: "ex:Project" },
  { id: "note", label: "Shared Note", type: "ex:Issue" },
];
const multiEdgeEdges = [
  // Alice ↔ Bob: four distinct relationships between the same pair.
  { source: "alice", target: "bob", label: "manages" },
  { source: "alice", target: "bob", label: "mentors" },
  { source: "bob", target: "alice", label: "reportsTo" },
  { source: "alice", target: "bob", label: "collaboratesWith" },
  // Alice → Acme: two relationships, opposite directions.
  { source: "alice", target: "acme", label: "founded" },
  { source: "acme", target: "alice", label: "employs" },
  // Bob → Acme: a single relationship stays straight.
  { source: "bob", target: "acme", label: "advises" },
  // Self-loop on the note.
  { source: "note", target: "note", label: "mentions" },
];
export const MultipleEdges: Story = {
  render: () => (
    <div className="p-4">
      <div className="h-[560px] w-full rounded-md border">
        <NetworkGraph
          nodes={multiEdgeNodes}
          edges={multiEdgeEdges}
          hideTooltips={false}
        />
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
