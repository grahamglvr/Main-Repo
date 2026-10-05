import type { CSSProperties } from 'react';
import { useGame } from '../game/store';

/** Full-screen colour flash for rare drops. Strength and length come from the tier data. */
export function Flash() {
  const flash = useGame((s) => s.flash);
  if (!flash?.tier.flash) return null;

  const { colour, shimmer } = flash.tier;
  const { opacity, durationMs } = flash.tier.flash;
  return (
    <div
      key={flash.key}
      className={`flash ${shimmer ? 'flash-prismatic' : ''}`}
      style={
        {
          '--tier': colour,
          '--flash-opacity': opacity,
          animationDuration: `${durationMs}ms`,
        } as CSSProperties
      }
      aria-hidden
    />
  );
}
