import type { Meta, StoryObj } from "@storybook/react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "./carousel";

const meta = {
  title: "UI Kit/Carousel",
  component: Carousel,
  tags: ["autodocs"],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const slides = ["One", "Two", "Three", "Four", "Five"];

export const Default: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-xs">
      <Carousel>
        <CarouselContent>
          {slides.map(label => (
            <CarouselItem key={label}>
              <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-md text-4xl font-semibold">
                {label}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};

export const MultipleVisible: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-sm">
      <Carousel opts={{ align: "start" }}>
        <CarouselContent>
          {slides.map(label => (
            <CarouselItem key={label} className="basis-1/3">
              <div className="bg-muted text-muted-foreground flex aspect-square items-center justify-center rounded-md text-2xl font-semibold">
                {label}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  ),
};
