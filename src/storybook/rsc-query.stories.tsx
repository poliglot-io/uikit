import type { Meta, StoryObj } from "@storybook/react-vite";
import { withMockQuery } from "./query-mock";
import { RscPreview } from "./rsc-preview";

interface Row {
  id: string;
  label: string;
}

/**
 * A stand-in for an async component that fetches related rows via the global
 * `useQuery`, then renders them. Exercises the async-component + mock-query
 * path end-to-end in a story.
 */
async function QueryDemo() {
  const rows = (await useQuery(
    "SELECT ?id ?label WHERE { ?id rdfs:label ?label } LIMIT 5"
  )) as Row[];
  return (
    <div className="w-80 rounded-lg border border-border p-4">
      <h1 className="mb-2 text-sm font-semibold">Sub-items (via useQuery)</h1>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {rows.map(r => (
          <li key={r.id}>{r.label}</li>
        ))}
      </ul>
    </div>
  );
}

const meta: Meta = {
  title: "Preview/RSC useQuery",
  parameters: { layout: "centered" },
  decorators: [
    withMockQuery({
      delayMs: 300,
      resolve: () => [
        { id: "1", label: "Reconcile batch A" },
        { id: "2", label: "Reconcile batch B" },
        { id: "3", label: "Post variance summary" },
      ],
    }),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => <RscPreview render={() => QueryDemo()} />,
};
