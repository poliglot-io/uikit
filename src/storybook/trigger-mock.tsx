/**
 * Mock trigger executor for previews.
 *
 * Clickables accept a `handleSPARQL(...)` descriptor on their `onClick` and
 * hand it to the executor from the nearest `TriggerProvider`. In a real app
 * the host supplies that executor; in a preview there is no host, so this
 * module provides a stand-in that simply logs the descriptor and resolves
 * after a short delay — long enough to show a clickable's pending state.
 */

import * as React from "react";
import {
  TriggerProvider,
  type TriggerExecutor,
  type TriggerResult,
} from "../components/action";

export interface MockTriggerOptions {
  /** Delay (ms) before resolving, so pending state is visible. */
  delayMs?: number;
  /** Resolve as a failure, to preview error handling. */
  fail?: boolean;
  /** Invoked with the descriptor each time a trigger fires. */
  onTrigger?: (descriptor: unknown) => void;
}

/** Build a stand-in executor that logs and resolves. */
export function createMockExecutor(
  options: MockTriggerOptions = {}
): TriggerExecutor {
  const { delayMs = 600, fail = false, onTrigger } = options;
  return async trigger => {
    onTrigger?.(trigger);
    // eslint-disable-next-line no-console
    console.log("[preview trigger]", trigger);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    const result: TriggerResult = fail
      ? { success: false, error: "Preview executor: simulated failure" }
      : { success: true };
    return result;
  };
}

export interface MockTriggerProviderProps extends MockTriggerOptions {
  children: React.ReactNode;
}

/** Provide the stand-in executor to descendant clickables. */
export function MockTriggerProvider({
  children,
  delayMs,
  fail,
  onTrigger,
}: MockTriggerProviderProps) {
  const executor = React.useMemo(
    () => createMockExecutor({ delayMs, fail, onTrigger }),
    [delayMs, fail, onTrigger]
  );
  return <TriggerProvider executor={executor}>{children}</TriggerProvider>;
}

/**
 * Storybook decorator that wraps a story in the mock trigger provider, so
 * `handleSPARQL(...)` clickables resolve in previews.
 *
 *   export default { decorators: [withMockTrigger()] };
 */
export function withMockTrigger(options: MockTriggerOptions = {}) {
  function MockTriggerDecorator(Story: React.ComponentType) {
    return (
      <MockTriggerProvider {...options}>
        <Story />
      </MockTriggerProvider>
    );
  }
  return MockTriggerDecorator;
}
