// Prints the drop pyramid for every Workbench level: `npm run pyramid [luck]`.
// Pass a luck value (e.g. 0.2 for +20%) to see how luck shifts the odds.
import { TIERS } from '../src/data/tiers';
import { pyramidOdds } from '../src/game/pyramid';

const luck = Number(process.argv[2] ?? 0);
const short = (name: string) => name.replace(' Tech', '').padStart(12);
console.log(`Drop pyramid by Workbench level${luck ? ` (luck +${(luck * 100).toFixed(0)}%)` : ''}. "·" = exactly 0% (locked tiers are always 0).\n`);
console.log('  WB ' + TIERS.map((t) => short(t.name)).join(''));
for (let level = 1; level <= 60; level++) {
  const odds = pyramidOdds(level, luck);
  const cells = TIERS.map((t) => {
    const v = odds[t.id];
    if (v === 0) return '·'.padStart(12);
    return (v >= 10 ? v.toFixed(1) : v >= 1 ? v.toFixed(2) : v.toFixed(3)).padStart(12);
  });
  console.log(String(level).padStart(4) + ' ' + cells.join(''));
}
