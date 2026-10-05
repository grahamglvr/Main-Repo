// How stats are labelled and formatted in the UI.
import { BONUS_STATS } from '../data/gear';
import { formatNumber } from '../game/format';
import type { BonusStatId, PlayerStats } from '../game/types';

export const STAT_ROWS: { id: keyof PlayerStats; label: string }[] = [
  { id: 'damage', label: 'Damage' },
  { id: 'health', label: 'Health' },
  { id: 'attackSpeed', label: 'Attack speed' },
  { id: 'critChance', label: 'Crit chance' },
  { id: 'critDamage', label: 'Crit damage' },
  { id: 'regen', label: 'Health regen' },
  { id: 'scrapFind', label: 'Scrap find' },
  { id: 'tokenFind', label: 'Token find' },
  { id: 'luck', label: 'Luck' },
];

const pct = (v: number, dp = 0) => `${(v * 100).toFixed(dp)}%`;

export function formatStat(id: keyof PlayerStats, v: number): string {
  switch (id) {
    case 'damage':
    case 'health':
      return formatNumber(v);
    case 'attackSpeed':
      return `${v.toFixed(2)}/s`;
    case 'critChance':
      return pct(v, 1);
    case 'critDamage':
      return pct(v);
    case 'regen':
      return `${pct(v, 1)}/s`;
    default:
      return `+${pct(v)}`;
  }
}

/** Formats a stat change, e.g. "+12", "+0.15/s", "+2.5%". */
export function formatDelta(id: keyof PlayerStats, d: number): string {
  const sign = d >= 0 ? '+' : '−';
  const a = Math.abs(d);
  switch (id) {
    case 'damage':
    case 'health':
      return sign + (a < 10 ? a.toFixed(1) : formatNumber(a));
    case 'attackSpeed':
      return `${sign}${a.toFixed(2)}/s`;
    case 'regen':
      return `${sign}${(a * 100).toFixed(1)}%/s`;
    default:
      return `${sign}${(a * 100).toFixed(1)}%`;
  }
}

export function bonusLabel(id: BonusStatId): string {
  return BONUS_STATS.find((b) => b.id === id)!.name;
}

export function formatBonus(id: BonusStatId, v: number): string {
  if (id === 'regen') return `+${(v * 100).toFixed(1)}%/s`;
  return `+${(v * 100).toFixed(1)}%`;
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}
