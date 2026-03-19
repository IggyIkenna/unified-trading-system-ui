import { GlobalNavBar } from "@/components/trading/global-nav-bar"

export default function ExecutionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <GlobalNavBar />
      {children}
    </div>
  )
}
