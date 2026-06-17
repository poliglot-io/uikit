/**
 * Workspace shell skeleton for previews.
 *
 * A view rarely renders on a blank page — it sits inside an application
 * shell. This component draws a blanked-out skeleton of that surrounding
 * chrome and drops the previewed content into the main surface, so an author
 * can see how their view reads inside a realistic layout instead of floating
 * in isolation.
 *
 * The chrome is:
 *  - a top bar: a logo, a workspace switcher, a row of tabs, and a right
 *    cluster of actions;
 *  - a full-width content surface where the previewed view renders;
 *  - a command panel floating at the bottom center, with a composer row over
 *    a dock of app slots.
 *
 * Everything except the view surface is an inert placeholder: no labels, no
 * behavior, just greyed regions that establish the layout's proportions.
 */

import * as React from "react";

/** Which regions of the shell to draw. All default on. */
export interface ShellRegions {
  /** Top bar (logo, switcher, tabs, actions). */
  header?: boolean;
  /** Row of tabs in the top bar. */
  tabs?: boolean;
  /** Floating command panel pinned to the bottom. */
  commandPanel?: boolean;
}

export interface WorkspaceShellProps extends ShellRegions {
  /** The previewed view, rendered into the main surface. */
  children: React.ReactNode;
  /**
   * Shell height. Defaults to `"full"`: the shell fills the entire viewport
   * edge-to-edge (the real app's layout, not a framed window) and tracks the
   * selected device viewport. Pass a pixel number to render a framed, bordered
   * box instead — used for small catalog demos.
   */
  height?: number | "full";
  className?: string;
}

/** A greyed placeholder block. */
function Block({ className = "" }: { className?: string }) {
  return <div className={`rounded bg-muted-foreground/15 ${className}`} />;
}

/** A greyed placeholder dot/avatar. */
function Dot({ className = "" }: { className?: string }) {
  return <div className={`rounded-full bg-muted-foreground/15 ${className}`} />;
}

/** Diagonal slash divider between header zones. */
function Slash() {
  return (
    <svg width="14" height="22" viewBox="0 0 14 22" aria-hidden className="shrink-0">
      <line
        x1="3"
        y1="19"
        x2="11"
        y2="3"
        stroke="var(--border)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A single placeholder tab pill. */
function TabPill({ active = false }: { active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md px-2.5 py-1 ${
        active ? "bg-muted" : ""
      }`}
    >
      <Dot className="h-3 w-3" />
      <Block className={`h-3 w-16 ${active ? "!bg-muted-foreground/25" : ""}`} />
      <Block className="h-2.5 w-2.5 opacity-60" />
    </div>
  );
}

/** A square app slot in the dock. */
function DockTile() {
  return <Block className="size-8 rounded-md" />;
}

/** Vertical hairline divider. */
function VRule() {
  return <div className="my-1 w-px self-stretch bg-border" />;
}

export function WorkspaceShell({
  children,
  header = true,
  tabs = true,
  commandPanel = true,
  height = "full",
  className = "",
}: WorkspaceShellProps) {
  // Full-bleed: the shell *is* the page — fills the viewport edge-to-edge with
  // no window chrome, so it tracks the selected device viewport. Numeric height
  // renders the older framed, bordered box for small catalog demos.
  const fullBleed = height === "full";
  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden bg-background text-foreground ${
        fullBleed ? "h-dvh" : "rounded-lg border border-border"
      } ${className}`}
      style={fullBleed ? undefined : { height }}
    >
      {/* Top bar */}
      {header && (
        <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-border/60 px-2.5">
          {/* Logo */}
          <Block className="size-7" />
          <Slash />
          {/* Workspace switcher chip */}
          <Dot className="size-7 !bg-muted-foreground/25" />
          <Slash />
          {/* Tabs (fill remaining width) */}
          <div className="flex min-w-0 flex-1 items-center gap-1">
            {tabs && (
              <>
                <TabPill active />
                <TabPill />
                <TabPill />
                <Block className="ml-1 size-4" />
              </>
            )}
          </div>
          {/* Right cluster */}
          <div className="flex shrink-0 items-center gap-2">
            <Dot className="size-6" />
            <Dot className="size-6" />
          </div>
        </div>
      )}

      {/* Content surface — the previewed view lands here. `@container` makes
          this a query container so views written with container queries respond
          to the surface width (which now tracks the viewport). Bottom padding
          clears the floating command panel. */}
      <div className="@container min-h-0 flex-1 overflow-auto">
        <div className={commandPanel ? "pb-28" : ""}>{children}</div>
      </div>

      {/* Command panel — floats at the bottom center. */}
      {commandPanel && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center px-4 pb-4">
          <div className="pointer-events-auto w-full max-w-3xl rounded-md border border-border bg-muted/50 p-2.5 backdrop-blur">
            {/* Composer row */}
            <div className="flex items-center gap-2 px-1 py-2">
              <Block className="h-3 w-40" />
            </div>
            {/* Dock row: [ view slots ] | [ console slots ] | [ grid ] + actions */}
            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <DockTile />
                  <DockTile />
                  <DockTile />
                </div>
                <VRule />
                <div className="flex items-center gap-1.5">
                  <DockTile />
                  <DockTile />
                </div>
                <VRule />
                <DockTile />
              </div>
              <div className="flex items-center gap-2">
                <Block className="h-7 w-16" />
                <Block className="size-8 rounded-md !bg-muted-foreground/25" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export interface WithWorkspaceShellOptions extends ShellRegions {
  /**
   * Stories whose title starts with this prefix render WITHOUT the shell — used
   * to keep the kit's own component catalog (primitives) out of the frame while
   * still framing a consumer's views. Set to `""` to frame everything.
   */
  skipTitlePrefix?: string;
}

/**
 * Storybook decorator that frames a story inside the workspace shell skeleton.
 * Pass region options to hide parts of the chrome:
 *
 *   export default {
 *     decorators: [withWorkspaceShell({ commandPanel: false })],
 *   };
 */
export function withWorkspaceShell(options: WithWorkspaceShellOptions = {}) {
  const { skipTitlePrefix = "UI Kit/", ...regions } = options;
  function WorkspaceShellDecorator(
    Story: React.ComponentType,
    context?: { title?: string }
  ) {
    if (skipTitlePrefix && context?.title?.startsWith(skipTitlePrefix)) {
      return <Story />;
    }
    return (
      <WorkspaceShell {...regions}>
        <Story />
      </WorkspaceShell>
    );
  }
  return WorkspaceShellDecorator;
}
