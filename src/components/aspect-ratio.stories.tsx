import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "./aspect-ratio";

const meta = {
  title: "Components/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {
    ratio: { control: "number" },
  },
} satisfies Meta<typeof AspectRatio>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { ratio: 16 / 9 },
  render: (args) => (
    <div className="w-80">
      <AspectRatio {...args} className="bg-muted overflow-hidden rounded-md">
        <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  ),
};

export const Square: Story = {
  args: { ratio: 1 },
  render: (args) => (
    <div className="w-60">
      <AspectRatio {...args} className="bg-muted overflow-hidden rounded-md">
        <div className="text-muted-foreground flex size-full items-center justify-center text-sm">
          1 / 1
        </div>
      </AspectRatio>
    </div>
  ),
};
