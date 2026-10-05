import { CONFIG } from '../data/config';
import { SPOTS, UPGRADES } from '../data/upgrades';
import { formatNumber } from '../game/format';
import { bagCapacity, isMaxed, nextSpot, tapPower, upgradeCost } from '../game/logic';
import { useGame } from '../game/store';
import type { GameState, UpgradeId } from '../game/types';

const CURRENT_VALUE: Record<UpgradeId, (s: GameState) => string> = {
  tapPower: (s) => `${(tapPower(s) / CONFIG.searchCost).toFixed(2)} drops per tap`,
  bagSize: (s) => `${bagCapacity(s)} slots`,
};

export function Upgrades() {
  const game = useGame((s) => s.game);
  const buyUpgrade = useGame((s) => s.buyUpgrade);
  const buyNextSpot = useGame((s) => s.buyNextSpot);

  const spot = SPOTS[game.spotIndex];
  const next = nextSpot(game);

  return (
    <ul className="list">
      {Object.values(UPGRADES).map((def) => {
        const level = game.upgrades[def.id];
        const maxed = isMaxed(game, def.id);
        const cost = upgradeCost(def.id, level);
        return (
          <li key={def.id} className="row upgrade">
            <div className="row-head">
              <span className="upgrade-name">{def.name}</span>
              <span className="mono muted">
                Lv {level}/{def.maxLevel}
              </span>
            </div>
            <p className="desc">{def.description}</p>
            <div className="row-sub">
              <span className="mono muted small">
                {CURRENT_VALUE[def.id](game)}
                {!maxed && ` · ${def.effectLabel}`}
              </span>
              <BuyButton maxed={maxed} cost={cost} tokens={game.tokens} onBuy={() => buyUpgrade(def.id)} />
            </div>
          </li>
        );
      })}

      <li className="row upgrade">
        <div className="row-head">
          <span className="upgrade-name">Better Scavenging Spot</span>
          <span className="mono muted">
            {game.spotIndex + 1}/{SPOTS.length}
          </span>
        </div>
        <p className="desc">
          Now: <span className="mono">{spot.name}</span>. {spot.description}
        </p>
        {next ? (
          <p className="desc">
            Next: <span className="mono">{next.name}</span>. {next.description}
          </p>
        ) : null}
        <div className="row-sub">
          <span className="mono muted small">Luck ×{spot.luck}{next && ` → ×${next.luck}`}</span>
          <BuyButton maxed={!next} cost={next?.cost ?? 0} tokens={game.tokens} onBuy={buyNextSpot} />
        </div>
      </li>
    </ul>
  );
}

function BuyButton(props: { maxed: boolean; cost: number; tokens: number; onBuy: () => void }) {
  if (props.maxed) return <span className="mono accent small">MAXED</span>;
  // Stays clickable when unaffordable so Nobody can complain about it.
  return (
    <button
      className={`btn btn-small ${props.tokens >= props.cost ? 'btn-primary' : 'btn-dim'}`}
      onClick={props.onBuy}
    >
      <span className="mono">{formatNumber(props.cost)} T</span>
    </button>
  );
}
