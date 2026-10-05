# Wiped: Idle Hacker — Game Design Document

## 1. Overview

A cyberpunk dystopian idle game for mobile (iOS and Android). The player starts as a broke nobody in a wasteland slum with no tech and works their way up to hacking the megacorporations that run the world.

Core pillars:
- **Grinding for drops.** Rarity tiers, chase items at very low drop rates, and a big moment when a rare item lands.
- **Skill tree.** Spend points to make things faster, luckier and more automated.
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
| **DEX** (Data EXchanger) | The player's hacking device. |
| **DEX Upgrades** | Equippable parts that improve the DEX. These are what drops fill. |
| **Tuner** | Back-alley technician who fits DEX Upgrades. |
| **Firewalls** | Security layers on servers. These act as the "enemies" or waves when hacking. |
| **The Groves** | The wasteland slum where the player starts. Once lush and green, now drained and full of dumped e-waste. |
| **The Spires** | The corporations that run everything. |
| **Tokens** | Main currency. |
| **Static** | Overload meter. Builds when pushing for speed. |
| **Wiped** | The prestige reset. |
| **Echoes** | Prestige currency. Fragments of past selves that survive in the NET. |
| **Data Logs** | Collectible story drops. |

## 4. Progression stages

Each stage unlocks new mechanics so the game keeps changing.

| # | Stage | What the player does | Unlocks |
|---|---|---|---|
| 1 | **Scrapper** | Taps bins and e-waste piles in the Groves for scrap. Sells scrap for Tokens. | Basic upgrades (bag size, tap speed, better scavenging spots) |
| 2 | **Tinker** | Repairs junk and sells it. Builds their first DEX. | First automated income, DEX and DEX Upgrade slots, Tuner |
| 3 | **Patcher** | Small hacks: public networks, ATMs, vending machines. | Scripts (offline earnings), skill tree fully open |
| 4 | **Hacker** | Breaches the NET and cracks Spire Firewalls layer by layer. | Server breaches, Firewall waves, Static, first Wipe available |
| 5 | **Creator** | Builds their own tech: writes programmes, crafts DEX Upgrades, assembles AI Tech from fragments. | Crafting, AI Tech assembly |
| 6 | **Ascendant** | Hunts for the source of Celestial Tech. | Endgame content, Celestial hunt |

## 5. Loot

### Tiers

| Tier | Colour | Base drop rate | Example items |
|---|---|---|---|
| Old Tech | `#C4925C` light brown | 50% | 90s/00s processor chips, floppy disks, dial-up modems, flip phones |
| Basic Tech | `#A9B8C2` light blue-grey | 25% | Cheap phone boards, budget batteries, knock-off chargers |
| Commercial Tech | `#19E3C8` aqua | 13% | Retail processors, consumer devices, branded hardware |
| Industrial Tech | `#7C8CFF` blue-purple | 7% | Factory control chips, drone motors, heavy-duty power cells |
| Military Tech | `#FF4F8B` red-pink | 3.5% | Encrypted combat chips, Firewall breakers, armoured parts |
| AI Tech | `#F2B705` gold | 1.2% | Fragments of synthetic minds, self-learning code cores |
| Celestial Tech | `#E8F7FF` diamond, with animated prismatic shimmer | 0.3% | Tech of unknown origin |

Base rates are modified by stage, Street skills, Echo upgrades and the pity counter.

### Drop sources

Each stage has its own drop sources (bins and scrapyards early on, server vaults and Spire data caches later). Higher stages shift the odds towards higher tiers.

### Chase items

Each stage has a few chase items at around 1% or lower that are noticeably powerful when they drop.

### Pity counter

A hidden counter that slowly increases rare drop odds after a long run without one, and resets when a rare item drops.

### Rare drop feedback

Rare drops need a big moment: screen glitch, sound sting and colour flash, scaled by tier. Celestial gets the biggest effect.

### Item descriptions

Every item has a one-line joke description. Examples:
- **Dial-up modem (Old):** "Makes a noise like a robot being strangled. Peak technology."
- **Floppy disk (Old):** "Holds 1.44MB, roughly a third of a cat photo. Priceless."
- **Budget battery (Basic):** "Lasts about as long as a New Year's resolution."
- **Combat chip (Military):** "Designed to win wars. Currently helping you hack a vending machine."
- **Mind core fragment (AI):** "It keeps asking if you've considered a career change."

## 6. Skill tree

Skill points are earned by levelling up (XP from scavenging and hacking). Three branches, each ending in a capstone.

### Hardware (DEX and body)
- Faster scavenging and hacking speed
- Extra DEX Upgrade slots
- Static resistance
- Higher offline earnings cap
- **Capstone: Overclock.** Short burst of double speed on a cooldown.

### Software (automation)
- More script slots
- Faster scripts
- Higher offline earnings percentage
- Auto-collect drops
- **Capstone: Self-Writing Code.** Scripts slowly improve the longer they run.

### Street (luck and trading)
- Better Token prices when selling
- Higher drop luck
- Chance to salvage an item into a higher tier
- Pity counter builds faster
- **Capstone: Lucky Break.** Small chance any drop jumps up a tier.

### Static

Pushing for speed (active tapping, Overclock, aggressive hacking) builds Static. If it maxes out, the DEX crashes and the player is locked out for a short time. Hardware skills reduce Static build-up.

## 7. Prestige: Wiped

- **Available from:** Hacker stage onwards. The Spires trace Nobody and erase their identity.
- **Echoes earned:** starting formula `floor(sqrt(lifetimeTokens / 1,000,000))`, plus bonuses for highest stage reached and AI or Celestial items found. Tune during testing.

| Lost on wipe | Kept |
|---|---|
| Tokens | Echoes |
| Stage progress | Echo upgrades |
| Skill points and tree | Collection log |
| Items and DEX Upgrades | Data Logs found |

### Echo upgrades (permanent)
- Start each run with Tokens
- Faster Scrapper and Tinker stages
- Higher base drop rates
- Keep one DEX Upgrade through a wipe
- Extra skill point per level
- Auto-scavenge from the start

### Collection log

A permanent record of every item found, grouped by tier. Unfound items show as silhouettes. Celestial items get a trophy spot.

A second prestige layer can be added in a later update.

## 8. Story

### Background

The old World Wide Web was replaced by the NET. The companies that built it became the Spires and now control everything: food, water, air and who's allowed online. The Groves used to be the greenest part of the city until the Spires drained the land for power and cooling and dumped their old tech there. People in the Groves are cut off from the NET, and without access you don't exist.

### The mystery

Decades ago, something fell from the sky outside the city. The Spires reached it first, buried the story, and built their empire on what they found: Celestial Tech.

### The contact

From early on, Nobody receives anonymous messages with hints and warnings. Later it's revealed they come from Nobody's own past selves: fragments that survived each wipe. That's what Echoes are. The more the player prestiges, the more of the truth they reveal. The past selves are just as sarcastic as Nobody, and mildly annoyed that they keep getting Wiped.

### Story by stage

1. **Scrapper:** survival. Learning what the Spires throw away.
2. **Tinker:** first DEX, and the messages start.
3. **Patcher:** first contact with the NET. Realising how much the Spires hide.
4. **Hacker:** breaking into Spire servers, first references to "the Fall". The Spires notice, and the first wipe follows.
5. **Creator:** building tech and assembling AI fragments. Learning the Spires' AI was built on Celestial Tech.
6. **Ascendant:** going after the source. The ending is left open for a later update.

### Delivery
- Short narration lines from Nobody at key moments
- Messages from past selves
- Spire broadcasts (satirical corporate PR)
- **Data Logs** as collectible drops with their own rarity; rarer logs reveal bigger story pieces
- No cutscenes; all story is optional to read

### Example lines

- **First tap:** "Ah, bin diving. The glamorous start every legend has. Tap the bin. No, really, that's the game for now."
- **Rare drop:** "Purple! Military grade! I'd like to thank my bin, my other bin, and the 400 bins before that."
- **Celestial drop:** "Okay. That's not from here. That's not from anywhere. I'm going to need a minute. Also, please screenshot this."
- **Returning after offline time:** "Oh, you're back. I worked the whole time you were gone. No, don't thank me. Just look at the number."
- **Static rising:** "My head's buzzing like a cheap speaker. Maybe ease off before I start seeing smells."
- **Getting Wiped:** "Wiped again. New face, new name, same terrible decisions. Let's go."
- **Past self:** "Hey, it's you. Well, it's me. Previous you. Don't open the server in Sector 9. I opened it. That's why you're here. Anyway, good luck."
- **Spire broadcast:** "The Spires remind you: air is a privilege, not a right. Upgrade to Breathe+ today."

## 9. Visual style

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
- Monospace font for numbers, item names and drop feed (terminal feel)
- Clean sans-serif for general UI

### Stage tint

Background tint shifts with progress: warmer, rust-tinted in the Groves stages (Scrapper to Patcher), colder and bluer once in the NET (Hacker onwards).

## 10. Technical notes (recommendations, to confirm with Claude Code)

- **Stack:** TypeScript web app (e.g. Vite + React), wrapped for iOS and Android with Capacitor. Easy to test in a browser during development.
- **Big numbers:** use a big-number library (e.g. break_infinity.js) and short number formatting (1.2K, 3.4M, 5.6B...).
- **Save system:** local save on device with regular autosave. Store a timestamp on close.
- **Offline earnings:** on return, calculate earnings from elapsed time, capped by the offline cap skill.
- **Data-driven content:** items, tiers, drop tables, skills and stages defined in data files (JSON or TS config), so balance can be tuned without code changes.
- **Seeded randomness for testing:** allow a debug mode with boosted drop rates and time skip.

## 11. Build order

1. Core loop: tap to scavenge, drops with tiers, sell for Tokens, basic upgrades
2. Save system and offline earnings
3. Stages 1–3 with automation and scripts
4. Skill tree
5. DEX and DEX Upgrade equipment slots, Tuner
6. Stage 4: NET hacking and Firewalls, Static
7. Prestige (Wiped, Echoes, Echo upgrades, collection log)
8. Story layer: narration, messages, Data Logs, Spire broadcasts
9. Rare drop effects, sound and polish
10. Stages 5–6
11. Mobile packaging (Capacitor) and store builds

## 12. Open questions

- Monetisation (rewarded ads, in-app purchases, or premium)
- Story ending
- Second prestige layer
- Art style for the character and items (pixel art, flat icons or illustrated)
