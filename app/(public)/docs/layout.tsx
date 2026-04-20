import { BriefingAccessGate } from "@/components/briefings/briefing-access-gate";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <BriefingAccessGate>{children}</BriefingAccessGate>;
}
