// Headless pacing simulator: plays the real game rules with a "normal player"
// so balance can be measured instead of guessed. Used by `npm run sim` and tests.
import {
  canSalvage,
  createWorld,
  equipPending,
  playerStats,
  salvage,
  sellPending,
  startWorkbenchUpgrade,
  tick,
  upgradeBlock,
  type World,
} from './game';
import { seededRng } from './rng';
import { computeStats, power } from './stats';
import type { GameState } from './types';

export interface SimOptions {
  seed: number;
  /** Stop after this many minutes of play. */
  maxMinutes: number;
  /** Salvage taps per second the player manages. */
  tapsPerSecond: number;
  /** Seconds the player takes to decide on each item card. */
  decisionSeconds: number;
  /** Stop when this zone's boss is first reached. */
  stopAtBossOfZone?: number;
}

export interface SimResult {
  world: World;
  minutes: number;
  /** Minutes to reach Workbench level 3 (first Basic Tech possible). */
  workbench3: number | null;
  firstBasic: number | null;
  zoneReached: Record<number, number>;
  bossReached: Record<number, number>;
  zoneCleared: Record<number, number>;
}

const STEP_MS = 100;

/** True if equipping the card's item would raise Power. */
export function isUpgrade(g: GameState): boolean {
  const item = g.pending[0];
  if (!item) return false;
  const now = power(playerStats(g));
  const next = power(computeStats(g.level, { ...g.equipped, [item.slot]: item }));
  return next > now;
}

export function simulate(opts: SimOptions): SimResult {
  const rng = seededRng(opts.seed);
  const world = createWorld();
  let workbench3: number | null = null;
  let nextTapAt = 0;
  let decideAt: number | null = null;

  const limit = opts.maxMinutes * 60_000;
  while (world.game.clock < limit) {
    world.game = tick(world, STEP_MS, rng).game;
    const g = world.game;

    if (workbench3 === null && g.workbench.level >= 3) workbench3 = g.clock;
    if (opts.stopAtBossOfZone && g.stats.bossReachedAt[opts.stopAtBossOfZone] !== undefined) break;

    // Item cards: think for a moment, then equip if it's better, otherwise sell.
    if (g.pending.length > 0) {
      decideAt ??= g.clock + opts.decisionSeconds * 1000;
      if (g.clock >= decideAt) {
        world.game = (isUpgrade(g) ? equipPending(g, rng) : sellPending(g)).game;
        decideAt = null;
      }
      continue;
    }

    if (upgradeBlock(world.game) === null) world.game = startWorkbenchUpgrade(world.game).game;

    if (canSalvage(world.game) && world.game.clock >= nextTapAt) {
      world.game = salvage(world.game, rng).game;
      nextTapAt = world.game.clock + 1000 / opts.tapsPerSecond;
    }
  }

  const toMinutes = (r: Record<number, number>) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v / 60_000]));
  const s = world.game.stats;
  return {
    world,
    minutes: world.game.clock / 60_000,
    workbench3: workbench3 === null ? null : workbench3 / 60_000,
    firstBasic: s.tierFirstFoundAt.basic === undefined ? null : s.tierFirstFoundAt.basic / 60_000,
    zoneReached: toMinutes(s.zoneReachedAt),
    bossReached: toMinutes(s.bossReachedAt),
    zoneCleared: toMinutes(s.zoneClearedAt),
  };
}

export const NORMAL_PLAYER: Omit<SimOptions, 'seed'> = {
  maxMinutes: 120,
  tapsPerSecond: 2,
  decisionSeconds: 2,
  stopAtBossOfZone: 10,
};
