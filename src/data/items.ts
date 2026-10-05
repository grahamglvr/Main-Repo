import type { ItemDef } from '../game/types';

// Scrapper-stage loot. Every tier needs at least one item.
// value = Tokens per item when sold. weight = chance within its tier (default 1).
export const ITEMS: ItemDef[] = [
  // Old Tech
  {
    id: 'floppy-disk',
    name: 'Floppy Disk',
    tier: 'old',
    value: 1,
    weight: 1.5,
    description: 'Holds 1.44MB, roughly a third of a cat photo. Priceless.',
  },
  {
    id: 'ball-mouse',
    name: 'Ball Mouse',
    tier: 'old',
    value: 1,
    weight: 1.5,
    description: 'Comes with a free ball of hair. Please do not ask whose.',
  },
  {
    id: 'dial-up-modem',
    name: 'Dial-up Modem',
    tier: 'old',
    value: 2,
    description: 'Makes a noise like a robot being strangled. Peak technology.',
  },
  {
    id: 'beige-processor',
    name: 'Beige Processor Chip',
    tier: 'old',
    value: 2,
    description: 'Ran a whole office in 1998. Now it struggles to run my self-esteem.',
  },
  {
    id: 'flip-phone',
    name: 'Flip Phone',
    tier: 'old',
    value: 3,
    weight: 0.7,
    description: 'Snaps shut like you just ended an important call. You never had one.',
  },

  // Basic Tech
  {
    id: 'tangled-earbuds',
    name: 'Tangled Earbuds',
    tier: 'basic',
    value: 4,
    weight: 1.3,
    description: 'One side works. The other side is just for vibes.',
  },
  {
    id: 'budget-battery',
    name: 'Budget Battery',
    tier: 'basic',
    value: 5,
    description: "Lasts about as long as a New Year's resolution.",
  },
  {
    id: 'knockoff-charger',
    name: 'Knock-off Charger',
    tier: 'basic',
    value: 6,
    description: 'Charges your phone and, occasionally, your curtains.',
  },
  {
    id: 'cheap-phone-board',
    name: 'Cheap Phone Board',
    tier: 'basic',
    value: 8,
    weight: 0.7,
    description: 'Third-hand, fourth-rate, fully cracked. Relatable.',
  },

  // Commercial Tech
  {
    id: 'retail-processor',
    name: 'Retail Processor',
    tier: 'commercial',
    value: 35,
    description: "Sticker says 'Powering Tomorrow!' It barely powered last Tuesday.",
  },
  {
    id: 'smart-fridge-brain',
    name: 'Smart Fridge Brain',
    tier: 'commercial',
    value: 45,
    weight: 0.8,
    description: "Knows you're out of milk. Has opinions about it.",
  },

  // Industrial Tech
  {
    id: 'drone-motor',
    name: 'Drone Motor',
    tier: 'industrial',
    value: 140,
    description: 'Flew Spire parcels over the Groves for years. Never once dropped one by accident.',
  },

  // Military Tech
  {
    id: 'combat-chip',
    name: 'Encrypted Combat Chip',
    tier: 'military',
    value: 500,
    description: 'Designed to win wars. Currently living in a bin with me.',
  },

  // AI Tech
  {
    id: 'mind-core-fragment',
    name: 'Mind Core Fragment',
    tier: 'ai',
    value: 2500,
    description: "It keeps asking if you've considered a career change.",
  },

  // Celestial Tech
  {
    id: 'humming-shard',
    name: 'Humming Shard',
    tier: 'celestial',
    value: 20000,
    description: "Warm, weightless, and humming a song I somehow miss. Don't tell the Spires.",
  },
];
