"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Globe,
  Mail,
  Smartphone,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  QrCode,
  Monitor,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ── Channel State ─────────────────────────────────────────────────────────────

interface ChannelState {
  web: boolean;
  email: boolean;
  push: boolean;
  telegram: boolean;
}

const DEFAULT_CHANNELS: ChannelState = {
  web: true,
  email: true,
  push: false,
  telegram: false,
};

// ── Alert Rules ───────────────────────────────────────────────────────────────

type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

interface AlertRule {
  name: string;
  severity: Severity;
  web: boolean;
  email: boolean;
  push: boolean;
  telegram: boolean;
}

const INITIAL_ALERT_RULES: AlertRule[] = [
  { name: "Position Limit Breach", severity: "Critical", web: true, email: true, push: true, telegram: true },
  { name: "Drawdown Threshold", severity: "Critical", web: true, email: true, push: true, telegram: true },
  { name: "Margin Call Warning", severity: "Critical", web: true, email: true, push: true, telegram: true },
  { name: "Liquidation Risk", severity: "Critical", web: true, email: true, push: true, telegram: true },
  { name: "Venue Connectivity Lost", severity: "High", web: true, email: true, push: true, telegram: false },
  { name: "Strategy Stopped", severity: "High", web: true, email: true, push: true, telegram: false },
  { name: "Reconciliation Break", severity: "High", web: true, email: true, push: true, telegram: true },
  { name: "Fill Rate Below Threshold", severity: "Medium", web: true, email: true, push: false, telegram: false },
  { name: "Stale Data Alert", severity: "Medium", web: true, email: true, push: false, telegram: false },
  { name: "Gas Price Spike", severity: "Medium", web: true, email: false, push: true, telegram: false },
  { name: "New Trade Fill", severity: "Low", web: true, email: false, push: false, telegram: false },
  { name: "Strategy Signal Generated", severity: "Low", web: true, email: false, push: false, telegram: false },
  { name: "Daily P&L Summary", severity: "Info", web: false, email: true, push: false, telegram: false },
  { name: "Weekly Performance Report", severity: "Info", web: false, email: true, push: false, telegram: false },
  { name: "Model Retrain Complete", severity: "Info", web: true, email: false, push: false, telegram: true },
];

// ── Devices ───────────────────────────────────────────────────────────────────

interface RegisteredDevice {
  id: string;
  name: string;
  platform: "iOS" | "Android";
  lastActive: string;
  status: "Active" | "Inactive";
}

const INITIAL_DEVICES: RegisteredDevice[] = [
  { id: "d1", name: "iPhone 15 Pro", platform: "iOS", lastActive: "2h ago", status: "Active" },
  { id: "d2", name: "Pixel 8", platform: "Android", lastActive: "1d ago", status: "Active" },
];

// ── Notification History ──────────────────────────────────────────────────────

type DeliveryStatus = "Delivered" | "Failed" | "Pending";
type Channel = "Web" | "Email" | "Push" | "Telegram";

interface NotificationEntry {
  id: string;
  timestamp: string;
  alertType: string;
  channel: Channel;
  status: DeliveryStatus;
  message: string;
}

const MOCK_HISTORY: NotificationEntry[] = [
  { id: "n1", timestamp: "2026-03-28 14:32:01", alertType: "Position Limit Breach", channel: "Web", status: "Delivered", message: "BTC-PERP position exceeded 120% of limit on Binance" },
  { id: "n2", timestamp: "2026-03-28 14:32:01", alertType: "Position Limit Breach", channel: "Email", status: "Delivered", message: "BTC-PERP position exceeded 120% of limit on Binance" },
  { id: "n3", timestamp: "2026-03-28 14:32:02", alertType: "Position Limit Breach", channel: "Push", status: "Failed", message: "BTC-PERP position exceeded 120% of limit on Binance" },
  { id: "n4", timestamp: "2026-03-28 14:15:44", alertType: "Venue Connectivity Lost", channel: "Web", status: "Delivered", message: "Lost WebSocket connection to Deribit (retry 3/5)" },
  { id: "n5", timestamp: "2026-03-28 14:15:45", alertType: "Venue Connectivity Lost", channel: "Email", status: "Pending", message: "Lost WebSocket connection to Deribit (retry 3/5)" },
  { id: "n6", timestamp: "2026-03-28 13:50:12", alertType: "New Trade Fill", channel: "Web", status: "Delivered", message: "Filled 0.5 ETH-PERP @ $3,842.10 on OKX" },
  { id: "n7", timestamp: "2026-03-28 13:22:30", alertType: "Gas Price Spike", channel: "Push", status: "Delivered", message: "Ethereum gas price spiked to 142 gwei (+85% in 5m)" },
  { id: "n8", timestamp: "2026-03-28 12:00:00", alertType: "Daily P&L Summary", channel: "Email", status: "Delivered", message: "Daily P&L: +$12,450.23 across 8 strategies" },
  { id: "n9", timestamp: "2026-03-28 11:45:33", alertType: "Model Retrain Complete", channel: "Telegram", status: "Delivered", message: "btc_momentum_v3 retrain complete (AUC: 0.847)" },
  { id: "n10", timestamp: "2026-03-28 11:45:33", alertType: "Model Retrain Complete", channel: "Web", status: "Delivered", message: "btc_momentum_v3 retrain complete (AUC: 0.847)" },
  { id: "n11", timestamp: "2026-03-28 10:30:15", alertType: "Drawdown Threshold", channel: "Web", status: "Delivered", message: "Strategy arb_basis_01 drawdown hit -2.1% (threshold: -2%)" },
  { id: "n12", timestamp: "2026-03-28 10:30:15", alertType: "Drawdown Threshold", channel: "Telegram", status: "Failed", message: "Strategy arb_basis_01 drawdown hit -2.1% (threshold: -2%)" },
  { id: "n13", timestamp: "2026-03-28 09:15:00", alertType: "Reconciliation Break", channel: "Email", status: "Delivered", message: "Bybit position mismatch: expected 1.2 BTC, found 1.15 BTC" },
  { id: "n14", timestamp: "2026-03-28 08:00:00", alertType: "Strategy Signal Generated", channel: "Web", status: "Delivered", message: "Long signal on SOL-PERP from mean_reversion_v2" },
  { id: "n15", timestamp: "2026-03-28 07:30:22", alertType: "Liquidation Risk", channel: "Push", status: "Delivered", message: "Health factor 1.12 on Aave ETH/USDC position (threshold: 1.15)" },
];

// ── Severity Badge ────────────────────────────────────────────────────────────

function SeverityBadge({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    Critical: "bg-red-500/10 text-red-400 border-red-500/30",
    High: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    Medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Low: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    Info: "bg-slate-500/10 text-slate-400 border-slate-500/30",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[severity]}`}>
      {severity}
    </Badge>
  );
}

// ── Delivery Status Badge ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const config: Record<DeliveryStatus, { icon: React.ElementType; className: string }> = {
    Delivered: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
    Failed: { icon: XCircle, className: "bg-red-500/10 text-red-400 border-red-500/30" },
    Pending: { icon: Clock, className: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  };
  const { icon: Icon, className } = config[status];
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${className}`}>
      <Icon className="size-3" />
      {status}
    </Badge>
  );
}

// ── Channels Tab ──────────────────────────────────────────────────────────────

function ChannelsTab({
  channels,
  setChannels,
}: {
  channels: ChannelState;
  setChannels: React.Dispatch<React.SetStateAction<ChannelState>>;
}) {
  const [emailAddress, setEmailAddress] = React.useState("trader@odum.io");
  const [emailFrequency, setEmailFrequency] = React.useState("immediate");
  const [telegramConnected, setTelegramConnected] = React.useState(false);

  return (
    <div className="space-y-4">
      {/* Web notifications */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Globe className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Web</span>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                    Active
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Browser push notifications for real-time alerts
                </p>
              </div>
            </div>
            <Switch
              checked={channels.web}
              onCheckedChange={(checked) => setChannels((prev) => ({ ...prev, web: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Mail className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Email</span>
                  {channels.email && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Email delivery for alerts, digests, and reports
                </p>
              </div>
            </div>
            <Switch
              checked={channels.email}
              onCheckedChange={(checked) => setChannels((prev) => ({ ...prev, email: checked }))}
            />
          </div>
          {channels.email && (
            <div className="grid grid-cols-2 gap-4 pl-14">
              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="you@example.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Frequency</Label>
                <Select value={emailFrequency} onValueChange={setEmailFrequency}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="digest">Digest (every 15 min)</SelectItem>
                    <SelectItem value="daily">Daily Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Push (mobile) */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Smartphone className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Push</span>
                  <Badge variant="secondary" className="text-[10px]">
                    2 devices
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mobile push notifications via the Odum Research app
                </p>
              </div>
            </div>
            <Switch
              checked={channels.push}
              onCheckedChange={(checked) => setChannels((prev) => ({ ...prev, push: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardContent className="py-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Send className="size-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Telegram</span>
                  {telegramConnected ? (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Not connected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Receive alerts via Telegram bot
                </p>
              </div>
            </div>
            <Switch
              checked={channels.telegram}
              onCheckedChange={(checked) => setChannels((prev) => ({ ...prev, telegram: checked }))}
            />
          </div>
          {channels.telegram && !telegramConnected && (
            <div className="pl-14 space-y-3">
              <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Send <code className="bg-muted px-1.5 py-0.5 rounded text-xs">/start odum_abc123def456</code> to{" "}
                  <span className="text-foreground font-medium">@OdumResearchBot</span> on Telegram
                </p>
                <p className="text-xs text-muted-foreground">
                  This will link your Telegram account to receive trading alerts
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setTelegramConnected(true);
                  toast({ title: "Telegram connected", description: "Bot linked to your account." });
                }}
              >
                <CheckCircle2 className="size-4 mr-1" /> I have sent the command
              </Button>
            </div>
          )}
          {channels.telegram && telegramConnected && (
            <div className="pl-14">
              <p className="text-xs text-muted-foreground">
                Connected to <span className="text-foreground">@trader_john</span> via{" "}
                <span className="text-foreground">@OdumResearchBot</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Alert Rules Tab ───────────────────────────────────────────────────────────

function AlertRulesTab() {
  const [rules, setRules] = React.useState<AlertRule[]>(INITIAL_ALERT_RULES);

  function toggleRule(index: number, channel: keyof ChannelState) {
    setRules((prev) =>
      prev.map((rule, i) => (i === index ? { ...rule, [channel]: !rule[channel] } : rule)),
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Per-Alert Channel Routing</CardTitle>
          <CardDescription>
            Toggle which channels receive each alert type. Critical alerts are recommended on all channels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Alert Type</TableHead>
                <TableHead className="w-[90px]">Severity</TableHead>
                <TableHead className="w-[70px] text-center">Web</TableHead>
                <TableHead className="w-[70px] text-center">Email</TableHead>
                <TableHead className="w-[70px] text-center">Push</TableHead>
                <TableHead className="w-[70px] text-center">Telegram</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule, idx) => (
                <TableRow key={rule.name}>
                  <TableCell className="text-sm font-medium">{rule.name}</TableCell>
                  <TableCell>
                    <SeverityBadge severity={rule.severity} />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.web}
                      onCheckedChange={() => toggleRule(idx, "web")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.email}
                      onCheckedChange={() => toggleRule(idx, "email")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.push}
                      onCheckedChange={() => toggleRule(idx, "push")}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={rule.telegram}
                      onCheckedChange={() => toggleRule(idx, "telegram")}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          onClick={() =>
            toast({ title: "Rules saved", description: "Alert routing rules updated successfully." })
          }
        >
          <CheckCircle2 className="size-4 mr-1" /> Save Rules
        </Button>
      </div>
    </div>
  );
}

// ── Devices Tab ───────────────────────────────────────────────────────────────

function DevicesTab() {
  const [devices, setDevices] = React.useState<RegisteredDevice[]>(INITIAL_DEVICES);

  function removeDevice(id: string) {
    setDevices((prev) => prev.filter((d) => d.id !== id));
    toast({ title: "Device removed", description: "Push notifications disabled for this device." });
  }

  return (
    <div className="space-y-6">
      {/* Registered devices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Registered Devices</CardTitle>
          <CardDescription>
            Devices linked to receive mobile push notifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {devices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Smartphone className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{device.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {device.platform}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastActive}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => removeDevice(device.id)}
                      >
                        <Trash2 className="size-4 mr-1" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Smartphone className="size-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No devices registered</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register new device */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Register New Device</CardTitle>
          <CardDescription>
            Download the Odum Research app from the App Store or Google Play.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-8">
            <div className="text-center space-y-3">
              <div className="mx-auto flex size-32 items-center justify-center rounded-lg bg-muted border border-border">
                <QrCode className="size-16 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                Scan with Odum Research mobile app
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Open the app, go to Settings, and tap &ldquo;Link to Dashboard&rdquo; to scan this code.
          </p>
        </CardContent>
      </Card>

      {/* Test push */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Monitor className="size-5 text-primary" />
              </div>
              <div>
                <span className="font-medium text-sm">Push Notification Test</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send a test notification to all registered devices
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast({
                  title: "Test push sent",
                  description: `Sent to ${devices.length} device(s). Check your mobile.`,
                })
              }
              disabled={devices.length === 0}
            >
              <Bell className="size-4 mr-1" /> Send Test Push
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const [channelFilter, setChannelFilter] = React.useState<string>("all");

  const filtered =
    channelFilter === "all"
      ? MOCK_HISTORY
      : MOCK_HISTORY.filter((entry) => entry.channel === channelFilter);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Delivery Log</CardTitle>
              <CardDescription>
                Recent notification delivery attempts across all channels.
              </CardDescription>
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All channels</SelectItem>
                <SelectItem value="Web">Web</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Push">Push</SelectItem>
                <SelectItem value="Telegram">Telegram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead className="w-[180px]">Alert Type</TableHead>
                <TableHead className="w-[90px]">Channel</TableHead>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {entry.timestamp}
                  </TableCell>
                  <TableCell className="text-sm">{entry.alertType}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {entry.channel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                    {entry.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationSettingsPage() {
  const [channels, setChannels] = React.useState<ChannelState>(DEFAULT_CHANNELS);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Bell className="size-6" /> Notification Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure alert delivery channels, routing rules, and registered devices.
        </p>
      </div>

      <Tabs defaultValue="channels">
        <TabsList>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="rules">Alert Rules</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <ChannelsTab channels={channels} setChannels={setChannels} />
        </TabsContent>

        <TabsContent value="rules">
          <AlertRulesTab />
        </TabsContent>

        <TabsContent value="devices">
          <DevicesTab />
        </TabsContent>

        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
