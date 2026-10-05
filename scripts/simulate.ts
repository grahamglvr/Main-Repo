// Pacing check: `npm run sim`. Plays the real game rules with a normal player for several seeds.
import { simulate, NORMAL_PLAYER } from '../src/game/sim';
import { playerStats } from '../src/game/game';
import { power } from '../src/game/stats';

const seeds = Number(process.argv[2] ?? 8);
const fmt = (m: number | null | undefined) => (m == null ? '  —  ' : m.toFixed(1).padStart(5));
const rows: number[] = [];

console.log('Minutes of play (normal player: 2 salvage taps/s, 2 s per item card)\n');
console.log('seed  WB3  basic |' + Array.from({ length: 10 }, (_, i) => `  z${i + 1}`.padStart(6)).join('') + ' | boss10  WB  lvl  power  deaths');
for (let seed = 1; seed <= seeds; seed++) {
  const r = simulate({ ...NORMAL_PLAYER, seed });
  const g = r.world.game;
  const boss10 = r.bossReached[10];
  if (boss10 !== undefined) rows.push(boss10);
  console.log(
    `${String(seed).padStart(4)} ${fmt(r.workbench3)} ${fmt(r.firstBasic)} |` +
      Array.from({ length: 10 }, (_, i) => fmt(r.zoneReached[i + 1]).padStart(6)).join('') +
      ` | ${fmt(boss10)}  ${String(g.workbench.level).padStart(2)}  ${String(g.level).padStart(3)}  ${power(playerStats(g)).toFixed(0).padStart(5)}  ${g.stats.deaths}`,
  );
}
rows.sort((a, b) => a - b);
if (rows.length) {
  console.log(`\nZone 10 boss reached: median ${rows[Math.floor(rows.length / 2)].toFixed(1)} min, range ${rows[0].toFixed(1)}–${rows[rows.length - 1].toFixed(1)} min. Target 45–60.`);
} else console.log('\nZone 10 boss not reached within the time limit.');
