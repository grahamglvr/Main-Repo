# Lift Planner

A phone web app for planning lifting and rigging jobs offshore. It is built for Ex-rated Android phones and works with no signal.

## What it does

- **Job**: job name, lift plan / WO / permit / RA numbers, location, author, date, revision, category of lift, description, communication method, colour code.
- **Load**: equipment tag, type, description, weight and where the weight came from, whether it is verified, rigging weight, total hook load, size, centre of gravity, load notes and photos.
- **Lift points**: suspension points and attachment points, each with type, SWL (checked against the load), cert no., location, the rigging at that point, and photos.
- **Rigging**: equipment list with qty, WLL and length. It builds the section 6.0 list, e.g. `2 x 500kg Chain block 3m`.
- **Steps**: stage headings and numbered steps with responsibilities. There is a template with the standard four stages.
- **Calcs** (each result can be saved to the job):
  - Sling angle and distance between lifting points. Fill in any two of leg length, spread, height and angle.
  - Sling leg tension for 2, 3 and 4 leg slings.
  - Cross-haul between two chain blocks: the load on each block, chain angles and chain lengths.
  - Load share with an offset centre of gravity.
  - Sling WLL for the slinging method (mode factors).
  - Weight estimator for pipe / spool, plate and bar.
- **Photos**: take photos or draw sketches, then mark them up with arrows, lines and labels such as "LP1".
- **Risk**: free-text risk notes, extra controls, toolbox talk notes, and the section 9.0 non-generic hazards checklist.
- **Report**: a draft lift plan laid out in the same sections as the LOLER form. You can print it, save it as a PDF or share it.

## How it works with no signal

1. Open the app once on Wi-Fi. The service worker saves the whole app to the phone. In Chrome, use **Add to Home screen** so it opens like an app.
2. Out on the plant, the app opens and works with no signal. Everything you type and every photo is saved to the phone (IndexedDB) as you go. Locking the phone, closing the browser or restarting the phone does not lose anything.
3. Back inside on Wi-Fi, there are two ways to get the job off the phone:
   - **Automatic upload**: in Settings, enter an upload address. When the phone reconnects, each changed job is POSTed there. Android Chrome's Background Sync means this can happen even when the app is closed.
   - **Share**: open the job, go to Report, then tap **Share report** (a self-contained HTML file with the photos) or **Export job file** (JSON). You can send either by email, Teams and so on. A job file can be imported into the app on another phone or a PC.

Photos are shrunk to 1600 px JPEGs to save space. Settings has a **Protect saved jobs** button, which asks the browser not to clear the data when the phone is low on space.

## Upload format

`POST <upload address>` with `Content-Type: application/json` and, if an access key is set, `Authorization: Bearer <key>`:

```json
{
  "app": "lift-planner",
  "format": 1,
  "sentAt": "2026-09-26T10:00:00.000Z",
  "job": { "id": "...", "details": {}, "load": {}, "liftingPoints": [], "rigging": [], "steps": [], "calcs": [], "photos": [], "hazards": {}, "risk": {} },
  "photos": [{ "id": "...", "caption": "LP1", "type": "image/jpeg", "data": "<base64>" }]
}
```

Any 2xx reply marks the job as uploaded. The receiver needs to allow CORS from the app's address. The same job is sent again each time it changes, so key your store on `job.id`. A Power Automate "When an HTTP request is received" flow that saves to SharePoint or OneDrive works as a receiver.

## Hosting

The app is plain static files with no build step. Service workers need HTTPS, so host it on any HTTPS static host. The workflow in `.github/workflows/lift-planner-pages.yml` publishes this folder to GitHub Pages whenever it changes on `main`. To turn it on, go to **Settings → Pages → Source** and choose **GitHub Actions**.

**When you release changes, bump `VERSION` in `sw.js`.** Phones then download the new files and show an "Update" banner.

## Development

```sh
npx http-server lift-planner -c-1     # then open http://localhost:8080
node --test lift-planner/tests/calc.test.cjs
```

The calculations in `js/calc.js` are pure functions with unit tests. Always check results against your company rigging procedures. The report is a draft for the competent person to transfer to and approve on the site's LOLER lift plan form.
