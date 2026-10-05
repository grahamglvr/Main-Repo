// The game rules that tie battle, economy, Workbench and zones together.
// Pure functions over GameState (immutable) and BattleState (mutable, per frame).
// The same code drives the browser game and the headless pacing simulator.
import { BATTLE, PLAYER, WORKBENCH } from '../data/config';
import { BOSSES } from '../data/enemies';
import { STARTING_WEAPON } from '../data/items';
import { LINES } from '../data/lines';
import { TIERS } from '../data/tiers';
import { ZONES } from '../data/zones';
import {
  createBattle,
  getEnemyDef,
  resetBattle,
  rewardScale,
  stepBattle,
  type BattleEvent,
  type BattleState,
} from './battle';
import { getTier, makeItem, rollItem, sellValue } from './items';
import { stageLuck } from './pyramid';
import type { Rng } from './rng';
import { computeStats } from './stats';
import type { GameState, Item, PlayerStats, SlotId, TierId } from './types';

export type GameEvent =
  | BattleEvent
  | { t: 'reward'; x: number; scrap: number; tokens: number; xp: number; boss: boolean }
  | { t: 'levelUp'; level: number }
  | { t: 'zoneChanged'; zone: number }
  | { t: 'itemFound'; item: Item; source: 'salvage' | 'crate' | 'drop'; x?: number }
  | { t: 'equipped'; item: Item }
  | { t: 'sold'; item: Item; tokens: number }
  | { t: 'workbenchUpgraded'; level: number }
  | { t: 'say'; text: string; priority: boolean };

export interface World {
  game: GameState;
  battle: BattleState;
}

export interface Result {
  game: GameState;
  events: GameEvent[];
}

const SLOT_IDS: SlotId[] = ['weapon', 'head', 'body', 'hands', 'feet', 'gadget'];

function pick<T>(list: readonly T[], rng: Rng): T {
  return list[Math.floor(rng() * list.length)];
}

// ---- Setup ----

export function createGame(): GameState {
  const equipped = Object.fromEntries(SLOT_IDS.map((s) => [s, null])) as Record<SlotId, Item | null>;
  equipped.weapon = makeItem(STARTING_WEAPON, 1, 1, () => 0);
  return {
    clock: 0,
    tokens: 0,
    scrap: 0,
    xp: 0,
    level: 1,
    zone: 1,
    highestZoneCleared: 0,
    workbench: { level: 1, upgradeEndsAt: null, upgradeStartedAt: null },
    equipped,
    pending: [],
    nextItemUid: 2,
    stats: {
      salvages: 0,
      salvagesByTier: Object.fromEntries(TIERS.map((t) => [t.id, 0])) as Record<TierId, number>,
      kills: 0,
      deaths: 0,
      zoneReachedAt: { 1: 0 },
      bossReachedAt: {},
      zoneClearedAt: {},
      tierFirstFoundAt: {},
    },
    seen: {},
    debug: { luckBonus: 0, forceTier: null, godMode: false, speed: 1 },
  };
}

export function createWorld(): World {
  const game = createGame();
  return { game, battle: createBattle(game.zone, playerStats(game).health) };
}

// ---- Derived values ----

export function playerStats(g: GameState): PlayerStats {
  return computeStats(g.level, g.equipped);
}

export function totalLuck(g: GameState, stats = playerStats(g)): number {
  return stats.luck + stageLuck(g.highestZoneCleared) + g.debug.luckBonus;
}

export function xpToNext(level: number): number {
  return Math.round(PLAYER.xpBase * Math.pow(PLAYER.xpGrowth, level - 1));
}

export function salvageCost(wbLevel: number): number {
  return Math.round(WORKBENCH.salvageCostBase * Math.pow(WORKBENCH.salvageCostGrowth, wbLevel - 1));
}

export function upgradeCost(wbLevel: number): number {
  return Math.round(WORKBENCH.upgradeCostBase * Math.pow(WORKBENCH.upgradeCostGrowth, wbLevel - 1));
}

/** Upgrade time in ms from wbLevel to wbLevel + 1. */
export function upgradeTime(wbLevel: number): number {
  return WORKBENCH.upgradeTimeBase * Math.pow(WORKBENCH.upgradeTimeGrowth, wbLevel - 1) * 1000;
}

export function workbenchCap(g: GameState): number {
  return Math.min(WORKBENCH.maxLevel, g.highestZoneCleared + WORKBENCH.capAboveZone);
}

export function crateLevel(g: GameState): number {
  return Math.min(WORKBENCH.maxLevel, g.workbench.level + WORKBENCH.crateLevelBonus);
}

/** Highest zone the player may pick: every cleared zone plus the next one. */
export function maxSelectableZone(g: GameState): number {
  return Math.min(ZONES.length, g.highestZoneCleared + 1);
}

// ---- Helpers that return updated copies ----

function say(events: GameEvent[], text: string, priority = false): void {
  events.push({ t: 'say', text, priority });
}

function sayOnce(g: GameState, events: GameEvent[], key: string, text: string): GameState {
  if (g.seen[key]) return g;
  say(events, text, true);
  return { ...g, seen: { ...g.seen, [key]: true } };
}

function addItem(g: GameState, rollLevel: number, rng: Rng, forceTier: TierId | null): [GameState, Item] {
  const item = rollItem(rollLevel, totalLuck(g), g.nextItemUid, rng, forceTier);
  const stats = { ...g.stats };
  if (stats.tierFirstFoundAt[item.tier] === undefined) {
    stats.tierFirstFoundAt = { ...stats.tierFirstFoundAt, [item.tier]: g.clock };
  }
  return [{ ...g, nextItemUid: g.nextItemUid + 1, pending: [...g.pending, item], stats }, item];
}

function rareLine(item: Item, events: GameEvent[], rng: Rng): void {
  const lines = (LINES.rare as Partial<Record<TierId, string[]>>)[item.tier];
  if (lines && getTier(item.tier).moment) say(events, pick(lines, rng), true);
}

function gainXp(g: GameState, xp: number, events: GameEvent[], rng: Rng): GameState {
  let { level, xp: current } = g;
  current += xp;
  let levelled = false;
  while (current >= xpToNext(level)) {
    current -= xpToNext(level);
    level += 1;
    levelled = true;
    events.push({ t: 'levelUp', level });
  }
  if (levelled) say(events, pick(LINES.levelUp, rng));
  return { ...g, xp: current, level };
}

// ---- Tick ----

/** Advances the whole game by dtMs of game time. Mutates world.battle, returns the new GameState. */
export function tick(world: World, dtMs: number, rng: Rng): Result {
  const events: GameEvent[] = [];
  let g: GameState = { ...world.game, clock: world.game.clock + dtMs };
  const b = world.battle;

  // Workbench upgrade finished?
  if (g.workbench.upgradeEndsAt !== null && g.clock >= g.workbench.upgradeEndsAt) {
    g = { ...g, workbench: { level: g.workbench.level + 1, upgradeEndsAt: null, upgradeStartedAt: null } };
    events.push({ t: 'workbenchUpgraded', level: g.workbench.level });
    say(events, pick(LINES.workbenchUpgraded, rng));
  }

  // Battle in small fixed steps so big frames don't skip collisions.
  let remaining = dtMs / 1000;
  while (remaining > 0) {
    const dt = Math.min(remaining, 0.05);
    remaining -= dt;
    const stats = playerStats(g);
    for (const e of stepBattle(b, stats, dt, rng, { god: g.debug.godMode })) {
      events.push(e);
      g = handleBattleEvent(g, b, e, stats, events, rng);
    }
  }

  return { game: g, events };
}

function handleBattleEvent(
  g: GameState,
  b: BattleState,
  e: BattleEvent,
  stats: PlayerStats,
  events: GameEvent[],
  rng: Rng,
): GameState {
  switch (e.t) {
    case 'waveStart': {
      if (e.wave === 1 && g.zone === 1) g = sayOnce(g, events, 'firstFight', LINES.firstFight);
      return g;
    }
    case 'enemyDied': {
      const def = getEnemyDef(e.enemy.defId);
      const scale = rewardScale(b.zone) * (e.enemy.boss ? BATTLE.bossRewardMultiplier : 1);
      const scrap = def.scrap * scale * (1 + stats.scrapFind);
      const tokens = def.tokens * scale * (1 + stats.tokenFind);
      const xp = def.xp * scale;
      events.push({ t: 'reward', x: e.enemy.x, scrap, tokens, xp, boss: e.enemy.boss });
      g = {
        ...g,
        scrap: g.scrap + scrap,
        tokens: g.tokens + tokens,
        stats: { ...g.stats, kills: g.stats.kills + 1 },
      };
      g = gainXp(g, xp, events, rng);
      if (!e.enemy.boss && rng() < WORKBENCH.directDropChance) {
        const [next, item] = addItem(g, g.workbench.level, rng, null);
        g = next;
        events.push({ t: 'itemFound', item, source: 'drop', x: e.enemy.x });
        rareLine(item, events, rng);
      }
      return g;
    }
    case 'bossEngaged': {
      if (g.stats.bossReachedAt[b.zone] === undefined) {
        g = { ...g, stats: { ...g.stats, bossReachedAt: { ...g.stats.bossReachedAt, [b.zone]: g.clock } } };
      }
      const boss = BOSSES.find((x) => x.id === e.defId);
      if (boss) g = sayOnce(g, events, `boss:${boss.id}`, boss.intro);
      return g;
    }
    case 'playerDied': {
      g = { ...g, stats: { ...g.stats, deaths: g.stats.deaths + 1 } };
      if (e.boss === 'scrapyard-hound') say(events, LINES.houndDeath, true);
      else say(events, pick(e.boss ? LINES.bossDeath : LINES.death, rng), true);
      return g;
    }
    case 'bossTimeout': {
      say(events, pick(LINES.bossTimeout, rng), true);
      return g;
    }
    case 'bossDefeated': {
      const zone = e.zone;
      const firstClear = zone > g.highestZoneCleared;
      g = { ...g, highestZoneCleared: Math.max(g.highestZoneCleared, zone) };
      if (g.stats.zoneClearedAt[zone] === undefined) {
        g = { ...g, stats: { ...g.stats, zoneClearedAt: { ...g.stats.zoneClearedAt, [zone]: g.clock } } };
      }
      // Boss crate: one item rolled at Workbench level + 5.
      const [next, item] = addItem(g, crateLevel(g), rng, null);
      g = next;
      events.push({ t: 'itemFound', item, source: 'crate', x: BATTLE.playerX + BATTLE.engageDistance });
      rareLine(item, events, rng);

      if (firstClear && zone < ZONES.length) {
        g = moveToZone(g, b, zone + 1, events);
        say(events, pick(LINES.zoneCleared, rng), true);
      } else {
        resetBattle(b, zone);
        if (firstClear && zone === ZONES.length) say(events, LINES.stageCleared, true);
      }
      return g;
    }
    default:
      return g;
  }
}

function moveToZone(g: GameState, b: BattleState, zone: number, events: GameEvent[]): GameState {
  resetBattle(b, zone);
  events.push({ t: 'zoneChanged', zone });
  const reached = g.stats.zoneReachedAt[zone] === undefined
    ? { ...g.stats.zoneReachedAt, [zone]: g.clock }
    : g.stats.zoneReachedAt;
  return { ...g, zone, stats: { ...g.stats, zoneReachedAt: reached } };
}

// ---- Player actions ----

export function canSalvage(g: GameState): boolean {
  return g.pending.length === 0 && g.scrap >= salvageCost(g.workbench.level);
}

/** Tap the Workbench: spend Scrap, roll one item onto the card. */
export function salvage(g: GameState, rng: Rng): Result {
  const events: GameEvent[] = [];
  if (!canSalvage(g)) return { game: g, events };
  g = { ...g, scrap: g.scrap - salvageCost(g.workbench.level) };
  const [next, item] = addItem(g, g.workbench.level, rng, g.debug.forceTier);
  g = {
    ...next,
    stats: {
      ...next.stats,
      salvages: next.stats.salvages + 1,
      salvagesByTier: { ...next.stats.salvagesByTier, [item.tier]: next.stats.salvagesByTier[item.tier] + 1 },
    },
  };
  events.push({ t: 'itemFound', item, source: 'salvage' });
  g = sayOnce(g, events, 'firstSalvage', LINES.firstSalvage);
  rareLine(item, events, rng);
  return { game: g, events };
}

/** Equip the item on the card. Whatever it replaces is sold. */
export function equipPending(g: GameState, rng: Rng): Result {
  const events: GameEvent[] = [];
  const [item, ...rest] = g.pending;
  if (!item) return { game: g, events };
  const old = g.equipped[item.slot];
  const refund = old ? sellValue(old) : 0;
  g = { ...g, pending: rest, tokens: g.tokens + refund, equipped: { ...g.equipped, [item.slot]: item } };
  events.push({ t: 'equipped', item });
  if (item.slot === 'weapon') say(events, pick(LINES.newWeapon, rng));
  return { game: g, events };
}

export function sellPending(g: GameState): Result {
  const [item, ...rest] = g.pending;
  if (!item) return { game: g, events: [] };
  const tokens = sellValue(item);
  return {
    game: { ...g, pending: rest, tokens: g.tokens + tokens },
    events: [{ t: 'sold', item, tokens }],
  };
}

export type UpgradeBlock = 'running' | 'cap' | 'max' | 'tokens' | null;

export function upgradeBlock(g: GameState): UpgradeBlock {
  if (g.workbench.upgradeEndsAt !== null) return 'running';
  if (g.workbench.level >= WORKBENCH.maxLevel) return 'max';
  if (g.workbench.level >= workbenchCap(g)) return 'cap';
  if (g.tokens < upgradeCost(g.workbench.level)) return 'tokens';
  return null;
}

export function startWorkbenchUpgrade(g: GameState): Result {
  const events: GameEvent[] = [];
  if (upgradeBlock(g) !== null) return { game: g, events };
  const level = g.workbench.level;
  g = {
    ...g,
    tokens: g.tokens - upgradeCost(level),
    workbench: { level, upgradeStartedAt: g.clock, upgradeEndsAt: g.clock + upgradeTime(level) },
  };
  g = sayOnce(g, events, 'firstUpgrade', LINES.firstUpgrade);
  return { game: g, events };
}

/** Move to any cleared zone, or the next uncleared one. Restarts at wave 1. */
export function changeZone(world: World, zone: number): Result {
  const events: GameEvent[] = [];
  const g = world.game;
  if (zone < 1 || zone > maxSelectableZone(g) || zone === g.zone) return { game: g, events };
  return { game: moveToZone(g, world.battle, zone, events), events };
}
