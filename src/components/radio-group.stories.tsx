import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import { Label } from "./label";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="medium">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="small" id="size-small" />
        <Label htmlFor="size-small">Small</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="medium" id="size-medium" />
        <Label htmlFor="size-medium">Medium</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="large" id="size-large" />
        <Label htmlFor="size-large">Large</Label>
      </div>
    </RadioGroup>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <RadioGroup defaultValue="one">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="one" id="opt-one" />
        <Label htmlFor="opt-one">Option one</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="two" id="opt-two" disabled />
        <Label htmlFor="opt-two">Option two (disabled)</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="three" id="opt-three" />
        <Label htmlFor="opt-three">Option three</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="a" disabled>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="a" id="d-a" />
        <Label htmlFor="d-a">First</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="b" id="d-b" />
        <Label htmlFor="d-b">Second</Label>
      </div>
    </RadioGroup>
  ),
};
