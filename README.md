# Reelbook: a filmmaker's notebook

A pocket production companion for filmmakers and videographers. It covers the whole shoot in three tabs:

| Tab | Phase | What's inside |
| --- | --- | --- |
| **PREP** 📐 | Pre-production | Overview & checklist · Shot list · Storyboard · Colour palettes · Frame rates · Techniques glossary · Gear list · Crew & locations · Quick notes |
| **ROLL** 🔴 | On set | Shot tracker · Digital slate · Take log · Sun & golden hour · Calculators · Quick notes |
| **WRAP** 🎞️ | Post-production | Wrap & backup (3-2-1) · Selects & coverage check · Post pipeline · Colour grade notes · Deliverables & specs · Quick notes |

## Features

**Prep**
- **Shot list:** scene/shot numbering, category, shot size, camera angle, movement (auto-tagged **STATIC** or **MOVING**), lens, frame rate (with the *why*), duration, audio, location and priority. The form explains each angle and move as you pick it. Starter templates are included (Interview/Doc, Product, Short film scene). Printable.
- **Storyboard:** frames with categories (Establishing, Character, Talking/Dialogue, Detail/Insert, Object/Product, Action, Reaction, B-roll/Cutaway, POV, Mood, Transition). There's a built-in sketch pad with pen, arrows for camera/subject movement, boxes and a rule-of-thirds overlay, matched to your aspect ratio. Frames link to shots, and you can build a board from the shot list in one tap.
- **Colour:** 12 film-look palettes, a colour-harmony generator, palette extraction from a reference image (done on your device), editable swatches with tap-to-copy hex, and a colour psychology guide.
- **Frame rates:** what each rate is for, 180° shutter values, and slow-mo factors for your timeline.
- **Techniques:** a searchable glossary of shot sizes, angles, movements, composition, lighting, continuity and editing techniques.
- **Gear**, **crew** (tap to call or email) and **locations** (permit status, map link).

**Roll**
- **Shot tracker:** a live checklist of the shot list with take counters and must-have warnings.
- **Slate:** a digital clapperboard (scene / shot / take / roll, INT/EXT, DAY/NIGHT). The clap does a flash and a beep for syncing. Rate a take Good / OK / NG to log it and the take number goes up automatically. There's a fullscreen mode.
- **Take log:** filter by rating, edit notes, export to CSV.
- **Sun & light:** sunrise, sunset, golden hour and blue hour on a timeline for any date and location.
- **Calculators:** shutter angle, slow motion, time-lapse, storage/card time and ND filters.

**Wrap**
- Wrap and data-backup checklists, plus a media log (Drive A / B / Cloud / Verified per card).
- Circled takes collected automatically, and a coverage check that lists planned shots with no good take.
- An 18-step post pipeline, grading order with your palettes as reference, and a deliverables tracker with typical platform specs.

**Everywhere:** quick notes on every tab, a floating ✎ button for instant notes, multiple projects, export/import of project files, light and dark themes, and it works offline and can be installed on a phone.

## Running it

There's no build step and no dependencies. It's plain HTML, CSS and JavaScript.

```bash
# any static server works, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also open `index.html` directly. Offline/install support needs it to be served over http(s), for example with GitHub Pages.

To install it on a phone, host it (GitHub Pages works), open it in Safari or Chrome and choose **Add to Home Screen**.

## Data

Everything is stored locally in your browser (`localStorage`). Nothing is uploaded. Use **Projects → ⬇ Export** (or *Wrap → Wrap & Backup → Export project*) to back up a project or move it to another device.

## Structure

```
index.html              App shell
css/styles.css          Styles (dark/light, mobile-first)
js/data.js              Reference data: categories, angles, moves, frame rates, palettes, checklists, specs
js/store.js             Projects & persistence
js/ui.js                Modals, forms, toasts
js/components.js        Badges, quick notes, sketch pad, colour tools
js/sun.js               Sun position / golden hour maths
js/views/prep.js        PREP tab
js/views/roll.js        ROLL tab
js/views/wrap.js        WRAP tab
js/app.js               Routing & event handling
sw.js, manifest.webmanifest, icons/   Offline & install support
```
