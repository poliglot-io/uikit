import type { Meta, StoryObj } from "@storybook/react";
import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "./alert";

const meta = {
  title: "Components/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "info", "warning"],
    },
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        Your changes have been saved automatically.
      </AlertDescription>
    </Alert>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Alert>
        <Info />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A neutral, informational message.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <Info />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>Something worth knowing about.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review this before continuing.</AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong. Try again.</AlertDescription>
      </Alert>
    </div>
  ),
};
