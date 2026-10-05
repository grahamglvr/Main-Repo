// Item generation, stats and prices. GAME_DESIGN.md sections 7 and 9.
import { BONUS_STATS, ITEM_RULES, SLOTS } from '../data/gear';
import { ITEM_BASES } from '../data/items';
import { TIERS } from '../data/tiers';
import { WORKBENCH } from '../data/config';
import { rollTier } from './pyramid';
import { pickWeighted, type Rng } from './rng';
import type { BonusStatId, Item, ItemBase, SlotId, TierDef, TierId } from './types';

const BASE_BY_ID = new Map(ITEM_BASES.map((b) => [b.id, b]));
const TIER_BY_ID = new Map(TIERS.map((t) => [t.id, t]));

export function getBase(id: string): ItemBase {
  const base = BASE_BY_ID.get(id);
  if (!base) throw new Error(`Unknown item: ${id}`);
  return base;
}

export function getTier(id: TierId): TierDef {
  return TIER_BY_ID.get(id)!;
}

export function tierIndex(id: TierId): number {
  return TIERS.findIndex((t) => t.id === id);
}

export function getSlot(id: SlotId) {
  return SLOTS.find((s) => s.id === id)!;
}

export function bonusStatDef(id: BonusStatId) {
  return BONUS_STATS.find((b) => b.id === id)!;
}

function randInt(min: number, max: number, rng: Rng): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function mainStatValue(slot: SlotId, tier: TierId, level: number): number {
  const s = getSlot(slot);
  return s.mainBase * getTier(tier).statMultiplier * Math.pow(ITEM_RULES.levelGrowth, level - 1);
}

/** Builds an item of a given base and level. Bonus stats are rolled with rng. */
export function makeItem(baseId: string, level: number, uid: number, rng: Rng): Item {
  const base = getBase(baseId);
  const tier = getTier(base.tier);
  const slot = getSlot(base.slot);
  const count = randInt(tier.bonusStats[0], tier.bonusStats[1], rng);
  const pool = [...BONUS_STATS];
  const bonuses: Item['bonuses'] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const def = pool.splice(Math.floor(rng() * pool.length), 1)[0];
    const value = (def.min + rng() * (def.max - def.min)) * tier.bonusMultiplier;
    bonuses.push({ stat: def.id, value });
  }
  return {
    uid,
    baseId,
    tier: base.tier,
    slot: base.slot,
    level,
    main: { stat: slot.main, value: mainStatValue(base.slot, base.tier, level) },
    bonuses,
  };
}

/**
 * Rolls a random item at a Workbench level: tier from the pyramid, random slot,
 * random base in that tier and slot, item level = rollLevel ± spread.
 */
export function rollItem(
  rollLevel: number,
  luck: number,
  uid: number,
  rng: Rng,
  forceTier: TierId | null = null,
): Item {
  const tier = forceTier ?? rollTier(rollLevel, luck, rng).id;
  const slot = SLOTS[Math.floor(rng() * SLOTS.length)].id;
  let pool = ITEM_BASES.filter((b) => b.tier === tier && b.slot === slot);
  if (pool.length === 0) pool = ITEM_BASES.filter((b) => b.tier === tier);
  const base = pickWeighted(pool, () => 1, rng);
  const [lo, hi] = ITEM_RULES.levelSpread;
  const level = Math.max(1, Math.min(WORKBENCH.maxLevel, rollLevel + randInt(lo, hi, rng)));
  return makeItem(base.id, level, uid, rng);
}

export function sellValue(item: Item): number {
  return Math.round(
    ITEM_RULES.sellBase *
      getTier(item.tier).sellMultiplier *
      Math.pow(ITEM_RULES.sellGrowth, item.level - 1),
  );
}
