/**
 * Loading indicator (animated spin icon).
 *
 * Sizes via className (`size-4`, `size-6`, etc.). Use for
 * indeterminate progress; for known-duration operations prefer
 * `Progress`.
 */
import { Loader2Icon } from "lucide-react";

import { cn } from "../lib/utils";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
