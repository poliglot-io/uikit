import type { Meta, StoryObj } from "@storybook/react-vite";
import { toast } from "sonner";
import { Toaster } from "./sonner";
import { Button } from "./button";

const meta = {
  title: "UI Kit/Sonner",
  component: Toaster,
  tags: ["autodocs"],
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Toaster />
      <Button onClick={() => toast("A notification message")}>
        Show toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.success("Saved", {
            description: "Your changes have been saved.",
          })
        }
      >
        Show with description
      </Button>
    </div>
  ),
};
