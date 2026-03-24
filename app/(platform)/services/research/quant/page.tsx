"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GitCompare,
  Shield,
  Clock,
  ArrowRight,
  FlaskConical,
  Brain,
  Zap,
} from "lucide-react";

const PLANNED_SECTIONS = [
  {
    id: "reports",
    icon: BookOpen,
    title: "Historical Reports",
    description:
      "Saved backtest reports with exportable summaries. Review completed runs, annotate findings, and build a research archive.",
    status: "planned",
    features: [
      "Saved strategy backtest reports",
      "Saved execution backtest reports",
      "Exportable PDF/CSV summaries",
      "Research annotations and notes",
    ],
  },
  {
    id: "compare",
    icon: GitCompare,
    title: "Saved Comparisons",
    description:
      "Persistent side-by-side comparisons of strategies, models, and execution runs. Share comparisons with the team.",
    status: "planned",
    features: [
      "Pinned strategy comparisons",
      "Pinned execution algo comparisons",
      "Model performance comparisons",
      "Shareable comparison links",
    ],
  },
  {
    id: "governance",
    icon: Shield,
    title: "Model Governance",
    description:
      "Audit trail for model versions, champion/challenger decisions, and model retirement lifecycle management.",
    status: "planned",
    features: [
      "Model lifecycle audit log",
      "Champion/challenger decision history",
      "Feature version lineage",
      "Regulatory export (backtesting evidence)",
    ],
  },
];

const QUICK_LINKS = [
  {
    label: "Strategy Backtests",
    href: "/services/research/strategies",
    icon: FlaskConical,
    desc: "View all strategy backtest results",
  },
  {
    label: "Execution Backtests",
    href: "/services/research/execution",
    icon: Zap,
    desc: "View execution simulation results",
  },
  {
    label: "ML Models",
    href: "/services/research/ml",
    icon: Brain,
    desc: "View trained models and validation",
  },
];

export default function QuantWorkspacePage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Quant Workspace
            </h1>
            <Badge
              variant="outline"
              className="border-amber-400/30 text-amber-400 text-xs"
            >
              <Clock className="size-3 mr-1" />
              Coming soon
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Historical reports, saved comparisons, and model governance.
            Deferred for initial build — use the tabs below for research work.
          </p>
        </div>
      </div>

      {/* Quick links to active sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-primary/10 shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground ml-auto shrink-0" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Planned sections */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Planned Sections</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANNED_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="border-border/50 opacity-80">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {section.features.map((f) => (
                      <li
                        key={f}
                        className="text-xs text-muted-foreground flex items-start gap-1.5"
                      >
                        <span className="text-muted-foreground/50 mt-0.5">
                          ·
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
