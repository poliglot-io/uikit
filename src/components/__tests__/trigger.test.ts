/**
 * Pure trigger-descriptor module. These exports carry no React and no
 * hooks, so they are imported directly from `../trigger.js` (not from the
 * `"use client"` `../action.js` re-export) to prove they stand on their own
 * as server-safe data.
 */
import { describe, it, expect } from "vitest";

import {
  handleSPARQL,
  isSparqlTrigger,
  type SparqlTriggerRef,
} from "../trigger.js";

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

  it("recognizes the serialized reference shape", () => {
    const ref: SparqlTriggerRef = { $$sparqlTrigger: true, ref: "abc123" };
    expect(isSparqlTrigger(ref)).toBe(true);
  });

  it("narrows the union by the brand key, not by payload", () => {
    // The guard keys off the marker alone, so a value carrying only `ref`
    // (no `query`) is still accepted and narrowed to the reference shape.
    const value: unknown = { $$sparqlTrigger: true, ref: "token" };
    expect(isSparqlTrigger(value)).toBe(true);
    if (isSparqlTrigger(value)) {
      const ref = value as SparqlTriggerRef;
      expect(ref.ref).toBe("token");
    }
  });

  it("rejects plain functions and other values", () => {
    expect(isSparqlTrigger(() => {})).toBe(false);
    expect(isSparqlTrigger(null)).toBe(false);
    expect(isSparqlTrigger({})).toBe(false);
    expect(isSparqlTrigger("select 1")).toBe(false);
  });
});
