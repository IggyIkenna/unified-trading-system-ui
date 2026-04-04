"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/utils/formatters";

interface WinLossDonutProps {
  wins: number;
  losses: number;
  breakEven: number;
  className?: string;
}

const COLORS = {
  wins: "#10b981",
  losses: "#ef4444",
  breakEven: "#6b7280",
};

export function WinLossDonut({ wins, losses, breakEven, className }: WinLossDonutProps) {
  const total = wins + losses + breakEven;
  const data = [
    { name: "Wins", value: wins, color: COLORS.wins },
    { name: "Losses", value: losses, color: COLORS.losses },
    ...(breakEven > 0 ? [{ name: "Break Even", value: breakEven, color: COLORS.breakEven }] : []),
  ];

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative size-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold tabular-nums">{total}</span>
          <span className="text-[10px] text-muted-foreground">total</span>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-muted-foreground w-16">{d.name}</span>
            <span className="font-mono tabular-nums font-medium">{d.value}</span>
            <span className="text-muted-foreground">
              ({total > 0 ? formatPercent((d.value / total) * 100, 1) : "0%"})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
