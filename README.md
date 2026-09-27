# Main-Repo
Main Repo for Learning Claude Code

## Hawd Yer Weesht, It's the Apocalypse

A 2D post-apocalyptic survival, crafting and building game written in plain HTML5 Canvas and JavaScript. It has no dependencies and no build step.

It's 2210 an' the world's been blootered. You're **Tam**, the last survivor of an underground bunker, and the air filter's just packed in. The jokes, names and dialogue are in Glasgow slang; the instructions stay in plain English. Scavenge the wasteland for supply chests, chop and mine resources, craft tools and weapons, fight off mutants, and search the ruins for the technology of the old world. Each new world opens with a short surface report: the region's name and how many chests, ruins, craters and oak trees it has.

### Play

Open `index.html` in a browser. Or serve the folder locally:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Controls

| Key | Action |
| --- | --- |
| A / D | Walk |
| W / Space | Jump, climb ladders |
| S | Climb down |
| Hold left click | Mine a block, attack, or shoot a bow |
| Right click | Place a block, open a supply chest, or eat or heal |
| 1–9 / mouse wheel | Pick a hotbar slot |
| E | Inventory and crafting |
| M | Sound on or off |
| K | Show or hide key prompts |
| H | Show or hide the controls |

Key prompts show what to press: beside the crosshair for what the mouse will do (mine, chop, place, open, attack, shoot, eat), and above your character for movement, ladders and crafting stations. Each prompt disappears for good once you've done that action 4 times.

On touch screens, on-screen buttons appear. Tap the **Mine / Build** button to switch what a tap on the world does.

### Progression

1. Chop trees for **logs**, and follow the gold arrow to **supply chests** in ruins and the open wasteland. Chests hold random equipment, most likely the next tier up from what you already carry.
2. Craft **planks** and a **workbench**, then wooden tools.
3. Break bushes and leaves for **fibre**. Turn 2 fibre into **string**, and 2 string into **rope**.
4. Use cobblestone and string for stone tools and a **furnace**.
5. Smelt **iron** from iron ore or 3 scrap metal, then make iron tools and weapons with rope.

### Items

Every item belongs to a category, shown as a coloured corner on inventory slots and as tabs in the crafting menu. Recipes you can make right now are listed first, under **Ready to craft**. Items with more than one recipe (Iron Ingot, Planks, Ladder) show each option in one row, and Craft uses whichever you have materials for:

| Category | Examples |
| --- | --- |
| Equipment | pickaxes, hatchets, daggers, bows, arrows |
| Health | Irn Bru (Bru Rush), Wee Berries (+10 health, +15 food), Rat Piece (cooked meat: +25 health, +40 food), Big Plaster (+30 health) |
| Resources | logs, oak logs, sticks, fibre, string, rope, coal, iron, scrap metal, raw meat |
| Building | dirt, planks, cobblestone, bricks, glass, torches, ladders, workbench, furnace |

Leaves and bushes drop fibre. Each piece of fibre has a 50% chance of coming with berries.

### Tools and weapons

- **Pickaxes** are fastest on stone and ore, and **hatchets** are fastest on wood. Either works on both, just more slowly.
- **Oak trees** are 5x tougher than normal trees and drop 2 oak logs per block. Anything below a Stone Hatchet chops oak slowly, and a pop-up suggests the upgrade.
- **Daggers** (wood, stone, iron) hit enemies you click within reach. **Bows** (Shortbow, Oak Shortbow, The Persuader) shoot your best **arrows** toward the crosshair. Arrows are cheap: 8 wooden arrows from 1 stick and 1 fibre, or 12 stone or iron arrows from 1 stick and 1 cobblestone or iron ingot.

### Survival

- You have **100 health**. **Big Mingers** (mutant rats) and **Bawheids** (ghouls) roam the surface and dark caves and hurt you on contact. Falls of more than 4 blocks also hurt.
- Creatures wander at random and only chase you when you're within about 10 blocks and nothing solid blocks their view.
- **Peely-Wallies** are pale, blind cave dwellers. They lurk in the twilight zone, the first dark caves below where daylight fades (about 14–32 blocks down), even while you're on the surface. They hunt Tam, or rats if Tam isn't in sight, but won't step into bright light (except under an Ash Cloud) and run from fire: placed torches, Wee Fires and furnaces, or a torch in your hand.
- Big Mingers drop raw meat. Cook it into a **Rat Piece** on a **Wee Fire** (3 logs, 2 sticks) or in a furnace. Bawheids and Peely-Wallies drop string and rope.
- You also have **100 stamina**. Jumps (8), each tool swing (2), dagger hits (8) and bow shots (10) use it; walking doesn't. It refills after you rest for about a second.
- Your **food** bar drains slowly (a full stomach lasts about 20 minutes). At 0 you start starving and lose 2 health every 4 seconds. Raw meat gives +10 food but makes you sick; cook it first.
- **Irn Bru machines** sit in sealed brick rooms deep underground (25+ blocks down) and glow in the dark. Right click one for 3 cans. A can gives a **Bru Rush**: unlimited stamina and +50 health (max 150) for 60 seconds.
- At 0 health you wake up back at the start and keep your items.

### Weather

Clear spells of 2½–5 minutes alternate with 1½–3 minutes of weather. **Wee Davie** radios a warning about 25 seconds before it turns, and the vitals panel shows what's coming. Anything solid over your head counts as shelter (planks, bricks, glass), but leaves don't.

| Weather | Effects |
| --- | --- |
| **Ash Cloud** | Thick fog cuts your view. Outside, the ash costs 2 health every 4 seconds. Peely-Wallies can surface in the gloom. Get under a roof or underground. |
| **Heavy Dreich** | Rain and fog. Bushes and young trees grow back. Torches and Wee Fires left in the open get put out. |
| **Taps Aff** | Heatwave with heat haze. In the sun, food drains 2.5x faster and stamina refills at half speed. Tam takes his top off. |

### Tam and Wee Davie

Tam comments on what's happening in speech bubbles, and Wee Davie in the other bunker radios in about the weather.

You can only mine blocks you can see: if a solid block sits between you and the target, the outline turns red and you have to clear the way first.

Recipes marked "at Workbench" or "at Furnace" need that station within 4 blocks of you. The world saves to your browser automatically every 20 seconds and when you leave. **New world** asks for confirmation before replacing it. Worlds saved before an update keep their old terrain, so start a new world to see new terrain features.

### Code layout

- `index.html`: page structure and HUD
- `style.css`: HUD, inventory and crafting styles
- `game.js`: world generation, lighting, physics, mining/placing, crafting, saving and rendering. Blocks (`BLOCK`), items (`ITEM`) and recipes (`RECIPES`) are plain tables near the top, so adding content is mostly adding rows.
