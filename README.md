# Wiped: Idle Hacker

Cyberpunk idle RPG for mobile. See `GAME_DESIGN.md` for the design and `CLAUDE.md` for project rules.

## Run in your browser

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. To try it on your phone, open the "Network" URL Vite prints while on the same Wi-Fi.
Debug tools are off by default: tap the ⚙ in the top bar and switch on **Debug tools** to get the DEBUG button.

## Check the drop pyramid

- **In the game:** tap the coloured odds bar under the Workbench to see the odds for your current level, with locked tiers at 0%.
- **Debug panel:** "Drop pyramid check" lets you slide to any Workbench level 1–60, see each tier's odds and unlock level, and roll 10,000 salvages to compare real results with the odds.
- **Terminal:** `npm run pyramid` prints the full table for levels 1–60 (`npm run pyramid 0.2` shows it with +20% luck).
- **Tests:** `npm test` checks the anchors, interpolation, 100% totals, and that locked tiers are exactly 0% at every level even with huge luck.

## Check pacing

`npm run sim` plays the real game rules with a normal player (2 salvage taps a second, 2 seconds per item card) over several seeds and prints when each zone and the zone 10 boss is reached.

## Tune balance

Everything lives in `src/data/`:

| File | What's in it |
|---|---|
| `tiers.ts` | Tier colours, unlock levels, stat and sell multipliers, bonus stat counts, rare drop moment strength |
| `pyramid.ts` | Drop pyramid anchor table and stage luck bonus |
| `items.ts` | Item names and joke descriptions, weapon looks |
| `gear.ts` | Gear slots, main stat bases, item level growth, bonus stat pool |
| `enemies.ts` | Enemy and boss stats, rewards, boss intro lines |
| `zones.ts` | Zone names, enemy mixes, bosses |
| `config.ts` | Player stats, Workbench costs and timers, battle timing and scaling, debug options |
| `lines.ts` | Nobody's lines |

## Other commands

```bash
npm test             # logic, pyramid and pacing tests
npm run typecheck
npm run build        # production build into dist/
npm run build:play   # single-file dist-play/wiped.html
```
