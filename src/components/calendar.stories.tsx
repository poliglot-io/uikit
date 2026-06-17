import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { Calendar } from "./calendar";

const meta = {
  title: "UI Kit/Calendar",
  component: Calendar,
  tags: ["autodocs"],
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SingleCalendar() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  );
}

export const Default: Story = {
  render: () => <SingleCalendar />,
};

function RangeCalendar() {
  const [range, setRange] = React.useState<
    { from?: Date; to?: Date } | undefined
  >({
    from: new Date(),
    to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
  });
  return (
    <Calendar
      mode="range"
      selected={range}
      onSelect={setRange}
      numberOfMonths={2}
      className="rounded-md border"
    />
  );
}

export const Range: Story = {
  render: () => <RangeCalendar />,
};
