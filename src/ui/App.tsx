import { useState } from 'react';
import { useGame } from '../game/store';
import { BattleView } from './BattleView';
import { DebugPanel } from './DebugPanel';
import { GearTab } from './GearTab';
import { ItemCard } from './ItemCard';
import { LockedTab } from './LockedTab';
import { RareMoment } from './RareMoment';
import { Settings } from './Settings';
import { TopBar } from './TopBar';
import { Workbench } from './Workbench';

const TABS = [
  { id: 'gear', label: 'Gear' },
  { id: 'skills', label: 'Skills' },
  { id: 'crew', label: 'Crew' },
  { id: 'collection', label: 'Collection' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function App() {
  const [tab, setTab] = useState<TabId>('gear');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const debugEnabled = useGame((s) => s.debugEnabled);

  return (
    <div className="app">
      <TopBar onSettings={() => setSettingsOpen(true)} />
      <BattleView />
      <div className="lower">
        <Workbench />
        <nav className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              className={`tab ${tab === t.id ? 'active' : ''} ${t.id !== 'gear' ? 'locked' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <section className="tab-panel">
          {tab === 'gear' ? <GearTab /> : <LockedTab tab={tab} />}
        </section>
        <ItemCard />
      </div>
      <RareMoment />

      {debugEnabled && (
        <button className="debug-toggle mono" onClick={() => setDebugOpen(true)}>
          DEBUG
        </button>
      )}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      {debugOpen && debugEnabled && <DebugPanel onClose={() => setDebugOpen(false)} />}
    </div>
  );
}
