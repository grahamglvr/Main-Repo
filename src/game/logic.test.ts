import { describe, expect, it } from 'vitest';
import { CONFIG } from '../data/config';
import { ITEMS } from '../data/items';
import { SPOTS, UPGRADES } from '../data/upgrades';
import { formatNumber } from './format';
import * as logic from './logic';
import { seededRng } from './rng';
import type { GameState } from './types';

const rng = seededRng(1);

function tapTimes(s: GameState, n: number): GameState {
  for (let i = 0; i < n; i++) s = logic.tap(s, rng).state;
  return s;
}

describe('tap', () => {
  it('drops one item every searchCost / tapPower taps', () => {
    const tapsPerDrop = CONFIG.searchCost / CONFIG.baseTapPower;
    const s = tapTimes(logic.createInitialState(), tapsPerDrop * 4);
    expect(logic.bagUsed(s)).toBe(4);
    expect(s.feed).toHaveLength(4);
  });

  it('can drop several items per tap with enough tap power', () => {
    const s = { ...logic.createInitialState(), upgrades: { tapPower: 20, bagSize: 0 } };
    const { drops } = logic.tap(s, rng);
    expect(drops.length).toBe(Math.floor(logic.tapPower(s) / CONFIG.searchCost));
  });

  it('stops at bag capacity and reports a full bag', () => {
    let s = logic.createInitialState();
    s = tapTimes(s, 500);
    expect(logic.bagUsed(s)).toBe(logic.bagCapacity(s));
    expect(logic.tap(s, rng).bagFull).toBe(true);
  });

  it('keeps the feed at its max length, newest first', () => {
    const s = tapTimes(logic.createInitialState(), 300);
    expect(s.feed.length).toBeLessThanOrEqual(CONFIG.feedLength);
    expect(s.feed[0].key).toBeGreaterThan(s.feed[1].key);
  });
});

describe('selling', () => {
  it('sells items for their value', () => {
    const item = ITEMS[0];
    const s = { ...logic.createInitialState(), inventory: { [item.id]: 3 } };
    const one = logic.sellItem(s, item.id, 1);
    expect(one.tokens).toBe(item.value);
    expect(one.inventory[item.id]).toBe(2);
    const all = logic.sellAll(s);
    expect(all.tokens).toBe(item.value * 3);
    expect(logic.bagUsed(all)).toBe(0);
  });
});

describe('upgrades', () => {
  it('costs grow per level and need enough Tokens', () => {
    const s = logic.createInitialState();
    expect(logic.buyUpgrade(s, 'tapPower')).toBeNull();
    const rich = { ...s, tokens: 1_000_000 };
    const bought = logic.buyUpgrade(rich, 'tapPower')!;
    expect(bought.upgrades.tapPower).toBe(1);
    expect(bought.tokens).toBe(1_000_000 - UPGRADES.tapPower.baseCost);
    expect(logic.upgradeCost('tapPower', 1)).toBeGreaterThan(logic.upgradeCost('tapPower', 0));
  });

  it('stops at max level', () => {
    const s = {
      ...logic.createInitialState(),
      tokens: 1e12,
      upgrades: { tapPower: 0, bagSize: UPGRADES.bagSize.maxLevel },
    };
    expect(logic.buyUpgrade(s, 'bagSize')).toBeNull();
  });

  it('moves through scavenging spots in order', () => {
    let s: GameState | null = { ...logic.createInitialState(), tokens: 1e12 };
    for (let i = 1; i < SPOTS.length; i++) {
      s = logic.buyNextSpot(s!);
      expect(s!.spotIndex).toBe(i);
    }
    expect(logic.buyNextSpot(s!)).toBeNull();
  });
});

describe('formatNumber', () => {
  it('uses short suffixes', () => {
    expect(formatNumber(950)).toBe('950');
    expect(formatNumber(1234)).toBe('1.23K');
    expect(formatNumber(45_600_000)).toBe('45.6M');
    expect(formatNumber(999_999)).toBe('999K');
    expect(formatNumber(7.8e9)).toBe('7.80B');
  });
});
