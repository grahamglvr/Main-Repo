import { useRef, useState, type CSSProperties } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { WORKBENCH_LINES } from '../data/lines';
import { TIERS } from '../data/tiers';
import { formatNumber, formatPercent } from '../game/format';
import { canSalvage, salvageCost, totalLuck, upgradeBlock, upgradeCost, upgradeTime, workbenchCap } from '../game/game';
import { pyramidOdds } from '../game/pyramid';
import { useGame } from '../game/store';
import { spriteUrl } from './pixelArt';
import { formatClock } from './statText';

export function Workbench() {
  const v = useGame(
    useShallow((s) => {
      const g = s.game;
      return {
        level: g.workbench.level,
        scrap: Math.floor(g.scrap),
        pending: g.pending.length,
        canSalvage: canSalvage(g),
        block: upgradeBlock(g),
        cap: workbenchCap(g),
        highest: g.highestZoneCleared,
        luck: Math.round(totalLuck(g) * 1000) / 1000,
        endsAt: g.workbench.upgradeEndsAt,
        startedAt: g.workbench.upgradeStartedAt,
        // Re-render 4× a second for the timer.
        tick: g.workbench.upgradeEndsAt ? Math.floor(g.clock / 250) : 0,
      };
    }),
  );
  const salvage = useGame((s) => s.salvage);
  const upgrade = useGame((s) => s.upgradeWorkbench);
  const [sparks, setSparks] = useState<number[]>([]);
  const sparkId = useRef(0);
  const [showOdds, setShowOdds] = useState(false);

  const cost = salvageCost(v.level);
  const onSalvage = () => {
    if (!v.canSalvage) return;
    salvage();
    const id = ++sparkId.current;
    setSparks((s) => [...s.slice(-3), id]);
    window.setTimeout(() => setSparks((s) => s.filter((x) => x !== id)), 600);
  };

  const odds = pyramidOdds(v.level, v.luck);
  const reason = v.pending > 0 ? WORKBENCH_LINES.cardOpen : v.scrap < cost ? WORKBENCH_LINES.needScrap : null;

  return (
    <section className="workbench" aria-label="Workbench">
      <div className="wb-main">
        <button
          id="workbench-bench"
          className={`bench ${v.canSalvage ? '' : 'bench-idle'}`}
          onClick={onSalvage}
          aria-label={`Salvage for ${cost} Scrap`}
        >
          <img src={spriteUrl('workbench')} alt="" className="bench-art" draggable={false} />
          {sparks.map((id) => (
            <span key={id} className="spark-burst" aria-hidden>
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} style={{ '--a': `${i * 45 + Math.random() * 30}deg` } as CSSProperties} />
              ))}
            </span>
          ))}
          <span className="bench-label">
            {reason ?? (
              <>
                Tap to salvage · <span className="mono">{formatNumber(cost)}</span> Scrap
              </>
            )}
          </span>
        </button>

        <div className="wb-side">
          <div className="wb-level">
            <span className="muted small">Workbench</span>
            <span className="mono wb-lv">Lv {v.level}</span>
          </div>
          <UpgradeButton v={v} onUpgrade={upgrade} />
        </div>
      </div>

      <button className="odds" onClick={() => setShowOdds((o) => !o)} aria-expanded={showOdds}>
        <div className="odds-bar" aria-hidden>
          {TIERS.filter((t) => odds[t.id] > 0).map((t) => (
            <span
              key={t.id}
              className={t.shimmer ? 'shimmer-bg' : ''}
              style={{ width: `${odds[t.id]}%`, background: t.colour }}
            />
          ))}
        </div>
        <div className="odds-legend mono">
          {TIERS.filter((t) => odds[t.id] > 0).map((t) => (
            <span key={t.id} style={{ color: t.colour }}>
              {t.name.replace(' Tech', '')} {formatPercent(odds[t.id])}
            </span>
          ))}
          <span className="muted">{showOdds ? '▲' : '▼'}</span>
        </div>
      </button>
      {showOdds && (
        <table className="odds-table mono">
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.id} className={odds[t.id] > 0 ? '' : 'locked-row'}>
                <td style={{ color: t.colour }}>{t.name}</td>
                <td>{odds[t.id] > 0 ? formatPercent(odds[t.id]) : `0% · unlocks at Workbench Lv ${t.unlockLevel}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function UpgradeButton({
  v,
  onUpgrade,
}: {
  v: { level: number; block: ReturnType<typeof upgradeBlock>; cap: number; highest: number; endsAt: number | null; startedAt: number | null };
  onUpgrade: () => void;
}) {
  if (v.block === 'running' && v.endsAt !== null && v.startedAt !== null) {
    const clock = useGame.getState().game.clock;
    const frac = (clock - v.startedAt) / (v.endsAt - v.startedAt);
    return (
      <div className="upgrade running" role="progressbar" aria-valuenow={Math.round(frac * 100)}>
        <div className="upgrade-fill" style={{ width: `${Math.min(100, frac * 100)}%` }} />
        <span className="upgrade-text">
          Upgrading to Lv {v.level + 1}
          <span className="mono"> {formatClock(v.endsAt - clock)}</span>
        </span>
      </div>
    );
  }
  if (v.block === 'max') return <div className="upgrade capped">Max level</div>;
  if (v.block === 'cap') {
    return (
      <div className="upgrade capped">
        Level cap {v.cap}
        <span className="small">Clear zone {v.highest + 1} to raise it</span>
      </div>
    );
  }
  return (
    <button className={`upgrade ${v.block === 'tokens' ? 'dim' : 'ready'}`} onClick={onUpgrade}>
      Upgrade to Lv {v.level + 1}
      <span className="mono small">
        {formatNumber(upgradeCost(v.level))} Tokens · {formatClock(upgradeTime(v.level))}
      </span>
    </button>
  );
}
