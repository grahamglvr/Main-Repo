import { ITEMS } from '../data/items';
import { TIERS } from '../data/tiers';
import { pickWeighted, type Rng } from './rng';
import type { ItemDef, TierDef, TierId } from './types';

const TIER_BY_ID = new Map(TIERS.map((t) => [t.id, t]));
const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getTier(id: TierId): TierDef {
  const tier = TIER_BY_ID.get(id);
  if (!tier) throw new Error(`Unknown tier: ${id}`);
  return tier;
}

export function getItem(id: string): ItemDef {
  const item = ITEM_BY_ID.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

export function tierRank(id: TierId): number {
  return TIERS.findIndex((t) => t.id === id);
}

/** Weight of each tier after luck: baseRate × luck^tierIndex. */
function tierWeight(tier: TierDef, luck: number): number {
  return tier.baseRate * Math.pow(luck, tierRank(tier.id));
}

/** Chance of each tier in percent for a given luck, adding up to 100. */
export function tierOdds(luck: number): { tier: TierDef; chance: number }[] {
  const total = TIERS.reduce((sum, t) => sum + tierWeight(t, luck), 0);
  return TIERS.map((tier) => ({ tier, chance: (tierWeight(tier, luck) / total) * 100 }));
}

export function rollTier(luck: number, rng: Rng): TierDef {
  return pickWeighted(TIERS, (t) => tierWeight(t, luck), rng);
}

export function rollItemInTier(tierId: TierId, rng: Rng): ItemDef {
  const pool = ITEMS.filter((i) => i.tier === tierId);
  if (pool.length === 0) throw new Error(`No items in tier: ${tierId}`);
  return pickWeighted(pool, (i) => i.weight ?? 1, rng);
}

/** Rolls many tiers without touching game state. Used by the debug panel to check rates. */
export function simulateTierCounts(luck: number, rolls: number, rng: Rng): Record<TierId, number> {
  const counts = Object.fromEntries(TIERS.map((t) => [t.id, 0])) as Record<TierId, number>;
  for (let i = 0; i < rolls; i++) counts[rollTier(luck, rng).id] += 1;
  return counts;
}

export function rollDrop(luck: number, rng: Rng, forceTier: TierId | null = null): ItemDef {
  const tierId = forceTier ?? rollTier(luck, rng).id;
  return rollItemInTier(tierId, rng);
}
