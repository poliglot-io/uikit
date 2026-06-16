import type { Meta, StoryObj } from "@storybook/react";
import { ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./collapsible";
import { Button } from "./button";

const meta = {
  title: "Components/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Collapsible {...args} className="w-72 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium">Recent activity</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon">
            <ChevronsUpDown className="size-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="border rounded-md px-3 py-2 text-sm">First item</div>
      <CollapsibleContent className="space-y-2">
        <div className="border rounded-md px-3 py-2 text-sm">Second item</div>
        <div className="border rounded-md px-3 py-2 text-sm">Third item</div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

export const Open: Story = {
  args: { defaultOpen: true },
  render: (args) => (
    <Collapsible {...args} className="w-72 space-y-2">
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          Toggle details
          <ChevronsUpDown className="size-4" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <p className="text-muted-foreground border rounded-md px-3 py-2 text-sm">
          Additional details are shown here when expanded.
        </p>
      </CollapsibleContent>
    </Collapsible>
  ),
};
