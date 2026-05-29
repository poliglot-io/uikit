import * as React from "react";
import { cn } from "../lib/utils";

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
}

function Empty({
  icon,
  title,
  description,
  className,
  children,
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground [&>svg]:h-12 [&>svg]:w-12">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
      )}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export { Empty, type EmptyProps };
