import type { CSSProperties } from 'react';
import { formatNumber } from '../game/format';
import { playerStats } from '../game/game';
import { getBase, getSlot, getTier, sellValue } from '../game/items';
import { computeStats, power } from '../game/stats';
import { useGame } from '../game/store';
import type { Item } from '../game/types';
import { bonusLabel, formatBonus, formatDelta, formatStat, STAT_ROWS } from './statText';

/** The salvage result: item, stats, comparison with what's equipped, Equip or Sell. */
export function ItemCard() {
  const item = useGame((s) => s.game.pending[0]);
  const queued = useGame((s) => s.game.pending.length - 1);
  const equipped = useGame((s) => (item ? s.game.equipped[item.slot] : null));
  const level = useGame((s) => s.game.level);
  const equip = useGame((s) => s.equip);
  const sell = useGame((s) => s.sell);
  if (!item) return null;

  const game = useGame.getState().game;
  const before = playerStats(game);
  const after = computeStats(level, { ...game.equipped, [item.slot]: item });
  const powerBefore = power(before);
  const powerAfter = power(after);
  const changes = STAT_ROWS.filter((r) => Math.abs(after[r.id] - before[r.id]) > 1e-6);
  const tier = getTier(item.tier);
  const base = getBase(item.baseId);
  const better = powerAfter > powerBefore;

  return (
    <div className="card-backdrop">
      <article
        key={item.uid}
        className={`card ${tier.shimmer ? 'card-celestial' : ''}`}
        style={{ '--tier': tier.colour } as CSSProperties}
        aria-label={`New item: ${base.name}`}
      >
        <header className="card-head">
          <div>
            <h2 className={`card-name mono ${tier.shimmer ? 'shimmer-text' : ''}`}>{base.name}</h2>
            <div className="card-meta mono">
              <span className="tier-tag">{tier.name}</span>
              <span>{getSlot(item.slot).name}</span>
              <span>Lv {item.level}</span>
            </div>
          </div>
          <div className={`power-delta mono ${better ? 'up' : powerAfter < powerBefore ? 'down' : ''}`}>
            <span className="small muted">Power</span>
            {better ? '▲' : powerAfter < powerBefore ? '▼' : '='} {formatNumber(Math.abs(powerAfter - powerBefore))}
          </div>
        </header>

        <p className="card-desc">{base.description}</p>

        <ItemStats item={item} />

        <div className="compare">
          <div className="compare-title small muted">
            {equipped ? (
              <>
                Replaces <span style={{ color: getTier(equipped.tier).colour }}>{getBase(equipped.baseId).name}</span> Lv{' '}
                {equipped.level} (sells for {formatNumber(sellValue(equipped))} Tokens)
              </>
            ) : (
              'Empty slot'
            )}
          </div>
          {changes.length === 0 ? (
            <div className="small muted">No change to your stats.</div>
          ) : (
            <ul className="compare-list mono">
              {changes.map((r) => {
                const d = after[r.id] - before[r.id];
                return (
                  <li key={r.id}>
                    <span>{r.label}</span>
                    <span>{formatStat(r.id, after[r.id])}</span>
                    <span className={d > 0 ? 'up' : 'down'}>
                      {d > 0 ? '▲' : '▼'} {formatDelta(r.id, d)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card-actions">
          <button className={`btn ${better ? 'btn-primary' : ''}`} onClick={equip}>
            Equip
          </button>
          <button className={`btn ${better ? '' : 'btn-primary'}`} onClick={sell}>
            Sell <span className="mono">+{formatNumber(sellValue(item))}</span>
          </button>
        </div>
        {queued > 0 && <div className="queued small muted">{queued} more waiting</div>}
      </article>
    </div>
  );
}

export function ItemStats({ item }: { item: Item }) {
  return (
    <ul className="item-stats mono">
      <li>
        <span>{item.main.stat === 'damage' ? 'Damage' : 'Health'}</span>
        <span>+{formatNumber(item.main.value)}</span>
      </li>
      {item.bonuses.map((b) => (
        <li key={b.stat} className="bonus">
          <span>{bonusLabel(b.stat)}</span>
          <span>{formatBonus(b.stat, b.value)}</span>
        </li>
      ))}
    </ul>
  );
}
