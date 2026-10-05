import { describe, expect, it } from 'vitest';
import { ITEMS } from '../data/items';
import { TIERS } from '../data/tiers';
import { SPOTS } from '../data/upgrades';
import { rollDrop, simulateTierCounts, tierOdds } from './drops';
import { seededRng } from './rng';

describe('loot data', () => {
  it('base rates add up to 100%', () => {
    expect(TIERS.reduce((sum, t) => sum + t.baseRate, 0)).toBeCloseTo(100);
  });

  it('every tier has at least one item', () => {
    for (const tier of TIERS) {
      expect(ITEMS.some((i) => i.tier === tier.id), tier.id).toBe(true);
    }
  });

  it('item ids are unique and tiers are valid', () => {
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
    const tierIds = new Set(TIERS.map((t) => t.id));
    for (const item of ITEMS) expect(tierIds.has(item.tier), item.id).toBe(true);
  });

  it('spots start free and get luckier', () => {
    expect(SPOTS[0].cost).toBe(0);
    for (let i = 1; i < SPOTS.length; i++) expect(SPOTS[i].luck).toBeGreaterThan(SPOTS[i - 1].luck);
  });
});

describe('tierOdds', () => {
  it('matches base rates at luck 1', () => {
    for (const { tier, chance } of tierOdds(1)) expect(chance).toBeCloseTo(tier.baseRate);
  });

  it('shifts odds towards higher tiers with more luck', () => {
    const base = tierOdds(1);
    const lucky = tierOdds(1.5);
    expect(lucky[0].chance).toBeLessThan(base[0].chance);
    expect(lucky[lucky.length - 1].chance).toBeGreaterThan(base[base.length - 1].chance);
    expect(lucky.reduce((sum, o) => sum + o.chance, 0)).toBeCloseTo(100);
  });
});

describe('rolling', () => {
  it('lands close to base rates over many rolls', () => {
    const rolls = 200_000;
    const counts = simulateTierCounts(1, rolls, seededRng(42));
    for (const tier of TIERS) {
      expect((counts[tier.id] / rolls) * 100, tier.id).toBeCloseTo(tier.baseRate, 0);
    }
  });

  it('forced tier always drops that tier', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 50; i++) expect(rollDrop(1, rng, 'celestial').tier).toBe('celestial');
  });
});
