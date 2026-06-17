/**
 * Preview helpers for component authors.
 *
 * These tools render a view the way it appears in a real application: framed
 * by a skeleton of the surrounding chrome, with a stand-in executor wired up
 * so interactive triggers resolve. Use them as Storybook decorators or as
 * plain wrapper components.
 */

export {
  WorkspaceShell,
  withWorkspaceShell,
  type WorkspaceShellProps,
  type ShellRegions,
} from "./workspace-shell";

export {
  MockTriggerProvider,
  withMockTrigger,
  createMockExecutor,
  type MockTriggerOptions,
  type MockTriggerProviderProps,
} from "./trigger-mock";

export {
  withMockQuery,
  createMockQuery,
  type MockQueryOptions,
} from "./query-mock";

export { RscPreview, type RscPreviewProps } from "./rsc-preview";

// NOTE: `defineMain` is intentionally NOT re-exported here. It pulls in the
// server-only `@tailwindcss/vite` plugin; this barrel is imported by the
// browser-side preview, so it must stay browser-safe. Import `defineMain` from
// the dedicated `@poliglot-io/uikit/storybook/preset` subpath (Node side only).
export { themeDecorator, baseParameters } from "./preview-config";
