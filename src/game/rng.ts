/** A random number generator returning [0, 1). Math.random fits. */
export type Rng = () => number;

/** Small seedable RNG (mulberry32) so tests and debug runs can be reproduced. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks an entry with probability proportional to its weight. */
export function pickWeighted<T>(entries: T[], weightOf: (entry: T) => number, rng: Rng): T {
  const total = entries.reduce((sum, e) => sum + weightOf(e), 0);
  let roll = rng() * total;
  for (const entry of entries) {
    roll -= weightOf(entry);
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}
