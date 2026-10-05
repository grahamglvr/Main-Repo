import type { CSSProperties } from 'react';
import { getTier } from '../game/drops';
import type { ItemDef } from '../game/types';

/** Item name in its tier colour, with shimmer for tiers that have it. */
export function ItemName({ item }: { item: ItemDef }) {
  const tier = getTier(item.tier);
  return (
    <span
      className={`item-name mono ${tier.shimmer ? 'shimmer' : ''}`}
      style={{ '--tier': tier.colour } as CSSProperties}
    >
      {item.name}
    </span>
  );
}

export function TierTag({ item }: { item: ItemDef }) {
  const tier = getTier(item.tier);
  return (
    <span className="tier-tag mono" style={{ '--tier': tier.colour } as CSSProperties}>
      {tier.name}
    </span>
  );
}
