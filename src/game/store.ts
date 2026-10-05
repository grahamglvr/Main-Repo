// Connects the pure game rules to React (zustand) and to the Phaser scene (event bus).
import { create } from 'zustand';
import { getTier } from './items';
import * as game from './game';
import type { GameEvent, World } from './game';
import type { BattleState } from './battle';
import type { GameState, TierId } from './types';

type Listener = (e: GameEvent) => void;

/** Game events for the battle scene and UI effects (beams, bubbles, floating numbers). */
export const bus = {
  listeners: new Set<Listener>(),
  on(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  },
  emit(events: GameEvent[]) {
    for (const e of events) for (const fn of this.listeners) fn(e);
  },
};

// The battle changes every frame, so it lives outside React state. The scene reads it directly.
const world: World = game.createWorld();
export function getBattle(): BattleState {
  return world.battle;
}

/** Real-time slow motion for rare drops. */
const slowMo = { until: 0, scale: 1 };
export function battleTimeScale(now = performance.now()): number {
  return now < slowMo.until ? slowMo.scale : 1;
}

interface Store {
  game: GameState;
  debugEnabled: boolean;

  /** Called by the battle scene every frame with real elapsed ms. */
  tick: (realMs: number) => void;
  salvage: () => void;
  equip: () => void;
  sell: () => void;
  upgradeWorkbench: () => void;
  changeZone: (zone: number) => void;

  setDebugEnabled: (on: boolean) => void;
  debug: {
    addTokens: (n: number) => void;
    addScrap: (n: number) => void;
    addLevel: () => void;
    setWorkbenchLevel: (level: number) => void;
    finishUpgrade: () => void;
    unlockZone: (zone: number) => void;
    setLuck: (luck: number) => void;
    setForceTier: (tier: TierId | null) => void;
    setGodMode: (on: boolean) => void;
    setSpeed: (speed: number) => void;
    testMoment: (tier: TierId) => void;
    reset: () => void;
  };
}

function handleEffects(events: GameEvent[]) {
  for (const e of events) {
    if (e.t === 'itemFound') {
      const moment = getTier(e.item.tier).moment;
      if (moment && moment.slowMoMs > 0) {
        slowMo.until = performance.now() + moment.slowMoMs;
        slowMo.scale = moment.slowMoScale;
      }
    }
  }
  bus.emit(events);
}

export const useGame = create<Store>((set, get) => {
  /** Applies a game.Result: stores the new state and broadcasts its events. */
  const apply = ({ game: g, events }: game.Result) => {
    world.game = g;
    set({ game: g });
    handleEffects(events);
  };
  const patch = (fn: (g: GameState) => GameState) => apply({ game: fn(world.game), events: [] });

  return {
    game: world.game,
    debugEnabled: false,

    tick: (realMs) => {
      const ms = Math.min(realMs, 250) * battleTimeScale() * world.game.debug.speed;
      apply(game.tick(world, ms, Math.random));
    },
    salvage: () => apply(game.salvage(world.game, Math.random)),
    equip: () => apply(game.equipPending(world.game, Math.random)),
    sell: () => apply(game.sellPending(world.game)),
    upgradeWorkbench: () => apply(game.startWorkbenchUpgrade(world.game)),
    changeZone: (zone) => apply(game.changeZone(world, zone)),

    setDebugEnabled: (on) => {
      set({ debugEnabled: on });
      if (!on) {
        patch((g) => ({ ...g, debug: { luckBonus: 0, forceTier: null, godMode: false, speed: 1 } }));
      }
    },
    debug: {
      addTokens: (n) => patch((g) => ({ ...g, tokens: g.tokens + n })),
      addScrap: (n) => patch((g) => ({ ...g, scrap: g.scrap + n })),
      addLevel: () => patch((g) => ({ ...g, level: g.level + 1, xp: 0 })),
      setWorkbenchLevel: (level) =>
        patch((g) => ({
          ...g,
          workbench: { level: Math.max(1, Math.min(60, level)), upgradeEndsAt: null, upgradeStartedAt: null },
        })),
      finishUpgrade: () =>
        patch((g) =>
          g.workbench.upgradeEndsAt === null ? g : { ...g, workbench: { ...g.workbench, upgradeEndsAt: g.clock } },
        ),
      unlockZone: (zone) => {
        patch((g) => ({ ...g, highestZoneCleared: Math.max(g.highestZoneCleared, zone - 1) }));
        get().changeZone(zone);
      },
      setLuck: (luck) => patch((g) => ({ ...g, debug: { ...g.debug, luckBonus: luck } })),
      setForceTier: (tier) => patch((g) => ({ ...g, debug: { ...g.debug, forceTier: tier } })),
      setGodMode: (on) => patch((g) => ({ ...g, debug: { ...g.debug, godMode: on } })),
      setSpeed: (speed) => patch((g) => ({ ...g, debug: { ...g.debug, speed } })),
      testMoment: (tier) => {
        // Rolls a real item of that tier onto the card so the whole moment plays.
        const g = { ...world.game, pending: [], debug: { ...world.game.debug, forceTier: tier } };
        const result = game.salvage({ ...g, scrap: g.scrap + game.salvageCost(g.workbench.level) }, Math.random);
        apply({ ...result, game: { ...result.game, debug: world.game.debug, pending: [...world.game.pending, ...result.game.pending] } });
      },
      reset: () => {
        const fresh = game.createWorld();
        world.battle = fresh.battle;
        apply({ game: fresh.game, events: [{ t: 'zoneChanged', zone: 1 }] });
      },
    },
  };
});


// Handy for poking at the game from the browser console during development.
if (import.meta.env.DEV) {
  (window as unknown as Record<string, unknown>).wiped = { useGame, getBattle, bus };
}
