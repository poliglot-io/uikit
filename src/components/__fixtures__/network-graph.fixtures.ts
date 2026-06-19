/**
 * Deterministic fixture generators for NetworkGraph stories.
 *
 * These model a generic software-delivery knowledge graph (projects, teams,
 * people, services, repositories, issues…). The point is to exercise the graph
 * the way a real RDF view does: node labels are often full IRIs (long, with
 * shared namespace prefixes), entities carry several key/value properties, and
 * a single view can hold hundreds of nodes with dense relationships.
 *
 * Everything here is seeded and deterministic — no Math.random — so stories
 * render identically across reloads and visual diffs stay stable.
 */

import type { GraphNode, GraphEdge } from "../network-graph";

/** Tiny seeded PRNG (mulberry32) so fixtures are stable across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EX = "https://example.org/graph/";

/** Class IRIs used as node `type` (qname-style, drives node color). */
const CLASSES = [
  "ex:Project",
  "ex:Team",
  "ex:Person",
  "ex:Service",
  "ex:Repository",
  "ex:Library",
  "ex:Issue",
  "ex:Deployment",
  "ex:Environment",
  "ex:Incident",
] as const;

/** Predicate IRIs used as edge labels — some short, some long/namespaced. */
const PREDICATES = [
  "rdf:type",
  "ex:partOf",
  "ex:memberOf",
  "ex:owns",
  "ex:dependsOn",
  "ex:assignedTo",
  "ex:buildsFrom",
  "ex:deployedTo",
  "ex:blocks",
  "http://www.w3.org/2000/01/rdf-schema#subClassOf",
] as const;

const SAMPLE_KEYS = [
  "rdfs:label",
  "rdfs:comment",
  "ex:slug",
  "ex:createdAt",
  "ex:status",
  "ex:version",
  "dc:creator",
  "ex:uri",
];

const SAMPLE_VALUES = [
  "active",
  "2024-09-17T14:22:09Z",
  "1.4.0",
  "https://example.org/graph/status/Healthy",
  "core-delivery-platform",
  "A long-form human description that comfortably exceeds the card width and must be ellipsized so the tooltip keeps its shape.",
  "urn:example:9f3a:service:billing",
  "Jordan Lee",
];

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function properties(rng: () => number, count: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    out[SAMPLE_KEYS[i % SAMPLE_KEYS.length]] = pick(rng, SAMPLE_VALUES);
  }
  return out;
}

export interface GraphFixture {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Generate a dense graph with `nodeCount` nodes and roughly `avgDegree` edges
 * per node. Node labels are full IRIs to exercise the long-label / ellipsis
 * path. Each node carries several properties so the tooltip has real content.
 */
export function makeDenseGraph(
  nodeCount: number,
  avgDegree = 3,
  seed = 42
): GraphFixture {
  const rng = mulberry32(seed);
  const nodes: GraphNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const type = pick(rng, CLASSES);
    const local = type.split(":")[1] ?? "Thing";
    // Labels are IRIs — the common case in a real graph view.
    const label = `${EX}${local.toLowerCase()}/${local}-${i}`;
    nodes.push({
      id: `n${i}`,
      label,
      type,
      properties: properties(rng, 4 + Math.floor(rng() * 4)),
    });
  }

  // Dense relationships: each node links forward to a few others. Bias toward
  // a handful of hub nodes so the layout has the lopsided density real graphs
  // have rather than a uniform mesh.
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const hubs = Math.max(1, Math.floor(nodeCount * 0.04));
  const edgeCount = nodeCount * avgDegree;
  for (let e = 0; e < edgeCount; e++) {
    const a = Math.floor(rng() * nodeCount);
    // 40% of edges attach to a hub node to create dense neighborhoods.
    const b =
      rng() < 0.4 ? Math.floor(rng() * hubs) : Math.floor(rng() * nodeCount);
    if (a === b) continue;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      source: `n${a}`,
      target: `n${b}`,
      label: pick(rng, PREDICATES),
    });
  }

  return { nodes, edges };
}

/**
 * A small graph whose every label is a long IRI — for inspecting how labels
 * truncate at readable zoom without the noise of hundreds of nodes.
 */
export function makeIriLabelGraph(seed = 7): GraphFixture {
  const rng = mulberry32(seed);
  const specimens: Array<{ type: string; iri: string }> = [
    { type: "ex:Service", iri: `${EX}services/PaymentGatewayService` },
    { type: "ex:Service", iri: `${EX}services/UserDirectoryService` },
    { type: "ex:Repository", iri: `${EX}repositories/platform-monorepo` },
    { type: "ex:Library", iri: "urn:example:9f3a:library:http-client" },
    { type: "ex:Deployment", iri: `${EX}deployments/payments-2024-09-17` },
    { type: "ex:Environment", iri: `${EX}environments/production-us-east` },
    {
      type: "ex:Issue",
      iri: "https://example.org/graph/issues/flaky-checkout-timeout",
    },
    { type: "ex:Team", iri: `${EX}teams/core-delivery-platform` },
  ];
  const nodes: GraphNode[] = specimens.map((s, i) => ({
    id: `iri${i}`,
    label: s.iri,
    type: s.type,
    properties: properties(rng, 5),
  }));
  const edges: GraphEdge[] = nodes.slice(1).map((n, i) => ({
    source: n.id,
    target: nodes[i].id,
    label: pick(rng, PREDICATES),
  }));
  return { nodes, edges };
}
