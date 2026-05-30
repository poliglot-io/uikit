/**
 * Animated placeholder shape shown while content loads.
 *
 * Size and shape via className (e.g. `h-4 w-32`). Prefer over
 * blank space to hint at incoming content's layout.
 */
import { cn } from "../lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
