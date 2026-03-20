"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const NAV_ITEMS = [
  { href: "/", label: "Platform" },
  { href: "/engagement-models", label: "Engagement Models" },
  { href: "/docs", label: "Documentation" },
  { href: "/investor-relations", label: "Investor Relations" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img 
            src="/images/odum-logo.png" 
            alt="Odum Research" 
            className="size-9"
          />
          <div>
            <span className="text-lg font-semibold">Odum Research</span>
            <Badge variant="outline" className="ml-2 text-xs">FCA 975797</Badge>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm transition-colors hover:text-foreground",
                pathname === item.href
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hidden sm:block">
            Sign In
          </Link>
          <Button size="sm" asChild>
            <Link href="/contact">Get Access</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
