import type { Meta, StoryObj } from "@storybook/react-vite";
import { Spinner } from "./spinner";

const meta = {
  title: "UI Kit/Spinner",
  component: Spinner,
  tags: ["autodocs"],
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner className="size-4" />
      <Spinner className="size-6" />
      <Spinner className="size-8" />
    </div>
  ),
};

export const Muted: Story = {
  render: () => <Spinner className="text-muted-foreground size-6" />,
};

export const WithLabel: Story = {
  render: () => (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Spinner className="size-4" />
      <span>Loading</span>
    </div>
  ),
};
