/**
 * Mock `useQuery` for previews.
 *
 * Some components fetch data by awaiting a host-provided global
 * `useQuery(sparql)` (often `Promise.all`-ing several). A preview has no host,
 * so this installs a stand-in `globalThis.useQuery` that resolves to per-story
 * fixtures — letting a story exercise a component's real query calls. Pair it
 * with `RscPreview` to render an async component that uses it.
 */

import * as React from "react";

export interface MockQueryOptions {
  /**
   * Resolve a query to its fixture result. Receives the verbatim query string
   * the component passed; return the data (or a promise of it). Defaults to
   * `null`.
   */
  resolve?: (sparql: string) => unknown | Promise<unknown>;
  /** Delay (ms) before resolving, to preview the loading state. */
  delayMs?: number;
}

/** Build a stand-in `useQuery` implementation. */
export function createMockQuery(
  options: MockQueryOptions = {}
): (sparql: string) => Promise<unknown> {
  const { resolve, delayMs = 0 } = options;
  return async (sparql: string) => {
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    return resolve ? resolve(sparql) : null;
  };
}

/**
 * Storybook decorator that installs a mock `globalThis.useQuery` for the story,
 * so a component's `useQuery(...)` calls resolve to fixtures.
 *
 *   export default {
 *     decorators: [withMockQuery({ resolve: sparql => ({ ... }) })],
 *   };
 */
export function withMockQuery(options: MockQueryOptions = {}) {
  function MockQueryDecorator(Story: React.ComponentType) {
    globalThis.useQuery = createMockQuery(options);
    return <Story />;
  }
  return MockQueryDecorator;
}
