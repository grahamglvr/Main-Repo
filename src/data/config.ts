// Player, Workbench and battle tuning. Costs scale exponentially, per GAME_DESIGN.md section 15.

export const PLAYER = {
  base: {
    damage: 8,
    health: 100,
    attackSpeed: 1,
    critChance: 0.05,
    critDamage: 1.5,
  },
  perLevel: { damage: 1, health: 6 },
  critChanceCap: 0.75,
  /** XP for level 1→2. Each level needs xpGrowth× more. */
  xpBase: 25,
  xpGrowth: 1.22,
};

export const WORKBENCH = {
  /** Scrap per salvage = salvageCostBase × salvageCostGrowth^(level−1), rounded. */
  salvageCostBase: 5,
  salvageCostGrowth: 1.1,
  /** Tokens to upgrade from level L = upgradeCostBase × upgradeCostGrowth^(L−1). */
  upgradeCostBase: 115,
  upgradeCostGrowth: 1.15,
  /** Seconds to upgrade from level L = upgradeTimeBase × upgradeTimeGrowth^(L−1). */
  upgradeTimeBase: 30,
  upgradeTimeGrowth: 1.1,
  /** Workbench level can't go above highest zone cleared + this. */
  capAboveZone: 5,
  maxLevel: 60,
  /** Boss crates roll at Workbench level + this (capped at maxLevel). */
  crateLevelBonus: 5,
  /** Chance each normal enemy drops an item directly (rolled at Workbench level). */
  directDropChance: 0.008,
};

export const BATTLE = {
  wavesPerZone: 10,
  /** [min, max] enemies for waves 1..10. */
  waveSizes: [
    [2, 2], [2, 3], [2, 3], [3, 3], [3, 4], [3, 4], [3, 4], [4, 5], [4, 5], [4, 5],
  ] as [number, number][],
  bossTimeLimit: 30,
  /** Enemy health and damage × this per zone. The design doc starting point was 1.12, but gear
   *  outgrew enemies and zone 10 took ~23 minutes with no walls; 1.205 hits the 45–60 minute target (`npm run sim`). */
  enemyGrowth: 1.205,
  /** Scrap, Tokens and XP from enemies × this per zone. */
  rewardGrowth: 1.15,
  /** Boss rewards are already in its data; this multiplies them on top. */
  bossRewardMultiplier: 1,
  /** Fraction of max health Nobody heals after each wave. */
  healBetweenWaves: 0.3,
  /** Seconds walking between waves. */
  waveGap: 1.4,
  /** Seconds between enemies spawning in a wave. */
  spawnInterval: 0.55,
  /** Seconds before restarting after dying or failing a boss. */
  defeatDelay: 2.5,

  // Battle field layout in scene units (the scene is 360 wide).
  playerX: 78,
  spawnX: 390,
  /** Distance from Nobody's centre to the front enemy's near edge when fighting. */
  engageDistance: 18,
  /** Gap between queued enemies. */
  enemySpacing: 4,
};

export const UI = {
  /** Minimum ms between ordinary thought bubbles. Important lines skip the queue. */
  bubbleCooldownMs: 7000,
  bubbleDurationMs: 4200,
  /** Random idle quip every this many ms of battle (roughly). */
  idleQuipMs: 50000,
};

export const DEBUG = {
  tokenCheats: [1_000, 100_000],
  scrapCheats: [500, 50_000],
  luckOptions: [0, 0.5, 2],
  speedOptions: [1, 3, 10],
  simulateSalvages: 10_000,
};
