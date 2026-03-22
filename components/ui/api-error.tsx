import * as React from 'react'
import { AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface ApiErrorProps {
  error: Error | { message?: string } | null
  onRetry?: () => void
  title?: string
}

function ApiError({ error, onRetry, title = 'Failed to load data' }: ApiErrorProps) {
  if (!error) {
    return null
  }

  const message =
    error instanceof Error
      ? error.message
      : error.message ?? 'An unknown error occurred.'

  return (
    <div
      data-slot="api-error"
      className={cn(
        'border-destructive/20 bg-destructive/5 flex flex-col items-center gap-3 rounded-lg border p-6 text-center',
      )}
    >
      <AlertTriangle className="text-destructive size-8" />
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md text-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  )
}

export { ApiError }
