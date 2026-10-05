import { useState } from 'react';
import { formatNumber } from '../game/format';
import { bagCapacity, bagUsed } from '../game/logic';
import { useGame } from '../game/store';
import { Bag } from './Bag';
import { Bin } from './Bin';
import { DebugPanel } from './DebugPanel';
import { DropFeed } from './DropFeed';
import { Flash } from './Flash';
import { Upgrades } from './Upgrades';

type Tab = 'feed' | 'bag' | 'upgrades';

// Debug panel shows in dev builds, or in any build with ?debug in the URL.
const DEBUG_ENABLED = import.meta.env.DEV || new URLSearchParams(location.search).has('debug');

export function App() {
  const game = useGame((s) => s.game);
  const [tab, setTab] = useState<Tab>('feed');
  const [debugOpen, setDebugOpen] = useState(false);

  const used = bagUsed(game);
  const capacity = bagCapacity(game);

  return (
    <div className="app">
      <Flash />
      <header className="topbar">
        <div className="stat">
          <span className="stat-label">Tokens</span>
          <span className="stat-value mono">{formatNumber(game.tokens)}</span>
        </div>
        <div className="stat stat-right">
          <span className="stat-label">Bag</span>
          <span className={`stat-value mono ${used >= capacity ? 'warn' : ''}`}>
            {used}/{capacity}
          </span>
        </div>
      </header>

      <Bin />

      <nav className="tabs">
        {(['feed', 'bag', 'upgrades'] as const).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'feed' ? 'Drops' : t === 'bag' ? `Bag (${used})` : 'Upgrades'}
          </button>
        ))}
      </nav>

      <main className="panel">
        {tab === 'feed' && <DropFeed />}
        {tab === 'bag' && <Bag />}
        {tab === 'upgrades' && <Upgrades />}
      </main>

      {DEBUG_ENABLED && (
        <>
          <button className="debug-toggle mono" onClick={() => setDebugOpen(true)}>
            DEBUG
          </button>
          {debugOpen && <DebugPanel onClose={() => setDebugOpen(false)} />}
        </>
      )}
    </div>
  );
}
