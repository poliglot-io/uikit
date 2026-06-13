/**
 * Query-backed data primitives.
 *
 * Render the result of a host-provided async query function. The kit
 * defines the executor interface plus the presentational rendering and
 * loading / empty / error states; it does NOT fetch data itself.
 *
 * The host supplies a `QueryExecutor` — an async function that takes an
 * opaque query string (plus optional plain parameters) and resolves to
 * an array of rows. Wire it once with `QueryProvider`, or pass an
 * `executor` prop directly. Consume results with the `useQuery` hook,
 * the `<Query>` render-prop wrapper, or the `<QueryTable>` component.
 *
 * The query string is opaque to the kit: the host decides what dialect
 * or shape it accepts. Rows are plain serializable records.
 */
"use client";

import * as React from "react";

import { cn } from "../lib/utils";
import { Empty } from "./empty";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

/** A single result record. Keys are column names; values are plain. */
export type QueryRow = Record<string, unknown>;

/** Optional plain parameters passed alongside the query string. */
export type QueryParams = Record<string, unknown>;

/**
 * Host-supplied async executor. Receives the opaque query string and
 * optional plain parameters, resolves to an array of rows. The kit
 * never interprets the query; the host does.
 */
export type QueryExecutor<TRow extends QueryRow = QueryRow> = (
  query: string,
  params?: QueryParams,
  signal?: AbortSignal
) => Promise<TRow[]>;

const QueryExecutorContext = React.createContext<QueryExecutor | null>(null);

interface QueryProviderProps {
  /** The async executor the kit's query primitives will call. */
  executor: QueryExecutor;
  children: React.ReactNode;
}

/**
 * Provide a `QueryExecutor` to descendant query primitives. The host
 * owns the executor and the data layer behind it.
 */
function QueryProvider({ executor, children }: QueryProviderProps) {
  return (
    <QueryExecutorContext.Provider value={executor as QueryExecutor}>
      {children}
    </QueryExecutorContext.Provider>
  );
}

/**
 * Access the executor provided by the nearest `QueryProvider`. Throws
 * when called outside a provider and no explicit executor is supplied.
 */
function useQueryExecutor<TRow extends QueryRow = QueryRow>(
  executor?: QueryExecutor<TRow>
): QueryExecutor<TRow> {
  const fromContext = React.useContext(QueryExecutorContext);
  const resolved = (executor ?? fromContext) as QueryExecutor<TRow> | null;
  if (!resolved) {
    throw new Error(
      "useQuery requires a QueryExecutor: wrap in <QueryProvider> or pass the `executor` option."
    );
  }
  return resolved;
}

export type QueryStatus = "idle" | "loading" | "success" | "error";

export interface QueryState<TRow extends QueryRow = QueryRow> {
  status: QueryStatus;
  data: TRow[];
  error: Error | null;
  isLoading: boolean;
  /** Re-run the query, discarding any in-flight request. */
  refetch: () => void;
}

export interface UseQueryOptions<TRow extends QueryRow = QueryRow> {
  /** Plain parameters forwarded to the executor. */
  params?: QueryParams;
  /** Override the provided executor for this call. */
  executor?: QueryExecutor<TRow>;
  /** Skip execution until true. Defaults to true. */
  enabled?: boolean;
}

/**
 * Run a host-provided query and track its loading / success / error
 * state. In-flight requests are aborted when inputs change or the
 * consumer unmounts.
 */
function useQuery<TRow extends QueryRow = QueryRow>(
  query: string,
  options: UseQueryOptions<TRow> = {}
): QueryState<TRow> {
  const { params, executor, enabled = true } = options;
  const resolvedExecutor = useQueryExecutor<TRow>(executor);

  const [status, setStatus] = React.useState<QueryStatus>("idle");
  const [data, setData] = React.useState<TRow[]>([]);
  const [error, setError] = React.useState<Error | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  // Serialize params so the effect re-runs on value change, not identity.
  const paramsKey = React.useMemo(
    () => (params ? JSON.stringify(params) : ""),
    [params]
  );

  React.useEffect(() => {
    if (!enabled) {
      setStatus("idle");
      return;
    }

    const controller = new AbortController();
    let active = true;
    setStatus("loading");
    setError(null);

    resolvedExecutor(query, params, controller.signal)
      .then((rows) => {
        if (!active) return;
        setData(rows);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (!active || controller.signal.aborted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus("error");
      });

    return () => {
      active = false;
      controller.abort();
    };
    // paramsKey stands in for params by value; resolvedExecutor is stable
    // per provider but included for correctness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, paramsKey, enabled, reloadToken, resolvedExecutor]);

  const refetch = React.useCallback(() => setReloadToken((n) => n + 1), []);

  return {
    status,
    data,
    error,
    isLoading: status === "loading",
    refetch,
  };
}

export interface QueryProps<TRow extends QueryRow = QueryRow> {
  /** Opaque query string the host's executor interprets. */
  query: string;
  /** Plain parameters forwarded to the executor. */
  params?: QueryParams;
  /** Override the provided executor for this instance. */
  executor?: QueryExecutor<TRow>;
  /** Skip execution until true. */
  enabled?: boolean;
  /** Render the loaded rows. */
  children: (state: QueryState<TRow>) => React.ReactNode;
  /** Optional custom loading view. Defaults to a spinner. */
  loading?: React.ReactNode;
  /** Optional custom error view. Receives the error. */
  error?: (error: Error, refetch: () => void) => React.ReactNode;
}

/**
 * Render-prop wrapper around `useQuery`. Shows a loading view while the
 * query runs and an error view on failure; otherwise calls `children`
 * with the resolved state.
 */
function Query<TRow extends QueryRow = QueryRow>({
  query,
  params,
  executor,
  enabled,
  children,
  loading,
  error,
}: QueryProps<TRow>) {
  const state = useQuery<TRow>(query, { params, executor, enabled });

  if (state.isLoading || state.status === "idle") {
    return (
      <div data-slot="query-loading">
        {loading ?? (
          <div className="flex items-center justify-center py-12">
            <Spinner className="size-6" />
          </div>
        )}
      </div>
    );
  }

  if (state.status === "error" && state.error) {
    return (
      <div data-slot="query-error">
        {error ? (
          error(state.error, state.refetch)
        ) : (
          <Empty
            title="Unable to load data"
            description={state.error.message}
          />
        )}
      </div>
    );
  }

  return <>{children(state)}</>;
}

export interface QueryColumn<TRow extends QueryRow = QueryRow> {
  /** Row key to read. */
  key: keyof TRow & string;
  /** Column header text. */
  header: string;
  /** Optional custom cell renderer. */
  cell?: (row: TRow) => React.ReactNode;
}

export interface QueryTableProps<TRow extends QueryRow = QueryRow>
  extends Omit<QueryProps<TRow>, "children" | "error"> {
  /** Column definitions. */
  columns: QueryColumn<TRow>[];
  /** Empty-state title when the query returns no rows. */
  emptyTitle?: string;
  /** Empty-state description. */
  emptyDescription?: string;
  /** Extra classes for the table element. */
  className?: string;
}

function defaultCell(value: unknown): React.ReactNode {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Presentational table driven by `useQuery`. Renders skeleton rows
 * while loading, an empty state when there are no rows, and an error
 * state on failure. The host supplies the executor and column shape.
 */
function QueryTable<TRow extends QueryRow = QueryRow>({
  columns,
  emptyTitle = "No results",
  emptyDescription,
  className,
  ...queryProps
}: QueryTableProps<TRow>) {
  const state = useQuery<TRow>(queryProps.query, {
    params: queryProps.params,
    executor: queryProps.executor,
    enabled: queryProps.enabled,
  });

  const header = (
    <TableHeader>
      <TableRow>
        {columns.map((col) => (
          <TableHead key={col.key}>{col.header}</TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  if (state.isLoading || state.status === "idle") {
    return (
      <Table className={className} data-slot="query-table">
        {header}
        <TableBody>
          {Array.from({ length: 3 }).map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {columns.map((col) => (
                <TableCell key={col.key}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (state.status === "error" && state.error) {
    return (
      <Empty
        data-slot="query-table-error"
        title="Unable to load data"
        description={state.error.message}
      />
    );
  }

  if (state.data.length === 0) {
    return (
      <Empty
        data-slot="query-table-empty"
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <Table className={cn(className)} data-slot="query-table">
      {header}
      <TableBody>
        {state.data.map((row, rowIdx) => (
          <TableRow key={rowIdx}>
            {columns.map((col) => (
              <TableCell key={col.key}>
                {col.cell ? col.cell(row) : defaultCell(row[col.key])}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export {
  Query,
  QueryProvider,
  QueryTable,
  useQuery,
  useQueryExecutor,
};
