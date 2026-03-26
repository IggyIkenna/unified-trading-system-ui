"use client";

import { cn } from "@/lib/utils";

export interface ColRowProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ColRow({ active, onClick, children }: ColRowProps) {
  return (
    <button
      className={cn(
        "w-full text-left flex items-start gap-2 px-2.5 py-1.5 rounded-md transition-colors text-sm cursor-pointer",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted/60 text-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
