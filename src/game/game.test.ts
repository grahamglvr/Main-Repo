import { describe, expect, it } from 'vitest';
import { BATTLE, WORKBENCH } from '../data/config';
import { ITEM_BASES } from '../data/items';
import { SLOTS } from '../data/gear';
import { TIERS } from '../data/tiers';
import { ZONES } from '../data/zones';
import { createBattle, getEnemyDef, stepBattle } from './battle';
import {
  changeZone,
  createWorld,
  crateLevel,
  equipPending,
  salvage,
  salvageCost,
  sellPending,
  startWorkbenchUpgrade,
  tick,
  upgradeBlock,
  upgradeCost,
  upgradeTime,
  workbenchCap,
} from './game';
import { sellValue } from './items';
import { seededRng } from './rng';
import { computeStats } from './stats';

const rng = seededRng(5);

describe('data', () => {
  it('every tier has an item for every slot', () => {
    for (const t of TIERS) {
      for (const s of SLOTS) {
        expect(ITEM_BASES.some((b) => b.tier === t.id && b.slot === s.id), `${t.id} ${s.id}`).toBe(true);
      }
    }
  });

  it('every weapon has a look and every zone enemy exists', () => {
    for (const b of ITEM_BASES.filter((b) => b.slot === 'weapon')) expect(b.look, b.id).toBeDefined();
    for (const z of ZONES) {
      for (const id of [...Object.keys(z.enemies), z.boss]) expect(() => getEnemyDef(id)).not.toThrow();
    }
  });
});

describe('battle', () => {
  it('a level 1 Nobody clears wave 1 of zone 1', () => {
    const b = createBattle(1, 100);
    const stats = computeStats(1, createWorld().game.equipped);
    for (let i = 0; i < 400 && b.wave === 1; i++) stepBattle(b, stats, 0.05, rng);
    expect(b.wave).toBe(2);
  });

  it('dying sends Nobody back to wave 1 of the same zone', () => {
    const b = createBattle(4, 100);
    b.wave = 7;
    const weak = { ...computeStats(1, createWorld().game.equipped), health: 1, damage: 0.01 };
    b.playerMaxHp = 1;
    b.playerHp = 1;
    const events = [];
    for (let i = 0; i < 2000 && b.phase !== 'defeated'; i++) events.push(...stepBattle(b, weak, 0.05, rng));
    expect(events.some((e) => e.t === 'playerDied')).toBe(true);
    for (let i = 0; i < 100; i++) stepBattle(b, weak, 0.05, rng);
    expect(b.zone).toBe(4);
    expect(b.wave).toBe(1);
  });

  it('the boss timer runs out if Nobody cannot kill the boss', () => {
    const b = createBattle(1, 100);
    b.wave = BATTLE.wavesPerZone + 1;
    const tank = { ...computeStats(1, createWorld().game.equipped), damage: 0.001, health: 1e9 };
    const events = [];
    for (let i = 0; i < 2000 && b.phase !== 'defeated'; i++) events.push(...stepBattle(b, tank, 0.05, rng));
    expect(events.some((e) => e.t === 'bossTimeout')).toBe(true);
  });

  it('killing enemies pays Scrap, Tokens and XP', () => {
    const world = createWorld();
    for (let i = 0; i < 600; i++) world.game = tick(world, 100, rng).game;
    expect(world.game.scrap).toBeGreaterThan(0);
    expect(world.game.tokens).toBeGreaterThan(0);
    expect(world.game.level + world.game.xp).toBeGreaterThan(1);
  });
});

describe('workbench', () => {
  it('salvaging costs Scrap and puts an item on the card; only one card at a time', () => {
    const world = createWorld();
    let g = { ...world.game, scrap: 100 };
    g = salvage(g, rng).game;
    expect(g.scrap).toBe(100 - salvageCost(1));
    expect(g.pending).toHaveLength(1);
    expect(salvage(g, rng).game).toBe(g);
  });

  it('equip replaces and sells the old item; sell pays Tokens', () => {
    let g = { ...createWorld().game, scrap: 100 };
    g = salvage(g, rng).game;
    const item = g.pending[0];
    const old = g.equipped[item.slot];
    const equipped = equipPending(g, rng).game;
    expect(equipped.equipped[item.slot]).toBe(item);
    expect(equipped.tokens).toBe(old ? sellValue(old) : 0);
    const sold = sellPending(g).game;
    expect(sold.tokens).toBe(sellValue(item));
    expect(sold.pending).toHaveLength(0);
  });

  it('upgrades cost Tokens, take time, and stop at highest zone cleared + 5', () => {
    const world = createWorld();
    let g = { ...world.game, tokens: 1e9 };
    expect(workbenchCap(g)).toBe(WORKBENCH.capAboveZone);
    g = startWorkbenchUpgrade(g).game;
    expect(g.tokens).toBe(1e9 - upgradeCost(1));
    expect(upgradeBlock(g)).toBe('running');
    world.game = g;
    world.game = tick(world, upgradeTime(1) + 10, rng).game;
    expect(world.game.workbench.level).toBe(2);
    world.game = { ...world.game, workbench: { level: 5, upgradeEndsAt: null, upgradeStartedAt: null } };
    expect(upgradeBlock(world.game)).toBe('cap');
  });

  it('boss crates roll at Workbench level + 5', () => {
    const g = createWorld().game;
    expect(crateLevel(g)).toBe(1 + WORKBENCH.crateLevelBonus);
  });
});

describe('zones', () => {
  it('can only pick cleared zones or the next one', () => {
    const world = createWorld();
    expect(changeZone(world, 3).game.zone).toBe(1);
    world.game = { ...world.game, highestZoneCleared: 4 };
    expect(changeZone(world, 5).game.zone).toBe(5);
  });
});
