// Drop pyramid: tier odds for a Workbench level. GAME_DESIGN.md section 8.
import { PYRAMID, PYRAMID_ANCHORS } from '../data/pyramid';
import { TIERS } from '../data/tiers';
import { pickWeighted, type Rng } from './rng';
import type { TierDef, TierId } from './types';

export type Odds = Record<TierId, number>;

function emptyOdds(): Odds {
  return Object.fromEntries(TIERS.map((t) => [t.id, 0])) as Odds;
}

function normalise(weights: Odds): Odds {
  const total = TIERS.reduce((sum, t) => sum + weights[t.id], 0);
  const out = emptyOdds();
  for (const t of TIERS) out[t.id] = total > 0 ? (weights[t.id] / total) * 100 : 0;
  return out;
}

/** Interpolated anchor row for a level, with locked tiers forced to 0, totalling 100. */
export function baseOdds(level: number): Odds {
  const lvl = Math.max(1, Math.min(PYRAMID.maxLevel, Math.floor(level)));
  let lo = PYRAMID_ANCHORS[0];
  let hi = PYRAMID_ANCHORS[PYRAMID_ANCHORS.length - 1];
  for (let i = 0; i < PYRAMID_ANCHORS.length - 1; i++) {
    if (lvl >= PYRAMID_ANCHORS[i].level && lvl <= PYRAMID_ANCHORS[i + 1].level) {
      lo = PYRAMID_ANCHORS[i];
      hi = PYRAMID_ANCHORS[i + 1];
      break;
    }
  }
  const t = hi.level === lo.level ? 0 : (lvl - lo.level) / (hi.level - lo.level);
  const weights = emptyOdds();
  for (const tier of TIERS) {
    weights[tier.id] =
      lvl < tier.unlockLevel ? 0 : lo.odds[tier.id] + (hi.odds[tier.id] - lo.odds[tier.id]) * t;
  }
  return normalise(weights);
}

/**
 * Final odds after luck. Luck (e.g. 0.1 = +10%) multiplies each tier's weight by
 * (1 + luck)^rank, where rank counts tiers above the lowest one that can drop.
 * Locked tiers are 0 and stay 0.
 */
export function pyramidOdds(level: number, luck = 0): Odds {
  const base = baseOdds(level);
  if (luck <= 0) return base;
  const lowest = TIERS.findIndex((t) => base[t.id] > 0);
  const weights = emptyOdds();
  TIERS.forEach((tier, i) => {
    weights[tier.id] = base[tier.id] * Math.pow(1 + luck, Math.max(0, i - lowest));
  });
  return normalise(weights);
}

export function rollTier(level: number, luck: number, rng: Rng): TierDef {
  const odds = pyramidOdds(level, luck);
  return pickWeighted(TIERS, (t) => odds[t.id], rng);
}

/** Luck from clearing whole stages (zones 10, 20, ...). */
export function stageLuck(highestZoneCleared: number): number {
  return Math.floor(highestZoneCleared / PYRAMID.zonesPerStage) * PYRAMID.stageClearLuck;
}
