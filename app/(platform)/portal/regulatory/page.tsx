"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  Download,
  Calendar,
  User,
  Building2,
  Scale,
  AlertTriangle,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
} from "lucide-react"

// Mock AR status
const mockARStatus = {
  status: "active",
  reference: "AR-975797-001",
  startDate: "March 15, 2024",
  annualReview: "March 15, 2026",
  principalFirm: "Odum Research Ltd",
  principalRef: "975797",
  mlro: "Jack Concanon",
}

// Mock compliance tasks
const mockComplianceTasks = [
  { id: 1, task: "Q1 2026 Compliance Report", due: "April 15, 2026", status: "upcoming", priority: "high" },
  { id: 2, task: "Annual AML Training Certification", due: "May 1, 2026", status: "upcoming", priority: "medium" },
  { id: 3, task: "Transaction Reporting (MiFID II)", due: "T+1", status: "automated", priority: "low" },
  { id: 4, task: "Best Execution Review", due: "Quarterly", status: "automated", priority: "low" },
]

// Mock documents
const mockDocuments = [
  { name: "AR Agreement", type: "Contract", date: "Mar 15, 2024", status: "signed", category: "legal" },
  { name: "Compliance Manual", type: "Policy", date: "Jan 1, 2026", status: "current", category: "compliance" },
  { name: "AML/KYC Procedures", type: "Policy", date: "Jan 1, 2026", status: "current", category: "compliance" },
  { name: "Best Execution Policy", type: "Policy", date: "Jan 1, 2026", status: "current", category: "compliance" },
  { name: "Q4 2025 Compliance Report", type: "Report", date: "Jan 15, 2026", status: "filed", category: "reporting" },
  { name: "2025 Annual Review", type: "Report", date: "Feb 1, 2026", status: "filed", category: "reporting" },
  { name: "Financial Promotions Log", type: "Register", date: "Ongoing", status: "current", category: "compliance" },
]

// Mock FCA activities
const mockActivities = [
  { activity: "Arranging (bringing about) deals in investments", covered: true },
  { activity: "Dealing in investments as agent", covered: true },
  { activity: "Making arrangements with a view to transactions", covered: true },
  { activity: "Managing investments", covered: true, note: "Professional clients only" },
]

// Mock transaction reports
const mockReports = [
  { period: "March 2026 (MTD)", transactions: 847, reported: 847, status: "complete" },
  { period: "February 2026", transactions: 2134, reported: 2134, status: "filed" },
  { period: "January 2026", transactions: 1892, reported: 1892, status: "filed" },
  { period: "Q4 2025", transactions: 5421, reported: 5421, status: "filed" },
]

export default function RegulatoryPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center gap-4 px-4 md:px-6">
          <Link href="/portal/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-slate-400/10">
              <Shield className="size-4 text-slate-400" />
            </div>
            <span className="font-semibold">Regulatory Umbrella</span>
          </div>
          <Badge variant="outline" className="ml-auto text-emerald-500 border-emerald-500/30">
            <CheckCircle2 className="mr-1 size-3" />
            Active AR
          </Badge>
        </div>
      </header>

      <main className="container px-4 py-6 md:px-6">
        {/* AR Status Banner */}
        <Card className="border-slate-400/30 bg-gradient-to-r from-slate-400/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-xl bg-slate-400/10">
                  <Shield className="size-8 text-slate-400" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Appointed Representative Status</div>
                  <div className="text-2xl font-bold">Active</div>
                  <div className="text-sm text-muted-foreground">
                    Reference: {mockARStatus.reference} | Since {mockARStatus.startDate}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <div className="text-muted-foreground">Principal Firm</div>
                  <div className="font-medium">{mockARStatus.principalFirm}</div>
                  <div className="text-xs text-muted-foreground">FRN {mockARStatus.principalRef}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">MLRO</div>
                  <div className="font-medium">{mockARStatus.mlro}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Annual Review</div>
                  <div className="font-medium">{mockARStatus.annualReview}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Compliance Score</span>
                <CheckCircle2 className="size-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-bold text-emerald-500">100%</div>
              <div className="mt-1 text-xs text-muted-foreground">All obligations met</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Tasks</span>
                <Clock className="size-4 text-amber-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">2</div>
              <div className="mt-1 text-xs text-muted-foreground">Due within 60 days</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transactions MTD</span>
                <Scale className="size-4 text-sky-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">847</div>
              <div className="mt-1 text-xs text-muted-foreground">100% reported</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Documents</span>
                <FileText className="size-4 text-violet-500" />
              </div>
              <div className="mt-2 text-2xl font-bold">12</div>
              <div className="mt-1 text-xs text-muted-foreground">All current</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="reporting">Reporting</TabsTrigger>
            <TabsTrigger value="contact">Support</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Compliance Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance Tasks</CardTitle>
                  <CardDescription>Upcoming obligations and deadlines</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockComplianceTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          task.status === "upcoming" && task.priority === "high" && "border-amber-500/30 bg-amber-500/5",
                          task.status === "automated" && "border-border bg-muted/30"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {task.status === "automated" ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : task.priority === "high" ? (
                            <AlertCircle className="size-4 text-amber-500" />
                          ) : (
                            <Clock className="size-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium text-sm">{task.task}</div>
                            <div className="text-xs text-muted-foreground">Due: {task.due}</div>
                          </div>
                        </div>
                        <Badge
                          variant={task.status === "automated" ? "secondary" : "outline"}
                          className={cn(
                            task.status === "upcoming" && task.priority === "high" && "text-amber-500 border-amber-500/30"
                          )}
                        >
                          {task.status === "automated" ? "Automated" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Covered Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">FCA Regulated Activities</CardTitle>
                  <CardDescription>Activities covered under your AR agreement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockActivities.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <CheckCircle2 className="size-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium">{activity.activity}</div>
                          {activity.note && (
                            <div className="text-xs text-muted-foreground mt-0.5">{activity.note}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg border border-dashed">
                    <div className="text-sm text-muted-foreground">
                      <strong>Client restriction:</strong> Professional & Eligible Counterparty clients only. No retail clients permitted under this AR arrangement.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Document Centre</CardTitle>
                  <CardDescription>Policies, procedures, and compliance documents</CardDescription>
                </div>
                <Button size="sm">
                  <Upload className="mr-2 size-4" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockDocuments.map((doc, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell className="text-muted-foreground">{doc.type}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs capitalize">{doc.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{doc.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              doc.status === "current" && "text-emerald-500 border-emerald-500/30",
                              doc.status === "signed" && "text-sky-500 border-sky-500/30",
                              doc.status === "filed" && "text-slate-500 border-slate-500/30"
                            )}
                          >
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporting */}
          <TabsContent value="reporting" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">MiFID II Transaction Reporting</CardTitle>
                  <CardDescription>Automated T+1 reporting to ARM</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                        <TableHead className="text-right">Reported</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockReports.map((report, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{report.period}</TableCell>
                          <TableCell className="text-right font-mono">{report.transactions.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono">{report.reported.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-emerald-500 border-emerald-500/30">
                              <CheckCircle2 className="mr-1 size-3" />
                              {report.status === "complete" ? "Complete" : "Filed"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Best Execution Reports</CardTitle>
                  <CardDescription>RTS 28 compliance reporting</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">2025 Annual Report</div>
                          <div className="text-sm text-muted-foreground">Published April 30, 2025</div>
                        </div>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="mr-2 size-4" />
                          View
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-dashed">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-muted-foreground">2026 Annual Report</div>
                          <div className="text-sm text-muted-foreground">Due by April 30, 2027</div>
                        </div>
                        <Badge variant="secondary">Upcoming</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact */}
          <TabsContent value="contact" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Compliance Support</CardTitle>
                  <CardDescription>Contact your compliance team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="flex size-12 items-center justify-center rounded-full bg-slate-400/10">
                      <User className="size-6 text-slate-400" />
                    </div>
                    <div>
                      <div className="font-medium">Jack Concanon</div>
                      <div className="text-sm text-muted-foreground">MLRO & Compliance Officer</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="mr-2 size-4" />
                      compliance@odum-research.co.uk
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="mr-2 size-4" />
                      +44 20 XXXX XXXX
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="mr-2 size-4" />
                      Schedule a Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Emergency Contacts</CardTitle>
                  <CardDescription>For urgent compliance matters</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <div className="flex items-center gap-2 text-amber-500 font-medium">
                        <AlertTriangle className="size-4" />
                        Suspicious Activity / Breach
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        If you suspect a breach, fraud, or need to file a SAR, contact the MLRO immediately.
                      </p>
                      <Button variant="outline" className="mt-3" size="sm">
                        Contact MLRO
                      </Button>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="font-medium">FCA Whistleblowing</div>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have the right to report concerns directly to the FCA.
                      </p>
                      <Button variant="ghost" className="mt-2 px-0" size="sm">
                        <ExternalLink className="mr-2 size-4" />
                        FCA Whistleblowing Page
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
