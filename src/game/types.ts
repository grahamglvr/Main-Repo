// Shared shapes for game data and state. Balance numbers live in src/data/, not here.

export type TierId =
  | 'old'
  | 'basic'
  | 'commercial'
  | 'industrial'
  | 'military'
  | 'ai'
  | 'celestial';

export type SlotId = 'weapon' | 'head' | 'body' | 'hands' | 'feet' | 'gadget';

export type MainStat = 'damage' | 'health';

export type BonusStatId =
  | 'attackSpeed'
  | 'critChance'
  | 'critDamage'
  | 'regen'
  | 'scrapFind'
  | 'tokenFind'
  | 'luck';

export interface RareMoment {
  /** Light beam from the Workbench. */
  beamMs: number;
  /** Battle runs at slowMoScale speed for slowMoMs. 0 = no slow motion. */
  slowMoMs: number;
  slowMoScale: number;
  flashOpacity: number;
}

export interface TierDef {
  id: TierId;
  name: string;
  colour: string;
  /** Workbench level where this tier can start dropping. */
  unlockLevel: number;
  /** Multiplies an item's main stat. */
  statMultiplier: number;
  /** Multiplies an item's sell price. */
  sellMultiplier: number;
  /** [min, max] bonus stats on an item of this tier. */
  bonusStats: [number, number];
  /** Multiplies the size of bonus stat rolls. */
  bonusMultiplier: number;
  /** Light beam, slow motion and flash when this tier drops. null = none. */
  moment: RareMoment | null;
  shimmer?: boolean;
}

/** Weapon looks drawn on Nobody's sprite. Art lives in src/battle/art. */
export type WeaponLook =
  | 'pipe'
  | 'wrench'
  | 'taser'
  | 'baton'
  | 'cutter'
  | 'shockblade'
  | 'mindblade'
  | 'starshard';

export interface ItemBase {
  id: string;
  name: string;
  slot: SlotId;
  tier: TierId;
  description: string;
  /** Weapons only: how it looks in Nobody's hand. */
  look?: WeaponLook;
}

export interface Item {
  uid: number;
  baseId: string;
  tier: TierId;
  slot: SlotId;
  level: number;
  main: { stat: MainStat; value: number };
  bonuses: { stat: BonusStatId; value: number }[];
}

export interface PlayerStats {
  damage: number;
  health: number;
  /** Attacks per second. */
  attackSpeed: number;
  /** 0–1 */
  critChance: number;
  /** Crit hit = damage × critDamage. */
  critDamage: number;
  /** Fraction of max health healed per second. */
  regen: number;
  /** Bonus fraction, e.g. 0.1 = +10%. */
  scrapFind: number;
  tokenFind: number;
  luck: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  /** Art key in src/battle/art. */
  art: string;
  health: number;
  damage: number;
  attackSpeed: number;
  /** Walk speed in battle units per second. */
  speed: number;
  /** Body width in battle units, so big enemies stop further from Nobody. */
  width: number;
  scrap: number;
  tokens: number;
  xp: number;
}

export interface ZoneDef {
  id: number;
  name: string;
  /** Enemy id → spawn weight. */
  enemies: Record<string, number>;
  boss: string;
}

export interface Workbench {
  level: number;
  /** Game-clock ms when the running upgrade finishes, or null. */
  upgradeEndsAt: number | null;
  upgradeStartedAt: number | null;
}

export interface GameState {
  /** Total simulated play time in ms. Drives timers and pacing stats. */
  clock: number;
  tokens: number;
  scrap: number;
  xp: number;
  level: number;
  zone: number;
  highestZoneCleared: number;
  workbench: Workbench;
  equipped: Record<SlotId, Item | null>;
  /** Items waiting for Equip or Sell. First one is shown on the card. */
  pending: Item[];
  nextItemUid: number;
  stats: {
    salvages: number;
    salvagesByTier: Record<TierId, number>;
    kills: number;
    deaths: number;
    /** Game-clock ms when each zone was first reached / its boss first reached / first cleared. */
    zoneReachedAt: Record<number, number>;
    bossReachedAt: Record<number, number>;
    zoneClearedAt: Record<number, number>;
    tierFirstFoundAt: Partial<Record<TierId, number>>;
  };
  /** One-time story lines already shown. */
  seen: Record<string, true>;
  debug: {
    luckBonus: number;
    forceTier: TierId | null;
    godMode: boolean;
    speed: number;
  };
}
