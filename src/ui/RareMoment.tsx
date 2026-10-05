import { useEffect, useState, type CSSProperties } from 'react';
import { getTier } from '../game/items';
import { bus } from '../game/store';
import type { TierDef } from '../game/types';

interface Moment {
  key: number;
  tier: TierDef;
  x: number;
  /** Distance from the top of the screen to the Workbench. */
  height: number;
}

/**
 * Rare drop moment: a light beam in the tier colour shooting up from the Workbench,
 * plus a screen flash. Slow motion is applied to the battle by the store.
 */
export function RareMoment() {
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    let key = 0;
    return bus.on((e) => {
      if (e.t !== 'itemFound') return;
      const tier = getTier(e.item.tier);
      if (!tier.moment) return;
      const bench = document.getElementById('workbench-bench')?.getBoundingClientRect();
      const m: Moment = {
        key: ++key,
        tier,
        x: bench ? bench.left + bench.width / 2 : window.innerWidth / 2,
        height: bench ? bench.top + bench.height * 0.45 : window.innerHeight / 2,
      };
      setMoments((list) => [...list.slice(-2), m]);
      window.setTimeout(() => setMoments((list) => list.filter((x) => x.key !== m.key)), tier.moment.beamMs + 50);
    });
  }, []);

  return (
    <>
      {moments.map((m) => {
        const style = {
          '--tier': m.tier.colour,
          '--beam-ms': `${m.tier.moment!.beamMs}ms`,
          '--flash': m.tier.moment!.flashOpacity,
        } as CSSProperties;
        return (
          <div key={m.key} className={m.tier.shimmer ? 'moment prismatic' : 'moment'} style={style} aria-hidden>
            <div className="flash" />
            <div className="beam" style={{ left: m.x, height: m.height }} />
          </div>
        );
      })}
    </>
  );
}
