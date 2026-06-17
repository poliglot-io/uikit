import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./button";
import { handleSPARQL } from "./trigger";
import { withMockTrigger } from "../storybook/trigger-mock";

const meta = {
  title: "UI Kit/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: { control: "select", options: ["default", "sm", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

/**
 * `onClick` accepts a `handleSPARQL(...)` descriptor. Clicking hands it to
 * the executor from the nearest provider; the button shows pending state
 * while it runs. The mock executor resolves after a short delay.
 */
export const Trigger: Story = {
  decorators: [withMockTrigger()],
  args: {
    children: "Run",
    onClick: handleSPARQL("SELECT ?s WHERE { ?s ?p ?o } LIMIT 1"),
  },
};
