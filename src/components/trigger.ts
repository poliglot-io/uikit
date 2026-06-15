/**
 * Trigger descriptor: the pure, server-safe core of the trigger interface.
 *
 * Authors describe an intent as a plain, serializable descriptor and drop
 * it straight onto any clickable's `onClick`. This module defines only the
 * descriptor shape and the builder/guard for it: pure data, no React, no
 * hooks, so it is safe to call from a server-rendered component.
 *
 *   <Button onClick={handleSPARQL("select ...", params)}>Run</Button>
 *
 * The React context, hooks, and provider that wire a host executor against
 * these descriptors live in the companion client module (`./action`).
 */

import type * as React from "react";

/** Brand marking a value as a serializable trigger descriptor. */
const SPARQL_TRIGGER = "$$sparqlTrigger" as const;

/**
 * Author shape produced by `handleSPARQL`: a script plus optional plain
 * parameters. Carries only data so it can cross a serialization boundary;
 * the kit never inspects `query` or `params`.
 */
export interface SparqlTriggerQuery {
  readonly [SPARQL_TRIGGER]: true;
  /** The script the host's executor receives verbatim. */
  query: string;
  /** Optional plain parameters carried alongside the script. */
  params?: Record<string, unknown>;
}

/**
 * Serialized shape: an opaque reference standing in for a descriptor whose
 * payload has been resolved away by a host. The kit treats `ref` as an
 * opaque token and never interprets it.
 */
export interface SparqlTriggerRef {
  readonly [SPARQL_TRIGGER]: true;
  /** Opaque reference a host resolves back to a runnable descriptor. */
  ref: string;
}

/**
 * Plain, serializable trigger descriptor: either the author shape
 * (`query` + optional `params`) or the serialized reference shape (`ref`).
 * Both are marked by the same brand key so `isSparqlTrigger` recognizes
 * either.
 */
export type SparqlTrigger = SparqlTriggerQuery | SparqlTriggerRef;

/**
 * Build a serializable trigger descriptor. Pure: it returns plain data and
 * performs no work. Pass the result as a clickable's `onClick`.
 */
export function handleSPARQL(
  query: string,
  params?: Record<string, unknown>
): SparqlTriggerQuery {
  return { [SPARQL_TRIGGER]: true, query, params };
}

/** Narrow an `onClick` value to a `SparqlTrigger` descriptor. */
export function isSparqlTrigger(value: unknown): value is SparqlTrigger {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as Record<string, unknown>)[SPARQL_TRIGGER] === true
  );
}

/**
 * An `onClick` value any interactive primitive accepts: either a normal
 * React click handler or a serializable `SparqlTrigger` descriptor.
 */
export type ClickableHandler<E extends Element = Element> =
  | React.MouseEventHandler<E>
  | SparqlTrigger;
