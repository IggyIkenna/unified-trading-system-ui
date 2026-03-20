"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Briefcase,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingUp,
  FileText,
  CheckCircle2,
  PieChart,
  BarChart3,
} from "lucide-react"

export default function InvestmentServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Odum Research</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Investment Management</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <div className="mb-12 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-rose-400/10">
              <Briefcase className="size-8 text-rose-400" />
            </div>
            <Badge variant="outline" className="mb-4">FCA Authorised</Badge>
            <h1 className="text-3xl font-bold">Investment Management</h1>
            <p className="mt-2 text-lg text-muted-foreground">
              FCA-authorised investment management for Professional clients. Co-invest at same terms as house.
            </p>
          </div>

          {/* Key Features */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <Shield className="size-8 text-rose-400 mb-2" />
                <CardTitle className="text-base">FCA Regulated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Full FCA authorisation (FRN 975797) with segregated client accounts and investor protections
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <PieChart className="size-8 text-amber-400 mb-2" />
                <CardTitle className="text-base">SMA or Fund Access</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Invest via Separately Managed Account (SMA) with custom parameters, or access fund structure through our affiliate
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <TrendingUp className="size-8 text-emerald-400 mb-2" />
                <CardTitle className="text-base">Same Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Co-invest alongside Odum principals at identical fee terms and execution quality
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Performance Preview */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Sample Strategy Performance</CardTitle>
              <CardDescription>Live performance since February 2026</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center mb-6">
                <div>
                  <div className="text-2xl font-bold text-emerald-400">+34.2%</div>
                  <div className="text-xs text-muted-foreground">Since Feb 2026</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">2.8</div>
                  <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-400">-3.8%</div>
                  <div className="text-xs text-muted-foreground">Max Drawdown</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">0.08</div>
                  <div className="text-xs text-muted-foreground">Correlation to SPX</div>
                </div>
              </div>
              {/* Time Series Chart */}
              <div className="h-[200px] w-full bg-muted/30 rounded-lg p-4">
                <svg viewBox="0 0 400 150" className="w-full h-full">
                  {/* Grid lines */}
                  <line x1="40" y1="20" x2="40" y2="130" stroke="var(--border)" strokeWidth="1" />
                  <line x1="40" y1="130" x2="390" y2="130" stroke="var(--border)" strokeWidth="1" />
                  <line x1="40" y1="75" x2="390" y2="75" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                  <line x1="40" y1="20" x2="390" y2="20" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" opacity="0.5" />
                  
                  {/* Y-axis labels */}
                  <text x="35" y="25" fontSize="10" fill="var(--muted-foreground)" textAnchor="end">40%</text>
                  <text x="35" y="77" fontSize="10" fill="var(--muted-foreground)" textAnchor="end">20%</text>
                  <text x="35" y="133" fontSize="10" fill="var(--muted-foreground)" textAnchor="end">0%</text>
                  
                  {/* X-axis labels */}
                  <text x="40" y="145" fontSize="10" fill="var(--muted-foreground)">Feb</text>
                  <text x="215" y="145" fontSize="10" fill="var(--muted-foreground)" textAnchor="middle">Mar</text>
                  <text x="390" y="145" fontSize="10" fill="var(--muted-foreground)" textAnchor="end">Today</text>
                  
                  {/* Performance line - Feb to Mar showing growth to 34.2% */}
                  <path 
                    d="M 40 130 Q 80 125, 120 115 T 180 95 T 240 70 T 300 55 T 360 40 L 390 36" 
                    fill="none" 
                    stroke="#4ade80" 
                    strokeWidth="2"
                  />
                  <path 
                    d="M 40 130 Q 80 125, 120 115 T 180 95 T 240 70 T 300 55 T 360 40 L 390 36 L 390 130 L 40 130 Z" 
                    fill="url(#greenGradient)" 
                    opacity="0.2"
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#4ade80" />
                      <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Current value marker */}
                  <circle cx="390" cy="36" r="4" fill="#4ade80" />
                  <text x="375" y="28" fontSize="11" fill="#4ade80" fontWeight="bold">+34.2%</text>
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Fee Structure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span>Management Fee</span>
                <span className="font-mono font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <div>
                  <span>Performance Fee</span>
                  <span className="text-xs text-muted-foreground ml-2">(varies by strategy)</span>
                </div>
                <span className="font-mono font-medium">20-40% (HWM)</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border">
                <span>Minimum Investment</span>
                <span className="font-mono font-medium">$100,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Redemption Notice</span>
                <span className="font-mono font-medium">30 days</span>
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <FileText className="size-5" />
              Investor Requirements
            </h3>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Professional Client or Eligible Counterparty
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Completed investor suitability assessment
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                KYC/AML documentation
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-emerald-400" />
                Signed subscription agreement
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              View your portfolio performance, NAV, and monthly reports in the Executive dashboard.
            </p>
            <Button size="lg" asChild>
              <Link href="/login?redirect=/executive">
                Sign In to View Investor Portal
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
