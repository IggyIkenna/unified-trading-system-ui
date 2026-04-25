import { BriefingAccessGate } from "@/components/briefings/briefing-access-gate";

export default function OurStoryLayout({ children }: { children: React.ReactNode }) {
  return <BriefingAccessGate>{children}</BriefingAccessGate>;
}
