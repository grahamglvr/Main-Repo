// Short lines in Nobody's voice. One is picked at random where there's a list.
export const LINES = {
  intro:
    "Ah, bin diving. The glamorous start every legend has. Tap the bin. No, really, that's the game for now.",
  bagFull: [
    "Bag's full. Sell something before I start wearing it.",
    "No room. I'm a scavenger, not a storage unit.",
    'The bag is full. My pockets are full. My spirit is, as ever, empty.',
  ],
  sold: [
    'Sold. Somebody, somewhere, is overpaying. Probably.',
    'Tokens! Real, actual, slightly sticky Tokens.',
    'Another fortune made. Small fortune. Tiny, really.',
  ],
  cantAfford: [
    "Can't afford it. Story of my life, and also this game.",
    'Not enough Tokens. Have you tried tapping more? I hear it works.',
  ],
  upgraded: [
    'Upgraded. I can feel the grind getting slightly less grindy.',
    'Money well spent. Probably. Ask me again in 400 bins.',
  ],
  moved: 'New spot. Same me, slightly better smells.',
} as const;

// Empty-state text for the UI panels.
export const EMPTY_LINES = {
  feed: 'Nothing yet. The bin is waiting. The bin is always waiting.',
  bag: 'Empty. Like my bank account. Go tap something.',
} as const;
