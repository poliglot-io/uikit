/**
 * Ambient globals available to components at render time.
 *
 * Reference from a consuming project to type the global `useQuery` without an
 * import, e.g. in a `globals.d.ts`:
 *
 *   /// <reference types="@poliglot-io/uikit/globals" />
 */

export {};

declare global {
  /**
   * Run a query and resolve to its result. The host provides it at render
   * time; in previews, `withMockQuery` installs a stand-in.
   */
  var useQuery: (sparql: string) => Promise<unknown>;
}
