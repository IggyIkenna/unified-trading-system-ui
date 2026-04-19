import { Badge } from "@/components/ui/badge";
import type { InstrumentTypeV2 } from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";

interface InstrumentTypeChipProps {
  instrumentType: InstrumentTypeV2;
  className?: string;
}

const INSTRUMENT_LABEL: Readonly<Record<InstrumentTypeV2, string>> = {
  spot: "Spot",
  perp: "Perp",
  dated_future: "Dated fut",
  option: "Option",
  lending: "Lending",
  staking: "Staking",
  lp: "LP",
  event_settled: "Event",
};

export function InstrumentTypeChip({
  instrumentType,
  className,
}: InstrumentTypeChipProps) {
  return (
    <Badge
      variant="outline"
      data-testid={`instrument-chip-${instrumentType}`}
      className={cn("font-mono text-[0.65rem]", className)}
    >
      {INSTRUMENT_LABEL[instrumentType]}
    </Badge>
  );
}
