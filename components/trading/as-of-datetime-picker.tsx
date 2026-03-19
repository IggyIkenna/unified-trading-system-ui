"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Clock, Radio } from "lucide-react"
import { format, subHours, startOfDay, subDays } from "date-fns"

interface AsOfDatetimePickerProps {
  className?: string
  onChange?: (datetime: Date | null) => void
}

const presets = [
  { label: "Live", value: null },
  { label: "1h ago", getValue: () => subHours(new Date(), 1) },
  { label: "Start of day", getValue: () => startOfDay(new Date()) },
  { label: "Yesterday close", getValue: () => startOfDay(subDays(new Date(), 1)) },
  { label: "Last week", getValue: () => subDays(new Date(), 7) },
]

export function AsOfDatetimePicker({
  className,
  onChange,
}: AsOfDatetimePickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = React.useState(false)

  const asOfParam = searchParams.get("as_of")
  const selectedDate = asOfParam ? new Date(asOfParam) : null
  const isLive = !selectedDate

  const handleSelect = (date: Date | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (date) {
      params.set("as_of", date.toISOString())
    } else {
      params.delete("as_of")
    }
    router.push(`?${params.toString()}`)
    onChange?.(date)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 gap-2 px-3 text-xs font-medium",
            isLive && "border-status-live/50 text-status-live",
            className
          )}
        >
          {isLive ? (
            <>
              <Radio className="size-3 animate-pulse" />
              Live
            </>
          ) : (
            <>
              <Clock className="size-3" />
              {format(selectedDate, "MMM d, HH:mm")}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="p-3 border-b border-border">
          <div className="text-sm font-medium mb-2">Quick Select</div>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className={cn(
                  "h-7 text-xs",
                  preset.value === null && isLive && "border-primary bg-primary/10"
                )}
                onClick={() =>
                  handleSelect(preset.getValue ? preset.getValue() : null)
                }
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate || undefined}
          onSelect={(date) => date && handleSelect(date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
