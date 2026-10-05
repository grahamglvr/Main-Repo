import type { BonusStatId, MainStat, SlotId } from '../game/types';

// Gear slots in display order. mainBase is the main stat of a level 1 Old Tech item.
export const SLOTS: { id: SlotId; name: string; main: MainStat; mainBase: number }[] = [
  { id: 'weapon', name: 'Weapon', main: 'damage', mainBase: 6 },
  { id: 'head', name: 'Head', main: 'health', mainBase: 22 },
  { id: 'body', name: 'Body', main: 'health', mainBase: 40 },
  { id: 'hands', name: 'Hands', main: 'damage', mainBase: 3 },
  { id: 'feet', name: 'Feet', main: 'health', mainBase: 18 },
  { id: 'gadget', name: 'Gadget', main: 'damage', mainBase: 2.5 },
];

export const ITEM_RULES = {
  /** Main stat × this per item level above 1. */
  levelGrowth: 1.13,
  /** Item level = Workbench level + a random whole number in this range. */
  levelSpread: [-1, 1] as [number, number],
  /** Sell price = sellBase × tier.sellMultiplier × sellGrowth^(level−1). */
  sellBase: 2,
  sellGrowth: 1.13,
};

// Bonus stat pool. Each roll is a random value in [min, max] × the tier's bonusMultiplier.
// Skill cooldown joins the pool when skills arrive (build step 3).
export const BONUS_STATS: {
  id: BonusStatId;
  name: string;
  min: number;
  max: number;
  /** How the value is shown. */
  format: 'percent';
}[] = [
  { id: 'attackSpeed', name: 'Attack speed', min: 0.03, max: 0.06, format: 'percent' },
  { id: 'critChance', name: 'Crit chance', min: 0.02, max: 0.04, format: 'percent' },
  { id: 'critDamage', name: 'Crit damage', min: 0.1, max: 0.2, format: 'percent' },
  { id: 'regen', name: 'Health regen', min: 0.004, max: 0.008, format: 'percent' },
  { id: 'scrapFind', name: 'Scrap find', min: 0.05, max: 0.1, format: 'percent' },
  { id: 'tokenFind', name: 'Token find', min: 0.05, max: 0.1, format: 'percent' },
  { id: 'luck', name: 'Luck', min: 0.03, max: 0.06, format: 'percent' },
];
