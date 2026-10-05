import { formatNumber } from '../game/format';
import { xpToNext } from '../game/game';
import { useGame } from '../game/store';
import { spriteUrl } from './pixelArt';

export function TopBar({ onSettings }: { onSettings: () => void }) {
  const tokens = useGame((s) => Math.floor(s.game.tokens));
  const scrap = useGame((s) => Math.floor(s.game.scrap));
  const level = useGame((s) => s.game.level);
  const xpFrac = useGame((s) => Math.floor((s.game.xp / xpToNext(s.game.level)) * 100));

  return (
    <header className="topbar">
      <div className="currency" title="Tokens">
        <img src={spriteUrl('coin')} alt="" className="px-icon" />
        <span className="mono">{formatNumber(tokens)}</span>
      </div>
      <div className="currency" title="Scrap">
        <img src={spriteUrl('scrapBit')} alt="" className="px-icon" />
        <span className="mono">{formatNumber(scrap)}</span>
      </div>
      <div className="level" title={`Level ${level}, ${xpFrac}% to next`}>
        <span className="mono">Lv {level}</span>
        <div className="xp-bar" aria-hidden>
          <div className="xp-fill" style={{ width: `${xpFrac}%` }} />
        </div>
      </div>
      <button className="icon-btn" onClick={onSettings} aria-label="Settings">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <path
            fill="currentColor"
            d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z"
          />
        </svg>
      </button>
    </header>
  );
}
