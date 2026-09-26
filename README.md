# Main-Repo
Main Repo for Learning Claude Code

## Blockstead

A 2D post-apocalyptic survival, crafting and building game written in plain HTML5 Canvas and JavaScript. Scavenge a ruined wasteland for supply chests, chop and mine resources, craft tools and weapons, and fight off mutants. It has no dependencies and no build step.

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
| H | Show or hide the controls |

On touch screens, on-screen buttons appear. Tap the **Mine / Build** button to switch what a tap on the world does.

### Progression

1. Chop trees for **logs**, and follow the gold arrow to **supply chests** in ruins and the open wasteland. Chests hold random equipment, most likely the next tier up from what you already carry.
2. Craft **planks** and a **workbench**, then wooden tools.
3. Break bushes and leaves for **fibre**. Turn 2 fibre into **string**, and 2 string into **rope**.
4. Use cobblestone and string for stone tools and a **furnace**.
5. Smelt **iron** from iron ore or 3 scrap metal, then make iron tools and weapons with rope.

### Items

Every item belongs to a category, shown as a coloured corner on inventory slots and as tabs in the crafting menu:

| Category | Examples |
| --- | --- |
| Equipment | pickaxes, hatchets, daggers, bows, arrows |
| Health | berries (+10), cooked meat (+25), bandages (+30) |
| Resources | logs, oak logs, sticks, fibre, string, rope, coal, iron, scrap metal, raw meat |
| Building | dirt, planks, cobblestone, bricks, glass, torches, ladders, workbench, furnace |

Leaves and bushes drop fibre. Each piece of fibre has a 50% chance of coming with berries.

### Tools and weapons

- **Pickaxes** are fastest on stone and ore, and **hatchets** are fastest on wood. Either works on both, just more slowly.
- **Oak trees** are 5x tougher than normal trees and drop 2 oak logs per block. Anything below a Stone Hatchet chops oak slowly, and a pop-up suggests the upgrade.
- **Daggers** (wood, stone, iron) hit enemies you click within reach. **Bows** (Shortbow, Oak Shortbow, Iron-bound Bow) shoot your best **arrows** (wooden, stone, iron) toward the crosshair.

### Survival

- You have **100 health**. **Mutant rats** and **ghouls** roam the surface and dark caves and hurt you on contact. Falls of more than 4 blocks also hurt.
- **Crawlers** are pale, blind cave dwellers that spawn deep underground in the dark. They run from fire: placed torches, campfires and furnaces, or a torch in your hand.
- Rats drop raw meat. Cook it on a **Campfire** (3 logs, 2 sticks) or in a furnace. Ghouls and crawlers drop string and rope.
- At 0 health you wake up back at the start and keep your items.

You can only mine blocks you can see: if a solid block sits between you and the target, the outline turns red and you have to clear the way first.

Recipes marked "at Workbench" or "at Furnace" need that station within 4 blocks of you. The world saves to your browser automatically every 20 seconds and when you leave. **New world** asks for confirmation before replacing it. Worlds saved before an update keep their old terrain, so start a new world to see new terrain features.

### Code layout

- `index.html`: page structure and HUD
- `style.css`: HUD, inventory and crafting styles
- `game.js`: world generation, lighting, physics, mining/placing, crafting, saving and rendering. Blocks (`BLOCK`), items (`ITEM`) and recipes (`RECIPES`) are plain tables near the top, so adding content is mostly adding rows.
