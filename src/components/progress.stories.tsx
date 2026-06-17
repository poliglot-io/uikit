import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress";

const meta = {
  title: "UI Kit/Progress",
  component: Progress,
  tags: ["autodocs"],
  render: (args) => (
    <div className="w-80">
      <Progress {...args} />
    </div>
  ),
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { value: 60 },
};

export const Empty: Story = {
  args: { value: 0 },
};

export const Half: Story = {
  args: { value: 50 },
};

export const Complete: Story = {
  args: { value: 100 },
};
