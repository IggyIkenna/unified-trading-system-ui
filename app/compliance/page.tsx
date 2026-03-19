"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Shield, FileText, Scale, Building2 } from "lucide-react"

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">O</span>
            </div>
            <span className="font-semibold">Odum Research</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/"><ArrowLeft className="size-4 mr-2" />Back</Link>
          </Button>
        </div>
      </header>

      <main className="container px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Shield className="size-3 mr-1" />
            FCA Authorised
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Regulatory Compliance</h1>
          <p className="text-xl text-muted-foreground">
            Odum Research Ltd is authorised and regulated by the Financial Conduct Authority
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="size-8 text-primary" />
                <CardTitle>FCA Registration</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference Number</span>
                <span className="font-mono font-semibold">975797</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Firm Type</span>
                <span className="font-medium">Investment Firm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-emerald-400/10 text-emerald-400">Active</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="size-8 text-primary" />
                <CardTitle>Registered Office</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-muted-foreground">
              <p>Odum Research Ltd</p>
              <p>London, United Kingdom</p>
              <p className="pt-2">
                <span className="text-foreground font-medium">Company Number:</span> Registered in England
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Scale className="size-8 text-primary" />
              <CardTitle>Permitted Activities</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Arranging deals in investments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Making arrangements with a view to transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Managing investments</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Advising on investments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-400" />
                  <span>Dealing in investments as agent</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="size-8 text-primary" />
              <CardTitle>Key Documents</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span>Client Agreement</span>
              <span className="text-sm text-muted-foreground">Available on request</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span>Best Execution Policy</span>
              <span className="text-sm text-muted-foreground">Available on request</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span>Conflicts of Interest Policy</span>
              <span className="text-sm text-muted-foreground">Available on request</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span>Complaints Procedure</span>
              <span className="text-sm text-muted-foreground">Available on request</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>For regulatory inquiries, contact: compliance@odum-research.co.uk</p>
          <p className="mt-2">
            Verify our registration at{" "}
            <a href="https://register.fca.org.uk" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              FCA Register
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
