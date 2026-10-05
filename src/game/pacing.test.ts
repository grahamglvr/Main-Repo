import { describe, expect, it } from 'vitest';
import { NORMAL_PLAYER, simulate } from './sim';

// Balance guard: a normal player should reach the zone 10 boss in 45–60 minutes
// (GAME_DESIGN.md section 15). Uses the median of several seeds; `npm run sim` shows detail.
describe('pacing', () => {
  it('median run reaches the zone 10 boss in 45–60 minutes', () => {
    const times = [1, 2, 3, 4, 5, 6, 7].map(
      (seed) => simulate({ ...NORMAL_PLAYER, seed }).bossReached[10] ?? Infinity,
    );
    times.sort((a, b) => a - b);
    const median = times[3];
    expect(median).toBeGreaterThanOrEqual(45);
    expect(median).toBeLessThanOrEqual(60);
  }, 60_000);

  it('first Basic Tech is possible (Workbench level 3) after 5–10 minutes', () => {
    const r = simulate({ ...NORMAL_PLAYER, seed: 1, stopAtBossOfZone: 6 });
    expect(r.workbench3).toBeGreaterThanOrEqual(5);
    expect(r.workbench3).toBeLessThanOrEqual(10);
  });
});
