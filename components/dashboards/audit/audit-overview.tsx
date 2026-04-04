"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlertTriangle,
  Database,
  Download,
  FileText,
  Filter,
  LogIn,
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
} from "lucide-react";
import { StatusDot } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { auditStats, recentEvents } from "./audit-dashboard-data";
import { getEventIcon, getStatusColor } from "./audit-helpers";

export function AuditOverview() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [eventType, setEventType] = React.useState("all");

  const filteredEvents = recentEvents.filter((event) => {
    const matchesSearch =
      event.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = eventType === "all" || event.type === eventType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Audit Dashboard</h1>
          <p className="text-xs text-muted-foreground">Complete record of all system events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-7">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total Events</span>
            </div>
            <div className="text-lg font-bold">{auditStats.totalEvents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="text-lg font-bold">{auditStats.todayEvents.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Trades</span>
            </div>
            <div className="text-lg font-bold">{auditStats.trades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs text-muted-foreground">Orders</span>
            </div>
            <div className="text-lg font-bold">{auditStats.orders.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <LogIn className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs text-muted-foreground">Logins</span>
            </div>
            <div className="text-lg font-bold">{auditStats.logins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-muted-foreground">Config Changes</span>
            </div>
            <div className="text-lg font-bold">{auditStats.configChanges}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs text-muted-foreground">Alerts</span>
            </div>
            <div className="text-lg font-bold">{auditStats.alerts}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-[140px] h-8 text-sm">
            <SelectValue placeholder="Event type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="trade">Trades</SelectItem>
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="alert">Alerts</SelectItem>
            <SelectItem value="login">Logins</SelectItem>
            <SelectItem value="config">Config</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8">
          <Filter className="h-3.5 w-3.5 mr-1.5" />
          More Filters
        </Button>
      </div>

      {/* Live Event Feed */}
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <StatusDot status="live" className="h-2 w-2 animate-pulse" />
              Live Event Feed
            </CardTitle>
            <span className="text-xs text-muted-foreground">{filteredEvents.length} events</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {filteredEvents.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer",
                  idx !== filteredEvents.length - 1 && "border-b border-border/50",
                )}
              >
                <div className={cn("p-1.5 rounded", getStatusColor(event.status), "bg-current/10")}>
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{event.action}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {event.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {event.user} — {event.details}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="secondary" className="text-[9px]">
                    {event.venue}
                  </Badge>
                  <div className="text-[10px] text-muted-foreground mt-1">{event.timestamp}</div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
