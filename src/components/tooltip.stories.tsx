import type { Meta, StoryObj } from "@storybook/react";
import { Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { Button } from "./button";

const meta = {
  title: "UI Kit/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Add to your list</TooltipContent>
    </Tooltip>
  ),
};

export const OnIconButton: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Add item">
          <Plus />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Add item</TooltipContent>
    </Tooltip>
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">Above the trigger</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Right of the trigger</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Below the trigger</TooltipContent>
      </Tooltip>
    </div>
  ),
};
