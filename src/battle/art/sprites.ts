// Placeholder pixel art, drawn as character grids. Each character maps to a colour in
// the sprite's palette; '.' is transparent. Textures are generated at startup from these,
// so swapping in a real sprite sheet later means replacing textures with the same keys.
//
// Enemies face left (towards Nobody). Nobody faces right. Weapons point up, grip at the bottom.

export interface PixelSprite {
  rows: string[];
  palette: Record<string, string>;
  /** Bottom rows that shuffle for the walk frame (legs, wheels). 0 = no walk frame. */
  legRows?: number;
}

const OUTLINE = '#101418';

export const SPRITES: Record<string, PixelSprite> = {
  // ---------------- Nobody ----------------
  nobody: {
    legRows: 8,
    palette: {
      k: OUTLINE, h: '#3a4350', H: '#4b5664', f: '#c99a74', F: '#a87b58', e: '#101418',
      j: '#5d6670', J: '#474f58', b: '#2a2f36', p: '#2c333c', o: '#191d22', s: '#b6ff3b',
    },
    rows: [
      '....kkkkk.......',
      '...kHHHHHk......',
      '..kHhhhhhhk.....',
      '..khhhFfffk.....',
      '..khhFffefk.....',
      '..khhFffffk.....',
      '...khhFFfk......',
      '....kkfffk......',
      '...kjjjjjjk.....',
      '..kjjjjjjjjk....',
      '..kjJjjjjjjjk...',
      '..kjJjjjjjjjk...',
      '..kjJjjjjsjjk...',
      '..kjJjjjjjjfk...',
      '..kjjjjjjjjk....',
      '..kjjjjjjjjk....',
      '...kbbbbbbk.....',
      '...kppppppk.....',
      '...kppkkppk.....',
      '...kppk.kppk....',
      '...kppk.kppk....',
      '...kppk..kppk...',
      '..kooook.kooook.',
      '..kooook.kooook.',
    ],
  },
  /** Torso-only mask, tinted with the equipped Body item's tier colour. */
  nobodyJacket: {
    palette: { w: '#ffffff' },
    rows: [
      '................', '................', '................', '................',
      '................', '................', '................', '................',
      '....wwwwww......',
      '...wwwwwwww.....',
      '...w.wwwwwww....',
      '...w.wwwwwww....',
      '...w.wwwwwww....',
      '...w.wwwwww.....',
      '...wwwwwwww.....',
      '...wwwwwwww.....',
      '................', '................', '................', '................',
      '................', '................', '................', '................',
    ],
  },

  // ---------------- Weapons (grip at bottom centre) ----------------
  pipe: {
    palette: { k: OUTLINE, g: '#8b8f94', G: '#5f6368', r: '#a0522d' },
    rows: [
      '.kkk.', 'kgggk', 'kgGrk', '.kgk.', '.kgk.', '.kgk.', '.krk.', '.kgk.',
      '.kgk.', '.kGk.', '.kgk.', '.krk.', '.kgk.', '.kgk.', '.kGk.', '.kkk.',
    ],
  },
  wrench: {
    palette: { k: OUTLINE, g: '#9aa0a6', G: '#6b7076', r: '#8a4b2a' },
    rows: [
      'kk.kk', 'kgkgk', 'kgggk', '.kgk.', '.kgk.', '.kGk.', '.kgk.', '.kgk.',
      '.krk.', '.kgk.', '.kGk.', '.kgk.', '.kgk.', '.kkk.',
    ],
  },
  taser: {
    palette: { k: OUTLINE, y: '#d9c23a', d: '#2a2f36', b: '#7fd3ff', w: '#ffffff' },
    rows: [
      'b...b', 'w...w', 'kk.kk', 'kykyk', 'kyyyk', 'kdddk', 'kyyyk', 'kdddk',
      '.kdk.', '.kdk.', '.kdk.', '.kkk.',
    ],
  },
  baton: {
    palette: { k: OUTLINE, a: '#19e3c8', A: '#a8fff2', d: '#1e252c', g: '#3d4650' },
    rows: [
      '.kAk.', '.kak.', '.kAk.', '.kak.', '.kak.', '.kAk.', '.kak.', '.kak.',
      '.kak.', 'kgggk', '.kdk.', '.kdk.', '.kdk.', '.kdk.', '.kgk.', '.kkk.',
    ],
  },
  cutter: {
    palette: { k: OUTLINE, p: '#7c8cff', P: '#d6dbff', y: '#e0b03a', d: '#2c3138', g: '#59616b' },
    rows: [
      '..P..', '.pPp.', '.kPk.', 'kgggk', 'kgygk', 'kgggk', 'kgdgk', 'kgggk',
      '.kdk.', '.kdk.', '.kdk.', '.kdk.', '.kgk.', '.kkk.',
    ],
  },
  shockblade: {
    palette: { k: OUTLINE, p: '#ff4f8b', P: '#ffd1e1', s: '#c7ccd1', d: '#262b31' },
    rows: [
      '..k..', '.kPk.', '.kPk.', '.kpPk', '.kpPk', '.kpPk', '.kpPk', '.kpPk',
      '.kpPk', '.kpPk', '.kpPk', 'kssssk', '.kdk.', '.kdk.', '.kdk.', '.kkk.',
    ],
  },
  mindblade: {
    palette: { k: OUTLINE, y: '#f2b705', Y: '#fff1b0', c: '#7a5c00', d: '#262b31' },
    rows: [
      '..k..', '.kYk.', '.kYk.', '.kyYk', '.kycYk', '.kyYk', '.kcYk', '.kyYk',
      '.kyck', '.kyYk', '.kyYk', '.kyYk', 'kyyyyk', '.kdk.', '.kdk.', '.kdk.', '.kkk.',
    ],
  },
  starshard: {
    palette: { w: '#ffffff', a: '#e8f7ff', p: '#ffb3f0', b: '#b3d4ff', g: '#b3ffe0' },
    rows: [
      '...w...', '..waw..', '..apa..', '.wabaw.', '.apgpa.', 'wabwbaw', '.agpga.', '.wabaw.',
      '..apa..', '..aba..', '..waw..', '...a...', '.......', '...w...', '..waw..', '...w...',
    ],
  },

  // ---------------- Enemies ----------------
  rat: {
    legRows: 2,
    palette: { k: OUTLINE, g: '#7a6a5c', d: '#55483d', p: '#e08a9a', r: '#ff4f4f' },
    rows: [
      '....kk..........',
      '...kppk.........',
      '..kgggggkkk.....',
      '.krgggggggggk...',
      'kpggggggggggggkk',
      '.kgggggggggggk.p',
      '..kgdgkkgdgkk..p',
      '...kd...kd......',
    ],
  },
  dog: {
    legRows: 3,
    palette: { k: OUTLINE, b: '#8b6b4a', d: '#5e4630', r: '#ff4f4f', w: '#e6edf3' },
    rows: [
      '..kk................',
      '.kdbk...............',
      'krbbbk..............',
      'kbbbbbk.............',
      'kwbbbbbkkkkkkkkkkk..',
      '.kbbbbbbbbbbbbbbbbkk',
      '..kbbbbbbbbbbbbbbk.d',
      '...kbdbbbbbbbbdbk...',
      '...kbk.......kbk....',
      '...kbk.......kbk....',
      '..kdk.......kdk.....',
    ],
  },
  scrapper: {
    legRows: 6,
    palette: { k: OUTLINE, h: '#6b3f2a', f: '#b8896a', e: '#ff7a2f', j: '#7a5a3a', J: '#5c4129', p: '#3a3f46', o: '#1c2025', w: '#8b8f94' },
    rows: [
      '.....kkkk....',
      '....khhhhk...',
      '...khhhhhhk..',
      '...kfefhhhk..',
      '...kfffhhhk..',
      '....kffhhk...',
      'kw.kjjjjjjk..',
      'kwkjjjjjjjjk.',
      '.kwjjJjjjjjk.',
      '..kjjJjjjjjk.',
      '..kjjJjjjjjk.',
      '..kjjjjjjjjk.',
      '...kppppppk..',
      '...kppkkppk..',
      '...kppk.kppk.',
      '...kppk.kppk.',
      '..koook.koook',
      '..koook.koook',
    ],
  },
  servicebot: {
    legRows: 3,
    palette: { k: OUTLINE, w: '#cfd6dc', g: '#8e99a3', d: '#4a535c', c: '#19e3c8', r: '#ff4f4f', y: '#f2b705' },
    rows: [
      '......kyk.....',
      '.......k......',
      '...kkkkkkkk...',
      '..kwwwwwwwwk..',
      '..kwcwwwcwwk..',
      '..kwwwwwwwwk..',
      '..kgkkkkkkgk..',
      '..kgggggggggk.',
      '.kwgrgggggggk.',
      '.kwggggggggk..',
      '..kgggggggk...',
      '...kdddddk....',
      '..kdkkdkkdk...',
      '..kd.kdk.dk...',
      '...kk...kk....',
    ],
  },
  hound: {
    legRows: 4,
    palette: { k: OUTLINE, m: '#6f7a85', M: '#a3adb7', d: '#3c444d', r: '#ff2a2a', R: '#ffb3b3', y: '#f2b705' },
    rows: [
      '...kkk......................',
      '..kmmMk.....................',
      '.kmmmmmk....................',
      'kRrmmmmmk...................',
      'krrmmmmmmk..................',
      'kmmmmmmmmmkkkkkkkkkkkkkkk...',
      '.kdkmmmmmmmMMMMMMMMMMMMMMkk.',
      '..kdmmmmmmmmmmmmmmmmmmmmmmmk',
      '...kmmmmmmmmmmmmmmmmmmmmmk.y',
      '...kmmdmmmmmmmmmmmmmmdmmk...',
      '...kmmkkkkkkkkkkkkkkkmmk....',
      '...kmk.............kmmk.....',
      '..kmmk............kmmk......',
      '..kdk.............kdk.......',
      '.kdk.............kdk........',
    ],
  },
  truck: {
    legRows: 4,
    palette: { k: OUTLINE, w: '#d6dde3', g: '#9aa5ae', d: '#3c444d', a: '#19e3c8', y: '#f2b705', b: '#1c2b33', t: '#5a6670' },
    rows: [
      '....kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk......',
      '....kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.....',
      '....kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.....',
      '....kwwaaaaaaawwwwwwwwwwwwwwwwwwwwk.....',
      '....kwwawwwwwawwwaawaawwwwwwwwwwwwk.....',
      '....kwwaaaaaaawwwwwwwwwwwwwwwwwwwwk.....',
      'kkkkkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.....',
      'kbbbkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.....',
      'kbbbkwgggggggggggggggggggggggggggwk.....',
      'kbbbkwggtgtgtgtgtgtgtgtgtgtgtgtggwk.....',
      'kgggkwgggggggggggggggggggggggggggwk.....',
      'kyggkwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.....',
      'kggggkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.....',
      'kdddddddddddddddddddddddddddddddddk.....',
      '.kkkdddk..............kkkdddk...........',
      '..kdddddk............kdddddk............',
      '..kddgddk............kddgddk............',
      '...kdddk..............kdddk.............',
    ],
  },

  // ---------------- Boss accessories ----------------
  crown: {
    palette: { k: OUTLINE, y: '#f2b705', r: '#ff4f8b' },
    rows: ['k.k.k', 'kykyk', 'kyryk', 'kkkkk'],
  },
  tophat: {
    palette: { k: OUTLINE, d: '#1c2025', r: '#ff7a2f' },
    rows: ['.kkkk.', '.kddk.', '.kddk.', '.krrk.', 'kkkkkk'],
  },
  collar: {
    palette: { k: OUTLINE, s: '#c7ccd1' },
    rows: ['ksksksk', 'kkkkkkk'],
  },

  // ---------------- Loot ----------------
  scrapBit: { palette: { k: OUTLINE, g: '#9aa0a6', r: '#a0522d' }, rows: ['kgk', 'grg', 'kgk'] },
  coin: { palette: { k: OUTLINE, y: '#f2b705', Y: '#fff1b0' }, rows: ['.kkk.', 'kyYyk', 'kYyyk', 'kyyyk', '.kkk.'] },
  crate: {
    palette: { k: OUTLINE, b: '#7a5a3a', B: '#9b7550', w: '#ffffff' },
    rows: ['kkkkkkkk', 'kBBBBBBk', 'kbkbbkbk', 'kbbkkbbk', 'kbbkkbbk', 'kbkbbkbk', 'kBBBBBBk', 'kkkkkkkk'],
  },
  spark: { palette: { w: '#ffffff' }, rows: ['w'] },

  // ---------------- UI art (used by React, not Phaser) ----------------
  workbench: {
    palette: {
      k: OUTLINE, w: '#6b4e36', W: '#83613f', b: '#4a3524', d: '#2a2f36', D: '#1c2025',
      y: '#c4925c', a: '#19e3c8', A: '#0f7f72', g: '#8b8f94', G: '#5f6368', r: '#ff7a2f',
    },
    rows: [
      '.........kkkkkk.................',
      '.........kAaaAk.......kkk.......',
      '.........kaAAak......kgGgk......',
      '.........kAaaAk..k...kgGgk..r...',
      '.........kkkkkk.kgk..kkgkk.kgk..',
      '...kk.....kddk..kgk...kgk..kgk..',
      '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
      '.kWWWWWWWWWWWWWWWWWWWWWWWWWWWWk.',
      '.kwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
      '..kbk...kkkkkkkkkk.........kbk..',
      '..kbk...kddddddddk.........kbk..',
      '..kbk...kdddyyddddk........kbk..',
      '..kbk...kddddddddk.........kbk..',
      '..kbk...kkkkkkkkkk.........kbk..',
      '..kbk...kddddddddk.........kbk..',
      '..kbk...kdddyydddk.........kbk..',
      '..kbk...kkkkkkkkkk.........kbk..',
      '.kbbbk....................kbbbk.',
      '.kkkkk....................kkkkk.',
    ],
  },
};

/** How each enemy id is drawn. Bosses reuse base art, scaled up, with an accessory. */
export const ENEMY_ART: Record<string, { sprite: string; scale: number; tint?: number; accessory?: { sprite: string; x: number; y: number } }> = {
  rat: { sprite: 'rat', scale: 2 },
  dog: { sprite: 'dog', scale: 2 },
  scrapper: { sprite: 'scrapper', scale: 2 },
  servicebot: { sprite: 'servicebot', scale: 2 },
  ratking: { sprite: 'rat', scale: 4, tint: 0xd8c8b8, accessory: { sprite: 'crown', x: 5, y: -1 } },
  packleader: { sprite: 'dog', scale: 3.4, tint: 0x9a8a80, accessory: { sprite: 'collar', x: 2, y: 4 } },
  scrapbaron: { sprite: 'scrapper', scale: 3.2, accessory: { sprite: 'tophat', x: 4, y: -4 } },
  haywirebot: { sprite: 'servicebot', scale: 3.4, tint: 0xffb0a0 },
  hound: { sprite: 'hound', scale: 2.6 },
  truck: { sprite: 'truck', scale: 2.4 },
};
