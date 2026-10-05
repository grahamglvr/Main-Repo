import { EMPTY_LINES } from '../data/lines';
import { getItem } from '../game/drops';
import { formatNumber } from '../game/format';
import { useGame } from '../game/store';
import { ItemName, TierTag } from './ItemName';

export function DropFeed() {
  const feed = useGame((s) => s.game.feed);

  if (feed.length === 0) return <p className="empty">{EMPTY_LINES.feed}</p>;

  return (
    <ul className="list">
      {feed.map((entry) => {
        const item = getItem(entry.itemId);
        return (
          <li key={entry.key} className="row feed-row">
            <div className="row-head">
              <ItemName item={item} />
              <span className="mono muted">{formatNumber(item.value)} T</span>
            </div>
            <div className="row-sub">
              <TierTag item={item} />
              <span className="desc">{item.description}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
