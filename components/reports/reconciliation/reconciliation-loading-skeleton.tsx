"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReconciliationLoadingSkeleton() {
  return (
    <main className="flex-1 p-6 space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-[280px] w-full rounded-lg" />
      <Skeleton className="h-[400px] w-full rounded-lg" />
    </main>
  );
}
