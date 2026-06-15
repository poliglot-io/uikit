/**
 * @vitest-environment jsdom
 *
 * Client trigger wiring: the React context, provider, and hook. The pure
 * descriptor builder/guard are covered in `trigger.test.ts`; here we use
 * `handleSPARQL` only to feed the provider plumbing.
 */
import { describe, it, expect, vi } from "vitest";
import { render, renderHook } from "@testing-library/react";

import {
  TriggerProvider,
  useTrigger,
  type TriggerExecutor,
} from "../action.js";
import { handleSPARQL } from "../trigger.js";

describe("TriggerProvider / useTrigger", () => {
  it("returns null outside a provider", () => {
    const { result } = renderHook(() => useTrigger());
    expect(result.current).toBeNull();
  });

  it("exposes the executor from the nearest provider", () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const { result } = renderHook(() => useTrigger(), {
      wrapper: ({ children }) => (
        <TriggerProvider executor={executor}>{children}</TriggerProvider>
      ),
    });
    expect(result.current).toBe(executor);
  });

  it("passes a descriptor through to the executor unchanged", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    const { result } = renderHook(() => useTrigger(), {
      wrapper: ({ children }) => (
        <TriggerProvider executor={executor}>{children}</TriggerProvider>
      ),
    });
    await result.current?.(trigger);
    expect(executor).toHaveBeenCalledWith(trigger);
  });

  it("renders its children", () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const { getByText } = render(
      <TriggerProvider executor={executor}>
        <span>child</span>
      </TriggerProvider>
    );
    expect(getByText("child")).toBeInTheDocument();
  });
});
