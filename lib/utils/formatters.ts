/**
 * Central number / currency / date formatting for the platform.
 * Prefer these over ad-hoc `.toFixed()` / `.toLocaleString()` in UI code.
 */

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string, decimals: number): Intl.NumberFormat {
  const key = `${currency}:${decimals}`;
  let fmt = currencyFormatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    currencyFormatterCache.set(key, fmt);
  }
  return fmt;
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value: number, currency = "USD", decimals = 2): string {
  return getCurrencyFormatter(currency, decimals).format(value);
}

export function formatPercent(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/** P&L-style signed currency (+/- prefix, e.g. +$1,234.50 / -$340.20). */
export function formatPnl(value: number, currency = "USD", decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "always",
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDate(
  date: Date | string,
  style: "short" | "long" | "relative" | "time" | "calendar" = "short",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";

  if (style === "relative") {
    const now = Date.now();
    const diffMs = d.getTime() - now;
    const abs = Math.abs(diffMs);
    const sec = Math.round(abs / 1000);
    const min = Math.round(abs / 60000);
    const hr = Math.round(abs / 3600000);
    const day = Math.round(abs / 86400000);
    let unit: string;
    let n: number;
    if (sec < 60) {
      unit = "s";
      n = sec;
    } else if (min < 60) {
      unit = "m";
      n = min;
    } else if (hr < 48) {
      unit = "h";
      n = hr;
    } else {
      unit = "d";
      n = day;
    }
    const suffix = diffMs >= 0 ? "from now" : "ago";
    return `${n}${unit} ${suffix}`;
  }

  if (style === "time") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC",
      hour12: false,
    });
  }

  if (style === "long") {
    return d.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    });
  }

  if (style === "calendar") {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  }

  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}
