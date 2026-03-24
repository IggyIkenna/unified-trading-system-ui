"use client"

import Link from "next/link"
import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface AccessDeniedProps {
  title?: string
  description?: string
}

export function AccessDenied({
  title = "Access Denied",
  description = "You do not have permission to view this page. Contact your administrator to request access.",
}: AccessDeniedProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/20">
            <ShieldX className="size-5 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3 justify-center">
          <Button variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Switch Account</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
