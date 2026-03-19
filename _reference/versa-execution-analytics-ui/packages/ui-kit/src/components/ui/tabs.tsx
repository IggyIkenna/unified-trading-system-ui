import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

type TabsVariant = "underline" | "pill";

const TabsVariantContext = React.createContext<TabsVariant>("underline");

const Tabs = TabsPrimitive.Root;

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant;
}

const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant = "underline", ...props }, ref) => (
  <TabsVariantContext.Provider value={variant}>
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        variant === "underline"
          ? "flex items-center border-b border-[var(--color-border-default)] gap-0 bg-transparent"
          : "inline-flex h-9 items-center justify-center rounded-lg bg-[var(--color-bg-tertiary)] p-1 text-[var(--color-text-secondary)]",
        className,
      )}
      {...props}
    />
  </TabsVariantContext.Provider>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const variant = React.useContext(TabsVariantContext);
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        variant === "underline"
          ? "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] border-b-2 border-transparent transition-all cursor-pointer whitespace-nowrap hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-emphasis)] data-[state=active]:text-[var(--color-accent)] data-[state=active]:border-[var(--color-accent)]"
          : "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--color-bg-elevated)] data-[state=active]:text-[var(--color-text-primary)] data-[state=active]:shadow",
        className,
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("mt-0 focus-visible:outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsContent, TabsList, TabsTrigger };
export type { TabsVariant };
