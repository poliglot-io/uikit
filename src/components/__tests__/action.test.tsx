/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, renderHook } from "@testing-library/react";

import {
  handleSPARQL,
  isSparqlTrigger,
  TriggerProvider,
  useTrigger,
  type TriggerExecutor,
} from "../action.js";

describe("handleSPARQL", () => {
  it("returns a plain, serializable descriptor", () => {
    const trigger = handleSPARQL("select ?s where { ?s ?p ?o }", { limit: 10 });
    expect(trigger).toEqual({
      $$sparqlTrigger: true,
      query: "select ?s where { ?s ?p ?o }",
      params: { limit: 10 },
    });
    // Survives a serialization round-trip with no loss.
    expect(JSON.parse(JSON.stringify(trigger))).toEqual(trigger);
  });

  it("omits params when none are given", () => {
    const trigger = handleSPARQL("select ?s where { ?s ?p ?o }");
    expect(trigger.params).toBeUndefined();
  });
});

describe("isSparqlTrigger", () => {
  it("recognizes descriptors built by handleSPARQL", () => {
    expect(isSparqlTrigger(handleSPARQL("select 1"))).toBe(true);
  });

  it("rejects plain functions and other values", () => {
    expect(isSparqlTrigger(() => {})).toBe(false);
    expect(isSparqlTrigger(null)).toBe(false);
    expect(isSparqlTrigger({})).toBe(false);
    expect(isSparqlTrigger("select 1")).toBe(false);
  });
});

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
