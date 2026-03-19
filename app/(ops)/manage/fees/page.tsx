"use client"

/**
 * Manage > Fees Page
 * 
 * Fee structure and billing management - one of the high-value Manage pages.
 * Lifecycle Stage: Manage
 * Domain Lanes: Capital
 */

import * as React from "react"
import { GlobalNavBar } from "@/components/trading/global-nav-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  FileText,
  CreditCard,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Mock billing data
const revenueByProduct = [
  { product: "Data Provision", clients: 12, mrr: 8500, growth: 15.2 },
  { product: "Backtesting", clients: 8, mrr: 3200, growth: 22.5 },
  { product: "Execution Services", clients: 4, alphaGenerated: 145000, performanceFee: 43500, growth: 8.3 },
  { product: "Regulatory (AR)", clients: 2, mrr: 8000, growth: 0 },
  { product: "Investment Management", clients: 3, aum: 25700000, performanceFee: 180000, growth: 34.2 },
  { product: "Platform License", clients: 1, mrr: 25000, growth: 0 },
]

const recentInvoices = [
  { id: "INV-2026-0318", client: "Alpha Capital Partners", amount: 52000, type: "performance", status: "paid", date: "2026-03-15" },
  { id: "INV-2026-0317", client: "Nordic Quant Fund", amount: 12500, type: "performance", status: "pending", date: "2026-03-10" },
  { id: "INV-2026-0316", client: "Meridian Research", amount: 499, type: "subscription", status: "paid", date: "2026-03-01" },
  { id: "INV-2026-0315", client: "Vertex Trading Ltd", amount: 4000, type: "subscription", status: "paid", date: "2026-03-01" },
  { id: "INV-2026-0314", client: "Pacific Investments", amount: 0, type: "setup", status: "waived", date: "2026-03-01" },
]

const feeSchedules = [
  { tier: "Data Only", mgmtFee: "-", perfFee: "-", subscription: "$499-2,499/mo", notes: "Volume discounts available" },
  { tier: "Backtesting", mgmtFee: "-", perfFee: "-", subscription: "$199-999/mo", notes: "Compute credits model" },
  { tier: "Execution Only", mgmtFee: "-", perfFee: "30% of alpha", subscription: "-", notes: "20% at $10M+ volume" },
  { tier: "Full Platform", mgmtFee: "-", perfFee: "Varies", subscription: "Custom", notes: "White-label pricing" },
  { tier: "Investment Mgmt", mgmtFee: "0%", perfFee: "20-35%", subscription: "-", notes: "High-water mark" },
  { tier: "Regulatory (AR)", mgmtFee: "-", perfFee: "-", subscription: "GBP 4k/mo", notes: "GBP 10k setup" },
]

const statusColors: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  overdue: "text-destructive bg-destructive/10 border-destructive/30",
  waived: "text-muted-foreground bg-muted/50 border-muted",
}

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

export default function ManageFeesPage() {
  // Calculate totals
  const totalMRR = revenueByProduct.reduce((sum, p) => sum + (p.mrr || 0), 0)
  const totalPerformanceFees = revenueByProduct.reduce((sum, p) => sum + (p.performanceFee || 0), 0)
  const totalClients = revenueByProduct.reduce((sum, p) => sum + p.clients, 0)
  const pendingAmount = recentInvoices
    .filter(i => i.status === "pending")
    .reduce((sum, i) => sum + i.amount, 0)

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavBar />
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Fees & Billing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Revenue tracking, invoicing, and fee schedule management
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Export
            </Button>
            <Button className="gap-2">
              <FileText className="size-4" />
              Generate Invoice
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="size-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalMRR)}</div>
                  <div className="text-xs text-muted-foreground">Monthly Recurring</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-400/10">
                  <TrendingUp className="size-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(totalPerformanceFees)}</div>
                  <div className="text-xs text-muted-foreground">Performance Fees (MTD)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-400/10">
                  <Clock className="size-5 text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
                  <div className="text-xs text-muted-foreground">Pending Collection</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-400/10">
                  <Building2 className="size-5 text-violet-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{totalClients}</div>
                  <div className="text-xs text-muted-foreground">Paying Clients</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue by Product</TabsTrigger>
            <TabsTrigger value="invoices">Recent Invoices</TabsTrigger>
            <TabsTrigger value="schedule">Fee Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Product Line</CardTitle>
                <CardDescription>Monthly breakdown across all service offerings</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Clients</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                      <TableHead className="text-right">Performance Fees</TableHead>
                      <TableHead className="text-right">Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueByProduct.map((product) => (
                      <TableRow key={product.product}>
                        <TableCell className="font-medium">{product.product}</TableCell>
                        <TableCell className="text-center">{product.clients}</TableCell>
                        <TableCell className="text-right font-mono">
                          {product.mrr ? formatCurrency(product.mrr) : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {product.performanceFee ? formatCurrency(product.performanceFee) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm",
                            product.growth > 0 ? "text-emerald-400" : product.growth < 0 ? "text-destructive" : "text-muted-foreground"
                          )}>
                            {product.growth > 0 ? (
                              <ArrowUpRight className="size-3" />
                            ) : product.growth < 0 ? (
                              <ArrowDownRight className="size-3" />
                            ) : null}
                            {product.growth !== 0 ? `${product.growth > 0 ? "+" : ""}${product.growth}%` : "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Last 30 days of billing activity</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell className="capitalize text-sm text-muted-foreground">{invoice.type}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-xs capitalize", statusColors[invoice.status])}>
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{invoice.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Fee Schedule</CardTitle>
                <CardDescription>Standard fee structures by service tier</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead>Management Fee</TableHead>
                      <TableHead>Performance Fee</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeSchedules.map((schedule) => (
                      <TableRow key={schedule.tier}>
                        <TableCell className="font-medium">{schedule.tier}</TableCell>
                        <TableCell>{schedule.mgmtFee}</TableCell>
                        <TableCell>{schedule.perfFee}</TableCell>
                        <TableCell>{schedule.subscription}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{schedule.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
