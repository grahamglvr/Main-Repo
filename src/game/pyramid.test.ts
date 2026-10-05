import { describe, expect, it } from 'vitest';
import { PYRAMID_ANCHORS } from '../data/pyramid';
import { TIERS } from '../data/tiers';
import { baseOdds, pyramidOdds, rollTier } from './pyramid';
import { seededRng } from './rng';

const LEVELS = Array.from({ length: 60 }, (_, i) => i + 1);

describe('drop pyramid', () => {
  it('matches the anchor table at anchor levels', () => {
    for (const anchor of PYRAMID_ANCHORS) {
      const odds = baseOdds(anchor.level);
      for (const t of TIERS) {
        const expected = anchor.level < t.unlockLevel ? 0 : anchor.odds[t.id];
        expect(odds[t.id], `${t.id} at ${anchor.level}`).toBeCloseTo(expected, 6);
      }
    }
  });

  it('interpolates between anchors, then renormalises after zeroing locked tiers', () => {
    // Level 15 is halfway between 10 and 20: 55 / 36.5 / 8 / 0.5. Industrial unlocks at 18,
    // so its 0.5 becomes 0 and the rest is scaled up to total 100.
    const odds = baseOdds(15);
    expect(odds.industrial).toBe(0);
    expect(odds.old).toBeCloseTo((55 / 99.5) * 100);
    expect(odds.basic).toBeCloseTo((36.5 / 99.5) * 100);
    expect(odds.commercial).toBeCloseTo((8 / 99.5) * 100);
  });

  it('every row totals 100%, with and without luck', () => {
    for (const level of LEVELS) {
      for (const luck of [0, 0.1, 1, 10]) {
        const total = Object.values(pyramidOdds(level, luck)).reduce((a, b) => a + b, 0);
        expect(total, `level ${level} luck ${luck}`).toBeCloseTo(100, 6);
      }
    }
  });

  it('locked tiers are exactly 0%, even with huge luck', () => {
    for (const level of LEVELS) {
      for (const luck of [0, 0.5, 100]) {
        const odds = pyramidOdds(level, luck);
        for (const t of TIERS) {
          if (level < t.unlockLevel) expect(odds[t.id], `${t.id} at ${level}`).toBe(0);
        }
      }
    }
  });

  it('a locked tier never drops in 50,000 rolls at its level minus one', () => {
    const rng = seededRng(3);
    for (const t of TIERS.slice(1)) {
      for (let i = 0; i < 50_000 / (TIERS.length - 1); i++) {
        expect(rollTier(t.unlockLevel - 1, 5, rng).id).not.toBe(t.id);
      }
    }
  });

  it('luck shifts odds upwards but only among unlocked tiers', () => {
    const plain = pyramidOdds(20);
    const lucky = pyramidOdds(20, 0.5);
    expect(lucky.old).toBeLessThan(plain.old);
    expect(lucky.industrial).toBeGreaterThan(plain.industrial);
    expect(lucky.military).toBe(0);
  });

  it('rolls land close to the odds', () => {
    const rng = seededRng(9);
    const n = 100_000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const id = rollTier(30, 0, rng).id;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    const odds = pyramidOdds(30);
    for (const t of TIERS) expect(((counts[t.id] ?? 0) / n) * 100).toBeCloseTo(odds[t.id], 0);
  });
});
