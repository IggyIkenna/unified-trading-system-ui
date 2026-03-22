// IMPORT THIS — do not create custom loading states
import * as React from 'react'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface CardGridSkeletonProps {
  count?: number
}

function CardGridSkeleton({ count = 6 }: CardGridSkeletonProps) {
  return (
    <div
      data-slot="card-grid-skeleton"
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-3 rounded-xl border p-6"
        >
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="mt-2 h-8 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export { CardGridSkeleton }
