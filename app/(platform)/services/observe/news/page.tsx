"use client";

import * as React from "react";
import { PageHeader } from "@/components/platform/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Clock, AlertTriangle, Flame, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNewsFeed, type NewsSeverity } from "@/hooks/api/use-news";

function severityBadge(severity: NewsSeverity) {
  switch (severity) {
    case "breaking":
      return (
        <Badge className="bg-red-500/15 text-red-400 border-transparent gap-1">
          <Flame className="size-3" />
          Breaking
        </Badge>
      );
    case "high":
      return (
        <Badge className="bg-orange-500/15 text-orange-400 border-transparent gap-1">
          <ArrowUp className="size-3" />
          High
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-transparent gap-1">
          <Minus className="size-3" />
          Medium
        </Badge>
      );
    case "low":
      return <Badge className="bg-slate-500/15 text-slate-400 border-transparent">Low</Badge>;
  }
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const SOURCES = ["All", "Reuters", "Bloomberg", "CoinDesk", "The Block", "ESPN", "DeFi Llama"] as const;
const SEVERITIES = ["All", "breaking", "high", "medium", "low"] as const;

export default function NewsPage() {
  const { data: news, isLoading } = useNewsFeed();
  const [severityFilter, setSeverityFilter] = React.useState<string>("All");
  const [sourceFilter, setSourceFilter] = React.useState<string>("All");

  const filtered = React.useMemo(() => {
    if (!news) return [];
    return news.filter((item) => {
      if (severityFilter !== "All" && item.severity !== severityFilter) return false;
      if (sourceFilter !== "All" && item.source !== sourceFilter) return false;
      return true;
    });
  }, [news, severityFilter, sourceFilter]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-[1000px] mx-auto space-y-6">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <Newspaper className="size-6 text-cyan-400" />
              News Feed
            </span>
          }
          description="Market news filtered by relevance to active strategies and positions"
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              {SEVERITIES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All Severity" : s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "All" ? "All Sources" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* News List */}
        {filtered.length === 0 ? (
          <Card className="bg-card/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="size-8 mb-2" />
              <p className="text-sm">No news items match the current filters.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <Card key={item.id} className="bg-card/50 hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {severityBadge(item.severity)}
                        <h3 className="text-sm font-medium">{item.title}</h3>
                      </div>

                      {/* Summary */}
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.summary}</p>

                      {/* Instruments */}
                      {item.instruments.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.instruments.map((inst) => (
                            <Badge key={inst} variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                              {inst}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatTimestamp(item.timestamp)}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {item.source}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
