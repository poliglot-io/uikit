import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "./scroll-area";

const meta = {
  title: "UI Kit/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
} satisfies Meta<typeof ScrollArea>;
export default meta;
type Story = StoryObj<typeof meta>;

const items = Array.from({ length: 40 }, (_, i) => `Item ${i + 1}`);

export const Default: Story = {
  render: () => (
    <ScrollArea className="h-60 w-56 rounded-md border">
      <div className="flex flex-col gap-2 p-4">
        {items.map((item) => (
          <div key={item} className="text-sm">
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea orientation="horizontal" className="w-72 rounded-md border">
      <div className="flex gap-3 p-4">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="bg-muted flex size-20 shrink-0 items-center justify-center rounded-md text-sm"
          >
            {i + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Both: Story = {
  render: () => (
    <ScrollArea orientation="both" className="h-60 w-72 rounded-md border">
      <div className="p-4" style={{ width: 600 }}>
        {items.map((item) => (
          <div key={item} className="text-sm whitespace-nowrap">
            {item} — a longer line of text that overflows horizontally
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};
