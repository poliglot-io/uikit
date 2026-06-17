/**
 * Network graph visualization with 2D and 3D rendering.
 *
 * Pass nodes and edges as data; interaction handlers cover
 * selection, hover, and expand. The graph can be explored in a
 * 2D force-directed layout (HTML canvas) or navigated in a 3D
 * force-directed scene (WebGL). Both modes run the same physics
 * engine; users toggle between them with the control in the
 * top-right, and the default mode is configurable.
 */
"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import type {
  ForceGraphMethods as ForceGraphMethods3D,
  ForceGraphProps as ForceGraphProps3D,
  NodeObject,
  LinkObject,
} from "react-force-graph-3d";
import type {
  ForceGraphMethods as ForceGraphMethods2D,
  ForceGraphProps as ForceGraphProps2D,
} from "react-force-graph-2d";
import type { Side } from "three";
import { cn } from "../lib/utils";

// --- Public types ---

export interface GraphNode {
  id: string;
  label: string;
  /** Most specific type as a qname (e.g., "ex:Issue"). Used for node coloring. */
  type?: string;
  /** Key-value properties shown in the tooltip on hover. */
  properties?: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

/** Rendering mode for the graph. */
export type GraphDimensions = "2d" | "3d";

export interface NetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId?: string | null;
  searchQuery?: string;
  onSelectNode?: (node: GraphNode | null) => void;
  onExpandNode?: (nodeId: string) => void;
  className?: string;
  /** Text shown when graph is empty */
  emptyMessage?: string;
  /** Hide tooltips on hover. Default true. */
  hideTooltips?: boolean;
  /** Initial render mode when uncontrolled. Default "2d". */
  defaultDimensions?: GraphDimensions;
  /** Controlled render mode. When set, the toggle reflects this value. */
  dimensions?: GraphDimensions;
  /** Called when the user switches between 2D and 3D. */
  onDimensionsChange?: (dimensions: GraphDimensions) => void;
  /** Show the 2D/3D toggle control. Default true. */
  showDimensionToggle?: boolean;
}

// --- Type color palette ---
// Each entry has light and dark variants. Soft backgrounds with legible foregrounds.

interface TypeColorSet {
  light: { bg: string; fg: string; border: string };
  dark: { bg: string; fg: string; border: string };
}

const TYPE_PALETTE: TypeColorSet[] = [
  {
    light: { bg: "#DBEAFE", fg: "#1D4ED8", border: "#93C5FD" },
    dark: { bg: "#1E3A5F", fg: "#93C5FD", border: "#2563EB" },
  }, // blue
  {
    light: { bg: "#D1FAE5", fg: "#047857", border: "#6EE7B7" },
    dark: { bg: "#1A3A2A", fg: "#6EE7B7", border: "#059669" },
  }, // emerald
  {
    light: { bg: "#F3E8FF", fg: "#6D28D9", border: "#C4B5FD" },
    dark: { bg: "#2E1A47", fg: "#C4B5FD", border: "#7C3AED" },
  }, // violet
  {
    light: { bg: "#FEF3C7", fg: "#B45309", border: "#FCD34D" },
    dark: { bg: "#3D2E0A", fg: "#FCD34D", border: "#D97706" },
  }, // amber
  {
    light: { bg: "#FCE7F3", fg: "#BE185D", border: "#F9A8D4" },
    dark: { bg: "#3D1A2E", fg: "#F9A8D4", border: "#DB2777" },
  }, // pink
  {
    light: { bg: "#E0E7FF", fg: "#3730A3", border: "#A5B4FC" },
    dark: { bg: "#1E2247", fg: "#A5B4FC", border: "#4F46E5" },
  }, // indigo
  {
    light: { bg: "#CCFBF1", fg: "#0F766E", border: "#5EEAD4" },
    dark: { bg: "#0F2D2A", fg: "#5EEAD4", border: "#0D9488" },
  }, // teal
  {
    light: { bg: "#FEE2E2", fg: "#B91C1C", border: "#FCA5A5" },
    dark: { bg: "#3D1A1A", fg: "#FCA5A5", border: "#DC2626" },
  }, // red
  {
    light: { bg: "#FFF7ED", fg: "#C2410C", border: "#FDBA74" },
    dark: { bg: "#3D2510", fg: "#FDBA74", border: "#EA580C" },
  }, // orange
  {
    light: { bg: "#F0FDF4", fg: "#15803D", border: "#86EFAC" },
    dark: { bg: "#14291A", fg: "#86EFAC", border: "#16A34A" },
  }, // green
  {
    light: { bg: "#FDF4FF", fg: "#A21CAF", border: "#E879F9" },
    dark: { bg: "#331A38", fg: "#E879F9", border: "#C026D3" },
  }, // fuchsia
  {
    light: { bg: "#ECFDF5", fg: "#065F46", border: "#6EE7B7" },
    dark: { bg: "#0D2818", fg: "#6EE7B7", border: "#10B981" },
  }, // green-alt
  {
    light: { bg: "#EFF6FF", fg: "#1E40AF", border: "#60A5FA" },
    dark: { bg: "#172554", fg: "#60A5FA", border: "#2563EB" },
  }, // blue-alt
  {
    light: { bg: "#FEF2F2", fg: "#991B1B", border: "#F87171" },
    dark: { bg: "#2D1515", fg: "#F87171", border: "#EF4444" },
  }, // red-alt
  {
    light: { bg: "#FFFBEB", fg: "#92400E", border: "#F59E0B" },
    dark: { bg: "#2D220A", fg: "#F59E0B", border: "#D97706" },
  }, // yellow
  {
    light: { bg: "#F5F3FF", fg: "#5B21B6", border: "#A78BFA" },
    dark: { bg: "#1F1538", fg: "#A78BFA", border: "#7C3AED" },
  }, // purple
];

const DEFAULT_COLORS: TypeColorSet = {
  light: { bg: "#F5F5F5", fg: "#737373", border: "#E5E5E5" },
  dark: { bg: "#262626", fg: "#A3A3A3", border: "#404040" },
};

/** Deterministic type-to-color mapping using string hash. */
function typeColor(type: string | undefined, isDark = false) {
  const set = !type
    ? DEFAULT_COLORS
    : TYPE_PALETTE[Math.abs(hashString(type)) % TYPE_PALETTE.length];
  return isDark ? set.dark : set.light;
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash;
}

/** Escape a string for safe interpolation into tooltip HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Tracks whether the document is in dark mode via the `dark` class. */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

// --- Internal types ---

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isDark: boolean;
  selectedId?: string | null;
  searchQuery?: string;
  onSelectNode?: (node: GraphNode | null) => void;
  onExpandNode?: (nodeId: string) => void;
  hideTooltips: boolean;
}

interface HighlightInfo {
  keep: Set<string>;
}

/** Number of physics ticks each view simulates before freezing the layout. */
const COOLDOWN_TICKS = 100;

/**
 * Layout spread. The d3-force defaults pack nodes tightly; stronger charge
 * repulsion and a longer link distance give the graph more room so it reads
 * closer to the original layout. Applied to both 2D and 3D.
 */
const CHARGE_STRENGTH = -240;
const LINK_DISTANCE = 70;

// --- Shared graph helpers ---

/**
 * Tracks the container's pixel size. Both force-graph variants need an explicit
 * width/height; this mirrors the container with a ResizeObserver.
 */
function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * Build the force-graph data. Node objects are reused across renders (keyed by
 * id) so the simulation keeps their settled positions instead of relaying out
 * the whole scene on every data change. Each node carries the same pale fill +
 * colored border the legend uses, so 2D and 3D render an identical look.
 */
function useGraphData(nodes: GraphNode[], edges: GraphEdge[], isDark: boolean) {
  const nodeObjsRef = useRef<Map<string, NodeObject>>(new Map());
  return useMemo(() => {
    const map = nodeObjsRef.current;
    const nextIds = new Set(nodes.map(n => n.id));
    for (const id of Array.from(map.keys())) {
      if (!nextIds.has(id)) map.delete(id);
    }
    const fgNodes: NodeObject[] = nodes.map(n => {
      const c = typeColor(n.type, isDark);
      const label = n.label || n.id;
      const existing = map.get(n.id);
      if (existing) {
        existing.node = n;
        existing.fill = c.bg;
        existing.border = c.border;
        existing.label = label;
        return existing;
      }
      const obj: NodeObject = {
        id: n.id,
        label,
        fill: c.bg,
        border: c.border,
        node: n,
      };
      map.set(n.id, obj);
      return obj;
    });
    const fgLinks: LinkObject[] = edges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label ?? "",
    }));
    return { nodes: fgNodes, links: fgLinks };
  }, [nodes, edges, isDark]);
}

/**
 * Which ids stay highlighted: the selection neighborhood, or search matches.
 * `null` means "no dimming". Shared by both views.
 */
function useHighlight(
  nodes: GraphNode[],
  edges: GraphEdge[],
  selectedId: string | null | undefined,
  searchQuery: string | undefined
): HighlightInfo | null {
  return useMemo(() => {
    if (selectedId) {
      const keep = new Set<string>([selectedId]);
      for (const e of edges) {
        if (e.source === selectedId) keep.add(e.target);
        if (e.target === selectedId) keep.add(e.source);
      }
      return { keep };
    }
    const query = searchQuery?.trim().toLowerCase();
    if (query) {
      const keep = new Set<string>();
      for (const n of nodes) {
        if ((n.label || "").toLowerCase().includes(query)) keep.add(n.id);
      }
      return { keep };
    }
    return null;
  }, [selectedId, searchQuery, nodes, edges]);
}

/**
 * Fit-on-settle latch. Returns an `onEngineStop` handler that fits the scene
 * into view the first time the layout settles, plus resets the latch whenever
 * the graph transitions in and out of the empty state. Shared by both views;
 * the caller supplies the fit action against its own force-graph instance.
 */
function useFitOnSettle(nodeCount: number, fit: () => void) {
  const didFitRef = useRef(false);
  const isEmpty = nodeCount === 0;
  useEffect(() => {
    didFitRef.current = false;
  }, [isEmpty]);
  const fitRef = useRef(fit);
  fitRef.current = fit;
  return useCallback(() => {
    if (!didFitRef.current && nodeCount > 0) {
      fitRef.current();
      didFitRef.current = true;
    }
  }, [nodeCount]);
}

/** Resolve a link endpoint (string id or resolved node object) to its id. */
function endpointId(endpoint: LinkObject["source"]): string {
  if (endpoint && typeof endpoint === "object") return String(endpoint.id);
  return String(endpoint);
}

/** Whether a link should render dimmed under the current highlight. */
function linkDimmed(link: LinkObject, highlight: HighlightInfo | null): boolean {
  if (!highlight) return false;
  const s = endpointId(link.source);
  const t = endpointId(link.target);
  return !highlight.keep.has(s) || !highlight.keep.has(t);
}

/**
 * Distinguish a single click (select) from a double click (expand). Returns a
 * click handler shared by both views; the 3D caller layers camera easing on
 * top before delegating here.
 */
function useNodeClickDispatch(
  onSelect: React.RefObject<((node: GraphNode | null) => void) | undefined>,
  onExpand: React.RefObject<((nodeId: string) => void) | undefined>
) {
  const lastClickRef = useRef<{ id: string; time: number }>({
    id: "",
    time: 0,
  });
  return useCallback(
    (node: NodeObject) => {
      const id = String(node.id);
      const graphNode = (node.node as GraphNode | undefined) ?? null;
      const now = Date.now();
      const last = lastClickRef.current;
      if (last.id === id && now - last.time < 300) {
        lastClickRef.current = { id: "", time: 0 };
        onExpand.current?.(id);
      } else {
        lastClickRef.current = { id, time: now };
        onSelect.current?.(graphNode);
      }
    },
    [onSelect, onExpand]
  );
}

/**
 * Build the hover-tooltip HTML for a node. Used by both views (the force-graph
 * engine injects raw HTML for tooltips), so the two modes show a consistent
 * card — same theme variables, layout, and typography.
 */
function renderTooltipHtml(node: GraphNode): string {
  const muted = "var(--muted-foreground,#737373)";
  const entries = node.properties ? Object.entries(node.properties) : [];
  const visible = entries.slice(0, 8);
  const remaining = entries.length - visible.length;

  const rows = visible
    .map(
      ([key, value]) =>
        `<div style="display:flex;align-items:baseline;gap:8px;font-size:11px;line-height:1.25">` +
        `<span style="flex-shrink:0;color:${muted}">${escapeHtml(key)}</span>` +
        `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--foreground,#1a1a1a)">${escapeHtml(value)}</span>` +
        `</div>`
    )
    .join("");
  const more =
    remaining > 0
      ? `<div style="margin-top:2px;font-size:10px;color:${muted}">+${remaining} more</div>`
      : "";
  const type = node.type
    ? `<div style="margin-top:2px;font-size:10px;font-family:ui-monospace,monospace;color:${muted}">${escapeHtml(node.type)}</div>`
    : "";
  const props =
    visible.length > 0
      ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid var(--border,#e5e5e5);` +
        `display:flex;flex-direction:column;gap:4px">${rows}${more}</div>`
      : "";

  return (
    `<div style="width:240px;padding:10px 12px;border-radius:8px;` +
    `border:1px solid var(--border,#e5e5e5);background:var(--popover,#fff);` +
    `color:var(--popover-foreground,#1a1a1a);` +
    `box-shadow:0 10px 15px -3px rgba(0,0,0,0.1),0 4px 6px -4px rgba(0,0,0,0.1);` +
    `font-family:inherit">` +
    `<div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(node.label)}</div>` +
    `${type}` +
    `${props}` +
    `</div>`
  );
}

// The force-graph engine renders tooltips through the `float-tooltip` library,
// which wraps the label HTML in a `.float-tooltip-kap` element with its own
// background, padding, and border. Strip that chrome so our themed card is the
// only thing the user sees. Shared by both views.
const TOOLTIP_STYLE_ID = "poliglot-network-graph-tooltip";
const TOOLTIP_STYLE = `.float-tooltip-kap{background:transparent!important;border:0!important;padding:0!important;border-radius:0!important;box-shadow:none!important;font:inherit!important;color:inherit!important;}`;

function useNeutralizeTooltipChrome() {
  useEffect(() => {
    if (document.getElementById(TOOLTIP_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = TOOLTIP_STYLE_ID;
    style.textContent = TOOLTIP_STYLE;
    document.head.appendChild(style);
  }, []);
}

// --- Component (mode wrapper) ---

export function NetworkGraph({
  nodes,
  edges,
  selectedId,
  searchQuery,
  onSelectNode,
  onExpandNode,
  className,
  emptyMessage = "No data to display",
  hideTooltips = true,
  defaultDimensions = "2d",
  dimensions,
  onDimensionsChange,
  showDimensionToggle = true,
}: NetworkGraphProps) {
  const isDark = useIsDark();
  const [internalDimensions, setInternalDimensions] =
    useState<GraphDimensions>(defaultDimensions);

  // Controlled when `dimensions` is provided, otherwise internal state.
  const activeDimensions = dimensions ?? internalDimensions;

  const setDimensions = useCallback(
    (next: GraphDimensions) => {
      if (dimensions === undefined) setInternalDimensions(next);
      onDimensionsChange?.(next);
    },
    [dimensions, onDimensionsChange]
  );

  const hasNodes = nodes.length > 0;

  // Compute unique types for legend
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach(n => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types);
  }, [nodes]);

  const viewProps: GraphViewProps = {
    nodes,
    edges,
    isDark,
    selectedId,
    searchQuery,
    onSelectNode,
    onExpandNode,
    hideTooltips,
  };

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Mode toggle */}
      {showDimensionToggle && (
        <DimensionToggle
          value={activeDimensions}
          onChange={setDimensions}
          disabled={!hasNodes}
        />
      )}

      {/* Active view */}
      {activeDimensions === "3d" ? (
        <NetworkGraph3D {...viewProps} />
      ) : (
        <NetworkGraph2D {...viewProps} />
      )}

      {/* Type legend (shared across modes) */}
      {uniqueTypes.length > 0 && (
        <TypeLegend types={uniqueTypes} isDark={isDark} />
      )}

      {/* Empty state */}
      {!hasNodes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-[var(--muted-foreground,#737373)]">
            {emptyMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// --- 2D view (react-force-graph-2d / canvas) ---

type Graph2DComponent = (typeof import("react-force-graph-2d"))["default"];

const NODE_RADIUS = 5;
const NODE_BORDER = 1.4;

function NetworkGraph2D({
  nodes,
  edges,
  isDark,
  selectedId,
  searchQuery,
  onSelectNode,
  onExpandNode,
  hideTooltips,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods2D | undefined>(undefined);

  useNeutralizeTooltipChrome();

  // react-force-graph-2d touches `window`, so load it on the client only.
  // Until loaded, render an empty container.
  const [Graph, setGraph] = useState<Graph2DComponent | null>(null);
  useEffect(() => {
    let active = true;
    import("react-force-graph-2d").then(mod => {
      if (active) setGraph(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, []);

  const size = useContainerSize(containerRef);

  // Stable callback refs
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const onExpandNodeRef = useRef(onExpandNode);
  onExpandNodeRef.current = onExpandNode;
  const hideTooltipsRef = useRef(hideTooltips);
  hideTooltipsRef.current = hideTooltips;

  const graphData = useGraphData(nodes, edges, isDark);
  const highlight = useHighlight(nodes, edges, selectedId, searchQuery);

  // Label + dim colors, mirroring the 3D view's choices.
  const dimFill = isDark ? "#3a3a3a" : "#d4d4d4";
  const dimBorder = isDark ? "#525252" : "#a3a3a3";
  const labelColor = isDark ? "#e5e5e5" : "#1a1a1a";
  const dimLabelColor = isDark ? "#737373" : "#a3a3a3";
  // Relationship-label color (muted) + the page background used as a legibility
  // halo so labels stay readable where they cross a link line.
  const linkLabelColor = isDark ? "#a3a3a3" : "#737373";
  const pageBg = isDark ? "#0a0a0a" : "#fafafa";

  // Draw each node as a pale filled disc with a colored ring and a label
  // below it — the 2D counterpart of the 3D `nodeThreeObject`.
  const nodeCanvasObject = useCallback(
    (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x ?? 0;
      const y = node.y ?? 0;
      const dimmed = !!highlight && !highlight.keep.has(String(node.id));
      const fill = dimmed ? dimFill : (node.fill as string);
      const border = dimmed ? dimBorder : (node.border as string);

      ctx.globalAlpha = dimmed ? 0.35 : 1;

      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = NODE_BORDER;
      ctx.strokeStyle = border;
      ctx.stroke();

      const text = String(node.label ?? "");
      if (text) {
        const fontSize = Math.max(10 / globalScale, 2.5);
        ctx.font = `${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = dimmed ? dimLabelColor : labelColor;
        ctx.fillText(text, x, y + NODE_RADIUS + 2);
      }

      ctx.globalAlpha = 1;
    },
    [highlight, dimFill, dimBorder, labelColor, dimLabelColor]
  );

  // Keep the clickable area aligned with the drawn disc.
  const nodePointerAreaPaint = useCallback(
    (node: NodeObject, color: string, ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      ctx.arc(node.x ?? 0, node.y ?? 0, NODE_RADIUS + 2, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    },
    []
  );

  const linkColor = useCallback(
    (link: LinkObject) => {
      const muted = isDark ? "rgba(160,160,160,0.5)" : "rgba(115,115,115,0.5)";
      if (linkDimmed(link, highlight)) {
        return isDark ? "rgba(80,80,80,0.15)" : "rgba(200,200,200,0.25)";
      }
      return muted;
    },
    [highlight, isDark]
  );

  // Always-on relationship label, drawn at each link's midpoint (a little
  // smaller than node labels), matching the original graph's edge labels.
  const linkCanvasObject = useCallback(
    (link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = String(link.label ?? "");
      if (!label) return;
      const start = link.source as NodeObject | undefined;
      const end = link.target as NodeObject | undefined;
      if (!start || !end || typeof start !== "object" || typeof end !== "object")
        return;
      const sx = start.x;
      const sy = start.y;
      const ex = end.x;
      const ey = end.y;
      if (sx == null || sy == null || ex == null || ey == null) return;
      const x = (sx + ex) / 2;
      const y = (sy + ey) / 2;

      const fontSize = Math.max(7 / globalScale, 2);
      ctx.font = `${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = linkDimmed(link, highlight) ? 0.3 : 1;
      // Halo so the text reads over the link line.
      ctx.lineWidth = fontSize * 0.5;
      ctx.strokeStyle = pageBg;
      ctx.strokeText(label, x, y);
      ctx.fillStyle = linkLabelColor;
      ctx.fillText(label, x, y);
      ctx.globalAlpha = 1;
    },
    [highlight, linkLabelColor, pageBg]
  );

  const nodeLabel = useCallback((node: NodeObject) => {
    if (hideTooltipsRef.current) return "";
    const graphNode = node.node as GraphNode | undefined;
    if (!graphNode) return "";
    return renderTooltipHtml(graphNode);
  }, []);

  const handleNodeClick = useNodeClickDispatch(onSelectNodeRef, onExpandNodeRef);
  const handleBackgroundClick = useCallback(() => {
    onSelectNodeRef.current?.(null);
  }, []);

  // Fit the scene into view once the layout first settles (shared latch).
  const handleEngineStop = useFitOnSettle(nodes.length, () => {
    fgRef.current?.zoomToFit(400, 40);
  });

  // Toolbar handlers — wired to the force-graph 2D camera API.
  const handleZoomIn = useCallback(() => {
    const fg = fgRef.current;
    if (fg) fg.zoom(fg.zoom() * 1.2, 200);
  }, []);
  const handleZoomOut = useCallback(() => {
    const fg = fgRef.current;
    if (fg) fg.zoom(fg.zoom() / 1.2, 200);
  }, []);
  const handleFit = useCallback(() => {
    fgRef.current?.zoomToFit(400, 40);
  }, []);
  const handleReset = useCallback(() => {
    const fg = fgRef.current;
    if (!fg) return;
    fg.d3ReheatSimulation();
    fg.centerAt(0, 0, 400);
    fg.zoomToFit(600, 40);
  }, []);

  // Spread the layout out: configure the forces once the graph is mounted,
  // then reheat so they take effect. `ready` flips once (not on every resize).
  const ready = !!Graph && size.width > 0;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Configure forces on the live simulation; the in-flight initial layout
    // (cooldownTicks) picks up the new strength/distance on its next ticks.
    // Do NOT reheat here — restarting the loop can race the layout setup and
    // crash the tick (`layout.tick` on undefined), which blanks the 3D view.
    fg.d3Force("charge")?.strength(CHARGE_STRENGTH);
    fg.d3Force("link")?.distance(LINK_DISTANCE);
  }, [ready, graphData]);

  const fgProps: ForceGraphProps2D = {
    graphData,
    width: size.width || undefined,
    height: size.height || undefined,
    // Transparent so the graph sits on the page background rather than
    // painting its own backdrop, matching the 3D scene.
    backgroundColor: "rgba(0,0,0,0)",
    nodeRelSize: NODE_RADIUS,
    nodeCanvasObject,
    nodePointerAreaPaint,
    nodeLabel,
    linkColor,
    linkWidth: 1,
    // Draw the default link line first, then the always-on label on top.
    linkCanvasObjectMode: () => "after" as const,
    linkCanvasObject,
    linkDirectionalArrowLength: 3,
    linkDirectionalArrowRelPos: 1,
    onNodeClick: handleNodeClick,
    onBackgroundClick: handleBackgroundClick,
    onEngineStop: handleEngineStop,
    // Freeze the simulation after a fixed number of ticks so the layout
    // settles to a stable result instead of drifting forever.
    cooldownTicks: COOLDOWN_TICKS,
    minZoom: 0.2,
    maxZoom: 8,
  };

  return (
    <>
      <GraphToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onReset={handleReset}
      />
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {Graph && size.width > 0 && (
          <Graph
            ref={
              fgRef as React.MutableRefObject<ForceGraphMethods2D | undefined>
            }
            {...fgProps}
          />
        )}
      </div>
    </>
  );
}

// --- 3D view (react-force-graph-3d / three) ---

type Graph3DComponent = (typeof import("react-force-graph-3d"))["default"];
type ThreeModule = typeof import("three");

function NetworkGraph3D({
  nodes,
  edges,
  isDark,
  selectedId,
  searchQuery,
  onSelectNode,
  onExpandNode,
  hideTooltips,
}: GraphViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods3D | undefined>(undefined);

  useNeutralizeTooltipChrome();

  // three / react-force-graph-3d are heavy and touch `window`, so load them
  // on the client only. `three` is already pulled in by the graph library,
  // so this second import resolves the same module without a double load.
  // Until loaded, render an empty container.
  const [api, setApi] = useState<{
    Graph: Graph3DComponent;
    three: ThreeModule;
  } | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([import("react-force-graph-3d"), import("three")]).then(
      ([graphMod, three]) => {
        if (active) setApi({ Graph: graphMod.default, three });
      }
    );
    return () => {
      active = false;
    };
  }, []);
  const Graph = api?.Graph ?? null;

  const size = useContainerSize(containerRef);

  // Stable callback refs
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const onExpandNodeRef = useRef(onExpandNode);
  onExpandNodeRef.current = onExpandNode;
  const hideTooltipsRef = useRef(hideTooltips);
  hideTooltipsRef.current = hideTooltips;

  const graphData = useGraphData(nodes, edges, isDark);
  const highlight = useHighlight(nodes, edges, selectedId, searchQuery);

  // Render nodes with unlit (MeshBasic) materials so they show the EXACT
  // palette hex — three.js lighting would otherwise shade the pale fills into
  // muddy greys. A small back-side outline sphere reproduces the 2D node's
  // colored ring around a soft fill. Geometry + materials are cached/shared.
  const dimFill = isDark ? "#3a3a3a" : "#d4d4d4";
  const dimBorder = isDark ? "#525252" : "#a3a3a3";
  const innerGeomRef = useRef<InstanceType<ThreeModule["SphereGeometry"]> | null>(
    null
  );
  const outerGeomRef = useRef<InstanceType<ThreeModule["SphereGeometry"]> | null>(
    null
  );
  const matCacheRef = useRef<
    Map<string, InstanceType<ThreeModule["MeshBasicMaterial"]>>
  >(new Map());
  const labelMatCacheRef = useRef<
    Map<string, InstanceType<ThreeModule["SpriteMaterial"]>>
  >(new Map());

  const nodeThreeObject = useCallback(
    (node: NodeObject) => {
      // Only rendered while `api` is loaded (the Graph itself gates on it).
      const three = api!.three;
      if (!innerGeomRef.current)
        innerGeomRef.current = new three.SphereGeometry(4.5, 16, 16);
      if (!outerGeomRef.current)
        outerGeomRef.current = new three.SphereGeometry(5.6, 16, 16);

      const dimmed = !!highlight && !highlight.keep.has(String(node.id));
      const fill = dimmed ? dimFill : (node.fill as string);
      const border = dimmed ? dimBorder : (node.border as string);
      const opacity = dimmed ? 0.35 : 1;

      const material = (color: string, side: Side) => {
        const key = `${color}|${opacity}|${side}`;
        let mat = matCacheRef.current.get(key);
        if (!mat) {
          mat = new three.MeshBasicMaterial({
            color,
            side,
            transparent: opacity < 1,
            opacity,
          });
          matCacheRef.current.set(key, mat);
        }
        return mat;
      };

      const group = new three.Group();
      // Outline: a larger sphere rendered back-side-only sits behind the fill.
      group.add(new three.Mesh(outerGeomRef.current, material(border, three.BackSide)));
      group.add(new three.Mesh(innerGeomRef.current, material(fill, three.FrontSide)));

      // Always-on text label below the node, mirroring the 2D layout.
      const text = String(node.label ?? "");
      if (text) {
        const labelColor = dimmed
          ? isDark
            ? "#737373"
            : "#a3a3a3"
          : isDark
            ? "#e5e5e5"
            : "#1a1a1a";
        group.add(
          buildLabelSprite(
            three,
            text,
            labelColor,
            opacity,
            labelMatCacheRef.current
          )
        );
      }
      return group;
    },
    [api, highlight, isDark, dimFill, dimBorder]
  );

  const linkColor = useCallback(
    (link: LinkObject) => {
      const muted = isDark ? "rgba(160,160,160,0.4)" : "rgba(115,115,115,0.45)";
      if (linkDimmed(link, highlight)) {
        return isDark ? "rgba(80,80,80,0.12)" : "rgba(200,200,200,0.18)";
      }
      return muted;
    },
    [highlight, isDark]
  );

  // Always-on relationship label as a small text sprite at the link midpoint —
  // the 3D counterpart of the 2D linkCanvasObject (smaller than node labels).
  const linkLabelColor = isDark ? "#a3a3a3" : "#737373";
  const linkThreeObject = useCallback(
    (link: LinkObject) => {
      // Only invoked once the graph (and thus `api`) is loaded.
      const three = api!.three;
      const label = String(link.label ?? "");
      if (!label) return new three.Object3D();
      const opacity = linkDimmed(link, highlight) ? 0.3 : 0.9;
      return buildLabelSprite(
        three,
        label,
        linkLabelColor,
        opacity,
        labelMatCacheRef.current,
        2.5
      );
    },
    [api, highlight, linkLabelColor]
  );
  const linkPositionUpdate = useCallback(
    (
      obj: unknown,
      {
        start,
        end,
      }: {
        start: { x: number; y: number; z: number };
        end: { x: number; y: number; z: number };
      }
    ) => {
      const sprite = obj as InstanceType<ThreeModule["Sprite"]>;
      sprite.position.set(
        start.x + (end.x - start.x) / 2,
        start.y + (end.y - start.y) / 2,
        start.z + (end.z - start.z) / 2
      );
      return false;
    },
    []
  );

  const nodeLabel = useCallback((node: NodeObject) => {
    if (hideTooltipsRef.current) return "";
    const graphNode = node.node as GraphNode | undefined;
    if (!graphNode) return "";
    return renderTooltipHtml(graphNode);
  }, []);

  const dispatchNodeClick = useNodeClickDispatch(
    onSelectNodeRef,
    onExpandNodeRef
  );
  const handleNodeClick = useCallback(
    (node: NodeObject) => {
      // Ease the camera toward the clicked node along the current view axis,
      // then run the shared select/expand dispatch.
      const fg = fgRef.current;
      if (
        fg &&
        typeof node.x === "number" &&
        typeof node.y === "number" &&
        typeof node.z === "number"
      ) {
        const distance = 120;
        const radius = Math.hypot(node.x, node.y, node.z) || 1;
        const ratio = 1 + distance / radius;
        fg.cameraPosition(
          { x: node.x * ratio, y: node.y * ratio, z: node.z * ratio },
          { x: node.x, y: node.y, z: node.z },
          700
        );
      }
      dispatchNodeClick(node);
    },
    [dispatchNodeClick]
  );

  const handleBackgroundClick = useCallback(() => {
    onSelectNodeRef.current?.(null);
  }, []);

  // Fit the scene into view once the layout first settles (shared latch).
  const handleEngineStop = useFitOnSettle(nodes.length, () => {
    fgRef.current?.zoomToFit(400, 60);
  });

  // Toolbar handlers
  const dolly = useCallback((factor: number) => {
    const fg = fgRef.current;
    if (!fg) return;
    // Scale the camera's distance to the origin to zoom in/out.
    const pos = fg.camera().position;
    fg.cameraPosition(
      { x: pos.x * factor, y: pos.y * factor, z: pos.z * factor },
      undefined,
      200
    );
  }, []);

  const handleZoomIn = useCallback(() => dolly(0.8), [dolly]);
  const handleZoomOut = useCallback(() => dolly(1.25), [dolly]);
  const handleFit = useCallback(() => {
    fgRef.current?.zoomToFit(400, 60);
  }, []);
  const handleReset = useCallback(() => {
    fgRef.current?.d3ReheatSimulation();
    fgRef.current?.zoomToFit(600, 60);
  }, []);

  // Spread the layout out: configure the forces once the graph is mounted,
  // then reheat so they take effect. `ready` flips once (not on every resize).
  const ready = !!Graph && size.width > 0;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    // Configure forces on the live simulation; the in-flight initial layout
    // (cooldownTicks) picks up the new strength/distance on its next ticks.
    // Do NOT reheat here — restarting the loop can race the layout setup and
    // crash the tick (`layout.tick` on undefined), which blanks the 3D view.
    fg.d3Force("charge")?.strength(CHARGE_STRENGTH);
    fg.d3Force("link")?.distance(LINK_DISTANCE);
  }, [ready, graphData]);

  const fgProps: ForceGraphProps3D = {
    graphData,
    width: size.width || undefined,
    height: size.height || undefined,
    // Transparent so the graph sits on the page background, matching the 2D
    // canvas rather than painting its own backdrop. `alpha` must be enabled on
    // the WebGL renderer itself, or it clears to opaque black (a black screen).
    backgroundColor: "rgba(0,0,0,0)",
    rendererConfig: { alpha: true, antialias: true },
    nodeRelSize: NODE_RADIUS,
    nodeThreeObject,
    nodeLabel,
    linkColor,
    linkWidth: 0.5,
    linkOpacity: isDark ? 0.5 : 0.6,
    // Always-on relationship label sprite, centered on each link.
    linkThreeObjectExtend: true,
    linkThreeObject,
    linkPositionUpdate,
    linkDirectionalArrowLength: 3,
    linkDirectionalArrowRelPos: 1,
    onNodeClick: handleNodeClick,
    onBackgroundClick: handleBackgroundClick,
    onEngineStop: handleEngineStop,
    cooldownTicks: COOLDOWN_TICKS,
    showNavInfo: false,
  };

  return (
    <>
      <GraphToolbar
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onReset={handleReset}
      />
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {Graph && size.width > 0 && (
          <Graph
            ref={
              fgRef as React.MutableRefObject<ForceGraphMethods3D | undefined>
            }
            {...fgProps}
          />
        )}
      </div>
    </>
  );
}

/**
 * Build a camera-facing text sprite for an always-visible node label. The
 * text is drawn to a canvas and used as a sprite texture; the SpriteMaterial
 * is cached per (text, color, opacity) so repeated labels share a texture.
 */
function buildLabelSprite(
  three: ThreeModule,
  text: string,
  color: string,
  opacity: number,
  cache: Map<string, InstanceType<ThreeModule["SpriteMaterial"]>>,
  height = 4
): InstanceType<ThreeModule["Sprite"]> {
  const key = `${text}|${color}|${opacity}`;
  let material = cache.get(key);
  if (!material) {
    const fontSize = 40;
    const font = `${fontSize}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
    const measureCtx = document.createElement("canvas").getContext("2d")!;
    measureCtx.font = font;
    const textWidth = Math.ceil(measureCtx.measureText(text).width);

    const canvas = document.createElement("canvas");
    canvas.width = textWidth + 8;
    canvas.height = fontSize + 8;
    const ctx = canvas.getContext("2d")!;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new three.CanvasTexture(canvas);
    texture.colorSpace = three.SRGBColorSpace;
    texture.minFilter = three.LinearFilter;
    material = new three.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity,
      depthWrite: false,
    });
    material.userData.aspect = canvas.width / canvas.height;
    cache.set(key, material);
  }

  const sprite = new three.Sprite(material);
  const aspect = (material.userData.aspect as number) ?? 4;
  sprite.scale.set(height * aspect, height, 1);
  sprite.position.set(0, -10, 0);
  return sprite;
}

// --- Type legend ---

function TypeLegend({ types, isDark }: { types: string[]; isDark: boolean }) {
  return (
    <div className="absolute left-3 bottom-3 z-10 flex flex-col gap-1 rounded-md border bg-[var(--card,#fff)]/95 px-2.5 py-2 backdrop-blur-sm">
      {types.map(type => {
        const color = typeColor(type, isDark);
        return (
          <div key={type} className="flex items-center gap-2">
            <div
              className="size-3 rounded-full shrink-0"
              style={{
                backgroundColor: color.bg,
                border: `1.5px solid ${color.border}`,
              }}
            />
            <span className="text-[11px] text-[var(--muted-foreground,#737373)]">
              {type}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// --- Toolbar ---

function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFit,
  onReset,
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onReset: () => void;
}) {
  return (
    <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-md border bg-[var(--card,#fff)]/95 p-1 backdrop-blur-sm">
      <ToolbarButton onClick={onZoomIn} title="Zoom in">
        <ZoomInIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onZoomOut} title="Zoom out">
        <ZoomOutIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onFit} title="Fit to view">
        <FitIcon />
      </ToolbarButton>
      <ToolbarButton onClick={onReset} title="Reset layout">
        <ResetIcon />
      </ToolbarButton>
    </div>
  );
}

function DimensionToggle({
  value,
  onChange,
  disabled,
}: {
  value: GraphDimensions;
  onChange: (value: GraphDimensions) => void;
  disabled?: boolean;
}) {
  return (
    <div className="absolute right-3 top-3 z-10 flex items-center gap-0.5 rounded-md border bg-[var(--card,#fff)]/95 p-1 backdrop-blur-sm">
      <DimensionButton
        active={value === "2d"}
        disabled={disabled}
        title="2D view"
        onClick={() => onChange("2d")}
      >
        2D
      </DimensionButton>
      <DimensionButton
        active={value === "3d"}
        disabled={disabled}
        title="3D view"
        onClick={() => onChange("3d")}
      >
        3D
      </DimensionButton>
    </div>
  );
}

function DimensionButton({
  active,
  disabled,
  title,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center h-7 min-w-9 px-2 rounded-sm text-[11px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        active
          ? "bg-[var(--accent,#f5f5f5)] text-[var(--accent-foreground,#1a1a1a)]"
          : "text-[var(--muted-foreground,#737373)] hover:bg-[var(--accent,#f5f5f5)] hover:text-[var(--accent-foreground,#1a1a1a)]"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  onClick,
  title,
  disabled,
  children,
}: {
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className="inline-flex items-center justify-center h-7 w-7 rounded-sm text-[var(--muted-foreground,#737373)] hover:bg-[var(--accent,#f5f5f5)] hover:text-[var(--accent-foreground,#1a1a1a)] disabled:opacity-50 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  );
}

// --- Inline SVG icons (avoid lucide-react dependency for toolbar) ---

function ZoomInIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  );
}
