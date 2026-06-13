/**
 * Action primitives.
 *
 * On interaction, call a host-provided action handler with a plain,
 * serializable descriptor. The kit defines the handler interface plus
 * the presentational component and its pending / disabled / success /
 * error states; it does NOT implement the action itself.
 *
 * The host supplies an `ActionHandler` — an async function that takes a
 * descriptor (an opaque action identifier, an optional subject id, and a
 * plain JSON payload) and resolves to a plain result. Wire it once with
 * `ActionProvider`, or pass a `handler` prop directly. Trigger actions
 * with the `useAction` hook or the `<ActionButton>` component.
 */
"use client";

import * as React from "react";

import { Button } from "./button";
import { Spinner } from "./spinner";

/**
 * Plain, serializable description of an action to perform. The kit does
 * not interpret any field; the host's handler does.
 */
export interface ActionDescriptor {
  /** Opaque action identifier the host's handler dispatches on. */
  action: string;
  /** Optional id of the subject the action applies to. */
  subject?: string;
  /** Optional plain JSON payload carried with the action. */
  payload?: Record<string, unknown>;
}

/** Plain result returned by a handler. Shape is host-defined. */
export type ActionResult = unknown;

/**
 * Host-supplied async handler. Receives the descriptor, resolves to a
 * plain result, or rejects on failure.
 */
export type ActionHandler = (
  descriptor: ActionDescriptor,
  signal?: AbortSignal
) => Promise<ActionResult>;

const ActionHandlerContext = React.createContext<ActionHandler | null>(null);

interface ActionProviderProps {
  /** The async handler the kit's action primitives will call. */
  handler: ActionHandler;
  children: React.ReactNode;
}

/**
 * Provide an `ActionHandler` to descendant action primitives. The host
 * owns the handler and the action layer behind it.
 */
function ActionProvider({ handler, children }: ActionProviderProps) {
  return (
    <ActionHandlerContext.Provider value={handler}>
      {children}
    </ActionHandlerContext.Provider>
  );
}

/**
 * Access the handler provided by the nearest `ActionProvider`. Throws
 * when called outside a provider and no explicit handler is supplied.
 */
function useActionHandler(handler?: ActionHandler): ActionHandler {
  const fromContext = React.useContext(ActionHandlerContext);
  const resolved = handler ?? fromContext;
  if (!resolved) {
    throw new Error(
      "useAction requires an ActionHandler: wrap in <ActionProvider> or pass the `handler` option."
    );
  }
  return resolved;
}

export type ActionStatus = "idle" | "pending" | "success" | "error";

export interface UseActionOptions {
  /** Override the provided handler for this call. */
  handler?: ActionHandler;
  /** Called after a successful run with the handler's result. */
  onSuccess?: (result: ActionResult, descriptor: ActionDescriptor) => void;
  /** Called after a failed run with the error. */
  onError?: (error: Error, descriptor: ActionDescriptor) => void;
}

export interface ActionState {
  status: ActionStatus;
  error: Error | null;
  result: ActionResult;
  isPending: boolean;
  /** Invoke the handler with the given descriptor. */
  run: (descriptor: ActionDescriptor) => Promise<ActionResult>;
  /** Return status to idle, clearing any result or error. */
  reset: () => void;
}

/**
 * Invoke a host-provided action handler and track its pending / success
 * / error state. Concurrent invocations are ignored while one is in
 * flight; the in-flight request is aborted on unmount.
 */
function useAction(options: UseActionOptions = {}): ActionState {
  const { handler, onSuccess, onError } = options;
  const resolvedHandler = useActionHandler(handler);

  const [status, setStatus] = React.useState<ActionStatus>("idle");
  const [error, setError] = React.useState<Error | null>(null);
  const [result, setResult] = React.useState<ActionResult>(undefined);

  const pendingRef = React.useRef(false);
  const controllerRef = React.useRef<AbortController | null>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  const run = React.useCallback(
    async (descriptor: ActionDescriptor): Promise<ActionResult> => {
      if (pendingRef.current) return undefined;
      pendingRef.current = true;

      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus("pending");
      setError(null);

      try {
        const value = await resolvedHandler(descriptor, controller.signal);
        if (mountedRef.current && !controller.signal.aborted) {
          setResult(value);
          setStatus("success");
          onSuccess?.(value, descriptor);
        }
        return value;
      } catch (err: unknown) {
        const normalized =
          err instanceof Error ? err : new Error(String(err));
        if (mountedRef.current && !controller.signal.aborted) {
          setError(normalized);
          setStatus("error");
          onError?.(normalized, descriptor);
        }
        throw normalized;
      } finally {
        pendingRef.current = false;
      }
    },
    [resolvedHandler, onSuccess, onError]
  );

  const reset = React.useCallback(() => {
    setStatus("idle");
    setError(null);
    setResult(undefined);
  }, []);

  return {
    status,
    error,
    result,
    isPending: status === "pending",
    run,
    reset,
  };
}

export interface ActionButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick" | "onError"> {
  /** Opaque action identifier passed to the handler. */
  action: string;
  /** Optional id of the subject the action applies to. */
  subject?: string;
  /** Optional plain JSON payload carried with the action. */
  payload?: Record<string, unknown>;
  /** Override the provided handler for this button. */
  handler?: ActionHandler;
  /** Called after a successful run with the handler's result. */
  onSuccess?: (result: ActionResult, descriptor: ActionDescriptor) => void;
  /** Called after a failed run with the error. */
  onError?: (error: Error, descriptor: ActionDescriptor) => void;
  /** Show a spinner while pending. Defaults to true. */
  showPendingIndicator?: boolean;
}

/**
 * Button that dispatches an action descriptor to the host's handler on
 * click. Disables itself and (by default) shows a spinner while the
 * action is pending; reflects error state via `aria-invalid`. The host
 * owns what the action does.
 */
function ActionButton({
  action,
  subject,
  payload,
  handler,
  onSuccess,
  onError,
  showPendingIndicator = true,
  disabled,
  children,
  ...props
}: ActionButtonProps) {
  const state = useAction({ handler, onSuccess, onError });

  return (
    <Button
      data-slot="action-button"
      data-status={state.status}
      aria-busy={state.isPending || undefined}
      aria-invalid={state.status === "error" || undefined}
      disabled={disabled || state.isPending}
      onClick={() => {
        void state.run({ action, subject, payload }).catch(() => {
          // Error surfaced via state / onError; swallow to avoid
          // unhandled rejection on the click handler.
        });
      }}
      {...props}
    >
      {showPendingIndicator && state.isPending && (
        <Spinner className="size-4" />
      )}
      {children}
    </Button>
  );
}

export {
  ActionButton,
  ActionProvider,
  useAction,
  useActionHandler,
};
