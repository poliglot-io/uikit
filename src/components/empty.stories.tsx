import type { Meta, StoryObj } from "@storybook/react";
import { Inbox, Search } from "lucide-react";
import { Empty } from "./empty";
import { Button } from "./button";

const meta = {
  title: "Components/Empty",
  component: Empty,
  tags: ["autodocs"],
  args: {
    title: "No items yet",
    description: "Items you create will appear here.",
  },
} satisfies Meta<typeof Empty>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96 border rounded-md">
      <Empty {...args} icon={<Inbox />} />
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <div className="w-96 border rounded-md">
      <Empty
        icon={<Inbox />}
        title="Your inbox is empty"
        description="When you receive messages, they will show up here."
      >
        <Button>Create message</Button>
      </Empty>
    </div>
  ),
};

export const NoResults: Story = {
  render: () => (
    <div className="w-96 border rounded-md">
      <Empty
        icon={<Search />}
        title="No results found"
        description="Try adjusting your search or filters."
      />
    </div>
  ),
};
