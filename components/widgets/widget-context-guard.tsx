"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";

/**
 * Guard component that catches missing-provider errors from widgets
 * placed on tabs where their data provider isn't mounted.
 *
 * This wraps each widget in the grid and shows a friendly placeholder
 * instead of crashing the entire page.
 */
export class WidgetContextGuard extends React.Component<
  { widgetLabel: string; children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const isProviderError = this.state.error.message.includes("must be used within");
      return (
        <div className="flex h-full items-center justify-center p-4 bg-muted/10">
          <div className="text-center space-y-2 max-w-[200px]">
            <AlertCircle className="size-5 text-amber-500 mx-auto" />
            <p className="text-xs font-medium text-muted-foreground">{this.props.widgetLabel}</p>
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
              {isProviderError
                ? "This widget needs its native tab to load data. Navigate to the tab or remove it."
                : this.state.error.message}
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
