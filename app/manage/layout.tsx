import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Manage | Unified Trading Platform",
  description: "Client management, mandates, fees, and organisational settings",
}

interface ManageLayoutProps {
  children: React.ReactNode
}

export default function ManageLayout({ children }: ManageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
