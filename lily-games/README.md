# Lily's Magic Games

A tap-and-drag browser game for a 4 year old. No keyboard, no reading needed:
a friendly recorded voice reads every instruction aloud, wrong answers just
wiggle and say "try again", and right answers win stars, confetti and stickers.

## How to play

Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox).
Keep `voice.js` next to it: that file holds the recorded voice.
It works best on a tablet or touchscreen laptop; a mouse works too.
Tap the speech bubble at any time to hear the instruction again.

| Game | What she practises | How |
| --- | --- | --- |
| 🧱 Brick Builder | Shapes, colours, building | Drag each piece onto the outline with the same colour and shape to build a car, rocket, castle and more, then watch it come alive |
| 🦄 Unicorn Colours | Colour matching and colour names | Tap the balloon that matches the star |
| 🐶 Puppy Counting | Counting 1 to 10 | Tap each puppy to count it, then tap the number |
| 🏴‍☠️ Pirate Treasure | Sorting by colour | Drag each jewel into the same colour chest |
| 🧩 Magic Jigsaws | Jigsaws | Drag pieces onto the faint picture |
| 🧛 Vampire Shadows | Shape matching | Tap the shadow that matches the picture |
| 👑 Dress-up Patterns | Patterns / what comes next | Tap the item that finishes the pattern |

Anything she drags can also be tapped, then tapped again where it should go.

## Grown-up notes

- The Easy / Medium / Hard button at the top sets the difficulty for every
  game. Changing it restarts the current game at the new level.

  | | Easy | Medium | Hard |
  | --- | --- | --- | --- |
  | Unicorn Colours | 3 balloons | 4 balloons | 5 balloons |
  | Puppy Counting | up to 3 | up to 5 | up to 10, no dot hints |
  | Pirate Treasure | 2 chests, 4 jewels | 2 chests, 6 jewels | 3 chests, 9 jewels |
  | Magic Jigsaws | 4 pieces | 6 pieces | 9 pieces |
  | Vampire Shadows | 3 shadows | 4 shadows | 5 shadows |
  | Dress-up Patterns | AB | AAB / ABB | ABC |
  | Brick Builder | 4 pieces (car, boat, tree, ice cream) | 5–6 pieces (rocket, house, fire engine) | 7–8 pieces (flower, castle, pirate ship) |
- Stars, stickers and difficulty are saved in the browser on that device.
- The speaker button in the top-right turns the voice and sounds on or off.
- The house button in the top-left goes back to the game menu.

## The voice

Every spoken line is pre-recorded with [Kokoro](https://github.com/hexgrad/kokoro),
an open-source (Apache-2.0) neural text-to-speech model, using its British
"Emma" voice. If `voice.js` is missing, the game falls back to the device's
built-in voice, choosing the most natural-sounding one available.

To change what the voice says, edit the `VOICE-LINES` block in `index.html`,
then re-record:

```sh
pip install sherpa-onnx lameenc numpy
python3 tools/make_voice.py path/to/kokoro-int8-en-v0_19
```

The model folder is the sherpa-onnx export of Kokoro v0.19
(`model.int8.onnx`, `voices.bin`, `tokens.txt`, `espeak-ng-data`).
Only new or changed lines are recorded again.
