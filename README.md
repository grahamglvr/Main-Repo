# Main-Repo
Main Repo for Learning Claude Code

## Blockstead

A small 2D crafting and building game written in plain HTML5 Canvas and JavaScript. It has no dependencies and no build step.

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
| Hold left click | Mine a block |
| Right click | Place the selected block |
| 1–9 / mouse wheel | Pick a hotbar slot |
| E | Inventory and crafting |
| M | Sound on or off |
| H | Show or hide the controls |

On touch screens, on-screen buttons appear. Tap the **Mine / Build** button to switch what a tap on the world does.

### Progression

1. Chop trees for **logs**, then craft **planks** and a **workbench**.
2. Place the workbench and craft a **wooden pickaxe** to mine stone.
3. Use cobblestone for a **stone pickaxe** and a **furnace**.
4. Find **coal** for torches, and smelt **iron ore** (deep underground) into ingots for an **iron pickaxe**.
5. Build with planks, stone bricks, glass, torches and ladders.

You can only mine blocks you can see: if a solid block sits between you and the target, the outline turns red and you have to clear the way first.

Recipes marked "at Workbench" or "at Furnace" need that station within 4 blocks of you. The world saves to your browser automatically every 20 seconds and when you leave. **New world** asks for confirmation before replacing it.

### Code layout

- `index.html`: page structure and HUD
- `style.css`: HUD, inventory and crafting styles
- `game.js`: world generation, lighting, physics, mining/placing, crafting, saving and rendering. Blocks (`BLOCK`), items (`ITEM`) and recipes (`RECIPES`) are plain tables near the top, so adding content is mostly adding rows.
