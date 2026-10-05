// Turns the pixel grids in sprites.ts into Phaser textures and walk animations,
// and paints the parallax background layers.
import Phaser from 'phaser';
import { seededRng } from '../../game/rng';
import { SPRITES, type PixelSprite } from './sprites';

function paint(scene: Phaser.Scene, key: string, rows: string[], palette: Record<string, string>) {
  if (scene.textures.exists(key)) return;
  const width = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, width, rows.length)!;
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = palette[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  tex.refresh();
}

/** Second walk frame: leg rows shuffle left and right alternately. */
function walkFrame(sprite: PixelSprite): string[] {
  const legStart = sprite.rows.length - (sprite.legRows ?? 0);
  return sprite.rows.map((row, i) => {
    if (i < legStart) return row;
    return (i - legStart) % 2 === 0 ? row.slice(1) + '.' : '.' + row.slice(0, -1);
  });
}

export function makeSpriteTextures(scene: Phaser.Scene) {
  for (const [key, sprite] of Object.entries(SPRITES)) {
    paint(scene, key, sprite.rows, sprite.palette);
    if (sprite.legRows) {
      paint(scene, `${key}_1`, walkFrame(sprite), sprite.palette);
      if (!scene.anims.exists(`${key}_walk`)) {
        scene.anims.create({
          key: `${key}_walk`,
          frames: [{ key }, { key: `${key}_1` }],
          frameRate: 6,
          repeat: -1,
        });
      }
    }
  }
}

// ---------------- Background ----------------

function canvas(scene: Phaser.Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  return { tex, ctx: tex.getContext() };
}

/** Far skyline: the glowing Spires. */
export function paintSpires(scene: Phaser.Scene, key: string, w: number, h: number) {
  const { tex, ctx } = canvas(scene, key, w, h);
  const rng = seededRng(11);
  let x = 0;
  while (x < w) {
    const tw = 10 + Math.floor(rng() * 18);
    const th = 50 + Math.floor(rng() * (h - 55));
    const top = h - th;
    ctx.fillStyle = rng() < 0.5 ? '#151b24' : '#121821';
    ctx.fillRect(x, top, tw, th);
    // Spire tip and antenna.
    ctx.fillRect(x + Math.floor(tw / 2) - 1, top - 6, 2, 6);
    ctx.fillStyle = '#ff4f8b';
    if (rng() < 0.6) ctx.fillRect(x + Math.floor(tw / 2) - 1, top - 7, 2, 1);
    // Lit windows.
    for (let wy = top + 3; wy < h - 2; wy += 4) {
      for (let wx = x + 2; wx < x + tw - 2; wx += 3) {
        const r = rng();
        if (r < 0.18) {
          ctx.fillStyle = r < 0.04 ? '#19e3c8' : r < 0.08 ? '#7c8cff' : '#2a3a48';
          ctx.fillRect(wx, wy, 1, 2);
        }
      }
    }
    x += tw + Math.floor(rng() * 6);
  }
  tex.refresh();
}

/** Mid layer: shacks, cables and junk silhouettes in the Groves. */
export function paintShacks(scene: Phaser.Scene, key: string, w: number, h: number) {
  const { tex, ctx } = canvas(scene, key, w, h);
  const rng = seededRng(23);
  let x = 0;
  while (x < w) {
    const sw = 18 + Math.floor(rng() * 26);
    const sh = 20 + Math.floor(rng() * (h - 26));
    const top = h - sh;
    ctx.fillStyle = rng() < 0.5 ? '#231a16' : '#1d1714';
    ctx.fillRect(x, top, sw, sh);
    // Sloped tin roof.
    ctx.fillStyle = '#3a2a20';
    for (let i = 0; i < sw; i++) ctx.fillRect(x + i, top - Math.floor((i / sw) * 4), 1, 2);
    // Warm window.
    if (rng() < 0.6) {
      ctx.fillStyle = rng() < 0.5 ? '#c4925c' : '#ff7a2f';
      ctx.fillRect(x + 4 + Math.floor(rng() * (sw - 10)), top + 5, 3, 3);
    }
    // Antenna or satellite dish.
    if (rng() < 0.4) {
      ctx.fillStyle = '#2a333c';
      ctx.fillRect(x + sw - 4, top - 10, 1, 10);
      ctx.fillRect(x + sw - 6, top - 10, 5, 1);
    }
    x += sw + Math.floor(rng() * 8);
  }
  // Sagging cables.
  ctx.fillStyle = '#0e1114';
  for (let c = 0; c < 3; c++) {
    const y0 = 6 + c * 7;
    for (let i = 0; i < w; i++) ctx.fillRect(i, y0 + Math.round(Math.sin((i / w) * Math.PI * 4 + c) * 3), 1, 1);
  }
  tex.refresh();
}

/** Ground strip: rubble, puddles and e-waste. */
export function paintGround(scene: Phaser.Scene, key: string, w: number, h: number) {
  const { tex, ctx } = canvas(scene, key, w, h);
  const rng = seededRng(37);
  ctx.fillStyle = '#16120f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(0, 0, w, 2);
  for (let i = 0; i < w * 1.2; i++) {
    const r = rng();
    ctx.fillStyle = r < 0.3 ? '#3a2c22' : r < 0.5 ? '#241c16' : r < 0.53 ? '#2a333c' : r < 0.55 ? '#5a4632' : '#1c1612';
    ctx.fillRect(Math.floor(rng() * w), 2 + Math.floor(rng() * (h - 2)), 1 + Math.floor(rng() * 3), 1);
  }
  // Puddles reflecting neon.
  for (let p = 0; p < 4; p++) {
    const px = Math.floor(rng() * (w - 20));
    ctx.fillStyle = '#1b2a33';
    ctx.fillRect(px, 6 + Math.floor(rng() * 10), 14 + Math.floor(rng() * 10), 2);
    ctx.fillStyle = '#19e3c8';
    ctx.fillRect(px + 3, 7 + Math.floor(rng() * 8), 2, 1);
  }
  tex.refresh();
}
