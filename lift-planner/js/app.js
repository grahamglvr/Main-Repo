/* Lift Planner app: screens, forms, photos, calculators, export and sync. */
(function () {
  'use strict';

  const APP_VERSION = '1.0.0';
  const M = self.LiftModel;
  const C = self.LiftCalc;
  const R = self.LiftReport;
  const esc = R.esc;
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view');

  let job = null;
  let saveTimer = null;
  let savePromise = null;
  let lastSaved = null;
  let settings = {};
  const thumbs = new Map(); // photo id -> object URL of the thumbnail
  const captions = new Map(); // photo id -> caption
  const calcState = {};
  const calcOpen = new Set(['sling']);

  const TABS = [
    ['details', 'Job'], ['load', 'Load'], ['points', 'Lift points'], ['rigging', 'Rigging'],
    ['steps', 'Steps'], ['calcs', 'Calcs'], ['photos', 'Photos'], ['risk', 'Risk'], ['report', 'Report'],
  ];

  /* ---------- Small helpers ---------- */

  function num(v) {
    if (v === '' || v == null) return null;
    const n = parseFloat(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  }
  function fmt(n, dp = 2) {
    if (n == null || !isFinite(n)) return '–';
    return Number(n.toFixed(dp)).toLocaleString('en-GB', { maximumFractionDigits: dp });
  }
  function getPath(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  }
  function setPath(obj, path, value) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null || typeof o[keys[i]] !== 'object') o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = value;
  }
  function slug(s) {
    return (s || 'lift-plan').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 60) || 'lift-plan';
  }
  function time(ts) {
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function dateTime(ts) {
    return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function msg(level, text) {
    return `<div class="msg ${level}">${esc(text)}</div>`;
  }
  let toastTimer = null;
  function toast(text) {
    let t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3000);
  }

  /* ---------- Saving ---------- */

  function touch() {
    if (!job) return;
    job.updatedAt = Date.now();
    $('#saved').textContent = 'Saving…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 300);
  }

  async function flush() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!job) return;
    const snapshot = job;
    savePromise = self.LiftDB.putJob(snapshot).then(() => {
      lastSaved = Date.now();
      if (job === snapshot) $('#saved').textContent = 'Saved on phone ' + time(lastSaved);
      queueSync();
    }).catch((e) => {
      $('#saved').textContent = 'NOT SAVED';
      toast('Could not save: ' + e.message);
    });
    return savePromise;
  }

  // Save straight away if the phone is locked or the app is put in the background.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
    else { updateNet(); autoSync(); }
  });
  window.addEventListener('pagehide', flush);

  /* ---------- Sync ---------- */

  let syncTimer = null;
  function queueSync() {
    if (!settings.endpoint) return;
    // Background sync (Android Chrome) uploads when the phone reconnects, even if the app is closed.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => reg.sync && reg.sync.register('sync-jobs')).catch(() => {});
    }
    clearTimeout(syncTimer);
    syncTimer = setTimeout(autoSync, 5000);
  }

  async function autoSync(manual) {
    if (!settings.endpoint) {
      if (manual) toast('Set a sync address in Settings first.');
      return;
    }
    if (!navigator.onLine && !manual) return;
    try {
      const r = await self.LiftSync.syncAll();
      if (manual || r.sent) toast(r.sent ? `Uploaded ${r.sent} job${r.sent > 1 ? 's' : ''}.` : 'Everything is already uploaded.');
    } catch (e) {
      if (manual) toast('Upload failed: ' + e.message + '. It will try again when online.');
    }
    // Pick up syncedAt without losing edits made in the meantime.
    if (job) {
      const fresh = await self.LiftDB.getJob(job.id);
      if (fresh) job.syncedAt = fresh.syncedAt;
    }
    refreshStatusBits();
  }

  function refreshStatusBits() {
    const hash = location.hash || '#/';
    if (hash === '#/' || hash === '#') renderHome();
    else if (/\/report$/.test(hash) || hash === '#/settings') route();
  }

  function updateNet() {
    const el = $('#net');
    const on = navigator.onLine;
    el.className = 'pill ' + (on ? 'online' : 'offline');
    el.textContent = on ? 'Online' : 'Offline';
  }
  window.addEventListener('online', () => { updateNet(); autoSync(); });
  window.addEventListener('offline', updateNet);

  /* ---------- Photos ---------- */

  async function decodeImage(file) {
    if ('createImageBitmap' in window) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { /* fall back below */ }
    }
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')); };
      img.src = url;
    });
  }

  function resize(src, max, quality) {
    const w0 = src.naturalWidth || src.width;
    const h0 = src.naturalHeight || src.height;
    const k = Math.min(1, max / Math.max(w0, h0));
    const c = document.createElement('canvas');
    c.width = Math.round(w0 * k);
    c.height = Math.round(h0 * k);
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, 'image/jpeg', quality));
  }

  // Photos are shrunk to 1600 px so a job with lots of photos stays small.
  async function makePhoto(fileOrBlob, caption) {
    const img = await decodeImage(fileOrBlob);
    const blob = await resize(img, 1600, 0.78);
    const thumb = await resize(img, 360, 0.7);
    if (img.close) img.close();
    return { id: M.uid(), jobId: job.id, blob, thumb, caption: caption || '', createdAt: Date.now() };
  }

  async function loadJobPhotos() {
    thumbs.forEach((u) => URL.revokeObjectURL(u));
    thumbs.clear();
    captions.clear();
    const photos = await self.LiftDB.jobPhotos(job.id);
    photos.forEach((p) => {
      thumbs.set(p.id, URL.createObjectURL(p.thumb || p.blob));
      captions.set(p.id, p.caption || '');
    });
  }

  async function addPhotos(files, path, caption) {
    const list = getPath(job, path);
    let added = 0;
    for (const f of files) {
      try {
        const p = await makePhoto(f, caption);
        await self.LiftDB.putPhoto(p);
        thumbs.set(p.id, URL.createObjectURL(p.thumb));
        captions.set(p.id, p.caption);
        list.push(p.id);
        added++;
      } catch (e) {
        toast(e.message);
      }
    }
    if (added) { touch(); await flush(); }
    renderJob(currentTab());
  }

  function photoBlock(path, caption, opts = {}) {
    const ids = getPath(job, path) || [];
    return `
      <div class="photos">${ids.map((id) => `
        <button type="button" class="thumb" data-act="view-photo" data-id="${id}" data-path="${path}">
          <img src="${thumbs.get(id) || ''}" alt="${esc(captions.get(id) || 'Photo')}">
          ${captions.get(id) ? `<small>${esc(captions.get(id))}</small>` : ''}
        </button>`).join('')}
      </div>
      <div class="photo-btns">
        <label class="btn primary">Take photo
          <input class="file-input" type="file" accept="image/*" capture="environment" data-photo-target="${path}" data-caption="${esc(caption)}">
        </label>
        <label class="btn">From gallery
          <input class="file-input" type="file" accept="image/*" multiple data-photo-target="${path}" data-caption="${esc(caption)}">
        </label>
        ${opts.sketch ? `<button type="button" class="btn" data-act="sketch" data-path="${path}">New sketch</button>` : ''}
      </div>`;
  }

  async function openViewer(id, path) {
    const photo = await self.LiftDB.getPhoto(id);
    if (!photo) return;
    const url = URL.createObjectURL(photo.blob);
    const el = document.createElement('div');
    el.className = 'viewer';
    el.innerHTML = `
      <img src="${url}" alt="">
      <div class="bar">
        <input type="text" value="${esc(photo.caption)}" placeholder="Caption, e.g. LP1 above pump" aria-label="Caption">
      </div>
      <div class="bar">
        <button type="button" class="btn primary" data-v="markup">Mark up</button>
        ${photo.original ? '<button type="button" class="btn" data-v="revert">Undo markup</button>' : ''}
        <button type="button" class="btn danger" data-v="delete">Delete</button>
        <button type="button" class="btn" data-v="close">Done</button>
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('no-scroll');
    const input = $('input', el);

    async function close() {
      if (input.value !== photo.caption) {
        photo.caption = input.value;
        await self.LiftDB.putPhoto(photo);
        captions.set(id, photo.caption);
        touch();
      }
      URL.revokeObjectURL(url);
      el.remove();
      document.body.classList.remove('no-scroll');
      renderJob(currentTab());
    }
    async function replaceImage(blob, keepOriginal) {
      if (keepOriginal && !photo.original) photo.original = photo.blob;
      if (!keepOriginal) delete photo.original;
      photo.blob = blob;
      photo.thumb = await resize(await decodeImage(blob), 360, 0.7);
      photo.caption = input.value;
      await self.LiftDB.putPhoto(photo);
      URL.revokeObjectURL(thumbs.get(id));
      thumbs.set(id, URL.createObjectURL(photo.thumb));
      touch();
      URL.revokeObjectURL(url);
      el.remove();
      document.body.classList.remove('no-scroll');
      openViewer(id, path);
    }

    el.addEventListener('click', async (e) => {
      const v = e.target.closest('button')?.dataset.v;
      if (v === 'close') close();
      else if (v === 'markup') {
        const out = await self.LiftMarkup.open(photo.blob);
        if (out) replaceImage(out, true);
      } else if (v === 'revert') {
        if (confirm('Remove all markup and go back to the original photo?')) replaceImage(photo.original, false);
      } else if (v === 'delete') {
        if (!confirm('Delete this photo?')) return;
        await self.LiftDB.deletePhoto(id);
        const list = getPath(job, path);
        const i = list.indexOf(id);
        if (i >= 0) list.splice(i, 1);
        URL.revokeObjectURL(thumbs.get(id));
        thumbs.delete(id);
        touch();
        URL.revokeObjectURL(url);
        el.remove();
        document.body.classList.remove('no-scroll');
        renderJob(currentTab());
      }
    });
  }

  /* ---------- Form field builders ---------- */

  const attr = (k, v) => (v ? ` ${k}="${esc(v)}"` : '');

  function text(label, path, o = {}) {
    return `<label class="field"><span>${esc(label)}</span>
      <input type="${o.type || 'text'}" data-bind="${path}" value="${esc(getPath(job, path) ?? '')}"${attr('placeholder', o.ph)}${attr('list', o.list)} autocomplete="off"${o.refresh ? ' data-refresh="1"' : ''}></label>`;
  }
  function number(label, path, unit, o = {}) {
    return `<label class="field"><span>${esc(label)}</span><div class="unit" data-unit="${esc(unit)}">
      <input type="text" inputmode="decimal" data-bind="${path}" data-type="num" value="${esc(getPath(job, path) ?? '')}"${attr('placeholder', o.ph)} autocomplete="off"></div></label>`;
  }
  function area(label, path, o = {}) {
    return `<label class="field"><span>${esc(label)}</span>
      <textarea data-bind="${path}"${attr('placeholder', o.ph)} rows="${o.rows || 3}">${esc(getPath(job, path) ?? '')}</textarea></label>`;
  }
  function select(label, path, options, o = {}) {
    const cur = getPath(job, path) ?? '';
    return `<label class="field"><span>${esc(label)}</span><select data-bind="${path}">
      ${o.blank === false ? '' : `<option value="">${esc(o.blankLabel || 'Select…')}</option>`}
      ${options.map((v) => { const [val, lab] = Array.isArray(v) ? v : [v, v]; return `<option value="${esc(val)}"${String(cur) === String(val) ? ' selected' : ''}>${esc(lab)}</option>`; }).join('')}
      </select></label>`;
  }
  function chips(path, options) {
    const cur = getPath(job, path) || [];
    return `<div class="chips">${options.map((v) => {
      const [val, lab] = typeof v === 'object' ? [v.id, v.label] : [v, v];
      return `<label class="chip"><input type="checkbox" data-bind-list="${path}" value="${esc(val)}"${cur.includes(val) ? ' checked' : ''}><span>${esc(lab)}</span></label>`;
    }).join('')}</div>`;
  }
  function datalist(id, options) {
    return `<datalist id="${id}">${options.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
  }
  function itemTools(list, i, len) {
    return `<div class="item-tools">
      <button type="button" class="icon-btn" data-act="move" data-list="${list}" data-i="${i}" data-dir="-1" aria-label="Move up"${i === 0 ? ' disabled' : ''}>↑</button>
      <button type="button" class="icon-btn" data-act="move" data-list="${list}" data-i="${i}" data-dir="1" aria-label="Move down"${i === len - 1 ? ' disabled' : ''}>↓</button>
      <button type="button" class="icon-btn danger" data-act="remove" data-list="${list}" data-i="${i}" aria-label="Delete">✕</button>
    </div>`;
  }

  /* ---------- Live parts that update as you type ---------- */

  const LIVE = {
    loadTotal() {
      const total = M.totalLoadKg(job);
      const l = job.load;
      let out = `<div class="results"><div class="result big"><span>Total hook load (load + rigging)</span><b>${total ? esc(M.fmtKg(total)) : '–'}</b></div></div>`;
      if (l.weightKg && l.weightVerified === 'no') out += msg('caution', 'Weight not verified. Consider a load cell, or add a margin to the weight.');
      if (l.weightSource === 'Unknown') out += msg('danger', 'Weight source unknown. Find the weight before lifting.');
      return out;
    },
    lpCheck(el) {
      const lp = job.liftingPoints[+el.dataset.i];
      if (!lp || lp.role !== 'suspension') return '';
      const total = M.totalLoadKg(job);
      if (!lp.swlKg || !total) return '';
      return Number(lp.swlKg) >= total
        ? msg('ok', `SWL ${M.fmtKg(Number(lp.swlKg))} is enough for the load ${M.fmtKg(total)}.`)
        : msg('danger', `SWL ${M.fmtKg(Number(lp.swlKg))} is LESS than the load ${M.fmtKg(total)}.`);
    },
    riggingList() {
      if (!job.rigging.length) return '<p class="muted">No equipment yet.</p>';
      return `<ul>${job.rigging.map((r) => `<li>${esc(M.riggingLine(r))}</li>`).join('')}</ul>`;
    },
  };

  function updateLive() {
    view.querySelectorAll('[data-live]').forEach((el) => { el.innerHTML = LIVE[el.dataset.live](el); });
  }

  /* ---------- Home ---------- */

  async function renderHome() {
    setChrome('Lift Planner', false);
    const jobs = (await self.LiftDB.allJobs()).sort((a, b) => b.updatedAt - a.updatedAt);
    const q = (sessionStorageGet('lp-search') || '').toLowerCase();
    const shown = q ? jobs.filter((j) => JSON.stringify([j.details, j.load.tag, j.load.description]).toLowerCase().includes(q)) : jobs;
    view.innerHTML = `
      <div class="actions"><button type="button" class="btn primary block" data-act="new-job">+ New lift plan</button></div>
      <div class="actions">
        <a class="btn" href="#/calc">Calculators</a>
        <a class="btn" href="#/settings">Settings</a>
      </div>
      ${jobs.length > 3 ? `<label class="field"><span>Search</span><input type="search" id="search" value="${esc(q)}" placeholder="Name, tag, lift plan no."></label>` : ''}
      ${shown.length ? shown.map(jobCard).join('') : `<div class="empty">${jobs.length ? 'No jobs match.' : 'No lift plans yet.<br>Tap “New lift plan” to start.'}</div>`}
      <div class="actions">
        <label class="btn">Import job file<input class="file-input" type="file" accept=".json,application/json" data-import="1"></label>
      </div>
      ${hintOffline()}`;
  }

  function hintOffline() {
    const ready = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
    return ready
      ? '<p class="muted small">Ready to use with no signal. Everything you enter is saved on this phone as you type.</p>'
      : '<p class="muted small">Getting ready for offline use. Keep this page open on Wi-Fi for a moment, then reopen it.</p>';
  }

  function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* ignore */ } }

  function jobCard(j) {
    const d = j.details;
    const badge = settings.endpoint
      ? (self.LiftSync.isDirty(j) ? '<span class="badge pending">Waiting to upload</span>' : '<span class="badge ok">Uploaded</span>')
      : '<span class="badge ok">Saved on phone</span>';
    return `<a class="job" href="#/job/${j.id}/details">
      <h3>${esc(d.name || 'Untitled lift')}</h3>
      <div class="meta">
        ${d.liftPlanNo ? `<span>${esc(d.liftPlanNo)}</span>` : ''}
        ${j.load.tag ? `<span>${esc(j.load.tag)}</span>` : ''}
        ${j.load.weightKg ? `<span>${esc(M.fmtKg(Number(j.load.weightKg)))}</span>` : ''}
        <span>Edited ${esc(dateTime(j.updatedAt))}</span>
      </div>
      <div style="margin-top:6px">${badge}</div>
    </a>`;
  }

  async function newJob() {
    const j = M.newJob({ location: settings.location, author: settings.author });
    await self.LiftDB.putJob(j);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    location.hash = `#/job/${j.id}/details`;
  }

  /* ---------- Job screens ---------- */

  function currentTab() {
    return (location.hash.split('/')[3] || 'details');
  }

  function setChrome(title, inJob) {
    $('#title').textContent = title;
    $('#back').hidden = location.hash === '' || location.hash === '#/' || location.hash === '#';
    $('#back').href = '#/';
    $('#tabs').hidden = !inJob;
    if (!inJob) $('#saved').textContent = '';
  }

  function tabDone(id) {
    const j = job;
    switch (id) {
      case 'details': return !!j.details.name;
      case 'load': return !!j.load.weightKg;
      case 'points': return j.liftingPoints.length > 0;
      case 'rigging': return j.rigging.length > 0;
      case 'steps': return j.steps.length > 0;
      case 'calcs': return j.calcs.length > 0;
      case 'photos': return j.photos.length > 0;
      case 'risk': return Object.keys(j.hazards).length > 0 || !!j.risk.notes;
      default: return false;
    }
  }

  function renderTabs(tab) {
    const nav = $('#tabs');
    nav.innerHTML = TABS.map(([id, label]) =>
      `<a class="tab${id === tab ? ' active' : ''}" href="#/job/${job.id}/${id}"${id === tab ? ' aria-current="page"' : ''}>${esc(label)}${tabDone(id) ? '<span class="dot" aria-label="has content"></span>' : ''}</a>`).join('');
    const active = $('.tab.active', nav);
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function navFoot(tab) {
    const i = TABS.findIndex((t) => t[0] === tab);
    const prev = TABS[i - 1];
    const next = TABS[i + 1];
    return `<div class="nav-foot">
      ${prev ? `<a class="btn" href="#/job/${job.id}/${prev[0]}">‹ ${esc(prev[1])}</a>` : ''}
      ${next ? `<a class="btn primary" href="#/job/${job.id}/${next[0]}">${esc(next[1])} ›</a>` : ''}
    </div>`;
  }

  function renderJob(tab) {
    if (!job) return;
    setChrome(job.details.name || 'Untitled lift', true);
    $('#saved').textContent = lastSaved ? 'Saved on phone ' + time(lastSaved) : 'Saved on phone';
    renderTabs(tab);
    const render = SCREENS[tab] || SCREENS.details;
    view.innerHTML = render() + navFoot(tab);
    updateLive();
  }

  const SCREENS = {
    details() {
      return `<h2>Job details</h2>
        <div class="card">
          ${text('Job name', 'details.name', { ph: 'e.g. Remove and replace DC pump', refresh: true })}
          <div class="row">${text('Lift plan no.', 'details.liftPlanNo', { ph: 'LP 101 SD26' })}${text('Work order', 'details.workOrder', { ph: 'WO 4151383' })}</div>
          <div class="row">${text('Permit no.', 'details.permitNo')}${text('Risk assessment no.', 'details.raNo', { ph: 'RA 101 SD26' })}</div>
          <div class="row">${text('Installation / location', 'details.location', { ph: 'e.g. Triton FPSO' })}${text('Area / module', 'details.area', { ph: 'e.g. Pallet P1' })}</div>
          <div class="row">${text('Author', 'details.author')}${text('Date', 'details.date', { type: 'date' })}</div>
          <div class="row">${text('Revision', 'details.revision')}${select('Colour code', 'details.colourCode', M.COLOUR_CODES.slice(1), { blankLabel: 'Record at TBT' })}</div>
          ${select('Category of lift', 'details.category', M.CATEGORIES, { blank: false })}
          ${area('Lifting operation description', 'details.description', { ph: 'What is being lifted, from where to where, and why', rows: 4 })}
        </div>
        <div class="card">
          <div class="field"><span>Communication</span>${chips('details.comms', M.COMMS)}</div>
          ${text('Personnel needed', 'details.personnel', { ph: 'e.g. 2 x riggers, 2 x mechanics' })}
        </div>`;
    },

    load() {
      return `<h2>Load / equipment</h2>
        <div class="card">
          <div class="row">${text('Equipment / tag no.', 'load.tag', { ph: 'e.g. PM-1123' })}${select('Type', 'load.type', M.ITEM_TYPES)}</div>
          ${area('Spool / valve / equipment description', 'load.description', { ph: 'e.g. DC pump with 0.5 m shaft below the body' })}
        </div>
        <div class="card">
          <h3>Weight</h3>
          <div class="row">${number('Load weight', 'load.weightKg', 'kg')}${number('Rigging weight', 'load.riggingKg', 'kg', { ph: 'optional' })}</div>
          ${select('Where the weight came from', 'load.weightSource', M.WEIGHT_SOURCES)}
          ${select('Weight verified?', 'load.weightVerified', [['yes', 'Yes, verified'], ['no', 'No, assessed only']])}
          <div data-live="loadTotal"></div>
          <p class="small muted">No weight? Use the weight estimator in <a href="#/job/${job.id}/calcs">Calcs</a>.</p>
        </div>
        <div class="card">
          <h3>Size and shape</h3>
          <div class="row3">${number('Length', 'load.length', 'mm')}${number('Width', 'load.width', 'mm')}${number('Height', 'load.height', 'mm')}</div>
          ${text('Centre of gravity', 'load.cog', { ph: 'e.g. central, or 200 mm towards motor end' })}
          ${select('Lifting attachment', 'load.attachment', M.ATTACHMENT)}
          <div class="field"><span>Load notes</span>${chips('load.flags', M.LOAD_FLAGS)}</div>
          ${area('Other notes', 'load.notes')}
        </div>
        <div class="card">
          <h3>Photos of the load</h3>
          ${photoBlock('load.photos', job.load.tag || 'Load')}
        </div>`;
    },

    points() {
      const lps = job.liftingPoints;
      return `<h2>Lifting points</h2>
        <p class="muted small">Add the overhead suspension points (e.g. LP1 on the lifting frame) and the attachment points on the load. Take photos of each one.</p>
        ${lps.map((lp, i) => `
          <div class="card">
            <div class="card-head"><h3>${lp.role === 'load' ? 'Attachment on load' : 'Suspension point'}</h3>${itemTools('liftingPoints', i, lps.length)}</div>
            <div class="row">${text('Name', `liftingPoints.${i}.name`)}${select('Type', `liftingPoints.${i}.type`, M.LP_TYPES)}</div>
            <div class="row">
              ${lp.role === 'suspension' ? number('SWL', `liftingPoints.${i}.swlKg`, 'kg') : ''}
              ${text('Cert / ID no.', `liftingPoints.${i}.certNo`)}
            </div>
            <div data-live="lpCheck" data-i="${i}"></div>
            ${text('Where is it?', `liftingPoints.${i}.location`, { ph: 'e.g. above pump on scaffold lifting frame' })}
            ${area('Rigging at this point', `liftingPoints.${i}.rigging`, { ph: 'e.g. 1 x 1te endless round sling 1.5 m figure of eight basket, 1 x 3.25te bow shackle, 1 x 500 kg chain block 3 m' })}
            ${area('Notes', `liftingPoints.${i}.notes`, { rows: 2 })}
            ${photoBlock(`liftingPoints.${i}.photos`, lp.name)}
          </div>`).join('')}
        <div class="actions">
          <button type="button" class="btn primary" data-act="add-lp" data-role="suspension">+ Suspension point</button>
          <button type="button" class="btn" data-act="add-lp" data-role="load">+ Attachment on load</button>
        </div>
        <a class="btn block" href="#/job/${job.id}/calcs">Sling angle and distance calculator</a>`;
    },

    rigging() {
      const rs = job.rigging;
      const quick = ['Chain block', 'Lever hoist', 'Bow shackle', 'Endless round sling', 'Master link', 'Beam clamp', 'Webbing sling', 'Wire rope sling'];
      return `<h2>Lifting equipment and accessories</h2>
        ${datalist('rig-items', M.RIGGING_ITEMS)}
        ${rs.map((r, i) => `
          <div class="card">
            <div class="card-head"><h3>Item ${i + 1}</h3>${itemTools('rigging', i, rs.length)}</div>
            <div class="row">${number('Qty', `rigging.${i}.qty`, 'no.')}${text('Item', `rigging.${i}.item`, { list: 'rig-items' })}</div>
            <div class="row3">
              ${number('WLL / SWL', `rigging.${i}.wll`, '')}
              ${select('Unit', `rigging.${i}.wllUnit`, [['te', 'te'], ['kg', 'kg']], { blank: false })}
              ${number('Length', `rigging.${i}.length`, 'm')}
            </div>
            ${text('Notes', `rigging.${i}.notes`, { ph: 'e.g. cert no., colour code checked' })}
          </div>`).join('')}
        <div class="card">
          <h3>Add equipment</h3>
          <div class="chips" style="margin-top:10px">${quick.map((q) => `<button type="button" class="btn" data-act="add-rig" data-item="${esc(q)}">+ ${esc(q)}</button>`).join('')}
            <button type="button" class="btn" data-act="add-rig" data-item="">+ Other</button></div>
        </div>
        <div class="card"><h3>Equipment list (section 6.0)</h3><div data-live="riggingList"></div></div>`;
    },

    steps() {
      const st = job.steps;
      let n = 0;
      return `<h2>Task steps</h2>
        ${datalist('who', M.RESPONSIBLE)}
        ${st.length ? '' : `<div class="card"><p>Start with the standard stages (pre-rig, remove, re-install, de-rig) or add your own steps.</p>
          <button type="button" class="btn primary block" data-act="step-template">Use standard stages</button></div>`}
        ${st.map((s, i) => {
          if (s.type === 'stage') {
            n = 0;
            return `<div class="card stage-row"><div class="card-head"><h3>Stage heading</h3>${itemTools('steps', i, st.length)}</div>
              <input type="text" data-bind="steps.${i}.text" value="${esc(s.text)}" aria-label="Stage heading"></div>`;
          }
          n++;
          return `<div class="card"><div class="card-head"><h3>Step ${n}</h3>${itemTools('steps', i, st.length)}</div>
            <textarea data-bind="steps.${i}.text" rows="3" aria-label="Step ${n}">${esc(s.text)}</textarea>
            <label class="field" style="margin:10px 0 0"><span>Responsibility</span><input type="text" data-bind="steps.${i}.who" value="${esc(s.who)}" list="who"></label></div>`;
        }).join('')}
        <div class="actions">
          <button type="button" class="btn primary" data-act="add-step" data-type="step">+ Step</button>
          <button type="button" class="btn" data-act="add-step" data-type="stage">+ Stage heading</button>
        </div>`;
    },

    calcs() {
      return `<h2>Calculations</h2>
        ${calculators(true)}
        <h2>Saved to this job</h2>
        ${job.calcs.length ? job.calcs.map((c, i) => `
          <div class="card"><div class="card-head"><h3>${esc(c.title)}</h3>
            <button type="button" class="icon-btn danger" data-act="remove" data-list="calcs" data-i="${i}" aria-label="Delete">✕</button></div>
            <p class="small" style="white-space:pre-line">${esc(c.summary)}</p><p class="muted small">${esc(dateTime(c.at))}</p></div>`).join('')
          : '<p class="muted">Nothing saved yet. Use “Save to job” under a result.</p>'}`;
    },

    photos() {
      return `<h2>Photos, sketches and drawings</h2>
        <p class="muted small">Lift drawings and sketches for section 7.0. Tap a photo to add a caption or mark it up with arrows and labels. Photos of the load and lifting points are kept in those sections.</p>
        <div class="card">${photoBlock('photos', '', { sketch: true })}</div>`;
    },

    risk() {
      return `<h2>Risk assessment</h2>
        <div class="card">
          ${area('Risk assessment notes', 'risk.notes', { rows: 5, ph: 'Hazards, who could be harmed, what could go wrong' })}
          ${area('Extra control measures', 'risk.controls', { rows: 4 })}
          ${area('Toolbox talk notes', 'risk.tbt', { rows: 3 })}
        </div>
        <div class="card">
          <h3>Non-generic hazards checklist (section 9.0)</h3>
          <p class="muted small">Answer the ones that apply. Hazards that the lift method does not remove need a specific risk assessment.</p>
          ${M.HAZARDS.map(hazardHtml).join('')}
        </div>`;
    },

    report() {
      const checks = M.checks(job);
      const dirty = self.LiftSync.isDirty(job);
      return `<h2>Report and sending</h2>
        <div class="card">
          ${msg('ok', 'Saved on this phone' + (lastSaved ? ' at ' + time(lastSaved) : '') + '. Safe to lock the phone.')}
          ${settings.endpoint
            ? (dirty ? msg('caution', 'Waiting to upload. It uploads by itself when you are back on Wi-Fi.') : msg('ok', 'Uploaded to the server.'))
            : msg('info', 'Back on Wi-Fi? Use “Share report” to send it by email or Teams. You can also set up automatic upload in Settings.')}
          ${settings.endpoint ? '<button type="button" class="btn block" data-act="sync-now">Upload now</button>' : ''}
        </div>
        ${checks.length ? `<div class="card"><h3>Check before issuing</h3>${checks.map((c) => msg(c.level, c.text)).join('')}</div>` : ''}
        <div class="actions">
          <button type="button" class="btn primary" data-act="share-report">Share report</button>
          <button type="button" class="btn" data-act="print">Print / save PDF</button>
          <button type="button" class="btn" data-act="export-job">Export job file</button>
          <button type="button" class="btn" data-act="dup-job">Duplicate job</button>
        </div>
        <h3 style="margin:14px 0 8px">Preview</h3>
        <div class="report-preview">${R.body(job, thumbMap())}</div>
        <div class="actions" style="margin-top:24px"><button type="button" class="btn danger block" data-act="del-job">Delete this job</button></div>`;
    },
  };

  function hazardHtml(h) {
    const a = job.hazards[h.id] || {};
    const seg = (k, v) => `<div class="seg" role="group">${['yes', 'no'].map((x) =>
      `<button type="button" data-act="haz" data-id="${h.id}" data-k="${k}" data-v="${x}" class="${v === x ? 'on' : ''}" aria-pressed="${v === x}">${x === 'yes' ? 'Yes' : 'No'}</button>`).join('')}</div>`;
    return `<div class="hazard" data-haz="${h.id}">
      <div>${esc(h.label)}</div>
      <div class="hazard-q"><label>Applies?</label>${seg('applicable', a.applicable)}
        ${a.applicable === 'yes' ? `<label>Removed by the lift method?</label>${seg('eliminated', a.eliminated)}` : ''}</div>
      ${a.applicable === 'yes' ? `<label class="field" style="margin:10px 0 0"><span>Controls / notes</span>
        <textarea data-bind="hazards.${h.id}.note" rows="2">${esc(a.note || '')}</textarea></label>` : ''}
    </div>`;
  }

  function thumbMap() {
    const out = {};
    thumbs.forEach((src, id) => { out[id] = { src, caption: captions.get(id) }; });
    return out;
  }

  /* ---------- Calculators ---------- */

  const SELECT_KEYS = new Set(['aMode', 'legs', 'share', 'modeId', 'wllUnit', 'shape', 'material', 'water']);

  function cs(id) {
    if (!calcState[id]) calcState[id] = {};
    return calcState[id];
  }
  function parsed(id) {
    const raw = cs(id);
    const out = {};
    Object.keys(raw).forEach((k) => { out[k] = SELECT_KEYS.has(k) ? raw[k] : num(raw[k]); });
    return out;
  }
  function cnum(id, k, label, unit) {
    return `<label class="field"><span>${esc(label)}</span><div class="unit" data-unit="${esc(unit)}">
      <input type="text" inputmode="decimal" data-calc="${id}" data-k="${k}" value="${esc(cs(id)[k] ?? '')}" autocomplete="off"></div></label>`;
  }
  function csel(id, k, label, options, rerender) {
    const cur = cs(id)[k] ?? options[0][0];
    if (cs(id)[k] == null) cs(id)[k] = cur;
    return `<label class="field"><span>${esc(label)}</span><select data-calc="${id}" data-k="${k}"${rerender ? ' data-rerender="1"' : ''}>
      ${options.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select></label>`;
  }
  const kg = (v) => M.fmtKg(v);

  function slingSvg(r) {
    const k = Math.min(240 / r.S, 120 / r.H);
    const cx = 160;
    const hy = 24;
    const half = (r.S / 2) * k;
    const ly = hy + r.H * k;
    const a = (r.fromVertical * Math.PI) / 180;
    const rad = Math.min(28, r.H * k * 0.6);
    return `<svg class="diagram" viewBox="0 0 320 200" role="img" aria-label="Sling diagram">
      <line x1="${cx}" y1="${hy}" x2="${cx}" y2="${ly}" stroke="currentColor" stroke-dasharray="4 4" opacity=".6"/>
      <line x1="${cx}" y1="${hy}" x2="${cx - half}" y2="${ly}" stroke-width="4" style="stroke:var(--accent)"/>
      <line x1="${cx}" y1="${hy}" x2="${cx + half}" y2="${ly}" stroke-width="4" style="stroke:var(--accent)"/>
      <path d="M ${cx} ${hy + rad} A ${rad} ${rad} 0 0 0 ${cx + rad * Math.sin(a)} ${hy + rad * Math.cos(a)}" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="${cx}" cy="${hy}" r="6" fill="currentColor"/>
      <rect x="${cx - half - 12}" y="${ly}" width="${half * 2 + 24}" height="28" rx="3" fill="currentColor" opacity=".18" stroke="currentColor"/>
      <text x="${cx + rad + 6}" y="${hy + rad + 4}">${fmt(r.fromVertical, 1)}°</text>
      <text x="${cx - half / 2 - 8}" y="${(hy + ly) / 2}" text-anchor="end">L ${fmt(r.L)} m</text>
      <text x="${cx + 6}" y="${ly - 8}">H ${fmt(r.H)} m</text>
      <text x="${cx}" y="${ly + 46}" text-anchor="middle">S ${fmt(r.S)} m</text>
    </svg>`;
  }

  function crossSvg(s, r) {
    const pts = { A: [0, 0], B: [s.span, s.dh || 0], P: [s.x, -s.drop] };
    const xs = [0, s.span, s.x];
    const ys = [0, s.dh || 0, -s.drop];
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const k = Math.min(220 / (maxX - minX || 1), 120 / (maxY - minY || 1));
    const X = (x) => 50 + (x - minX) * k;
    const Y = (y) => 36 + (maxY - y) * k;
    const [ax, ay] = [X(pts.A[0]), Y(pts.A[1])];
    const [bx, by] = [X(pts.B[0]), Y(pts.B[1])];
    const [px, py] = [X(pts.P[0]), Y(pts.P[1])];
    const t = (v) => (v < 0 ? 'slack' : `${fmt(v, 0)} kg`);
    return `<svg class="diagram" viewBox="0 0 320 214" role="img" aria-label="Cross-haul diagram">
      <line x1="${Math.min(ax, bx) - 20}" y1="${ay}" x2="${ax}" y2="${ay}" stroke="currentColor" stroke-width="3" opacity=".5"/>
      <line x1="${ax}" y1="${ay}" x2="${bx}" y2="${by}" stroke="currentColor" stroke-width="3" opacity=".5"/>
      <line x1="${bx}" y1="${by}" x2="${Math.max(ax, bx) + 20}" y2="${by}" stroke="currentColor" stroke-width="3" opacity=".5"/>
      <line x1="${ax}" y1="${ay}" x2="${px}" y2="${py}" stroke-width="4" stroke-dasharray="7 4" style="stroke:var(--accent)"/>
      <line x1="${bx}" y1="${by}" x2="${px}" y2="${py}" stroke-width="4" stroke-dasharray="7 4" style="stroke:var(--accent)"/>
      <circle cx="${ax}" cy="${ay}" r="6" fill="currentColor"/><circle cx="${bx}" cy="${by}" r="6" fill="currentColor"/>
      <rect x="${px - 16}" y="${py}" width="32" height="26" rx="3" fill="currentColor" opacity=".25" stroke="currentColor"/>
      <text x="${ax}" y="${ay - 12}" text-anchor="middle">A: ${t(r.tA)}</text>
      <text x="${bx}" y="${by - 12}" text-anchor="middle">B: ${t(r.tB)}</text>
      <text x="${px}" y="${py + 44}" text-anchor="middle">${fmt(s.W, 0)} kg</text>
    </svg>`;
  }

  const CALCS = {
    sling: {
      title: 'Sling angle and distance between lifting points',
      intro: 'Fill in any two of the four boxes. It works out the rest.',
      fields: (id) => `
        <div class="row">${cnum(id, 'L', 'Sling leg length', 'm')}${cnum(id, 'S', 'Distance between lifting points', 'm')}</div>
        <div class="row">${cnum(id, 'H', 'Height, lifting points to hook', 'm')}${cnum(id, 'a', 'Sling angle', '°')}</div>
        ${csel(id, 'aMode', 'Angle measured', [['v', 'From vertical'], ['i', 'Included (between the legs)'], ['h', 'From horizontal']])}
        ${cnum(id, 'W', 'Load weight (optional)', 'kg')}
        <button type="button" class="btn" data-act="calc-clear" data-calc="${id}">Clear</button>`,
      run(s) {
        let a = s.a;
        if (a != null && s.aMode === 'i') a /= 2;
        else if (a != null && s.aMode === 'h') a = 90 - a;
        const r = C.slingGeometry({ L: s.L, S: s.S, H: s.H, a });
        if (r.error) return r;
        const big = s.W ? [[`Tension per leg (2 legs, ${fmt(s.W, 0)} kg load)`, kg((s.W / 2) * r.tensionFactor)]] : [];
        return {
          big,
          results: [
            ['Sling leg length', `${fmt(r.L)} m`], ['Distance between points', `${fmt(r.S)} m`],
            ['Height to hook', `${fmt(r.H)} m`], ['From vertical', `${fmt(r.fromVertical, 1)}°`],
            ['Included angle', `${fmt(r.included, 1)}°`], ['From horizontal', `${fmt(r.fromHorizontal, 1)}°`],
            ['Tension factor', `× ${fmt(r.tensionFactor, 3)}`],
          ],
          warnings: r.warnings,
          svg: slingSvg(r),
        };
      },
    },

    tension: {
      title: 'Sling leg tension',
      intro: 'Load in each leg of a multi-leg sling at an angle.',
      fields: (id) => `
        <div class="row">${cnum(id, 'W', 'Load weight', 'kg')}${cnum(id, 'a', 'Leg angle from vertical', '°')}</div>
        ${csel(id, 'legs', 'Number of legs', [['2', '2 legs'], ['3', '3 legs'], ['4', '4 legs']], true)}
        ${cs(id).legs && cs(id).legs !== '2' ? csel(id, 'share', 'Legs taking the load', [['2', 'Assume only 2 legs take it (safe default)'], ['all', 'All legs share it equally']]) : ''}
        ${cnum(id, 'wll', 'WLL of each leg (optional)', 'kg')}`,
      run(s) {
        const legs = +(s.legs || 2);
        const sharing = legs === 2 || s.share !== 'all' ? 2 : legs;
        const r = C.legTension({ W: s.W, a: s.a, sharing });
        if (r.error) return r;
        const warnings = [...r.warnings];
        if (s.wll) {
          warnings.push(s.wll >= r.perLeg
            ? { level: 'ok', text: `Leg WLL ${kg(s.wll)} is enough for ${kg(r.perLeg)}.` }
            : { level: 'danger', text: `Leg WLL ${kg(s.wll)} is LESS than the leg tension ${kg(r.perLeg)}.` });
        }
        return {
          big: [['Tension in each leg', kg(r.perLeg)]],
          results: [['Tension factor', `× ${fmt(r.factor, 3)}`], ['Included angle', `${fmt(r.included, 1)}°`], ['Legs taking the load', String(sharing)]],
          warnings,
        };
      },
    },

    cross: {
      title: 'Cross-haul between two lifting points',
      intro: 'For moving a load from one chain block to another (e.g. LP1 to LP2). Measure the load position from LP A: across, and down below it.',
      fields: (id) => `
        ${cnum(id, 'W', 'Load weight', 'kg')}
        <div class="row">${cnum(id, 'span', 'Distance LP A to LP B', 'm')}${cnum(id, 'dh', 'LP B higher than A by (optional)', 'm')}</div>
        <div class="row">${cnum(id, 'x', 'Load across from LP A', 'm')}${cnum(id, 'drop', 'Load below LP A', 'm')}</div>
        ${cnum(id, 'wll', 'Chain block WLL (optional)', 'kg')}`,
      run(s) {
        const r = C.crossHaul({ W: s.W, span: s.span, dh: s.dh || 0, x: s.x, drop: s.drop });
        if (r.error) return r;
        const warnings = [...r.warnings];
        if (s.wll) {
          const worst = Math.max(r.tA, r.tB);
          warnings.push(s.wll >= worst
            ? { level: 'ok', text: `Chain block WLL ${kg(s.wll)} is enough for the highest load ${kg(worst)}.` }
            : { level: 'danger', text: `Chain block WLL ${kg(s.wll)} is LESS than ${kg(worst)}.` });
        }
        return {
          big: [['LP A takes', r.tA < 0 ? 'Slack' : kg(r.tA)], ['LP B takes', r.tB < 0 ? 'Slack' : kg(r.tB)]],
          results: [
            ['Chain A from vertical', `${fmt(r.angA, 1)}°`], ['Chain B from vertical', `${fmt(r.angB, 1)}°`],
            ['Chain A length', `${fmt(r.lenA)} m`], ['Chain B length', `${fmt(r.lenB)} m`],
            ['Angle between chains', `${fmt(r.between, 1)}°`],
          ],
          inputs: [['Load', kg(s.W)], ['A to B', `${fmt(s.span)} m`], ['B higher by', `${fmt(s.dh || 0)} m`], ['Load across from A', `${fmt(s.x)} m`], ['Load below A', `${fmt(s.drop)} m`]],
          warnings,
          svg: crossSvg(s, r),
        };
      },
    },

    cog: {
      title: 'Offset centre of gravity',
      intro: 'How much each lifting point takes when the centre of gravity is not in the middle.',
      fields: (id) => `
        ${cnum(id, 'W', 'Load weight', 'kg')}
        <div class="row">${cnum(id, 'd1', 'Point 1 to centre of gravity', 'm')}${cnum(id, 'd2', 'Centre of gravity to point 2', 'm')}</div>`,
      run(s) {
        const r = C.cogShare({ W: s.W, d1: s.d1, d2: s.d2 });
        if (r.error) return r;
        return {
          big: [['Point 1 takes', `${kg(r.r1)} – ${fmt(r.pct1, 0)}%`], ['Point 2 takes', `${kg(r.r2)} – ${fmt(r.pct2, 0)}%`]],
          results: [],
          inputs: [['Load', kg(s.W)], ['Point 1 to CoG', `${fmt(s.d1)} m`], ['CoG to point 2', `${fmt(s.d2)} m`]],
          warnings: [],
        };
      },
    },

    mode: {
      title: 'Sling WLL for slinging method',
      intro: 'Marked WLL × mode factor (uniform load method). Check against your company rigging procedure.',
      fields: (id) => `
        <div class="row">${cnum(id, 'wll', 'WLL marked on sling', '')}${csel(id, 'wllUnit', 'Unit', [['te', 'te'], ['kg', 'kg']])}</div>
        ${csel(id, 'modeId', 'Slinging method', C.MODE_FACTORS.map((m) => [m.id, `${m.label} (× ${m.factor})`]))}
        ${cnum(id, 'W', 'Load weight (optional)', 'kg')}
        <details><summary class="small" style="min-height:44px;display:flex;align-items:center">Show mode factor table</summary>
          <table class="ref"><tr><th>Method</th><th>Factor</th></tr>
          ${C.MODE_FACTORS.map((m) => `<tr><td>${esc(m.label)}</td><td>${m.factor}</td></tr>`).join('')}</table>
        </details>`,
      run(s) {
        const wll = s.wll == null ? null : (s.wllUnit === 'kg' ? s.wll : s.wll * 1000);
        const r = C.modeFactorWll({ wll, modeId: s.modeId });
        if (r.error) return r;
        const warnings = [];
        if (s.W) {
          warnings.push(r.maxLoad >= s.W
            ? { level: 'ok', text: `OK: ${kg(r.maxLoad)} is enough for ${kg(s.W)}.` }
            : { level: 'danger', text: `Not enough: ${kg(r.maxLoad)} is less than ${kg(s.W)}.` });
        }
        return {
          big: [['Most it can lift', kg(r.maxLoad)]],
          results: [['Method', r.label], ['Mode factor', `× ${r.factor}`]],
          inputs: [['Marked WLL', kg(wll)]],
          warnings,
        };
      },
    },

    weight: {
      title: 'Weight estimator',
      intro: 'Rough weight of pipe, plate or bar. Always check against drawings or nameplate data.',
      fields: (id) => {
        const shape = cs(id).shape || 'pipe';
        return `
        ${csel(id, 'shape', 'Shape', [['pipe', 'Pipe / spool'], ['plate', 'Plate / block'], ['bar', 'Solid round bar']], true)}
        ${csel(id, 'material', 'Material', Object.entries(C.MATERIALS).map(([k, m]) => [k, m.label]))}
        ${shape === 'pipe' ? `<div class="row">${cnum(id, 'od', 'Outside diameter', 'mm')}${cnum(id, 'wt', 'Wall thickness', 'mm')}</div>
          <div class="row">${cnum(id, 'length', 'Length', 'm')}${csel(id, 'water', 'Contents', [['no', 'Empty'], ['yes', 'Full of water']])}</div>` : ''}
        ${shape === 'plate' ? `<div class="row3">${cnum(id, 'l', 'Length', 'mm')}${cnum(id, 'w', 'Width', 'mm')}${cnum(id, 't', 'Thickness', 'mm')}</div>` : ''}
        ${shape === 'bar' ? `<div class="row">${cnum(id, 'd', 'Diameter', 'mm')}${cnum(id, 'length', 'Length', 'm')}</div>` : ''}
        ${cnum(id, 'extra', 'Add for flanges, valves, fittings', '%')}
        <p class="small muted">Tip: pipe OD 6″ = 168.3 mm, 4″ = 114.3 mm, 8″ = 219.1 mm, 10″ = 273.1 mm.</p>`;
      },
      run(s) {
        const density = (C.MATERIALS[s.material || 'carbon'] || C.MATERIALS.carbon).density;
        const shape = s.shape || 'pipe';
        let r;
        if (shape === 'pipe') r = C.pipeWeight({ od: s.od, wt: s.wt, length: s.length, density, fillWater: s.water === 'yes' });
        else if (shape === 'plate') r = C.plateWeight({ l: s.l, w: s.w, t: s.t, density });
        else r = C.barWeight({ d: s.d, length: s.length, density });
        if (r.error) return r;
        const total = r.total * (1 + (s.extra || 0) / 100);
        const results = [];
        if (shape === 'pipe') {
          results.push(['Pipe per metre', `${fmt(r.perMetre, 1)} kg/m`], ['Pipe only', kg(r.steel)]);
          if (r.water) results.push(['Water', kg(r.water)]);
        }
        if (s.extra) results.push(['Allowance', `+${fmt(s.extra, 0)}%`]);
        return { big: [['Estimated weight', kg(total)]], results, warnings: [], value: total };
      },
    },
  };

  function calcOut(id) {
    const def = CALCS[id];
    const r = def.run(parsed(id));
    if (r.error) {
      const touched = Object.entries(cs(id)).some(([k, v]) => !SELECT_KEYS.has(k) && v !== '' && v != null);
      return touched ? msg('info', r.error) : '';
    }
    return `
      ${r.svg || ''}
      <div class="results">
        ${(r.big || []).map(([k, v]) => `<div class="result big"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
        ${r.results.map(([k, v]) => `<div class="result"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}
      </div>
      ${(r.warnings || []).map((w) => msg(w.level, w.text)).join('')}
      ${job ? `<div class="actions">
        <button type="button" class="btn" data-act="save-calc" data-calc="${id}">Save to job</button>
        ${id === 'weight' ? '<button type="button" class="btn" data-act="use-weight">Use as load weight</button>' : ''}
      </div>` : ''}`;
  }

  function calcSummary(id) {
    const r = CALCS[id].run(parsed(id));
    if (r.error) return null;
    const lines = [];
    if (r.inputs) lines.push(r.inputs.map(([k, v]) => `${k}: ${v}`).join(', '));
    lines.push([...(r.big || []), ...r.results].map(([k, v]) => `${k}: ${v}`).join(', '));
    (r.warnings || []).forEach((w) => lines.push((w.level === 'danger' ? 'WARNING: ' : '') + w.text));
    return lines.join('\n');
  }

  function calcBody(id) {
    return `<p class="muted small">${esc(CALCS[id].intro)}</p>${CALCS[id].fields(id)}<div data-out="${id}">${calcOut(id)}</div>`;
  }

  function calculators(inJob) {
    if (inJob) {
      // Start from this job's load weight.
      const total = M.totalLoadKg(job);
      ['sling', 'tension', 'cross', 'cog', 'mode'].forEach((id) => {
        if (total && (cs(id).W == null || cs(id).W === '')) cs(id).W = String(total);
      });
    }
    return Object.keys(CALCS).map((id) => `
      <details class="calc card" data-calc-box="${id}"${calcOpen.has(id) ? ' open' : ''}>
        <summary>${esc(CALCS[id].title)}</summary>
        <div data-calc-body="${id}">${calcBody(id)}</div>
      </details>`).join('');
  }

  function renderCalcPage() {
    setChrome('Calculators', false);
    view.innerHTML = `<p class="muted small">Quick calculations. Open a job to save results to it.</p>${calculators(false)}`;
  }

  /* ---------- Settings ---------- */

  function displayPrefs() {
    try { return JSON.parse(localStorage.getItem('lp-display') || '{}'); } catch (e) { return {}; }
  }
  function setDisplayPref(k, v) {
    const p = displayPrefs();
    if (v) p[k] = v; else delete p[k];
    try { localStorage.setItem('lp-display', JSON.stringify(p)); } catch (e) { /* ignore */ }
    if (v) document.documentElement.dataset[k] = v; else delete document.documentElement.dataset[k];
  }

  async function renderSettings() {
    setChrome('Settings', false);
    const p = displayPrefs();
    const last = await self.LiftDB.kvGet('lastSync');
    let storage = '';
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
      storage = `<p>Using ${fmt((est.usage || 0) / 1048576, 1)} MB on this phone.</p>
        ${persisted ? msg('ok', 'Protected: the phone will not clear this data to free up space.')
          : `${msg('caution', 'Not protected yet. The phone could clear saved jobs if it runs out of space.')}
            <button type="button" class="btn block" data-act="persist">Protect saved jobs</button>`}`;
    }
    const opt = (k, v, label) => `<button type="button" class="btn${(p[k] || '') === v ? ' primary' : ''}" data-act="display" data-k="${k}" data-v="${v}">${label}</button>`;
    const sText = (label, k, type = 'text', ph = '') => `<label class="field"><span>${esc(label)}</span>
      <input type="${type}" data-setting="${k}" value="${esc(settings[k] || '')}" placeholder="${esc(ph)}" autocomplete="off"></label>`;

    view.innerHTML = `
      <div class="card"><h3>Screen</h3>
        <p class="small muted" style="margin-top:6px">Sun mode is easiest to read outside.</p>
        <div class="actions">${opt('theme', 'light', 'Sun')}${opt('theme', 'dark', 'Night')}${opt('theme', '', 'Auto')}</div>
        <div class="actions">${opt('size', '', 'Normal text')}${opt('size', 'large', 'Large text')}</div>
      </div>
      <div class="card"><h3>Defaults for new jobs</h3>
        ${sText('Your name (author)', 'author')}
        ${sText('Installation / location', 'location', 'text', 'e.g. Triton FPSO')}
      </div>
      <div class="card"><h3>Automatic upload</h3>
        <p class="small muted" style="margin-top:6px">Optional. If your team has a server or Power Automate flow that accepts jobs, enter its web address. Jobs upload by themselves when the phone is back on Wi-Fi. Leave blank to send reports by Share instead.</p>
        ${sText('Upload address (https://…)', 'endpoint', 'url', 'https://')}
        ${sText('Access key (if needed)', 'token', 'password')}
        <button type="button" class="btn block" data-act="sync-now">Upload now</button>
        ${last ? `<p class="small muted" style="margin-top:8px">Last try ${esc(dateTime(last.at))}: ${last.sent} sent${last.failed ? `, ${last.failed} failed (${esc(last.error || '')})` : ''}.</p>` : ''}
      </div>
      <div class="card"><h3>Storage and backup</h3>${storage}
        <div class="actions">
          <button type="button" class="btn" data-act="export-all">Back up all jobs</button>
          <label class="btn">Restore / import<input class="file-input" type="file" accept=".json,application/json" data-import="1"></label>
        </div>
      </div>
      <div class="card"><h3>How it works with no signal</h3>
        <p class="small">Open the app once on Wi-Fi and it saves itself to the phone. After that it opens and works with no signal. Everything you type and every photo is saved on the phone as you go, so you can lock the phone or close the app at any time.</p>
        <p class="small">Back inside on Wi-Fi, jobs upload by themselves if an upload address is set. Otherwise open the job, go to Report and tap Share report.</p>
        <p class="small muted">Version ${APP_VERSION}. ${navigator.serviceWorker && navigator.serviceWorker.controller ? 'Offline ready.' : 'Not offline ready yet.'}</p>
        <button type="button" class="btn block" data-act="check-update">Check for updates</button>
      </div>`;
  }

  /* ---------- Export, import, share ---------- */

  async function fullPhotoMap(j) {
    const out = {};
    const photos = await self.LiftDB.jobPhotos(j.id);
    for (const p of photos) {
      out[p.id] = { src: await blobToDataUrl(p.blob), caption: p.caption };
    }
    return out;
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  }

  async function shareOrDownload(file, title) {
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title });
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return false;
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return true;
  }

  async function shareReport() {
    await flush();
    toast('Building report…');
    const html = R.standalone(job, await fullPhotoMap(job));
    const name = slug([job.details.liftPlanNo, job.details.name].filter(Boolean).join(' ')) + '.html';
    await shareOrDownload(new File([html], name, { type: 'text/html' }), job.details.name || 'Lift plan');
  }

  async function printReport() {
    await flush();
    const photos = await self.LiftDB.jobPhotos(job.id);
    const urls = {};
    photos.forEach((p) => { urls[p.id] = { src: URL.createObjectURL(p.blob), caption: p.caption }; });
    const holder = $('#print');
    holder.innerHTML = R.body(job, urls);
    await Promise.all([...holder.querySelectorAll('img')].map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
    const cleanup = () => {
      holder.innerHTML = '';
      Object.values(urls).forEach((u) => URL.revokeObjectURL(u.src));
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
  }

  async function exportJob() {
    await flush();
    const payload = await self.LiftSync.buildPayload(job);
    const name = slug(job.details.liftPlanNo || job.details.name) + '.liftplan.json';
    await shareOrDownload(new File([JSON.stringify(payload)], name, { type: 'application/json' }), job.details.name || 'Lift plan');
  }

  async function exportAll() {
    const jobs = await self.LiftDB.allJobs();
    const items = [];
    for (const j of jobs) items.push(await self.LiftSync.buildPayload(j));
    const stamp = new Date().toISOString().slice(0, 10);
    await shareOrDownload(
      new File([JSON.stringify({ app: 'lift-planner', format: 1, backup: true, items })], `lift-planner-backup-${stamp}.json`, { type: 'application/json' }),
      'Lift Planner backup'
    );
  }

  function base64ToBlob(data, type) {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: type || 'image/jpeg' });
  }

  function photoLists(j) {
    return [j.load.photos, j.photos, ...j.liftingPoints.map((lp) => lp.photos)];
  }

  // Copies a job and its photos under new ids.
  async function storeCopy(j, photos) {
    const map = new Map();
    const copy = JSON.parse(JSON.stringify(j));
    copy.id = M.uid();
    photoLists(copy).forEach((list) => list.forEach((pid, i) => {
      if (!map.has(pid)) map.set(pid, M.uid());
      list[i] = map.get(pid);
    }));
    for (const p of photos) {
      if (!map.has(p.id)) continue;
      await self.LiftDB.putPhoto({ ...p, id: map.get(p.id), jobId: copy.id });
    }
    return copy;
  }

  async function importPayload(payload) {
    const photos = [];
    for (const p of payload.photos || []) {
      const blob = base64ToBlob(p.data, p.type);
      let thumb = blob;
      try { thumb = await resize(await decodeImage(blob), 360, 0.7); } catch (e) { /* use full image */ }
      photos.push({ id: p.id, jobId: payload.job.id, blob, thumb, caption: p.caption || '', createdAt: p.createdAt || Date.now() });
    }
    const existing = await self.LiftDB.getJob(payload.job.id);
    let j = { ...M.newJob(), ...payload.job };
    if (existing) {
      // Keep both: the imported one comes in as a copy.
      j = await storeCopy(j, photos);
      j.details.name = (j.details.name || 'Untitled lift') + ' (imported)';
    } else {
      for (const p of photos) await self.LiftDB.putPhoto(p);
    }
    j.syncedAt = 0;
    await self.LiftDB.putJob(j);
  }

  async function importFile(file) {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'lift-planner') throw new Error('This is not a Lift Planner file.');
      const items = data.backup ? data.items : [data];
      for (const it of items) await importPayload(it);
      toast(`Imported ${items.length} job${items.length > 1 ? 's' : ''}.`);
    } catch (e) {
      toast('Import failed: ' + e.message);
    }
    route();
  }

  async function duplicateJob() {
    await flush();
    const photos = await self.LiftDB.jobPhotos(job.id);
    const copy = await storeCopy(job, photos);
    const now = Date.now();
    Object.assign(copy, { createdAt: now, updatedAt: now, syncedAt: 0 });
    copy.details.name = (copy.details.name || 'Untitled lift') + ' (copy)';
    await self.LiftDB.putJob(copy);
    toast('Job duplicated.');
    location.hash = `#/job/${copy.id}/details`;
  }

  /* ---------- Events ---------- */

  view.addEventListener('input', onInput);
  view.addEventListener('change', onInput);
  view.addEventListener('toggle', (e) => {
    const box = e.target.dataset && e.target.dataset.calcBox;
    if (box) { if (e.target.open) calcOpen.add(box); else calcOpen.delete(box); }
  }, true);

  function onInput(e) {
    const el = e.target;
    if (el.id === 'search') {
      sessionStorageSet('lp-search', el.value);
      clearTimeout(onInput.searchTimer);
      onInput.searchTimer = setTimeout(() => renderHome().then(() => {
        const s = $('#search');
        if (s) { s.focus(); s.setSelectionRange(s.value.length, s.value.length); }
      }), 250);
      return;
    }
    if (e.type === 'change' && el.dataset.photoTarget) {
      const files = [...el.files];
      el.value = '';
      if (files.length) addPhotos(files, el.dataset.photoTarget, el.dataset.caption);
      return;
    }
    if (e.type === 'change' && el.dataset.import) {
      const f = el.files[0];
      el.value = '';
      if (f) importFile(f);
      return;
    }
    if (el.dataset.setting) {
      settings[el.dataset.setting] = el.value.trim();
      self.LiftDB.kvSet('settings', settings);
      return;
    }
    if (el.dataset.calc) {
      if (e.type === 'input' && el.tagName === 'SELECT') return;
      cs(el.dataset.calc)[el.dataset.k] = el.value;
      if (el.dataset.rerender) {
        const body = view.querySelector(`[data-calc-body="${el.dataset.calc}"]`);
        body.innerHTML = calcBody(el.dataset.calc);
      } else {
        view.querySelector(`[data-out="${el.dataset.calc}"]`).innerHTML = calcOut(el.dataset.calc);
      }
      return;
    }
    if (!job) return;
    if (el.dataset.bind) {
      // Selects fire both input and change; only take one.
      if (e.type === 'change' && el.tagName !== 'SELECT') return;
      if (e.type === 'input' && el.tagName === 'SELECT') return;
      let v = el.value;
      if (el.dataset.type === 'num') v = num(v);
      setPath(job, el.dataset.bind, v);
      touch();
      if (el.dataset.bind === 'details.name') $('#title').textContent = v || 'Untitled lift';
      updateLive();
      if (el.dataset.refresh) renderTabs(currentTab());
    } else if (el.dataset.bindList && e.type === 'change') {
      const list = getPath(job, el.dataset.bindList) || [];
      const i = list.indexOf(el.value);
      if (el.checked && i < 0) list.push(el.value);
      if (!el.checked && i >= 0) list.splice(i, 1);
      setPath(job, el.dataset.bindList, list);
      touch();
    }
  }

  document.addEventListener('click', async (e) => {
    // Save before the camera opens, in case the phone closes the browser to free memory.
    if (e.target.closest('label') && e.target.closest('label').querySelector('[data-photo-target]')) flush();

    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const act = b.dataset.act;
    const i = +b.dataset.i;

    switch (act) {
      case 'new-job': return newJob();
      case 'add-lp': {
        const n = job.liftingPoints.filter((lp) => lp.role === b.dataset.role).length + 1;
        job.liftingPoints.push(M.newLiftingPoint(b.dataset.role, n));
        touch(); renderJob('points');
        return;
      }
      case 'add-rig':
        job.rigging.push(M.newRiggingItem(b.dataset.item));
        touch(); renderJob('rigging');
        return;
      case 'add-step':
        job.steps.push(b.dataset.type === 'stage' ? { id: M.uid(), type: 'stage', text: 'STAGE' } : { id: M.uid(), type: 'step', text: '', who: 'Riggers' });
        touch(); renderJob('steps');
        return;
      case 'step-template':
        job.steps.push(...M.STEP_TEMPLATE.map((s) => ({ id: M.uid(), who: '', ...s })));
        touch(); renderJob('steps');
        return;
      case 'move': {
        const list = job[b.dataset.list];
        const j = i + +b.dataset.dir;
        if (j < 0 || j >= list.length) return;
        [list[i], list[j]] = [list[j], list[i]];
        touch(); renderJob(currentTab());
        return;
      }
      case 'remove': {
        const list = job[b.dataset.list];
        const item = list[i];
        const n = item.photos ? item.photos.length : 0;
        if (!confirm(n ? `Delete this and its ${n} photo${n > 1 ? 's' : ''}?` : 'Delete this?')) return;
        for (const pid of item.photos || []) await self.LiftDB.deletePhoto(pid);
        list.splice(i, 1);
        touch(); renderJob(currentTab());
        return;
      }
      case 'haz': {
        const h = job.hazards[b.dataset.id] || (job.hazards[b.dataset.id] = {});
        h[b.dataset.k] = h[b.dataset.k] === b.dataset.v ? '' : b.dataset.v;
        if (!h.applicable && !h.note) delete job.hazards[b.dataset.id];
        touch();
        const block = view.querySelector(`[data-haz="${b.dataset.id}"]`);
        block.outerHTML = hazardHtml(M.HAZARDS.find((x) => x.id === b.dataset.id));
        renderTabs('risk');
        return;
      }
      case 'view-photo': return openViewer(b.dataset.id, b.dataset.path);
      case 'sketch': {
        const out = await self.LiftMarkup.open(await self.LiftMarkup.blankSketch());
        if (out) addPhotos([out], b.dataset.path, 'Sketch');
        return;
      }
      case 'calc-clear':
        calcState[b.dataset.calc] = {};
        view.querySelector(`[data-calc-body="${b.dataset.calc}"]`).innerHTML = calcBody(b.dataset.calc);
        return;
      case 'save-calc': {
        const summary = calcSummary(b.dataset.calc);
        if (!summary) return;
        job.calcs.push({ id: M.uid(), type: b.dataset.calc, title: CALCS[b.dataset.calc].title, summary, at: Date.now() });
        touch(); renderJob('calcs');
        toast('Saved to job.');
        return;
      }
      case 'use-weight': {
        const r = CALCS.weight.run(parsed('weight'));
        if (r.error) return;
        job.load.weightKg = Math.round(r.value);
        job.load.weightSource = 'Estimated / calculated';
        job.load.weightVerified = 'no';
        touch();
        toast(`Load weight set to ${M.fmtKg(job.load.weightKg)}.`);
        renderTabs('calcs');
        return;
      }
      case 'print': return printReport();
      case 'share-report': return shareReport();
      case 'export-job': return exportJob();
      case 'dup-job': return duplicateJob();
      case 'del-job':
        if (!confirm('Delete this job and all its photos? This cannot be undone.')) return;
        await self.LiftDB.deleteJob(job.id);
        job = null;
        location.hash = '#/';
        return;
      case 'sync-now': return autoSync(true);
      case 'display':
        setDisplayPref(b.dataset.k, b.dataset.v);
        return renderSettings();
      case 'persist':
        if (navigator.storage && navigator.storage.persist) {
          const ok = await navigator.storage.persist();
          toast(ok ? 'Saved jobs are protected.' : 'The browser said no. Install the app to the home screen, then try again.');
        }
        return renderSettings();
      case 'export-all': return exportAll();
      case 'check-update': {
        const reg = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration();
        if (!reg) return toast('Offline support is not available here.');
        await reg.update().catch(() => {});
        if (!reg.waiting && !reg.installing) toast('You have the latest version.');
        return;
      }
      default:
    }
  });

  /* ---------- Routing ---------- */

  async function route() {
    await flush();
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'job' && parts[1]) {
      if (!job || job.id !== parts[1]) {
        const j = await self.LiftDB.getJob(parts[1]);
        if (!j) { toast('That job was not found.'); location.hash = '#/'; return; }
        job = j;
        lastSaved = j.updatedAt;
        await loadJobPhotos();
      }
      renderJob(parts[2] || 'details');
    } else {
      job = null;
      if (parts[0] === 'calc') renderCalcPage();
      else if (parts[0] === 'settings') await renderSettings();
      else await renderHome();
    }
  }

  window.addEventListener('hashchange', () => route().then(() => window.scrollTo(0, 0)));

  /* ---------- Offline support and updates ---------- */

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    let updating = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updating) location.reload();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const offer = () => {
        if (!reg.waiting || $('.banner')) return;
        const el = document.createElement('div');
        el.className = 'banner';
        el.innerHTML = '<p>A new version of Lift Planner is ready.</p><button type="button" class="btn primary">Update</button>';
        $('button', el).addEventListener('click', async () => {
          await flush();
          updating = true;
          reg.waiting.postMessage('skipWaiting');
        });
        document.body.appendChild(el);
      };
      if (reg.waiting && navigator.serviceWorker.controller) offer();
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        w.addEventListener('statechange', () => {
          if (w.state !== 'installed') return;
          if (navigator.serviceWorker.controller) offer();
          else toast('Ready to use with no signal.');
        });
      });
    }).catch(() => {});
  }

  async function start() {
    const style = document.createElement('style');
    style.textContent = R.CSS;
    document.head.appendChild(style);
    settings = (await self.LiftDB.kvGet('settings')) || {};
    updateNet();
    await route();
    registerServiceWorker();
    autoSync();
  }

  start().catch((e) => {
    view.innerHTML = msg('danger', 'Lift Planner could not start: ' + e.message);
  });
})();
