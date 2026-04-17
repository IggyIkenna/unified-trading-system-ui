import { PreviewBanner } from "@/components/preview-banner";
import { RuntimeModeBadge } from "@/components/runtime-mode-badge";
import { StagingGate } from "@/components/staging-gate";
import { ProtocolIndicator } from "@/components/ui/protocol-indicator";
import { Toaster } from "@/components/ui/sonner";
import { ExecutionModeProvider } from "@/lib/execution-mode-context";
import { Providers } from "@/lib/providers";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://odumresearch.com"),
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
        url: "/favicon-odum-leaf-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/favicon-odum-leaf-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/favicon-odum-leaf-180x180.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#f8f9fa" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${ibmPlexSans.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <StagingGate>
            <PreviewBanner />
            <Providers>
              <ExecutionModeProvider>{children}</ExecutionModeProvider>
            </Providers>
          </StagingGate>
          <RuntimeModeBadge />
          <ProtocolIndicator />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
