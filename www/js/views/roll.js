/* Reelbook — ROLL tab (on set). */
(() => {
  const { esc } = UI;
  const ui = { hideDone: false, takeFilter: '', lightDate: '', full: false };
  const RATINGS = { good: { label: '✓ Good', cls: 'ok' }, ok: { label: '~ OK', cls: 'warn' }, ng: { label: '✗ NG', cls: 'bad' } };
  const RATING_ORDER = ['good', 'ok', 'ng'];

  /* ================= SHOT TRACKER ================= */
  const tracker = {
    id: 'tracker', label: 'Shot Tracker', icon: '✅',
    render(p) {
      if (!p.shots.length) return UI.empty('✅', 'Nothing to track yet', 'Build your shot list in Prep and it shows up here as a live checklist for the day.', '<a class="btn primary" href="#prep-shots">Go to Shot List</a>');
      const done = p.shots.filter(s => s.done).length;
      const must = p.shots.filter(s => s.priority !== 'Nice to have');
      const mustLeft = must.filter(s => !s.done).length;
      const groups = {};
      p.shots.forEach(s => { if (ui.hideDone && s.done) return; (groups[s.scene || '?'] = groups[s.scene || '?'] || []).push(s); });
      return `
        ${UI.progress(done, p.shots.length)}
        <div class="toolbar">
          <label class="check inline"><input type="checkbox" data-ui-toggle="hideDone" ${ui.hideDone ? 'checked' : ''}><span>Hide completed</span></label>
          <span class="spacer"></span>
          <span class="small ${mustLeft ? 'warn-text' : 'ok-text'}">${mustLeft ? `⚠ ${mustLeft} must-have shot${mustLeft > 1 ? 's' : ''} left` : '★ All must-haves done'}</span>
        </div>
        ${Object.entries(groups).map(([scene, items]) => `
          <h3 class="group-title">Scene ${esc(scene)}</h3>
          <div class="track-list">${items.map(s => `
            <article class="track ${s.done ? 'done' : ''}">
              <button class="track-check" data-action="track-toggle" data-id="${s.id}" aria-label="Mark done">${s.done ? '✓' : ''}</button>
              <div class="grow">
                <div class="track-title"><b>${esc(C.shotLabel(s))}</b> ${esc(s.desc || '')}</div>
                <div class="badges">${C.shotBadges(s)}${s.priority === 'Nice to have' ? '<span class="badge soft">nice to have</span>' : ''}</div>
              </div>
              <div class="track-side">
                <button class="takes-btn" data-action="track-take" data-id="${s.id}" title="Add a take"><b>${s.takes || 0}</b><small>takes ＋</small></button>
                <button class="btn sm" data-action="track-slate" data-id="${s.id}">🎬 Slate</button>
              </div>
            </article>`).join('')}</div>`).join('') || '<p class="muted center">🎉 Every shot is done. That’s a wrap!</p>'}
        ${C.notesSection('roll', p, { compact: true })}`;
    },
    actions: {
      'track-toggle': el => { const s = Store.project().shots.find(x => x.id === el.dataset.id); s.done = !s.done; Store.save(); App.render(); },
      'track-take': el => { const s = Store.project().shots.find(x => x.id === el.dataset.id); s.takes = (s.takes || 0) + 1; Store.save(); App.render(); },
      'track-slate': el => {
        const p = Store.project(), s = p.shots.find(x => x.id === el.dataset.id);
        Object.assign(p.slate, { scene: s.scene || '1', shot: s.num || 'A', take: (s.takes || 0) + 1, shotId: s.id });
        Store.save(); App.go('roll', 'slate');
      }
    }
  };

  /* ================= SLATE ================= */
  const bumpNum = (str, d) => {
    const m = String(str).match(/^(.*?)(\d+)(\D*)$/);
    if (!m) return str;
    const n = Math.max(0, parseInt(m[2], 10) + d);
    return m[1] + String(n).padStart(m[2].length, '0') + m[3];
  };
  const bumpLetter = (str, d) => {
    const s = String(str || 'A');
    const last = s.slice(-1).toUpperCase();
    if (!/[A-Z]/.test(last)) return bumpNum(s, d);
    const c = Math.min(90, Math.max(65, last.charCodeAt(0) + d));
    return s.slice(0, -1) + String.fromCharCode(c);
  };

  let audioCtx;
  function clap() {
    const flash = document.createElement('div');
    flash.className = 'clap-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 180);
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = 1000; o.type = 'square';
      g.gain.setValueAtTime(0.4, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      o.connect(g).connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + 0.13);
    } catch { /* audio unavailable */ }
    Native.haptic('HEAVY');
    const bar = document.querySelector('.clapper');
    if (bar) { bar.classList.remove('snap'); void bar.offsetWidth; bar.classList.add('snap'); }
  }

  function logTake(rating) {
    const p = Store.project(), sl = p.slate;
    const noteEl = document.querySelector('[data-slate-note]');
    const clipEl = document.querySelector('[data-slate-clip]');
    p.takes.push({ id: Store.uid(), roll: sl.roll, scene: sl.scene, shot: sl.shot, take: sl.take, rating, notes: noteEl ? noteEl.value.trim() : '', clip: clipEl ? clipEl.value.trim() : '', time: Date.now() });
    const shot = p.shots.find(s => s.id === sl.shotId) || p.shots.find(s => String(s.scene) === String(sl.scene) && String(s.num) === String(sl.shot));
    if (shot) { shot.takes = Math.max(shot.takes || 0, +sl.take); if (rating === 'good') shot.done = true; }
    sl.take = +sl.take + 1;
    Store.save(); App.render();
    Native.haptic(rating === 'good' ? 'MEDIUM' : 'LIGHT');
    UI.toast(`Logged take ${sl.take - 1}: ${RATINGS[rating].label}`);
  }

  const slate = {
    id: 'slate', label: 'Slate', icon: '🎬',
    render(p) {
      const sl = p.slate;
      const date = p.meta.date ? new Date(p.meta.date + 'T12:00').toLocaleDateString() : new Date().toLocaleDateString();
      const cell = (key, label, big) => `
        <div class="cell ${big ? 'big' : ''}">
          <label>${label}</label>
          <button class="val" data-action="slate-edit" data-key="${key}">${esc(sl[key])}</button>
          <div class="pm"><button data-action="slate-bump" data-key="${key}" data-d="-1" aria-label="${label} down">−</button><button data-action="slate-bump" data-key="${key}" data-d="1" aria-label="${label} up">＋</button></div>
        </div>`;
      const recent = [...p.takes].slice(-5).reverse();
      return `
        <div class="slate ${ui.full ? 'slate-full' : ''}" id="slate">
          <div class="clapper" data-action="slate-clap"><span></span></div>
          <div class="slate-grid">
            <div class="cell wide"><label>PRODUCTION</label><div class="val static">${esc(p.name)}</div></div>
            ${cell('scene', 'SCENE', true)}
            ${cell('shot', 'SHOT', true)}
            ${cell('take', 'TAKE', true)}
            ${cell('roll', 'ROLL')}
            <div class="cell"><label>DIRECTOR</label><div class="val static sm">${esc(p.meta.director || '—')}</div></div>
            <div class="cell"><label>CAMERA</label><div class="val static sm">${esc(p.meta.dop || '—')}</div></div>
            <div class="cell"><label>DATE</label><div class="val static sm">${esc(date)}</div></div>
            <div class="cell"><label>FPS</label><div class="val static sm">${esc(p.meta.fps)}</div></div>
            <div class="cell toggles">
              <button class="tog" data-action="slate-tog" data-key="intExt">${esc(sl.intExt)}</button>
              <button class="tog" data-action="slate-tog" data-key="dayNight">${esc(sl.dayNight)}</button>
            </div>
          </div>
          <button class="icon-btn fs-btn" data-action="slate-fs" title="${ui.full ? 'Exit full screen' : 'Full screen'}">${ui.full ? '✕' : '⛶'}</button>
          ${ui.full ? `<div class="slate-full-bar"><button class="btn clap-btn" data-action="slate-clap">🎬 CLAP</button>${RATING_ORDER.map(r => `<button class="btn rate ${RATINGS[r].cls}" data-action="slate-log" data-r="${r}">${RATINGS[r].label}</button>`).join('')}</div>` : ''}
        </div>
        <div class="slate-controls">
          <button class="btn clap-btn" data-action="slate-clap">🎬 CLAP</button>
          <div class="row wrap">
            <input data-slate-clip placeholder="Clip / file name (optional)">
            <input class="grow" data-slate-note placeholder="Take note: focus buzz, great performance, plane overhead…">
          </div>
          <div class="rate-row">
            ${RATING_ORDER.map(r => `<button class="btn rate ${RATINGS[r].cls}" data-action="slate-log" data-r="${r}">${RATINGS[r].label}</button>`).join('')}
          </div>
          <p class="small muted center">Rate a take to log it. The take number then goes up automatically.</p>
          <div class="row wrap center">
            <button class="btn" data-action="slate-next-shot">Next shot ⇢</button>
            <button class="btn" data-action="slate-next-scene">Next scene ⇢</button>
          </div>
        </div>
        ${recent.length ? `<section class="card"><div class="card-head"><h2>Recent takes</h2><a class="link" href="#roll-takes">Full log →</a></div>${takeRows(recent)}</section>` : ''}`;
    },
    actions: {
      'slate-clap': clap,
      'slate-log': el => logTake(el.dataset.r),
      'slate-bump': el => {
        const sl = Store.project().slate, k = el.dataset.key, d = +el.dataset.d;
        if (k === 'take') sl.take = Math.max(1, +sl.take + d);
        else if (k === 'shot') sl.shot = bumpLetter(sl.shot, d);
        else sl[k] = bumpNum(sl[k], d);
        Store.save(); App.render();
      },
      'slate-edit': async el => {
        const sl = Store.project().slate, k = el.dataset.key;
        const v = await UI.prompt(`Set ${k}`, sl[k], k[0].toUpperCase() + k.slice(1));
        if (v) { sl[k] = k === 'take' ? Math.max(1, parseInt(v, 10) || 1) : v; Store.save(); App.render(); }
      },
      'slate-tog': el => {
        const sl = Store.project().slate, k = el.dataset.key;
        sl[k] = k === 'intExt' ? (sl.intExt === 'INT' ? 'EXT' : sl.intExt === 'EXT' ? 'INT/EXT' : 'INT') : (sl.dayNight === 'DAY' ? 'NIGHT' : 'DAY');
        Store.save(); App.render();
      },
      'slate-next-shot': () => { const sl = Store.project().slate; sl.shot = bumpLetter(sl.shot, 1); sl.take = 1; sl.shotId = ''; Store.save(); App.render(); },
      'slate-next-scene': () => { const sl = Store.project().slate; sl.scene = bumpNum(sl.scene, 1); sl.shot = 'A'; sl.take = 1; sl.shotId = ''; Store.save(); App.render(); },
      'slate-fs': () => {
        const el = document.getElementById('slate');
        // Native web views (and iPhone Safari) don't support element fullscreen, so use a CSS overlay there.
        if (!Native.isNative && el.requestFullscreen && !ui.full) {
          if (document.fullscreenElement) return document.exitFullscreen();
          return el.requestFullscreen().catch(() => { ui.full = true; App.render(); });
        }
        ui.full = !ui.full;
        Native.hideStatusBar(ui.full);
        App.render();
      }
    }
  };

  /* ================= TAKE LOG ================= */
  function takeRows(list) {
    return `<div class="take-list">${list.map(t => `
      <div class="take">
        <div class="take-id"><b>${esc(t.scene)}${esc(t.shot)}</b><small>T${esc(t.take)}</small></div>
        <button class="badge ${RATINGS[t.rating].cls} rate-chip" data-action="take-rate" data-id="${t.id}" title="Change rating">${RATINGS[t.rating].label}</button>
        <div class="grow small">${t.notes ? esc(t.notes) : '<span class="muted">No notes</span>'}${t.clip ? ` <span class="badge soft">${esc(t.clip)}</span>` : ''}</div>
        <span class="small muted">${UI.fmtTime(t.time)}</span>
        <button class="icon-btn" data-action="take-edit" data-id="${t.id}" title="Edit">✎</button>
        <button class="icon-btn" data-action="take-del" data-id="${t.id}" title="Delete">🗑</button>
      </div>`).join('')}</div>`;
  }

  const takeFields = [
    { key: 'roll', label: 'Roll' }, { key: 'scene', label: 'Scene' }, { key: 'shot', label: 'Shot' }, { key: 'take', label: 'Take', type: 'number' },
    { key: 'rating', label: 'Rating', type: 'select', options: RATING_ORDER.map(r => ({ value: r, label: RATINGS[r].label })) },
    { key: 'clip', label: 'Clip / file name' },
    { key: 'notes', label: 'Notes', type: 'textarea', full: true }
  ];

  const takes = {
    id: 'takes', label: 'Take Log', icon: '🎞️',
    render(p) {
      const list = [...p.takes].reverse().filter(t => !ui.takeFilter || t.rating === ui.takeFilter);
      const counts = RATING_ORDER.reduce((o, r) => (o[r] = p.takes.filter(t => t.rating === r).length, o), {});
      return `
        <div class="toolbar">
          <button class="btn primary" data-action="take-add">＋ Log take</button>
          <div class="chips inline">
            <button class="chip ${!ui.takeFilter ? 'on' : ''}" data-action="take-filter" data-r="">All <b>${p.takes.length}</b></button>
            ${RATING_ORDER.map(r => `<button class="chip ${ui.takeFilter === r ? 'on' : ''}" data-action="take-filter" data-r="${r}">${RATINGS[r].label} <b>${counts[r]}</b></button>`).join('')}
          </div>
          <span class="spacer"></span>
          ${p.takes.length ? '<button class="btn" data-action="take-csv">⬇ CSV</button>' : ''}
        </div>
        ${list.length ? takeRows(list) : UI.empty('🎞️', 'No takes logged', 'Use the Slate to log takes as you shoot. Mark the good ones for your editor.')}`;
    },
    actions: {
      'take-filter': el => { ui.takeFilter = el.dataset.r; App.render(); },
      'take-add': async () => {
        const p = Store.project(), sl = p.slate;
        const v = await UI.formModal('Log take', takeFields, { roll: sl.roll, scene: sl.scene, shot: sl.shot, take: sl.take, rating: 'good' }, { okLabel: 'Log' });
        if (v) { p.takes.push({ id: Store.uid(), ...v, time: Date.now() }); Store.save(); App.render(); }
      },
      'take-edit': async el => {
        const t = Store.project().takes.find(x => x.id === el.dataset.id);
        const v = await UI.formModal('Edit take', takeFields, t);
        if (v) { Object.assign(t, v); Store.save(); App.render(); }
      },
      'take-rate': el => {
        const t = Store.project().takes.find(x => x.id === el.dataset.id);
        t.rating = RATING_ORDER[(RATING_ORDER.indexOf(t.rating) + 1) % 3]; Store.save(); App.render();
      },
      'take-del': async el => {
        if (!(await UI.confirm('Delete this take?'))) return;
        const p = Store.project(); p.takes = p.takes.filter(x => x.id !== el.dataset.id); Store.save(); App.render();
      },
      'take-csv': () => {
        const p = Store.project();
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const rows = [['Roll', 'Scene', 'Shot', 'Take', 'Rating', 'Clip', 'Notes', 'Time']].concat(
          p.takes.map(t => [t.roll, t.scene, t.shot, t.take, t.rating, t.clip, t.notes, new Date(t.time).toISOString()]));
        UI.download(`${UI.slug(p.name)}-take-log.csv`, rows.map(r => r.map(q).join(',')).join('\n'), 'text/csv');
      }
    }
  };

  /* ================= LIGHT (sun times) ================= */
  const light = {
    id: 'light', label: 'Sun & Light', icon: '☀️',
    render(p) {
      const dateStr = ui.lightDate || p.meta.date || new Date().toISOString().slice(0, 10);
      const lat = parseFloat(p.meta.lat), lng = parseFloat(p.meta.lng);
      const has = !isNaN(lat) && !isNaN(lng);
      let result = '<p class="muted">Enter coordinates or use your location to see sunrise, sunset, golden hour and blue hour.</p>';
      if (has) {
        const d = new Date(dateStr + 'T12:00');
        const t = Sun.day(d, lat, lng);
        const f = x => x && !isNaN(x) ? x.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
        if (!t.sunrise || isNaN(t.sunrise)) {
          result = '<p class="warn-text">The sun does not rise or set on this date at this latitude (polar day or night).</p>';
        } else {
          const H = x => x && !isNaN(x) ? Math.max(0, Math.min(24, (x - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 3600000)) : null;
          const segs = [
            ['night', 0, H(t.civilDawn) ?? H(t.blueEndAM) ?? H(t.sunrise)],
            ['blue', H(t.civilDawn), H(t.blueEndAM)],
            ['golden', H(t.blueEndAM), H(t.goldenEndAM)],
            ['day', H(t.goldenEndAM), H(t.goldenStartPM)],
            ['golden', H(t.goldenStartPM), H(t.bluePM)],
            ['blue', H(t.bluePM), H(t.civilDusk)],
            ['night', H(t.civilDusk) ?? H(t.bluePM) ?? H(t.sunset), 24]
          ].filter(s => s[1] != null && s[2] != null && s[2] > s[1]);
          const nowH = dateStr === new Date().toISOString().slice(0, 10) ? H(new Date()) : null;
          result = `
            <div class="sunbar">${segs.map(([k, a, b]) => `<span class="seg-${k}" style="left:${a / 24 * 100}%;width:${(b - a) / 24 * 100}%"></span>`).join('')}
              ${nowH != null ? `<i class="now" style="left:${nowH / 24 * 100}%"></i>` : ''}
            </div>
            <div class="sunscale"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
            <div class="sun-grid">
              <div class="sun-row blue"><span>🌌 Blue hour (AM)</span><b>${f(t.civilDawn)} – ${f(t.blueEndAM)}</b></div>
              <div class="sun-row golden"><span>🌄 Golden hour (AM)</span><b>${f(t.blueEndAM)} – ${f(t.goldenEndAM)}</b></div>
              <div class="sun-row"><span>☀️ Sunrise</span><b>${f(t.sunrise)}</b></div>
              <div class="sun-row"><span>🕛 Solar noon (hardest light)</span><b>${f(t.noon)}</b></div>
              <div class="sun-row"><span>🌇 Sunset</span><b>${f(t.sunset)}</b></div>
              <div class="sun-row golden"><span>🌅 Golden hour (PM)</span><b>${f(t.goldenStartPM)} – ${f(t.bluePM)}</b></div>
              <div class="sun-row blue"><span>🌃 Blue hour (PM)</span><b>${f(t.bluePM)} – ${f(t.civilDusk)}</b></div>
            </div>
            <p class="small muted">Times use your device’s time zone and are approximate (±2 min). Hills and buildings make the sun disappear earlier.</p>`;
        }
      }
      return `
        <section class="card">
          <div class="form-grid">
            <label class="field"><span>Date</span><input type="date" data-ui-date value="${esc(dateStr)}"></label>
            <label class="field"><span>Latitude</span><input inputmode="decimal" data-bind="meta.lat" data-rerender-change value="${esc(p.meta.lat)}" placeholder="51.5074"></label>
            <label class="field"><span>Longitude</span><input inputmode="decimal" data-bind="meta.lng" data-rerender-change value="${esc(p.meta.lng)}" placeholder="-0.1278"></label>
            <div class="field"><span>&nbsp;</span><button class="btn" data-action="light-locate">📍 Use my location</button></div>
          </div>
          ${result}
        </section>
        <section class="card">
          <h2>💡 Natural light tips</h2>
          <ul class="tips">
            <li><b>Golden hour:</b> soft, warm, low-angle light. Great for faces, backlit hair and lens flares. It goes fast, so rehearse first.</li>
            <li><b>Blue hour:</b> cool, even ambient light. City lights and practicals balance with the sky.</li>
            <li><b>Midday:</b> harsh overhead light. Find open shade, use diffusion (scrim) overhead, or bounce fill into the eyes.</li>
            <li><b>Overcast:</b> a giant softbox. Great for skin, but add contrast with negative fill.</li>
            <li><b>Continuity:</b> the light changes quickly near sunrise and sunset. Shoot wides first while it lasts, or plan the sequence around it.</li>
          </ul>
        </section>`;
    },
    onInput(el, ev) {
      if (el.matches('[data-ui-date]')) { ui.lightDate = el.value; if (ev.type === 'change') App.render(); return true; }
    },
    actions: {
      'light-locate': async () => {
        UI.toast('Finding location…');
        try {
          const c = await Native.locate();
          const p = Store.project();
          p.meta.lat = c.latitude.toFixed(4); p.meta.lng = c.longitude.toFixed(4);
          Store.save(); App.render();
        } catch { UI.toast('Could not get location. Check permissions or enter it manually.', 'error'); }
      }
    }
  };

  /* ================= CALCULATORS ================= */
  const COMMON_SHUTTERS = [24, 25, 30, 40, 48, 50, 60, 80, 96, 100, 120, 125, 160, 200, 240, 250, 320, 400, 480, 500, 640, 800, 1000, 1250, 1600, 2000];

  function computeCalcs(root) {
    const v = name => parseFloat((root.querySelector(`[data-calc="${name}"]`) || {}).value);
    const out = (name, html) => { const el = root.querySelector(`[data-out="${name}"]`); if (el) el.innerHTML = html; };
    const fmtDur = s => s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.round(s % 3600 / 60)}m` : s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${s.toFixed(1)}s`;

    const fps = v('sh-fps'), ang = v('sh-angle');
    if (fps > 0 && ang > 0) {
      const exact = fps * 360 / ang;
      const near = COMMON_SHUTTERS.reduce((a, b) => Math.abs(b - exact) < Math.abs(a - exact) ? b : a);
      out('shutter', `<b>1/${Math.round(exact)}</b> s${near !== Math.round(exact) ? ` <span class="muted">· nearest on most cameras: 1/${near}</span>` : ''}`);
    } else out('shutter', '—');

    const sf = v('sm-shoot'), tf = v('sm-time'), sec = v('sm-sec');
    if (sf > 0 && tf > 0) {
      const factor = sf / tf;
      out('slowmo', factor <= 1 ? 'No slow motion. Shoot faster than the timeline.' :
        `<b>${Math.round(100 / factor)}% speed</b> · ${factor.toFixed(1)}× slower${sec > 0 ? ` · ${sec}s of action → <b>${fmtDur(sec * factor)}</b> on screen` : ''}`);
    } else out('slowmo', '—');

    const ev = v('tl-event'), iv = v('tl-int'), pf = v('tl-fps'), want = v('tl-want');
    if (ev > 0 && iv > 0 && pf > 0) {
      const frames = Math.floor(ev * 60 / iv);
      out('timelapse', `<b>${frames} photos</b> → <b>${fmtDur(frames / pf)}</b> clip at ${pf} fps${want > 0 ? `<br>For a ${want}s clip over ${ev} min: interval <b>${(ev * 60 / (want * pf)).toFixed(1)}s</b> (${Math.ceil(want * pf)} photos)` : ''}`);
    } else out('timelapse', '—');

    const br = v('st-mbps'), min = v('st-min'), card = v('st-card');
    if (br > 0) {
      const gbPerMin = br * 60 / 8 / 1000;
      out('storage', `${min > 0 ? `<b>${(gbPerMin * min).toFixed(1)} GB</b> for ${min} min · ` : ''}${gbPerMin.toFixed(2)} GB/min${card > 0 ? `<br>A ${card} GB card holds about <b>${fmtDur(card / gbPerMin * 60)}</b>` : ''}`);
    } else out('storage', '—');

    const bright = v('nd-have'), wantStops = v('nd-stops');
    if (wantStops > 0) {
      const nd = RB.ndTable.reduce((a, b) => Math.abs(b.stops - wantStops) < Math.abs(a.stops - wantStops) ? b : a);
      out('nd', `≈ <b>${nd.nd}</b> (ND ${nd.od}) cuts ${nd.stops} stop${nd.stops > 1 ? 's' : ''}${bright > 0 ? ` · ${bright} lux → ~${Math.round(bright / 2 ** nd.stops)} lux` : ''}`);
    } else out('nd', '—');
  }

  const calc = {
    id: 'calc', label: 'Calculators', icon: '🧮',
    render(p) {
      const f = p.meta.fps;
      const inp = (name, label, val, extra = '') => `<label class="field"><span>${label}</span><input type="number" step="any" inputmode="decimal" data-calc="${name}" value="${val}" ${extra}></label>`;
      return `
        <div class="calc-grid">
          <section class="card">
            <h2>🌀 Shutter speed (180° rule)</h2>
            <div class="form-grid">${inp('sh-fps', 'Frame rate', f)}${inp('sh-angle', 'Shutter angle °', 180)}</div>
            <div class="result" data-out="shutter"></div>
            <p class="small muted">180° gives natural motion blur. 90° or 45° looks crisp and staccato (action, Saving Private Ryan). 360° looks smeary and dreamy.</p>
          </section>
          <section class="card">
            <h2>🐢 Slow motion</h2>
            <div class="form-grid">${inp('sm-shoot', 'Shoot fps', 120)}${inp('sm-time', 'Timeline fps', f)}${inp('sm-sec', 'Real action (s)', 3)}</div>
            <div class="result" data-out="slowmo"></div>
          </section>
          <section class="card">
            <h2>⏳ Time-lapse</h2>
            <div class="form-grid">${inp('tl-event', 'Event length (min)', 60)}${inp('tl-int', 'Interval (s)', 5)}${inp('tl-fps', 'Playback fps', f)}${inp('tl-want', 'Or: target clip (s)', '')}</div>
            <div class="result" data-out="timelapse"></div>
            <p class="small muted">Rough intervals: fast clouds 1–3s · crowds and traffic 1–2s · sunsets 3–5s · stars 20–30s · plants growing 5–10 min.</p>
          </section>
          <section class="card">
            <h2>💾 Storage</h2>
            <div class="form-grid">
              <label class="field"><span>Codec preset</span><select data-calc-preset>${UI.opts(RB.codecs.map(c => ({ value: c.mbps, label: c.name + (c.mbps ? ` (${c.mbps} Mbps)` : '') })), 100)}</select></label>
              ${inp('st-mbps', 'Bitrate (Mbps)', 100)}${inp('st-min', 'Recording (min)', 60)}${inp('st-card', 'Card size (GB)', 128)}
            </div>
            <div class="result" data-out="storage"></div>
          </section>
          <section class="card">
            <h2>🕶 ND filters</h2>
            <div class="form-grid">${inp('nd-stops', 'Stops to cut', 3)}${inp('nd-have', 'Metered lux (optional)', '')}</div>
            <div class="result" data-out="nd"></div>
            <div class="table-wrap"><table class="table small"><thead><tr><th>Filter</th>${RB.ndTable.map(n => `<th>${n.nd}</th>`).join('')}</tr></thead>
              <tbody><tr><td>Density</td>${RB.ndTable.map(n => `<td>${n.od}</td>`).join('')}</tr><tr><td>Stops</td>${RB.ndTable.map(n => `<td>${n.stops}</td>`).join('')}</tr></tbody></table></div>
            <p class="small muted">Sunny day at f/2.8 and 1/50: you usually need about 6–8 stops of ND.</p>
          </section>
        </div>`;
    },
    after: computeCalcs,
    onInput(el) {
      if (el.matches('[data-calc-preset]')) {
        if (+el.value) document.querySelector('[data-calc="st-mbps"]').value = el.value;
        computeCalcs(document.getElementById('view'));
        return true;
      }
      if (el.matches('[data-calc]')) { computeCalcs(document.getElementById('view')); return true; }
    }
  };

  const notes = { id: 'notes', label: 'Notes', icon: '📝', render: p => C.notesSection('roll', p) };

  Views.roll = {
    label: 'Roll', sub: 'On set', icon: '🔴',
    sections: [tracker, slate, takes, light, calc, notes],
    ui,
    takeRows,
    RATINGS
  };
})();
