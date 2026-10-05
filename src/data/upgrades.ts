import type { SpotDef, UpgradeDef } from '../game/types';

// Levelled upgrades. Cost = ceil(baseCost × costGrowth^level).
export const UPGRADES: Record<UpgradeDef['id'], UpgradeDef> = {
  tapPower: {
    id: 'tapPower',
    name: 'Faster Hands',
    description: 'Rummage faster. Dignity sold separately.',
    effectLabel: '+0.25 search per tap',
    baseCost: 15,
    costGrowth: 1.55,
    maxLevel: 20,
    perLevel: 0.25,
  },
  bagSize: {
    id: 'bagSize',
    name: 'Bigger Bag',
    description: "More pockets. They're mostly holes, but bigger holes.",
    effectLabel: '+5 bag slots',
    baseCost: 25,
    costGrowth: 1.5,
    maxLevel: 25,
    perLevel: 5,
  },
};

// Scavenging spots, bought in order. Higher luck shifts odds towards rarer tiers.
export const SPOTS: SpotDef[] = [
  {
    id: 'roadside-bin',
    name: 'Roadside Bin',
    description: 'Smells like regret and wet cardboard.',
    cost: 0,
    luck: 1,
  },
  {
    id: 'alley-dumpster',
    name: 'Back-alley Dumpster',
    description: 'Restaurant scraps and the odd modem. Fine dining.',
    cost: 150,
    luck: 1.08,
  },
  {
    id: 'e-waste-pile',
    name: 'E-waste Pile',
    description: 'A mountain of Spire leftovers. Mind the leaking batteries.',
    cost: 1500,
    luck: 1.16,
  },
  {
    id: 'spire-dump-chute',
    name: 'Spire Dump Chute',
    description: 'Their trash is my treasure. Their treasure is also my treasure, ideally.',
    cost: 12000,
    luck: 1.25,
  },
];
