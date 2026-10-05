import { useState, type CSSProperties } from 'react';
import { CONFIG } from '../data/config';
import { TIERS } from '../data/tiers';
import { simulateTierCounts, tierOdds } from '../game/drops';
import { formatNumber, formatPercent } from '../game/format';
import { effectiveLuck } from '../game/logic';
import { useGame } from '../game/store';
import type { TierId } from '../game/types';

export function DebugPanel({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game);
  const store = useGame();
  const [sim, setSim] = useState<Record<TierId, number> | null>(null);

  const luck = effectiveLuck(game);
  const odds = tierOdds(luck);
  const sessionTotal = Object.values(game.stats.drops).reduce((a, b) => a + b, 0);

  return (
    <div className="debug-backdrop" onClick={onClose}>
      <div className="debug" onClick={(e) => e.stopPropagation()}>
        <div className="debug-head">
          <strong className="mono">DEBUG</strong>
          <button className="btn btn-small" onClick={onClose}>
            Close
          </button>
        </div>

        <h3>Tokens</h3>
        <div className="chips">
          {CONFIG.debug.tokenCheats.map((amount) => (
            <button key={amount} className="btn btn-small" onClick={() => store.debugAddTokens(amount)}>
              +{formatNumber(amount)}
            </button>
          ))}
        </div>

        <h3>Drop luck boost</h3>
        <div className="chips">
          {CONFIG.debug.luckOptions.map((l) => (
            <button
              key={l}
              className={`btn btn-small ${game.debug.luck === l ? 'btn-primary' : ''}`}
              onClick={() => store.debugSetLuck(l)}
            >
              ×{l}
            </button>
          ))}
        </div>

        <h3>Force every drop to tier</h3>
        <div className="chips">
          <button
            className={`btn btn-small ${game.debug.forceTier === null ? 'btn-primary' : ''}`}
            onClick={() => store.debugSetForceTier(null)}
          >
            Off
          </button>
          {TIERS.map((t) => (
            <button
              key={t.id}
              className={`btn btn-small tier-chip ${game.debug.forceTier === t.id ? 'selected' : ''}`}
              style={{ '--tier': t.colour } as CSSProperties}
              onClick={() => store.debugSetForceTier(t.id)}
            >
              {t.name.replace(' Tech', '')}
            </button>
          ))}
        </div>

        <h3>Test flash</h3>
        <div className="chips">
          {TIERS.filter((t) => t.flash).map((t) => (
            <button
              key={t.id}
              className="btn btn-small tier-chip"
              style={{ '--tier': t.colour } as CSSProperties}
              onClick={() => store.debugFlash(t.id)}
            >
              {t.name.replace(' Tech', '')}
            </button>
          ))}
        </div>

        <h3>
          Odds at luck ×{+luck.toFixed(3)}
          {game.debug.forceTier && <span className="warn"> (forced tier overrides these)</span>}
        </h3>
        <table className="odds mono">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Expected</th>
              <th>Session ({sessionTotal})</th>
              {sim && <th>Sim {formatNumber(CONFIG.debug.simulateRolls)}</th>}
            </tr>
          </thead>
          <tbody>
            {odds.map(({ tier, chance }) => {
              const count = game.stats.drops[tier.id];
              return (
                <tr key={tier.id}>
                  <td style={{ color: tier.colour }}>{tier.name.replace(' Tech', '')}</td>
                  <td>{formatPercent(chance)}</td>
                  <td>
                    {count}
                    {sessionTotal > 0 && (
                      <span className="muted"> {formatPercent((count / sessionTotal) * 100)}</span>
                    )}
                  </td>
                  {sim && <td>{formatPercent((sim[tier.id] / CONFIG.debug.simulateRolls) * 100)}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="chips">
          <button
            className="btn btn-small"
            onClick={() => setSim(simulateTierCounts(luck, CONFIG.debug.simulateRolls, Math.random))}
          >
            Simulate {formatNumber(CONFIG.debug.simulateRolls)} rolls
          </button>
        </div>

        <h3>Session</h3>
        <p className="mono muted small">
          Taps: {formatNumber(game.stats.taps)} · Tokens earned: {formatNumber(game.stats.tokensEarned)}
        </p>
        <div className="chips">
          <button className="btn btn-small btn-danger" onClick={store.debugReset}>
            Reset game
          </button>
        </div>
      </div>
    </div>
  );
}
