// Renders a pixel sprite from src/battle/art/sprites.ts to a data URL for <img> tags.
import { SPRITES } from '../battle/art/sprites';

const cache = new Map<string, string>();

export function spriteUrl(key: string): string {
  const hit = cache.get(key);
  if (hit) return hit;
  const sprite = SPRITES[key];
  const width = Math.max(...sprite.rows.map((r) => r.length));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = sprite.rows.length;
  const ctx = canvas.getContext('2d')!;
  sprite.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = sprite.palette[row[x]];
      if (!colour) continue;
      ctx.fillStyle = colour;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  const url = canvas.toDataURL();
  cache.set(key, url);
  return url;
}
