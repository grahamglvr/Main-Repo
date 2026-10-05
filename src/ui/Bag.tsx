import { EMPTY_LINES } from '../data/lines';
import { getItem, tierRank } from '../game/drops';
import { formatNumber } from '../game/format';
import { bagValue } from '../game/logic';
import { useGame } from '../game/store';
import { ItemName, TierTag } from './ItemName';

export function Bag() {
  const game = useGame((s) => s.game);
  const sellItem = useGame((s) => s.sellItem);
  const sellAll = useGame((s) => s.sellAll);

  // Rarest first, then most valuable.
  const entries = Object.entries(game.inventory)
    .map(([id, count]) => ({ item: getItem(id), count }))
    .sort((a, b) => tierRank(b.item.tier) - tierRank(a.item.tier) || b.item.value - a.item.value);

  if (entries.length === 0) return <p className="empty">{EMPTY_LINES.bag}</p>;

  return (
    <>
      <button className="btn btn-primary btn-wide" onClick={sellAll}>
        Sell everything <span className="mono">+{formatNumber(bagValue(game))} T</span>
      </button>
      <ul className="list">
        {entries.map(({ item, count }) => (
          <li key={item.id} className="row">
            <div className="row-head">
              <span>
                <ItemName item={item} /> <span className="mono muted">×{count}</span>
              </span>
              <span className="mono muted">{formatNumber(item.value)} T each</span>
            </div>
            <div className="row-sub">
              <TierTag item={item} />
              <div className="row-actions">
                <button className="btn btn-small" onClick={() => sellItem(item.id, 1)}>
                  Sell 1
                </button>
                {count > 1 && (
                  <button className="btn btn-small" onClick={() => sellItem(item.id)}>
                    Sell {count} <span className="mono">+{formatNumber(item.value * count)}</span>
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
