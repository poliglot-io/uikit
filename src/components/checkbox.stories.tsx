import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const WithLabel: Story = {
  render: () => (
    <label className="flex items-center gap-2 text-sm">
      <Checkbox defaultChecked />
      Accept terms and conditions
    </label>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-3 text-sm">
      <label className="flex items-center gap-2">
        <Checkbox />
        Unchecked
      </label>
      <label className="flex items-center gap-2">
        <Checkbox defaultChecked />
        Checked
      </label>
      <label className="text-muted-foreground flex items-center gap-2">
        <Checkbox disabled />
        Disabled
      </label>
      <label className="text-muted-foreground flex items-center gap-2">
        <Checkbox disabled defaultChecked />
        Disabled checked
      </label>
    </div>
  ),
};
