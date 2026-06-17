import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider";

const meta = {
  title: "UI Kit/Slider",
  component: Slider,
  tags: ["autodocs"],
  render: (args) => (
    <div className="w-72">
      <Slider {...args} />
    </div>
  ),
} satisfies Meta<typeof Slider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { defaultValue: [50] },
};

export const Range: Story = {
  args: { defaultValue: [25, 75] },
};

export const Stepped: Story = {
  args: { defaultValue: [40], step: 10 },
};

export const Disabled: Story = {
  args: { defaultValue: [50], disabled: true },
};

export const Vertical: Story = {
  args: { defaultValue: [50], orientation: "vertical" },
  render: (args) => (
    <div className="h-48">
      <Slider {...args} />
    </div>
  ),
};
