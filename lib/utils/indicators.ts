/**
 * Technical indicators computed from OHLCV candle data.
 * Pure presentation-layer calculations — no external dependencies.
 */

/**
 * Simple Moving Average.
 * Returns null for indices where fewer than `period` data points are available.
 */
export function sma(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < closes.length; i++) {
    sum += closes[i] - closes[i - period];
    result[i] = sum / period;
  }

  return result;
}

/**
 * Exponential Moving Average.
 * Seeded with SMA for the first `period` values; null before that.
 */
export function ema(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period) return result;

  // Seed: SMA of the first `period` values
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += closes[i];
  }
  const seed = sum / period;
  result[period - 1] = seed;

  const multiplier = 2 / (period + 1);
  let prev = seed;

  for (let i = period; i < closes.length; i++) {
    const value = closes[i] * multiplier + prev * (1 - multiplier);
    result[i] = value;
    prev = value;
  }

  return result;
}

/**
 * Bollinger Bands.
 * Middle band = SMA(period). Upper/lower = middle +/- stdDev * population standard deviation.
 * Returns null for indices where fewer than `period` data points are available.
 */
export function bollingerBands(
  closes: number[],
  period: number,
  stdDev: number,
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = sma(closes, period);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const mid = middle[i];
    if (mid === null) continue;

    // Population standard deviation over the window
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - mid;
      sumSq += diff * diff;
    }
    const sd = Math.sqrt(sumSq / period);

    upper[i] = mid + stdDev * sd;
    lower[i] = mid - stdDev * sd;
  }

  return { upper, middle, lower };
}
