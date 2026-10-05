export const CONFIG = {
  startingTokens: 0,
  /** Search progress needed for one drop. */
  searchCost: 3,
  /** Search progress added per tap before upgrades. 1 tap = 1/3 of a drop. */
  baseTapPower: 1,
  baseBagSize: 20,
  /** How many recent drops the feed keeps. */
  feedLength: 30,

  debug: {
    /** Luck multipliers to pick from in the debug panel. */
    luckOptions: [1, 1.5, 2, 3],
    tokenCheats: [1_000, 100_000, 10_000_000],
    simulateRolls: 10_000,
  },
} as const;
