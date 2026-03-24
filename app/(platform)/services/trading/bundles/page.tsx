"use client";

import { BundleBuilder } from "@/components/trading/bundle-builder";

export default function BundleBuilderPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Atomic Bundle Builder</h1>
          <p className="text-sm text-muted-foreground">
            Construct multi-leg atomic transactions — flash loans, basis trades,
            arb bundles
          </p>
        </div>
      </div>
      <BundleBuilder />
    </div>
  );
}
