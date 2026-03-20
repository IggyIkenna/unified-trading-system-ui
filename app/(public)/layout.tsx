import Link from "next/link"
import { SiteHeader } from "@/components/shell/site-header"

/**
 * Public shell — unauthenticated pages (landing, login, signup, docs, etc.)
 * Header + CTA + footer. No auth required.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      <footer className="border-t border-border py-8">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Odum Research Ltd. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/compliance" className="hover:text-foreground transition-colors">FCA 975797</Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
