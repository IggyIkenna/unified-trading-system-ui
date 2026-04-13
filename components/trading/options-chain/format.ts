export function fmtNum(n: number, decimals: number): string {
  return n.toFixed(decimals);
}

export function fmtIv(iv: number): string {
  return `${(iv * 100).toFixed(1)}%`;
}

export function fmtInt(n: number): string {
  return n.toLocaleString();
}
