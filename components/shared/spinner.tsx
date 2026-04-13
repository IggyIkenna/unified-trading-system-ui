import { Loader2Icon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
} as const;

export type SpinnerSize = keyof typeof SIZE_CLASS;

export interface SpinnerProps extends Omit<ComponentProps<typeof Loader2Icon>, "children"> {
  size?: SpinnerSize;
}

function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("animate-spin", SIZE_CLASS[size], className)}
      {...props}
    />
  );
}

export { Spinner };
