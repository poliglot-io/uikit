import type { Meta, StoryObj } from "@storybook/react";
import { Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "./toggle";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { children: "Toggle" },
  argTypes: {
    variant: { control: "select", options: ["default", "outline"] },
    size: { control: "select", options: ["default", "sm", "lg"] },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Pressed: Story = {
  args: { defaultPressed: true },
};

export const Outline: Story = {
  args: { variant: "outline" },
};

export const WithIcon: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold />
    </Toggle>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Toggle aria-label="Toggle bold">
        <Bold />
      </Toggle>
      <Toggle aria-label="Toggle italic" variant="outline">
        <Italic />
      </Toggle>
      <Toggle aria-label="Toggle underline" defaultPressed>
        <Underline />
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
};
