const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/** Short number format: 950, 1.23K, 45.6M, 789B. Falls back to 1.23e36 past the suffix list. */
export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '∞';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs < 1000) return sign + Math.floor(abs).toString();
  const tier = Math.floor(Math.log10(abs) / 3);
  if (tier >= SUFFIXES.length) return sign + abs.toExponential(2).replace('+', '');
  const scaled = abs / Math.pow(1000, tier);
  const digits = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
  // Floor so 999.96K never displays as 1000K.
  const factor = Math.pow(10, digits);
  return sign + (Math.floor(scaled * factor) / factor).toFixed(digits) + SUFFIXES[tier];
}

/** Percent with sensible precision: 50%, 3.5%, 0.30%. */
export function formatPercent(p: number): string {
  if (p >= 10) return `${p.toFixed(1)}%`;
  if (p >= 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(3)}%`;
}

export function pickLine(lines: string | readonly string[]): string {
  if (typeof lines === 'string') return lines;
  return lines[Math.floor(Math.random() * lines.length)];
}
