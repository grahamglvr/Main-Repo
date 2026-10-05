# Wiped: Idle Hacker

Cyberpunk idle RPG for mobile, loosely in the style of Forge Master. Browser first, packaged for iOS/Android later.
**`GAME_DESIGN.md` is the source of truth.** Read the relevant section before building anything. This file holds the rules that apply everywhere.

## Stack
- Vite + React + TypeScript. Phaser 4 draws the battle scene; React does the Workbench, item cards, tabs and HUD text.
- Game rules are plain TS in `src/game/` (no React, no Phaser). Phaser and React only read state and react to events from the `bus`.
- Capacitor for iOS/Android at build step 10. Don't add it earlier.
- Plain CSS with CSS variables for the palette. No UI framework.
- Vitest for logic tests. `npm run sim` is the pacing simulator: it plays the real rules with a "normal player".

## Project rules
- **Data-driven.** Enemies, zones, items, tiers, the drop pyramid, costs, timers and text live in `src/data/`. Never hard-code balance numbers in logic or UI.
- **Build in order.** Only build the current build step. Don't add features from later steps.
- **Check pacing after balance changes.** Run `npm run sim`; zone 10 boss should land at 45–60 minutes (median). `src/game/pacing.test.ts` guards it.
- Locked drop tiers are always exactly 0%. Luck can never make a locked tier drop.
- Debug tools are off by default, behind Settings → Debug tools.
- Short number formatting everywhere (1.2K, 3.4M, 5.6B).
- Placeholder art is pixel grids in `src/battle/art/sprites.ts`; keep texture keys stable so real art can replace them.

## Terminology (use exactly)
Nobody (player) · NET · DEX · DEX Upgrades · Tuner · Workbench · Scrap · Firewalls · The Groves · The Spires · Tokens · Crew · Static · Wiped (prestige) · Echoes · Data Logs.
Full definitions: `GAME_DESIGN.md` section 3.

## Loot tiers
| Tier | Colour | Unlocks at Workbench Lv |
|---|---|---|
| Old Tech | `#C4925C` | 1 |
| Basic Tech | `#A9B8C2` | 3 |
| Commercial Tech | `#19E3C8` | 8 |
| Industrial Tech | `#7C8CFF` | 18 |
| Military Tech | `#FF4F8B` | 28 |
| AI Tech | `#F2B705` | 38 |
| Celestial Tech | `#E8F7FF` + prismatic shimmer | 55 |

## UI palette
Background `#0B0D10` · Panels `#151A1F` · Borders `#2A333C` · Main text `#E6EDF3` · Secondary text `#7D8A96` · Accent `#B6FF3B` · Static/warnings `#FF7A2F`.
UI stays dark and muted so loot colours are the brightest things on screen. Monospace for numbers, item names and stats; clean sans-serif for everything else.

## Tone of voice
- Nobody narrates in thought bubbles: sarcastic, fourth-wall-breaking, knows it's a mobile game, mocks the grind.
- The Spires: cheerful corporate slogans over horrible policies.
- Every line is short and punchy. One or two lines max. Every item gets a one-line joke description.
- Examples: `GAME_DESIGN.md` sections 8 and 13.

## Build order
1. First playable: Scrapper stage, zones 1–10 (battle, Workbench, drop pyramid, gear, XP, rare drop moments)
2. Save system and offline earnings
3. Skill tree and active skills
4. Tinker and Patcher stages (zones 11–30): DEX, DEX Upgrades, Tuner, Crew, auto-salvage
5. Hacker stage (zones 31–40): NET scene switch, Firewall enemies, Static
6. Prestige (Wiped, Echoes, Echo upgrades, collection log)
7. Story layer: past-self messages, Data Logs, Spire broadcasts
8. Final art, sound and polish
9. Creator and Ascendant stages (zones 41–60)
10. Mobile packaging (Capacitor) and store builds

**Current step: 1 done. Next: 2.**

## Commands
- `npm install` then `npm run dev` → http://localhost:5173
- `npm test` · `npm run typecheck` · `npm run build`
- `npm run sim [seeds]` pacing check · `npm run pyramid [luck]` drop pyramid table for Workbench Lv 1–60
- `npm run build:play` → single-file `dist-play/wiped.html` for the playtest link

## Layout
- `src/data/` tiers, pyramid, items, gear slots and bonus stats, enemies, zones, config (player, Workbench, battle, UI, debug), lines
- `src/game/` rules: `battle.ts` (auto-combat), `game.ts` (economy, zones, Workbench, actions), `pyramid.ts`, `items.ts`, `stats.ts`, `sim.ts`; `store.ts` connects to React and Phaser
- `src/battle/` Phaser scene and placeholder pixel art
- `src/ui/` React components; `src/styles.css` holds the palette as CSS variables
