// Core loop rules. Pure functions: take a state, return a new one.
import { CONFIG } from '../data/config';
import { TIERS } from '../data/tiers';
import { SPOTS, UPGRADES } from '../data/upgrades';
import { getItem, rollDrop } from './drops';
import type { Rng } from './rng';
import type { GameState, ItemDef, TierId, UpgradeId } from './types';

export function createInitialState(): GameState {
  return {
    tokens: CONFIG.startingTokens,
    progress: 0,
    inventory: {},
    upgrades: { tapPower: 0, bagSize: 0 },
    spotIndex: 0,
    feed: [],
    nextFeedKey: 1,
    stats: {
      taps: 0,
      tokensEarned: 0,
      drops: Object.fromEntries(TIERS.map((t) => [t.id, 0])) as Record<TierId, number>,
    },
    debug: { luck: 1, forceTier: null },
  };
}

// ---- Derived stats ----

export function tapPower(s: GameState): number {
  return CONFIG.baseTapPower + s.upgrades.tapPower * UPGRADES.tapPower.perLevel;
}

export function bagCapacity(s: GameState): number {
  return CONFIG.baseBagSize + s.upgrades.bagSize * UPGRADES.bagSize.perLevel;
}

export function bagUsed(s: GameState): number {
  return Object.values(s.inventory).reduce((sum, n) => sum + n, 0);
}

export function effectiveLuck(s: GameState): number {
  return SPOTS[s.spotIndex].luck * s.debug.luck;
}

// ---- Scavenging ----

export interface TapResult {
  state: GameState;
  drops: ItemDef[];
  bagFull: boolean;
}

export function tap(s: GameState, rng: Rng): TapResult {
  const space = bagCapacity(s) - bagUsed(s);
  if (space <= 0) return { state: s, drops: [], bagFull: true };

  let progress = s.progress + tapPower(s);
  const count = Math.min(Math.floor(progress / CONFIG.searchCost), space);
  progress -= count * CONFIG.searchCost;

  const drops: ItemDef[] = [];
  for (let i = 0; i < count; i++) {
    drops.push(rollDrop(effectiveLuck(s), rng, s.debug.forceTier));
  }

  const inventory = { ...s.inventory };
  const tierCounts = { ...s.stats.drops };
  let nextFeedKey = s.nextFeedKey;
  const newEntries = drops.map((item) => {
    inventory[item.id] = (inventory[item.id] ?? 0) + 1;
    tierCounts[item.tier] += 1;
    return { key: nextFeedKey++, itemId: item.id };
  });

  const bagNowFull = space - count <= 0;
  // With a full bag, hold at most one drop's worth of progress so selling isn't punished.
  if (bagNowFull) progress = Math.min(progress, CONFIG.searchCost);

  return {
    state: {
      ...s,
      progress,
      inventory,
      feed: [...newEntries.reverse(), ...s.feed].slice(0, CONFIG.feedLength),
      nextFeedKey,
      stats: { ...s.stats, taps: s.stats.taps + 1, drops: tierCounts },
    },
    drops,
    bagFull: false,
  };
}

// ---- Selling ----

export function sellItem(s: GameState, itemId: string, amount = Infinity): GameState {
  const owned = s.inventory[itemId] ?? 0;
  const sold = Math.min(owned, amount);
  if (sold <= 0) return s;
  const earned = getItem(itemId).value * sold;
  const inventory = { ...s.inventory };
  if (owned - sold > 0) inventory[itemId] = owned - sold;
  else delete inventory[itemId];
  return {
    ...s,
    tokens: s.tokens + earned,
    inventory,
    stats: { ...s.stats, tokensEarned: s.stats.tokensEarned + earned },
  };
}

export function sellAll(s: GameState): GameState {
  return Object.keys(s.inventory).reduce((acc, id) => sellItem(acc, id), s);
}

export function bagValue(s: GameState): number {
  return Object.entries(s.inventory).reduce((sum, [id, n]) => sum + getItem(id).value * n, 0);
}

// ---- Upgrades ----

export function upgradeCost(id: UpgradeId, level: number): number {
  const def = UPGRADES[id];
  return Math.ceil(def.baseCost * Math.pow(def.costGrowth, level));
}

export function isMaxed(s: GameState, id: UpgradeId): boolean {
  return s.upgrades[id] >= UPGRADES[id].maxLevel;
}

/** Returns null if it can't be bought (maxed or too expensive). */
export function buyUpgrade(s: GameState, id: UpgradeId): GameState | null {
  if (isMaxed(s, id)) return null;
  const cost = upgradeCost(id, s.upgrades[id]);
  if (s.tokens < cost) return null;
  return {
    ...s,
    tokens: s.tokens - cost,
    upgrades: { ...s.upgrades, [id]: s.upgrades[id] + 1 },
  };
}

export function nextSpot(s: GameState) {
  return SPOTS[s.spotIndex + 1] ?? null;
}

/** Returns null if there's no next spot or it's too expensive. */
export function buyNextSpot(s: GameState): GameState | null {
  const spot = nextSpot(s);
  if (!spot || s.tokens < spot.cost) return null;
  return { ...s, tokens: s.tokens - spot.cost, spotIndex: s.spotIndex + 1 };
}
