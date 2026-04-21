export function formatInstructionTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  });
}

export function getInstructionStatusColor(status: string): string {
  switch (status) {
    case "FILLED":
      return "text-emerald-400";
    case "PARTIAL_FILL":
      return "text-amber-400";
    case "REJECTED":
      return "text-rose-400";
    default:
      return "text-muted-foreground";
  }
}

export function getInstructionConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return "text-emerald-400";
  if (confidence >= 0.7) return "text-amber-400";
  return "text-rose-400";
}

export function getInstructionSlippageColor(bps: number): string {
  if (bps <= 2) return "text-emerald-400";
  if (bps <= 5) return "text-amber-400";
  return "text-rose-400";
}

export function getInstructionOperationBadgeVariant(
  opType: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (["TRADE", "SWAP"].includes(opType)) return "default";
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "destructive";
  if (["STAKE", "LEND", "ADD_LIQUIDITY"].includes(opType)) return "secondary";
  return "outline";
}
