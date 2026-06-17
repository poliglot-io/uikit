"use client";

/**
 * Render an async component's output client-side for previews.
 *
 * Some components are async — plain async functions that return JSX after
 * awaiting data (e.g. via a host-provided `useQuery`). Storybook renders on the
 * client, where React can't render an async component directly. As long as the
 * function uses no client-incompatible APIs, a story can just *call* it and read
 * the resulting promise with `use()` under a Suspense boundary, paired with
 * `withMockQuery` to satisfy the data calls.
 *
 *   render: () => <RscPreview render={() => MyView(args)} />
 */

import * as React from "react";

function RscInner({ promise }: { promise: Promise<React.ReactNode> }) {
  return <>{React.use(promise)}</>;
}

export interface RscPreviewProps {
  /** Calls the async component and returns its rendered output. */
  render: () => Promise<React.ReactNode>;
  /** Shown while the component's data resolves. */
  fallback?: React.ReactNode;
}

export function RscPreview({ render, fallback }: RscPreviewProps) {
  // Hold the promise in THIS component's state. RscPreview never suspends (only
  // its child does), so the state commits and the promise is stable across the
  // child's suspend/retry — otherwise `use()` would re-create it and loop.
  const [promise] = React.useState(render);
  return (
    <React.Suspense
      fallback={
        fallback ?? (
          <div className="p-6 text-sm text-muted-foreground">Loading…</div>
        )
      }
    >
      <RscInner promise={promise} />
    </React.Suspense>
  );
}
