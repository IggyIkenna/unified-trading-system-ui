import { BriefingAccessGate } from "@/components/briefings/briefing-access-gate";
import { BriefingsAccessBadge } from "@/components/briefings/briefings-access-badge";

export default function BriefingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <BriefingAccessGate>
      {/* Once the gate has unlocked, show a small "Access granted · Sign out
          of Deep Dive" strip. Tells the user clearly they're inside the
          gated area + gives them a one-click way to clear the localStorage
          flag. Visible on every /briefings/* page. */}
      <BriefingsAccessBadge />
      {children}
    </BriefingAccessGate>
  );
}
