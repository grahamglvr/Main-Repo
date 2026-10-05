import { useRef } from 'react';
import { CONFIG } from '../data/config';
import { SPOTS } from '../data/upgrades';
import { getItem } from '../game/drops';
import { useGame } from '../game/store';
import { ItemName } from './ItemName';

export function Bin() {
  const game = useGame((s) => s.game);
  const message = useGame((s) => s.message);
  const tap = useGame((s) => s.tap);
  const binRef = useRef<HTMLButtonElement>(null);

  const spot = SPOTS[game.spotIndex];
  const latest = game.feed[0] ? getItem(game.feed[0].itemId) : null;
  const progressPct = Math.min(100, (game.progress / CONFIG.searchCost) * 100);

  const doTap = () => {
    tap();
    // Restart the bump animation on every tap.
    const el = binRef.current;
    if (el) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  };

  return (
    <section className="bin-area">
      <div className="spot-name mono">{spot.name}</div>
      <button
        ref={binRef}
        className="bin"
        aria-label={`Scavenge the ${spot.name}`}
        onPointerDown={(e) => {
          if (e.button === 0) doTap();
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
            e.preventDefault();
            doTap();
          }
        }}
      >
        <BinIcon />
      </button>
      <div className="progress" aria-hidden>
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="last-find">
        {latest ? (
          <>
            <span className="muted">Found: </span>
            <ItemName key={game.feed[0].key} item={latest} />
          </>
        ) : (
          <span className="muted">Tap the bin</span>
        )}
      </div>
      <p className="narration">{message}</p>
    </section>
  );
}

function BinIcon() {
  return (
    <svg viewBox="0 0 64 64" width="96" height="96" aria-hidden>
      <rect x="10" y="14" width="44" height="7" rx="2" fill="#2A333C" stroke="#7D8A96" strokeWidth="2" />
      <rect x="26" y="9" width="12" height="5" rx="1.5" fill="none" stroke="#7D8A96" strokeWidth="2" />
      <path d="M14 21h36l-4 35a3 3 0 0 1-3 3H21a3 3 0 0 1-3-3z" fill="#151A1F" stroke="#7D8A96" strokeWidth="2" />
      <path d="M25 28v24M32 28v24M39 28v24" stroke="#2A333C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="21" cy="11" r="2" fill="#C4925C" />
      <rect x="40" y="6" width="6" height="8" rx="1" fill="#A9B8C2" transform="rotate(20 43 10)" />
    </svg>
  );
}
