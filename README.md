# Wiped: Idle Hacker

Cyberpunk idle game for mobile. See `GAME_DESIGN.md` for the design and `CLAUDE.md` for project rules.

## Run in your browser

Needs Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The orange **DEBUG** button (bottom right) opens the debug panel.
To try it on your phone, open the "Network" URL Vite prints while on the same Wi-Fi.

## Tune balance

Everything lives in `src/data/`:

| File | What's in it |
|---|---|
| `tiers.ts` | Tier names, colours, base drop rates, flash strength |
| `items.ts` | Items, sell values, joke descriptions, weight within a tier |
| `upgrades.ts` | Upgrade costs and effects, scavenging spots and their luck |
| `config.ts` | Taps per drop, starting bag size, feed length, debug options |
| `lines.ts` | Nobody's lines |

## Other commands

```bash
npm test           # logic tests
npm run typecheck
npm run build      # production build into dist/
```
