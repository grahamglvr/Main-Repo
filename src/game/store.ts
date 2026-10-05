import { create } from 'zustand';
import { LINES } from '../data/lines';
import { getTier, tierRank } from './drops';
import { pickLine } from './format';
import * as logic from './logic';
import type { GameState, TierDef, TierId, UpgradeId } from './types';

interface Flash {
  key: number;
  tier: TierDef;
}

interface Store {
  game: GameState;
  /** Nobody's latest line under the bin. */
  message: string;
  flash: Flash | null;

  tap: () => void;
  sellItem: (itemId: string, amount?: number) => void;
  sellAll: () => void;
  buyUpgrade: (id: UpgradeId) => void;
  buyNextSpot: () => void;

  debugAddTokens: (amount: number) => void;
  debugSetLuck: (luck: number) => void;
  debugSetForceTier: (tier: TierId | null) => void;
  debugFlash: (tier: TierId) => void;
  debugReset: () => void;
}

let flashKey = 0;

export const useGame = create<Store>((set, get) => ({
  game: logic.createInitialState(),
  message: LINES.intro,
  flash: null,

  tap: () => {
    const { state, drops, bagFull } = logic.tap(get().game, Math.random);
    if (bagFull) {
      set({ message: pickLine(LINES.bagFull) });
      return;
    }
    // Flash for the best tier dropped this tap, if that tier has a flash.
    const best = drops.reduce<TierDef | null>((top, item) => {
      const tier = getTier(item.tier);
      return !top || tierRank(tier.id) > tierRank(top.id) ? tier : top;
    }, null);
    const update: Partial<Store> = { game: state };
    if (best?.flash) update.flash = { key: ++flashKey, tier: best };
    if (logic.bagUsed(state) >= logic.bagCapacity(state)) update.message = pickLine(LINES.bagFull);
    set(update);
  },

  sellItem: (itemId, amount) => {
    set({ game: logic.sellItem(get().game, itemId, amount), message: pickLine(LINES.sold) });
  },

  sellAll: () => {
    if (logic.bagUsed(get().game) === 0) return;
    set({ game: logic.sellAll(get().game), message: pickLine(LINES.sold) });
  },

  buyUpgrade: (id) => {
    const next = logic.buyUpgrade(get().game, id);
    if (next) set({ game: next, message: pickLine(LINES.upgraded) });
    else set({ message: pickLine(LINES.cantAfford) });
  },

  buyNextSpot: () => {
    const next = logic.buyNextSpot(get().game);
    if (next) set({ game: next, message: LINES.moved });
    else set({ message: pickLine(LINES.cantAfford) });
  },

  debugAddTokens: (amount) => {
    const g = get().game;
    set({ game: { ...g, tokens: g.tokens + amount } });
  },
  debugSetLuck: (luck) => {
    const g = get().game;
    set({ game: { ...g, debug: { ...g.debug, luck } } });
  },
  debugSetForceTier: (forceTier) => {
    const g = get().game;
    set({ game: { ...g, debug: { ...g.debug, forceTier } } });
  },
  debugFlash: (tier) => {
    set({ flash: { key: ++flashKey, tier: getTier(tier) } });
  },
  debugReset: () => {
    set({ game: logic.createInitialState(), message: LINES.intro, flash: null });
  },
}));
