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
        <div className="container px-4 md:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Odum Research Ltd. All rights reserved.</p>
          <p className="mt-1">FCA Registered 975797</p>
        </div>
      </footer>
    </>
  )
}
