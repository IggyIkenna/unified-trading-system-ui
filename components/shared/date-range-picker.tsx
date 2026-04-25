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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
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

  // Each calendar tracks its own month independently.
  const [leftMonth, setLeftMonth] = React.useState<Date>(() => startOfMonth(toDate(from)));
  const [rightMonth, setRightMonth] = React.useState<Date>(() => {
    const lm = startOfMonth(toDate(from));
    const rm = startOfMonth(toDate(to));
    // If from and to are in the same month, right calendar shows the next month.
    return rm > lm ? rm : addMonths(lm, 1);
  });

  // pending is undefined on open so the user starts fresh each time.
  const [pending, setPending] = React.useState<DateRange | undefined>(undefined);

  const todayDate = React.useMemo(() => {
    const t = new Date();
    t.setHours(23, 59, 59, 999);
    return t;
  }, []);

  const maxD = maxDate ? toDate(maxDate) : todayDate;
  const minD = minDate ? toDate(minDate) : undefined;

  const disabled = [{ after: maxD }, ...(minD ? [{ before: minD }] : [])];

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // Fresh start: clear pending and reset months to the committed range.
      setPending(undefined);
      const lm = startOfMonth(toDate(from));
      const rm = startOfMonth(toDate(to));
      setLeftMonth(lm);
      setRightMonth(rm > lm ? rm : addMonths(lm, 1));
    }
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

  const statusLabel =
    pending?.from && pending?.to
      ? `${fmtDate(pending.from)} – ${fmtDate(pending.to)}`
      : pending?.from
        ? `${fmtDate(pending.from)} — pick end date`
        : "Pick start date";

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
        {/* Quick presets */}
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

        {/* Two independent calendars */}
        <div className="flex divide-x divide-border">
          <Calendar
            mode="range"
            selected={pending}
            onSelect={setPending}
            numberOfMonths={1}
            month={leftMonth}
            onMonthChange={setLeftMonth}
            disabled={disabled}
            classNames={{ root: "p-3" }}
          />
          <Calendar
            mode="range"
            selected={pending}
            onSelect={setPending}
            numberOfMonths={1}
            month={rightMonth}
            onMonthChange={setRightMonth}
            disabled={disabled}
            classNames={{ root: "p-3" }}
          />
        </div>

        {/* Status + Apply */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border gap-3">
          <span className="text-[11px] text-muted-foreground">{statusLabel}</span>
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
