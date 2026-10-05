// Nobody's combat stats from level and gear. GAME_DESIGN.md sections 6 and 9.
import { PLAYER } from '../data/config';
import type { Item, PlayerStats, SlotId } from './types';

export function computeStats(level: number, equipped: Record<SlotId, Item | null>): PlayerStats {
  const b = PLAYER.base;
  const s: PlayerStats = {
    damage: b.damage + PLAYER.perLevel.damage * (level - 1),
    health: b.health + PLAYER.perLevel.health * (level - 1),
    attackSpeed: b.attackSpeed,
    critChance: b.critChance,
    critDamage: b.critDamage,
    regen: 0,
    scrapFind: 0,
    tokenFind: 0,
    luck: 0,
  };
  let attackSpeedBonus = 0;
  for (const item of Object.values(equipped)) {
    if (!item) continue;
    s[item.main.stat] += item.main.value;
    for (const bonus of item.bonuses) {
      if (bonus.stat === 'attackSpeed') attackSpeedBonus += bonus.value;
      else s[bonus.stat] += bonus.value;
    }
  }
  s.attackSpeed *= 1 + attackSpeedBonus;
  s.critChance = Math.min(PLAYER.critChanceCap, s.critChance);
  return s;
}

/** Average damage per second, counting crits. */
export function dps(s: PlayerStats): number {
  return s.damage * s.attackSpeed * (1 + s.critChance * (s.critDamage - 1));
}

/**
 * One number for comparing builds. A fight is roughly decided by DPS × Health
 * on each side, so Power = √(DPS × effective Health). Regen counts as extra Health
 * over a ~20 second fight.
 */
export function power(s: PlayerStats): number {
  const effectiveHealth = s.health * (1 + s.regen * 20);
  return Math.sqrt(dps(s) * effectiveHealth) * 10;
}
