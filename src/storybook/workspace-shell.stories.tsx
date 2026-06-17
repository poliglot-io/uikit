import type { Meta, StoryObj } from "@storybook/react-vite";
import { WorkspaceShell } from "./workspace-shell";
import { withMockTrigger } from "./trigger-mock";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Separator } from "../components/separator";
import { handleSPARQL } from "../components/trigger";

/**
 * A stand-in for an author's view: a resource with a title, status, a few
 * fields, and actions wired through `handleSPARQL`. Used only to show how a
 * view reads inside the shell.
 */
function DemoView() {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-mono">REC-128</span>
        <span>·</span>
        <span>opened 3 days ago</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Reconcile the weekly settlement batch
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">In progress</Badge>
        <Badge variant="secondary">High</Badge>
        <Badge variant="secondary">finance</Badge>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={handleSPARQL("SELECT ?s WHERE { ?s ?p ?o } LIMIT 1")}
        >
          Mark done
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSPARQL("SELECT ?s WHERE { ?s ?p ?o } LIMIT 1")}
        >
          Assign to me
        </Button>
        <Button size="sm" variant="ghost">
          Open original
        </Button>
      </div>

      <Separator className="my-6" />

      <div className="grid gap-8 sm:grid-cols-[1fr_180px]">
        <section>
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Description
          </h2>
          <p className="text-sm leading-relaxed">
            Match each settlement line against the ledger, flag any variance
            over the threshold, and post the summary back to the channel. The
            actions above run as the view&apos;s owner.
          </p>
        </section>
        <aside className="space-y-4 text-sm">
          <Field label="Assignee" value="Unassigned" />
          <Field label="Team" value="Payments" />
          <Field label="Due" value="Friday" />
          <Field label="Estimate" value="3 pts" />
        </aside>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}

const meta = {
  title: "Preview/Workspace Shell",
  component: WorkspaceShell,
  parameters: { layout: "fullscreen" },
  decorators: [withMockTrigger()],
} satisfies Meta<typeof WorkspaceShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The full-page app layout: header + control panel filling the viewport, a
 *  view in the surface. Switch the toolbar viewport to watch it reflow. */
export const InContext: Story = {
  render: () => (
    <WorkspaceShell>
      <DemoView />
    </WorkspaceShell>
  ),
};

/** Just the view surface — chrome hidden. A small framed box for gauging the
 *  view in isolation. */
export const BareSurface: Story = {
  render: () => (
    <div className="p-6">
      <WorkspaceShell header={false} commandPanel={false} height={520}>
        <DemoView />
      </WorkspaceShell>
    </div>
  ),
};

/** The full-page shell with an empty surface, to gauge proportions. */
export const Empty: Story = {
  render: () => (
    <WorkspaceShell>
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        View surface
      </div>
    </WorkspaceShell>
  ),
};
