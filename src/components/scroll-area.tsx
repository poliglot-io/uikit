"use client";

import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";

import { cn } from "../lib/utils";

interface ScrollAreaProps extends React.ComponentProps<
  typeof ScrollAreaPrimitive.Root
> {
  /**
   * Ref forwarded to the inner Viewport — i.e. the actual scrolling DOM node.
   * Use this for `scrollIntoView` calls, programmatic `scrollTop` reads, or
   * attaching `scroll` event listeners (the scroll event fires on the
   * Viewport, not on the Root).
   */
  viewportRef?: React.Ref<HTMLDivElement>;
  /**
   * Which axes are scrollable. Defaults to {@code "vertical"} — pages should
   * never produce horizontal scroll, so vertical-only is the safe default and
   * any horizontal overflow is clipped.
   *
   * <p>Use {@code "both"} for surfaces that legitimately need horizontal
   * scrolling (tables, code blocks, log dumps), or {@code "horizontal"} for
   * pure horizontal carousels.
   */
  orientation?: "vertical" | "horizontal" | "both";
}

function ScrollArea({
  className,
  children,
  viewportRef,
  orientation = "vertical",
  ...props
}: ScrollAreaProps) {
  const showVertical = orientation === "vertical" || orientation === "both";
  const showHorizontal = orientation === "horizontal" || orientation === "both";
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      {showVertical && <ScrollBar orientation="vertical" />}
      {showHorizontal && <ScrollBar orientation="horizontal" />}
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-foreground/25 relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}

export { ScrollArea, ScrollBar };
