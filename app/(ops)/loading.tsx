import { Skeleton } from "@/components/ui/skeleton";

export default function OpsLoading() {
  return (
    <div className="container space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-2/3 max-w-lg" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
