/**
 * Force-directed graph visualization based on cytoscape.
 *
 * Uses the fcose layout for clear node placement. Pass nodes
 * and edges as data; interaction handlers cover selection,
 * hover, and click. Used in matrix-author for dependency and
 * relationship views.
 */
"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import type { Core, NodeSingular, LayoutOptions } from "cytoscape";
import { cn } from "../lib/utils";

// Register fcose layout once
if (
  typeof cytoscape.prototype === "object" &&
  !Object.prototype.hasOwnProperty.call(cytoscape.prototype, "fcose")
) {
  cytoscape.use(fcose);
}

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

// --- Internal types ---

type FcoseLayoutOptions = LayoutOptions & {
  name: "fcose";
  animate?: boolean;
  animationDuration?: number;
  randomize?: boolean;
  nodeDimensionsIncludeLabels?: boolean;
  idealEdgeLength?: number;
  nodeRepulsion?: number;
  gravity?: number;
  fit?: boolean;
  fixedNodeConstraint?: Array<{
    nodeId: string;
    position: { x: number; y: number };
  }>;
};

interface TooltipState {
  node: GraphNode;
  x: number;
  y: number;
}

// --- Utilities ---

// --- Stylesheet ---

function createStylesheet(isDark: boolean) {
  const fg = isDark ? "#e5e5e5" : "#1a1a1a";
  const muted = isDark ? "#404040" : "#e5e5e5";
  const mutedFg = isDark ? "#a3a3a3" : "#737373";

  return [
    {
      selector: "node",
      style: {
        label: "data(label)",
        "text-valign": "bottom" as const,
        "text-halign": "center" as const,
        "text-margin-y": 6,
        "font-size": "10px",
        color: fg,
        "background-color": "data(color)" as unknown as string,
        "border-color": "data(borderColor)" as unknown as string,
        "border-width": 2,
        width: 28,
        height: 28,
      },
    },
    {
      selector: "node:selected",
      style: { width: 34, height: 34, "border-width": 3 },
    },
    {
      selector: "node.dimmed",
      style: { opacity: 0.3 },
    },
    {
      selector: "edge",
      style: {
        width: 1,
        "line-color": muted,
        "target-arrow-color": muted,
        "target-arrow-shape": "triangle" as const,
        "curve-style": "bezier" as const,
        "arrow-scale": 0.6,
        label: "data(label)",
        "font-size": "8px",
        "text-rotation": "autorotate" as const,
        "text-margin-y": -12,
        color: mutedFg,
        "text-max-width": 80,
        "text-wrap": "ellipsis" as const,
      },
    },
    {
      selector: "edge.dimmed",
      style: { opacity: 0.15 },
    },
  ];
}

// --- Layout constants ---

const LAYOUT_BASE: Omit<FcoseLayoutOptions, "name"> = {
  nodeDimensionsIncludeLabels: true,
  idealEdgeLength: 160,
  nodeRepulsion: 8000,
  gravity: 0.25,
};

// --- Component ---

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
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Stable ref for hideTooltips (captured in init effect)
  const hideTooltipsRef = useRef(hideTooltips);
  hideTooltipsRef.current = hideTooltips;

  // Track whether cursor is over the tooltip card
  const tooltipHoveredRef = useRef(false);

  // Store node map for lookups
  const nodeMapRef = useRef<Map<string, GraphNode>>(new Map());
  useEffect(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach(n => map.set(n.id, n));
    nodeMapRef.current = map;
  }, [nodes]);

  // Stable callback refs
  const onSelectNodeRef = useRef(onSelectNode);
  onSelectNodeRef.current = onSelectNode;
  const onExpandNodeRef = useRef(onExpandNode);
  onExpandNodeRef.current = onExpandNode;

  // Track dark mode
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

  // Initialize cytoscape
  useEffect(() => {
    if (!containerRef.current || cyRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: createStylesheet(isDark) as cytoscape.StylesheetJsonBlock[],
      wheelSensitivity: 0.3,
      maxZoom: 3,
      minZoom: 0.2,
    });
    cyRef.current = cy;

    cy.on("tap", "node", evt => {
      const nodeId = evt.target.id();
      const node = nodeMapRef.current.get(nodeId) ?? null;
      onSelectNodeRef.current?.(node);
    });

    cy.on("dbltap", "node", evt => {
      onExpandNodeRef.current?.(evt.target.id());
    });

    cy.on("tap", evt => {
      if (evt.target === cy) {
        onSelectNodeRef.current?.(null);
        setTooltip(null);
      }
    });

    // Hover tooltip — tracks node position on pan/zoom/drag
    let hoveredNodeId: string | null = null;

    const updateTooltipPosition = () => {
      if (!hoveredNodeId || hideTooltipsRef.current) return;
      const cyNode = cy.getElementById(hoveredNodeId);
      if (!cyNode.length) return;
      const graphNode = nodeMapRef.current.get(hoveredNodeId);
      if (!graphNode) return;
      // Use rendered bounding box to get the actual top of the node on screen
      const bb = cyNode.renderedBoundingBox({ includeLabels: false });
      setTooltip({ node: graphNode, x: (bb.x1 + bb.x2) / 2, y: bb.y1 });
    };

    cy.on("mouseover", "node", evt => {
      if (hideTooltipsRef.current) return;
      hoveredNodeId = (evt.target as NodeSingular).id();
      updateTooltipPosition();
    });

    cy.on("mouseout", "node", () => {
      hoveredNodeId = null;
      // Delay closing to allow cursor to move to the tooltip card
      setTimeout(() => {
        if (!tooltipHoveredRef.current) {
          setTooltip(null);
        }
      }, 100);
    });

    // Update tooltip position during pan/zoom/drag
    cy.on("pan zoom position", () => {
      updateTooltipPosition();
    });

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update stylesheet on theme change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style(createStylesheet(isDark) as cytoscape.StylesheetJsonBlock[]);
  }, [isDark]);

  // Sync elements incrementally
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const currentNodeIds = new Set(cy.nodes().map(n => n.id()));
    const targetNodeIds = new Set(nodes.map(n => n.id));
    const wasEmpty = currentNodeIds.size === 0;

    // Remove stale nodes (edges auto-removed)
    for (const id of currentNodeIds) {
      if (!targetNodeIds.has(id)) {
        cy.getElementById(id).remove();
      }
    }

    // Add new nodes
    const nodesToAdd = nodes.filter(n => !currentNodeIds.has(n.id));
    for (const node of nodesToAdd) {
      let position = { x: 0, y: 0 };

      if (!wasEmpty) {
        // Position near a connected existing node
        const connectedEdge = edges.find(
          e =>
            (e.source === node.id && currentNodeIds.has(e.target)) ||
            (e.target === node.id && currentNodeIds.has(e.source))
        );
        if (connectedEdge) {
          const connectedId =
            connectedEdge.source === node.id
              ? connectedEdge.target
              : connectedEdge.source;
          const existing = cy.getElementById(connectedId);
          if (existing.length) {
            const p = existing.position();
            const angle = Math.random() * 2 * Math.PI;
            const dist = 180 + Math.random() * 60;
            position = {
              x: p.x + Math.cos(angle) * dist,
              y: p.y + Math.sin(angle) * dist,
            };
          }
        }
      }

      const color = typeColor(node.type, isDark);
      cy.add({
        data: {
          id: node.id,
          label: node.label || node.id,
          color: color.bg,
          borderColor: color.border,
        },
        position,
      });
    }

    // Diff edges
    const targetEdgeKeys = new Map<
      string,
      { source: string; target: string; label: string }
    >();
    for (const edge of edges) {
      const key = `edge-${edge.source}-${edge.target}-${edge.label ?? ""}`;
      targetEdgeKeys.set(key, {
        source: edge.source,
        target: edge.target,
        label: edge.label ?? "",
      });
    }

    cy.edges().forEach(e => {
      const key = `edge-${e.data("source")}-${e.data("target")}-${e.data("label") ?? ""}`;
      if (!targetEdgeKeys.has(key)) e.remove();
    });

    for (const [key, data] of targetEdgeKeys) {
      if (!cy.getElementById(key).length) {
        cy.add({ data: { id: key, ...data } });
      }
    }

    // Layout
    if (nodesToAdd.length > 0) {
      if (wasEmpty) {
        cy.layout({
          name: "fcose",
          animate: false,
          randomize: true,
          ...LAYOUT_BASE,
        } as FcoseLayoutOptions).run();
      } else {
        const newIds = new Set(nodesToAdd.map(n => n.id));
        const newCyNodes = cy.nodes().filter(n => newIds.has(n.id()));
        const neighborNodes = newCyNodes.neighborhood().nodes();
        const subgraph = newCyNodes.union(neighborNodes);

        const fixedNodeConstraint = neighborNodes
          .filter(n => !newIds.has(n.id()))
          .map((n: NodeSingular) => ({
            nodeId: n.id(),
            position: n.position(),
          }));

        subgraph
          .layout({
            name: "fcose",
            animate: true,
            animationDuration: 300,
            randomize: false,
            fit: false,
            fixedNodeConstraint,
            ...LAYOUT_BASE,
          } as FcoseLayoutOptions)
          .run();
      }
    }
  }, [nodes, edges]);

  // Selection highlighting
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    cy.nodes().removeClass("dimmed").unselect();
    cy.edges().removeClass("dimmed");

    if (selectedId) {
      const selected = cy.getElementById(selectedId);
      if (selected.length) {
        selected.select();
        const connected = selected.neighborhood().nodes();
        cy.nodes().not(selected).not(connected).addClass("dimmed");
        cy.edges().not(selected.connectedEdges()).addClass("dimmed");
      }
    }
  }, [selectedId]);

  // Search dimming
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    if (!searchQuery?.trim()) {
      if (!selectedId) {
        cy.nodes().removeClass("dimmed");
        cy.edges().removeClass("dimmed");
      }
      return;
    }

    const query = searchQuery.toLowerCase();
    cy.nodes().forEach(node => {
      const label = (node.data("label") || "").toLowerCase();
      if (label.includes(query)) {
        node.removeClass("dimmed");
      } else {
        node.addClass("dimmed");
      }
    });
  }, [searchQuery, selectedId]);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => {
    const cy = cyRef.current;
    if (cy) cy.zoom(cy.zoom() * 1.2);
  }, []);

  const handleZoomOut = useCallback(() => {
    const cy = cyRef.current;
    if (cy) cy.zoom(cy.zoom() / 1.2);
  }, []);

  const handleFit = useCallback(() => {
    cyRef.current?.fit(undefined, 40);
  }, []);

  const handleResetLayout = useCallback(() => {
    cyRef.current
      ?.layout({
        name: "fcose",
        animate: true,
        animationDuration: 500,
        randomize: true,
        ...LAYOUT_BASE,
      } as FcoseLayoutOptions)
      .run();
  }, []);

  const hasNodes = nodes.length > 0;

  // Compute unique types for legend
  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    nodes.forEach(n => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types);
  }, [nodes]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      {/* Toolbar */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-md border bg-[var(--card,#fff)]/95 p-1 backdrop-blur-sm">
        <ToolbarButton
          onClick={handleZoomIn}
          title="Zoom in"
          disabled={!hasNodes}
        >
          <ZoomInIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleZoomOut}
          title="Zoom out"
          disabled={!hasNodes}
        >
          <ZoomOutIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleFit}
          title="Fit to view"
          disabled={!hasNodes}
        >
          <FitIcon />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleResetLayout}
          title="Reset layout"
          disabled={!hasNodes}
        >
          <ResetIcon />
        </ToolbarButton>
      </div>

      {/* Type legend */}
      {uniqueTypes.length > 0 && (
        <div className="absolute left-3 bottom-3 z-10 flex flex-col gap-1 rounded-md border bg-[var(--card,#fff)]/95 px-2.5 py-2 backdrop-blur-sm">
          {uniqueTypes.map(type => {
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
      )}

      {/* Cytoscape container */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Empty state */}
      {!hasNodes && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-[var(--muted-foreground,#737373)]">
            {emptyMessage}
          </p>
        </div>
      )}

      {/* Hover tooltip — interactive (pointer-events-auto so user can hover over it) */}
      {tooltip && (
        <NodeTooltip
          node={tooltip.node}
          x={tooltip.x}
          y={tooltip.y}
          onMouseEnter={() => {
            tooltipHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            tooltipHoveredRef.current = false;
            setTooltip(null);
          }}
        />
      )}
    </div>
  );
}

// --- Tooltip ---

interface NodeTooltipProps extends TooltipState {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function NodeTooltip({
  node,
  x,
  y,
  onMouseEnter,
  onMouseLeave,
}: NodeTooltipProps) {
  const entries = node.properties ? Object.entries(node.properties) : [];
  const visible = entries.slice(0, 8);
  const remaining = entries.length - visible.length;

  // y is already the top of the node's bounding box — just add gap for the arrow
  const tooltipTop = y - 8;

  return (
    <div
      className="absolute z-20 w-[260px]"
      style={{
        left: x,
        top: tooltipTop,
        transform: "translate(-50%, -100%)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Card */}
      <div className="rounded-lg border border-[var(--border,#e5e5e5)] bg-[var(--popover,#fff)] text-[var(--popover-foreground,#1a1a1a)] shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-3 pt-2.5 pb-1.5">
          <p className="text-[13px] font-semibold truncate">{node.label}</p>
          {node.type && (
            <p className="text-[10px] text-[var(--muted-foreground,#737373)] font-mono mt-0.5">
              {node.type}
            </p>
          )}
        </div>

        {/* Properties */}
        {visible.length > 0 && (
          <div className="px-3 pb-2.5 pt-1 border-t border-[var(--border,#e5e5e5)]">
            <div className="space-y-1 mt-1.5">
              {visible.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline gap-2 text-[11px] leading-tight"
                >
                  <span className="shrink-0 text-[var(--muted-foreground,#737373)]">
                    {key}
                  </span>
                  <span className="truncate text-[var(--foreground,#1a1a1a)]">
                    {value}
                  </span>
                </div>
              ))}
              {remaining > 0 && (
                <p className="text-[10px] text-[var(--muted-foreground,#737373)] pt-0.5">
                  +{remaining} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Arrow pointing down to the node */}
      <div className="relative flex justify-center -mt-px">
        {/* Border arrow */}
        <div
          className="absolute size-0"
          style={{
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderTop: "7px solid var(--border, #e5e5e5)",
          }}
        />
        {/* Fill arrow (overlaps border arrow to create bordered effect) */}
        <div
          className="absolute size-0"
          style={{
            top: -1,
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderTop: "6px solid var(--popover, #fff)",
          }}
        />
      </div>
      {/* Spacer for the arrow height so hover area extends to the node */}
      <div style={{ height: 8 }} />
    </div>
  );
}

// --- Toolbar button ---

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
