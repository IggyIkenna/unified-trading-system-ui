/**
 * Deterministic pseudo-random values for demo / mock UI.
 * Safe to call during React render (unlike Math.random / Date.now).
 */
export function mock01(index: number, salt = 0): number {
  let x = Math.imul(index + 1, 374761393) + Math.imul(salt, 668265263);
  x = (x ^ (x >>> 13)) >>> 0;
  x = Math.imul(x, x | 1);
  return (x >>> 0) / 4294967296;
}

export function mockRange(min: number, max: number, index: number, salt = 0): number {
  return min + mock01(index, salt) * (max - min);
}
