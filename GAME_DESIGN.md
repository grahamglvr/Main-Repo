# Wiped: Idle Hacker — Game Design Document

## 1. Overview

A cyberpunk dystopian idle RPG for mobile (iOS and Android). The player starts as a broke nobody in a wasteland slum with a bent pipe and no tech, and works their way up to hacking the megacorporations that run the world.

The structure is loosely inspired by idle RPGs like Forge Master: a battle you watch at the top of the screen, and a loot machine you tap underneath. The loot you make is equipped and makes the battle go better. The theme, humour, mechanics and story are our own.

Core pillars:
- **Something to watch.** Nobody fights waves of enemies on screen, with health bars, damage numbers and bosses.
- **Grinding for drops.** A Workbench turns scrap into random gear. Its level sets a drop pyramid, so higher tiers only appear as you upgrade it. The 1% drops feel huge.
- **Gear that matters.** Every item has stats, goes into a gear slot, and visibly changes Nobody.
- **Skill tree.** Spend points to make things faster, stronger, luckier and more automated.
- **Prestige.** Reset for a permanent currency that makes each run faster.
- **Tongue-in-cheek tone.** A grim world narrated by a sarcastic, fourth-wall-breaking main character.

## 2. Tone

The world is bleak but the main character, **Nobody**, refuses to take any of it seriously. Nobody narrates the game, knows they're in a mobile game, and mocks the grind, the drop rates, the prestige resets and the corporations. The corporations are a satire of big tech: cheerful slogans over horrible policies.

All text (narration, item descriptions, messages) should be short, punchy and funny. One or two lines maximum.

## 3. Terminology

| Term | Meaning |
|---|---|
| **Nobody** | The player character. Named this because they don't exist in the system. |
| **NET** (Neural Exchange Territory) | The network that replaced the old World Wide Web. You connect directly with your mind. |
| **DEX** (Data EXchanger) | The player's hacking device. Unlocks at the Tinker stage. |
| **DEX Upgrades** | Parts fitted to the DEX for extra bonuses. |
| **Tuner** | Back-alley technician who fits and upgrades DEX Upgrades. |
| **Workbench** | Where Nobody salvages scrap into random gear. The game's loot machine. |
| **Scrap** | Dropped by enemies. Spent at the Workbench. |
| **Firewalls** | Security programs. The enemies once the fight moves into the NET. |
| **The Groves** | The wasteland slum where the player starts. Once lush and green, now drained and full of dumped e-waste. |
| **The Spires** | The corporations that run everything. |
| **Tokens** | Main currency. Used for Workbench upgrades and more. |
| **Crew** | Companions that fight alongside Nobody. |
| **Static** | Overload meter. Builds when pushing too hard. |
| **Wiped** | The prestige reset. |
| **Echoes** | Prestige currency. Fragments of past selves that survive in the NET. |
| **Data Logs** | Collectible story drops. |

## 4. Screen layout

Portrait mobile layout, three areas:

1. **Top half: the battle scene.** Side-on, Nobody on the left fighting waves coming from the right. Health bars, floating damage numbers, crits, loot and Scrap popping out of defeated enemies. Zone and wave indicator (e.g. "Zone 3 – Wave 4/10"). Active skill buttons along the bottom edge of the scene.
2. **Middle: the Workbench.** A large tappable Workbench with the Scrap count and the Workbench level. Tapping salvages an item, which pops up as a card showing its tier colour, stats and a comparison with what's equipped (green up arrows, red down arrows), with **Equip** and **Sell** buttons.
3. **Bottom: tabs.** Gear, Skills, Crew, Collection, and later DEX and Echoes.

Tokens, Scrap and player level sit in a thin bar at the top.

## 5. Progression stages

| # | Stage | Zones | Battle setting | Unlocks |
|---|---|---|---|---|
| 1 | **Scrapper** | 1–10 | Back alleys of the Groves | Battle, Workbench, gear slots |
| 2 | **Tinker** | 11–20 | Scrapyards and repair stalls | DEX and DEX Upgrade slots, Tuner, first Crew |
| 3 | **Patcher** | 21–30 | Edge of the Groves, public NET terminals | Skill tree fully open, auto-salvage, offline earnings boost |
| 4 | **Hacker** | 31–40 | **The NET** | Firewall enemies, Static, first Wipe available |
| 5 | **Creator** | 41–50 | Deep NET, Spire research servers | Crafting: combine items, assemble AI Tech |
| 6 | **Ascendant** | 51–60 | The crash site and Celestial signal | Endgame, Celestial hunt |

The switch to the NET at zone 31 should be a big moment: new visuals, new music, new enemy types, same core mechanics.

## 6. Battle

### Basics
- Nobody fights automatically. Enemies walk in from the right in waves.
- Stats: **Damage, Health, Attack speed, Crit chance, Crit damage**, plus bonus stats from gear.
- Each zone has **10 waves** of 2–5 enemies, then a **boss** with a timer (e.g. 30 seconds).
- Beat the boss to unlock the next zone. If Nobody dies or the timer runs out, they drop back to wave 1 of the current zone and keep farming. This is the progression wall: the player needs better gear to push on.
- Players can move back to any cleared zone.
- Enemy health and damage scale up each zone (starting point: ×1.12 per zone). Bosses have about 8× a normal enemy's health.

### Active skills
- Unlocked through the skill tree and levels. Used by tapping, on a cooldown, with an auto-cast toggle unlocked later.
- Examples: **Pipe Swing** (big hit), **Junk Grenade** (area damage), **Patch Up** (heal), **Overclock** (double speed).

### Enemies by stage
- **Scrapper:** sewer rats, feral dogs, rival scrappers, broken service bots. Bosses: the Scrapyard Hound (laser eye), a Spire Clean-up Truck.
- **Tinker:** scrapyard gangs, guard turrets, scavenger drones.
- **Patcher:** Spire patrol drones, enforcers, surveillance units.
- **Hacker:** Firewall programs, trackers, security daemons. Bosses: server cores.
- **Creator:** corporate AI constructs.
- **Ascendant:** whatever is guarding the crash site.

### Drops from enemies
- Every enemy drops **Scrap** and **Tokens**.
- Small chance of a direct item drop.
- Bosses drop a **boss crate**: one guaranteed item, rolled at Workbench level +5 (capped at 60). This is the only way to get an early glimpse of the next tier.
- Rare **Data Log** drops.

### Visual feedback
- Floating damage numbers, bigger and coloured for crits.
- Hit flash and knockback on enemies.
- Loot and Scrap arc out of defeated enemies.
- Nobody's thought bubbles with one-liners at key moments.

## 7. The Workbench

The Workbench is the loot machine. It replaces the forge from games like Forge Master.

- **Tap to salvage:** each salvage costs Scrap and produces one random item.
- The item's **tier** is rolled on the drop pyramid for the current **Workbench level** (section 8).
- The item's **slot** is random. Its **item level** is based on the Workbench level, with a small random spread, so two items of the same tier can differ.
- **Equip or Sell:** a card shows the item, its stats and a comparison with the equipped item. Selling gives Tokens.
- **Upgrading the Workbench** costs Tokens and takes real time (a timer). Early upgrades take minutes, later ones hours. This gives players a reason to come back.
- **Workbench level cap:** it can't exceed the highest zone cleared + 5, so fighting and upgrading stay in step.
- Later upgrades: **Multi-salvage** (several items per tap), **Auto-salvage** (from Patcher stage), and **Auto-sell rules** (e.g. sell everything below Commercial).

## 8. Loot

### Tiers

| Tier | Colour | Unlocks at Workbench level | Example items |
|---|---|---|---|
| Old Tech | `#C4925C` light brown | 1 | Bent pipe, flip phone, floppy disk armour (somehow) |
| Basic Tech | `#A9B8C2` light blue-grey | 3 | Knock-off taser, budget battery pack |
| Commercial Tech | `#19E3C8` aqua | 8 | Retail stun baton, consumer smart jacket |
| Industrial Tech | `#7C8CFF` blue-purple | 18 | Hydraulic glove, drone-motor boots |
| Military Tech | `#FF4F8B` red-pink | 28 | Combat chip, armoured exo-frame |
| AI Tech | `#F2B705` gold | 38 | Mind core fragment, self-learning blade |
| Celestial Tech | `#E8F7FF` diamond, with animated prismatic shimmer | 55 | Tech of unknown origin |

### Drop pyramid

Drop chances are set by the **Workbench level**. Below a tier's unlock level its chance is exactly 0%. As the Workbench levels up, the bottom tier's share shrinks and the weight rolls up to the next tier, so the distribution is always a pyramid that shifts upwards.

Anchor table (percent). Interpolate linearly between anchor levels:

| Workbench level | Old | Basic | Commercial | Industrial | Military | AI | Celestial |
|---|---|---|---|---|---|---|---|
| 1 | 100 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 90 | 10 | 0 | 0 | 0 | 0 | 0 |
| 10 | 70 | 28 | 2 | 0 | 0 | 0 | 0 |
| 20 | 40 | 45 | 14 | 1 | 0 | 0 | 0 |
| 30 | 20 | 40 | 32 | 7.5 | 0.5 | 0 | 0 |
| 40 | 8 | 25 | 40 | 22 | 4.8 | 0.2 | 0 |
| 50 | 2 | 12 | 30 | 38 | 15 | 3 | 0 |
| 60 | 0 | 5 | 18 | 40 | 28 | 8.5 | 0.5 |

Each tier's chance must be 0 before its unlock level, even if interpolation would give a small value. Renormalise so each row totals 100%.

### Modifiers
- **Zone bonus:** each stage cleared gives a small luck bonus (starting point: +3% per stage) to tiers that are already unlocked.
- **Luck** (Street skills, Echo upgrades, gear bonus stats) multiplies the weight of tiers that are already unlocked. It can never make a locked tier drop.
- **Pity counter:** a hidden counter that slowly raises the odds of the highest unlocked tier after a long dry spell, and resets when it drops.
- **Lucky Break** (skill) can bump an item up one tier, but never into a locked tier.
- The anchor table, unlock levels and modifiers live in data files so they can be tuned.

### Rare drop moment

Higher tiers get a light beam in the tier colour from the Workbench, a brief slow-motion, a screen flash and a sound sting. Celestial gets the biggest version, plus a narration line.

### Item descriptions

Every item has a one-line joke description. Examples:
- **Bent pipe (Old):** "Started life as plumbing. Now it's a career."
- **Dial-up modem (Old):** "Makes a noise like a robot being strangled. Peak technology."
- **Budget battery pack (Basic):** "Lasts about as long as a New Year's resolution."
- **Combat chip (Military):** "Designed to win wars. Currently fighting a rat."
- **Mind core fragment (AI):** "It keeps asking if you've considered a career change."

## 9. Gear

### Slots
- **Weapon** (main source of Damage)
- **Head**
- **Body** (main source of Health)
- **Hands**
- **Feet**
- **Gadget**
- **DEX** (from the Tinker stage, with its own DEX Upgrade slots fitted by the Tuner)

### Item stats
- One **main stat** (Damage or Health) based on tier and item level.
- **Bonus stats** by tier: Old and Basic 0, Commercial 1, Industrial 1–2, Military 2, AI 3, Celestial 3 plus a unique effect.
- Bonus stat pool: attack speed, crit chance, crit damage, health regen, Scrap find, Token find, luck, skill cooldown.

### Visible gear

Gear changes how Nobody looks. At minimum the weapon and the body item change the sprite, with a distinct look per tier (a pipe, then a taser, then a stun baton, and so on). A Celestial item should look unlike anything else in the game.

## 10. Skill tree

Skill points come from player levels (XP from fighting). Three branches, each ending in a capstone.

### Hardware (combat and body)
- Damage, health and attack speed
- Extra DEX Upgrade slots
- Static resistance
- Higher offline earnings cap
- **Capstone: Overclock.** Short burst of double speed on a cooldown.

### Software (automation)
- Auto-salvage speed and Multi-salvage
- Skill auto-cast
- Higher offline earnings percentage
- Crew damage
- **Capstone: Self-Writing Code.** Automation slowly improves the longer it runs.

### Street (luck and trading)
- Better Token prices when selling
- Higher luck
- Chance for a salvage to refund its Scrap
- Pity counter builds faster
- Faster Workbench upgrade timers
- **Capstone: Lucky Break.** Small chance any item jumps up a tier.

### Static

Using active skills, Overclock and Multi-salvage builds Static. If it maxes out, Nobody's DEX crashes and they're stunned in battle for a few seconds while Static drains. Hardware skills reduce Static build-up.

## 11. Crew

Companions that fight alongside Nobody, shown in the battle scene. They unlock from the Tinker stage onwards and level up over time.

Examples: a feral cyber-rat that bites ankles, a scavenger kid with a slingshot, a patched-up salvage drone, later a hacked Spire enforcer bot.

## 12. Prestige: Wiped

- **Available from:** the Hacker stage onwards. The Spires trace Nobody and erase their identity.
- **Echoes earned:** starting formula `floor(sqrt(lifetimeTokens / 1,000,000))`, plus bonuses for highest zone reached and AI or Celestial items found. Tune during testing.

| Lost on wipe | Kept |
|---|---|
| Tokens and Scrap | Echoes |
| Zone progress | Echo upgrades |
| Workbench level | Collection log |
| Gear and DEX Upgrades | Data Logs found |
| Skill points and tree | Crew (levels reset to a percentage) |

### Echo upgrades (permanent)
- Start each run with a higher Workbench level
- Faster Workbench upgrade timers
- Higher base luck
- Keep one equipped item through a wipe
- Extra skill point per level
- Start with auto-salvage

### Collection log

A permanent record of every item found, grouped by tier. Unfound items show as silhouettes. Celestial items get a trophy spot.

A second prestige layer can be added in a later update.

## 13. Story

### Background

The old World Wide Web was replaced by the NET. The companies that built it became the Spires and now control everything: food, water, air and who's allowed online. The Groves used to be the greenest part of the city until the Spires drained the land for power and cooling and dumped their old tech there. People in the Groves are cut off from the NET, and without access you don't exist.

### The mystery

Decades ago, something fell from the sky outside the city. The Spires reached it first, buried the story, and built their empire on what they found: Celestial Tech.

### The contact

From early on, Nobody receives anonymous messages with hints and warnings. Later it's revealed they come from Nobody's own past selves: fragments that survived each wipe. That's what Echoes are. The more the player prestiges, the more of the truth they reveal. The past selves are just as sarcastic as Nobody, and mildly annoyed that they keep getting Wiped.

### Story by stage

1. **Scrapper:** survival. A bent pipe and a lot of rats.
2. **Tinker:** first DEX, and the messages start.
3. **Patcher:** first contact with the NET. Realising how much the Spires hide.
4. **Hacker:** fighting into Spire servers, first references to "the Fall". The Spires notice, and the first wipe follows.
5. **Creator:** building tech and assembling AI fragments. Learning the Spires' AI was built on Celestial Tech.
6. **Ascendant:** going after the source. The ending is left open for a later update.

### Delivery
- Short narration lines from Nobody in thought bubbles
- Messages from past selves
- Spire broadcasts (satirical corporate PR)
- **Data Logs** as collectible drops with their own rarity; rarer logs reveal bigger story pieces
- No cutscenes; all story is optional to read

### Example lines

- **First fight:** "A rat. My ancient nemesis. Hit it with the pipe. That's the whole tutorial."
- **First salvage:** "Scrap goes in, mystery junk comes out. Basically the economy."
- **Rare drop:** "Pink! Military grade! I'd like to thank the Workbench, my Scrap, and the 400 rats who made this possible."
- **Celestial drop:** "Okay. That's not from here. That's not from anywhere. I'm going to need a minute. Also, please screenshot this."
- **Dying to a boss:** "In my defence, it had a laser eye. I had a pipe."
- **Returning after offline time:** "Oh, you're back. I fought the whole time you were gone. No, don't thank me. Just look at the number."
- **Static rising:** "My head's buzzing like a cheap speaker. Maybe ease off before I start seeing smells."
- **Getting Wiped:** "Wiped again. New face, new name, same terrible decisions. Let's go."
- **Past self:** "Hey, it's you. Well, it's me. Previous you. Don't open the server in Sector 9. I opened it. That's why you're here. Anyway, good luck."
- **Spire broadcast:** "The Spires remind you: air is a privilege, not a right. Upgrade to Breathe+ today."

## 14. Visual style

### UI palette

The UI stays dark and muted so loot colours are the brightest things on screen.

| Use | Colour |
|---|---|
| Background | `#0B0D10` |
| Panels | `#151A1F` |
| Borders and grid lines | `#2A333C` |
| Main text | `#E6EDF3` |
| Secondary text | `#7D8A96` |
| Accent (buttons, XP) | `#B6FF3B` acid lime |
| Static and warnings | `#FF7A2F` orange |

### Fonts
- Monospace font for numbers, item names and stats (terminal feel)
- Clean sans-serif for general UI

### Battle scene
- Side-on with layered parallax backgrounds: rubble and shacks up close, rain, and the glowing Spires on the skyline.
- Background tint shifts with progress: warmer and rust-tinted in the Groves stages, colder and bluer once in the NET.
- Pixel art suits the style and is the easiest to source.

## 15. Pacing

Targets for a first run without prestige bonuses:

| Milestone | Target time |
|---|---|
| First Basic Tech (Workbench level 3) | 5–10 minutes |
| Zone 10 boss (end of Scrapper) | 45–60 minutes |
| Zone 31 (reach the NET, first Wipe available) | Several days of play |
| First AI Tech | Weeks |
| First Celestial Tech | Long-term goal, many weeks and several Wipes |

- Costs scale exponentially (starting point: ×1.15 per level). No low level caps that max out in minutes.
- Workbench upgrade timers start at about 30 seconds and grow to hours.
- Debug cheats must be off by default and hidden behind a debug toggle, so normal testing reflects real pacing.

## 16. Technical notes (recommendations, to confirm with Claude Code)

- **Stack:** TypeScript web app (Vite), with a 2D game engine such as Phaser or PixiJS for the battle scene, and React or plain HTML for the Workbench, item cards and tabs. Wrapped for iOS and Android with Capacitor. Easy to test in a browser during development.
- **Art:** start with animated placeholder sprites, then swap in a pixel art asset pack (check the licence allows commercial use) or custom art. Keep sprites in an assets folder so they can be replaced without code changes.
- **Big numbers:** use a big-number library (e.g. break_infinity.js) and short number formatting (1.2K, 3.4M, 5.6B...).
- **Save system:** local save on device with regular autosave. Store a timestamp on close.
- **Offline earnings:** on return, simulate battle income (Scrap, Tokens, XP) from elapsed time, capped by the offline cap skill.
- **Data-driven content:** items, tiers, drop pyramid, enemies, zones, skills and costs defined in data files (JSON or TS config), so balance can be tuned without code changes.

## 17. Build order

1. **First playable (Scrapper stage, zones 1–10):** the three-part screen layout, the battle scene with waves and timed bosses, Nobody's stats, the Workbench with salvaging and timed upgrades, the drop pyramid keyed to Workbench level, six gear slots with stats and the equip or sell card, the weapon visibly changing on Nobody, Tokens, Scrap, player XP and levels, rare drop moments, and Nobody's one-liners. Placeholder art is fine but it must be animated and readable. The run to the zone 10 boss must take 45–60 minutes of normal play.
2. Save system and offline earnings
3. Skill tree and active skills
4. Tinker and Patcher stages (zones 11–30): DEX, DEX Upgrades, Tuner, Crew, auto-salvage
5. Hacker stage (zones 31–40): NET scene switch, Firewall enemies, Static
6. Prestige (Wiped, Echoes, Echo upgrades, collection log)
7. Story layer: past-self messages, Data Logs, Spire broadcasts
8. Final art, sound and polish
9. Creator and Ascendant stages (zones 41–60)
10. Mobile packaging (Capacitor) and store builds

## 18. Open questions

- Monetisation (rewarded ads, in-app purchases, or premium)
- Story ending
- Second prestige layer
- PvP or leaderboards
- Final art style
