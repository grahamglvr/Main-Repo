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
| 🧱 Brick Builder | Shapes, colours, building | Drag each brick onto the outline with the same colour and size, then watch the model come alive |
| 🦄 Unicorn Colours | Colour matching and colour names | Tap the balloon that matches the star |
| 🐶 Puppy Counting | Counting 1 to 10 | Tap each puppy to count it, then tap the number |
| 🏴‍☠️ Pirate Treasure | Sorting by colour | Drag each jewel into the same colour chest |
| 🧩 Magic Jigsaws | Jigsaws | Drag pieces onto the faint picture |
| 🧛 Vampire Shadows | Shape matching | Tap the shadow that matches the picture |
| 👑 Dress-up Patterns | Patterns / what comes next | Tap the item that finishes the pattern |

Anything she drags can also be tapped, then tapped again where it should go.

## Grown-up notes

- Each game gets a little harder as she does well (more balloons, bigger
  numbers, more jigsaw pieces, bigger brick models), and eases off again if
  she's finding it tricky.
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
