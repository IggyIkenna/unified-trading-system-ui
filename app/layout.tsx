import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ExecutionModeProvider } from "@/lib/execution-mode-context";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";
import { StagingGate } from "@/components/staging-gate";
import { PreviewBanner } from "@/components/preview-banner";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Odum Research - Unified Trading Infrastructure",
  description:
    "Institutional-grade trading command center with real-time P&L, risk attribution, and strategy analytics",
  metadataBase: new URL("https://odum-research.co.uk"),
  openGraph: {
    title: "Odum Research",
    description:
      "Institutional-grade trading command center with real-time P&L, risk attribution, and strategy analytics",
    siteName: "Odum Research",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Odum Research",
    description:
      "Institutional-grade trading command center with real-time P&L, risk attribution, and strategy analytics",
  },
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <StagingGate>
          <PreviewBanner />
          <Providers>
            <ExecutionModeProvider>{children}</ExecutionModeProvider>
          </Providers>
        </StagingGate>
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
