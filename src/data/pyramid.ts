import type { TierId } from '../game/types';

// Drop pyramid anchors from GAME_DESIGN.md section 8 (percent per tier).
// Odds between anchors are interpolated linearly. A tier is always exactly 0%
// below its unlock level (see tiers.ts), then each row is renormalised to 100%.
export const PYRAMID_ANCHORS: { level: number; odds: Record<TierId, number> }[] = [
  { level: 1, odds: { old: 100, basic: 0, commercial: 0, industrial: 0, military: 0, ai: 0, celestial: 0 } },
  { level: 5, odds: { old: 90, basic: 10, commercial: 0, industrial: 0, military: 0, ai: 0, celestial: 0 } },
  { level: 10, odds: { old: 70, basic: 28, commercial: 2, industrial: 0, military: 0, ai: 0, celestial: 0 } },
  { level: 20, odds: { old: 40, basic: 45, commercial: 14, industrial: 1, military: 0, ai: 0, celestial: 0 } },
  { level: 30, odds: { old: 20, basic: 40, commercial: 32, industrial: 7.5, military: 0.5, ai: 0, celestial: 0 } },
  { level: 40, odds: { old: 8, basic: 25, commercial: 40, industrial: 22, military: 4.8, ai: 0.2, celestial: 0 } },
  { level: 50, odds: { old: 2, basic: 12, commercial: 30, industrial: 38, military: 15, ai: 3, celestial: 0 } },
  { level: 60, odds: { old: 0, basic: 5, commercial: 18, industrial: 40, military: 28, ai: 8.5, celestial: 0.5 } },
];

export const PYRAMID = {
  maxLevel: 60,
  /**
   * Luck bonus added per stage cleared (zones 10, 20, ...). +3% = 0.03.
   * Luck only boosts tiers that are already unlocked, never locked ones.
   */
  stageClearLuck: 0.03,
  zonesPerStage: 10,
};
