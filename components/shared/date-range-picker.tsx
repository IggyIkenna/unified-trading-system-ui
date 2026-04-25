"use client";

import * as React from "react";
import type { DateRange } from "react-day-picker";
import { CalendarRange } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtDate(d: Date): string {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

function toDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface DateRangePickerProps {
  from: string;
  to: string;
  minDate?: string;
  maxDate?: string;
  onChange: (from: string, to: string) => void;
  className?: string;
}

export function DateRangePicker({ from, to, minDate, maxDate, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<DateRange | undefined>({
    from: toDate(from),
    to: toDate(to),
  });

  const todayDate = React.useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    return t;
  }, []);

  const maxD = maxDate ? toDate(maxDate) : todayDate;
  const minD = minDate ? toDate(minDate) : undefined;

  // Reset pending to committed value whenever popover opens
  const handleOpenChange = (next: boolean) => {
    if (next) setPending({ from: toDate(from), to: toDate(to) });
    setOpen(next);
  };

  const handleApply = () => {
    if (pending?.from && pending?.to) {
      onChange(toStr(pending.from), toStr(pending.to));
      setOpen(false);
    }
  };

  const applyPreset = (e: React.MouseEvent, days: number | "all") => {
    e.stopPropagation();
    const endDate = maxD;
    let startDate: Date;
    if (days === "all") {
      startDate = minD ?? toDate("2026-03-01");
    } else {
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days + 1);
      if (minD && startDate < minD) startDate = new Date(minD);
    }
    onChange(toStr(startDate), toStr(endDate));
    setOpen(false);
  };

  const canApply = !!(pending?.from && pending?.to);
  const fromDate = toDate(from);
  const toDateObj = toDate(to);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-8 flex items-center gap-1.5 px-2 py-1 border border-border rounded-md text-xs hover:bg-accent transition-colors cursor-pointer",
            open && "bg-accent",
            className,
          )}
        >
          <CalendarRange className="size-3 text-muted-foreground" />
          <span>
            {fmtDate(fromDate)} – {fmtDate(toDateObj)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" sideOffset={6}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
          <span className="text-[11px] text-muted-foreground">Quick:</span>
          {(
            [
              ["7D", 7],
              ["30D", 30],
              ["All", "all"],
            ] as const
          ).map(([label, val]) => (
            <button
              key={label}
              onClick={(e) => applyPreset(e, val)}
              className="text-[11px] px-2 py-0.5 rounded border border-border hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={pending}
          onSelect={setPending}
          numberOfMonths={2}
          defaultMonth={pending?.from ?? fromDate}
          disabled={[{ after: todayDate }, ...(minD ? [{ before: minD }] : [])]}
          initialFocus
        />
        <div className="flex items-center justify-between px-3 py-2 border-t border-border gap-3">
          <span className="text-[11px] text-muted-foreground">
            {pending?.from && pending?.to
              ? `${fmtDate(pending.from)} – ${fmtDate(pending.to)}`
              : pending?.from
                ? `${fmtDate(pending.from)} – pick end date`
                : "Pick start date"}
          </span>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="text-[11px] px-3 py-1 rounded bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
