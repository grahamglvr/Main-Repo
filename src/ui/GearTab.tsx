import { useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SLOTS } from '../data/gear';
import { formatNumber } from '../game/format';
import { playerStats, xpToNext } from '../game/game';
import { getBase, getTier } from '../game/items';
import { power } from '../game/stats';
import { useGame } from '../game/store';
import type { SlotId } from '../game/types';
import { ItemStats } from './ItemCard';
import { formatStat, STAT_ROWS } from './statText';

export function GearTab() {
  const { equipped, level, xp } = useGame(
    useShallow((s) => ({ equipped: s.game.equipped, level: s.game.level, xp: Math.floor(s.game.xp) })),
  );
  const [selected, setSelected] = useState<SlotId | null>(null);
  const stats = playerStats(useGame.getState().game);
  const need = xpToNext(level);
  const sel = selected ? equipped[selected] : null;

  return (
    <div className="gear">
      <div className="gear-head">
        <div>
          <div className="mono">Level {level}</div>
          <div className="xp-line">
            <div className="xp-bar wide">
              <div className="xp-fill" style={{ width: `${(xp / need) * 100}%` }} />
            </div>
            <span className="mono small muted">
              {formatNumber(xp)}/{formatNumber(need)} XP
            </span>
          </div>
        </div>
        <div className="power mono">
          <span className="small muted">Power</span>
          {formatNumber(power(stats))}
        </div>
      </div>

      <div className="slots">
        {SLOTS.map((slot) => {
          const item = equipped[slot.id];
          const tier = item ? getTier(item.tier) : null;
          return (
            <button
              key={slot.id}
              className={`slot ${item ? 'filled' : ''} ${selected === slot.id ? 'selected' : ''}`}
              style={tier ? ({ '--tier': tier.colour } as CSSProperties) : undefined}
              onClick={() => setSelected(selected === slot.id ? null : slot.id)}
              aria-pressed={selected === slot.id}
            >
              <span className="slot-label small">{slot.name}</span>
              {item ? (
                <>
                  <span className={`slot-item mono ${tier?.shimmer ? 'shimmer-text' : ''}`}>{getBase(item.baseId).name}</span>
                  <span className="slot-sub mono small">
                    Lv {item.level} · {slot.main === 'damage' ? 'DMG' : 'HP'} {formatNumber(item.main.value)}
                  </span>
                </>
              ) : (
                <span className="slot-empty small">Empty</span>
              )}
            </button>
          );
        })}
      </div>

      {sel && (
        <div className="slot-detail" style={{ '--tier': getTier(sel.tier).colour } as CSSProperties}>
          <div className="mono">
            <span style={{ color: getTier(sel.tier).colour }}>{getBase(sel.baseId).name}</span>{' '}
            <span className="muted small">
              {getTier(sel.tier).name} · Lv {sel.level}
            </span>
          </div>
          <p className="card-desc">{getBase(sel.baseId).description}</p>
          <ItemStats item={sel} />
        </div>
      )}

      <ul className="stat-list mono">
        {STAT_ROWS.map((r) => (
          <li key={r.id}>
            <span className="muted">{r.label}</span>
            <span>{formatStat(r.id, stats[r.id])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
