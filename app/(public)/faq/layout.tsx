import { BriefingAccessGate } from "@/components/briefings/briefing-access-gate";

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <BriefingAccessGate>{children}</BriefingAccessGate>;
}
