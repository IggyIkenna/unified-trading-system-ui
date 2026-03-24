"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Cpu,
  Building2,
  LineChart,
  BarChart3,
  ShoppingBasket,
  Send,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/execution/overview", label: "Overview", icon: LayoutDashboard },
  { href: "/execution/algos", label: "Algo Comparison", icon: Cpu },
  { href: "/execution/venues", label: "Venue Matrix", icon: Building2 },
  { href: "/execution/tca", label: "TCA Explorer", icon: LineChart },
  { href: "/execution/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { href: "/execution/candidates", label: "Candidates", icon: ShoppingBasket },
  { href: "/execution/handoff", label: "Handoff", icon: Send },
];

export function ExecutionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/execution/overview" &&
            pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
