import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI Kit/Select",
  component: Select,
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="orange">Orange</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select defaultValue="cat">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select an animal" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Pets</SelectLabel>
          <SelectItem value="cat">Cat</SelectItem>
          <SelectItem value="dog">Dog</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Wild</SelectLabel>
          <SelectItem value="fox">Fox</SelectItem>
          <SelectItem value="bear">Bear</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const Small: Story = {
  render: () => (
    <Select>
      <SelectTrigger size="sm" className="w-56">
        <SelectValue placeholder="Small trigger" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">One</SelectItem>
        <SelectItem value="two">Two</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithDisabledItem: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="available">Available</SelectItem>
        <SelectItem value="soon" disabled>
          Coming soon
        </SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Disabled select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="one">One</SelectItem>
      </SelectContent>
    </Select>
  ),
};
