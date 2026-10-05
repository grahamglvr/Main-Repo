# Wiped: Idle Hacker

Cyberpunk idle game for mobile. Browser first, packaged for iOS/Android later.
**`GAME_DESIGN.md` is the source of truth.** Read the relevant section before building anything. This file holds the rules that apply everywhere.

## Stack
- Vite + React + TypeScript. Game logic in plain TS modules, not in React components.
- Capacitor for iOS/Android, added at build step 11. Don't add it earlier.
- Plain CSS with CSS variables for the palette. No UI framework.
- Vitest for logic tests (drop rolls, economy maths).

## Project rules
- **Data-driven.** Items, tiers, drop rates, upgrades, costs and text live in `src/data/` config files. Never hard-code balance numbers in logic or UI.
- **Build in order.** Only build the current build step. Don't add features from later steps.
- Keep a debug panel for testing (boosted drops, currency cheats, later time skip).
- Short number formatting everywhere (1.2K, 3.4M, 5.6B).

## Terminology (use exactly)
Nobody (player character) · NET · DEX · DEX Upgrades · Tuner · Firewalls · The Groves · The Spires · Tokens (main currency) · Static (overload meter) · Wiped (prestige) · Echoes (prestige currency) · Data Logs.
Full definitions: `GAME_DESIGN.md` section 3.

## Loot tier colours
| Tier | Colour | Base rate |
|---|---|---|
| Old Tech | `#C4925C` | 50% |
| Basic Tech | `#A9B8C2` | 25% |
| Commercial Tech | `#19E3C8` | 13% |
| Industrial Tech | `#7C8CFF` | 7% |
| Military Tech | `#FF4F8B` | 3.5% |
| AI Tech | `#F2B705` | 1.2% |
| Celestial Tech | `#E8F7FF` + prismatic shimmer | 0.3% |

## UI palette
Background `#0B0D10` · Panels `#151A1F` · Borders `#2A333C` · Main text `#E6EDF3` · Secondary text `#7D8A96` · Accent `#B6FF3B` · Static/warnings `#FF7A2F`.
UI stays dark and muted so loot colours are the brightest things on screen. Monospace for numbers, item names and the drop feed; clean sans-serif for everything else.

## Tone of voice
- Nobody narrates: sarcastic, fourth-wall-breaking, knows it's a mobile game, mocks the grind.
- The Spires: cheerful corporate slogans over horrible policies.
- Every line is short and punchy. One or two lines max. Every item gets a one-line joke description.
- Examples: `GAME_DESIGN.md` sections 5 and 8.

## Build order
1. Core loop: tap to scavenge, drops with tiers, sell for Tokens, basic upgrades
2. Save system and offline earnings
3. Stages 1–3 with automation and scripts
4. Skill tree
5. DEX and DEX Upgrade slots, Tuner
6. Stage 4: NET hacking, Firewalls, Static
7. Prestige (Wiped, Echoes, Echo upgrades, collection log)
8. Story layer: narration, messages, Data Logs, Spire broadcasts
9. Rare drop effects, sound and polish
10. Stages 5–6
11. Mobile packaging (Capacitor) and store builds

**Current step: 1 done. Next: 2.**

## Commands
- `npm install` then `npm run dev` → http://localhost:5173 (debug panel button bottom right)
- `npm test` · `npm run typecheck` · `npm run build`

## Layout
- `src/data/` balance and text: tiers, items, upgrades and spots, config, Nobody's lines
- `src/game/` pure logic (drops, tapping, selling, upgrades) plus the zustand store
- `src/ui/` React components; `src/styles.css` holds the palette as CSS variables
