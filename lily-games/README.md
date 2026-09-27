# Lily's Magic Games

A tap-and-drag browser game for a 4 year old. No keyboard, no reading needed:
a friendly recorded voice reads every instruction aloud, wrong answers just
wiggle and say "try again", and right answers win stars, confetti and stickers.

## How to play

Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox).
Keep `voice.js` next to it: that file holds the recorded voice.
It works best on a tablet or touchscreen laptop; a mouse works too.
Tap the speech bubble at any time to hear the instruction again.

Each game mixes up what it asks every round so it doesn't get repetitive.

| Game | What she practises | Variations |
| --- | --- | --- |
| 🧱 Brick Builder | Shapes, colours, building | 15 models to build: car, boat, apple tree, ice cream, snowman, cupcake, rocket, house, fire engine, train, butterfly, flower, castle, pirate ship, robot |
| 🦄 Unicorn Colours | Colour matching and names | Find the right coloured balloon, butterfly, cupcake or fish |
| 🐶 Puppy Counting | Counting 1 to 10 | Count the group and tap the number · give the puppy the right number of bones · which side has more (or fewer) |
| 🏴‍☠️ Pirate Treasure | Sorting | Sort treasure by colour, or by shape (coins, stars, jewels) |
| 🧩 Magic Jigsaws | Jigsaws | 10 pictures: unicorn, pirate ship, puppy, vampire castle, princess, mermaid, space, farm, dinosaur, fairy |
| 🧛 Vampire Shadows | Shape matching | Find the shadow of a picture · or work out whose shadow it is |
| 🎴 Memory Match | Memory | Turn over cards to find matching pairs |
| 🖍️ Colouring Book | Creativity, colour names | Pick a colour and tap parts of a picture to colour it in |
| 🫧 Bubble Pop | Numbers, colours, letters | Pop the right number · pop the right colour · pop L, I, L, Y to spell her name |
| 🦉 Odd One Out | Spotting differences | Find the different picture, colour or size |
| 👑 Dress-up Patterns | Patterns / what comes next | Dress-up things, bead necklaces, or animals |

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
  | Vampire Shadows | 3 choices | 4 choices | 5 choices |
  | Dress-up Patterns | AB | AAB / ABB | ABC |
  | Brick Builder | 4 pieces | 5–6 pieces | 7–8 pieces |
  | Memory Match | 3 pairs | 4 pairs | 6 pairs |
  | Colouring Book | simple pictures | medium pictures | detailed pictures |
  | Bubble Pop | slow bubbles, numbers to 5 | faster, numbers to 9 | fastest, numbers to 10 |
  | Odd One Out | 3 pictures | 4 pictures | 5 pictures |
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
