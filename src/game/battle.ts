// Auto-battle simulation. Pure logic: the Phaser scene only draws this state and
// plays effects for the events it returns. GAME_DESIGN.md section 6.
//
// BattleState is mutated in place for speed (it changes every frame).
import { BATTLE } from '../data/config';
import { BOSSES, ENEMIES } from '../data/enemies';
import { ZONES } from '../data/zones';
import { pickWeighted, type Rng } from './rng';
import type { EnemyDef, PlayerStats } from './types';

export interface EnemyInstance {
  id: number;
  defId: string;
  boss: boolean;
  x: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  speed: number;
  attackTimer: number;
  width: number;
  /** True once it has reached its place in the queue. */
  engaged: boolean;
}

export type BattlePhase = 'advancing' | 'fighting' | 'defeated';

export interface BattleState {
  zone: number;
  /** 1..wavesPerZone for normal waves, wavesPerZone + 1 for the boss. */
  wave: number;
  phase: BattlePhase;
  phaseTimer: number;
  toSpawn: { defId: string; boss: boolean }[];
  spawnTimer: number;
  enemies: EnemyInstance[];
  playerHp: number;
  playerMaxHp: number;
  attackTimer: number;
  /** Seconds left on the boss timer, or null when no boss has engaged yet. */
  bossTimeLeft: number | null;
  nextId: number;
}

export type BattleEvent =
  | { t: 'waveStart'; wave: number; boss: boolean }
  | { t: 'spawn'; enemy: EnemyInstance }
  | { t: 'attack' }
  | { t: 'hit'; enemyId: number; damage: number; crit: boolean }
  | { t: 'enemyAttack'; enemyId: number; damage: number }
  | { t: 'enemyDied'; enemy: EnemyInstance }
  | { t: 'bossEngaged'; defId: string }
  | { t: 'bossDefeated'; zone: number }
  | { t: 'playerDied'; boss: string | null }
  | { t: 'bossTimeout' };

const ENEMY_BY_ID = new Map<string, EnemyDef>([...ENEMIES, ...BOSSES].map((e) => [e.id, e]));

export function getEnemyDef(id: string): EnemyDef {
  const def = ENEMY_BY_ID.get(id);
  if (!def) throw new Error(`Unknown enemy: ${id}`);
  return def;
}

export function zoneDef(zone: number) {
  return ZONES[Math.max(0, Math.min(ZONES.length - 1, zone - 1))];
}

/** Enemy health and damage multiplier for a zone. */
export function zoneScale(zone: number): number {
  return Math.pow(BATTLE.enemyGrowth, zone - 1);
}

export function rewardScale(zone: number): number {
  return Math.pow(BATTLE.rewardGrowth, zone - 1);
}

export function isBossWave(b: BattleState): boolean {
  return b.wave > BATTLE.wavesPerZone;
}

export function createBattle(zone: number, maxHp: number): BattleState {
  return {
    zone,
    wave: 1,
    phase: 'advancing',
    phaseTimer: BATTLE.waveGap,
    toSpawn: [],
    spawnTimer: 0,
    enemies: [],
    playerHp: maxHp,
    playerMaxHp: maxHp,
    attackTimer: 0,
    bossTimeLeft: null,
    nextId: 1,
  };
}

/** Restarts the battle at wave 1 of a zone with full health. */
export function resetBattle(b: BattleState, zone: number): void {
  Object.assign(b, createBattle(zone, b.playerMaxHp), { nextId: b.nextId });
}

function startWave(b: BattleState, rng: Rng, events: BattleEvent[]): void {
  const zone = zoneDef(b.zone);
  b.toSpawn = [];
  if (isBossWave(b)) {
    b.toSpawn.push({ defId: zone.boss, boss: true });
  } else {
    const [min, max] = BATTLE.waveSizes[b.wave - 1] ?? [3, 4];
    const count = min + Math.floor(rng() * (max - min + 1));
    const pool = Object.entries(zone.enemies);
    for (let i = 0; i < count; i++) {
      b.toSpawn.push({ defId: pickWeighted(pool, ([, w]) => w, rng)[0], boss: false });
    }
  }
  b.phase = 'fighting';
  b.spawnTimer = 0;
  b.bossTimeLeft = null;
  events.push({ t: 'waveStart', wave: b.wave, boss: isBossWave(b) });
}

function spawn(b: BattleState, defId: string, boss: boolean, events: BattleEvent[]): void {
  const def = getEnemyDef(defId);
  const scale = zoneScale(b.zone);
  const enemy: EnemyInstance = {
    id: b.nextId++,
    defId,
    boss,
    x: BATTLE.spawnX,
    hp: def.health * scale,
    maxHp: def.health * scale,
    damage: def.damage * scale,
    attackSpeed: def.attackSpeed,
    speed: def.speed,
    width: def.width,
    attackTimer: 0,
    engaged: false,
  };
  b.enemies.push(enemy);
  events.push({ t: 'spawn', enemy });
}

/** Where an enemy's centre stands when it's at position `index` in the queue. */
function stopX(b: BattleState, index: number): number {
  let edge = BATTLE.playerX + BATTLE.engageDistance;
  for (let i = 0; i < index; i++) edge += b.enemies[i].width + BATTLE.enemySpacing;
  return edge + b.enemies[index].width / 2;
}

function defeat(b: BattleState, events: BattleEvent[], event: BattleEvent): void {
  events.push(event);
  b.phase = 'defeated';
  b.phaseTimer = BATTLE.defeatDelay;
}

/** Advances the battle by dt seconds. Returns what happened, in order. */
export function stepBattle(
  b: BattleState,
  stats: PlayerStats,
  dt: number,
  rng: Rng,
  opts: { god?: boolean } = {},
): BattleEvent[] {
  const events: BattleEvent[] = [];

  // Keep health in proportion when gear changes max health.
  if (stats.health !== b.playerMaxHp) {
    b.playerHp = (b.playerHp / b.playerMaxHp) * stats.health;
    b.playerMaxHp = stats.health;
  }

  if (b.phase === 'defeated') {
    b.phaseTimer -= dt;
    if (b.phaseTimer <= 0) resetBattle(b, b.zone);
    return events;
  }

  b.playerHp = Math.min(b.playerMaxHp, b.playerHp + b.playerMaxHp * stats.regen * dt);

  if (b.phase === 'advancing') {
    b.phaseTimer -= dt;
    if (b.phaseTimer <= 0) startWave(b, rng, events);
    return events;
  }

  // ---- fighting ----
  if (b.toSpawn.length > 0) {
    b.spawnTimer -= dt;
    if (b.spawnTimer <= 0) {
      const next = b.toSpawn.shift()!;
      spawn(b, next.defId, next.boss, events);
      b.spawnTimer = BATTLE.spawnInterval;
    }
  }

  // Movement into queue positions.
  b.enemies.forEach((e, i) => {
    const target = stopX(b, i);
    if (e.x > target) {
      e.x = Math.max(target, e.x - e.speed * dt);
    }
    const arrived = e.x <= target + 0.5;
    if (arrived && !e.engaged) {
      e.engaged = true;
      if (e.boss && b.bossTimeLeft === null) {
        b.bossTimeLeft = BATTLE.bossTimeLimit;
        events.push({ t: 'bossEngaged', defId: e.defId });
      }
    }
  });

  // Nobody attacks the front enemy once it's in reach.
  const interval = 1 / stats.attackSpeed;
  const front = b.enemies[0];
  if (front && front.engaged) {
    b.attackTimer += dt;
    while (b.attackTimer >= interval && front.hp > 0) {
      b.attackTimer -= interval;
      const crit = rng() < stats.critChance;
      const damage = stats.damage * (crit ? stats.critDamage : 1);
      front.hp -= damage;
      events.push({ t: 'attack' }, { t: 'hit', enemyId: front.id, damage, crit });
    }
  } else {
    // Ready to swing the moment something arrives.
    b.attackTimer = Math.min(b.attackTimer + dt, interval);
  }

  // Remove the dead.
  for (const e of b.enemies.filter((e) => e.hp <= 0)) {
    events.push({ t: 'enemyDied', enemy: e });
  }
  b.enemies = b.enemies.filter((e) => e.hp > 0);

  // Engaged enemies attack.
  for (const e of b.enemies) {
    if (!e.engaged) continue;
    e.attackTimer += dt;
    const enemyInterval = 1 / e.attackSpeed;
    while (e.attackTimer >= enemyInterval) {
      e.attackTimer -= enemyInterval;
      if (!opts.god) b.playerHp -= e.damage;
      events.push({ t: 'enemyAttack', enemyId: e.id, damage: e.damage });
    }
  }

  if (b.playerHp <= 0) {
    b.playerHp = 0;
    const boss = b.enemies.find((e) => e.boss);
    defeat(b, events, { t: 'playerDied', boss: boss ? boss.defId : null });
    return events;
  }

  if (b.bossTimeLeft !== null) {
    b.bossTimeLeft -= dt;
    if (b.bossTimeLeft <= 0 && b.enemies.some((e) => e.boss)) {
      b.bossTimeLeft = 0;
      defeat(b, events, { t: 'bossTimeout' });
      return events;
    }
  }

  // Wave cleared?
  if (b.toSpawn.length === 0 && b.enemies.length === 0) {
    if (isBossWave(b)) {
      events.push({ t: 'bossDefeated', zone: b.zone });
      // The game decides which zone comes next and resets the battle.
      b.phase = 'advancing';
      b.phaseTimer = BATTLE.waveGap;
    } else {
      b.wave += 1;
      b.phase = 'advancing';
      b.phaseTimer = BATTLE.waveGap;
      b.playerHp = Math.min(b.playerMaxHp, b.playerHp + b.playerMaxHp * BATTLE.healBetweenWaves);
    }
  }

  return events;
}
