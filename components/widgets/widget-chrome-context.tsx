"use client";

import * as React from "react";

/** Set a React node in the widget title bar (right cluster, immediately left of fullscreen). Clear with `null` on unmount. */
export type WidgetHeaderEndSlotSetter = (node: React.ReactNode | null) => void;

export const WidgetHeaderEndSlotContext = React.createContext<WidgetHeaderEndSlotSetter | null>(null);

export function useWidgetHeaderEndSlot(): WidgetHeaderEndSlotSetter | null {
  return React.useContext(WidgetHeaderEndSlotContext);
}
