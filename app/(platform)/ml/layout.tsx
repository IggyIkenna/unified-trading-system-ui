// Force dynamic rendering for all ML pages to prevent static generation issues
// with client-side hooks like usePathname
export const dynamic = "force-dynamic"

export default function MLLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
