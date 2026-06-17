import type { Meta, StoryObj } from "@storybook/react-vite";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import { Button } from "./button";

const meta = {
  title: "UI Kit/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
} satisfies Meta<typeof HoverCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">@jane</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold">Jane Doe</span>
          <span className="text-sm text-muted-foreground">
            Designer and occasional writer. Joined in 2021.
          </span>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const Open: Story = {
  render: () => (
    <HoverCard open>
      <HoverCardTrigger asChild>
        <Button variant="link">Hover preview</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm text-muted-foreground">
          This card is forced open so its content is visible in the preview.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};
