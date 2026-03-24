"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Filter,
  GitBranch,
  LogIn,
  RefreshCw,
  Search,
  TrendingUp,
  User,
  Users,
  XCircle,
  Settings,
  Shield,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditDashboardProps {
  currentPage: string;
}

// Mock audit data
const auditStats = {
  totalEvents: 48291,
  todayEvents: 1247,
  trades: 892,
  orders: 3451,
  logins: 145,
  configChanges: 23,
  alerts: 67,
};

const recentEvents = [
  {
    id: "evt-001",
    type: "trade",
    action: "TRADE_EXECUTED",
    user: "btc-basis-v3",
    details: "BUY 0.5 BTC @ $43,245",
    timestamp: "2s ago",
    status: "success",
    venue: "Binance",
  },
  {
    id: "evt-002",
    type: "order",
    action: "ORDER_PLACED",
    user: "eth-staked",
    details: "LIMIT SELL 10 ETH @ $2,450",
    timestamp: "5s ago",
    status: "pending",
    venue: "Deribit",
  },
  {
    id: "evt-003",
    type: "alert",
    action: "ALERT_TRIGGERED",
    user: "risk-monitor",
    details: "Margin utilization exceeded 80%",
    timestamp: "12s ago",
    status: "warning",
    venue: "System",
  },
  {
    id: "evt-004",
    type: "login",
    action: "USER_LOGIN",
    user: "john.doe@trading.co",
    details: "Login from 192.168.1.1",
    timestamp: "1m ago",
    status: "success",
    venue: "Auth",
  },
  {
    id: "evt-005",
    type: "config",
    action: "CONFIG_CHANGED",
    user: "admin@trading.co",
    details: "Updated risk limits for BTC strategies",
    timestamp: "2m ago",
    status: "success",
    venue: "Config",
  },
  {
    id: "evt-006",
    type: "trade",
    action: "TRADE_EXECUTED",
    user: "aave-lending",
    details: "SUPPLY 50,000 USDC to Aave",
    timestamp: "3m ago",
    status: "success",
    venue: "Aave",
  },
  {
    id: "evt-007",
    type: "order",
    action: "ORDER_CANCELLED",
    user: "ml-directional",
    details: "Cancelled stale order #ORD-4521",
    timestamp: "4m ago",
    status: "info",
    venue: "Binance",
  },
  {
    id: "evt-008",
    type: "alert",
    action: "ALERT_RESOLVED",
    user: "system",
    details: "Feature freshness restored",
    timestamp: "5m ago",
    status: "success",
    venue: "System",
  },
  {
    id: "evt-009",
    type: "trade",
    action: "TRADE_EXECUTED",
    user: "btc-basis-v3",
    details: "SELL 0.3 BTC @ $43,312",
    timestamp: "6m ago",
    status: "success",
    venue: "Binance",
  },
  {
    id: "evt-010",
    type: "login",
    action: "USER_LOGOUT",
    user: "jane.smith@trading.co",
    details: "Session ended",
    timestamp: "8m ago",
    status: "info",
    venue: "Auth",
  },
];

const tradeHistory = [
  {
    id: "TRD-8921",
    strategy: "BTC Basis v3",
    side: "BUY",
    instrument: "BTC-PERP",
    qty: "0.5",
    price: "$43,245",
    venue: "Binance",
    pnl: "+$127",
    timestamp: "2s ago",
  },
  {
    id: "TRD-8920",
    strategy: "ETH Staked",
    side: "SELL",
    instrument: "ETH-SPOT",
    qty: "5.2",
    price: "$2,445",
    venue: "Coinbase",
    pnl: "+$89",
    timestamp: "45s ago",
  },
  {
    id: "TRD-8919",
    strategy: "AAVE Lending",
    side: "SUPPLY",
    instrument: "USDC",
    qty: "50,000",
    price: "$1.00",
    venue: "Aave",
    pnl: "-",
    timestamp: "3m ago",
  },
  {
    id: "TRD-8918",
    strategy: "BTC Basis v3",
    side: "SELL",
    instrument: "BTC-SPOT",
    qty: "0.5",
    price: "$43,198",
    venue: "Kraken",
    pnl: "-$23",
    timestamp: "5m ago",
  },
  {
    id: "TRD-8917",
    strategy: "ML Directional",
    side: "BUY",
    instrument: "SOL-PERP",
    qty: "100",
    price: "$98.45",
    venue: "Binance",
    pnl: "+$215",
    timestamp: "8m ago",
  },
  {
    id: "TRD-8916",
    strategy: "Sports Arb",
    side: "BET",
    instrument: "NBA-LAL",
    qty: "$500",
    price: "1.85",
    venue: "Polymarket",
    pnl: "+$425",
    timestamp: "12m ago",
  },
];

const orderHistory = [
  {
    id: "ORD-4525",
    strategy: "BTC Basis v3",
    type: "LIMIT",
    side: "BUY",
    instrument: "BTC-PERP",
    qty: "1.0",
    price: "$43,100",
    status: "open",
    filled: "0%",
    timestamp: "1m ago",
  },
  {
    id: "ORD-4524",
    strategy: "ETH Staked",
    type: "MARKET",
    side: "SELL",
    instrument: "ETH-SPOT",
    qty: "10",
    price: "MKT",
    status: "filled",
    filled: "100%",
    timestamp: "2m ago",
  },
  {
    id: "ORD-4523",
    strategy: "ML Directional",
    type: "LIMIT",
    side: "SELL",
    instrument: "SOL-PERP",
    qty: "50",
    price: "$99.50",
    status: "cancelled",
    filled: "0%",
    timestamp: "4m ago",
  },
  {
    id: "ORD-4522",
    strategy: "BTC Basis v3",
    type: "LIMIT",
    side: "SELL",
    instrument: "BTC-SPOT",
    qty: "0.5",
    price: "$43,500",
    status: "partial",
    filled: "60%",
    timestamp: "8m ago",
  },
];

const loginHistory = [
  {
    id: "LOG-892",
    user: "john.doe@trading.co",
    action: "LOGIN",
    ip: "192.168.1.1",
    device: "Chrome / macOS",
    location: "New York, US",
    timestamp: "1m ago",
    status: "success",
  },
  {
    id: "LOG-891",
    user: "jane.smith@trading.co",
    action: "LOGOUT",
    ip: "192.168.1.45",
    device: "Safari / macOS",
    location: "London, UK",
    timestamp: "8m ago",
    status: "success",
  },
  {
    id: "LOG-890",
    user: "admin@trading.co",
    action: "LOGIN",
    ip: "10.0.0.1",
    device: "Firefox / Linux",
    location: "Singapore",
    timestamp: "15m ago",
    status: "success",
  },
  {
    id: "LOG-889",
    user: "unknown@test.com",
    action: "LOGIN_FAILED",
    ip: "45.67.89.123",
    device: "Unknown",
    location: "Unknown",
    timestamp: "22m ago",
    status: "failed",
  },
  {
    id: "LOG-888",
    user: "mike.ops@trading.co",
    action: "LOGIN",
    ip: "192.168.1.78",
    device: "Chrome / Windows",
    location: "Tokyo, JP",
    timestamp: "45m ago",
    status: "success",
  },
];

const configChanges = [
  {
    id: "CFG-145",
    user: "admin@trading.co",
    category: "Risk Limits",
    change: "BTC max position: $50M → $60M",
    timestamp: "2m ago",
    approved: true,
  },
  {
    id: "CFG-144",
    user: "john.doe@trading.co",
    category: "Strategy Config",
    change: "btc-basis-v3: enabled hedging",
    timestamp: "1h ago",
    approved: true,
  },
  {
    id: "CFG-143",
    user: "admin@trading.co",
    category: "System",
    change: "Kill switch threshold: 5% → 4%",
    timestamp: "2h ago",
    approved: true,
  },
  {
    id: "CFG-142",
    user: "mike.ops@trading.co",
    category: "Deployment",
    change: "Deployed execution-svc v2.14.3",
    timestamp: "4h ago",
    approved: true,
  },
];

function getEventIcon(type: string) {
  switch (type) {
    case "trade":
      return <TrendingUp className="h-3.5 w-3.5" />;
    case "order":
      return <FileText className="h-3.5 w-3.5" />;
    case "alert":
      return <AlertTriangle className="h-3.5 w-3.5" />;
    case "login":
      return <LogIn className="h-3.5 w-3.5" />;
    case "config":
      return <Settings className="h-3.5 w-3.5" />;
    default:
      return <Activity className="h-3.5 w-3.5" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "success":
      return "text-positive";
    case "failed":
      return "text-destructive";
    case "warning":
      return "text-warning";
    case "pending":
      return "text-info";
    default:
      return "text-muted-foreground";
  }
}

// Main Dashboard
function AuditOverview() {
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
          <p className="text-xs text-muted-foreground">
            Complete record of all system events
          </p>
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
              <span className="text-xs text-muted-foreground">
                Total Events
              </span>
            </div>
            <div className="text-lg font-bold">
              {auditStats.totalEvents.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Today</span>
            </div>
            <div className="text-lg font-bold">
              {auditStats.todayEvents.toLocaleString()}
            </div>
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
            <div className="text-lg font-bold">
              {auditStats.orders.toLocaleString()}
            </div>
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
              <span className="text-xs text-muted-foreground">
                Config Changes
              </span>
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
              <span className="h-2 w-2 rounded-full bg-positive animate-pulse" />
              Live Event Feed
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {filteredEvents.length} events
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {filteredEvents.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer",
                  idx !== filteredEvents.length - 1 &&
                    "border-b border-border/50",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded",
                    getStatusColor(event.status),
                    "bg-current/10",
                  )}
                >
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
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {event.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Trades Page
function TradesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Trade History</h1>
          <p className="text-xs text-muted-foreground">
            Complete record of all executed trades
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Trade ID</th>
                <th className="px-4 py-2 text-left font-medium">Strategy</th>
                <th className="px-4 py-2 text-center font-medium">Side</th>
                <th className="px-4 py-2 text-left font-medium">Instrument</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-center font-medium">Venue</th>
                <th className="px-4 py-2 text-right font-medium">P&L</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.map((trade) => (
                <tr
                  key={trade.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono">{trade.id}</td>
                  <td className="px-4 py-3">{trade.strategy}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        trade.side === "BUY" ||
                        trade.side === "SUPPLY" ||
                        trade.side === "BET"
                          ? "default"
                          : "secondary"
                      }
                      className="text-[9px]"
                    >
                      {trade.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{trade.instrument}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {trade.qty}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {trade.price}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {trade.venue}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-mono",
                      trade.pnl.startsWith("+")
                        ? "text-positive"
                        : trade.pnl.startsWith("-")
                          ? "text-negative"
                          : "",
                    )}
                  >
                    {trade.pnl}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {trade.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Orders Page
function OrdersPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Order History</h1>
          <p className="text-xs text-muted-foreground">
            All orders placed, filled, and cancelled
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">Order ID</th>
                <th className="px-4 py-2 text-left font-medium">Strategy</th>
                <th className="px-4 py-2 text-center font-medium">Type</th>
                <th className="px-4 py-2 text-center font-medium">Side</th>
                <th className="px-4 py-2 text-left font-medium">Instrument</th>
                <th className="px-4 py-2 text-right font-medium">Qty</th>
                <th className="px-4 py-2 text-right font-medium">Price</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Filled</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono">{order.id}</td>
                  <td className="px-4 py-3">{order.strategy}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {order.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={order.side === "BUY" ? "default" : "secondary"}
                      className="text-[9px]"
                    >
                      {order.side}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{order.instrument}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {order.qty}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {order.price}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant={
                        order.status === "filled"
                          ? "default"
                          : order.status === "open"
                            ? "secondary"
                            : "outline"
                      }
                      className={cn(
                        "text-[9px]",
                        order.status === "cancelled" && "text-muted-foreground",
                      )}
                    >
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {order.filled}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {order.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Logins Page
function LoginsPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Login History</h1>
          <p className="text-xs text-muted-foreground">
            User authentication events
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="bg-muted/30">
              <tr className="text-muted-foreground">
                <th className="px-4 py-2 text-left font-medium">ID</th>
                <th className="px-4 py-2 text-left font-medium">User</th>
                <th className="px-4 py-2 text-center font-medium">Action</th>
                <th className="px-4 py-2 text-left font-medium">IP Address</th>
                <th className="px-4 py-2 text-left font-medium">Device</th>
                <th className="px-4 py-2 text-left font-medium">Location</th>
                <th className="px-4 py-2 text-center font-medium">Status</th>
                <th className="px-4 py-2 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.map((login) => (
                <tr
                  key={login.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono">{login.id}</td>
                  <td className="px-4 py-3">{login.user}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className="text-[9px]">
                      {login.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono">{login.ip}</td>
                  <td className="px-4 py-3">{login.device}</td>
                  <td className="px-4 py-3">{login.location}</td>
                  <td className="px-4 py-3 text-center">
                    {login.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-positive inline" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive inline" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {login.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Config Changes Page
function ChangesPage() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Configuration Changes</h1>
          <p className="text-xs text-muted-foreground">
            System and strategy configuration history
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-3.5 w-3.5 mr-1.5" />
          Export
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {configChanges.map((change) => (
            <div
              key={change.id}
              className="flex items-start gap-4 pb-4 border-b border-border/50 last:border-0 last:pb-0"
            >
              <div className="p-2 rounded bg-amber-400/10">
                <GitBranch className="h-4 w-4 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {change.id}
                  </span>
                  <Badge variant="outline" className="text-[9px]">
                    {change.category}
                  </Badge>
                </div>
                <p className="text-sm mt-1">{change.change}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{change.user}</span>
                  <span>·</span>
                  <Clock className="h-3 w-3" />
                  <span>{change.timestamp}</span>
                  {change.approved && (
                    <>
                      <span>·</span>
                      <CheckCircle className="h-3 w-3 text-positive" />
                      <span className="text-positive">Approved</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Search Page
function SearchPage() {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold">Advanced Search</h1>
        <p className="text-xs text-muted-foreground">
          Search across all audit records
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, instrument, venue..."
                className="pl-10 h-12 text-base"
              />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="trade">Trades</SelectItem>
                  <SelectItem value="order">Orders</SelectItem>
                  <SelectItem value="login">Logins</SelectItem>
                  <SelectItem value="config">Config</SelectItem>
                  <SelectItem value="alert">Alerts</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="24h">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last hour</SelectItem>
                  <SelectItem value="24h">Last 24 hours</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
              <Button>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-muted-foreground py-12">
        Enter search criteria above to find audit records
      </div>
    </div>
  );
}

// Events Page (detailed view)
function EventsPage() {
  return <AuditOverview />;
}

export function AuditDashboard({ currentPage }: AuditDashboardProps) {
  switch (currentPage) {
    case "events":
      return <EventsPage />;
    case "trades":
      return <TradesPage />;
    case "orders":
      return <OrdersPage />;
    case "logins":
      return <LoginsPage />;
    case "changes":
      return <ChangesPage />;
    case "search":
      return <SearchPage />;
    case "dashboard":
    default:
      return <AuditOverview />;
  }
}
