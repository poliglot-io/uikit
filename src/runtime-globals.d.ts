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
   * Run a query and resolve to its result. The result is the JSON the query
   * produced, returned verbatim; pass the expected shape as the type argument
   * to get a typed result, e.g. `await useQuery<Issue[]>(query)`. The host
   * provides it at render time; in previews, `withMockQuery` installs a
   * stand-in.
   */
  var useQuery: <T = unknown>(query: string) => Promise<T>;
}
