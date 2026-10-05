import Phaser from 'phaser';
import { useEffect, useRef, useState } from 'react';
import { BATTLE, UI } from '../data/config';
import { LINES } from '../data/lines';
import { getEnemyDef, isBossWave, zoneDef } from '../game/battle';
import { maxSelectableZone } from '../game/game';
import { bus, getBattle, useGame } from '../game/store';
import { BattleScene, SCENE_H, SCENE_W } from '../battle/BattleScene';

/** The battle: Phaser canvas plus a crisp DOM HUD and Nobody's thought bubbles. */
export function BattleView() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: host.current!,
      width: SCENE_W,
      height: SCENE_H,
      pixelArt: true,
      backgroundColor: '#0b0d10',
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      audio: { noAudio: true },
      banner: false,
      scene: [BattleScene],
    });
    return () => game.destroy(true);
  }, []);

  return (
    <section className="battle" aria-label="Battle">
      <div ref={host} className="battle-canvas" />
      <Hud />
      <Bubble />
    </section>
  );
}

function Hud() {
  const zone = useGame((s) => s.game.zone);
  const maxZone = useGame((s) => maxSelectableZone(s.game));
  const changeZone = useGame((s) => s.changeZone);
  const waveRef = useRef<HTMLSpanElement>(null);
  const bossRef = useRef<HTMLDivElement>(null);
  const bossName = useRef<HTMLSpanElement>(null);
  const bossHp = useRef<HTMLDivElement>(null);
  const bossTime = useRef<HTMLDivElement>(null);
  const bossSecs = useRef<HTMLSpanElement>(null);

  // The battle changes every frame; write straight to the DOM instead of re-rendering.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const b = getBattle();
      const boss = isBossWave(b);
      if (waveRef.current) {
        waveRef.current.textContent = boss ? 'Boss' : `Wave ${b.wave}/${BATTLE.wavesPerZone}`;
      }
      const enemy = b.enemies.find((e) => e.boss);
      if (bossRef.current) bossRef.current.hidden = !boss || b.phase === 'advancing';
      if (boss && bossName.current) bossName.current.textContent = getEnemyDef(zoneDef(b.zone).boss).name;
      if (bossHp.current) bossHp.current.style.width = `${enemy ? (enemy.hp / enemy.maxHp) * 100 : 0}%`;
      const t = b.bossTimeLeft ?? BATTLE.bossTimeLimit;
      if (bossTime.current) {
        bossTime.current.style.width = `${(t / BATTLE.bossTimeLimit) * 100}%`;
        bossTime.current.classList.toggle('urgent', t < 8);
      }
      if (bossSecs.current) bossSecs.current.textContent = `${Math.ceil(t)}s`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      <div className="hud-zone">
        <button
          className="zone-btn"
          aria-label="Previous zone"
          disabled={zone <= 1}
          onClick={() => changeZone(zone - 1)}
        >
          ‹
        </button>
        <div className="zone-label">
          <span className="mono">
            Zone {zone} – <span ref={waveRef}>Wave 1/10</span>
          </span>
          <span className="zone-name">{zoneDef(zone).name}</span>
        </div>
        <button
          className="zone-btn"
          aria-label="Next zone"
          disabled={zone >= maxZone}
          onClick={() => changeZone(zone + 1)}
        >
          ›
        </button>
      </div>
      <div className="hud-boss" ref={bossRef} hidden>
        <div className="boss-head">
          <span ref={bossName} className="boss-name" />
          <span ref={bossSecs} className="mono boss-secs" />
        </div>
        <div className="boss-bar">
          <div ref={bossHp} className="boss-hp" />
        </div>
        <div className="boss-timer">
          <div ref={bossTime} className="boss-time" />
        </div>
      </div>
    </>
  );
}

/** Nobody's thought bubbles. Important lines show at once; others wait for a cooldown. */
function Bubble() {
  const [text, setText] = useState<string | null>(null);
  const [key, setKey] = useState(0);
  const last = useRef(0);
  const hideTimer = useRef<number>(0);

  useEffect(() => {
    const show = (line: string) => {
      last.current = performance.now();
      setText(line);
      setKey((k) => k + 1);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setText(null), UI.bubbleDurationMs);
    };
    const off = bus.on((e) => {
      if (e.t !== 'say') return;
      if (e.priority || performance.now() - last.current > UI.bubbleCooldownMs) show(e.text);
    });
    const idle = window.setInterval(() => {
      if (performance.now() - last.current > UI.idleQuipMs) {
        show(LINES.idle[Math.floor(Math.random() * LINES.idle.length)]);
      }
    }, 5000);
    return () => {
      off();
      window.clearInterval(idle);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  if (!text) return null;
  return (
    <div
      key={key}
      className="bubble"
      style={{ left: `${(BATTLE.playerX / SCENE_W) * 100}%` }}
      role="status"
    >
      {text}
    </div>
  );
}
