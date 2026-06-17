import type { Meta, StoryObj } from "@storybook/react-vite";

import { Separator } from "./separator";

const meta = {
  title: "UI Kit/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <div className="space-y-1">
        <h4 className="text-sm font-medium leading-none">UI Kit</h4>
        <p className="text-sm text-muted-foreground">
          A collection of reusable components.
        </p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
        <Separator orientation="vertical" />
        <span>About</span>
      </div>
    </div>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 text-sm">
      <p>Above the divider</p>
      <Separator className="my-2" />
      <p>Below the divider</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-3 text-sm">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
