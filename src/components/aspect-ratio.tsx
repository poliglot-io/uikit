/**
 * Constrain a child to a fixed aspect ratio.
 *
 * Useful for images, videos, and iframes that should maintain
 * their shape across container widths. Pass `ratio={16 / 9}` or
 * any numeric width/height ratio.
 */
"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
