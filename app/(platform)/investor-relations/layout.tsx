"use client";

/**
 * Investor Relations layout — presentations have their own header/nav,
 * so we render them full-screen overlaying the platform shell.
 * Auth is still enforced by the parent (platform) layout.
 */
export default function InvestorRelationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      {children}
    </div>
  );
}
