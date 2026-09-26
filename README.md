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

## Mobile app (iOS & Android)

Reelbook is packaged as a native app with [Capacitor](https://capacitorjs.com). The same `www/` code runs inside real iOS and Android projects (`ios/`, `android/`). In the app it also gets:

- **Safer storage:** projects are saved to a file inside the app, not just the web view's storage (which the OS can clear)
- **Haptics** on the clap and when logging takes
- **Screen stays awake** while you're in the ROLL tab
- **Full-screen slate** with the status bar hidden
- **Native share sheet** for project exports, take-log CSVs and shot lists
- **GPS** for sun and golden-hour times
- **Android back button** support, splash screen and app icons

### Get it on an Android phone (no computer setup needed)
Every push builds a debug APK with GitHub Actions:
1. Go to the repo's **Actions** tab → **Mobile builds** → the latest run.
2. Download the **reelbook-debug-apk** artifact and unzip it.
3. Copy `app-debug.apk` to your phone and open it (allow "install unknown apps" when asked).

### Build it yourself
```bash
npm install
npm run android      # syncs and opens Android Studio → press ▶ Run
npm run ios          # syncs and opens Xcode (Mac only) → pick your iPhone → ▶ Run
```
- **Android:** needs [Android Studio](https://developer.android.com/studio) (JDK 21 is bundled).
- **iPhone:** needs a Mac with Xcode 16+. A free Apple ID can install on your own phone (it expires after 7 days). The App Store needs an Apple Developer account ($99/yr).
- After changing anything in `www/`, run `npx cap sync` (the `npm run android` / `ios` scripts do this for you).
- App icons and splash come from `assets/`. Regenerate with `npm run assets`.
- The app ID is `app.reelbook.notebook` (in `capacitor.config.json`). Change it before publishing to the stores, because it can't be changed afterwards.

### Publishing
- **Google Play:** in Android Studio, *Build → Generate Signed App Bundle*, then upload the `.aab` to the Play Console ($25 one-off).
- **App Store:** in Xcode, *Product → Archive → Distribute App*, then submit through App Store Connect.

## Running in a browser

It's plain HTML, CSS and JavaScript with no build step:

```bash
npm run serve        # or: cd www && python3 -m http.server 8000
```

For quick testing on a phone without hosting anything, `npm run build:single` bundles the whole app into one file, `dist/reelbook.html`. Open it in any browser, or send it to yourself and open it on the phone. `npm run build:embed` makes a body-only version for sandboxed preview pages, where exports appear as copyable text because downloads are blocked there.

Hosted over https (for example with GitHub Pages pointed at `www/`), it also works offline and can be added to a home screen as a PWA.

## Data

Everything is stored on the device. Nothing is uploaded. Use **Projects → ⬇ Export** (or *Wrap → Wrap & Backup → Export project*) to back up a project or move it to another device.

## Structure

```
www/                      The app (this is what goes inside the native apps)
  index.html              App shell
  css/styles.css          Styles (dark/light, mobile-first)
  js/native.js            Native bridge: file storage, share, haptics, keep-awake, GPS, back button
  js/data.js              Reference data: categories, angles, moves, frame rates, palettes, checklists, specs
  js/store.js             Projects & persistence
  js/ui.js                Modals, forms, toasts
  js/components.js        Badges, quick notes, sketch pad, colour tools
  js/sun.js               Sun position / golden hour maths
  js/views/prep.js        PREP tab
  js/views/roll.js        ROLL tab
  js/views/wrap.js        WRAP tab
  js/app.js               Routing & event handling
  sw.js, manifest.webmanifest, icons/   PWA offline & install support
android/, ios/            Native projects (Capacitor)
assets/                   Source images for app icons & splash screens
capacitor.config.json     App ID, name, splash & status bar settings
.github/workflows/        CI: builds the Android APK (and an iOS check on demand)
```
