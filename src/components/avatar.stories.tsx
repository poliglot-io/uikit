import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";

const meta = {
  title: "UI Kit/Avatar",
  component: Avatar,
  tags: ["autodocs"],
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage
        src="https://i.pravatar.cc/64?img=12"
        alt="User avatar"
      />
      <AvatarFallback>AB</AvatarFallback>
    </Avatar>
  ),
};

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="" />
      <AvatarFallback>CD</AvatarFallback>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex items-center -space-x-2">
      <Avatar className="ring-background ring-2">
        <AvatarImage src="https://i.pravatar.cc/64?img=1" alt="" />
        <AvatarFallback>AA</AvatarFallback>
      </Avatar>
      <Avatar className="ring-background ring-2">
        <AvatarImage src="https://i.pravatar.cc/64?img=2" alt="" />
        <AvatarFallback>BB</AvatarFallback>
      </Avatar>
      <Avatar className="ring-background ring-2">
        <AvatarFallback>+3</AvatarFallback>
      </Avatar>
    </div>
  ),
};
