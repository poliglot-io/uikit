import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "./label";
import { Input } from "./input";

const meta = {
  title: "UI Kit/Label",
  component: Label,
  tags: ["autodocs"],
  args: { children: "Label" },
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="grid w-64 gap-2">
      <Label htmlFor="full-name">Full name</Label>
      <Input id="full-name" placeholder="Jane Doe" />
    </div>
  ),
};
