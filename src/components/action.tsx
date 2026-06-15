/**
 * Trigger interface: the React wiring around the pure trigger descriptor.
 *
 * Authors build a descriptor with `handleSPARQL(...)` (from the pure
 * `./trigger` module) and drop it onto any clickable's `onClick`:
 *
 *   <Button onClick={handleSPARQL("select ...", params)}>Run</Button>
 *
 * The host injects an executor once with `TriggerProvider`; clickables
 * read it through `useTrigger()` and route their `onClick` through
 * `useResolvedClick`, which calls the executor when a descriptor is
 * activated. What the executor actually does is entirely the host's
 * concern. The descriptor shape, builder, and guard are pure data and
 * live in `./trigger` so they stay callable from server-rendered code.
 */
"use client";

import * as React from "react";

import {
  isSparqlTrigger,
  type ClickableHandler,
  type SparqlTrigger,
} from "./trigger";

// Re-export ONLY the pure type surface so existing `type`-imports from
// `./action` keep resolving. Types are erased at compile time and emit no
// value export, so they never collide with the server module's exports. The
// value exports (`handleSPARQL`, `isSparqlTrigger`) are NOT re-exported here;
// consumers reach them through `./trigger` (or the package barrel).
export type {
  SparqlTrigger,
  SparqlTriggerQuery,
  SparqlTriggerRef,
  ClickableHandler,
} from "./trigger";

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

/** What `useResolvedClick` returns: a real handler plus pending state. */
export interface ResolvedClick<E extends Element = Element> {
  /** A real click handler to spread onto the element (or `undefined`). */
  onClick: React.MouseEventHandler<E> | undefined;
  /** True while a trigger's executor is in flight; otherwise false. */
  pending: boolean;
}

/**
 * Single source of truth that lets ANY interactive primitive accept a
 * `SparqlTrigger` on its `onClick`. Route every clickable's `onClick`
 * through this hook so a trigger works uniformly across the kit and new
 * components inherit the behavior for free.
 *
 *   const { onClick, pending } = useResolvedClick(onClickProp);
 *   return <El onClick={onClick} aria-busy={pending || undefined} ... />;
 *
 * Behavior:
 * - Given a `SparqlTrigger`: returns a handler that, on click, hands the
 *   descriptor to the executor from the nearest `TriggerProvider`, exposing
 *   `pending` while it is in flight and ignoring re-clicks until it settles.
 *   With no executor in scope, clicking is a safe no-op.
 * - Given a normal handler: passes it through unchanged, `pending` stays
 *   false.
 * - Given `undefined`: returns `undefined`, `pending` stays false.
 */
export function useResolvedClick<E extends Element = Element>(
  onClick: ClickableHandler<E> | undefined
): ResolvedClick<E> {
  const executor = useTrigger();
  const [pending, setPending] = React.useState(false);

  if (!isSparqlTrigger(onClick)) {
    return { onClick: onClick, pending: false };
  }

  const handle: React.MouseEventHandler<E> = () => {
    if (!executor || pending) return;
    setPending(true);
    void executor(onClick).finally(() => setPending(false));
  };
  return { onClick: handle, pending };
}
