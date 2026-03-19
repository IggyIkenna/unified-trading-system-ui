import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odum Research Ltd | Trading Strategies | England, UK",
  description:
    "Odum Research Ltd are software providers that drive trading strategies. Contact us to find out more about our ethos and our team: info@odum-research.com",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-white text-neutral-900 antialiased`}
      >
        <NavBar />
        <main className="min-h-screen overflow-x-hidden pt-[53px] sm:pt-[60px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
