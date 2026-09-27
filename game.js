// Hawd Yer Weesht, It's the Apocalypse: a 2D survival, crafting and building game set in 2210.
// World is a grid of tiles; the player mines blocks, crafts items and builds.
(() => {
  'use strict';

  const TILE = 32;          // on-screen pixels per tile
  const W = 256, H = 96;    // world size in tiles
  const REACH = 5.5;        // tiles
  const GRAVITY = 32, JUMP = -11.5, SPEED = 5.5, MAX_FALL = 22;
  const STACK = 99;
  const INV_SIZE = 36;      // first 9 slots are the hotbar
  const STATION_RANGE = 4;
  const SAVE_KEY = 'blockstead-save-v1';

  // ---------- Random numbers and noise ----------
  function mulberry32(a) {
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(x, y, seed) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const smooth = t => t * t * (3 - 2 * t);
  function noise2(x, y, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const u = smooth(x - xi), v = smooth(y - yi);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // ---------- Blocks ----------
  const B = {
    AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG: 5, LEAVES: 6, PLANK: 7,
    COAL_ORE: 8, IRON_ORE: 9, SAND: 10, BENCH: 11, FURNACE: 12, BRICK: 13,
    GLASS: 14, TORCH: 15, LADDER: 16, BEDROCK: 17, BUSH: 18,
    OAK_LOG: 19, OAK_LEAVES: 20, CHEST: 21, SCRAP: 22, ASH: 23, CAMPFIRE: 24, VENDING: 25, VENDING_EMPTY: 26, GLOWCAP: 27,
  };
  // hard: seconds to mine by hand. tier: tool tier needed (any pickaxe or hatchet counts).
  // pref: the tool that mines it at full speed ('pick' or 'axe'); other tools still help a little.
  // fastTier: tools below this tier (and bare hands) are much slower on it.
  // cost: how much light drops passing through. sky: sunlight passes straight down through it.
  const BLOCK = [];
  function def(id, o) {
    BLOCK[id] = Object.assign({ solid: true, hard: 1, tier: 0, fastTier: 0, pref: null, drop: null, dropN: 1, light: 0, cost: 3, sky: false, climb: false }, o);
  }
  def(B.AIR, { name: 'Air', solid: false, hard: 0, cost: 1, sky: true });
  def(B.GRASS, { name: 'Dry Grass', hard: 0.6, drop: 'dirt' });
  def(B.DIRT, { name: 'Dirt', hard: 0.5, drop: 'dirt' });
  def(B.STONE, { name: 'Stone', hard: 1.8, tier: 1, pref: 'pick', drop: 'cobble' });
  def(B.COBBLE, { name: 'Cobblestone', hard: 2, tier: 1, pref: 'pick', drop: 'cobble' });
  def(B.LOG, { name: 'Log', hard: 1.3, pref: 'axe', drop: 'log' });
  def(B.LEAVES, { name: 'Leaves', solid: false, hard: 0.25, pref: 'axe', cost: 2, sky: true });
  def(B.PLANK, { name: 'Planks', hard: 1, pref: 'axe', drop: 'plank' });
  def(B.COAL_ORE, { name: 'Coal Ore', hard: 2.2, tier: 1, pref: 'pick', drop: 'coal' });
  def(B.IRON_ORE, { name: 'Iron Ore', hard: 2.8, tier: 2, pref: 'pick', drop: 'iron_ore' });
  def(B.SAND, { name: 'Sand', hard: 0.5, drop: 'sand' });
  def(B.BENCH, { name: 'Workbench', hard: 1.2, pref: 'axe', drop: 'bench', solid: false, cost: 1, sky: true });
  def(B.FURNACE, { name: 'Furnace', hard: 2.2, tier: 1, pref: 'pick', drop: 'furnace', light: 8 });
  def(B.BRICK, { name: 'Stone Bricks', hard: 2.4, tier: 1, pref: 'pick', drop: 'brick' });
  def(B.GLASS, { name: 'Glass', hard: 0.4, drop: 'glass', cost: 1, sky: true });
  def(B.TORCH, { name: 'Torch', solid: false, hard: 0.05, drop: 'torch', light: 14, cost: 1, sky: true });
  def(B.LADDER, { name: 'Ladder', solid: false, hard: 0.3, pref: 'axe', drop: 'ladder', cost: 1, sky: true, climb: true });
  def(B.BEDROCK, { name: 'Bedrock', hard: Infinity, tier: 99 });
  def(B.BUSH, { name: 'Bush', solid: false, hard: 0.4, pref: 'axe', cost: 1, sky: true });
  // Oak: 5x tougher than a normal log, gives 2x the wood, and wants a stone hatchet or better.
  def(B.OAK_LOG, { name: 'Oak Log', hard: 6.5, fastTier: 2, pref: 'axe', drop: 'oak_log', dropN: 2 });
  def(B.OAK_LEAVES, { name: 'Oak Leaves', solid: false, hard: 0.3, pref: 'axe', cost: 2, sky: true });
  def(B.CHEST, { name: 'Supply Chest', solid: false, hard: 1, pref: 'axe', cost: 1, sky: true });
  def(B.SCRAP, { name: 'Scrap Metal', hard: 1.6, tier: 1, pref: 'pick', drop: 'scrap' });
  def(B.ASH, { name: 'Ash', hard: 0.4, drop: 'dirt' });
  // Irn Bru machines sit in old rooms deep underground. Right click for cans; empty ones can be broken for scrap.
  def(B.VENDING, { name: 'Irn Bru Machine', solid: false, hard: 2, tier: 1, pref: 'pick', drop: 'scrap', dropN: 2, light: 7, cost: 1, sky: true });
  def(B.VENDING_EMPTY, { name: 'Empty Irn Bru Machine', solid: false, hard: 2, tier: 1, pref: 'pick', drop: 'scrap', dropN: 2, cost: 1, sky: true });
  // Glowcaps: eerie cave mushrooms that light the Haggis lair. Not fire, so Peely-Wallies don't mind them.
  def(B.GLOWCAP, { name: 'Glowcap', solid: false, hard: 0.2, drop: 'fibre', light: 11, cost: 1, sky: true });
  def(B.CAMPFIRE, { name: 'Wee Fire', solid: false, hard: 0.8, pref: 'axe', drop: 'campfire', light: 13, cost: 1, sky: true });

  // ---------- Items ----------
  // cat: Equipment, Health, Resources or Building.
  const CATS = ['Equipment', 'Health', 'Resources', 'Building'];
  const ITEM = {
    dirt: { name: 'Dirt', block: B.DIRT },
    cobble: { name: 'Cobblestone', block: B.COBBLE },
    log: { name: 'Log', block: B.LOG, cat: 'Resources' },
    plank: { name: 'Planks', block: B.PLANK },
    sand: { name: 'Sand', block: B.SAND },
    bench: { name: 'Workbench', block: B.BENCH },
    furnace: { name: 'Furnace', block: B.FURNACE },
    campfire: { name: 'Wee Fire', block: B.CAMPFIRE },
    brick: { name: 'Stone Bricks', block: B.BRICK },
    glass: { name: 'Glass', block: B.GLASS },
    torch: { name: 'Torch', block: B.TORCH },
    ladder: { name: 'Ladder', block: B.LADDER },
    iron_ore: { name: 'Iron Ore', block: B.IRON_ORE, cat: 'Resources' },
    oak_log: { name: 'Oak Log', iconBlock: B.OAK_LOG, cat: 'Resources' },
    stick: { name: 'Stick', cat: 'Resources' },
    coal: { name: 'Coal', cat: 'Resources' },
    iron_ingot: { name: 'Iron Ingot', cat: 'Resources' },
    scrap: { name: 'Scrap Metal', iconBlock: B.SCRAP, cat: 'Resources' },
    fibre: { name: 'Fibre', cat: 'Resources' },
    string: { name: 'String', cat: 'Resources' },
    rope: { name: 'Rope', cat: 'Resources' },
    raw_meat: { name: 'Raw Meat', food: 10, sick: 5, cat: 'Resources' },
    berries: { name: 'Wee Berries', heal: 10, food: 15, cat: 'Health' },
    cooked_meat: { name: 'Rat Piece', heal: 25, food: 40, cat: 'Health' },
    bandage: { name: 'Big Plaster', heal: 30, cat: 'Health' },
    irn_bru: { name: 'Irn Bru', bru: 60, cat: 'Health' },
    haggis_supper: { name: 'Haggis Supper', heal: 100, food: 100, cat: 'Health' },
    empty_can: { name: 'Irn Bru Empty', cat: 'Resources' },
    wood_pick: { name: 'Wooden Pickaxe', tool: 'pick', tier: 1, speed: 2.5 },
    stone_pick: { name: 'Stone Pickaxe', tool: 'pick', tier: 2, speed: 4.5 },
    iron_pick: { name: 'Iron Pickaxe', tool: 'pick', tier: 3, speed: 7 },
    wood_axe: { name: 'Wooden Hatchet', tool: 'axe', tier: 1, speed: 2.5 },
    stone_axe: { name: 'Stone Hatchet', tool: 'axe', tier: 2, speed: 4.5 },
    iron_axe: { name: 'Iron Hatchet', tool: 'axe', tier: 3, speed: 7 },
    wood_dagger: { name: 'Wooden Dagger', melee: 8 },
    stone_dagger: { name: 'Stone Dagger', melee: 12 },
    iron_dagger: { name: 'Iron Dagger', melee: 18 },
    claymore: { name: 'Claymore', melee: 28, sword: true },
    bru_shield: { name: 'Irn Bru Shield', shield: true },
    bagpipes: { name: 'Bagpipes', pipes: true },
    wood_bow: { name: 'Shortbow', bow: 16, bonus: 0 },
    oak_bow: { name: 'Oak Shortbow', bow: 20, bonus: 4 },
    iron_bow: { name: 'The Persuader', bow: 24, bonus: 8 },
    wood_arrow: { name: 'Wooden Arrows', arrow: 6, tip: '#b0844c' },
    stone_arrow: { name: 'Stone Arrows', arrow: 10, tip: '#8b8d93' },
    iron_arrow: { name: 'Iron Arrows', arrow: 15, tip: '#e1e3e8' },
  };
  for (const id in ITEM) {
    const it = ITEM[id];
    if (!it.cat) it.cat = it.tool || it.melee || it.bow || it.arrow || it.shield || it.pipes ? 'Equipment' : 'Building';
    if (it.tool || it.melee || it.bow || it.shield || it.pipes) it.stack = 1;
  }
  const ARROWS = ['iron_arrow', 'stone_arrow', 'wood_arrow']; // best first
  const tierName = t => ['your hands', 'a wooden tool', 'a stone tool', 'an iron tool'][t] || 'something stronger';
  // One-line summary shown in tooltips and the crafting list.
  function describe(id) {
    const it = ITEM[id];
    if (it.tool) return `Tier ${it.tier} · fastest on ${it.tool === 'axe' ? 'wood' : 'stone and ore'}`;
    if (it.sword) return `Melee damage ${it.melee} · the Irn Bru Shield equips with it`;
    if (it.melee) return `Melee damage ${it.melee}`;
    if (it.shield) return 'Equips with the Claymore · blocks 30% of hits and 60% of spit';
    if (it.pipes) return 'Play them in the Haggis lair at the bottom of the world · right click';
    if (it.bow) return `Shoots arrows${it.bonus ? ` · +${it.bonus} damage` : ''}`;
    if (it.arrow) return `Arrow damage ${it.arrow}`;
    if (it.sick) return `+${it.food} food, but eating it raw hurts ${it.sick} · cook it first`;
    if (it.bru) return `Bru Rush: unlimited stamina and +${BRU_HP} health for ${it.bru}s · right click to drink`;
    if (it.heal || it.food) return [it.heal && `Heals ${it.heal}`, it.food && `+${it.food} food`].filter(Boolean).join(' · ') + ' · right click to use';
    if (it.block) return 'Right click to place';
    return '';
  }

  const RECIPES = [
    // Resources
    { out: 'plank', n: 4, needs: { log: 1 } },
    { out: 'plank', n: 4, needs: { oak_log: 1 } },
    { out: 'stick', n: 4, needs: { plank: 2 } },
    { out: 'string', n: 1, needs: { fibre: 2 } },
    { out: 'rope', n: 1, needs: { string: 2 } },
    { out: 'iron_ingot', n: 1, needs: { iron_ore: 1, coal: 1 }, at: 'furnace' },
    { out: 'iron_ingot', n: 1, needs: { scrap: 3, coal: 1 }, at: 'furnace' },
    // Building
    { out: 'bench', n: 1, needs: { plank: 4 } },
    { out: 'torch', n: 4, needs: { stick: 1, coal: 1 } },
    { out: 'ladder', n: 3, needs: { stick: 7 }, at: 'bench' },
    { out: 'ladder', n: 4, needs: { stick: 3, rope: 1 }, at: 'bench' },
    { out: 'furnace', n: 1, needs: { cobble: 8 }, at: 'bench' },
    { out: 'brick', n: 4, needs: { cobble: 4 }, at: 'bench' },
    { out: 'glass', n: 1, needs: { sand: 1 }, at: 'furnace' },
    // Health
    { out: 'campfire', n: 1, needs: { log: 3, stick: 2 } },
    { out: 'cooked_meat', n: 1, needs: { raw_meat: 1 }, at: ['campfire', 'furnace'] },
    { out: 'bandage', n: 1, needs: { string: 2, fibre: 2 } },
    // Equipment: tools
    { out: 'wood_pick', n: 1, needs: { plank: 3, stick: 2 }, at: 'bench' },
    { out: 'wood_axe', n: 1, needs: { plank: 3, stick: 2 }, at: 'bench' },
    { out: 'stone_pick', n: 1, needs: { cobble: 3, stick: 2, string: 1 }, at: 'bench' },
    { out: 'stone_axe', n: 1, needs: { cobble: 3, stick: 2, string: 1 }, at: 'bench' },
    { out: 'iron_pick', n: 1, needs: { iron_ingot: 3, stick: 2, rope: 1 }, at: 'bench' },
    { out: 'iron_axe', n: 1, needs: { iron_ingot: 3, stick: 2, rope: 1 }, at: 'bench' },
    // Equipment: weapons
    { out: 'wood_dagger', n: 1, needs: { plank: 2, stick: 1 }, at: 'bench' },
    { out: 'stone_dagger', n: 1, needs: { cobble: 2, stick: 1, string: 1 }, at: 'bench' },
    { out: 'iron_dagger', n: 1, needs: { iron_ingot: 2, stick: 1, rope: 1 }, at: 'bench' },
    { out: 'claymore', n: 1, needs: { iron_ingot: 4, oak_log: 1, rope: 1 }, at: 'bench' },
    { out: 'bru_shield', n: 1, needs: { empty_can: 6, iron_ingot: 2, rope: 1 }, at: 'bench' },
    { out: 'bagpipes', n: 1, needs: { raw_meat: 1, stick: 3, string: 2, oak_log: 1 }, at: 'bench' },
    { out: 'wood_bow', n: 1, needs: { stick: 3, rope: 1, string: 2 }, at: 'bench' },
    { out: 'oak_bow', n: 1, needs: { oak_log: 2, rope: 1, string: 2 }, at: 'bench' },
    { out: 'iron_bow', n: 1, needs: { iron_ingot: 2, oak_log: 1, rope: 1, string: 2 }, at: 'bench' },
    { out: 'wood_arrow', n: 8, needs: { stick: 1, fibre: 1 } },
    { out: 'stone_arrow', n: 12, needs: { stick: 1, cobble: 1 }, at: 'bench' },
    { out: 'iron_arrow', n: 12, needs: { stick: 1, iron_ingot: 1 }, at: 'bench' },
  ];
  const STATION_BLOCK = { bench: B.BENCH, furnace: B.FURNACE, campfire: B.CAMPFIRE };
  // A recipe's `at` is one station or a list where any of them will do.
  const stationsFor = r => r.at ? [].concat(r.at) : [];

  // ---------- Pixel-art textures ----------
  // Blocks are 32x32. Shapes are laid out on a 16-unit grid (each unit is 2x2 pixels),
  // then refineTexture() adds single-pixel grain, highlights and details on top.
  function makeCanvas(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  }
  function painter(c, seed) {
    const g = c.getContext('2d');
    if (c.width === 32) g.scale(2, 2);
    const rnd = mulberry32(seed);
    return {
      g, rnd,
      px(x, y, col, w = 1, h = 1) { g.fillStyle = col; g.fillRect(x, y, w, h); },
      fill(col) { g.fillStyle = col; g.fillRect(0, 0, 16, 16); },
      speckle(cols, density, y0 = 0, y1 = 16) {
        for (let y = y0; y < y1; y++) for (let x = 0; x < 16; x++) {
          if (rnd() < density) { g.fillStyle = cols[(rnd() * cols.length) | 0]; g.fillRect(x, y, 1, 1); }
        }
      },
      line(x0, y0, x1, y1, col, w = 1) {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        g.fillStyle = col;
        for (let i = 0; i <= n; i++) {
          const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
          g.fillRect(x, y, w, w);
        }
      },
    };
  }
  function drawStone(p, base = '#7d7f86') {
    p.fill(base);
    p.speckle(['#6a6c73', '#90939a', '#74767d'], 0.35);
  }
  function drawOre(p, cols) {
    drawStone(p);
    for (let k = 0; k < 5; k++) {
      const x = 1 + ((p.rnd() * 12) | 0), y = 1 + ((p.rnd() * 12) | 0);
      p.px(x, y, cols[0], 2, 2);
      p.px(x + 1, y, cols[1]);
      if (p.rnd() < 0.6) p.px(x + 2, y + 1, cols[0]);
    }
  }
  const TEX = [];
  // Terrain drawn as 4 smaller squares: each quarter of a block comes from one of 4 texture variants.
  const QUARTERED = new Set([B.GRASS, B.DIRT, B.STONE, B.COAL_ORE, B.IRON_ORE, B.SAND, B.ASH, B.BEDROCK, B.LEAVES, B.OAK_LEAVES]);
  // Terrain whose exposed outer corners are trimmed away, so slopes and edges look finer.
  const TRIMMED = new Set([B.GRASS, B.DIRT, B.STONE, B.COAL_ORE, B.IRON_ORE, B.SAND, B.ASH]);
  const TEXV = [];
  function buildTextures() {
    for (let id = 1; id < BLOCK.length; id++) {
      const n = QUARTERED.has(id) ? 4 : 1;
      TEXV[id] = [];
      for (let v = 0; v < n; v++) TEXV[id].push(drawBlockTexture(id, v));
      TEX[id] = TEXV[id][0];
    }
  }
  function drawBlockTexture(id, v) {
    {
      const c = makeCanvas(32), p = painter(c, id * 97 + 13 + v * 1009);
      switch (id) {
        case B.DIRT: p.fill('#7a5234'); p.speckle(['#5e3d25', '#8d6240', '#6c4a2f'], 0.3); break;
        case B.GRASS:
          p.fill('#7a5234'); p.speckle(['#5e3d25', '#8d6240'], 0.3);
          p.px(0, 0, '#8a9a3a', 16, 3); p.speckle(['#6f7d2c', '#a8ad4c', '#9a8a44'], 0.45, 0, 3);
          for (let x = 0; x < 16; x++) if (p.rnd() < 0.5) p.px(x, 3, '#6f7d2c', 1, 1 + ((p.rnd() * 2) | 0));
          break;
        case B.STONE: drawStone(p); break;
        case B.COBBLE:
          p.fill('#55575d');
          [[0, 0, 7, 5], [8, 0, 8, 4], [0, 6, 4, 5], [5, 6, 6, 4], [12, 5, 4, 6], [0, 12, 6, 4], [7, 11, 5, 5], [13, 12, 3, 4]]
            .forEach(([x, y, w, h]) => { p.px(x, y, '#7a7c83', w, h); p.px(x, y, '#8e9198', w, 1); });
          break;
        case B.LOG:
          p.fill('#6b4a2b');
          [1, 4, 8, 11, 14].forEach(x => p.px(x, 0, '#5a3d22', 1, 16));
          [2, 9].forEach(x => p.px(x, 0, '#7d5833', 1, 16));
          p.speckle(['#553a20'], 0.08);
          break;
        case B.LEAVES:
          p.fill('#5a7a30'); p.speckle(['#465f24', '#6f8f3c', '#7a7a34'], 0.45);
          for (let k = 0; k < 14; k++) p.g.clearRect((p.rnd() * 16) | 0, (p.rnd() * 16) | 0, 1, 1);
          break;
        case B.PLANK:
          p.fill('#b0844c');
          [3, 7, 11, 15].forEach(y => p.px(0, y, '#8a6436', 16, 1));
          [[5, 0], [12, 4], [3, 8], [10, 12]].forEach(([x, y]) => p.px(x, y, '#8a6436', 1, 3));
          p.speckle(['#a07542', '#bc9058'], 0.12);
          break;
        case B.COAL_ORE: drawOre(p, ['#23242a', '#45464d']); break;
        case B.IRON_ORE: drawOre(p, ['#c98f68', '#e7b995']); break;
        case B.SAND: p.fill('#dcc98f'); p.speckle(['#cbb67a', '#e8d8a4', '#d2bd82'], 0.4); break;
        case B.BENCH:
          p.px(0, 2, '#9c7040', 16, 4); p.px(0, 2, '#c49a5e', 16, 1); p.px(0, 5, '#7a5530', 16, 1);
          p.px(1, 6, '#7a5530', 3, 10); p.px(12, 6, '#7a5530', 3, 10);
          p.px(4, 10, '#8a6436', 8, 2);
          p.px(3, 0, '#8b8d93', 5, 2); p.px(10, 1, '#6b4a2b', 4, 1); // tools on top
          break;
        case B.FURNACE:
          drawStone(p, '#6a6c72');
          p.px(0, 0, '#55575d', 16, 1); p.px(0, 15, '#4a4c52', 16, 1);
          p.px(4, 7, '#1b1b1d', 8, 7); p.px(5, 11, '#e0782f', 6, 2); p.px(6, 12, '#ffcc4d', 4, 1);
          p.px(3, 6, '#4a4c52', 10, 1);
          break;
        case B.BRICK:
          p.fill('#8b8d93');
          [0, 8].forEach(y => p.px(0, y, '#66686e', 16, 1));
          [[0, 1], [8, 1], [4, 9], [12, 9]].forEach(([x, y]) => p.px(x, y, '#66686e', 1, 7));
          [1, 9].forEach(y => p.px(0, y, '#9ea0a6', 16, 1));
          break;
        case B.GLASS:
          p.g.fillStyle = 'rgba(190,225,240,0.18)'; p.g.fillRect(0, 0, 16, 16);
          p.px(0, 0, '#cfeaf5', 16, 1); p.px(0, 15, '#9cc7d8', 16, 1); p.px(0, 0, '#cfeaf5', 1, 16); p.px(15, 0, '#9cc7d8', 1, 16);
          p.line(3, 8, 8, 3, '#eaf7fc'); p.line(4, 11, 11, 4, 'rgba(234,247,252,0.6)');
          break;
        case B.TORCH:
          p.px(7, 6, '#7a5234', 2, 10); p.px(7, 6, '#8d6240', 1, 10);
          p.px(6, 2, '#ff8a2b', 4, 5); p.px(7, 3, '#ffcc4d', 2, 3); p.px(7, 1, '#ff8a2b', 2, 1); p.px(7, 4, '#fff3b0', 2, 1);
          break;
        case B.LADDER:
          p.px(2, 0, '#8a6436', 2, 16); p.px(12, 0, '#8a6436', 2, 16);
          [1, 5, 9, 13].forEach(y => { p.px(2, y, '#a67b47', 12, 2); p.px(2, y + 1, '#7a5530', 12, 1); });
          break;
        case B.BEDROCK: p.fill('#2b2b30'); p.speckle(['#44444b', '#1a1a1d', '#36363c'], 0.5); break;
        case B.OAK_LOG:
          p.fill('#4e3824');
          [0, 3, 6, 10, 13].forEach(x => p.px(x, 0, '#3b2a1a', 1, 16));
          [1, 7, 11].forEach(x => p.px(x, 0, '#6a4c30', 1, 16));
          for (let k = 0; k < 6; k++) p.px((p.rnd() * 15) | 0, (p.rnd() * 14) | 0, '#2e2014', 2, 2);
          break;
        case B.OAK_LEAVES:
          p.fill('#2f5a26'); p.speckle(['#244a1d', '#3f6f30', '#35632a'], 0.5);
          for (let k = 0; k < 8; k++) p.g.clearRect((p.rnd() * 16) | 0, (p.rnd() * 16) | 0, 1, 1);
          break;
        case B.CHEST:
          p.px(1, 4, '#8a5a2b', 14, 12); p.px(1, 4, '#a8733c', 14, 1);
          p.px(1, 8, '#5e3d1d', 14, 1); p.px(1, 15, '#5e3d1d', 14, 1);
          p.px(1, 4, '#6e6f72', 2, 12); p.px(13, 4, '#6e6f72', 2, 12);
          p.px(7, 7, '#e0b04a', 2, 3); p.px(7, 9, '#8a6a1c', 2, 1);
          break;
        case B.SCRAP:
          p.fill('#7a4a2a'); p.speckle(['#9a5e32', '#5a3a26', '#b06a36'], 0.4);
          p.px(1, 2, '#6e6f72', 6, 5); p.px(9, 8, '#5d5f63', 6, 6); p.px(2, 11, '#6e6f72', 4, 3);
          [[2, 3], [5, 3], [10, 9], [13, 12]].forEach(([x, y]) => p.px(x, y, '#9a9ca0'));
          p.px(0, 7, '#3e2a1c', 16, 1);
          break;
        case B.CAMPFIRE:
          [[1, 13], [4, 14], [11, 14], [13, 13]].forEach(([x, y]) => { p.px(x, y, '#6e6f72', 3, 3); p.px(x, y, '#8b8d93', 3, 1); });
          p.line(3, 14, 12, 10, '#6b4a2b', 2); p.line(3, 10, 12, 14, '#5a3d22', 2);
          p.px(6, 12, '#2a1a10', 4, 2);
          p.px(5, 6, '#ff8a2b', 6, 5); p.px(6, 4, '#ff8a2b', 4, 2); p.px(7, 2, '#ff8a2b', 2, 2);
          p.px(6, 7, '#ffcc4d', 4, 4); p.px(7, 5, '#ffcc4d', 2, 2); p.px(7, 8, '#fff3b0', 2, 2);
          break;
        case B.VENDING: case B.VENDING_EMPTY: {
          const on = id === B.VENDING;
          p.px(1, 0, on ? '#e0772a' : '#6a6c72', 14, 16);          // body
          p.px(1, 0, on ? '#f39a4e' : '#8b8d93', 14, 1);
          p.px(1, 0, on ? '#b85a1c' : '#4a4c52', 1, 16); p.px(14, 0, on ? '#b85a1c' : '#4a4c52', 1, 16);
          p.px(2, 2, on ? '#1f5fae' : '#3a3c42', 12, 3);          // blue logo band
          if (on) { p.px(3, 3, '#f4efe6', 3, 1); p.px(7, 3, '#f4efe6', 2, 1); p.px(10, 3, '#f4efe6', 3, 1); }
          p.px(2, 6, on ? '#1b2a3a' : '#16171a', 8, 7);           // window
          if (on) for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
            p.px(3 + c * 2 + (c > 0 ? c - 1 : 0), 7 + r * 2, '#e0772a', 1, 1); p.px(3 + c * 2 + (c > 0 ? c - 1 : 0), 8 + r * 2, '#1f5fae', 1, 1);
          }
          p.px(11, 6, on ? '#2a2a2e' : '#1e1f22', 2, 4);          // coin slot panel
          p.px(11, 7, on ? '#e8b83a' : '#3a3c42', 2, 1);
          p.px(2, 14, '#16171a', 12, 1);                           // can tray
          break;
        }
        case B.GLOWCAP:
          p.px(7, 9, '#cfe3d0', 2, 7); p.px(6, 14, '#a8c0aa', 4, 2);                 // stalk
          p.px(3, 6, '#3fd6c4', 10, 3); p.px(4, 5, '#3fd6c4', 8, 1); p.px(5, 4, '#8ff0e4', 6, 1); // cap
          p.px(5, 7, '#c8fff6', 1, 1); p.px(9, 6, '#c8fff6', 1, 1);
          p.px(1, 11, '#3fd6c4', 3, 2); p.px(2, 13, '#cfe3d0', 1, 3);               // wee one beside it
          break;
        case B.ASH: p.fill('#4a4744'); p.speckle(['#5d5955', '#383634', '#6a6560'], 0.45); break;
        case B.BUSH:
          p.px(2, 7, '#5a7a30', 12, 9); p.px(4, 5, '#5a7a30', 8, 2); p.px(1, 10, '#5a7a30', 14, 6);
          p.px(5, 4, '#6f8f3c', 5, 1);
          for (let k = 0; k < 18; k++) p.px(2 + ((p.rnd() * 12) | 0), 5 + ((p.rnd() * 10) | 0), p.rnd() < 0.5 ? '#465f24' : '#6f8f3c');
          [[4, 8], [9, 7], [11, 11], [6, 12]].forEach(([x, y]) => { p.px(x, y, '#b3263a', 2, 2); p.px(x, y, '#e2566b'); });
          break;
      }
      refineTexture(id, c, v);
      return c;
    }
  }

  const NATURAL = new Set([B.GRASS, B.DIRT, B.STONE, B.COAL_ORE, B.IRON_ORE, B.SAND, B.ASH, B.BEDROCK,
    B.LOG, B.OAK_LOG, B.LEAVES, B.OAK_LEAVES, B.BUSH, B.COBBLE, B.SCRAP]);
  const BUILT = new Set([B.PLANK, B.BRICK, B.FURNACE, B.CHEST, B.COBBLE, B.SCRAP]);
  function refineTexture(id, c, v = 0) {
    const g = c.getContext('2d'), rnd = mulberry32(id * 31 + 7 + v * 977);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop'; // only paint over pixels that are already there
    const dot = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    if (NATURAL.has(id)) {
      for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
        const r = rnd();
        if (r < 0.1) dot(x, y, 'rgba(255,255,255,0.08)');
        else if (r < 0.22) dot(x, y, 'rgba(0,0,0,0.1)');
      }
    }
    switch (id) {
      case B.GRASS:
        for (let x = 0; x < 32; x++) {
          if (rnd() < 0.35) dot(x, 0, '#b5bd5a', 1, 1 + ((rnd() * 3) | 0));
          if (rnd() < 0.2) dot(x, 5 + ((rnd() * 2) | 0), '#5e6a24');
        }
        // falls through to add pebbles in the dirt
      case B.DIRT:
        for (let k = 0; k < 5; k++) {
          const x = (rnd() * 30) | 0, y = 10 + ((rnd() * 20) | 0);
          dot(x, y, '#9a7550', 2, 1); dot(x, y + 1, '#4a301c', 2, 1);
        }
        break;
      case B.STONE: case B.COAL_ORE: case B.IRON_ORE: case B.BEDROCK:
        for (let k = 0; k < 3; k++) {
          let x = (rnd() * 28) | 0, y = (rnd() * 28) | 0;
          for (let i = 0; i < 6; i++) { dot(x, y, 'rgba(20,20,24,0.35)'); x += rnd() < 0.5 ? 1 : 0; y += 1; }
        }
        if (id !== B.STONE && id !== B.BEDROCK) {
          for (let k = 0; k < 6; k++) dot((rnd() * 32) | 0, (rnd() * 32) | 0, 'rgba(255,255,240,0.45)');
        }
        break;
      case B.LOG: case B.OAK_LOG:
        for (let x = 0; x < 32; x += 2 + ((rnd() * 3) | 0)) dot(x, 0, 'rgba(0,0,0,0.12)', 1, 32);
        break;
      case B.PLANK:
        [[1, 1], [30, 1], [1, 9], [30, 9], [1, 17], [30, 17], [1, 25], [30, 25]].forEach(([x, y]) => dot(x, y + 2, '#4a3420', 1, 1));
        break;
      case B.SAND:
        for (let k = 0; k < 40; k++) dot((rnd() * 32) | 0, (rnd() * 32) | 0, rnd() < 0.5 ? '#f2e4b8' : '#b9a26a');
        break;
      case B.GLASS:
        dot(4, 4, 'rgba(255,255,255,0.8)', 2, 1); dot(4, 5, 'rgba(255,255,255,0.8)', 1, 1);
        break;
    }
    if (QUARTERED.has(id) && id !== B.LEAVES && id !== B.OAK_LEAVES) {
      // Faint seams along each quarter's top and left edges, so every block reads as 4 smaller squares
      for (const o of [0, 16]) {
        dot(o, 0, 'rgba(0,0,0,0.12)', 1, 32); dot(0, o, 'rgba(0,0,0,0.12)', 32, 1);
        dot(o + 1, 0, 'rgba(255,255,255,0.05)', 1, 32); dot(0, o + 1, 'rgba(255,255,255,0.05)', 32, 1);
      }
    }
    if (BUILT.has(id)) {
      dot(0, 0, 'rgba(255,255,255,0.14)', 32, 1); dot(0, 0, 'rgba(255,255,255,0.1)', 1, 32);
      dot(0, 31, 'rgba(0,0,0,0.22)', 32, 1); dot(31, 0, 'rgba(0,0,0,0.18)', 1, 32);
    }
    g.globalCompositeOperation = 'source-over';
  }
  // Darkened back walls shown behind dug-out areas underground.
  let WALL_DIRT, WALL_STONE;
  function buildWalls() {
    const dark = (src) => {
      const c = makeCanvas(32), g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.fillStyle = 'rgba(10,12,16,0.62)'; g.fillRect(0, 0, 32, 32);
      return c;
    };
    WALL_DIRT = dark(TEX[B.DIRT]);
    WALL_STONE = dark(TEX[B.STONE]);
  }

  function drawPick(p, head, headDark) {
    p.line(3, 13, 10, 6, '#7a5234', 2);
    p.line(3, 14, 10, 7, '#5e3d25');
    p.px(4, 3, head, 8, 2); p.px(11, 4, head, 2, 2); p.px(3, 4, head, 2, 2);
    p.px(12, 6, head, 2, 3); p.px(2, 6, head, 2, 3);
    p.px(5, 4, headDark, 6, 1);
  }
  function drawAxe(p, head, headDark) {
    p.line(4, 14, 11, 3, '#7a5234', 2);
    p.line(4, 15, 11, 4, '#5e3d25');
    p.px(10, 2, head, 5, 6); p.px(14, 3, head, 1, 5); p.px(9, 3, head, 1, 3);
    p.px(14, 2, headDark, 1, 7);
  }
  // Item icons are drawn twice from the same pixel art: 32x32 for menus and the hotbar,
  // and 16x16 for the item in the player's hand. Both get the sprite treatment:
  // fine grain, light on top edges, shade on bottom edges and a dark outline.
  const ICON = {};       // item id -> 32x32 canvas
  const ICON_HAND = {};  // item id -> 16x16 canvas
  const ICON_URL = {};
  function polishIcon(c, grain) {
    const g = c.getContext('2d'), n = c.width;
    const img = g.getImageData(0, 0, n, n), d = img.data, src = new Uint8ClampedArray(d);
    const a = (x, y) => (x < 0 || y < 0 || x >= n || y >= n) ? 0 : src[(y * n + x) * 4 + 3];
    const rnd = mulberry32(n * 7 + grain);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const k = (y * n + x) * 4;
      if (src[k + 3] > 0) {
        let f = 1;
        if (!a(x, y - 1) || !a(x - 1, y)) f = 1.2;        // lit edge
        else if (!a(x, y + 1) || !a(x + 1, y)) f = 0.78;  // shaded edge
        if (grain && f === 1) f = 0.94 + rnd() * 0.12;    // subtle surface grain
        d[k] = Math.min(255, src[k] * f); d[k + 1] = Math.min(255, src[k + 1] * f); d[k + 2] = Math.min(255, src[k + 2] * f);
      } else if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
        d[k] = 14; d[k + 1] = 11; d[k + 2] = 9; d[k + 3] = 230; // outline
      }
    }
    g.putImageData(img, 0, 0);
  }
  function buildIcons() {
    for (const id in ITEM) {
      const it = ITEM[id];
      if (it.block || it.iconBlock) {
        ICON[id] = TEX[it.block || it.iconBlock];
        const small = makeCanvas(16);
        small.getContext('2d').drawImage(ICON[id], 0, 0, 16, 16);
        ICON_HAND[id] = small;
      } else {
        ICON[id] = paintItem(id, it, makeCanvas(32));
        ICON_HAND[id] = paintItem(id, it, makeCanvas(16));
        polishIcon(ICON[id], id.length);
        polishIcon(ICON_HAND[id], 0);
      }
      ICON_URL[id] = ICON[id].toDataURL();
    }
  }
  function paintItem(id, it, c) {
    {
      {
        const p = painter(c, id.length * 31);
        switch (id) {
          case 'stick': p.line(4, 13, 12, 3, '#8d6240', 2); p.line(4, 14, 12, 4, '#5e3d25'); break;
          case 'coal':
            p.px(4, 5, '#2a2a2e', 8, 7); p.px(5, 4, '#2a2a2e', 5, 9); p.px(3, 7, '#2a2a2e', 10, 3);
            p.px(5, 5, '#4a4a50', 2, 2); p.px(9, 8, '#4a4a50', 2, 1);
            break;
          case 'iron_ingot':
            p.px(3, 7, '#9a9da4', 11, 5); p.px(4, 6, '#c9ccd2', 9, 4); p.px(5, 6, '#e6e8ec', 7, 1);
            break;
          case 'wood_pick': drawPick(p, '#b0844c', '#8a6436'); break;
          case 'stone_pick': drawPick(p, '#8b8d93', '#66686e'); break;
          case 'iron_pick': drawPick(p, '#e1e3e8', '#a9acb3'); break;
          case 'wood_axe': drawAxe(p, '#b0844c', '#8a6436'); break;
          case 'stone_axe': drawAxe(p, '#8b8d93', '#66686e'); break;
          case 'iron_axe': drawAxe(p, '#e1e3e8', '#a9acb3'); break;
          case 'string':
            p.line(3, 12, 12, 3, '#e8e2c8'); p.line(4, 12, 13, 3, '#c9c2a4');
            p.px(5, 5, '#e8e2c8', 5, 5); p.px(6, 6, '#c9c2a4', 3, 3); p.px(7, 7, '#e8e2c8');
            break;
          case 'rope':
            for (let i = 0; i < 6; i++) { p.px(3 + i * 2, 11 - i, '#b08850', 2, 2); p.px(4 + i * 2, 12 - i, '#8a6436'); }
            p.px(2, 4, '#b08850', 10, 2); p.px(2, 6, '#8a6436', 10, 1); p.px(11, 4, '#b08850', 2, 6);
            break;
          case 'raw_meat':
            p.px(3, 5, '#d8606e', 10, 7); p.px(4, 4, '#d8606e', 7, 9); p.px(5, 6, '#f2a0a8', 5, 2); p.px(11, 9, '#f4e9dc', 3, 3);
            break;
          case 'cooked_meat':
            p.px(3, 5, '#8a4a24', 10, 7); p.px(4, 4, '#8a4a24', 7, 9); p.px(5, 6, '#b06a36', 5, 2); p.px(11, 9, '#f4e9dc', 3, 3);
            break;
          case 'bandage':
            p.px(3, 5, '#f2eee4', 10, 7); p.px(3, 5, '#d6d0c2', 2, 7); p.px(7, 7, '#c8324a', 4, 1); p.px(8, 6, '#c8324a', 2, 3);
            break;
          case 'wood_dagger': case 'stone_dagger': case 'iron_dagger': {
            const col = { wood_dagger: ['#c49a5e', '#8a6436'], stone_dagger: ['#9ea0a6', '#66686e'], iron_dagger: ['#eef0f3', '#a9acb3'] }[id];
            p.line(7, 8, 13, 2, col[0], 2); p.line(8, 9, 13, 4, col[1]);
            p.px(4, 8, '#3b2a1e', 5, 2); p.px(5, 7, '#3b2a1e', 2, 4);
            p.line(2, 13, 5, 10, '#7a5234', 2);
            break;
          }
          case 'wood_bow': case 'oak_bow': case 'iron_bow': {
            const col = { wood_bow: '#b0844c', oak_bow: '#6a4c30', iron_bow: '#9a9ca0' }[id];
            p.line(3, 2, 8, 3, col, 2); p.line(8, 3, 12, 7, col, 2); p.line(12, 7, 13, 13, col, 2);
            p.line(3, 3, 13, 13, '#e8e2c8');
            if (id === 'iron_bow') { p.px(8, 3, '#e1e3e8', 2, 2); p.px(12, 8, '#e1e3e8', 2, 2); }
            break;
          }
          case 'wood_arrow': case 'stone_arrow': case 'iron_arrow':
            p.line(3, 13, 11, 5, '#8d6240');
            p.px(11, 3, it.tip, 3, 3); p.px(13, 2, it.tip);
            p.px(2, 11, '#e8e2c8', 2, 2); p.px(4, 13, '#e8e2c8', 2, 2);
            break;
          case 'claymore':
            p.line(6, 10, 14, 2, '#eef0f3', 2); p.line(7, 11, 14, 4, '#a9acb3');   // long blade
            p.px(3, 8, '#c9a045', 7, 2); p.px(4, 7, '#c9a045', 2, 1); p.px(8, 10, '#c9a045', 2, 1); // basket hilt
            p.line(1, 14, 4, 11, '#5e3d25', 2); p.px(0, 15, '#c9a045', 2, 1);
            break;
          case 'bru_shield':
            p.px(3, 2, '#e0772a', 10, 12); p.px(2, 4, '#e0772a', 12, 8); p.px(4, 14, '#e0772a', 8, 1);
            p.px(2, 7, '#1f5fae', 12, 3); p.px(4, 8, '#f4efe6', 8, 1);
            p.px(3, 2, '#f39a4e', 10, 1); p.px(7, 4, '#8b8d93', 2, 2); p.px(7, 11, '#8b8d93', 2, 2);
            break;
          case 'bagpipes':
            p.px(3, 7, '#3f5f3a', 8, 6); p.px(4, 6, '#3f5f3a', 6, 8); p.px(5, 8, '#b3263a', 4, 1); p.px(5, 10, '#b3263a', 4, 1); // tartan bag
            p.px(6, 7, '#1f5fae', 1, 6); p.px(8, 7, '#1f5fae', 1, 6);
            p.line(9, 6, 13, 1, '#3b2a1e', 1); p.line(10, 7, 15, 3, '#3b2a1e', 1); p.line(7, 5, 9, 0, '#3b2a1e', 1); // drones
            p.px(2, 12, '#3b2a1e', 1, 4);                                               // chanter
            break;
          case 'empty_can':
            p.px(5, 4, '#8b8d93', 6, 10); p.px(5, 4, '#b4babf', 2, 10); p.px(5, 7, '#6e5a4a', 6, 3); p.px(8, 9, '#4a4c52', 2, 2);
            break;
          case 'haggis_supper':
            p.px(2, 9, '#f4efe6', 12, 5); p.px(3, 8, '#e8e2c8', 10, 1);                // paper
            p.px(4, 5, '#6b3a24', 8, 5); p.px(5, 4, '#6b3a24', 6, 1); p.px(5, 6, '#8a4a24', 3, 2); // haggis
            p.px(10, 7, '#e8c547', 3, 3); p.px(3, 7, '#e8c547', 2, 3);                  // chips
            break;
          case 'irn_bru':
            p.px(5, 2, '#b4babf', 6, 1);                             // lid
            p.px(4, 3, '#e0772a', 8, 11); p.px(4, 3, '#f39a4e', 2, 11); p.px(10, 3, '#b85a1c', 2, 11);
            p.px(4, 6, '#1f5fae', 8, 4); p.px(5, 7, '#f4efe6', 6, 1); p.px(6, 8, '#f4efe6', 4, 1);
            p.px(5, 14, '#8b8d93', 6, 1);
            break;
          case 'fibre':
            p.line(3, 14, 9, 2, '#9cc36a'); p.line(6, 14, 10, 2, '#b6d884'); p.line(9, 14, 12, 3, '#86b057');
            p.line(12, 14, 13, 4, '#9cc36a'); p.px(4, 8, '#c8a86a', 9, 2);
            break;
          case 'berries':
            p.px(7, 2, '#57a040', 3, 2); p.px(8, 4, '#2f6a23', 1, 2);
            [[4, 6], [9, 6], [6, 10], [11, 10], [3, 11]].forEach(([x, y]) => {
              p.px(x, y, '#9e1f33', 4, 4); p.px(x + 1, y, '#c8324a', 2, 3); p.px(x + 1, y + 1, '#f08a9a');
            });
            break;
        }
      }
      return c;
    }
  }

  // ---------- World ----------
  let seed = 0;
  let tiles = new Uint8Array(W * H);
  const surface = new Int16Array(W); // original ground height, for back walls
  const light = new Uint8Array(W * H);
  const idx = (x, y) => y * W + x;
  const inWorld = (x, y) => x >= 0 && x < W && y >= 0 && y < H;
  const get = (x, y) => inWorld(x, y) ? tiles[idx(x, y)] : B.BEDROCK;

  const crater = new Uint8Array(W); // columns scorched by old blasts
  // What generation produced, for the new-world summary.
  let worldInfo = { craters: 0, ruins: 0, oaks: 0 };
  function computeSurface() {
    // Three layers of noise, with a slowly varying roughness so some areas are flat and others jagged.
    for (let x = 0; x < W; x++) {
      const rough = 0.5 + noise2(x / 30, 9.1, seed + 50) * 1.3;
      const h = 34
        + (noise2(x / 48, 0.5, seed) - 0.5) * 28
        + (noise2(x / 14, 0.5, seed + 7) - 0.5) * 10 * rough
        + (noise2(x / 5, 0.5, seed + 13) - 0.5) * 3 * rough;
      surface[x] = Math.round(h);
    }
    // Blast craters
    crater.fill(0);
    worldInfo = { craters: 0, ruins: 0, oaks: 0 };
    const rnd = mulberry32(seed + 99);
    const n = 4 + ((rnd() * 4) | 0);
    for (let k = 0; k < n; k++) {
      const cx = 8 + ((rnd() * (W - 16)) | 0);
      if (Math.abs(cx - W / 2) < 12) continue; // not on the spawn point
      const r = 3 + ((rnd() * 5) | 0), depth = 2 + ((rnd() * 3) | 0);
      worldInfo.craters++;
      for (let x = cx - r; x <= cx + r; x++) {
        if (x < 0 || x >= W) continue;
        const f = 1 - ((x - cx) / r) ** 2;
        surface[x] += Math.round(depth * f);
        if (f > 0.1) crater[x] = 1;
      }
    }
    for (let x = 0; x < W; x++) surface[x] = Math.max(14, Math.min(58, surface[x]));
  }

  function generate() {
    tiles = new Uint8Array(W * H);
    computeSurface();
    const rnd = mulberry32(seed ^ 0x9e3779b9);
    const set = (x, y, b) => { if (inWorld(x, y)) tiles[idx(x, y)] = b; };
    for (let x = 0; x < W; x++) {
      const h = surface[x];
      const dirtDepth = 3 + Math.floor(noise2(x / 6, 3.3, seed + 5) * 3);
      const beach = h >= 45 && !crater[x];
      for (let y = 0; y < H; y++) {
        let b = B.AIR;
        if (y >= H - 1 || (y >= H - 3 && rnd() < 0.5)) b = B.BEDROCK;
        else if (y < h) b = B.AIR;
        else if (y === h) b = crater[x] ? B.ASH : beach ? B.SAND : B.GRASS;
        else if (y < h + dirtDepth) b = crater[x] && y === h + 1 ? B.ASH : beach && y < h + 3 ? B.SAND : B.DIRT;
        else {
          b = B.STONE;
          const depth = y - h;
          if (noise2(x / 4, y / 4, seed + 21) > 0.8 && depth > 4) b = B.COAL_ORE;
          if (noise2(x / 3, y / 3, seed + 33) > 0.84 && depth > 16) b = B.IRON_ORE;
        }
        // Caves
        if (b !== B.BEDROCK && y > h + 5) {
          const n = noise2(x / 14, y / 9, seed + 3);
          const worm = Math.abs(noise2(x / 9, y / 6, seed + 11) - 0.5);
          if (n > 0.7 || (worm < 0.035 && y > h + 8)) b = B.AIR;
        }
        tiles[idx(x, y)] = b;
      }
    }

    const used = new Uint8Array(W); // columns taken by ruins or trees
    const nearSpawn = x => Math.abs(x - W / 2) < 6;

    // Ruined buildings: broken walls, a floor, scrap, and usually a supply chest inside.
    for (let x = 6; x < W - 14; x++) {
      if (rnd() > 0.035 || nearSpawn(x) || nearSpawn(x + 10) || crater[x]) continue;
      const w = 5 + ((rnd() * 5) | 0), ht = 3 + ((rnd() * 3) | 0);
      worldInfo.ruins++;
      const base = surface[x + (w >> 1)];
      const wall = rnd() < 0.5 ? B.BRICK : B.COBBLE;
      for (let c = x; c < x + w; c++) {
        for (let y = base + 1; y <= surface[c]; y++) set(c, y, B.COBBLE);      // foundation
        for (let y = base - ht - 2; y < base; y++) set(c, y, B.AIR);            // clear inside
        set(c, base, rnd() < 0.85 ? wall : B.SCRAP);                            // floor
        used[c] = 1;
      }
      for (const c of [x, x + w - 1]) {
        for (let y = base - 1; y >= base - ht; y--) {
          const missing = (base - y) / ht * 0.5; // more broken towards the top
          if (rnd() > missing) set(c, y, rnd() < 0.12 ? B.SCRAP : wall);
        }
      }
      for (let c = x; c < x + w; c++) if (rnd() < 0.4) set(c, base - ht - 1, wall); // broken roof
      if (rnd() < 0.8) set(x + 1 + ((rnd() * (w - 2)) | 0), base - 1, B.CHEST);
      if (rnd() < 0.6) set(x + 1 + ((rnd() * (w - 2)) | 0), base - 1, B.SCRAP);
      x += w + 6;
    }

    // Trees: living, oak, or dead
    let lastTree = -10;
    for (let x = 3; x < W - 3; x++) {
      const h = surface[x];
      if (tiles[idx(x, h)] !== B.GRASS || used[x] || x - lastTree < 4 || rnd() > 0.2 || nearSpawn(x)) continue;
      lastTree = x; used[x] = 1;
      const kind = rnd();
      if (kind < 0.3) { // dead tree: bare trunk with a stub branch
        const trunk = 3 + ((rnd() * 3) | 0);
        for (let i = 1; i <= trunk; i++) set(x, h - i, B.LOG);
        set(x + (rnd() < 0.5 ? -1 : 1), h - trunk + 1, B.LOG);
        continue;
      }
      const oak = kind > 0.72;
      if (oak) worldInfo.oaks++;
      const trunk = oak ? 6 + ((rnd() * 3) | 0) : 4 + ((rnd() * 3) | 0);
      for (let i = 1; i <= trunk; i++) set(x, h - i, oak ? B.OAK_LOG : B.LOG);
      const top = h - trunk, r = oak ? 3 : 2;
      for (let dy = -r; dy <= 1; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > r + 1 || (dy === 1 && Math.abs(dx) === r)) continue;
        const tx = x + dx, ty = top + dy;
        if (inWorld(tx, ty) && tiles[idx(tx, ty)] === B.AIR) tiles[idx(tx, ty)] = oak ? B.OAK_LEAVES : B.LEAVES;
      }
    }

    // Surface clutter: bushes, lone supply chests half-buried in the dust, and scrap heaps
    for (let x = 1; x < W - 1; x++) {
      const h = surface[x];
      if (used[x] || tiles[idx(x, h - 1)] !== B.AIR) continue;
      const top = tiles[idx(x, h)];
      const r = rnd();
      if (top === B.GRASS && r < 0.3) set(x, h - 1, B.BUSH);
      else if (r > 0.97 && !nearSpawn(x)) set(x, h - 1, B.CHEST);
      else if (r > 0.93) set(x, h - 1, B.SCRAP);
    }

    // Old Irn Bru machines, sealed in small brick rooms deep underground: a reward for digging down.
    const machines = [];
    for (let tries = 0; tries < 500 && machines.length < 6; tries++) {
      const x = 8 + Math.floor(rnd() * (W - 16));
      const top = surface[x] + 26;
      if (top >= H - 8) continue;
      const y = top + Math.floor(rnd() * (H - 8 - top));
      if (machines.some(mx => Math.abs(mx - x) < 24)) continue;
      for (let dx = -4; dx <= 4; dx++) for (let dy = -4; dy <= 0; dy++) {
        const wall = Math.abs(dx) === 4 || dy === -4 || dy === 0;
        set(x + dx, y + dy, wall ? B.BRICK : B.AIR);
      }
      set(x, y - 1, B.VENDING);
      machines.push(x);
    }
    worldInfo.machines = machines.length;
    lair = makeLair(rnd);
    scanChests();
  }

  // Remember where unopened chests are, for the on-screen chest finder.
  let chests = [];
  function scanChests() {
    chests = [];
    for (let i = 0; i < tiles.length; i++) if (tiles[i] === B.CHEST) chests.push([i % W, (i / W) | 0]);
  }

  // Sunlight falls straight down; then all light spreads outward, fading per block.
  let lightQueue = new Int32Array(W * H * 2);
  function computeLight() {
    light.fill(0);
    let head = 0, tail = 0;
    const push = i => {
      if (tail >= lightQueue.length) {
        const q = new Int32Array(lightQueue.length * 2); q.set(lightQueue); lightQueue = q;
      }
      lightQueue[tail++] = i;
    };
    for (let x = 0; x < W; x++) {
      let L = 15;
      for (let y = 0; y < H; y++) {
        const i = idx(x, y);
        if (!BLOCK[tiles[i]].sky) break;
        if (tiles[i] === B.LEAVES) L = Math.max(10, L - 1); // canopies cast light shade
        light[i] = L; push(i);
      }
    }
    for (let i = 0; i < W * H; i++) {
      const L = BLOCK[tiles[i]].light;
      if (L > light[i]) { light[i] = L; push(i); }
    }
    while (head < tail) {
      const i = lightQueue[head++];
      const L = light[i];
      if (L <= 1) continue;
      const x = i % W, y = (i / W) | 0;
      for (let k = 0; k < 4; k++) {
        const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0), ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
        if (!inWorld(nx, ny)) continue;
        const j = idx(nx, ny);
        const nl = L - BLOCK[tiles[j]].cost;
        if (nl > light[j]) { light[j] = nl; push(j); }
      }
    }
  }

  // ---------- Player ----------
  const player = { x: 0, y: 0, w: 0.7, h: 1.7, vx: 0, vy: 0, onGround: false, face: 1, walk: 0, hp: 100, st: 100, food: 100, kb: 0, swing: 0 };
  function spawn() {
    const x = Math.floor(W / 2);
    let y = 0;
    while (y < H && !BLOCK[get(x, y)].solid) y++;
    player.x = x + 0.15; player.y = y - player.h - 0.01;
    player.vx = player.vy = 0;
  }
  const solidAt = (tx, ty) => {
    if (tx < 0 || tx >= W || ty >= H) return true;
    if (ty < 0) return false;
    return BLOCK[tiles[idx(tx, ty)]].solid;
  };
  function boxHits(x, y, w = player.w, h = player.h) {
    const x0 = Math.floor(x), x1 = Math.floor(x + w - 1e-6);
    const y0 = Math.floor(y), y1 = Math.floor(y + h - 1e-6);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return true;
    return false;
  }
  function onClimbable() {
    const x0 = Math.floor(player.x), x1 = Math.floor(player.x + player.w - 1e-6);
    const y0 = Math.floor(player.y), y1 = Math.floor(player.y + player.h - 1e-6);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (BLOCK[get(tx, ty)].climb) return true;
    return false;
  }
  function moveX(dx) {
    if (!dx) return;
    const nx = player.x + dx;
    if (!boxHits(nx, player.y)) { player.x = nx; return; }
    // Step up one block automatically, like walking up stairs.
    if (player.onGround && !boxHits(nx, player.y - 1)) {
      player.x = nx; player.y -= 1; return;
    }
    player.x = dx > 0 ? Math.floor(nx + player.w) - player.w - 1e-4 : Math.floor(nx) + 1 + 1e-4;
    player.vx = 0;
  }
  function moveY(dy) {
    if (!dy) return;
    const ny = player.y + dy;
    if (!boxHits(player.x, ny)) { player.y = ny; return; }
    if (dy > 0) { player.y = Math.floor(ny + player.h) - player.h - 1e-4; player.onGround = true; }
    else player.y = Math.floor(ny) + 1 + 1e-4;
    player.vy = 0;
  }

  // ---------- Inventory ----------
  let inv = new Array(INV_SIZE).fill(null);
  let selected = 0;
  const stackOf = id => ITEM[id].stack || STACK;
  function count(id) { return inv.reduce((s, it) => s + (it && it.id === id ? it.n : 0), 0); }
  function addItem(id, n) {
    for (const it of inv) if (n > 0 && it && it.id === id && it.n < stackOf(id)) {
      const k = Math.min(n, stackOf(id) - it.n); it.n += k; n -= k;
    }
    for (let i = 0; i < INV_SIZE && n > 0; i++) if (!inv[i]) {
      const k = Math.min(n, stackOf(id)); inv[i] = { id, n: k }; n -= k;
    }
    if (n > 0) toast('Your inventory is full');
    markProgress();
    uiDirty = true;
    return n;
  }
  function removeItem(id, n) {
    // Take from the back first so hotbar stacks last longest.
    for (let i = INV_SIZE - 1; i >= 0 && n > 0; i--) {
      const it = inv[i];
      if (it && it.id === id) { const k = Math.min(n, it.n); it.n -= k; n -= k; if (!it.n) inv[i] = null; }
    }
    uiDirty = true;
  }
  const held = () => inv[selected];
  const heldTool = () => { const it = held(); return it && ITEM[it.id].tool ? ITEM[it.id] : null; };
  // Seconds to mine a block with whatever is in hand. A tool is fastest on its own material.
  function mineTime(b) {
    const bd = BLOCK[b], tool = heldTool();
    if (!tool) return bd.hard / (bd.fastTier ? 0.35 : 1);
    let speed = tool.tool === bd.pref ? tool.speed : 1 + (tool.speed - 1) * 0.3;
    if (tool.tier < bd.fastTier) speed *= 0.35;
    return bd.hard / speed;
  }

  function nearStations() {
    const cx = Math.floor(player.x + player.w / 2), cy = Math.floor(player.y + player.h / 2);
    const found = {};
    for (let y = cy - STATION_RANGE; y <= cy + STATION_RANGE; y++)
      for (let x = cx - STATION_RANGE; x <= cx + STATION_RANGE; x++) {
        const b = get(x, y);
        for (const s in STATION_BLOCK) if (STATION_BLOCK[s] === b) found[s] = true;
      }
    return found;
  }
  function canCraft(r, stations) {
    const at = stationsFor(r);
    if (at.length && !at.some(st => stations[st])) return false;
    return Object.entries(r.needs).every(([id, n]) => count(id) >= n);
  }
  function craft(r) {
    if (!canCraft(r, nearStations())) return;
    for (const [id, n] of Object.entries(r.needs)) removeItem(id, n);
    addItem(r.out, r.n);
    sfx.craft();
    if (ITEM[r.out].tool || ITEM[r.out].melee || ITEM[r.out].bow) say('craftTool', { chance: 0.5, cooldown: 30 });
    toast(`Crafted ${r.n > 1 ? r.n + ' × ' : ''}${ITEM[r.out].name}`);
  }

  // ---------- Goals ----------
  let progress = {};
  const GOALS = [
    ['log', 'Hold left click on a tree trunk to chop some logs.'],
    ['chest', 'Search the surface for a supply chest. Follow the gold arrow, then right click the chest.'],
    ['bench', 'Press E and craft Planks, then a Workbench.'],
    ['placed_bench', 'Right click the ground to place your Workbench.'],
    ['wood_pick', 'Stand near the Workbench and craft a Wooden Pickaxe.'],
    ['wood_axe', 'Craft a Wooden Hatchet too. It chops wood much faster.'],
    ['string', 'Break bushes and leaves for fibre, then turn 2 fibre into String.'],
    ['cobble', 'Select the pickaxe and dig down into stone.'],
    ['stone_axe', 'Craft a Stone Hatchet. It cuts through tough oak trees.'],
    ['stone_pick', 'Craft a Stone Pickaxe at the Workbench.'],
    ['kill', 'Fight off a mutant, like a Big Minger. Hit it with a dagger or shoot it with a bow.'],
    ['cooked_meat', 'Build a Wee Fire from logs and sticks, and cook raw meat on it into a Rat Piece.'],
    ['coal', 'Find coal ore (black specks) and make Torches.'],
    ['furnace', 'Craft a Furnace from 8 Cobblestone.'],
    ['iron_ingot', 'Smelt an Iron Ingot from iron ore or 3 scrap metal at a Furnace.'],
    ['iron_pick', 'Make Rope from String, then craft an Iron Pickaxe.'],
    ['irn_bru', 'Dig deep underground and find an Irn Bru machine. They glow in the dark. Right click one for cans.'],
  ];
  function markProgress() {
    for (const [id] of GOALS) if (ITEM[id] && count(id) > 0) progress[id] = true;
    for (const g of ENDGAME) if (ITEM[g.id] && count(g.id) > 0) progress[g.id] = true;
  }
  function currentGoal() {
    for (const [id, text] of GOALS) if (!progress[id]) return text;
    const next = ENDGAME.find(g => !endgameDone(g));
    if (next) return next.text;
    return "The Mutant Haggis is deid. Ye're the king o' the wasteland. Build whatever ye like.";
  }

  // ---------- Sound ----------
  // Every effect is synthesized with Web Audio, so there are no sound files to load.
  const SOUND_KEY = 'blockstead-sound';
  const sfx = (() => {
    let ac = null, master = null, noiseBuf = null;
    let on = true;
    try { on = localStorage.getItem(SOUND_KEY) !== 'off'; } catch { /* default on */ }

    // Browsers only allow audio after the player interacts with the page.
    function unlock() {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = 0.5;
        master.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      if (!amb) startAmbience();
    }
    const ready = () => on && ac && ac.state === 'running';

    // Looping weather sound: steady rain, or a low wind for the ash cloud. Fades in and out.
    let amb = null, ambKind = 'clear';
    function startAmbience() {
      if (amb) {
        const t = ac.currentTime;
        amb.g.gain.cancelScheduledValues(t);
        amb.g.gain.setValueAtTime(amb.g.gain.value, t);
        amb.g.gain.linearRampToValueAtTime(0, t + 2);
        amb.src.stop(t + 2.1);
        amb = null;
      }
      if (!on || !ac || (ambKind !== 'rain' && ambKind !== 'ash')) return;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; src.loop = true;
      const rain = ambKind === 'rain';
      f.type = rain ? 'bandpass' : 'lowpass';
      f.frequency.value = rain ? 1400 : 380;
      f.Q.value = rain ? 0.4 : 0.7;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(rain ? 0.09 : 0.14, ac.currentTime + 3);
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
      amb = { src, g };
    }

    function env(gain, dur, delay) {
      const g = ac.createGain(), t = ac.currentTime + delay;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(master);
      return { g, t };
    }
    function noise({ dur = 0.08, type = 'lowpass', freq = 1000, q = 1, gain = 0.3, delay = 0 }) {
      const { g, t } = env(gain, dur, delay);
      const src = ac.createBufferSource();
      src.buffer = noiseBuf;
      const f = ac.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q;
      src.connect(f); f.connect(g);
      src.start(t, Math.random() * 0.5, dur + 0.05);
    }
    function tone({ freq = 440, to = freq, dur = 0.1, type = 'sine', gain = 0.2, delay = 0 }) {
      const { g, t } = env(gain, dur, delay);
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(to, t + dur);
      o.connect(g);
      o.start(t); o.stop(t + dur + 0.05);
    }
    const vary = () => 0.9 + Math.random() * 0.2;

    const HIT = {
      wood: v => { tone({ freq: 190 * v, to: 120, dur: 0.07, type: 'triangle', gain: 0.35 }); noise({ type: 'bandpass', freq: 900 * v, q: 2, dur: 0.05, gain: 0.25 }); },
      stone: v => { noise({ type: 'bandpass', freq: 2600 * v, q: 4, dur: 0.05, gain: 0.45 }); tone({ freq: 420 * v, to: 300, dur: 0.035, type: 'square', gain: 0.05 }); },
      dirt: v => noise({ type: 'lowpass', freq: 700 * v, dur: 0.08, gain: 0.4 }),
      leaf: v => noise({ type: 'highpass', freq: 3000 * v, dur: 0.06, gain: 0.15 }),
      glass: v => tone({ freq: 1900 * v, to: 1700, dur: 0.05, gain: 0.08 }),
    };
    const BREAK = {
      wood: v => { tone({ freq: 150 * v, to: 70, dur: 0.16, type: 'triangle', gain: 0.4 }); noise({ type: 'bandpass', freq: 600, q: 1, dur: 0.14, gain: 0.3 }); },
      stone: v => { noise({ type: 'bandpass', freq: 1400 * v, q: 1.5, dur: 0.18, gain: 0.5 }); noise({ type: 'lowpass', freq: 400, dur: 0.12, gain: 0.3 }); },
      dirt: v => noise({ type: 'lowpass', freq: 500 * v, dur: 0.16, gain: 0.5 }),
      leaf: v => noise({ type: 'highpass', freq: 2200 * v, dur: 0.15, gain: 0.2 }),
      glass: () => { for (let i = 0; i < 5; i++) tone({ freq: 1800 + Math.random() * 2200, dur: 0.12, gain: 0.07, delay: i * 0.025 }); noise({ type: 'highpass', freq: 5000, dur: 0.1, gain: 0.15 }); },
    };
    const play = fn => { if (ready()) try { fn(vary()); } catch { /* ignore audio glitches */ } };

    return {
      unlock,
      get on() { return on; },
      toggle() {
        on = !on;
        try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off'); } catch { /* not saved */ }
        if (on) unlock();
        if (ac) startAmbience();
        return on;
      },
      ambience(kind) { ambKind = kind; if (ac) startAmbience(); },
      hit: m => play(HIT[m] || HIT.dirt),
      break: m => play(BREAK[m] || BREAK.dirt),
      place: () => play(v => { noise({ type: 'lowpass', freq: 450 * v, dur: 0.07, gain: 0.45 }); tone({ freq: 130 * v, to: 80, dur: 0.08, gain: 0.3 }); }),
      step: m => play(v => noise({ type: m === 'stone' ? 'bandpass' : 'lowpass', freq: (m === 'stone' ? 1800 : m === 'wood' ? 1100 : 800) * v, q: 1.5, dur: 0.04, gain: 0.07 })),
      jump: () => play(v => tone({ freq: 260 * v, to: 420, dur: 0.09, type: 'square', gain: 0.04 })),
      land: () => play(() => noise({ type: 'lowpass', freq: 320, dur: 0.1, gain: 0.35 })),
      craft: () => play(() => { tone({ freq: 660, dur: 0.12, type: 'triangle', gain: 0.18 }); tone({ freq: 990, dur: 0.18, type: 'triangle', gain: 0.18, delay: 0.09 }); }),
      hurt: () => play(v => { tone({ freq: 220 * v, to: 110, dur: 0.18, type: 'sawtooth', gain: 0.12 }); noise({ type: 'lowpass', freq: 500, dur: 0.12, gain: 0.3 }); }),
      eat: () => play(v => { for (let i = 0; i < 3; i++) noise({ type: 'bandpass', freq: 1500 * v, q: 2, dur: 0.05, gain: 0.3, delay: i * 0.09 }); }),
      chest: () => play(() => { [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.14, type: 'triangle', gain: 0.14, delay: i * 0.07 })); }),
      swing: () => play(v => noise({ type: 'highpass', freq: 1800 * v, dur: 0.09, gain: 0.18 })),
      hitEnemy: () => play(v => { noise({ type: 'lowpass', freq: 700 * v, dur: 0.08, gain: 0.5 }); tone({ freq: 160 * v, to: 90, dur: 0.08, type: 'square', gain: 0.06 }); }),
      enemyDie: () => play(v => { tone({ freq: 420 * v, to: 90, dur: 0.3, type: 'sawtooth', gain: 0.1 }); noise({ type: 'lowpass', freq: 600, dur: 0.2, gain: 0.3 }); }),
      bow: () => play(v => { tone({ freq: 190 * v, to: 110, dur: 0.12, type: 'triangle', gain: 0.3 }); noise({ type: 'highpass', freq: 2500, dur: 0.07, gain: 0.12 }); }),
      radio: () => play(() => { noise({ type: 'bandpass', freq: 2400, q: 0.7, dur: 0.18, gain: 0.12 }); tone({ freq: 1200, dur: 0.05, type: 'square', gain: 0.02, delay: 0.2 }); }),
      vend: () => play(() => { tone({ freq: 140, to: 90, dur: 0.12, type: 'square', gain: 0.1 }); noise({ type: 'lowpass', freq: 500, dur: 0.1, gain: 0.4, delay: 0.15 }); tone({ freq: 90, dur: 0.1, type: 'triangle', gain: 0.3, delay: 0.3 }); }),
      fizz: () => play(() => { noise({ type: 'highpass', freq: 3500, dur: 0.5, gain: 0.25 }); tone({ freq: 700, to: 1100, dur: 0.12, gain: 0.08, delay: 0.05 }); }),
      clang: () => play(v => { tone({ freq: 1400 * v, to: 900, dur: 0.12, type: 'square', gain: 0.08 }); noise({ type: 'highpass', freq: 3000, dur: 0.08, gain: 0.3 }); }),
      roar: () => play(() => { tone({ freq: 90, to: 50, dur: 0.9, type: 'sawtooth', gain: 0.25 }); noise({ type: 'lowpass', freq: 400, dur: 0.8, gain: 0.5 }); }),
      spit: () => play(v => { noise({ type: 'bandpass', freq: 700 * v, q: 2, dur: 0.12, gain: 0.35 }); }),
      pipes: () => play(() => {
        tone({ freq: 116.5, dur: 2.2, type: 'sawtooth', gain: 0.07 }); tone({ freq: 233, dur: 2.2, type: 'sawtooth', gain: 0.05 }); // drones
        [466, 523, 587, 698, 587, 523, 466, 440].forEach((f, i) => tone({ freq: f, dur: 0.24, type: 'sawtooth', gain: 0.06, delay: 0.2 + i * 0.22 }));
      }),
      denied: () => play(() => tone({ freq: 160, to: 120, dur: 0.14, type: 'square', gain: 0.05 })),
      click: () => play(() => tone({ freq: 900, dur: 0.03, type: 'square', gain: 0.03 })),
    };
  })();
  const MATERIAL = {
    [B.LOG]: 'wood', [B.PLANK]: 'wood', [B.BENCH]: 'wood', [B.LADDER]: 'wood', [B.TORCH]: 'wood',
    [B.STONE]: 'stone', [B.COBBLE]: 'stone', [B.COAL_ORE]: 'stone', [B.IRON_ORE]: 'stone',
    [B.FURNACE]: 'stone', [B.BRICK]: 'stone', [B.BEDROCK]: 'stone',
    [B.LEAVES]: 'leaf', [B.BUSH]: 'leaf', [B.OAK_LEAVES]: 'leaf', [B.GLASS]: 'glass',
    [B.GLOWCAP]: 'leaf', [B.OAK_LOG]: 'wood', [B.CHEST]: 'wood', [B.SCRAP]: 'stone', [B.CAMPFIRE]: 'wood',
  };
  const materialOf = b => MATERIAL[b] || 'dirt';
  window.addEventListener('pointerdown', () => sfx.unlock(), true);
  window.addEventListener('keydown', () => sfx.unlock(), true);

  // ---------- Input ----------
  const keys = {};
  const mouse = { x: 0, y: 0, left: false, right: false, over: false };
  const touch = { left: false, right: false, jump: false, down: false, build: false };
  let isTouch = false;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let viewW = 0, viewH = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = window.innerWidth; viewH = window.innerHeight;
    canvas.width = Math.round(viewW * dpr); canvas.height = Math.round(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  const invOpen = () => !invEl.hidden;
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'e') { if (invEl.hidden) didAction('inventory'); toggleInv(); e.preventDefault(); return; }
    if (k === 'k') { togglePrompts(); return; }
    if (k === 'f') { interact(); return; }
    if (k === 'q') { quickHeal(); return; }
    if (k === 'escape') { if (invOpen()) toggleInv(false); helpEl.hidden = true; return; }
    if (k === 'h') { helpEl.hidden = !helpEl.hidden; return; }
    if (k === 'm') { toggleSound(); return; }
    if (k >= '1' && k <= '9') { selected = +k - 1; uiDirty = true; didAction('hotbar'); return; }
    if (!e.repeat && (k === 'a' || k === 'd' || k === 'arrowleft' || k === 'arrowright')) didAction('walk');
    keys[k] = true;
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.left = mouse.right = false; });

  canvas.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.over = true; mouse.touch = e.pointerType === 'touch'; });
  canvas.addEventListener('pointerleave', () => { mouse.over = false; });
  canvas.addEventListener('pointerdown', e => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.over = true; mouse.touch = e.pointerType === 'touch';
    helpEl.hidden = true;
    canvas.setPointerCapture?.(e.pointerId);
    if (e.pointerType === 'touch') {
      setTouchMode(true);
      if (touch.build) { mouse.right = true; placeCooldown = 0; } else mouse.left = true;
    } else if (e.button === 0) mouse.left = true;
    else if (e.button === 2) { mouse.right = true; placeCooldown = 0; }
  });
  window.addEventListener('pointerup', e => {
    if (e.pointerType === 'touch') { if (e.target === canvas) mouse.left = mouse.right = false; return; }
    if (e.button === 0) mouse.left = false;
    if (e.button === 2) mouse.right = false;
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  // Mouse clicks shouldn't leave buttons focused, or Space (jump) would press them again.
  document.addEventListener('mousedown', e => { if (e.target.closest('button')) e.preventDefault(); });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    selected = (selected + (e.deltaY > 0 ? 1 : -1) + 9) % 9;
    didAction('hotbar');
    uiDirty = true;
  }, { passive: false });

  function setTouchMode(on) {
    if (isTouch === on) return;
    isTouch = on;
    document.getElementById('touch').hidden = !on;
  }
  function bindHold(id, prop) {
    const el = document.getElementById(id);
    const set = v => e => { e.preventDefault(); touch[prop] = v; };
    el.addEventListener('pointerdown', set(true));
    el.addEventListener('pointerup', set(false));
    el.addEventListener('pointercancel', set(false));
    el.addEventListener('pointerleave', set(false));
  }
  bindHold('t-left', 'left'); bindHold('t-right', 'right');
  bindHold('t-jump', 'jump'); bindHold('t-down', 'down');
  const modeBtn = document.getElementById('t-mode');
  modeBtn.addEventListener('click', () => {
    touch.build = !touch.build;
    modeBtn.textContent = touch.build ? 'Build' : 'Mine';
    modeBtn.classList.toggle('build', touch.build);
  });
  if (window.matchMedia?.('(pointer: coarse)').matches) setTouchMode(true);

  // ---------- Game loop ----------
  const camera = { x: 0, y: 0 };
  const mining = { x: -1, y: -1, t: 0, warned: false };
  let placeCooldown = 0, stepTimer = 0, hurtFlash = 0;

  function targetTile() {
    const tx = Math.floor((mouse.x + camera.x) / TILE), ty = Math.floor((mouse.y + camera.y) / TILE);
    const cx = player.x + player.w / 2, cy = player.y + player.h / 2;
    const d = Math.hypot(tx + 0.5 - cx, ty + 0.5 - cy);
    const inReach = d <= REACH && inWorld(tx, ty);
    return { tx, ty, inReach, visible: inReach && canSee(tx, ty) };
  }
  // A block can only be mined if no solid block sits between it and the player.
  // We check from the player's eyes and from their chest, so blocks at foot level still count as visible.
  function canSee(tx, ty) {
    const cx = player.x + player.w / 2;
    return [player.y + 0.35, player.y + 1.0].some(ey => clearLine(cx, ey, tx + 0.5, ty + 0.5, tx, ty));
  }
  function clearLine(x0, y0, x1, y1, tx, ty) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.1);
    for (let i = 1; i < n; i++) {
      const x = Math.floor(x0 + (x1 - x0) * i / n), y = Math.floor(y0 + (y1 - y0) * i / n);
      if (x === tx && y === ty) return true; // reached the target's edge
      if (solidAt(x, y)) return false;
    }
    return true;
  }

  function breakBlock(tx, ty) {
    const b = get(tx, ty);
    tiles[idx(tx, ty)] = B.AIR;
    sfx.break(materialOf(b));
    const drop = BLOCK[b].drop;
    if (drop) addItem(drop, BLOCK[b].dropN);
    if (b === B.LEAVES) {
      if (Math.random() < 0.2) addItem('stick', 1);
      if (Math.random() < 0.5) dropFibre(1);
    }
    if (b === B.OAK_LEAVES) { // oak gives double
      if (Math.random() < 0.4) addItem('stick', 1);
      dropFibre(1);
    }
    if (b === B.BUSH) dropFibre(Math.random() < 0.5 ? 2 : 1);
    if (b === B.CHEST) { lootChest(); scanChests(); }
    // Torches and ladders resting on this block fall off with it.
    const above = get(tx, ty - 1);
    if (above === B.TORCH && !hasSupport(tx, ty - 1)) breakBlock(tx, ty - 1);
    computeLight();
  }
  // Supply chests hold 2–3 random pieces of equipment. Each equipment line goes wood -> stone -> iron,
  // and the chest favours the next tier up from the best you already carry in that line.
  // Anything further up is rarer the bigger the jump, but never impossible.
  const LOOT_LINES = [
    { items: ['wood_pick', 'stone_pick', 'iron_pick'], weight: 1 },
    { items: ['wood_axe', 'stone_axe', 'iron_axe'], weight: 1 },
    { items: ['wood_dagger', 'stone_dagger', 'iron_dagger'], weight: 1 },
    { items: ['wood_bow', 'oak_bow', 'iron_bow'], weight: 0.7 },
    { items: ['wood_arrow', 'stone_arrow', 'iron_arrow'], weight: 1.2, min: [6, 4, 3], max: [12, 10, 8] },
  ];
  const TIER_JUMP_WEIGHT = { 1: 10, 2: 1.2, 3: 0.3 }; // jump of 1 tier, 2 tiers, 3 tiers; same or lower tier: 2.5
  function lootTable() {
    const table = [];
    for (const line of LOOT_LINES) {
      let have = 0;
      line.items.forEach((id, i) => { if (count(id) > 0) have = i + 1; });
      line.items.forEach((id, i) => {
        const jump = i + 1 - have;
        const w = (jump <= 0 ? 2.5 : TIER_JUMP_WEIGHT[jump]) * line.weight;
        table.push({ id, w, min: line.min ? line.min[i] : 1, max: line.max ? line.max[i] : 1 });
      });
    }
    return table;
  }
  function lootChest() {
    const found = [];
    const rolls = 2 + (Math.random() < 0.4 ? 1 : 0);
    for (let i = 0; i < rolls; i++) {
      const table = lootTable(); // rebuilt each roll, so one chest rarely gives the same thing twice
      let r = Math.random() * table.reduce((sum, l) => sum + l.w, 0);
      const { id, min, max } = table.find(l => (r -= l.w) < 0) || table[0];
      const n = min + Math.floor(Math.random() * (max - min + 1));
      addItem(id, n);
      found.push(`${n > 1 ? n + ' × ' : ''}${ITEM[id].name}`);
    }
    progress.chest = true;
    sfx.chest();
    toast(`Supply chest: ${found.join(', ')}`, 4000);
    say('chest', { force: true });
  }
  function openChest(tx, ty) {
    didAction('chest');
    tiles[idx(tx, ty)] = B.AIR;
    lootChest();
    scanChests();
    computeLight();
  }

  // Each piece of fibre has a 50% chance of coming with a berry.
  function dropFibre(n) {
    addItem('fibre', n);
    let berries = 0;
    for (let i = 0; i < n; i++) if (Math.random() < 0.5) berries++;
    if (berries) addItem('berries', berries);
  }

  const MAX_HP = 100;
  function heal(n) {
    player.hp = Math.min(maxHp(), player.hp + n);
    uiDirty = true;
  }

  // ---------- Irn Bru ----------
  // A can gives a Bru Rush: unlimited stamina and +50 extra health for a minute.
  const BRU_HP = 50;
  let bruT = 0;
  const maxHp = () => MAX_HP + (bruT > 0 ? BRU_HP : 0);
  function drinkBru(secs) {
    bruT = secs;
    player.hp = Math.min(maxHp(), player.hp + BRU_HP);
    player.st = MAX_ST;
    uiDirty = true;
    say('bru', { force: true });
  }
  function updateBru(dt) {
    if (bruT <= 0) return;
    bruT -= dt;
    player.st = MAX_ST;
    if (bruT <= 0) {
      player.hp = Math.min(player.hp, MAX_HP);
      uiDirty = true;
      say('bruEnd', { force: true });
      toast('The Bru Rush has worn off.');
    }
  }
  function openVending(tx, ty) {
    tiles[idx(tx, ty)] = B.VENDING_EMPTY;
    addItem('irn_bru', 3);
    didAction('vend');
    sfx.vend();
    say('vending', { force: true });
    toast('The machine clunks out 3 cans of Irn Bru. Select one and right click to drink.', 4000);
    computeLight();
  }
  function hurt(n, cause = 'hurt') {
    player.hp = Math.max(0, player.hp - n);
    hurtFlash = 0.35;
    sfx.hurt();
    uiDirty = true;
    if (player.hp > 0) say(cause, { cooldown: 6 });
    if (player.hp === 0) {
      spawn();
      bruT = 0;
      if (boss) { resetBoss(); toast('The Mutant Haggis went back to sleep. Play the Bagpipes in its lair to try again.', 5000); }
      player.hp = MAX_HP;
      player.st = MAX_ST;
      player.food = Math.max(player.food, 60);
      enemies = []; arrows = [];
      iframes = 2;
      snapCamera();
      toast('You passed out and woke up back at the start. You kept your items.');
      say('respawn', { force: true });
    }
  }
  // ---------- Tam's patter and Wee Davie's radio ----------
  // Tam talks in speech bubbles when things happen. Wee Davie, holed up in another bunker,
  // radios in with weather warnings. Game instructions stay in plain English elsewhere.
  const LINES = {
    start: ['Right. Mon then. How bad can it be?', "Aw… it's bad. It's pure bad.", "Fresh air! …Naw, that's no fresh."],
    hurt: ["Ya wee… that's sore!", 'Ow! Watch it, pal!', 'Aw ma heid!', "That's gonnae leave a mark."],
    fall: ['Ma knees! Ma good knees!', "Ah'm too auld fur this."],
    ashHurt: ['*cough* *cough*', "That ash is pure mingin'.", "Ma lungs are goin'!"],
    hungry: ["Ah'm pure starvin'. Ah'd eat a scabby rat.", "Ma belly thinks ma throat's been cut."],
    starving: ["Ah'm wastin' away here!", 'Need scran. NOW.'],
    eatRat: ['No bad, actually.', 'Tastes like chicken. Radioactive chicken.', 'Ya dancer, a rat piece!'],
    raw: ["Aw that's boggin'. Ah'm gonnae boak.", "Should've cooked that. Definitely should've cooked that."],
    berries: ['Wee berries. Pure wee.', "Hope these urnae the poisonous wans."],
    bandage: ['Big plaster. Sorted.'],
    chest: ['Ya dancer!', 'Get in!', 'Christmas has come early!', "Whit's in the box? WHIT'S IN THE BOX?"],
    tired: ["Gie's a minute… ah'm knackered.", "Ah'm puggled.", 'Need a wee sit doon.'],
    crawler: ["Whit in the name o'… GONNAE NO!", 'Aw naw. A Peely-Wally.', 'Get a torch, get a torch, GET A TORCH!'],
    ghoul: ["Awright big man? …Naw, he's no awright.", "Here, whit's your problem, bawheid?"],
    rat: ["That's a big minger.", "See the size o' that rat!"],
    kill: ['Aye, an\' stay doon!', 'Ya beauty!', "Mess wi' the best…"],
    oak: ['This is taking a lifetime, man.', 'Need a better hatchet fur this.'],
    ash: ["Ah cannae see a thing!", 'Get indoors, ya numpty!'],
    rain: ['Heavy dreich. Typical.', "It's stoatin' doon!", 'Aye, summer in Glesga.'],
    fireOut: ["Aw naw, the fire's oot!", "Ma fire! Rain's put it oot!"],
    heat: ['Taps aff!', "Pure roastin'!", "It's like Magaluf oot here."],
    respawn: ["Whit happened? Ah feel like ah've been hit by a bus.", "Ah'm back. Nae thanks tae you."],
    craftTool: ['Look at that. Pure craftsmanship.', "Ah'm basically an engineer noo."],
    vending: ['A Bru machine! Ya dancer!', "Is that… is that whit ah think it is?", 'Hallelujah!'],
    bru: ['Mad fur it!', 'Pure rocket fuel, this.', 'Ah can see through time!'],
    haggis: ["Whit in the name o'… that's a HAGGIS?!", "Ah'm no eatin' that wan."],
    haggisRage: ["It's ragin' noo!", "Ah think ah've annoyed it."],
    victory: ["Haggis, neeps an' tatties fur a year!", 'Ya dancer! Get it up ye!'],
    pipesNothing: ["Naebody's comin'. Rude."],
    notReady: ["Ah'm no ready fur that yet.", 'Need the full kit first, big man.'],
    base: ['Hame sweet hame.', 'Pure dead cosy, this.'],
    bruEnd: ["Aw, the Bru's worn aff.", 'Need another can. Or ten.'],
  };
  const RADIO = {
    hello: ["Tam, is that you? It's Wee Davie in the other bunker. Keep yer radio on, ah'll tell ye when the weather's turnin'."],
    ashWarn: ["Big man, see that ash comin'? Get under a roof or get doon a hole!", "Ash cloud headin' your way. Ah'm stayin' in, you're on yer own, pal."],
    rainWarn: ["Heavy dreich on the way. Get yer fires under cover or they're goin' oot.", "Rain's comin'. The bushes'll love it. You'll no."],
    heatWarn: ["Heatwave comin'. Taps aff, big man. Keep yer scran handy, ye'll be starvin'.", 'Scorcher on the way. Stay in the shade.'],
    haggis: ["TAM! Whit's that noise?! Is that… bagpipes? Ye've woken it, ya numpty!"],
    victory: ["Tam, ye absolute legend! The haggis is deid! Drinks are on me. Well, the Bru's on me."],
    clear: ["That's it passed. Oot ye go.", "Weather's cleared. Gaun yersel', big man."],
  };
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const speech = { text: '', t: 0 }, sayNext = {};
  let sayGap = 0;
  function say(kind, { force = false, cooldown = 10, chance = 1 } = {}) {
    const now = performance.now() / 1000;
    if (!force && (sayGap > 0 || (sayNext[kind] || 0) > now || Math.random() > chance)) return;
    speech.text = pick(LINES[kind]);
    speech.t = 3.5;
    sayGap = 2.5;
    sayNext[kind] = now + cooldown;
  }
  let radioTimer = 0;
  function radio(kind) {
    const el = document.getElementById('radio');
    document.getElementById('radio-text').textContent = pick(RADIO[kind]);
    el.hidden = false;
    el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    sfx.radio();
    clearTimeout(radioTimer);
    radioTimer = setTimeout(() => { el.hidden = true; }, 8000);
  }

  // Food and medicine: `heal` restores health, `food` fills hunger, `sick` hurts (raw meat).
  function eat(it) {
    const f = ITEM[it.id];
    const helps = f.bru || (f.heal && player.hp < maxHp()) || (f.food && player.food < MAX_FOOD);
    if (!helps) { toast(f.food ? "You're not hungry and your health is full" : 'Your health is already full'); return; }
    removeItem(it.id, 1);
    if (f.bru) { sfx.fizz(); drinkBru(f.bru); addItem('empty_can', 1); toast(`Bru Rush! Unlimited stamina and +${BRU_HP} health for ${f.bru} seconds.`); return; }
    sfx.eat();
    didAction('eat');
    const parts = [];
    if (f.heal) { heal(f.heal); parts.push(`+${f.heal} health`); }
    if (f.food) { player.food = Math.min(MAX_FOOD, player.food + f.food); parts.push(`+${f.food} food`); }
    toast(parts.join(', '));
    if (f.sick) { hurt(f.sick, 'raw'); toast(`Raw meat made you sick. Cook it on a Wee Fire first. (${parts.join(', ')})`); say('raw', { force: true }); }
    else if (it.id === 'cooked_meat') say('eatRat', { force: true });
    else if (it.id === 'bandage') say('bandage', { force: true });
    else say('berries', { chance: 0.3 });
  }

  // ---------- Hunger ----------
  // Hunger drains slowly: a full stomach lasts about 20 minutes. Starving hurts.
  const MAX_FOOD = 100, FOOD_DRAIN = MAX_FOOD / (20 * 60), STARVE_EVERY = 4, STARVE_DMG = 2;
  let starveT = 0, hungerWarned = false;
  function updateHunger(dt) {
    player.food = Math.max(0, player.food - FOOD_DRAIN * dt * (heatOn() ? 2.5 : 1));
    if (player.food < 20 && !hungerWarned) { toast("You're getting hungry. Eat berries or a Rat Piece."); say('hungry', { force: true }); hungerWarned = true; }
    if (player.food >= 30) hungerWarned = false;
    if (player.food <= 0) {
      starveT -= dt;
      if (starveT <= 0) { starveT = STARVE_EVERY; hurt(STARVE_DMG, 'starving'); toast("You're starving. Eat something."); }
    } else starveT = STARVE_EVERY;
  }

  // ---------- Weather ----------
  // Clear spells alternate with a spell of weather. Wee Davie radios a warning before it turns.
  // Ash Cloud: thick fog, and the ash hurts you outside. Crawlers can surface in the gloom.
  // Heavy Dreich: rain regrows bushes and trees but puts out torches and fires left in the open.
  // Taps Aff: heatwave. Out in the sun you get hungry faster and stamina refills slower.
  const WEATHER = {
    clear: { name: 'Clear' },
    ash: { name: 'Ash Cloud', warn: 'ashWarn',
      info: 'Ash Cloud: you can barely see, and the ash hurts you outside. Get under a roof or underground.' },
    rain: { name: 'Heavy Dreich', warn: 'rainWarn',
      info: 'Heavy Dreich: rain regrows bushes and trees, but puts out torches and fires left outside.' },
    heat: { name: 'Taps Aff', warn: 'heatWarn',
      info: 'Taps Aff: heatwave. Out in the sun you get hungry faster and your stamina refills slower.' },
  };
  const FIRST_WEATHER = 240, WARN_AHEAD = 25, FADE = 6;
  const weather = { kind: 'clear', shown: 'clear', next: null, t: FIRST_WEATHER, k: 0, warned: false };
  let outside = true, outsideT = 0, ashT = 4, growT = 3, douseT = 2;
  const weatherOn = kind => weather.kind === kind && weather.k > 0.5;
  const heatOn = () => weatherOn('heat') && outside;
  function resetWeather() {
    Object.assign(weather, { kind: 'clear', shown: 'clear', next: null, t: FIRST_WEATHER, k: 0, warned: false });
    sfx.ambience('clear');
  }
  // Cover means something solid somewhere above: a roof of planks, bricks or glass counts; leaves don't.
  function openToSky(x, y) {
    for (let yy = y - 1; yy >= 0; yy--) if (BLOCK[get(x, yy)].solid) return false;
    return true;
  }
  function pickWeather() {
    const r = Math.random();
    return r < 0.35 ? 'ash' : r < 0.75 ? 'rain' : 'heat';
  }
  function setWeather(kind) {
    weather.kind = kind;
    weather.next = null;
    weather.warned = false;
    weather.t = kind === 'clear' ? 150 + Math.random() * 150 : 90 + Math.random() * 90;
    if (kind !== 'clear') {
      weather.shown = kind;
      toast(WEATHER[kind].info, 6000);
      say(kind, { force: true });
    }
    sfx.ambience(kind);
  }
  function updateWeather(dt) {
    weather.t -= dt;
    if (weather.kind === 'clear') {
      if (!weather.next) weather.next = pickWeather();
      if (!weather.warned && weather.t <= WARN_AHEAD) { weather.warned = true; radio(WEATHER[weather.next].warn); }
      if (weather.t <= 0) setWeather(weather.next);
    } else if (weather.t <= 0) {
      setWeather('clear');
      radio('clear');
    }
    weather.k += Math.max(-dt / FADE, Math.min(dt / FADE, (weather.kind === 'clear' ? 0 : 1) - weather.k));
    outsideT -= dt;
    if (outsideT <= 0) { outsideT = 0.25; outside = openToSky(Math.floor(player.x + player.w / 2), Math.floor(player.y)); }
    if (weatherOn('ash') && outside) {
      ashT -= dt;
      if (ashT <= 0) { ashT = 4; hurt(2, 'ashHurt'); }
    } else ashT = 4;
    if (weatherOn('rain')) {
      if ((growT -= dt) <= 0) { growT = 3; regrow(); }
      if ((douseT -= dt) <= 0) { douseT = 2; douseFires(); }
    }
  }
  // Rain brings the wasteland back: new bushes, and now and then a young tree.
  function regrow() {
    let changed = false;
    const px = Math.floor(player.x + player.w / 2);
    for (let i = 0; i < 5; i++) {
      const x = px + Math.floor(Math.random() * 81) - 40;
      if (x < 3 || x >= W - 3 || Math.abs(x - px) < 2) continue;
      let y = 0;
      while (y < H && !BLOCK[get(x, y)].solid) y++;
      if (get(x, y) !== B.GRASS || get(x, y - 1) !== B.AIR) continue;
      const r = Math.random();
      if (r < 0.35) { tiles[idx(x, y - 1)] = B.BUSH; changed = true; }
      else if (r < 0.45 && growTree(x, y)) changed = true;
    }
    if (changed) computeLight();
  }
  function growTree(x, ground) {
    const trunk = 4 + ((Math.random() * 2) | 0), top = ground - trunk;
    for (let y = top - 2; y < ground; y++) for (let xx = x - 2; xx <= x + 2; xx++) if (get(xx, y) !== B.AIR) return false;
    for (let i = 1; i <= trunk; i++) tiles[idx(x, ground - i)] = B.LOG;
    for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) + Math.abs(dy) > 3 || (dy === 1 && Math.abs(dx) === 2)) continue;
      if (get(x + dx, top + dy) === B.AIR) tiles[idx(x + dx, top + dy)] = B.LEAVES;
    }
    return true;
  }
  // Rain puts out torches and fires with nothing over them.
  function douseFires() {
    let changed = false, nearby = false;
    for (let i = 0; i < tiles.length; i++) {
      const b = tiles[i];
      if (b !== B.TORCH && b !== B.CAMPFIRE) continue;
      const x = i % W, y = (i / W) | 0;
      if (!openToSky(x, y) || Math.random() > 0.4) continue;
      tiles[i] = B.AIR;
      changed = true;
      if (Math.abs(x - player.x) < 25) nearby = true;
    }
    if (changed) computeLight();
    if (nearby) {
      say('fireOut', { force: true });
      toast('The rain put out a fire left in the open. Build a roof over your fires.');
    }
  }

  // ---------- Irn Bru Shield ----------
  // Equips automatically while the Claymore is held. Blocks 0.75x the base chance against
  // bites and charges, and 1.5x against spit.
  const SHIELD_BASE = 0.4, SHIELD_MELEE = SHIELD_BASE * 0.75, SHIELD_SPIT = SHIELD_BASE * 1.5;
  const shieldUp = () => !!(held() && ITEM[held().id].sword && count('bru_shield') > 0);
  function tryBlock(kind) {
    if (!shieldUp() || Math.random() >= (kind === 'spit' ? SHIELD_SPIT : SHIELD_MELEE)) return false;
    const [px] = centre(player);
    floaters.push({ x: px, y: player.y - 0.2, text: 'Blocked!', col: '#6fb3de', t: 0.9 });
    sfx.clang();
    return true;
  }

  // ---------- The Haggis lair ----------
  // A big cavern near the bottom of the world. Play the Bagpipes inside it, with the full kit, to summon the beast.
  let lair = null;
  function makeLair(rnd) {
    let cx = W / 2;
    for (let i = 0; i < 50 && Math.abs(cx - W / 2) < 40; i++) cx = 20 + Math.floor(rnd() * (W - 40));
    const floor = H - 4, rx = 13, top = floor - 9;
    for (let dx = -rx; dx <= rx; dx++) for (let y = top; y < floor; y++) {
      const ny = (y - (floor - 4.5)) / 4.8;
      if ((dx / rx) ** 2 + ny * ny <= 1) tiles[idx(cx + dx, y)] = B.AIR;
    }
    for (let dx = -rx - 1; dx <= rx + 1; dx++) {
      tiles[idx(cx + dx, floor)] = B.STONE;
      if (tiles[idx(cx + dx, floor - 1)] !== B.AIR) continue;
      const r = rnd();
      if (r < 0.2) tiles[idx(cx + dx, floor - 1)] = B.GLOWCAP; // glowing mushrooms light the lair
      else if (r < 0.45) tiles[idx(cx + dx, floor - 1)] = B.ASH;
    }
    return { x: cx, x0: cx - rx, x1: cx + rx, y0: top, y1: floor };
  }
  const inLair = () => {
    if (!lair) return false;
    const [px, py] = centre(player);
    return px >= lair.x0 - 1 && px <= lair.x1 + 1 && py >= lair.y0 - 1 && py <= lair.y1 + 1;
  };

  // ---------- Endgame ----------
  // The Big Haggis Hunt: build a base, gear up, then pipe the Mutant Haggis out of its lair and kill it.
  const ENDGAME = [
    { id: 'base', text: 'Build a base: a Workbench, a Furnace and a Wee Fire close together, with a roof over the fire.' },
    { id: 'claymore', text: 'Forge a Claymore, the best sword: 4 Iron Ingots, 1 Oak Log, 1 Rope.' },
    { id: 'iron_bow', text: 'Craft The Persuader, the best bow.' },
    { id: 'bru_shield', text: 'Drink Irn Bru and craft the Irn Bru Shield from 6 empties, 2 Iron Ingots and 1 Rope.' },
    { id: 'bru3', text: 'Carry 3 cans of Irn Bru for the fight.', live: () => count('irn_bru') >= 3 },
    { id: 'bagpipes', text: 'Craft the Bagpipes: 1 Raw Meat, 3 Sticks, 2 String, 1 Oak Log.' },
    { id: 'summoned', text: 'Go to the Haggis lair at the very bottom of the world and play the Bagpipes.' },
    { id: 'haggis', text: 'Kill the Mutant Haggis!' },
  ];
  const endgameDone = g => g.live ? g.live() : !!progress[g.id];
  function kitMissing() {
    const miss = [];
    if (!progress.base) miss.push('a base');
    if (!count('claymore')) miss.push('the Claymore');
    if (!count('iron_bow')) miss.push('The Persuader');
    if (!count('bru_shield')) miss.push('the Irn Bru Shield');
    if (count('irn_bru') < 3) miss.push(`${3 - count('irn_bru')} more Irn Bru`);
    return miss;
  }
  let baseT = 0;
  function checkBase(dt) {
    if (progress.base || (baseT -= dt) > 0) return;
    baseT = 2;
    const px = Math.floor(player.x), py = Math.floor(player.y);
    for (let y = py - 20; y <= py + 20; y++) for (let x = px - 20; x <= px + 20; x++) {
      if (get(x, y) !== B.CAMPFIRE || openToSky(x, y)) continue;
      let bench = false, furnace = false;
      for (let yy = y - 6; yy <= y + 6; yy++) for (let xx = x - 6; xx <= x + 6; xx++) {
        const b = get(xx, yy);
        if (b === B.BENCH) bench = true;
        if (b === B.FURNACE) furnace = true;
      }
      if (bench && furnace) {
        progress.base = true;
        uiDirty = true;
        say('base', { force: true });
        toast('Base built! Now gear up for the Big Haggis Hunt.', 4000);
        return;
      }
    }
  }

  // ---------- Bagpipes, summoning and the boss ----------
  let boss = null;
  function playPipes() {
    sfx.pipes();
    if (boss) { toast("It's already here! Fight!"); return; }
    if (!inLair()) {
      say('pipesNothing', { force: true });
      toast('The pipes echo round the wasteland. Nothing answers. Play them in the Haggis lair at the very bottom of the world.', 5000);
      return;
    }
    const miss = kitMissing();
    if (miss.length) {
      say('notReady', { force: true });
      toast(`Something stirs, then settles. You're not ready. Still need: ${miss.join(', ')}.`, 6000);
      return;
    }
    summonHaggis();
  }
  function summonHaggis() {
    const d = ENEMY.haggis, [px] = centre(player);
    const x = px < lair.x ? lair.x1 - 4 : lair.x0 + 2;
    boss = { type: 'haggis', x, y: lair.y1 - d.h - 0.05, w: d.w, h: d.h, vx: 0, vy: 0, kb: 0, hp: d.hp, max: d.hp,
      face: px < x ? -1 : 1, flash: 0, onGround: false, spitT: 2.5, chargeT: 4, charging: 0, chargeDir: 1, enraged: false };
    enemies.push(boss);
    progress.summoned = true;
    uiDirty = true;
    sfx.roar();
    say('haggis', { force: true });
    setTimeout(() => radio('haggis'), 1500);
    bossBarEl.hidden = false;
  }
  function updateBoss(e, dt) {
    const d = ENEMY.haggis, [ecx] = centre(e), [pcx] = centre(player), dx = pcx - ecx;
    if (!e.enraged && e.hp < e.max / 2) {
      e.enraged = true;
      sfx.roar();
      say('haggisRage', { force: true });
      floaters.push({ x: ecx, y: e.y - 0.3, text: 'ENRAGED', col: '#e2566b', t: 1.5 });
    }
    let speed = d.speed * (e.enraged ? 1.4 : 1), dir = Math.abs(dx) > 1.5 ? Math.sign(dx) : 0;
    e.chargeT -= dt;
    if (e.charging > 0) { e.charging -= dt; speed = 9; dir = e.chargeDir; }
    else if (e.chargeT <= 0 && Math.abs(dx) < 14) { e.charging = 0.7; e.chargeDir = Math.sign(dx) || 1; e.chargeT = e.enraged ? 3.5 : 5.5; sfx.roar(); }
    if (dir) e.face = dir;
    e.kb -= e.kb * Math.min(1, dt * 6);
    e.vx = dir * speed + e.kb;
    stepBody(e, dt);
    if (e.blocked && e.onGround) e.vy = d.jump;
    e.flash = Math.max(0, e.flash - dt);
    // Spit volleys: one lump, or three when enraged
    if ((e.spitT -= dt) <= 0) {
      e.spitT = e.enraged ? 1.6 : 2.6;
      const n = e.enraged ? 3 : 1, ox = ecx + e.face * 1.1, oy = e.y + 0.6;
      const [tx, ty] = centre(player), ang = Math.atan2(ty - oy, tx - ox) - 0.08;
      for (let i = 0; i < n; i++) {
        const a = ang + (i - (n - 1) / 2) * 0.12;
        spits.push({ x: ox, y: oy, vx: Math.cos(a) * 13, vy: Math.sin(a) * 13, life: 3 });
      }
      sfx.spit();
    }
    if (iframes <= 0 && overlaps(e, player)) {
      iframes = 1;
      player.kb = Math.sign(dx || 1) * 12;
      player.vy = -7;
      if (!tryBlock('melee')) hurt(e.charging > 0 ? 28 : d.dmg);
    }
  }
  let spits = [];
  function updateSpits(dt) {
    for (const p of spits) {
      p.vy += GRAVITY * 0.35 * dt;
      p.life -= dt;
      const steps = Math.ceil(Math.hypot(p.vx, p.vy) * dt / 0.25) || 1;
      for (let i = 0; i < steps && !p.dead; i++) {
        p.x += p.vx * dt / steps; p.y += p.vy * dt / steps;
        if (solidAt(Math.floor(p.x), Math.floor(p.y))) { p.dead = true; break; }
        if (p.x > player.x && p.x < player.x + player.w && p.y > player.y && p.y < player.y + player.h) {
          p.dead = true;
          if (!tryBlock('spit')) hurt(12);
        }
      }
      if (p.life <= 0) p.dead = true;
    }
    spits = spits.filter(p => !p.dead);
  }
  function bossDefeated() {
    boss = null;
    progress.haggis = true;
    uiDirty = true;
    bossBarEl.hidden = true;
    spits = [];
    say('victory', { force: true });
    setTimeout(() => radio('victory'), 1200);
    setTimeout(() => { document.getElementById('victory').hidden = false; }, 2500);
  }
  function resetBoss() {
    boss = null;
    spits = [];
    progress.summoned = false;
    bossBarEl.hidden = true;
  }

  // ---------- F: use / interact, Q: quick heal ----------
  function useHeld() {
    const it = held() && ITEM[held().id];
    if (!it) return false;
    if (it.pipes) { playPipes(); return true; }
    if (it.heal || it.food || it.bru) { eat(held()); return true; }
    return false;
  }
  function interact() {
    if (invOpen()) return;
    const t = targetTile();
    if (t.visible && get(t.tx, t.ty) === B.CHEST) return openChest(t.tx, t.ty);
    if (t.visible && get(t.tx, t.ty) === B.VENDING) return openVending(t.tx, t.ty);
    if (!useHeld()) toast('Nothing to use here. Point at a chest or machine, or hold food, a Big Plaster, Irn Bru or the Bagpipes.');
  }
  // Uses the healing item that best fits the missing health (Irn Bru is saved for emergencies).
  function quickHeal() {
    if (player.hp >= maxHp()) { toast('Your health is already full'); return; }
    const missing = maxHp() - player.hp;
    const options = inv.filter(Boolean).map(it => it.id).filter((id, i, a) => a.indexOf(id) === i && ITEM[id].heal && !ITEM[id].sick);
    if (!options.length) { toast('No healing items. Find berries, cook a Rat Piece or craft a Big Plaster.'); sfx.denied(); return; }
    options.sort((a, b) => ITEM[a].heal - ITEM[b].heal);
    const pickId = options.find(id => ITEM[id].heal >= missing) || options[options.length - 1];
    didAction('quickheal');
    eat({ id: pickId });
  }

  // ---------- Enemies and combat ----------
  const ENEMY = {
    rat: { name: 'Big Minger', w: 0.9, h: 0.6, hp: 20, dmg: 6, speed: 2.7, jump: -9, drops: [['raw_meat', 1, 0.7]] },
    ghoul: { name: 'Bawheid', w: 0.7, h: 1.7, hp: 45, dmg: 12, speed: 1.9, jump: -10.5,
      drops: [['scrap', 1, 0.5], ['string', 1, 0.5], ['rope', 1, 0.15], ['raw_meat', 1, 0.3]] },
    // Pale, blind cave dwellers. They live underground and run from fire.
    crawler: { name: 'Peely-Wally', w: 0.8, h: 1.2, hp: 35, dmg: 10, speed: 3.0, jump: -12, fearsFire: true,
      drops: [['raw_meat', 1, 0.4], ['string', 1, 0.4], ['rope', 1, 0.2]] },
  };
  ENEMY.haggis = { name: 'Mutant Haggis', w: 2.6, h: 1.9, hp: 600, dmg: 20, speed: 2.2, jump: -12, boss: true,
    drops: [['haggis_supper', 5, 1]] };
  const FIRE_RANGE = 7;
  const FIRE_BLOCKS = new Set([B.TORCH, B.CAMPFIRE, B.FURNACE]);
  // X position of the nearest fire within range (a placed fire, or a torch in the player's hand), or null.
  function nearestFire(ex, ey) {
    let best = null, bd = FIRE_RANGE;
    const it = held();
    if (it && it.id === 'torch') {
      const [px, py] = centre(player), d = Math.hypot(px - ex, py - ey);
      if (d < bd) { bd = d; best = px; }
    }
    const x0 = Math.floor(ex), y0 = Math.floor(ey);
    for (let y = y0 - FIRE_RANGE; y <= y0 + FIRE_RANGE; y++) for (let x = x0 - FIRE_RANGE; x <= x0 + FIRE_RANGE; x++) {
      if (!FIRE_BLOCKS.has(get(x, y))) continue;
      const d = Math.hypot(x + 0.5 - ex, y + 0.5 - ey);
      if (d < bd) { bd = d; best = x + 0.5; }
    }
    return best;
  }
  const MAX_ENEMIES = 5, MELEE_REACH = 2.4, CHASE_RANGE = 10;
  let enemies = [], arrows = [], floaters = [];
  let spawnTimer = 30, attackCooldown = 0, iframes = 0;

  // Distance from Tam's centre to the nearest point of a creature, plus a little so small ones feel the same as before.
  function reachOf(e) {
    const [px, py] = centre(player);
    const nx = Math.max(e.x, Math.min(px, e.x + e.w)), ny = Math.max(e.y, Math.min(py, e.y + e.h));
    return Math.hypot(px - nx, py - ny) + 0.6;
  }
  const mouseWorld = () => ({ x: (mouse.x + camera.x) / TILE, y: (mouse.y + camera.y) / TILE });
  const centre = e => [e.x + e.w / 2, e.y + e.h / 2];
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  function stepBody(e, dt) {
    e.vy = Math.min(e.vy + GRAVITY * dt, MAX_FALL);
    const steps = Math.ceil(Math.max(Math.abs(e.vx), Math.abs(e.vy)) * dt / 0.4) || 1;
    const wasGround = e.onGround;
    e.onGround = false; e.blocked = false;
    for (let i = 0; i < steps; i++) {
      const nx = e.x + e.vx * dt / steps;
      if (!boxHits(nx, e.y, e.w, e.h)) e.x = nx;
      else if (wasGround && !boxHits(nx, e.y - 1, e.w, e.h)) { e.x = nx; e.y -= 1; }
      else e.blocked = true;
      const ny = e.y + e.vy * dt / steps;
      if (!boxHits(e.x, ny, e.w, e.h)) e.y = ny;
      else {
        if (e.vy > 0) { e.y = Math.floor(ny + e.h) - e.h - 1e-4; e.onGround = true; }
        e.vy = 0;
      }
    }
  }

  function trySpawn() {
    if (boss || enemies.length >= MAX_ENEMIES) return;
    const side = Math.random() < 0.5 ? -1 : 1;
    const x = Math.floor(player.x + side * (18 + Math.random() * 16));
    if (x < 1 || x >= W - 1) return;
    let y, type;
    const underground = player.y > surface[Math.floor(player.x)] + 4;
    if (Math.random() < (underground ? 0.2 : 0.6)) { // on the surface
      y = 0;
      while (y < H && !BLOCK[get(x, y)].solid) y++;
      type = weatherOn('ash') && Math.random() < 0.4 ? 'crawler' : Math.random() < 0.7 ? 'rat' : 'ghoul'; // crawlers surface in the ash
    } else { // in dark caves near the player's depth
      y = Math.floor(player.y) + Math.floor(Math.random() * 16 - 8);
      if (y < 1 || BLOCK[get(x, y)].solid) return;
      while (y < H && !BLOCK[get(x, y)].solid) y++;
      if (light[idx(x, y - 1)] > 6) return;
      if (y > surface[x] + 6) type = Math.random() < 0.5 ? 'crawler' : 'rat'; // deep underground
      else type = Math.random() < 0.5 ? 'rat' : 'ghoul';
    }
    const d = ENEMY[type];
    if (d.fearsFire && nearestFire(x + 0.5, y - 1) !== null) return;
    const e = { type, x: x + 0.5 - d.w / 2, y: y - d.h - 0.01, w: d.w, h: d.h, vx: 0, vy: 0, kb: 0,
      hp: d.hp, max: d.hp, face: -side, flash: 0, wander: 0, wanderT: 0, onGround: false };
    if (y >= H || boxHits(e.x, e.y, e.w, e.h)) return;
    enemies.push(e);
  }

  // Peely-Wallies lurk in the twilight zone: the first dark stretch of cave below where daylight fades.
  // They spawn there even while Tam is on the surface, sometimes with a rat nearby for them to hunt.
  const MAX_CRAWLERS = 3, BRIGHT = 9;
  let crawlerT = 12;
  function trySpawnCrawler() {
    if (boss) return;
    if (enemies.filter(e => e.type === 'crawler').length >= MAX_CRAWLERS || enemies.length >= MAX_ENEMIES + 2) return;
    for (let attempt = 0; attempt < 8; attempt++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const x = Math.floor(player.x + side * (10 + Math.random() * 22));
      if (x < 1 || x >= W - 1) continue;
      for (let y = surface[x] + 2; y < Math.min(H - 2, surface[x] + 32); y++) {
        if (BLOCK[get(x, y)].solid || !BLOCK[get(x, y + 1)].solid) continue;
        const L = light[idx(x, y)];
        if (L > 4) continue;                // still too bright
        if (Math.hypot(x - player.x, y - player.y) < 8) break;
        const type = Math.random() < 0.3 ? 'rat' : 'crawler';
        const d = ENEMY[type];
        const e = { type, x: x + 0.5 - d.w / 2, y: y + 1 - d.h - 0.01, w: d.w, h: d.h, vx: 0, vy: 0, kb: 0,
          hp: d.hp, max: d.hp, face: -side, flash: 0, wander: 0, wanderT: 0, onGround: false };
        if (boxHits(e.x, e.y, e.w, e.h) || (d.fearsFire && nearestFire(x + 0.5, y) !== null)) break;
        enemies.push(e);
        return;
      }
    }
  }
  const lightAt = (x, y) => inWorld(Math.floor(x), Math.floor(y)) ? light[idx(Math.floor(x), Math.floor(y))] : 0;

  function updateEnemies(dt) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { spawnTimer = 5 + Math.random() * 4; trySpawn(); }
    if ((crawlerT -= dt) <= 0) { crawlerT = 6 + Math.random() * 4; trySpawnCrawler(); }
    const [pcx, pcy] = centre(player);
    for (const e of enemies) {
      if (e.type === 'haggis') { updateBoss(e, dt); continue; }
      const d = ENEMY[e.type];
      const [ecx, ecy] = centre(e);
      const dx = pcx - ecx, dy = pcy - ecy;
      // Only hunt the player when they're close and nothing solid is in the way; check a few times a second.
      e.lookT = (e.lookT || 0) - dt;
      if (e.lookT <= 0) {
        e.lookT = 0.25 + Math.random() * 0.1;
        const saw = e.seesPlayer;
        e.seesPlayer = Math.hypot(dx, dy) < CHASE_RANGE && clearLine(ecx, e.y + e.h * 0.3, pcx, pcy, -1, -1);
        if (e.seesPlayer && !saw) say(e.type, { cooldown: 25, chance: e.type === 'crawler' ? 1 : 0.5 });
      }
      let dir, speed = d.speed;
      const fire = d.fearsFire ? nearestFire(ecx, ecy) : null;
      e.fleeing = fire !== null;
      // Peely-Wallies hunt Tam, or a rat if Tam isn't in sight.
      let prey = null;
      if (e.type === 'crawler' && !e.seesPlayer) {
        let best = 10;
        for (const o of enemies) {
          if (o.type !== 'rat' || o.dead) continue;
          const dist = Math.hypot(centre(o)[0] - ecx, centre(o)[1] - ecy);
          if (dist < best) { best = dist; prey = o; }
        }
      }
      if (e.fleeing) { dir = ecx < fire ? -1 : 1; speed *= 1.3; } // run away from the flames
      else if (e.seesPlayer) dir = Math.abs(dx) > 0.3 ? Math.sign(dx) : 0; // chase
      else if (prey) dir = Math.sign(centre(prey)[0] - ecx) || 0;
      else {
        e.wanderT -= dt;
        if (e.wanderT <= 0) { e.wander = [-1, 0, 1][(Math.random() * 3) | 0]; e.wanderT = 2 + Math.random() * 3; }
        dir = e.wander;
      }
      // Peely-Wallies won't step into bright light (except under an ash cloud); caught in it, they back into the dark.
      if (e.type === 'crawler' && !e.fleeing && !weatherOn('ash')) {
        if (lightAt(ecx, ecy) >= BRIGHT) {
          dir = lightAt(ecx - 2, ecy) <= lightAt(ecx + 2, ecy) ? -1 : 1;
          speed *= 1.2;
        } else if (dir && lightAt(ecx + dir * 0.9, ecy) >= BRIGHT) dir = 0;
      }
      if (e.feeding > 0) { e.feeding -= dt; dir = 0; }
      if (dir) e.face = dir;
      e.kb -= e.kb * Math.min(1, dt * 6);
      e.vx = dir * speed + e.kb;
      stepBody(e, dt);
      if (e.blocked && e.onGround) {
        // A wandering creature that stays stuck against a wall turns around instead of pushing into it.
        e.stuck = (e.stuck || 0) + dt;
        if (!e.seesPlayer && !e.fleeing && e.stuck > 0.6) { e.wander = -e.wander; e.wanderT = 2 + Math.random() * 3; e.stuck = 0; }
        else e.vy = d.jump;
      } else e.stuck = 0;
      e.flash = Math.max(0, e.flash - dt);
      if (iframes <= 0 && !e.fleeing && overlaps(e, player)) {
        iframes = 0.8;
        player.kb = Math.sign(dx || 1) * 9;
        player.vy = -5;
        if (!tryBlock('melee')) hurt(d.dmg);
      }
      if (prey && overlaps(e, prey)) {
        e.biteT = (e.biteT || 0) - dt;
        if (e.biteT <= 0) {
          e.biteT = 0.8;
          prey.hp -= 12;
          prey.flash = 0.15;
          if (prey.hp <= 0) {
            prey.dead = true;
            e.hp = e.max;
            e.feeding = 2;
            floaters.push({ x: ecx, y: e.y, text: '*crunch*', col: '#d9d4c8', t: 1.2 });
          }
        }
      }
      if (Math.abs(dx) > 60 || e.y > H) e.dead = true;
    }
    enemies = enemies.filter(e => !e.dead);
  }

  function damageEnemy(e, n, fromX) {
    const [ecx, ecy] = centre(e);
    e.hp -= n;
    e.flash = 0.15;
    const heavy = ENEMY[e.type].boss;
    e.kb = Math.sign(ecx - fromX || 1) * (heavy ? 2 : 8);
    if (!heavy) e.vy = -4;
    floaters.push({ x: ecx, y: e.y, text: `-${n}`, col: '#ffd166', t: 0.9 });
    sfx.hitEnemy();
    if (e.hp <= 0 && ENEMY[e.type].boss) setTimeout(bossDefeated, 0);
    if (e.hp <= 0) {
      if (!ENEMY[e.type].boss) say('kill', { chance: 0.4, cooldown: 8 });
      e.dead = true;
      sfx.enemyDie();
      progress.kill = true;
      for (const [id, n, chance] of ENEMY[e.type].drops) {
        if (Math.random() < chance) {
          addItem(id, n);
          floaters.push({ x: ecx, y: ecy - 0.5, text: `+${n} ${ITEM[id].name}`, col: '#e8e2c8', t: 1.4 });
        }
      }
    }
  }

  // Enemy under the crosshair, if any.
  function enemyAtMouse() {
    const m = mouseWorld();
    return enemies.find(e => !e.dead && m.x > e.x - 0.25 && m.x < e.x + e.w + 0.25 && m.y > e.y - 0.25 && m.y < e.y + e.h + 0.25);
  }

  // ---------- Stamina ----------
  // Jumping, swinging a tool and using weapons cost stamina; walking is free.
  // It refills after a short pause from exertion.
  const MAX_ST = 100, ST_REGEN = 22, ST_PAUSE = 0.9;
  const ST_COST = { jump: 8, swing: 2, melee: 8, bow: 10 };
  let staminaWait = 0, tiredToastT = 0;
  function spend(what) {
    if (bruT > 0) return true; // Bru Rush: unlimited stamina
    const n = ST_COST[what];
    if (player.st < n) {
      if (tiredToastT <= 0) {
        toast('Out of breath. Rest a moment.');
        say('tired', { cooldown: 8 });
        tiredToastT = 3;
        staminaEl.classList.remove('empty'); void staminaEl.offsetWidth; staminaEl.classList.add('empty');
      }
      return false;
    }
    player.st -= n;
    staminaWait = ST_PAUSE;
    return true;
  }
  function updateStamina(dt) {
    staminaWait -= dt;
    tiredToastT -= dt;
    if (staminaWait <= 0) player.st = Math.min(MAX_ST, player.st + ST_REGEN * dt * (heatOn() ? 0.5 : 1));
  }

  function melee(e) {
    if (!spend('melee')) { attackCooldown = 0.3; return; }
    const it = held() && ITEM[held().id];
    const dmg = it && it.melee ? it.melee : it && it.tool ? 4 : 2;
    attackCooldown = it && it.melee ? 0.35 : 0.5;
    player.swing = 0.2;
    player.face = Math.sign(centre(e)[0] - centre(player)[0]) || player.face;
    sfx.swing();
    didAction('attack');
    damageEnemy(e, dmg, centre(player)[0]);
  }

  function fireBow(bow) {
    attackCooldown = 0.55;
    const ammo = ARROWS.find(a => count(a) > 0);
    if (!ammo) { toast('You have no arrows. Craft some or find them in supply chests.'); sfx.denied(); return; }
    if (!spend('bow')) return;
    removeItem(ammo, 1);
    const ox = player.x + player.w / 2, oy = player.y + 0.6, m = mouseWorld();
    const ang = Math.atan2(m.y - oy, m.x - ox);
    arrows.push({ x: ox, y: oy, vx: Math.cos(ang) * bow.bow, vy: Math.sin(ang) * bow.bow,
      dmg: ITEM[ammo].arrow + bow.bonus, tip: ITEM[ammo].tip, life: 3 });
    player.face = Math.cos(ang) < 0 ? -1 : 1;
    sfx.bow();
    didAction('shoot');
  }

  function updateArrows(dt) {
    for (const a of arrows) {
      a.vy += GRAVITY * 0.35 * dt;
      a.life -= dt;
      const steps = Math.ceil(Math.hypot(a.vx, a.vy) * dt / 0.25) || 1;
      for (let i = 0; i < steps && !a.dead; i++) {
        a.x += a.vx * dt / steps; a.y += a.vy * dt / steps;
        if (solidAt(Math.floor(a.x), Math.floor(a.y))) { a.dead = true; sfx.hit('wood'); break; }
        const e = enemies.find(e => !e.dead && a.x > e.x && a.x < e.x + e.w && a.y > e.y && a.y < e.y + e.h);
        if (e) { damageEnemy(e, a.dmg, a.x - a.vx); a.dead = true; }
      }
      if (a.life <= 0) a.dead = true;
    }
    arrows = arrows.filter(a => !a.dead);
    enemies = enemies.filter(e => !e.dead);
    updateSpits(dt);
    for (const f of floaters) { f.t -= dt; f.y -= dt * 0.8; }
    floaters = floaters.filter(f => f.t > 0);
  }

  function hasSupport(tx, ty) {
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const b = get(tx + dx, ty + dy);
      return b !== B.AIR && b !== B.TORCH;
    });
  }

  function update(dt) {
    const left = keys.a || keys.arrowleft || touch.left;
    const right = keys.d || keys.arrowright || touch.right;
    const up = keys.w || keys[' '] || keys.arrowup || touch.jump;
    const down = keys.s || keys.arrowdown || touch.down;

    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    player.kb -= player.kb * Math.min(1, dt * 8);
    player.vx = dir * SPEED + player.kb;
    if (dir) player.face = dir;
    player.walk = dir && player.onGround ? player.walk + dt * 10 : 0;

    if (onClimbable()) {
      player.vy = up ? -5 : down ? 5 : 0;
      if ((up || down) && !player.climbing) didAction('climb');
      player.climbing = up || down;
    } else {
      player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);
      if (up && player.onGround && spend('jump')) { player.vy = JUMP; sfx.jump(); didAction('jump'); }
    }
    const fallSpeed = player.vy;

    const steps = Math.ceil(Math.max(Math.abs(player.vx), Math.abs(player.vy)) * dt / 0.4) || 1;
    const wasGround = player.onGround;
    player.onGround = false;
    for (let s = 0; s < steps; s++) {
      const g = player.onGround || wasGround;
      player.onGround = g;
      moveX(player.vx * dt / steps);
      player.onGround = false;
      moveY(player.vy * dt / steps);
    }
    if (player.onGround && !wasGround && fallSpeed > 13) {
      sfx.land();
      if (fallSpeed > 16.5) hurt(Math.round((fallSpeed - 16.5) * 5), 'fall');
    }
    hurtFlash = Math.max(0, hurtFlash - dt);
    if (player.onGround && dir) {
      stepTimer -= dt;
      if (stepTimer <= 0) {
        stepTimer = 0.32;
        sfx.step(materialOf(get(Math.floor(player.x + player.w / 2), Math.floor(player.y + player.h + 0.05))));
      }
    } else stepTimer = 0;

    // Fighting, mining and placing
    placeCooldown -= dt;
    attackCooldown -= dt;
    iframes -= dt;
    player.swing = Math.max(0, (player.swing || 0) - dt);
    tipCooldown -= dt;
    const t = targetTile();
    const heldItem = held() && ITEM[held().id];
    const foe = mouse.left && !invOpen() ? enemyAtMouse() : null;
    let fighting = false;
    if (mouse.left && !invOpen() && heldItem && heldItem.bow) {
      fighting = true;
      mining.t = 0;
      if (attackCooldown <= 0) fireBow(heldItem);
    } else if (foe && reachOf(foe) <= MELEE_REACH) {
      fighting = true;
      mining.t = 0;
      if (attackCooldown <= 0) melee(foe);
    }
    if (fighting) { /* no mining while attacking */ } else if (mouse.left && !invOpen() && t.inReach) {
      const b = get(t.tx, t.ty);
      if (b === B.AIR) mining.t = 0;
      else {
        if (mining.x !== t.tx || mining.y !== t.ty) { mining.x = t.tx; mining.y = t.ty; mining.t = 0; mining.warned = false; }
        const bd = BLOCK[b];
        const tool = heldTool();
        const tier = tool ? tool.tier : 0;
        if (t.visible && bd.fastTier > tier && tipCooldown <= 0) showOakTip();
        if (!t.visible) {
          if (!mining.warned) { toast('Something is in the way. Clear the blocks in front first.'); sfx.denied(); }
          mining.warned = true;
          mining.t = 0;
        } else if (bd.tier > tier) {
          if (!mining.warned) { toast(bd.tier < 99 ? `${bd.name} needs ${tierName(bd.tier)}` : 'Bedrock cannot be broken'); sfx.denied(); }
          mining.warned = true;
        } else {
          // Each swing of the arm (every 0.25s) makes a sound and costs stamina.
          const swingDue = mining.t === 0 || Math.floor(mining.t / 0.25) !== Math.floor((mining.t + dt) / 0.25);
          if (!swingDue || spend('swing')) {
            if (swingDue) sfx.hit(materialOf(b));
            mining.t += dt;
            if (mining.t >= mineTime(b)) { didAction(bd.pref === 'axe' ? 'chop' : 'mine'); breakBlock(t.tx, t.ty); mining.t = 0; }
          }
        }
      }
    } else mining.t = 0;

    const food = held() && (ITEM[held().id].heal || ITEM[held().id].food || ITEM[held().id].bru || ITEM[held().id].pipes);
    if (mouse.right && !invOpen() && t.visible && get(t.tx, t.ty) === B.CHEST && placeCooldown <= 0) {
      placeCooldown = 0.4;
      openChest(t.tx, t.ty);
    } else if (mouse.right && !invOpen() && t.visible && get(t.tx, t.ty) === B.VENDING && placeCooldown <= 0) {
      placeCooldown = 0.4;
      openVending(t.tx, t.ty);
    } else if (mouse.right && !invOpen() && food && placeCooldown <= 0) {
      placeCooldown = ITEM[held().id].pipes ? 1.5 : 0.4;
      useHeld();
    } else if (mouse.right && !invOpen() && t.inReach && placeCooldown <= 0) {
      placeCooldown = 0.2;
      const it = held();
      const block = it && ITEM[it.id].block;
      if (block && get(t.tx, t.ty) === B.AIR && hasSupport(t.tx, t.ty) &&
        !(BLOCK[block].solid && boxOverlapsTile(t.tx, t.ty))) {
        tiles[idx(t.tx, t.ty)] = block;
        removeItem(it.id, 1);
        sfx.place();
        didAction('place');
        if (block === B.BENCH) progress.placed_bench = true;
        computeLight();
      }
    }

    updateStamina(dt);
    updateHunger(dt);
    updateBru(dt);
    speech.t -= dt;
    sayGap -= dt;
    updateWeather(dt);
    checkBase(dt);
    updateEnemies(dt);
    updateArrows(dt);
    updateAsh(dt);
    updateDrops(dt);

    // Camera eases toward the player.
    const tx = (player.x + player.w / 2) * TILE - viewW / 2;
    const ty = (player.y + player.h / 2) * TILE - viewH / 2;
    const k = 1 - Math.pow(0.0001, dt);
    camera.x += (tx - camera.x) * k;
    camera.y += (ty - camera.y) * k;
    camera.x = Math.max(0, Math.min(W * TILE - viewW, camera.x));
    // The camera can dip below the bottom of the world so fights in the Haggis lair aren't hidden under the HUD.
    camera.y = Math.max(-TILE * 8, Math.min(H * TILE - viewH * 0.6, camera.y));
  }
  function boxOverlapsTile(tx, ty) {
    return player.x < tx + 1 && player.x + player.w > tx && player.y < ty + 1 && player.y + player.h > ty;
  }

  // ---------- Rendering ----------
  const SKY_TINT = { ash: ['70,62,55', 0.8], rain: ['48,58,70', 0.65], heat: ['255,150,60', 0.2] };
  function drawSky() {
    // Smoggy wasteland sky
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, '#6d7479');
    g.addColorStop(0.6, '#b99a72');
    g.addColorStop(1, '#e2b97c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
    const tint = SKY_TINT[weather.shown];
    if (tint && weather.k > 0) {
      ctx.fillStyle = `rgba(${tint[0]},${(tint[1] * weather.k).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    // Pale sun behind the haze
    const sx = viewW * 0.72 - camera.x * 0.02, sy = viewH * 0.28;
    const sun = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90);
    sun.addColorStop(0, 'rgba(255,236,190,0.9)');
    sun.addColorStop(0.25, 'rgba(255,220,160,0.35)');
    sun.addColorStop(1, 'rgba(255,220,160,0)');
    ctx.fillStyle = sun;
    ctx.fillRect(sx - 90, sy - 90, 180, 180);
    // Far layer: a ruined city skyline
    const off = camera.x * 0.15, groundY = viewH * 0.62 - camera.y * 0.05;
    ctx.fillStyle = 'rgba(78,70,66,0.55)';
    for (let i = Math.floor(off / 70) - 1; i * 70 - off < viewW + 70; i++) {
      const bw = 34 + hash2(i, 1, 7) * 40, bh = 40 + hash2(i, 2, 7) * 170;
      const bx = i * 70 - off + hash2(i, 3, 7) * 20;
      ctx.beginPath();
      ctx.moveTo(bx, groundY);
      ctx.lineTo(bx, groundY - bh);
      // broken, jagged roofline
      const steps = 4;
      for (let k = 1; k <= steps; k++) ctx.lineTo(bx + bw * k / steps, groundY - bh + hash2(i, 10 + k, 7) * bh * 0.35);
      ctx.lineTo(bx + bw, groundY);
      ctx.fill();
    }
    ctx.fillRect(0, groundY, viewW, viewH - groundY);
    // Near layer: rubble hills
    ctx.fillStyle = 'rgba(96,78,62,0.6)';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = 0; x <= viewW; x += 16) {
      const wx = (x + camera.x * 0.3) / 180;
      const y = viewH * 0.62 + Math.sin(wx) * 30 + Math.sin(wx * 2.3) * 14 + Math.sin(wx * 7.1) * 4 - camera.y * 0.1;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH);
    ctx.fill();
  }

  // Gold arrow at the screen edge pointing to the nearest unopened chest.
  function drawChestFinder(cx, cy) {
    const px = player.x + player.w / 2, py = player.y + player.h / 2;
    let best = null, bd = 120;
    for (const [x, y] of chests) {
      const d = Math.hypot(x + 0.5 - px, y + 0.5 - py);
      if (d < bd) { bd = d; best = [x, y]; }
    }
    if (best) drawMarker(best[0] + 0.5, best[1] + 0.5, 'chest', bd, '#e8b83a', cx, cy);
    // Once Tam has the Bagpipes, a red marker points the way to the Haggis lair.
    if (lair && count('bagpipes') && !progress.haggis && !boss) {
      const lx = lair.x + 0.5, ly = lair.y1 - 2;
      drawMarker(lx, ly, 'Haggis lair', Math.hypot(lx - px, ly - py), '#e2566b', cx, cy);
    }
  }
  function drawMarker(wx, wy, label, dist, colour, cx, cy) {
    const tx = wx * TILE - cx, ty = wy * TILE - cy, bd = dist;
    const bob = Math.sin(performance.now() / 250) * 3;
    ctx.fillStyle = colour;
    ctx.strokeStyle = 'rgba(20,16,8,0.8)';
    ctx.lineWidth = 2;
    const m = 36;
    if (tx > m && tx < viewW - m && ty > m + 60 && ty < viewH - m - 90) {
      // On screen: a small bobbing marker above the chest
      ctx.beginPath();
      ctx.moveTo(tx - 6, ty - 30 + bob); ctx.lineTo(tx + 6, ty - 30 + bob); ctx.lineTo(tx, ty - 22 + bob);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      return;
    }
    const ox = viewW / 2, oy = viewH / 2, ang = Math.atan2(ty - oy, tx - ox);
    const ex = Math.max(m, Math.min(viewW - m, ox + Math.cos(ang) * viewW));
    const ey = Math.max(m + 60, Math.min(viewH - m - 90, oy + Math.sin(ang) * viewH));
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(12 + bob, 0); ctx.lineTo(-6 + bob, -9); ctx.lineTo(-6 + bob, 9);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.font = '600 13px "Chakra Petch", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeText(`${label} ${Math.round(bd)}m`, ex, ey + 24);
    ctx.fillText(`${label} ${Math.round(bd)}m`, ex, ey + 24);
  }

  const Q = TILE / 2;
  const openAt = (x, y) => !BLOCK[get(x, y)].solid;
  function drawTile(b, x, y, sx, sy) {
    const vars = TEXV[b];
    if (vars.length === 1) { ctx.drawImage(vars[0], sx, sy, TILE, TILE); return; }
    const trim = TRIMMED.has(b);
    for (let q = 0; q < 4; q++) {
      const dx = q & 1, dy = q >> 1;
      const qx = sx + dx * Q, qy = sy + dy * Q;
      if (trim && openAt(x + (dx ? 1 : -1), y) && openAt(x, y + (dy ? 1 : -1))) {
        // Outer corner: leave it open, showing the cave wall underground or the sky above
        if (y > surface[x]) ctx.drawImage(y > surface[x] + 5 ? WALL_STONE : WALL_DIRT, dx * 16, dy * 16, 16, 16, qx, qy, Q, Q);
        continue;
      }
      const v = (hash2(x * 2 + dx, y * 2 + dy, 5) * vars.length) | 0;
      ctx.drawImage(vars[v], dx * 16, dy * 16, 16, 16, qx, qy, Q, Q);
      // A grass quarter below a trimmed corner gets its own grassy top
      if (b === B.GRASS && dy === 1 && openAt(x + (dx ? 1 : -1), y) && openAt(x, y - 1)) {
        ctx.drawImage(vars[v], dx * 16, 0, 16, 7, qx, qy, Q, 7);
      }
    }
  }

  function render() {
    ctx.imageSmoothingEnabled = false;
    drawSky();
    const cx = Math.round(camera.x), cy = Math.round(camera.y);
    const x0 = Math.max(0, Math.floor(cx / TILE)), x1 = Math.min(W - 1, Math.floor((cx + viewW) / TILE));
    const y0 = Math.max(0, Math.floor(cy / TILE)), y1 = Math.min(H - 1, Math.floor((cy + viewH) / TILE));

    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const b = tiles[idx(x, y)];
      const sx = x * TILE - cx, sy = y * TILE - cy;
      if (y > surface[x] && (b === B.AIR || !BLOCK[b].solid)) {
        ctx.drawImage(y > surface[x] + 5 ? WALL_STONE : WALL_DIRT, sx, sy, TILE, TILE);
      }
      if (b) drawTile(b, x, y, sx, sy);
    }
    if (H * TILE - cy < viewH) { // below the bottom of the world: solid bedrock black
      ctx.fillStyle = '#0c0b0a';
      ctx.fillRect(0, H * TILE - cy, viewW, viewH);
    }

    for (const e of enemies) drawEnemy(e, cx, cy);
    for (const p of spits) { // neeps an' tatties, spat hard
      const x = p.x * TILE - cx, y = p.y * TILE - cy;
      ctx.fillStyle = 'rgba(14,11,9,0.9)'; ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#e0a040'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f4dca0'; ctx.fillRect(x - 2, y - 3, 2, 2);
    }
    drawPlayer(cx, cy);
    for (const a of arrows) {
      const sp = Math.hypot(a.vx, a.vy), ux = a.vx / sp, uy = a.vy / sp;
      const x = a.x * TILE - cx, y = a.y * TILE - cy;
      const nx = -uy, ny = ux; // perpendicular, for the tip and fletching
      ctx.lineCap = 'butt';
      ctx.strokeStyle = 'rgba(14,11,9,0.85)'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(x - ux * 20, y - uy * 20); ctx.lineTo(x, y); ctx.stroke();
      ctx.strokeStyle = '#9a6e44'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - ux * 20, y - uy * 20); ctx.lineTo(x, y); ctx.stroke();
      ctx.strokeStyle = '#c49a5e'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - ux * 18, y - uy * 18 - 0.5); ctx.lineTo(x - ux * 2, y - uy * 2 - 0.5); ctx.stroke();
      ctx.fillStyle = a.tip; // arrowhead
      ctx.beginPath();
      ctx.moveTo(x + ux * 5, y + uy * 5); ctx.lineTo(x + nx * 3, y + ny * 3); ctx.lineTo(x - nx * 3, y - ny * 3);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(14,11,9,0.85)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e8e2c8'; // fletching
      for (const sgn of [1, -1]) {
        ctx.beginPath();
        ctx.moveTo(x - ux * 14, y - uy * 14); ctx.lineTo(x - ux * 21 + nx * 4 * sgn, y - uy * 21 + ny * 4 * sgn); ctx.lineTo(x - ux * 19, y - uy * 19);
        ctx.closePath(); ctx.fill();
      }
    }

    drawShade(x0, y0, x1, y1, cx, cy);
    drawFireGlow(x0, y0, x1, y1, cx, cy);
    drawWeather();

    // Target highlight and cracks
    if (mouse.over && !invOpen()) {
      const t = targetTile();
      if (inWorld(t.tx, t.ty)) {
        const sx = t.tx * TILE - cx, sy = t.ty * TILE - cy;
        const blocked = !t.visible && get(t.tx, t.ty) !== B.AIR;
        ctx.strokeStyle = t.inReach && !blocked ? 'rgba(255,255,255,0.8)' : 'rgba(224,122,95,0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
        const b = get(t.tx, t.ty);
        if (mining.t > 0 && mining.x === t.tx && mining.y === t.ty && b) {
          drawCracks(sx, sy, Math.min(1, mining.t / mineTime(b)));
        }
      }
      if (!mouse.touch) drawCrosshair(mouse.x, mouse.y);
    }
    drawAsh();
    drawChestFinder(cx, cy);

    // Floating damage numbers and pickups
    ctx.font = '700 15px "Chakra Petch", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(10,8,6,0.8)';
    for (const f of floaters) {
      ctx.globalAlpha = Math.min(1, f.t * 2);
      ctx.fillStyle = f.col;
      ctx.strokeText(f.text, f.x * TILE - cx, f.y * TILE - cy);
      ctx.fillText(f.text, f.x * TILE - cx, f.y * TILE - cy);
    }
    ctx.globalAlpha = 1;

    // Red flash when hurt
    if (hurtFlash > 0) {
      ctx.fillStyle = `rgba(200,30,30,${(hurtFlash * 0.8).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Small gold + that replaces the mouse pointer over the world.
  function drawCrosshair(x, y) {
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20,16,8,0.75)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#e8b83a';
    ctx.fill();
  }

  // Darkness: one pixel per tile, scaled up with smoothing so light fades softly across tiles.
  let shadeCanvas = null, shadeCtx = null, shadeImg = null;
  function drawShade(x0, y0, x1, y1, cx, cy) {
    const lw = x1 - x0 + 3, lh = y1 - y0 + 3; // one tile of margin on each side
    if (!shadeCanvas || shadeCanvas.width !== lw || shadeCanvas.height !== lh) {
      shadeCanvas = document.createElement('canvas');
      shadeCanvas.width = lw; shadeCanvas.height = lh;
      shadeCtx = shadeCanvas.getContext('2d');
      shadeImg = shadeCtx.createImageData(lw, lh);
    }
    const d = shadeImg.data;
    for (let j = 0; j < lh; j++) for (let i = 0; i < lw; i++) {
      const tx = Math.max(0, Math.min(W - 1, x0 - 1 + i)), ty = y0 - 1 + j;
      const L = ty < 0 ? 15 : ty >= H ? 0 : light[idx(tx, ty)];
      const k = (j * lw + i) * 4;
      d[k] = 6; d[k + 1] = 8; d[k + 2] = 12;
      d[k + 3] = Math.round((1 - L / 15) * 0.9 * 255);
    }
    shadeCtx.putImageData(shadeImg, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(shadeCanvas, (x0 - 1) * TILE - cx, (y0 - 1) * TILE - cy, lw * TILE, lh * TILE);
    ctx.imageSmoothingEnabled = false;
  }

  // Warm, flickering glow around fires, drawn over the darkness. Campfires get animated flames.
  function drawFireGlow(x0, y0, x1, y1, cx, cy) {
    const now = performance.now() / 1000;
    ctx.globalCompositeOperation = 'lighter';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const b = tiles[idx(x, y)];
      if (b === B.GLOWCAP) {
        const gx = (x + 0.5) * TILE - cx, gy = (y + 0.6) * TILE - cy, r = 2.4 * TILE;
        const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
        glow.addColorStop(0, 'rgba(63,214,196,0.28)');
        glow.addColorStop(1, 'rgba(63,214,196,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
        continue;
      }
      if (b === B.VENDING) { // a full Irn Bru machine glows so it stands out in the dark
        const gx = (x + 0.5) * TILE - cx, gy = (y + 0.5) * TILE - cy, r = 2.6 * TILE;
        const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
        glow.addColorStop(0, 'rgba(255,140,50,0.35)');
        glow.addColorStop(0.5, 'rgba(60,120,220,0.12)');
        glow.addColorStop(1, 'rgba(60,120,220,0)');
        ctx.fillStyle = glow;
        ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
        continue;
      }
      if (b !== B.TORCH && b !== B.CAMPFIRE && b !== B.FURNACE) continue;
      const gx = (x + 0.5) * TILE - cx, gy = (y + (b === B.TORCH ? 0.25 : 0.6)) * TILE - cy;
      const flick = 1 + Math.sin(now * 9 + x * 3.1) * 0.05 + Math.sin(now * 23 + y) * 0.03;
      const r = (b === B.CAMPFIRE ? 3.2 : b === B.TORCH ? 2.4 : 1.8) * TILE * flick;
      const glow = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
      glow.addColorStop(0, 'rgba(255,170,80,0.32)');
      glow.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (tiles[idx(x, y)] !== B.CAMPFIRE) continue;
      const bx = x * TILE - cx, by = y * TILE - cy;
      for (let k = 0; k < 4; k++) {
        const fh = 8 + (Math.sin(now * 11 + k * 1.7 + x) + 1) * 5;
        const fx = bx + 9 + k * 4;
        ctx.fillStyle = k % 2 ? '#ff8a2b' : '#ffb347';
        ctx.fillRect(fx, by + 22 - fh, 4, fh);
        ctx.fillStyle = '#fff3b0';
        ctx.fillRect(fx + 1, by + 22 - fh * 0.5, 2, fh * 0.4);
      }
    }
  }

  // Weather particles: rain streaks, heavy ash, or rising heat motes. Screen space, so they cost little.
  const drops = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() }));
  function updateDrops(dt) {
    if (weather.k <= 0) return;
    const t = performance.now() / 700;
    for (const d of drops) {
      if (weather.shown === 'rain') { d.y += (1.3 + d.s) * dt; d.x += 0.1 * dt; }
      else if (weather.shown === 'ash') { d.y += (0.08 + d.s * 0.12) * dt; d.x += (0.05 + d.s * 0.05) * dt + Math.sin(t + d.s * 20) * 0.0008; }
      else { d.y -= (0.03 + d.s * 0.04) * dt; d.x += Math.sin(t + d.s * 20) * 0.0005; }
      if (d.y > 1) { d.y -= 1; d.x = Math.random(); }
      if (d.y < 0) { d.y += 1; d.x = Math.random(); }
      if (d.x > 1) d.x -= 1;
    }
  }
  function fog(x, y, r0, r1, rgb, a) {
    const g = ctx.createRadialGradient(x, y, r0 * TILE, x, y, r1 * TILE);
    g.addColorStop(0, `rgba(${rgb},0)`);
    g.addColorStop(1, `rgba(${rgb},${a.toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
  }
  function drawWeather() {
    const k = weather.k;
    if (k <= 0) return;
    const px = (player.x + player.w / 2) * TILE - camera.x, py = (player.y + player.h / 2) * TILE - camera.y;
    const col = Math.max(0, Math.min(W - 1, Math.floor(player.x + player.w / 2)));
    const deep = player.y > surface[col] + 3;
    const vis = deep ? 0.25 : outside ? 1 : 0.6; // less of the weather gets into caves and under roofs
    const kind = weather.shown;
    if (kind === 'ash') {
      fog(px, py, 3.5, 9.5, '58,52,46', 0.96 * k * vis);
      if (!deep) for (const d of drops) {
        ctx.fillStyle = `rgba(190,182,170,${((0.3 + d.s * 0.4) * k).toFixed(3)})`;
        ctx.fillRect(Math.round(d.x * viewW), Math.round(d.y * viewH), d.s > 0.6 ? 3 : 2, d.s > 0.6 ? 3 : 2);
      }
    } else if (kind === 'rain') {
      ctx.fillStyle = `rgba(28,38,52,${(0.22 * k * vis).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
      fog(px, py, 6, 14, '60,72,86', 0.6 * k * vis);
      if (!deep) {
        ctx.strokeStyle = `rgba(175,195,215,${(0.45 * k).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const d of drops) {
          const x = d.x * viewW, y = d.y * viewH, len = 10 + d.s * 10;
          ctx.moveTo(x, y); ctx.lineTo(x + len * 0.12, y + len);
        }
        ctx.stroke();
      }
    } else if (kind === 'heat') {
      ctx.fillStyle = `rgba(255,140,50,${(0.1 * k).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
      if (outside && !deep) {
        // Heat haze: redraw the screen in thin strips, each nudged sideways by a slow wave.
        const t = performance.now() / 1000, strip = 6 * dpr;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (let y = 0; y < canvas.height; y += strip) {
          const off = Math.sin(y / (40 * dpr) + t * 3) * 1.6 * dpr * k;
          ctx.drawImage(canvas, 0, y, canvas.width, strip, off, y, canvas.width, strip);
        }
        ctx.restore();
        for (const d of drops) {
          ctx.fillStyle = `rgba(255,220,170,${(0.12 + d.s * 0.18) * k})`;
          ctx.fillRect(Math.round(d.x * viewW), Math.round(d.y * viewH), 2, 2);
        }
      }
    }
  }

  // Ash drifting through the air on the surface.
  const ash = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), s: Math.random() }));
  function updateAsh(dt) {
    for (const a of ash) {
      a.x += (0.012 + a.s * 0.02) * dt + Math.sin(performance.now() / 900 + a.s * 10) * 0.0004;
      a.y += (0.02 + a.s * 0.03) * dt;
      if (a.x > 1) a.x -= 1;
      if (a.y > 1) { a.y -= 1; a.x = Math.random(); }
    }
  }
  function drawAsh() {
    const col = Math.max(0, Math.min(W - 1, Math.floor(player.x + player.w / 2)));
    if (player.y > surface[col] + 3) return; // none underground, even in lit caves
    const L = light[idx(col, Math.max(0, Math.floor(player.y)))] / 15;
    if (L <= 0.2) return;
    for (const a of ash) {
      ctx.fillStyle = `rgba(225,215,200,${(0.25 + a.s * 0.35) * L})`;
      const size = a.s > 0.7 ? 3 : 2;
      ctx.fillRect(Math.round(a.x * viewW), Math.round(a.y * viewH), size, size);
    }
  }

  function drawCracks(sx, sy, f) {
    const stage = Math.ceil(f * 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const segs = [
      [[16, 16], [8, 6]], [[16, 16], [26, 10]], [[16, 16], [12, 28]],
      [[16, 16], [28, 24]], [[8, 6], [3, 12]], [[26, 10], [30, 3]],
      [[12, 28], [4, 22]], [[28, 24], [22, 30]], [[16, 16], [18, 2]], [[16, 16], [3, 17]],
    ];
    for (let i = 0; i < stage * 2; i++) {
      const [[a, b], [c, d]] = segs[i];
      ctx.moveTo(sx + a, sy + b); ctx.lineTo(sx + c, sy + d);
    }
    ctx.stroke();
  }

  // ---------- Sprites ----------
  // Sprites are painted facing right onto a scratch canvas, with the origin at their top centre,
  // then stamped onto the screen with a 1px dark outline (and a white flash when hit).
  const SPR = 112, SPR_OX = 56, SPR_OY = 30;
  const sprCanvas = document.createElement('canvas'), tintCanvas = document.createElement('canvas');
  sprCanvas.width = sprCanvas.height = tintCanvas.width = tintCanvas.height = SPR;
  const sctx = sprCanvas.getContext('2d'), tctx = tintCanvas.getContext('2d');
  function tint(col) {
    tctx.globalCompositeOperation = 'source-over';
    tctx.clearRect(0, 0, SPR, SPR);
    tctx.drawImage(sprCanvas, 0, 0);
    tctx.globalCompositeOperation = 'source-in';
    tctx.fillStyle = col;
    tctx.fillRect(0, 0, SPR, SPR);
  }
  function drawSprite(x, y, face, flash, paint) {
    sctx.setTransform(1, 0, 0, 1, 0, 0);
    sctx.clearRect(0, 0, SPR, SPR);
    sctx.imageSmoothingEnabled = false;
    sctx.translate(SPR_OX, SPR_OY);
    if (face < 0) sctx.scale(-1, 1);
    paint(sctx);
    tint('rgba(14,11,9,0.9)');
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(tintCanvas, x - SPR_OX + dx, y - SPR_OY + dy);
    ctx.drawImage(sprCanvas, x - SPR_OX, y - SPR_OY);
    if (flash > 0) {
      tint('rgba(255,255,255,0.7)');
      ctx.drawImage(tintCanvas, x - SPR_OX, y - SPR_OY);
    }
  }
  function groundShadow(x, footY, rx) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(x, footY, rx, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Shorthand for filling pixel rectangles on the sprite canvas.
  const R = (g, col, x, y, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };

  function drawEnemy(e, cx, cy) {
    const x = Math.round(e.x * TILE - cx), y = Math.round(e.y * TILE - cy);
    const w = Math.round(e.w * TILE), h = Math.round(e.h * TILE);
    const now = performance.now();
    const moving = e.onGround && Math.abs(e.vx) > 0.2;
    const step = moving ? Math.sin(now / 70) * 2 : 0;
    if (e.onGround) groundShadow(x + w / 2, y + h, w / 2 + 2);
    drawSprite(x + w / 2, y, e.face, e.flash, g => {
      if (e.type === 'rat') paintRat(g, w, h, step, now);
      else if (e.type === 'crawler') paintCrawler(g, w, h, step, now, e);
      else if (e.type === 'haggis') paintHaggis(g, w, h, step, now, e);
      else paintGhoul(g, w, h, step, now);
    });
    if (e.hp < e.max && !ENEMY[e.type].boss) {
      ctx.fillStyle = 'rgba(10,8,6,0.8)';
      ctx.fillRect(x + w / 2 - 13, y - 9, 26, 5);
      ctx.fillStyle = '#e2566b';
      ctx.fillRect(x + w / 2 - 12, y - 8, 24 * Math.max(0, e.hp) / e.max, 3);
    }
  }

  function paintRat(g, w, h, step, now) {
    const FUR = '#5e5047', DARK = '#463a33', LIGHT = '#7a6a5e', BELLY = '#8a7a6c', PINK = '#d98a9a';
    const L = -w / 2, head = w / 2 - 11;
    // tail: a pink curl that waves
    for (let i = 0; i < 9; i++) {
      const ty = h - 7 - Math.sin(now / 160 + i * 0.7) * i * 0.35 - i * 0.5;
      R(g, i < 4 ? PINK : '#c47584', L - 1 - i * 1.6, Math.round(ty), 2, i < 5 ? 2 : 1);
    }
    // legs
    R(g, DARK, L + 3 + step, h - 5, 3, 5); R(g, DARK, head - 3 - step, h - 5, 3, 5);
    R(g, PINK, L + 3 + step, h - 1, 4, 1); R(g, PINK, head - 3 - step, h - 1, 4, 1);
    // body, rounded
    R(g, FUR, L + 3, 5, head - L - 3, 1);
    R(g, FUR, L + 1, 6, head - L + 1, h - 11);
    R(g, FUR, L + 2, h - 5, head - L - 1, 1);
    R(g, LIGHT, L + 4, 6, head - L - 8, 2);
    R(g, BELLY, L + 5, h - 7, head - L - 6, 2);
    for (let i = 0; i < 5; i++) R(g, DARK, L + 4 + i * 4, 4 + (i % 2), 1, 2); // mutant spines
    for (let i = 0; i < 6; i++) R(g, DARK, L + 3 + i * 3, 9 + (i % 3), 1, 1);  // fur texture
    // head and snout
    R(g, FUR, head - 1, 4, 9, 9);
    R(g, FUR, head + 8, 6, 3, 5);
    R(g, LIGHT, head, 4, 6, 1);
    R(g, DARK, head - 1, 11, 9, 2);
    R(g, PINK, head + 11, 7, 2, 2);                   // nose
    R(g, '#f4efe6', head + 9, 11, 1, 2);               // teeth
    R(g, PINK, head + 1, 1, 4, 4); R(g, '#a85f6d', head + 2, 2, 2, 2); // ear
    R(g, '#ff3b3b', head + 5, 6, 2, 2); R(g, '#ffc0c0', head + 5, 6, 1, 1); // glowing eye
    g.fillStyle = 'rgba(220,210,200,0.6)';             // whiskers
    g.fillRect(head + 10, 9, 5, 1); g.fillRect(head + 9, 11, 5, 1);
  }

  // The Mutant Haggis: a huge shaggy lump on stubby legs (shorter on one side, as every Scot knows),
  // three angry eyes, tusks, and a tartan scrap round its neck.
  function paintHaggis(g, w, h, step, now, e) {
    const FUR = '#6b4a2e', FUR_DK = '#4e341f', FUR_HI = '#8a6440', SKIN = '#c98f68';
    const L = -w / 2, breathe = Math.round(Math.sin(now / 300));
    // legs: back ones shorter
    R(g, FUR_DK, L + 10 + step, h - 12, 7, 12); R(g, FUR_DK, w / 2 - 22 - step, h - 8, 7, 8);
    R(g, '#2a1c12', L + 9 + step, h - 2, 9, 2); R(g, '#2a1c12', w / 2 - 23 - step, h - 2, 9, 2);
    // body: layered shaggy lump
    R(g, FUR, L + 4, 12 - breathe, w - 8, h - 24 + breathe);
    R(g, FUR, L + 10, 6 - breathe, w - 22, 8);
    R(g, FUR, L + 1, 20, w - 2, h - 38);
    R(g, FUR_HI, L + 12, 8 - breathe, w - 30, 3);
    for (let i = 0; i < 16; i++) R(g, i % 2 ? FUR_DK : FUR_HI, L + 6 + i * 5, 14 + (i * 7) % (h - 34), 2, 5); // fur strands
    R(g, FUR_DK, L + 4, h - 14, w - 8, 3);
    // tartan scarf
    R(g, '#b3263a', w / 2 - 34, 22, 20, 7);
    R(g, '#1f5fae', w / 2 - 30, 22, 2, 7); R(g, '#1f5fae', w / 2 - 22, 22, 2, 7); R(g, '#2a6a3a', w / 2 - 34, 25, 20, 1);
    // face at the front
    R(g, FUR, w / 2 - 16, 10, 16, 22);
    R(g, SKIN, w / 2 - 6, 18, 8, 8);                                                    // snout
    R(g, '#1a1210', w / 2 - 5, 27, 9, 3 + (e.charging > 0 ? 2 : 0));                  // mouth
    R(g, '#f4efe6', w / 2 - 5, 26, 2, 4); R(g, '#f4efe6', w / 2 + 1, 26, 2, 4);       // tusks
    const glow = e.enraged ? '#ff3b3b' : '#e8b83a';
    for (const [ex, ey] of [[-12, 12], [-6, 10], [-9, 16]]) { R(g, '#1a1210', w / 2 + ex - 1, ey - 1, 5, 5); R(g, glow, w / 2 + ex, ey, 3, 3); } // three eyes
  }

  function paintGhoul(g, w, h, step, now) {
    const SKIN = '#9fb58a', SKIN_SH = '#7f9570', SKIN_DK = '#62744f';
    const CLOTH = '#4a3b2e', CLOTH_DK = '#33281f', PANTS = '#3a3230';
    const sway = Math.sin(now / 300) * 1.5;
    // back arm, reaching
    R(g, SKIN_DK, 2, 19 + sway, 13, 3); R(g, SKIN_DK, 15, 18 + sway, 3, 1); R(g, SKIN_DK, 15, 21 + sway, 3, 1);
    // legs: one trouser leg torn away
    R(g, PANTS, -7 + step, h - 19, 6, 17); R(g, '#2a2422', -7 + step, h - 19, 2, 17);
    R(g, PANTS, 1 - step, h - 19, 6, 9); R(g, SKIN_SH, 1 - step, h - 10, 6, 8);
    R(g, '#2e2a26', -8 + step, h - 3, 8, 3); R(g, '#2e2a26', 0 - step, h - 3, 8, 3);
    // torso: torn shirt with ribs showing through
    R(g, CLOTH, -8, 17, 16, h - 35);
    R(g, CLOTH_DK, -8, 17, 3, h - 35);
    R(g, SKIN, 0, 22, 6, 8);
    for (let i = 0; i < 3; i++) R(g, SKIN_DK, 0, 23 + i * 3, 6, 1);
    R(g, CLOTH_DK, -3, h - 20, 2, 2); R(g, CLOTH_DK, 3, h - 21, 3, 1);
    for (let i = 0; i < 4; i++) R(g, CLOTH, -8 + i * 4, h - 18, 2, 2 + (i % 2)); // ragged hem
    // head, pushed forward with a hunch
    R(g, SKIN_SH, -1, 15, 5, 3);                        // neck
    R(g, SKIN, -5, 2, 14, 14); R(g, SKIN, -4, 1, 12, 1);
    R(g, SKIN_SH, -5, 2, 3, 14);
    R(g, '#2e2a26', -4, 1, 2, 3); R(g, '#2e2a26', 1, 0, 1, 3); R(g, '#2e2a26', 4, 1, 1, 2); // patchy hair
    R(g, SKIN_DK, 4, 6, 5, 3);                          // sunken eye socket
    R(g, '#e8ff7a', 5, 7, 3, 1); R(g, '#fbffd0', 6, 7, 1, 1); // glowing eye
    R(g, '#1e1a16', 3, 12, 6, 3);                       // open jaw
    R(g, '#e8e2c8', 4, 12, 1, 1); R(g, '#e8e2c8', 7, 12, 1, 1);
    R(g, SKIN_SH, 9, 9, 1, 2);                          // nose stub
    // front arm, reaching, with long fingers
    R(g, SKIN, 3, 21 - sway, 14, 3); R(g, SKIN_SH, 3, 23 - sway, 14, 1);
    R(g, SKIN, 17, 20 - sway, 4, 1); R(g, SKIN, 17, 22 - sway, 4, 1); R(g, SKIN, 17, 24 - sway, 3, 1);
  }

  function paintCrawler(g, w, h, step, now, e) {
    const SK = '#ddd8cc', SH = '#aaa396', DK = '#7f786c', HI = '#f2efe6';
    const L = -w / 2, jaw = e.fleeing ? 0 : (Math.sin(now / 120) + 1) * 1.2;
    // far limbs (darker)
    R(g, DK, L + 2 - step, h - 13, 3, 6); R(g, DK, L + 4 - step, h - 8, 3, 8);   // back leg
    R(g, DK, w / 2 - 7 + step, h - 16, 3, 16);                                   // front arm
    // body: arched back with a bony spine
    R(g, SK, L, h - 22, w - 5, 10);
    R(g, SK, L + 3, h - 26, w - 12, 4);
    R(g, HI, L + 4, h - 26, w - 14, 1);
    for (let i = 0; i < 5; i++) R(g, SH, L + 4 + i * 3, h - 27, 2, 2);         // vertebrae
    for (let i = 0; i < 4; i++) R(g, SH, L + 8 + i * 3, h - 19, 1, 6);         // ribs
    R(g, SH, L, h - 13, w - 5, 1);
    // head: low and forward, eyeless
    R(g, SK, w / 2 - 9, h - 31, 11, 10); R(g, SK, w / 2 - 8, h - 32, 8, 1);
    R(g, HI, w / 2 - 7, h - 31, 5, 1);
    R(g, SH, w / 2 - 9, h - 31, 2, 10);
    R(g, '#0c0b0a', w / 2 - 2, h - 28, 3, 3);                                    // empty eye socket
    R(g, '#0c0b0a', w / 2 - 3, h - 23 + jaw * 0.3, 6, 1 + jaw);                  // gaping mouth
    R(g, '#e8e2c8', w / 2 - 2, h - 23, 1, 1); R(g, '#e8e2c8', w / 2 + 1, h - 23, 1, 1);
    // near limbs: bent hind leg and a long clawed arm
    R(g, SK, L + 5 + step, h - 14, 3, 6); R(g, SK, L + 3 + step, h - 8, 3, 8);
    R(g, SK, w / 2 - 3 - step, h - 17, 3, 17);
    R(g, SH, w / 2 - 3 - step, h - 17, 1, 17);
    R(g, '#2a2622', w / 2 - step, h - 1, 3, 1); R(g, '#2a2622', L + 2 + step, h - 1, 3, 1); // claws
  }

  function drawPlayer(cx, cy) {
    const px = Math.round(player.x * TILE - cx), py = Math.round(player.y * TILE - cy);
    const w = Math.round(player.w * TILE), h = Math.round(player.h * TILE);
    if (player.onGround) groundShadow(px + w / 2, py + h, w / 2 + 3);
    if (iframes > 0 && Math.floor(performance.now() / 80) % 2) return; // blink after being hit
    const now = performance.now();
    const swing = Math.sin(player.walk) * 4;
    const idle = !player.walk && player.onGround;
    const bob = idle ? Math.round((Math.sin(now / 600) + 1) / 2) : 0; // breathing
    const blink = now % 3600 < 130;
    const armRot = -0.3 + (mining.t > 0 ? Math.sin(now / 60) * 0.6 : player.swing > 0 ? -1.2 + player.swing * 8 : 0) - swing * 0.03;
    const tapsAff = heatOn(); // heatwave in the open: overalls rolled down to the waist
    const shieldOn = shieldUp();
    drawSprite(px + w / 2, py, player.face, 0, g => {
      const SKIN = '#f0c6a0', SKIN_SH = '#d9a57e', SKIN_DK = '#c08a64', SKIN_HI = '#fbe0c6';
      // Bunker-issue work gear: orange bib overalls with grey straps and panels over a grey shirt
      const OR = '#e0772a', OR_SH = '#b85a1c', OR_DK = '#9a4a16', OR_HI = '#f39a4e';
      const GREY = '#8a9096', GREY_SH = '#6a7076', GREY_DK = '#4a5056', GREY_HI = '#b4babf';
      const BEARD = '#c8622a', BEARD_SH = '#a44e1f', BEARD_HI = '#e07a3a';
      // back arm swings opposite the legs
      g.save();
      g.translate(-3, 20 + bob);
      g.rotate(0.25 + swing * 0.06);
      R(g, SKIN_SH, -2, 5, 5, 9); R(g, SKIN_DK, -2, 12, 5, 3);
      if (!tapsAff) R(g, GREY_SH, -2, 0, 5, 5);             // short grey sleeve
      g.restore();
      if (shieldOn) { // Irn Bru Shield on the far arm, poking out behind Tam
        R(g, '#e0772a', -15, 18 + bob, 10, 15); R(g, '#b85a1c', -15, 18 + bob, 2, 15);
        R(g, '#1f5fae', -15, 23 + bob, 10, 4); R(g, '#f4efe6', -13, 24 + bob, 6, 1);
        R(g, '#f39a4e', -13, 18 + bob, 6, 1); R(g, '#8b8d93', -11, 20 + bob, 2, 2);
      }
      // legs: back leg darker
      const legs = [[1 - swing * 0.5, true], [-7 + swing * 0.5, false]];
      for (const [lx, back] of legs) {
        R(g, back ? OR_SH : OR, lx, h - 20, 7, 16);          // overall leg
        R(g, back ? OR_DK : OR_SH, lx, h - 20, 1, 16);
        if (!back) R(g, OR_HI, lx + 5, h - 19, 1, 12);
        R(g, back ? GREY_SH : GREY, lx, h - 13, 7, 3);        // grey knee panel
        R(g, back ? GREY_DK : GREY_HI, lx, h - 8, 7, 1);     // reflective stripe at the ankle
        R(g, '#0e0e10', lx, h - 5, 9, 4);                  // trainer
        R(g, '#34343c', lx + 2, h - 5, 4, 1);              // laces
        R(g, '#e8e8e8', lx, h - 1, 9, 1);                  // white sole
      }
      if (tapsAff) {
        // taps aff: bare chest and a wee belly, overalls rolled down and tied at the waist
        R(g, SKIN, -8, 17 + bob, 16, h - 38 - bob);
        R(g, SKIN_SH, -8, 17 + bob, 2, h - 38 - bob);
        R(g, SKIN_HI, 3, 19 + bob, 3, 3);
        R(g, SKIN_SH, 0, 22 + bob, 5, 1);                   // chest line
        R(g, SKIN, 6, h - 27, 3, 5); R(g, SKIN_SH, 7, h - 23, 2, 1); // belly
        R(g, '#b5561f', 2, 25 + bob, 1, 1); R(g, '#b5561f', 4, 26 + bob, 1, 1); // ginger chest hair
        R(g, OR, -8, h - 22, 16, 3); R(g, OR_SH, -8, h - 20, 16, 1);
        R(g, OR_DK, 5, h - 22, 3, 6);                       // tied sleeve hanging down
      } else {
      // torso: grey shirt, orange bib, grey straps with buttons, and a grey chest pocket
      R(g, GREY, -8, 17 + bob, 16, 6);
      R(g, GREY_SH, -8, 17 + bob, 2, 6);
      R(g, OR, -8, 22 + bob, 16, h - 40 - bob);
      R(g, OR_SH, -8, 22 + bob, 2, h - 40 - bob);
      R(g, OR_HI, 5, 23 + bob, 1, h - 43 - bob);
      R(g, OR, -7, 19 + bob, 13, 4);                        // bib top
      R(g, GREY_DK, -6, 17 + bob, 2, 5); R(g, GREY_DK, 3, 17 + bob, 2, 5); // straps
      R(g, '#d8dde2', -6, 21 + bob, 2, 1); R(g, '#d8dde2', 3, 21 + bob, 2, 1); // buttons
      R(g, GREY, -2, 23 + bob, 6, 5); R(g, GREY_DK, -2, 23 + bob, 6, 1); // pocket
      R(g, OR_DK, -8, h - 21, 16, 1);                       // waist seam
      R(g, SKIN_SH, -1, 17 + bob, 3, 1);                    // collar opening
      }
      // neck
      R(g, SKIN_SH, -2, 15 + bob, 6, 3);
      // head: bald and round, lit from the front
      const hy = bob;
      R(g, SKIN, -6, hy, 12, 1); R(g, SKIN, -7, 1 + hy, 14, 15); R(g, SKIN, -6, 16 + hy, 12, 1);
      R(g, SKIN_SH, -7, 2 + hy, 2, 13);                   // back of the head in shadow
      R(g, SKIN_HI, -2, 1 + hy, 5, 2); R(g, '#fff1e2', -1, 1 + hy, 2, 1); // scalp shine
      R(g, SKIN_DK, -4, 7 + hy, 3, 5); R(g, SKIN_SH, -3, 8 + hy, 1, 3);   // ear
      R(g, SKIN, 7, 8 + hy, 1, 3);                        // nose
      // eye and ginger eyebrow
      if (blink) R(g, SKIN_DK, 3, 9 + hy, 3, 1);
      else { R(g, '#f4efe6', 3, 8 + hy, 3, 2); R(g, '#2a1c14', 5, 8 + hy, 1, 2); }
      R(g, BEARD_SH, 2, 6 + hy, 5, 1);
      // small ginger beard along the jaw, with texture
      R(g, BEARD, -3, 13 + hy, 11, 3); R(g, BEARD, 0, 16 + hy, 7, 2); R(g, BEARD, 3, 12 + hy, 5, 1);
      R(g, BEARD_SH, 1, 17 + hy, 5, 1); R(g, BEARD_SH, -3, 15 + hy, 3, 1);
      for (const [bx, by] of [[-1, 13], [2, 14], [5, 13], [3, 16], [6, 15]]) R(g, BEARD_HI, bx, by + hy, 1, 1);
      R(g, '#6e2c10', 4, 14 + hy, 3, 1);                  // mouth
      // front arm, swinging while mining or fighting, holding the selected item
      g.save();
      g.translate(0, 20 + bob);
      g.rotate(armRot);
      R(g, SKIN, -2, 5, 5, 11); R(g, SKIN_SH, -2, 5, 1, 11); R(g, SKIN_HI, 2, 6, 1, 5);
      if (tapsAff) { R(g, SKIN, -2, 0, 5, 5); R(g, SKIN_SH, -2, 0, 1, 5); }
      else { R(g, GREY, -2, 0, 5, 5); R(g, GREY_SH, -2, 0, 1, 5); R(g, GREY_DK, -2, 5, 5, 1); } // sleeve
      R(g, SKIN_SH, -2, 13, 5, 3);
      const it = held();
      if (it) g.drawImage(ICON_HAND[it.id], -1, 7, 16, 16);
      g.restore();
    });
  }

  // ---------- UI ----------
  const hotbarEl = document.getElementById('hotbar');
  const invEl = document.getElementById('inv');
  const invGridEl = document.getElementById('inv-grid');
  const recipesEl = document.getElementById('recipes');
  const stationsEl = document.getElementById('stations');
  const helpEl = document.getElementById('help');
  const goalEl = document.getElementById('goal-text');
  const toastEl = document.getElementById('toast');
  const healthEl = document.getElementById('health');
  const staminaEl = document.getElementById('stamina');
  const staminaFill = document.getElementById('stamina-fill');
  const staminaText = document.getElementById('stamina-text');
  let shownSt = -1, shownFood = -1, shownWeather = '';
  const weatherText = document.getElementById('weather-text'), weatherRow = document.getElementById('weather-row');
  const mmss = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const bossBarEl = document.getElementById('bossbar'), bossFill = document.getElementById('boss-fill');
  document.getElementById('victory-go').addEventListener('click', () => { document.getElementById('victory').hidden = true; });
  const buffRow = document.getElementById('buff-row'), buffText = document.getElementById('buff-text');
  let shownBuff = '';
  function drawBuffChip() {
    const text = bruT > 0 ? `Bru Rush · ${Math.ceil(bruT)}s` : '';
    if (text === shownBuff) return;
    shownBuff = text;
    buffRow.hidden = !text;
    buffText.textContent = text;
    staminaEl.classList.toggle('bru', !!text);
    if (!text) uiDirty = true;
  }
  function drawWeatherChip() {
    let text, cls = weather.kind;
    if (weather.kind === 'clear') {
      text = weather.warned ? `Clear · ${WEATHER[weather.next].name} in ${Math.ceil(Math.max(0, weather.t))}s` : 'Clear';
      if (weather.warned) cls = 'warn';
    } else {
      text = `${WEATHER[weather.kind].name} · ${mmss(Math.max(0, weather.t))}`;
      if (weather.kind === 'ash' && outside) text += ' · take cover!';
      if (weather.kind === 'heat' && outside) text += ' · in the sun';
    }
    if (text === shownWeather) return;
    shownWeather = text;
    weatherText.textContent = text;
    weatherRow.dataset.kind = cls;
  }
  const foodEl = document.getElementById('hunger');
  const foodFill = document.getElementById('hunger-fill');
  const foodText = document.getElementById('hunger-text');
  function drawFoodBar() {
    const v = Math.ceil(player.food);
    if (v === shownFood) return;
    shownFood = v;
    foodFill.style.width = `${player.food}%`;
    foodFill.classList.toggle('low', v <= 20);
    foodText.textContent = `${v} / ${MAX_FOOD}`;
    foodEl.setAttribute('aria-valuenow', v);
  }
  // Stamina changes every frame, so its bar is updated on its own instead of re-rendering the whole HUD.
  function drawStaminaBar() {
    const v = Math.round(player.st);
    if (v === shownSt) return;
    shownSt = v;
    staminaFill.style.width = `${player.st}%`;
    staminaText.textContent = `${v} / ${MAX_ST}`;
    staminaEl.setAttribute('aria-valuenow', v);
  }

  // Random hints beside the goal. They change every 15 seconds, or when clicked.
  const TIPS = [
    'Hatchets chop wood fastest. Pickaxes are best on stone and ore. Use the right tool, ya numpty.',
    'Oak drops two logs a block, but ye need a Stone Hatchet or ye\'ll be there aw day.',
    "Peely-Wallies are feart o' fire. Carry a torch doon the caves. Carry three.",
    'Build a Wee Fire near yer base. It cooks yer scran an\' keeps the Peely-Wallies away.',
    'Supply chests usually hold the next tier o\' gear up fae whit ye\'ve got.',
    "Walkin' is free. Jumpin', swingin' an' fightin' use stamina.",
    "Knackered? Staun still a wee minute an' yer stamina comes back.",
    'Break bushes an\' leaves for fibre. Sometimes ye get Wee Berries as a bonus.',
    'Two fibre make a string. Two string make a rope. Simple as.',
    'Scrap metal fae the ruins melts doon intae iron: 3 scrap an\' 1 coal at a Furnace.',
    'A Big Plaster heals 30. Just string an\' fibre. Nae excuses.',
    'A Rat Piece heals 25 an\' fills ye up. Cook the rat first, trust me.',
    "Raw meat fills ye a wee bit but ye'll be boakin'. Cook it on a Wee Fire.",
    "Hunger goes doon slow. Rat Pieces fill ye up way mair than berries.",
    "Mutants only chase ye if they can see ye. Duck behind a wall an' they lose interest.",
    'Fallin\' mair than 4 blocks is sore. Build ladders like a sensible person.',
    "Bows fire yer best arrows first. Iron arrows hit the hardest.",
    'Ash Cloud? Get under a roof or doon a hole. That stuff\'s murder on yer lungs.',
    "Heavy Dreich puts oot fires left in the open. Build a roof over them.",
    'Heavy Dreich grows bushes an\' trees back. Every cloud, eh?',
    "Taps Aff heatwave: stay in the shade or ye'll be starvin' an' puggled.",
    'Wee Davie radios in before the weather turns. Listen tae the man.',
    'Iron ore is deep doon an\' needs a stone tool or better.',
    'Ruins often hide a supply chest behind the broken walls.',
    'Press E for yer inventory an\' crafting.',
    "There's a Mutant Haggis sleepin' at the bottom o' the world. Pipe it oot when ye're ready.",
    'The Irn Bru Shield only goes up when ye hold the Claymore.',
    "Press Q tae quick heal wi' whatever ye've got. F uses whit ye're holdin' or pointin' at.",
    "Rumour has it there's Irn Bru machines deep underground. Worth the dig.",
    'A can o\' Irn Bru gives ye unlimited stamina an\' 50 extra health for a minute.',
    "Peely-Wallies hide just below where the daylight stops. They'll no come oot intae the light.",
  ];
  const tipLine = document.getElementById('tip-line');
  let tipIndex = Math.floor(Math.random() * TIPS.length), tipTimer = 0;
  function nextTip() {
    let n;
    do n = Math.floor(Math.random() * TIPS.length); while (n === tipIndex && TIPS.length > 1);
    tipIndex = n;
    tipLine.classList.add('fade');
    setTimeout(() => { tipLine.textContent = TIPS[tipIndex]; tipLine.classList.remove('fade'); }, 350);
    clearInterval(tipTimer);
    tipTimer = setInterval(nextTip, 15000);
  }
  tipLine.textContent = TIPS[tipIndex];
  tipTimer = setInterval(nextTip, 15000);
  document.getElementById('tips').addEventListener('click', nextTip);
  const tabsEl = document.getElementById('craft-tabs');
  const tipEl = document.getElementById('tip');
  let craftFilter = 'All', highlightRecipe = null, tipCooldown = 0;
  const healthFill = document.getElementById('health-fill');
  const healthText = document.getElementById('health-text');
  let uiDirty = true, pickSlot = null, toastTimer = 0, lastStationKey = '';

  function toast(msg, ms = 2200) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
  }

  function slotEl(i, withKey) {
    const it = inv[i];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'slot';
    el.dataset.slot = i;
    el.addEventListener('pointerdown', e => startDrag(e, i));
    if (it) {
      el.style.backgroundImage = `url(${ICON_URL[it.id]})`;
      const d = describe(it.id);
      el.title = `${ITEM[it.id].name} · ${ITEM[it.id].cat}${d ? '\n' + d : ''}`;
      const c = document.createElement('span');
      c.className = `cat cat-${ITEM[it.id].cat.toLowerCase()}`;
      el.append(c);
      el.setAttribute('aria-label', `${ITEM[it.id].name} × ${it.n}`);
      if (it.n > 1) { const n = document.createElement('span'); n.className = 'n'; n.textContent = it.n; el.append(n); }
    } else el.setAttribute('aria-label', 'Empty slot');
    if (withKey) { const k = document.createElement('span'); k.className = 'k'; k.textContent = i + 1; el.append(k); }
    return el;
  }

  function renderHotbar() {
    hotbarEl.replaceChildren();
    for (let i = 0; i < 9; i++) {
      const el = slotEl(i, true);
      if (i === selected) el.classList.add('sel');
      el.addEventListener('click', () => { if (!eatClick()) { selected = i; uiDirty = true; } });
      hotbarEl.append(el);
    }
  }

  function renderInventory() {
    invGridEl.replaceChildren();
    for (let i = 0; i < INV_SIZE; i++) {
      const el = slotEl(i, false);
      if (i === pickSlot) el.classList.add('pick');
      else if (i === selected) el.classList.add('sel');
      el.addEventListener('click', () => { if (!eatClick()) clickSlot(i); });
      invGridEl.append(el);
    }
    const hunt = document.getElementById('hunt-list');
    hunt.replaceChildren(...ENDGAME.map(g => {
      const li = document.createElement('li');
      if (endgameDone(g)) li.className = 'done';
      li.textContent = g.text;
      return li;
    }));
    const st = nearStations();
    lastStationKey = Object.keys(st).join();
    stationsEl.textContent = `near: ${['bench', 'furnace', 'campfire'].filter(s => st[s]).map(s => ITEM[s].name).join(', ') || 'nothing'}`;
    tabsEl.replaceChildren();
    for (const c of ['All', ...CATS]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c;
      b.setAttribute('aria-pressed', String(craftFilter === c));
      b.addEventListener('click', () => { craftFilter = c; uiDirty = true; });
      tabsEl.append(b);
    }
    recipesEl.replaceChildren();
    // One row per item. Items with more than one recipe (Iron Ingot, Planks, Ladder) list each
    // option, and Craft uses the first one you have materials for.
    // Rows you can craft right now come first, then the rest grouped by category.
    const byCat = (a, b) => CATS.indexOf(ITEM[a.out].cat) - CATS.indexOf(ITEM[b.out].cat);
    const rows = [];
    for (const r of RECIPES) {
      if (craftFilter !== 'All' && ITEM[r.out].cat !== craftFilter) continue;
      let row = rows.find(x => x.out === r.out);
      if (!row) rows.push(row = { out: r.out, options: [] });
      row.options.push(r);
    }
    for (const row of rows) row.use = row.options.find(r => canCraft(r, st)) || null;
    const ready = rows.filter(r => r.use).sort(byCat);
    const later = rows.filter(r => !r.use).sort(byCat);
    const heading = (text, cls) => {
      const h = document.createElement('h4');
      h.className = `group ${cls}`;
      h.textContent = text;
      recipesEl.append(h);
    };
    const needsLine = (r, first) => {
      const needs = document.createElement('div');
      needs.className = 'needs';
      if (!first) { const o = document.createElement('span'); o.className = 'or'; o.textContent = 'or'; needs.append(o); }
      for (const [id, n] of Object.entries(r.needs)) {
        const s = document.createElement('span');
        const have = count(id);
        s.textContent = `${ITEM[id].name} ${Math.min(have, n)}/${n}`;
        if (have < n) s.className = 'miss';
        needs.append(s);
      }
      if (r.at) {
        const s = document.createElement('span');
        s.className = 'station' + (stationsFor(r).some(x => st[x]) ? '' : ' miss');
        s.textContent = `at ${stationsFor(r).map(x => ITEM[x].name).join(' or ')}`;
        needs.append(s);
      }
      return needs;
    };
    let lastGroup = null;
    for (const entry of [...ready, ...later]) {
      const ok = !!entry.use, r = entry.use || entry.options[0];
      const cat = ITEM[entry.out].cat;
      const group = ok ? 'ready' : craftFilter === 'All' ? cat : 'later';
      if (group !== lastGroup) {
        if (group === 'ready') heading('Ready to craft', 'ready');
        else if (group === 'later') { if (ready.length) heading('Need more materials', 'later'); }
        else heading(cat, `cat-${cat.toLowerCase()}`);
      }
      lastGroup = group;
      const row = document.createElement('div');
      row.className = 'recipe' + (ok ? ' ok' : '');
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.style.backgroundImage = `url(${ICON_URL[entry.out]})`;
      const mid = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = (r.n > 1 ? r.n + ' × ' : '') + ITEM[entry.out].name;
      if (entry.out === highlightRecipe) row.classList.add('focus');
      mid.append(name);
      const desc = describe(entry.out);
      if (desc) {
        const d = document.createElement('div');
        d.className = 'desc';
        d.textContent = desc;
        mid.append(d);
      }
      entry.options.forEach((o, i) => mid.append(needsLine(o, i === 0)));
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Craft';
      btn.disabled = !ok;
      btn.addEventListener('click', () => craft(r));
      row.append(icon, mid, btn);
      recipesEl.append(row);
    }
  }

  // Move the stack in slot `from` onto slot `to`: merge matching stacks, otherwise swap.
  function moveSlot(from, to) {
    if (from === to || !inv[from]) return;
    const a = inv[from], b = inv[to];
    if (b && a.id === b.id && b.n < stackOf(b.id)) {
      const k = Math.min(a.n, stackOf(b.id) - b.n);
      b.n += k; a.n -= k;
      if (!a.n) inv[from] = null;
    } else { inv[to] = a; inv[from] = b; }
    uiDirty = true;
  }
  // Click one slot, then another, to move or swap.
  function clickSlot(i) {
    if (pickSlot === null) {
      if (inv[i]) pickSlot = i;
    } else if (pickSlot === i) {
      pickSlot = null;
    } else {
      moveSlot(pickSlot, i);
      pickSlot = null;
    }
    uiDirty = true;
  }

  // Drag and drop between slots (inventory grid or hotbar). A press that doesn't move stays a click.
  let drag = null, skipClick = false;
  const eatClick = () => { if (!skipClick) return false; skipClick = false; return true; };
  function startDrag(e, i) {
    if (!inv[i] || e.button !== 0) return;
    drag = { from: i, x0: e.clientX, y0: e.clientY, ghost: null, src: e.currentTarget };
  }
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    if (!drag.ghost) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'drag-ghost';
      drag.ghost.style.backgroundImage = `url(${ICON_URL[inv[drag.from].id]})`;
      document.body.append(drag.ghost);
      drag.src.classList.add('dragging');
      pickSlot = null;
    }
    drag.ghost.style.transform = `translate(${e.clientX - 20}px, ${e.clientY - 20}px)`;
  });
  window.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.ghost) return; // just a click
    d.ghost.remove();
    d.src.classList.remove('dragging');
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-slot]');
    if (target && inv[d.from]) { moveSlot(d.from, +target.dataset.slot); sfx.click(); }
    skipClick = true;
    setTimeout(() => { skipClick = false; }, 0);
    uiDirty = true;
  });

  function showOakTip() {
    say('oak', { force: true });
    tipCooldown = 45;
    const axe = heldTool() && heldTool().tool === 'axe';
    document.getElementById('tip-text').textContent = axe
      ? 'Oak is tough. Your Wooden Hatchet will take a long time. A Stone Hatchet chops oak about 5x faster.'
      : 'Oak is tough and slow to chop by hand. Upgrade to a Stone Hatchet to chop oak about 5x faster.';
    tipEl.hidden = false;
    sfx.click();
  }
  document.getElementById('tip-close').addEventListener('click', () => { tipEl.hidden = true; });
  document.getElementById('tip-recipe').addEventListener('click', () => {
    tipEl.hidden = true;
    craftFilter = 'Equipment';
    highlightRecipe = 'stone_axe';
    toggleInv(true);
    requestAnimationFrame(() => document.querySelector('.recipe.focus')?.scrollIntoView({ block: 'center' }));
  });

  function toggleInv(force) {
    const open = force === undefined ? invEl.hidden : force;
    invEl.hidden = !open;
    pickSlot = null;
    if (!open) highlightRecipe = null;
    mouse.left = mouse.right = false;
    if (open) helpEl.hidden = true;
    uiDirty = true;
  }

  function renderUI() {
    renderHotbar();
    if (invOpen()) renderInventory();
    goalEl.textContent = currentGoal();
    healthFill.style.width = `${player.hp / maxHp() * 100}%`;
    healthFill.classList.toggle('bru', bruT > 0);
    healthFill.classList.toggle('low', player.hp <= 30);
    healthText.textContent = `${player.hp} / ${maxHp()}`;
    healthEl.setAttribute('aria-valuenow', player.hp);
    uiDirty = false;
  }

  document.getElementById('btn-inv').addEventListener('click', () => toggleInv());
  document.getElementById('btn-inv-close').addEventListener('click', () => toggleInv(false));
  invEl.addEventListener('pointerdown', e => { if (e.target === invEl) toggleInv(false); });
  document.getElementById('btn-help').addEventListener('click', () => { helpEl.hidden = !helpEl.hidden; });
  const soundBtn = document.getElementById('btn-sound');
  function showSound() {
    soundBtn.textContent = sfx.on ? 'Sound on' : 'Sound off';
    soundBtn.setAttribute('aria-pressed', String(sfx.on));
  }
  function toggleSound() {
    toast(sfx.toggle() ? 'Sound on' : 'Sound off');
    sfx.click();
    showSound();
  }
  soundBtn.addEventListener('click', toggleSound);
  showSound();
  document.getElementById('btn-help-close').addEventListener('click', () => { helpEl.hidden = true; });
  document.getElementById('btn-save').addEventListener('click', () => { toast(save() ? 'World saved' : 'Could not save in this browser'); });
  const newBtn = document.getElementById('btn-new');
  let newTimer = 0;
  newBtn.addEventListener('click', () => {
    if (!newBtn.classList.contains('confirm')) {
      newBtn.classList.add('confirm');
      newBtn.textContent = 'Replace world?';
      clearTimeout(newTimer);
      newTimer = setTimeout(() => { newBtn.classList.remove('confirm'); newBtn.textContent = 'New world'; }, 3000);
      return;
    }
    clearTimeout(newTimer);
    newBtn.classList.remove('confirm');
    newBtn.textContent = 'New world';
    newWorld();
    save();
    showStory(false);
  });

  // ---------- Key prompts ----------
  // Beside the crosshair: what the mouse buttons do right now.
  // Above the player: movement, ladders, crafting stations and other controls.
  // Each prompt hides for good once you've done that action 4 times.
  const PROMPTS_KEY = 'blockstead-prompts', PROMPT_LIMIT = 4;
  const promptEl = document.getElementById('prompt'), coachEl = document.getElementById('coach');
  let prompts = { on: true, count: {} };
  try { Object.assign(prompts, JSON.parse(localStorage.getItem(PROMPTS_KEY)) || {}); } catch { /* defaults */ }
  if (prompts.learned) { // older saves stored a yes/no per control
    for (const k in prompts.learned) if (prompts.learned[k]) prompts.count[k] = PROMPT_LIMIT;
    delete prompts.learned;
  }
  const savePrompts = () => { try { localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts)); } catch { /* not saved */ } };
  const knows = what => (prompts.count[what] || 0) >= PROMPT_LIMIT;
  function didAction(what) {
    if (knows(what)) return;
    prompts.count[what] = (prompts.count[what] || 0) + 1;
    savePrompts();
  }
  function togglePrompts() {
    prompts.on = !prompts.on;
    savePrompts();
    toast(prompts.on ? 'Key prompts on (K to hide)' : 'Key prompts off (K to show)');
  }
  const keycap = k => `<kbd>${k}</kbd>`;
  const promptHTML = list => list.map(([keys, label]) => `<span class="pr">${[].concat(keys).filter(Boolean).map(keycap).join('')}<span>${label}</span></span>`).join('');
  let lastPrompt = '', lastCoach = '', lastSpeech = '';
  const speechEl = document.getElementById('speech');

  function cursorPrompts() {
    const list = [];
    const it = held() && ITEM[held().id];
    const t = targetTile();
    const foe = enemyAtMouse();
    const noArrows = !ARROWS.some(a => count(a) > 0);
    if (it && it.bow) { if (!knows('shoot') || noArrows) list.push(['Left click', noArrows ? 'Shoot (no arrows)' : 'Shoot']); }
    else if (foe && reachOf(foe) <= MELEE_REACH) {
      if (!knows('attack')) list.push(['Left click', `Attack ${ENEMY[foe.type].name}`]);
    } else if (t.inReach) {
      const b = get(t.tx, t.ty);
      if (b === B.CHEST && t.visible && !knows('chest')) list.push(['Right click', 'Open chest']);
      if (b === B.VENDING && t.visible && !knows('vend')) list.push(['Right click', 'Get Irn Bru']);
      if (b !== B.AIR && b !== B.BEDROCK) {
        const chop = BLOCK[b].pref === 'axe';
        if (!t.visible) list.push(['', 'Something is in the way']);
        else if (!knows(chop ? 'chop' : 'mine')) list.push(['Left click', `${chop ? 'Chop' : 'Mine'} ${BLOCK[b].name}`]);
      } else if (b === B.AIR && it && it.block && hasSupport(t.tx, t.ty) && !knows('place')) list.push(['Right click', `Place ${it.name}`]);
    }
    if (it && it.pipes) list.push(['Right click', inLair() ? 'Play the Bagpipes' : 'Play the Bagpipes (in the lair)']);
    if (it && it.bru && !knows('eat')) list.push(['Right click', 'Drink Irn Bru']);
    else if (it && (it.heal || it.food) && !knows('eat')) list.push(['Right click', it.id === 'bandage' ? 'Use Big Plaster' : `Eat ${it.name}`]);
    return list.slice(0, 2);
  }
  function coachPrompts() {
    if (!knows('quickheal') && player.hp < maxHp() * 0.6 && inv.some(it => it && ITEM[it.id].heal && !ITEM[it.id].sick)) return [[['Q'], 'Quick heal']];
    if (onClimbable() && !knows('climb')) return [[['W'], 'Climb'], [['S'], 'Down']];
    if (!knows('walk')) return [[['A', 'D'], 'Walk']];
    if (!knows('jump')) return [[['Space'], 'Jump']];
    if (!knows('inventory')) {
      const st = nearStations();
      if (st.bench || st.furnace || st.campfire) return [[['E'], 'Craft']];
      if (inv.some(Boolean)) return [[['E'], 'Inventory and crafting']];
    }
    if (!knows('hotbar') && inv.slice(0, 9).filter(Boolean).length > 1) return [[['1–9'], 'Switch item']];
    return [];
  }
  function updatePrompts() {
    const blocked = !prompts.on || invOpen() || !helpEl.hidden || !storyEl.hidden;
    const showCursor = !blocked && mouse.over && !mouse.touch;
    const cHtml = showCursor ? promptHTML(cursorPrompts()) : '';
    if (cHtml !== lastPrompt) { promptEl.innerHTML = cHtml; promptEl.hidden = !cHtml; lastPrompt = cHtml; }
    if (cHtml) {
      const x = Math.min(mouse.x + 18, viewW - promptEl.offsetWidth - 8), y = Math.min(mouse.y + 16, viewH - promptEl.offsetHeight - 8);
      promptEl.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    }
    const kHtml = blocked || mouse.touch ? '' : promptHTML(coachPrompts());
    if (kHtml !== lastCoach) { coachEl.innerHTML = kHtml; coachEl.hidden = !kHtml; lastCoach = kHtml; }
    const px = (player.x + player.w / 2) * TILE - camera.x;
    let top = player.y * TILE - camera.y - 14; // stack coach, then speech, upwards from Tam's head
    if (kHtml) {
      top -= coachEl.offsetHeight;
      coachEl.style.transform = `translate(${Math.round(px - coachEl.offsetWidth / 2)}px, ${Math.round(top)}px)`;
      top -= 6;
    }
    // Tam's speech bubble
    const sText = speech.t > 0 && invOpen() === false && storyEl.hidden ? speech.text : '';
    if (sText !== lastSpeech) { speechEl.textContent = sText; speechEl.hidden = !sText; lastSpeech = sText; }
    if (sText) {
      top -= speechEl.offsetHeight + 6;
      speechEl.style.transform = `translate(${Math.round(Math.max(8, Math.min(viewW - speechEl.offsetWidth - 8, px - speechEl.offsetWidth / 2)))}px, ${Math.round(Math.max(8, top))}px)`;
    }
  }

  // ---------- New-world story ----------
  const REGIONS = ['Clyde Crater', 'The Barras Wastes', 'Sauchiehall Scorch', 'Govan Glow', 'Partick Pit',
    'Maryhill Mire', 'The Gorbals Glassland', 'Byres Road Ruins', 'Dennistoun Dust', 'Springburn Scorch'];
  const storyEl = document.getElementById('story');
  let helpAfterStory = false;
  function showStory(firstLaunch) {
    const d = worldInfo;
    document.getElementById('story-region').textContent = REGIONS[Math.abs(seed) % REGIONS.length];
    const facts = [
      ['Supply chests detected', chests.length],
      ['Ruined buildings', d.ruins],
      ['Blast craters', d.craters],
      ['Oak trees standing', d.oaks],
      ['Irn Bru machines', 'somewhere doon below'],
      ['Mutant Haggis', "sleepin' at the bottom"],
      ['Pals', 'nane'],
      ['Scran', "dunno, go an' look"],
    ];
    const list = document.getElementById('story-facts');
    list.replaceChildren(...facts.map(([k, v]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      row.append(dt, dd);
      return row;
    }));
    helpAfterStory = firstLaunch;
    helpEl.hidden = true;
    storyEl.hidden = false;
    document.getElementById('story-go').focus({ preventScroll: true });
  }
  document.getElementById('story-go').addEventListener('click', () => {
    setTimeout(() => say('start', { force: true }), 900);
    setTimeout(() => radio('hello'), 6000);
    storyEl.hidden = true;
    if (helpAfterStory) helpEl.hidden = false;
    sfx.click();
  });

  // ---------- Save / load ----------
  function serialize() {
    let s = '';
    for (let i = 0; i < tiles.length; i += 8192) s += String.fromCharCode.apply(null, tiles.subarray(i, i + 8192));
    return {
      v: 1, seed, tiles: btoa(s),
      inv: inv.map(it => it && [it.id, it.n]),
      p: [player.x, player.y], hp: player.hp, food: player.food, lair, sel: selected, progress,
    };
  }
  function deserialize(d) {
    if (!d || d.v !== 1 || typeof d.tiles !== 'string') return false;
    const s = atob(d.tiles);
    if (s.length !== W * H) return false;
    seed = d.seed | 0;
    computeSurface();
    tiles = new Uint8Array(W * H);
    for (let i = 0; i < s.length; i++) tiles[i] = s.charCodeAt(i);
    inv = new Array(INV_SIZE).fill(null);
    (d.inv || []).forEach((it, i) => { if (it && ITEM[it[0]] && i < INV_SIZE) inv[i] = { id: it[0], n: it[1] }; });
    [player.x, player.y] = d.p;
    selected = d.sel | 0;
    progress = d.progress || {};
    progress.summoned = false;
    lair = d.lair || makeLair(mulberry32(seed + 777)); // older saves: dig a lair into the loaded world
    scanChests();
    player.hp = typeof d.hp === 'number' ? d.hp : MAX_HP;
    player.food = typeof d.food === 'number' ? d.food : MAX_FOOD;
    return true;
  }
  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(serialize())); return true; } catch { return false; }
  }
  function load() {
    try { return deserialize(JSON.parse(localStorage.getItem(SAVE_KEY))); } catch { return false; }
  }
  function newWorld() {
    seed = (Math.random() * 2 ** 31) | 0;
    generate();
    inv = new Array(INV_SIZE).fill(null);
    progress = {};
    selected = 0;
    bruT = 0;
    player.hp = MAX_HP;
    player.st = MAX_ST;
    player.food = MAX_FOOD;
    spawn();
    enemies = []; arrows = []; floaters = [];
    spawnTimer = 30;
    resetWeather();
    resetBoss();
    computeLight();
    snapCamera();
    uiDirty = true;
  }
  function snapCamera() {
    camera.x = (player.x + player.w / 2) * TILE - viewW / 2;
    camera.y = (player.y + player.h / 2) * TILE - viewH / 2;
  }
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  setInterval(save, 20000);

  // ---------- Boot ----------
  function start(data) {
    resize();
    window.addEventListener('resize', resize);
    buildTextures();
    buildWalls();
    buildIcons();
    const restored = (data && deserialize(data)) || load();
    if (restored) { computeLight(); snapCamera(); helpEl.hidden = true; }
    else { newWorld(); showStory(true); }
    try { window.claude?.hot?.snapshot?.(() => serialize()); } catch { /* optional */ }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      if (invOpen() && Object.keys(nearStations()).join() !== lastStationKey) uiDirty = true;
      if (uiDirty) renderUI();
      drawStaminaBar();
      drawFoodBar();
      drawWeatherChip();
      drawBuffChip();
      if (boss) {
        bossFill.style.width = `${Math.max(0, boss.hp) / boss.max * 100}%`;
        bossBarEl.classList.toggle('enraged', boss.enraged);
      }
      updatePrompts();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const hot = window.claude?.hot;
  if (hot?.ready) hot.ready(start);
  else start(hot?.data ?? null);
})();
