// Shared shapes for game data and state. Balance values live in src/data/, not here.

export type TierId =
  | 'old'
  | 'basic'
  | 'commercial'
  | 'industrial'
  | 'military'
  | 'ai'
  | 'celestial';

export interface TierDef {
  id: TierId;
  name: string;
  colour: string;
  /** Base drop chance in percent. All tiers should add up to 100. */
  baseRate: number;
  /** Screen flash when an item of this tier drops. null = no flash. */
  flash: { opacity: number; durationMs: number } | null;
  /** Animated prismatic shimmer on the item name (Celestial). */
  shimmer?: boolean;
}

export interface ItemDef {
  id: string;
  name: string;
  tier: TierId;
  /** Tokens paid per item when sold. */
  value: number;
  /** One-line joke in Nobody's voice. */
  description: string;
  /** Relative chance within its tier. Defaults to 1. */
  weight?: number;
}

export interface SpotDef {
  id: string;
  name: string;
  description: string;
  /** Tokens to move here. The first spot should cost 0. */
  cost: number;
  /**
   * Shifts odds towards higher tiers. Each tier's weight is
   * baseRate × luck^tierIndex (Old = 0), then normalised. 1 = base rates.
   */
  luck: number;
}

export type UpgradeId = 'tapPower' | 'bagSize';

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  description: string;
  /** What one level adds, shown in the UI. */
  effectLabel: string;
  baseCost: number;
  /** Cost = ceil(baseCost × costGrowth^level). */
  costGrowth: number;
  maxLevel: number;
  /** Amount added per level to the stat this upgrade improves. */
  perLevel: number;
}

export interface FeedEntry {
  key: number;
  itemId: string;
}

export interface GameState {
  tokens: number;
  /** Search progress towards the next drop. A drop happens every CONFIG.searchCost. */
  progress: number;
  /** itemId → count */
  inventory: Record<string, number>;
  upgrades: Record<UpgradeId, number>;
  spotIndex: number;
  /** Newest first. */
  feed: FeedEntry[];
  nextFeedKey: number;
  stats: {
    taps: number;
    tokensEarned: number;
    drops: Record<TierId, number>;
  };
  debug: {
    /** Multiplies the spot's luck. 1 = normal. */
    luck: number;
    /** Every drop is from this tier when set. */
    forceTier: TierId | null;
  };
}
