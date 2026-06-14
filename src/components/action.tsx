/**
 * Trigger interface.
 *
 * Authors describe an intent as a plain, serializable descriptor and drop
 * it straight onto any clickable's `onClick`. The kit does not run, fetch,
 * or interpret anything: it only defines the descriptor shape and the
 * interface a host wires an executor against.
 *
 * Build a descriptor with `handleSPARQL(...)` and hand it to a clickable:
 *
 *   <Button onClick={handleSPARQL("select ...", params)}>Run</Button>
 *
 * The host injects an executor once with `TriggerProvider`; clickables
 * read it through `useTrigger()` and call it when activated. What the
 * executor actually does is entirely the host's concern.
 */
"use client";

import * as React from "react";

/** Brand marking a value as a serializable trigger descriptor. */
const SPARQL_TRIGGER = "$$sparqlTrigger" as const;

/**
 * Plain, serializable descriptor produced by `handleSPARQL`. It carries
 * only data so it can cross a serialization boundary; the kit never
 * inspects `query` or `params`.
 */
export interface SparqlTrigger {
  readonly [SPARQL_TRIGGER]: true;
  /** The script the host's executor receives verbatim. */
  query: string;
  /** Optional plain parameters carried alongside the script. */
  params?: Record<string, unknown>;
}

/**
 * Build a serializable trigger descriptor. Pure: it returns plain data and
 * performs no work. Pass the result as a clickable's `onClick`.
 */
export function handleSPARQL(
  query: string,
  params?: Record<string, unknown>
): SparqlTrigger {
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

/** Result a host's executor resolves to. */
export interface TriggerResult {
  success: boolean;
  error?: string;
}

/**
 * Host-supplied async executor. Receives a trigger descriptor and resolves
 * to a plain result. The kit treats it as an opaque function.
 */
export type TriggerExecutor = (
  trigger: SparqlTrigger
) => Promise<TriggerResult>;

const TriggerContext = React.createContext<TriggerExecutor | null>(null);

interface TriggerProviderProps {
  /** The async executor the kit's clickables will call. */
  executor: TriggerExecutor;
  children: React.ReactNode;
}

/**
 * Provide a `TriggerExecutor` to descendant clickables. The host owns the
 * executor and whatever sits behind it.
 */
export function TriggerProvider({ executor, children }: TriggerProviderProps) {
  return (
    <TriggerContext.Provider value={executor}>
      {children}
    </TriggerContext.Provider>
  );
}

/**
 * Access the executor provided by the nearest `TriggerProvider`, or `null`
 * when none is in scope.
 */
export function useTrigger(): TriggerExecutor | null {
  return React.useContext(TriggerContext);
}
