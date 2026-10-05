import { useState, type CSSProperties } from 'react';
import { DEBUG, WORKBENCH } from '../data/config';
import { TIERS } from '../data/tiers';
import { ZONES } from '../data/zones';
import { formatNumber, formatPercent } from '../game/format';
import { totalLuck } from '../game/game';
import { pyramidOdds, rollTier } from '../game/pyramid';
import { useGame } from '../game/store';
import type { TierId } from '../game/types';
import { formatClock } from './statText';

export function DebugPanel({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game);
  const d = useGame((s) => s.debug);
  const [level, setLevel] = useState(game.workbench.level);
  const [useLuck, setUseLuck] = useState(false);
  const [sim, setSim] = useState<{ level: number; luck: number; counts: Record<TierId, number> } | null>(null);

  const luck = useLuck ? totalLuck(game) : 0;
  const odds = pyramidOdds(level, luck);
  const simValid = sim && sim.level === level && sim.luck === luck;

  const simulate = () => {
    const counts = Object.fromEntries(TIERS.map((t) => [t.id, 0])) as Record<TierId, number>;
    for (let i = 0; i < DEBUG.simulateSalvages; i++) counts[rollTier(level, luck, Math.random).id] += 1;
    setSim({ level, luck, counts });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet debug" role="dialog" aria-label="Debug tools" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong className="mono warn">DEBUG</strong>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <h3>Drop pyramid check</h3>
        <div className="pyramid-controls">
          <label htmlFor="pyr-level" className="mono">
            Workbench Lv {level}
          </label>
          <input
            id="pyr-level"
            type="range"
            min={1}
            max={WORKBENCH.maxLevel}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
          />
          <label className="check small" htmlFor="pyr-luck">
            <input id="pyr-luck" type="checkbox" checked={useLuck} onChange={(e) => setUseLuck(e.target.checked)} />
            Include current luck (+{(totalLuck(game) * 100).toFixed(1)}%)
          </label>
        </div>
        <table className="odds-table mono">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Unlock</th>
              <th>Odds</th>
              <th>{simValid ? `Rolled ${formatNumber(DEBUG.simulateSalvages)}` : ''}</th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.id} className={odds[t.id] > 0 ? '' : 'locked-row'}>
                <td style={{ color: t.colour }}>{t.name.replace(' Tech', '')}</td>
                <td>Lv {t.unlockLevel}</td>
                <td>{odds[t.id] > 0 ? formatPercent(odds[t.id]) : '0% locked'}</td>
                <td>{simValid ? `${sim.counts[t.id]} (${formatPercent((sim.counts[t.id] / DEBUG.simulateSalvages) * 100)})` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="chips">
          <button className="btn btn-small" onClick={simulate}>
            Roll {formatNumber(DEBUG.simulateSalvages)} salvages at Lv {level}
          </button>
          <button className="btn btn-small" onClick={() => setLevel(game.workbench.level)}>
            Back to current Lv {game.workbench.level}
          </button>
        </div>
        <p className="small muted">
          Your salvages this session:{' '}
          {TIERS.filter((t) => game.stats.salvagesByTier[t.id] > 0)
            .map((t) => `${t.name.replace(' Tech', '')} ${game.stats.salvagesByTier[t.id]}`)
            .join(' · ') || 'none yet'}
        </p>

        <h3>Currency</h3>
        <div className="chips">
          {DEBUG.tokenCheats.map((n) => (
            <button key={`t${n}`} className="btn btn-small" onClick={() => d.addTokens(n)}>
              +{formatNumber(n)} Tokens
            </button>
          ))}
          {DEBUG.scrapCheats.map((n) => (
            <button key={`s${n}`} className="btn btn-small" onClick={() => d.addScrap(n)}>
              +{formatNumber(n)} Scrap
            </button>
          ))}
          <button className="btn btn-small" onClick={d.addLevel}>
            +1 player level
          </button>
        </div>

        <h3>Workbench</h3>
        <div className="chips">
          <button className="btn btn-small" onClick={() => d.setWorkbenchLevel(game.workbench.level - 1)}>
            Lv −1
          </button>
          <button className="btn btn-small" onClick={() => d.setWorkbenchLevel(game.workbench.level + 1)}>
            Lv +1 (ignores cap)
          </button>
          <button className="btn btn-small" onClick={d.finishUpgrade} disabled={game.workbench.upgradeEndsAt === null}>
            Finish upgrade now
          </button>
        </div>

        <h3>Battle</h3>
        <div className="chips">
          {ZONES.map((z) => (
            <button
              key={z.id}
              className={`btn btn-small ${game.zone === z.id ? 'btn-primary' : ''}`}
              onClick={() => d.unlockZone(z.id)}
            >
              Z{z.id}
            </button>
          ))}
        </div>
        <div className="chips">
          <button className={`btn btn-small ${game.debug.godMode ? 'btn-primary' : ''}`} onClick={() => d.setGodMode(!game.debug.godMode)}>
            God mode {game.debug.godMode ? 'on' : 'off'}
          </button>
          {DEBUG.speedOptions.map((s) => (
            <button
              key={s}
              className={`btn btn-small ${game.debug.speed === s ? 'btn-primary' : ''}`}
              onClick={() => d.setSpeed(s)}
            >
              Speed ×{s}
            </button>
          ))}
        </div>

        <h3>Luck and forced drops</h3>
        <div className="chips">
          {DEBUG.luckOptions.map((l) => (
            <button
              key={l}
              className={`btn btn-small ${game.debug.luckBonus === l ? 'btn-primary' : ''}`}
              onClick={() => d.setLuck(l)}
            >
              Luck +{l * 100}%
            </button>
          ))}
        </div>
        <div className="chips">
          <button
            className={`btn btn-small ${game.debug.forceTier === null ? 'btn-primary' : ''}`}
            onClick={() => d.setForceTier(null)}
          >
            Force tier: off
          </button>
          {TIERS.map((t) => (
            <button
              key={t.id}
              className={`btn btn-small tier-chip ${game.debug.forceTier === t.id ? 'selected' : ''}`}
              style={{ '--tier': t.colour } as CSSProperties}
              onClick={() => d.setForceTier(t.id)}
            >
              {t.name.replace(' Tech', '')}
            </button>
          ))}
        </div>
        <p className="small muted">Forcing a tier ignores the pyramid. It's for testing visuals only.</p>

        <h3>Rare drop moment</h3>
        <div className="chips">
          {TIERS.filter((t) => t.moment).map((t) => (
            <button
              key={t.id}
              className="btn btn-small tier-chip"
              style={{ '--tier': t.colour } as CSSProperties}
              onClick={() => {
                onClose();
                d.testMoment(t.id);
              }}
            >
              {t.name.replace(' Tech', '')}
            </button>
          ))}
        </div>

        <h3>Pacing</h3>
        <p className="mono small">
          Play time {formatClock(game.clock)} · kills {game.stats.kills} · deaths {game.stats.deaths} · salvages{' '}
          {game.stats.salvages}
        </p>
        <p className="mono small muted">
          {Object.entries(game.stats.zoneReachedAt)
            .map(([z, t]) => `Z${z} ${formatClock(t)}`)
            .join(' · ')}
          {game.stats.bossReachedAt[10] !== undefined && ` · Z10 boss ${formatClock(game.stats.bossReachedAt[10])}`}
        </p>

        <div className="chips">
          <button className="btn btn-small btn-danger" onClick={d.reset}>
            Reset game
          </button>
        </div>
      </div>
    </div>
  );
}
