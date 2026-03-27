export function getOperationColor(opType: string): string {
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "text-amber-400";
  if (["SWAP", "TRADE"].includes(opType)) return "text-sky-400";
  if (["LEND", "BORROW", "REPAY", "WITHDRAW"].includes(opType)) return "text-violet-400";
  if (["STAKE", "UNSTAKE"].includes(opType)) return "text-emerald-400";
  if (["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"].includes(opType)) return "text-cyan-400";
  if (
    ["BET", "CANCEL_BET", "SPORTS_EXCHANGE", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER", "PREDICTION_BET"].includes(opType)
  )
    return "text-orange-400";
  if (["OPTIONS_COMBO", "FUTURES_ROLL"].includes(opType)) return "text-pink-400";
  return "text-muted-foreground";
}

export function getOperationBadgeClass(opType: string): string {
  if (["FLASH_BORROW", "FLASH_REPAY"].includes(opType)) return "border-amber-500/50 text-amber-400";
  if (["SWAP", "TRADE"].includes(opType)) return "border-sky-500/50 text-sky-400";
  if (["LEND", "BORROW", "REPAY", "WITHDRAW"].includes(opType)) return "border-violet-500/50 text-violet-400";
  if (["STAKE", "UNSTAKE"].includes(opType)) return "border-emerald-500/50 text-emerald-400";
  if (["ADD_LIQUIDITY", "REMOVE_LIQUIDITY", "COLLECT_FEES"].includes(opType)) return "border-cyan-500/50 text-cyan-400";
  if (
    ["BET", "CANCEL_BET", "SPORTS_EXCHANGE", "SPORTS_BET", "SPORTS_EXCHANGE_ORDER", "PREDICTION_BET"].includes(opType)
  )
    return "border-orange-500/50 text-orange-400";
  if (["OPTIONS_COMBO", "FUTURES_ROLL"].includes(opType)) return "border-pink-500/50 text-pink-400";
  return "";
}
