// Blockstead: a small 2D crafting and building game.
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
  };
  // hard: seconds to mine by hand. tier: tool tier needed (any pickaxe or hatchet counts).
  // pref: the tool that mines it at full speed ('pick' or 'axe'); other tools still help a little.
  // cost: how much light drops passing through. sky: sunlight passes straight down through it.
  const BLOCK = [];
  function def(id, o) {
    BLOCK[id] = Object.assign({ solid: true, hard: 1, tier: 0, pref: null, drop: null, light: 0, cost: 3, sky: false, climb: false }, o);
  }
  def(B.AIR, { name: 'Air', solid: false, hard: 0, cost: 1, sky: true });
  def(B.GRASS, { name: 'Grass', hard: 0.6, drop: 'dirt' });
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

  // ---------- Items ----------
  const ITEM = {
    dirt: { name: 'Dirt', block: B.DIRT },
    cobble: { name: 'Cobblestone', block: B.COBBLE },
    log: { name: 'Log', block: B.LOG },
    plank: { name: 'Planks', block: B.PLANK },
    sand: { name: 'Sand', block: B.SAND },
    bench: { name: 'Workbench', block: B.BENCH },
    furnace: { name: 'Furnace', block: B.FURNACE },
    brick: { name: 'Stone Bricks', block: B.BRICK },
    glass: { name: 'Glass', block: B.GLASS },
    torch: { name: 'Torch', block: B.TORCH },
    ladder: { name: 'Ladder', block: B.LADDER },
    iron_ore: { name: 'Iron Ore', block: B.IRON_ORE },
    stick: { name: 'Stick' },
    coal: { name: 'Coal' },
    iron_ingot: { name: 'Iron Ingot' },
    fibre: { name: 'Fibre' },
    berries: { name: 'Berries', heal: 10 },
    wood_pick: { name: 'Wooden Pickaxe', tool: 'pick', tier: 1, speed: 2.5, stack: 1 },
    stone_pick: { name: 'Stone Pickaxe', tool: 'pick', tier: 2, speed: 4.5, stack: 1 },
    iron_pick: { name: 'Iron Pickaxe', tool: 'pick', tier: 3, speed: 7, stack: 1 },
    wood_axe: { name: 'Wooden Hatchet', tool: 'axe', tier: 1, speed: 2.5, stack: 1 },
    stone_axe: { name: 'Stone Hatchet', tool: 'axe', tier: 2, speed: 4.5, stack: 1 },
    iron_axe: { name: 'Iron Hatchet', tool: 'axe', tier: 3, speed: 7, stack: 1 },
  };
  const tierName = t => ['your hands', 'a wooden tool', 'a stone tool', 'an iron tool'][t] || 'something stronger';

  const RECIPES = [
    { out: 'plank', n: 4, needs: { log: 1 } },
    { out: 'stick', n: 4, needs: { plank: 2 } },
    { out: 'bench', n: 1, needs: { plank: 4 } },
    { out: 'torch', n: 4, needs: { stick: 1, coal: 1 } },
    { out: 'wood_pick', n: 1, needs: { plank: 3, stick: 2 }, at: 'bench' },
    { out: 'wood_axe', n: 1, needs: { plank: 3, stick: 2 }, at: 'bench' },
    { out: 'ladder', n: 3, needs: { stick: 7 }, at: 'bench' },
    { out: 'stone_pick', n: 1, needs: { cobble: 3, stick: 2 }, at: 'bench' },
    { out: 'stone_axe', n: 1, needs: { cobble: 3, stick: 2 }, at: 'bench' },
    { out: 'furnace', n: 1, needs: { cobble: 8 }, at: 'bench' },
    { out: 'brick', n: 4, needs: { cobble: 4 }, at: 'bench' },
    { out: 'iron_ingot', n: 1, needs: { iron_ore: 1, coal: 1 }, at: 'furnace' },
    { out: 'glass', n: 1, needs: { sand: 1 }, at: 'furnace' },
    { out: 'iron_pick', n: 1, needs: { iron_ingot: 3, stick: 2 }, at: 'bench' },
    { out: 'iron_axe', n: 1, needs: { iron_ingot: 3, stick: 2 }, at: 'bench' },
  ];
  const STATION_BLOCK = { bench: B.BENCH, furnace: B.FURNACE };

  // ---------- Pixel-art textures (16x16, drawn at 2x) ----------
  function makeCanvas(size) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
  }
  function painter(c, seed) {
    const g = c.getContext('2d');
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
  function buildTextures() {
    for (let id = 1; id < BLOCK.length; id++) {
      const c = makeCanvas(16), p = painter(c, id * 97 + 13);
      switch (id) {
        case B.DIRT: p.fill('#7a5234'); p.speckle(['#5e3d25', '#8d6240', '#6c4a2f'], 0.3); break;
        case B.GRASS:
          p.fill('#7a5234'); p.speckle(['#5e3d25', '#8d6240'], 0.3);
          p.px(0, 0, '#5fa83a', 16, 3); p.speckle(['#4c8f2c', '#78c24c'], 0.4, 0, 3);
          for (let x = 0; x < 16; x++) if (p.rnd() < 0.5) p.px(x, 3, '#4c8f2c', 1, 1 + ((p.rnd() * 2) | 0));
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
          p.fill('#3f7f2f'); p.speckle(['#2f6a23', '#57a040', '#4a8f37'], 0.45);
          for (let k = 0; k < 10; k++) p.g.clearRect((p.rnd() * 16) | 0, (p.rnd() * 16) | 0, 1, 1);
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
        case B.BUSH:
          p.px(2, 7, '#3f7f2f', 12, 9); p.px(4, 5, '#3f7f2f', 8, 2); p.px(1, 10, '#3f7f2f', 14, 6);
          p.px(5, 4, '#4a8f37', 5, 1);
          for (let k = 0; k < 18; k++) p.px(2 + ((p.rnd() * 12) | 0), 5 + ((p.rnd() * 10) | 0), p.rnd() < 0.5 ? '#2f6a23' : '#57a040');
          [[4, 8], [9, 7], [11, 11], [6, 12]].forEach(([x, y]) => { p.px(x, y, '#b3263a', 2, 2); p.px(x, y, '#e2566b'); });
          break;
      }
      TEX[id] = c;
    }
  }
  // Darkened back walls shown behind dug-out areas underground.
  let WALL_DIRT, WALL_STONE;
  function buildWalls() {
    const dark = (src) => {
      const c = makeCanvas(16), g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.fillStyle = 'rgba(10,12,16,0.62)'; g.fillRect(0, 0, 16, 16);
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
  const ICON = {};   // item id -> canvas
  const ICON_URL = {};
  function buildIcons() {
    for (const id in ITEM) {
      const it = ITEM[id];
      let c;
      if (it.block) c = TEX[it.block];
      else {
        c = makeCanvas(16);
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
      ICON[id] = c;
      ICON_URL[id] = c.toDataURL();
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

  function computeSurface() {
    for (let x = 0; x < W; x++) {
      const h = 34 + (noise2(x / 40, 0.5, seed) - 0.5) * 22 + (noise2(x / 12, 0.5, seed + 7) - 0.5) * 7;
      surface[x] = Math.round(h);
    }
  }

  function generate() {
    tiles = new Uint8Array(W * H);
    computeSurface();
    const rnd = mulberry32(seed ^ 0x9e3779b9);
    for (let x = 0; x < W; x++) {
      const h = surface[x];
      const dirtDepth = 3 + Math.floor(noise2(x / 6, 3.3, seed + 5) * 3);
      const beach = h >= 41;
      for (let y = 0; y < H; y++) {
        let b = B.AIR;
        if (y >= H - 1 || (y >= H - 3 && rnd() < 0.5)) b = B.BEDROCK;
        else if (y < h) b = B.AIR;
        else if (y === h) b = beach ? B.SAND : B.GRASS;
        else if (y < h + dirtDepth) b = beach && y < h + 3 ? B.SAND : B.DIRT;
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
    // Trees
    let lastTree = -10;
    for (let x = 3; x < W - 3; x++) {
      const h = surface[x];
      if (tiles[idx(x, h)] !== B.GRASS || x - lastTree < 4 || rnd() > 0.22) continue;
      if (Math.abs(x - W / 2) < 3) continue; // keep the spawn point clear
      lastTree = x;
      const trunk = 4 + ((rnd() * 3) | 0);
      for (let i = 1; i <= trunk; i++) tiles[idx(x, h - i)] = B.LOG;
      const top = h - trunk;
      for (let dy = -2; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) {
        if (Math.abs(dx) + Math.abs(dy) > 3 || (dy === 1 && Math.abs(dx) === 2)) continue;
        const tx = x + dx, ty = top + dy;
        if (inWorld(tx, ty) && tiles[idx(tx, ty)] === B.AIR) tiles[idx(tx, ty)] = B.LEAVES;
      }
    }
    // Bushes
    for (let x = 1; x < W - 1; x++) {
      const h = surface[x];
      if (tiles[idx(x, h)] === B.GRASS && tiles[idx(x, h - 1)] === B.AIR && rnd() < 0.12) tiles[idx(x, h - 1)] = B.BUSH;
    }
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
  const player = { x: 0, y: 0, w: 0.7, h: 1.7, vx: 0, vy: 0, onGround: false, face: 1, walk: 0, hp: 100 };
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
    if (!tool) return bd.hard;
    const speed = tool.tool === bd.pref ? tool.speed : 1 + (tool.speed - 1) * 0.3;
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
    if (r.at && !stations[r.at]) return false;
    return Object.entries(r.needs).every(([id, n]) => count(id) >= n);
  }
  function craft(r) {
    if (!canCraft(r, nearStations())) return;
    for (const [id, n] of Object.entries(r.needs)) removeItem(id, n);
    addItem(r.out, r.n);
    sfx.craft();
    toast(`Crafted ${r.n > 1 ? r.n + ' × ' : ''}${ITEM[r.out].name}`);
  }

  // ---------- Goals ----------
  let progress = {};
  const GOALS = [
    ['log', 'Hold left click on a tree trunk to chop some logs.'],
    ['bench', 'Press E and craft Planks, then a Workbench.'],
    ['placed_bench', 'Right click the ground to place your Workbench.'],
    ['wood_pick', 'Stand near the Workbench and craft a Wooden Pickaxe.'],
    ['wood_axe', 'Craft a Wooden Hatchet too. It chops wood much faster.'],
    ['cobble', 'Select the pickaxe and dig down into stone.'],
    ['stone_pick', 'Craft a Stone Pickaxe at the Workbench.'],
    ['coal', 'Find coal ore (black specks) and make Torches.'],
    ['furnace', 'Craft a Furnace from 8 Cobblestone.'],
    ['iron_ingot', 'Dig deep for iron ore (orange specks) and smelt it at a Furnace.'],
    ['iron_pick', 'Craft an Iron Pickaxe.'],
  ];
  function markProgress() { for (const [id] of GOALS) if (ITEM[id] && count(id) > 0) progress[id] = true; }
  function currentGoal() {
    for (const [id, text] of GOALS) if (!progress[id]) return text;
    return 'You have every tool. Build a house with bricks, glass and torches.';
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
    }
    const ready = () => on && ac && ac.state === 'running';

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
        return on;
      },
      hit: m => play(HIT[m] || HIT.dirt),
      break: m => play(BREAK[m] || BREAK.dirt),
      place: () => play(v => { noise({ type: 'lowpass', freq: 450 * v, dur: 0.07, gain: 0.45 }); tone({ freq: 130 * v, to: 80, dur: 0.08, gain: 0.3 }); }),
      step: m => play(v => noise({ type: m === 'stone' ? 'bandpass' : 'lowpass', freq: (m === 'stone' ? 1800 : m === 'wood' ? 1100 : 800) * v, q: 1.5, dur: 0.04, gain: 0.07 })),
      jump: () => play(v => tone({ freq: 260 * v, to: 420, dur: 0.09, type: 'square', gain: 0.04 })),
      land: () => play(() => noise({ type: 'lowpass', freq: 320, dur: 0.1, gain: 0.35 })),
      craft: () => play(() => { tone({ freq: 660, dur: 0.12, type: 'triangle', gain: 0.18 }); tone({ freq: 990, dur: 0.18, type: 'triangle', gain: 0.18, delay: 0.09 }); }),
      hurt: () => play(v => { tone({ freq: 220 * v, to: 110, dur: 0.18, type: 'sawtooth', gain: 0.12 }); noise({ type: 'lowpass', freq: 500, dur: 0.12, gain: 0.3 }); }),
      eat: () => play(v => { for (let i = 0; i < 3; i++) noise({ type: 'bandpass', freq: 1500 * v, q: 2, dur: 0.05, gain: 0.3, delay: i * 0.09 }); }),
      denied: () => play(() => tone({ freq: 160, to: 120, dur: 0.14, type: 'square', gain: 0.05 })),
      click: () => play(() => tone({ freq: 900, dur: 0.03, type: 'square', gain: 0.03 })),
    };
  })();
  const MATERIAL = {
    [B.LOG]: 'wood', [B.PLANK]: 'wood', [B.BENCH]: 'wood', [B.LADDER]: 'wood', [B.TORCH]: 'wood',
    [B.STONE]: 'stone', [B.COBBLE]: 'stone', [B.COAL_ORE]: 'stone', [B.IRON_ORE]: 'stone',
    [B.FURNACE]: 'stone', [B.BRICK]: 'stone', [B.BEDROCK]: 'stone',
    [B.LEAVES]: 'leaf', [B.BUSH]: 'leaf', [B.GLASS]: 'glass',
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
    if (k === 'e') { toggleInv(); e.preventDefault(); return; }
    if (k === 'escape') { if (invOpen()) toggleInv(false); helpEl.hidden = true; return; }
    if (k === 'h') { helpEl.hidden = !helpEl.hidden; return; }
    if (k === 'm') { toggleSound(); return; }
    if (k >= '1' && k <= '9') { selected = +k - 1; uiDirty = true; return; }
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
    if (drop) addItem(drop, 1);
    if (b === B.LEAVES) {
      if (Math.random() < 0.2) addItem('stick', 1);
      if (Math.random() < 0.5) dropFibre(1);
    }
    if (b === B.BUSH) dropFibre(Math.random() < 0.5 ? 2 : 1);
    // Torches and ladders resting on this block fall off with it.
    const above = get(tx, ty - 1);
    if (above === B.TORCH && !hasSupport(tx, ty - 1)) breakBlock(tx, ty - 1);
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
    player.hp = Math.min(MAX_HP, player.hp + n);
    uiDirty = true;
  }
  function hurt(n) {
    player.hp = Math.max(0, player.hp - n);
    hurtFlash = 0.35;
    sfx.hurt();
    uiDirty = true;
    if (player.hp === 0) {
      spawn();
      player.hp = MAX_HP;
      snapCamera();
      toast('You passed out and woke up back at the start. You kept your items.');
    }
  }
  function eat(it) {
    if (player.hp >= MAX_HP) { toast('Your health is already full'); return; }
    removeItem(it.id, 1);
    heal(ITEM[it.id].heal);
    sfx.eat();
    toast(`+${ITEM[it.id].heal} health`);
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
    player.vx = dir * SPEED;
    if (dir) player.face = dir;
    player.walk = dir && player.onGround ? player.walk + dt * 10 : 0;

    if (onClimbable()) {
      player.vy = up ? -5 : down ? 5 : 0;
    } else {
      player.vy = Math.min(player.vy + GRAVITY * dt, MAX_FALL);
      if (up && player.onGround) { player.vy = JUMP; sfx.jump(); }
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
      if (fallSpeed > 16.5) hurt(Math.round((fallSpeed - 16.5) * 5));
    }
    hurtFlash = Math.max(0, hurtFlash - dt);
    if (player.onGround && dir) {
      stepTimer -= dt;
      if (stepTimer <= 0) {
        stepTimer = 0.32;
        sfx.step(materialOf(get(Math.floor(player.x + player.w / 2), Math.floor(player.y + player.h + 0.05))));
      }
    } else stepTimer = 0;

    // Mining and placing
    placeCooldown -= dt;
    const t = targetTile();
    if (mouse.left && !invOpen() && t.inReach) {
      const b = get(t.tx, t.ty);
      if (b === B.AIR) mining.t = 0;
      else {
        if (mining.x !== t.tx || mining.y !== t.ty) { mining.x = t.tx; mining.y = t.ty; mining.t = 0; mining.warned = false; }
        const bd = BLOCK[b];
        const tool = heldTool();
        const tier = tool ? tool.tier : 0;
        if (!t.visible) {
          if (!mining.warned) { toast('Something is in the way. Clear the blocks in front first.'); sfx.denied(); }
          mining.warned = true;
          mining.t = 0;
        } else if (bd.tier > tier) {
          if (!mining.warned) { toast(bd.tier < 99 ? `${bd.name} needs ${tierName(bd.tier)}` : 'Bedrock cannot be broken'); sfx.denied(); }
          mining.warned = true;
        } else {
          // Tick sound on each swing of the arm.
          if (mining.t === 0 || Math.floor(mining.t / 0.25) !== Math.floor((mining.t + dt) / 0.25)) sfx.hit(materialOf(b));
          mining.t += dt;
          if (mining.t >= mineTime(b)) { breakBlock(t.tx, t.ty); mining.t = 0; }
        }
      }
    } else mining.t = 0;

    const food = held() && ITEM[held().id].heal;
    if (mouse.right && !invOpen() && food && placeCooldown <= 0) {
      placeCooldown = 0.4;
      eat(held());
    } else if (mouse.right && !invOpen() && t.inReach && placeCooldown <= 0) {
      placeCooldown = 0.2;
      const it = held();
      const block = it && ITEM[it.id].block;
      if (block && get(t.tx, t.ty) === B.AIR && hasSupport(t.tx, t.ty) &&
        !(BLOCK[block].solid && boxOverlapsTile(t.tx, t.ty))) {
        tiles[idx(t.tx, t.ty)] = block;
        removeItem(it.id, 1);
        sfx.place();
        if (block === B.BENCH) progress.placed_bench = true;
        computeLight();
      }
    }

    // Camera eases toward the player.
    const tx = (player.x + player.w / 2) * TILE - viewW / 2;
    const ty = (player.y + player.h / 2) * TILE - viewH / 2;
    const k = 1 - Math.pow(0.0001, dt);
    camera.x += (tx - camera.x) * k;
    camera.y += (ty - camera.y) * k;
    camera.x = Math.max(0, Math.min(W * TILE - viewW, camera.x));
    camera.y = Math.max(-TILE * 8, Math.min(H * TILE - viewH, camera.y));
  }
  function boxOverlapsTile(tx, ty) {
    return player.x < tx + 1 && player.x + player.w > tx && player.y < ty + 1 && player.y + player.h > ty;
  }

  // ---------- Rendering ----------
  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, viewH);
    g.addColorStop(0, '#5aa2d6');
    g.addColorStop(1, '#cfe9f2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, viewW, viewH);
    // Soft distant hills
    ctx.fillStyle = 'rgba(90,140,120,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = 0; x <= viewW; x += 16) {
      const wx = (x + camera.x * 0.3) / 180;
      const y = viewH * 0.55 + Math.sin(wx) * 40 + Math.sin(wx * 2.3) * 18 - camera.y * 0.1;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(viewW, viewH);
    ctx.fill();
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
      if (b) ctx.drawImage(TEX[b], sx, sy, TILE, TILE);
    }

    drawPlayer(cx, cy);

    // Darkness
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const L = light[idx(x, y)];
      if (L >= 15) continue;
      ctx.fillStyle = `rgba(6,8,12,${((1 - L / 15) * 0.9).toFixed(3)})`;
      ctx.fillRect(x * TILE - cx, y * TILE - cy, TILE, TILE);
    }

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

    // Red flash when hurt
    if (hurtFlash > 0) {
      ctx.fillStyle = `rgba(200,30,30,${(hurtFlash * 0.8).toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // Small gold + that replaces the mouse pointer over the world.
  function drawCrosshair(x, y) {
    x = Math.round(x); y = Math.round(y);
    ctx.fillStyle = 'rgba(20,16,8,0.7)';
    ctx.fillRect(x - 6, y - 2, 12, 4);
    ctx.fillRect(x - 2, y - 6, 4, 12);
    ctx.fillStyle = '#e8b83a';
    ctx.fillRect(x - 5, y - 1, 10, 2);
    ctx.fillRect(x - 1, y - 5, 2, 10);
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

  function drawPlayer(cx, cy) {
    const px = Math.round(player.x * TILE - cx), py = Math.round(player.y * TILE - cy);
    const w = Math.round(player.w * TILE), h = Math.round(player.h * TILE);
    const f = player.face;
    const swing = Math.sin(player.walk) * 4;
    ctx.save();
    ctx.translate(px + w / 2, py);
    ctx.scale(f, 1);
    const SKIN = '#f0c6a0', BLACK = '#18181c';
    const l1 = -7 + swing * 0.5, l2 = 1 - swing * 0.5;
    // legs: black shorts over bare legs, black trainers with white soles
    for (const lx of [l1, l2]) {
      ctx.fillStyle = SKIN;
      ctx.fillRect(lx, h - 12, 6, 9);
      ctx.fillStyle = BLACK;
      ctx.fillRect(lx, h - 19, 6, 8);
      ctx.fillStyle = '#0e0e10';
      ctx.fillRect(lx, h - 4, 8, 3);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(lx, h - 1, 8, 1);
    }
    // body: black vest with bare shoulders
    ctx.fillStyle = BLACK;
    ctx.fillRect(-8, 17, 16, h - 35);
    ctx.fillStyle = SKIN;
    ctx.fillRect(-8, 17, 3, 3);
    ctx.fillRect(5, 17, 3, 3);
    ctx.fillStyle = '#2c2c32';
    ctx.fillRect(-4, 17, 8, 1);
    // head: completely bald with a shiny scalp
    ctx.fillStyle = SKIN;
    ctx.fillRect(-7, 2, 14, 15);
    ctx.fillRect(-6, 0, 12, 2);
    ctx.fillStyle = '#fbe0c6';
    ctx.fillRect(-3, 2, 5, 2);
    ctx.fillStyle = '#dca07a';
    ctx.fillRect(-5, 8, 2, 4);
    // eye and ginger eyebrow
    ctx.fillStyle = '#1b1b1d';
    ctx.fillRect(4, 8, 2, 2);
    ctx.fillStyle = '#b5561f';
    ctx.fillRect(3, 6, 4, 1);
    // small ginger beard along the jaw and chin
    ctx.fillStyle = '#c8622a';
    ctx.fillRect(-3, 13, 11, 3);
    ctx.fillRect(0, 16, 7, 2);
    ctx.fillRect(2, 12, 5, 1);
    ctx.fillStyle = '#a44e1f';
    ctx.fillRect(1, 17, 5, 1);
    ctx.fillStyle = '#6e2c10';
    ctx.fillRect(4, 13, 3, 1);
    // arm, swinging while mining
    const mSwing = mining.t > 0 ? Math.sin(performance.now() / 60) * 0.6 : 0;
    ctx.translate(0, 20);
    ctx.rotate(-0.3 + mSwing - swing * 0.03);
    ctx.fillStyle = SKIN;
    ctx.fillRect(-2, 0, 5, 16);
    const it = held();
    if (it) ctx.drawImage(ICON[it.id], -2, 6, 18, 18);
    ctx.restore();
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
  const healthFill = document.getElementById('health-fill');
  const healthText = document.getElementById('health-text');
  let uiDirty = true, pickSlot = null, toastTimer = 0, lastStationKey = '';

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  function slotEl(i, withKey) {
    const it = inv[i];
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'slot';
    if (it) {
      el.style.backgroundImage = `url(${ICON_URL[it.id]})`;
      el.title = ITEM[it.id].name;
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
      el.addEventListener('click', () => { selected = i; uiDirty = true; });
      hotbarEl.append(el);
    }
  }

  function renderInventory() {
    invGridEl.replaceChildren();
    for (let i = 0; i < INV_SIZE; i++) {
      const el = slotEl(i, false);
      if (i === pickSlot) el.classList.add('pick');
      else if (i === selected) el.classList.add('sel');
      el.addEventListener('click', () => clickSlot(i));
      invGridEl.append(el);
    }
    const st = nearStations();
    lastStationKey = Object.keys(st).join();
    stationsEl.textContent = `near: ${['bench', 'furnace'].filter(s => st[s]).map(s => ITEM[s].name).join(', ') || 'nothing'}`;
    recipesEl.replaceChildren();
    for (const r of RECIPES) {
      const ok = canCraft(r, st);
      const row = document.createElement('div');
      row.className = 'recipe' + (ok ? ' ok' : '');
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.style.backgroundImage = `url(${ICON_URL[r.out]})`;
      const mid = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = (r.n > 1 ? r.n + ' × ' : '') + ITEM[r.out].name;
      const needs = document.createElement('div');
      needs.className = 'needs';
      for (const [id, n] of Object.entries(r.needs)) {
        const s = document.createElement('span');
        const have = count(id);
        s.textContent = `${ITEM[id].name} ${Math.min(have, n)}/${n}`;
        if (have < n) s.className = 'miss';
        needs.append(s);
      }
      if (r.at) {
        const s = document.createElement('span');
        s.className = 'station' + (st[r.at] ? '' : ' miss');
        s.textContent = `at ${ITEM[r.at].name}`;
        needs.append(s);
      }
      mid.append(name, needs);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Craft';
      btn.disabled = !ok;
      btn.addEventListener('click', () => craft(r));
      row.append(icon, mid, btn);
      recipesEl.append(row);
    }
  }

  function clickSlot(i) {
    if (pickSlot === null) {
      if (inv[i]) pickSlot = i;
    } else if (pickSlot === i) {
      pickSlot = null;
    } else {
      const a = inv[pickSlot], b = inv[i];
      if (b && a.id === b.id && b.n < stackOf(b.id)) {
        const k = Math.min(a.n, stackOf(b.id) - b.n);
        b.n += k; a.n -= k;
        if (!a.n) inv[pickSlot] = null;
      } else { inv[i] = a; inv[pickSlot] = b; }
      pickSlot = null;
    }
    uiDirty = true;
  }

  function toggleInv(force) {
    const open = force === undefined ? invEl.hidden : force;
    invEl.hidden = !open;
    pickSlot = null;
    mouse.left = mouse.right = false;
    if (open) helpEl.hidden = true;
    uiDirty = true;
  }

  function renderUI() {
    renderHotbar();
    if (invOpen()) renderInventory();
    goalEl.textContent = currentGoal();
    healthFill.style.width = `${player.hp}%`;
    healthFill.classList.toggle('low', player.hp <= 30);
    healthText.textContent = `${player.hp} / ${MAX_HP}`;
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
    toast('A new world has been generated');
  });

  // ---------- Save / load ----------
  function serialize() {
    let s = '';
    for (let i = 0; i < tiles.length; i += 8192) s += String.fromCharCode.apply(null, tiles.subarray(i, i + 8192));
    return {
      v: 1, seed, tiles: btoa(s),
      inv: inv.map(it => it && [it.id, it.n]),
      p: [player.x, player.y], hp: player.hp, sel: selected, progress,
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
    player.hp = typeof d.hp === 'number' ? d.hp : MAX_HP;
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
    player.hp = MAX_HP;
    spawn();
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
    else newWorld();
    try { window.claude?.hot?.snapshot?.(() => serialize()); } catch { /* optional */ }

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      render();
      if (invOpen() && Object.keys(nearStations()).join() !== lastStationKey) uiDirty = true;
      if (uiDirty) renderUI();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const hot = window.claude?.hot;
  if (hot?.ready) hot.ready(start);
  else start(hot?.data ?? null);
})();
