import { GlobalNavBar } from "@/components/trading/global-nav-bar"
import { StrategyPlatformNav } from "@/components/strategy-platform/strategy-nav"

export default function StrategyPlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GlobalNavBar />
      <StrategyPlatformNav />
      {children}
    </div>
  )
}
