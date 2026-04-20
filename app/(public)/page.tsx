import type { Metadata } from "next";
import { MarketingStaticFromFile } from "@/components/marketing/marketing-static-from-file";

export const metadata: Metadata = {
  title: "Odum Research — FCA-Regulated Investment Manager & Trading Platform",
  description:
    "Five commercial paths on one regulated operating system: Investment Management, DART Signals-In, DART Full, Signals Service (Signals-Out), and Regulatory Umbrella.",
};

export default function PublicHomePage() {
  return <MarketingStaticFromFile file="homepage.html" />;
}
