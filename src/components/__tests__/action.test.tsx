/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";

import {
  ActionButton,
  ActionProvider,
  useActionHandler,
  type ActionHandler,
} from "../action.js";

describe("ActionProvider / useActionHandler", () => {
  it("throws when no handler is provided", () => {
    function Probe() {
      useActionHandler();
      return null;
    }
    expect(() => render(<Probe />)).toThrow(/ActionHandler/);
  });

  it("prefers an explicit handler over the provided one", () => {
    const provided: ActionHandler = vi.fn(async () => undefined);
    const explicit: ActionHandler = vi.fn(async () => undefined);
    let resolved: ActionHandler | null = null;
    function Probe() {
      resolved = useActionHandler(explicit);
      return null;
    }
    render(
      <ActionProvider handler={provided}>
        <Probe />
      </ActionProvider>
    );
    expect(resolved).toBe(explicit);
  });
});

describe("ActionButton", () => {
  it("calls the handler with a serializable descriptor on click", async () => {
    const handler: ActionHandler = vi.fn(async () => ({ ok: true }));
    render(
      <ActionProvider handler={handler}>
        <ActionButton action="publish" subject="entry-1" payload={{ note: "x" }}>
          Publish
        </ActionButton>
      </ActionProvider>
    );

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() =>
      expect(handler).toHaveBeenCalledWith(
        { action: "publish", subject: "entry-1", payload: { note: "x" } },
        expect.any(AbortSignal)
      )
    );
  });

  it("disables and marks busy while pending, then succeeds", async () => {
    let resolveFn: ((v: unknown) => void) | undefined;
    const handler: ActionHandler = vi.fn(
      () => new Promise((resolve) => (resolveFn = resolve))
    );
    render(
      <ActionButton action="run" handler={handler}>
        Run
      </ActionButton>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("data-status", "pending");

    resolveFn?.({});
    await waitFor(() =>
      expect(button).toHaveAttribute("data-status", "success")
    );
    expect(button).not.toBeDisabled();
  });

  it("reflects an error state when the handler rejects", async () => {
    const handler: ActionHandler = vi.fn(async () => {
      throw new Error("nope");
    });
    const onError = vi.fn();
    render(
      <ActionButton action="run" handler={handler} onError={onError}>
        Run
      </ActionButton>
    );

    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() =>
      expect(button).toHaveAttribute("data-status", "error")
    );
    expect(button).toHaveAttribute("aria-invalid", "true");
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ action: "run" })
    );
  });

  it("ignores concurrent clicks while a run is in flight", async () => {
    let resolveFn: ((v: unknown) => void) | undefined;
    const handler: ActionHandler = vi.fn(
      () => new Promise((resolve) => (resolveFn = resolve))
    );
    render(
      <ActionButton action="run" handler={handler}>
        Run
      </ActionButton>
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));
    resolveFn?.({});
  });
});
