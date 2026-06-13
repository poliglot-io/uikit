/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import {
  Query,
  QueryProvider,
  QueryTable,
  useQueryExecutor,
  type QueryExecutor,
} from "../query.js";

function makeExecutor(rows: Record<string, unknown>[]): QueryExecutor {
  return vi.fn(async () => rows);
}

describe("QueryProvider / useQueryExecutor", () => {
  it("throws when no executor is provided", () => {
    // Render a component that calls the hook with no provider/option.
    function Probe() {
      useQueryExecutor();
      return null;
    }
    // The hook throws synchronously during render.
    expect(() => render(<Probe />)).toThrow(/QueryExecutor/);
  });

  it("prefers an explicit executor over the provided one", () => {
    const provided = makeExecutor([]);
    const explicit = makeExecutor([]);
    let resolved: QueryExecutor | null = null;
    function Probe() {
      resolved = useQueryExecutor(explicit);
      return null;
    }
    render(
      <QueryProvider executor={provided}>
        <Probe />
      </QueryProvider>
    );
    expect(resolved).toBe(explicit);
  });
});

describe("Query (render prop)", () => {
  it("shows a loading view, then renders resolved rows", async () => {
    const executor = makeExecutor([{ id: "1", name: "Alpha" }]);
    render(
      <QueryProvider executor={executor}>
        <Query query="opaque-query">
          {(state) => (
            <ul>
              {state.data.map((row) => (
                <li key={String(row.id)}>{String(row.name)}</li>
              ))}
            </ul>
          )}
        </Query>
      </QueryProvider>
    );

    // Loading indicator first.
    expect(screen.getByRole("status")).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Alpha")).toBeInTheDocument()
    );
    expect(executor).toHaveBeenCalledWith(
      "opaque-query",
      undefined,
      expect.any(AbortSignal)
    );
  });

  it("renders an error state when the executor rejects", async () => {
    const executor: QueryExecutor = vi.fn(async () => {
      throw new Error("boom");
    });
    render(
      <Query query="q" executor={executor}>
        {() => <div>should not render</div>}
      </Query>
    );

    await waitFor(() =>
      expect(screen.getByText("Unable to load data")).toBeInTheDocument()
    );
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("forwards plain params to the executor", async () => {
    const executor = makeExecutor([]);
    render(
      <Query query="q" executor={executor} params={{ limit: 10 }}>
        {() => <div>done</div>}
      </Query>
    );
    await waitFor(() =>
      expect(executor).toHaveBeenCalledWith(
        "q",
        { limit: 10 },
        expect.any(AbortSignal)
      )
    );
  });
});

describe("QueryTable", () => {
  const columns = [
    { key: "name" as const, header: "Name" },
    { key: "role" as const, header: "Role" },
  ];

  it("renders headers and a row per result", async () => {
    const executor = makeExecutor([
      { name: "Alpha", role: "lead" },
      { name: "Beta", role: "member" },
    ]);
    render(
      <QueryTable query="q" executor={executor} columns={columns} />
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Alpha")).toBeInTheDocument()
    );
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("member")).toBeInTheDocument();
  });

  it("renders an empty state when there are no rows", async () => {
    const executor = makeExecutor([]);
    render(
      <QueryTable
        query="q"
        executor={executor}
        columns={columns}
        emptyTitle="Nothing here"
      />
    );
    await waitFor(() =>
      expect(screen.getByText("Nothing here")).toBeInTheDocument()
    );
  });

  it("uses a custom cell renderer when supplied", async () => {
    const executor = makeExecutor([{ name: "Alpha", role: "lead" }]);
    render(
      <QueryTable
        query="q"
        executor={executor}
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => <strong>{String(row.name).toUpperCase()}</strong>,
          },
        ]}
      />
    );
    await waitFor(() =>
      expect(screen.getByText("ALPHA")).toBeInTheDocument()
    );
  });
});
