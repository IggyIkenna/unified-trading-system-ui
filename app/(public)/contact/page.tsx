"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Mail,
  MapPin,
  Phone,
  Send,
  CheckCircle2,
  Building2,
  MessageSquare,
} from "lucide-react"
import { SiteHeader } from "@/components/shell/site-header"

export default function ContactPage() {
  const [submitted, setSubmitted] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    company: "",
    inquiry: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock submission
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="container px-4 py-16 md:px-6">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Get in touch with our team. We typically respond within 24 hours.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <Mail className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Email</CardTitle>
                </CardHeader>
                <CardContent>
                  <a 
                    href="mailto:info@odum-research.co.uk" 
                    className="text-sm text-primary hover:underline"
                  >
                    info@odum-research.co.uk
                  </a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <Building2 className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Registered Office</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Odum Research Ltd<br />
                    London, United Kingdom
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">FCA 975797</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <MessageSquare className="size-6 text-primary mb-2" />
                  <CardTitle className="text-base">Inquiry Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Data API access
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Backtesting services
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Platform licensing
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Investment management
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Regulatory services
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    Partnership opportunities
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we will get back to you shortly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                      <CheckCircle2 className="size-6 text-emerald-500" />
                    </div>
                    <h3 className="text-lg font-semibold">Message Sent</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Thank you for reaching out. We will respond to your inquiry within 24 hours.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6"
                      onClick={() => {
                        setSubmitted(false)
                        setFormData({ name: "", email: "", company: "", inquiry: "", message: "" })
                      }}
                    >
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input 
                          id="name" 
                          placeholder="John Smith"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@company.com"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input 
                          id="company" 
                          placeholder="Company Name"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="inquiry">Inquiry Type *</Label>
                        <Select 
                          value={formData.inquiry} 
                          onValueChange={(value) => setFormData({ ...formData, inquiry: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select inquiry type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="data">Data API Access</SelectItem>
                            <SelectItem value="backtesting">Backtesting Services</SelectItem>
                            <SelectItem value="execution">Execution Services</SelectItem>
                            <SelectItem value="platform">Platform Licensing</SelectItem>
                            <SelectItem value="investment">Investment Management</SelectItem>
                            <SelectItem value="regulatory">Regulatory Services (AR)</SelectItem>
                            <SelectItem value="partnership">Partnership</SelectItem>
                            <SelectItem value="support">Technical Support</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us about your requirements, use case, or questions..."
                        rows={6}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        * Required fields
                      </p>
                      <Button type="submit">
                        <Send className="mr-2 size-4" />
                        Send Message
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Alternative Contact */}
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Prefer to email directly? Reach us at{" "}
              <a href="mailto:info@odum-research.co.uk" className="text-primary hover:underline">
                info@odum-research.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-background mt-16">
        <div className="container px-4 py-12 md:px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/images/odum-logo.png" alt="Odum Research" className="size-5" />
              <span className="font-semibold">Odum Research Ltd</span>
              <Badge variant="outline" className="text-xs">FCA 975797</Badge>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms</Link>
              <Link href="/compliance" className="hover:text-foreground">Compliance</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              Professional & Eligible Counterparty clients only
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
