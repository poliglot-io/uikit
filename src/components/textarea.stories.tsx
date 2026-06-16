import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "./textarea";

const meta = {
  title: "UI Kit/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { placeholder: "Type your message here." },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Textarea className="w-80" {...args} />,
};

export const WithValue: Story = {
  render: (args) => (
    <Textarea
      className="w-80"
      defaultValue="This textarea grows to fit its content."
      {...args}
    />
  ),
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <Textarea className="w-80" {...args} />,
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex w-80 flex-col gap-2">
      <label htmlFor="message" className="text-sm font-medium">
        Message
      </label>
      <Textarea id="message" {...args} />
      <p className="text-sm text-muted-foreground">
        Your message will be sent to the team.
      </p>
    </div>
  ),
};
