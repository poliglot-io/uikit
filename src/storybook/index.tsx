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
