/**
 * Public Layout
 * 
 * Shell for unauthenticated pages: marketing, login, signup, docs, etc.
 * No auth required, minimal header with CTA.
 */

import Link from "next/link"
import { COMPANY } from "@/lib/config"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Public Footer */}
      <footer className="border-t border-border py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {COMPANY.copyright}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
