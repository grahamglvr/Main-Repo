/* Reelbook — PREP tab (pre-production). */
window.Views = window.Views || {};
(() => {
  const { esc } = UI;
  const ui = { cat: '', scene: '', boardCat: '', q: '' };

  const catOpts = RB.categories.map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }));
  const sizeOpts = RB.sizes.map(s => ({ value: s.id, label: `${s.id} · ${s.name}` }));
  const angleOpts = RB.angles.map(a => ({ value: a.id, label: a.name }));
  const moveOpts = RB.movements.map(m => ({ value: m.id, label: `${m.type === 'static' ? '■' : '➜'} ${m.name}` }));
  const hintFrom = list => v => { const x = RB.find(list, v); return x ? `${x.desc} ${x.use}` : ''; };
  const moveHint = v => { const m = RB.find(RB.movements, v); return m ? `${m.type.toUpperCase()} · ${m.use} Gear: ${m.gear}.` : ''; };

  const LENS_LIST = `<datalist id="lens-list">${['14mm', '16mm', '18mm', '24mm', '28mm', '35mm', '50mm', '85mm', '100mm macro', '135mm', '24-70mm', '70-200mm'].map(l => `<option value="${l}">`).join('')}</datalist>`;

  function shotFields(p) {
    return [
      { key: 'scene', label: 'Scene', placeholder: '1' },
      { key: 'num', label: 'Shot', placeholder: 'A' },
      { key: 'category', label: 'Category', type: 'select', options: catOpts, hint: v => (RB.find(RB.categories, v) || {}).desc || '' },
      { key: 'size', label: 'Shot size', type: 'select', options: sizeOpts, empty: '—', hint: hintFrom(RB.sizes) },
      { key: 'angle', label: 'Camera angle', type: 'select', options: angleOpts, empty: '—', hint: hintFrom(RB.angles) },
      { key: 'movement', label: 'Movement', type: 'select', options: moveOpts, empty: '—', hint: moveHint },
      { key: 'lens', label: 'Lens', placeholder: '35mm', list: 'lens-list' },
      { key: 'fps', label: 'Frame rate', type: 'select', options: RB.fpsOptions.map(f => ({ value: f, label: f + ' fps' })), default: p.meta.fps, hint: RB.fpsWhy },
      { key: 'duration', label: 'Est. duration (s)', type: 'number', placeholder: '5' },
      { key: 'audio', label: 'Audio', type: 'select', options: ['Sync sound', 'Wild track', 'MOS (no sound)', 'Voice-over'], empty: '—' },
      { key: 'location', label: 'Location', placeholder: 'Kitchen', list: 'loc-list' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['Must have', 'Nice to have'], default: 'Must have' },
      { key: 'desc', label: 'Description / action', type: 'textarea', full: true, placeholder: 'What happens in this shot?' },
      { key: 'notes', label: 'Notes (technique, lighting, props)', type: 'textarea', full: true, rows: 2 }
    ];
  }

  const locList = p => `<datalist id="loc-list">${p.locations.map(l => `<option value="${esc(l.name)}">`).join('')}</datalist>`;

  function nextShotLetter(p, scene) {
    const n = p.shots.filter(s => s.scene === scene).length;
    return n < 26 ? String.fromCharCode(65 + n) : 'A' + (n - 25);
  }

  function frameFor(p, shotId) { return p.frames.find(f => f.shotId === shotId && f.sketch); }

  function move(list, id, dir) {
    const i = list.findIndex(x => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    Store.save(); App.render();
  }

  /* ================= OVERVIEW ================= */
  const overview = {
    id: 'overview', label: 'Overview', icon: '🎯',
    render(p) {
      const packed = p.gear.filter(g => g.packed).length;
      const doneChecks = RB.prepChecklist.filter((_, i) => p.prepChecklist[i]).length;
      const aspect = RB.find(RB.aspects, p.meta.aspect);
      return `
      <div class="grid two">
        <section class="card">
          <h2>🎬 Project</h2>
          <div class="form-grid">
            <label class="field full"><span>Project name</span><input data-bind="name" data-header value="${esc(p.name)}"></label>
            <label class="field"><span>Client / brand</span><input data-bind="meta.client" value="${esc(p.meta.client)}"></label>
            <label class="field"><span>Shoot date</span><input type="date" data-bind="meta.date" value="${esc(p.meta.date)}"></label>
            <label class="field"><span>Director</span><input data-bind="meta.director" value="${esc(p.meta.director || '')}"></label>
            <label class="field"><span>DOP / camera</span><input data-bind="meta.dop" value="${esc(p.meta.dop || '')}"></label>
            <label class="field full"><span>Main location</span><input data-bind="meta.location" value="${esc(p.meta.location)}"></label>
            <label class="field full"><span>Logline / brief</span><textarea data-bind="meta.logline" rows="3" placeholder="One or two sentences: what is this film and who is it for?">${esc(p.meta.logline)}</textarea></label>
            <label class="field"><span>Aspect ratio</span><select data-bind="meta.aspect" data-rerender>${UI.opts(RB.aspects.map(a => ({ value: a.id, label: a.id })), p.meta.aspect)}</select><small class="hint">${esc(aspect ? aspect.note : '')}</small></label>
            <label class="field"><span>Base frame rate</span><select data-bind="meta.fps" data-rerender>${UI.opts(RB.fpsOptions.map(f => ({ value: f, label: f + ' fps' })), p.meta.fps)}</select><small class="hint">${esc(RB.fpsWhy(p.meta.fps))}</small></label>
            <label class="field"><span>Resolution</span><select data-bind="meta.resolution">${UI.opts(RB.resolutions, p.meta.resolution)}</select></label>
          </div>
        </section>
        <div class="stack">
          <section class="card">
            <h2>📊 At a glance</h2>
            <div class="stats">
              <a class="stat" href="#prep/shots"><b>${p.shots.length}</b><span>shots planned</span></a>
              <a class="stat" href="#prep/board"><b>${p.frames.length}</b><span>storyboard frames</span></a>
              <a class="stat" href="#prep/colour"><b>${p.palettes.length}</b><span>colour palettes</span></a>
              <a class="stat" href="#prep/gear"><b>${packed}/${p.gear.length}</b><span>gear packed</span></a>
            </div>
          </section>
          <section class="card">
            <h2>✅ Pre-shoot checklist</h2>
            ${UI.progress(doneChecks, RB.prepChecklist.length)}
            <div class="checklist">
              ${RB.prepChecklist.map((t, i) => `<label class="check"><input type="checkbox" data-bind="prepChecklist.${i}" data-rerender ${p.prepChecklist[i] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}
            </div>
          </section>
        </div>
      </div>
      ${C.notesSection('prep', p, { compact: true })}`;
    }
  };

  /* ================= SHOT LIST ================= */
  const shots = {
    id: 'shots', label: 'Shot List', icon: '📋',
    render(p) {
      if (!p.shots.length) {
        return UI.empty('📋', 'No shots yet', 'Plan every shot with its angle, movement and frame rate. Start from scratch or load a template.',
          `<div class="row center"><button class="btn primary" data-action="shot-add">＋ Add first shot</button></div>
           <div class="row center wrap">${RB.templates.map((t, i) => `<button class="btn" data-action="shot-template" data-i="${i}">Load “${esc(t.name)}”</button>`).join('')}</div>`);
      }
      const scenes = [...new Set(p.shots.map(s => s.scene || '?'))];
      const list = p.shots.filter(s => (!ui.cat || s.category === ui.cat) && (!ui.scene || (s.scene || '?') === ui.scene));
      const total = list.reduce((a, s) => a + (+s.duration || 0), 0);
      const staticCount = list.filter(s => (RB.find(RB.movements, s.movement) || {}).type === 'static').length;
      const groups = {};
      list.forEach(s => { (groups[s.scene || '?'] = groups[s.scene || '?'] || []).push(s); });
      return `
        <div class="toolbar">
          <button class="btn primary" data-action="shot-add">＋ Add shot</button>
          <select data-ui="cat">${UI.opts(catOpts, ui.cat, 'All categories')}</select>
          <select data-ui="scene">${UI.opts(scenes.map(s => ({ value: s, label: 'Scene ' + s })), ui.scene, 'All scenes')}</select>
          <span class="spacer"></span>
          <span class="muted small">${list.length} shots · ${staticCount} static / ${list.length - staticCount} moving${total ? ` · ~${Math.round(total)}s` : ''}</span>
          <button class="btn" data-action="shot-print">🖨 Print</button>
        </div>
        ${Object.entries(groups).map(([scene, items]) => `
          <h3 class="group-title">Scene ${esc(scene)}</h3>
          <div class="shot-list">
            ${items.map(s => {
              const fr = frameFor(p, s.id);
              return `
              <article class="shot-card">
                <div class="shot-num">${esc(C.shotLabel(s))}${s.priority === 'Nice to have' ? '<small>nice</small>' : ''}</div>
                ${fr ? `<img class="shot-thumb" src="${fr.sketch}" alt="Storyboard">` : ''}
                <div class="shot-body">
                  <div class="badges">${C.shotBadges(s)}</div>
                  ${s.desc ? `<p class="shot-desc">${esc(s.desc)}</p>` : ''}
                  <p class="muted small">${[s.duration && `⏱ ${esc(s.duration)}s`, s.audio && `🎙 ${esc(s.audio)}`, s.location && `📍 ${esc(s.location)}`, s.notes && `📝 ${esc(s.notes)}`].filter(Boolean).join(' · ')}</p>
                </div>
                <div class="shot-actions">
                  <button class="icon-btn" data-action="shot-up" data-id="${s.id}" title="Move up">↑</button>
                  <button class="icon-btn" data-action="shot-down" data-id="${s.id}" title="Move down">↓</button>
                  <button class="icon-btn" data-action="shot-dup" data-id="${s.id}" title="Duplicate">⧉</button>
                  <button class="icon-btn" data-action="shot-edit" data-id="${s.id}" title="Edit">✎</button>
                  <button class="icon-btn" data-action="shot-del" data-id="${s.id}" title="Delete">🗑</button>
                </div>
              </article>`;
            }).join('')}
          </div>`).join('') || '<p class="muted">No shots match these filters.</p>'}`;
    },
    actions: {
      'shot-add': async () => {
        const p = Store.project();
        const scene = ui.scene || (p.shots.length ? p.shots[p.shots.length - 1].scene : '1');
        const v = await UI.formModal('New shot', shotFields(p), { scene, num: nextShotLetter(p, scene), category: ui.cat || 'establishing', fps: p.meta.fps }, { extra: LENS_LIST + locList(p), okLabel: 'Add shot' });
        if (!v) return;
        p.shots.push({ id: Store.uid(), ...v, done: false, takes: 0 });
        Store.save(); App.render();
      },
      'shot-edit': async el => {
        const p = Store.project(), s = p.shots.find(x => x.id === el.dataset.id);
        const v = await UI.formModal(`Edit shot ${C.shotLabel(s)}`, shotFields(p), s, { extra: LENS_LIST + locList(p) });
        if (!v) return;
        Object.assign(s, v); Store.save(); App.render();
      },
      'shot-dup': el => {
        const p = Store.project(), i = p.shots.findIndex(x => x.id === el.dataset.id);
        const copy = { ...p.shots[i], id: Store.uid(), num: nextShotLetter(p, p.shots[i].scene), done: false, takes: 0 };
        p.shots.splice(i + 1, 0, copy); Store.save(); App.render();
      },
      'shot-del': async el => {
        if (!(await UI.confirm('Delete this shot?'))) return;
        const p = Store.project();
        p.shots = p.shots.filter(x => x.id !== el.dataset.id);
        p.frames.forEach(f => { if (f.shotId === el.dataset.id) f.shotId = ''; });
        Store.save(); App.render();
      },
      'shot-up': el => move(Store.project().shots, el.dataset.id, -1),
      'shot-down': el => move(Store.project().shots, el.dataset.id, 1),
      'shot-template': el => {
        const p = Store.project(), t = RB.templates[+el.dataset.i];
        const count = {};
        t.shots.forEach(s => {
          count[s.scene] = (count[s.scene] || 0);
          p.shots.push({ id: Store.uid(), num: String.fromCharCode(65 + count[s.scene]++), lens: '', duration: '', audio: '', location: '', priority: 'Must have', notes: '', ...s, done: false, takes: 0 });
        });
        Store.save(); App.render(); UI.toast(`Loaded ${t.shots.length} shots`);
      },
      'shot-print': () => printShotList(Store.project())
    }
  };

  function printShotList(p) {
    const rows = p.shots.map(s => {
      const f = k => { const x = RB.find(k === 'size' ? RB.sizes : k === 'angle' ? RB.angles : RB.movements, s[k]); return x ? x.name : ''; };
      const cat = RB.find(RB.categories, s.category);
      const mv = RB.find(RB.movements, s.movement);
      return `<tr><td><b>${esc(C.shotLabel(s))}</b></td><td>${cat ? esc(cat.name) : ''}</td><td>${esc(f('size'))}</td><td>${esc(f('angle'))}</td><td>${esc(f('movement'))}${mv ? ` <i>(${mv.type})</i>` : ''}</td><td>${esc(s.lens || '')}</td><td>${esc(s.fps || '')}</td><td>${esc(s.desc || '')}${s.notes ? `<br><small>${esc(s.notes)}</small>` : ''}</td><td class="box"></td></tr>`;
    }).join('');
    const w = window.open('', '_blank');
    if (!w) return UI.toast('Allow pop-ups to print', 'error');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(p.name)}: Shot list</title>
      <style>body{font:12px/1.4 system-ui,sans-serif;margin:24px;color:#111}h1{margin:0 0 4px}p{margin:0 0 16px;color:#555}
      table{border-collapse:collapse;width:100%}th,td{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:top}
      th{background:#eee}td.box{width:28px}i{color:#777}</style></head><body>
      <h1>${esc(p.name)}: Shot list</h1><p>${[p.meta.client, p.meta.date, p.meta.location, p.meta.aspect, p.meta.fps + ' fps'].filter(Boolean).map(esc).join(' · ')}</p>
      <table><thead><tr><th>#</th><th>Category</th><th>Size</th><th>Angle</th><th>Movement</th><th>Lens</th><th>FPS</th><th>Description</th><th>✓</th></tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  }

  /* ================= STORYBOARD ================= */
  function frameFields(p) {
    return [
      { key: 'category', label: 'Category', type: 'select', options: catOpts, hint: v => (RB.find(RB.categories, v) || {}).desc || '' },
      { key: 'shotId', label: 'Linked shot', type: 'select', options: p.shots.map(s => ({ value: s.id, label: `${C.shotLabel(s)}: ${(s.desc || '').slice(0, 40)}` })), empty: '— none —' },
      { key: 'size', label: 'Shot size', type: 'select', options: sizeOpts, empty: '—' },
      { key: 'angle', label: 'Angle', type: 'select', options: angleOpts, empty: '—' },
      { key: 'movement', label: 'Movement', type: 'select', options: moveOpts, empty: '—', hint: moveHint },
      { key: 'duration', label: 'Duration (s)', type: 'number' },
      { key: 'caption', label: 'Action / what we see', type: 'textarea', full: true },
      { key: 'audio', label: 'Dialogue / audio / VO', type: 'textarea', full: true, rows: 2 }
    ];
  }

  const board = {
    id: 'board', label: 'Storyboard', icon: '🖼️',
    render(p) {
      const ratio = C.aspectRatio(p);
      const counts = {};
      p.frames.forEach(f => { counts[f.category] = (counts[f.category] || 0) + 1; });
      const list = p.frames.map((f, i) => ({ ...f, index: i + 1 })).filter(f => !ui.boardCat || f.category === ui.boardCat);
      const unboarded = p.shots.filter(s => !p.frames.some(f => f.shotId === s.id)).length;
      return `
        <div class="toolbar">
          <button class="btn primary" data-action="frame-add">＋ New frame</button>
          ${unboarded ? `<button class="btn" data-action="frame-from-shots">⇢ Build from shot list (${unboarded})</button>` : ''}
          <span class="spacer"></span>
          <span class="muted small">Aspect ${esc(p.meta.aspect)} · <a class="link" href="#prep/overview">change</a></span>
        </div>
        <div class="chips">
          <button class="chip ${!ui.boardCat ? 'on' : ''}" data-action="board-cat" data-cat="">All <b>${p.frames.length}</b></button>
          ${RB.categories.map(c => `<button class="chip ${ui.boardCat === c.id ? 'on' : ''}" style="--c:${c.color}" data-action="board-cat" data-cat="${c.id}">${c.icon} ${esc(c.name)} ${counts[c.id] ? `<b>${counts[c.id]}</b>` : ''}</button>`).join('')}
        </div>
        <details class="card guide">
          <summary>📚 Shot category guide</summary>
          <div class="guide-grid">${RB.categories.map(c => `<div><span class="badge cat" style="--c:${c.color}">${c.icon} ${esc(c.name)}</span><p class="small">${esc(c.desc)}</p></div>`).join('')}</div>
        </details>
        ${list.length ? `<div class="board-grid ${ratio < 1 ? 'tall' : ''}">
          ${list.map(f => {
            const cat = RB.find(RB.categories, f.category) || RB.categories[0];
            const shot = p.shots.find(s => s.id === f.shotId);
            const size = RB.find(RB.sizes, f.size);
            return `
            <article class="frame-card" style="--c:${cat.color}">
              <button class="frame-img" style="aspect-ratio:${ratio}" data-action="frame-sketch" data-id="${f.id}" title="Sketch">
                ${f.sketch ? `<img src="${f.sketch}" alt="Frame ${f.index}">` : `<span class="ph"><span>${cat.icon}</span><small>Tap to sketch</small></span>`}
                <span class="frame-no">${f.index}</span>
              </button>
              <div class="frame-info">
                <div class="badges">${C.catBadge(f.category)}${size ? `<span class="badge soft">${size.id}</span>` : ''}${shot ? `<span class="badge soft">Shot ${esc(C.shotLabel(shot))}</span>` : ''}${f.duration ? `<span class="badge soft">${esc(f.duration)}s</span>` : ''}</div>
                ${f.movement ? `<div class="badges">${C.moveBadge(f.movement)}</div>` : ''}
                ${f.caption ? `<p class="small">${esc(f.caption)}</p>` : ''}
                ${f.audio ? `<p class="small muted">🔊 ${esc(f.audio)}</p>` : ''}
              </div>
              <div class="frame-actions">
                <button class="icon-btn" data-action="frame-left" data-id="${f.id}" title="Move earlier">←</button>
                <button class="icon-btn" data-action="frame-right" data-id="${f.id}" title="Move later">→</button>
                <button class="icon-btn" data-action="frame-edit" data-id="${f.id}" title="Edit details">✎</button>
                <button class="icon-btn" data-action="frame-del" data-id="${f.id}" title="Delete">🗑</button>
              </div>
            </article>`;
          }).join('')}</div>`
          : UI.empty('🖼️', p.frames.length ? 'No frames in this category' : 'Start your storyboard', 'Sketch rough frames with stick figures, boxes and movement arrows. Stick figures are fine. It’s about composition, not art.')}`;
    },
    actions: {
      'board-cat': el => { ui.boardCat = el.dataset.cat; App.render(); },
      'frame-add': async () => {
        const p = Store.project();
        const v = await UI.formModal('New storyboard frame', frameFields(p), { category: ui.boardCat || 'establishing' }, { okLabel: 'Add & sketch' });
        if (!v) return;
        const f = { id: Store.uid(), ...v, sketch: '' };
        p.frames.push(f); Store.save(); App.render();
        C.sketchPad({ ...f, index: p.frames.length }, data => { f.sketch = data; Store.save(); App.render(); });
      },
      'frame-from-shots': () => {
        const p = Store.project();
        const todo = p.shots.filter(s => !p.frames.some(f => f.shotId === s.id));
        todo.forEach(s => p.frames.push({ id: Store.uid(), shotId: s.id, category: s.category, size: s.size, angle: s.angle, movement: s.movement, duration: s.duration, caption: s.desc, audio: '', sketch: '' }));
        Store.save(); App.render(); UI.toast(`Added ${todo.length} frames`);
      },
      'frame-sketch': el => {
        const p = Store.project(), i = p.frames.findIndex(x => x.id === el.dataset.id), f = p.frames[i];
        C.sketchPad({ ...f, index: i + 1 }, data => { f.sketch = data; Store.save(); App.render(); });
      },
      'frame-edit': async el => {
        const p = Store.project(), f = p.frames.find(x => x.id === el.dataset.id);
        const v = await UI.formModal('Edit frame', frameFields(p), f);
        if (v) { Object.assign(f, v); Store.save(); App.render(); }
      },
      'frame-del': async el => {
        if (!(await UI.confirm('Delete this frame and its sketch?'))) return;
        const p = Store.project(); p.frames = p.frames.filter(x => x.id !== el.dataset.id); Store.save(); App.render();
      },
      'frame-left': el => move(Store.project().frames, el.dataset.id, -1),
      'frame-right': el => move(Store.project().frames, el.dataset.id, 1)
    }
  };

  /* ================= COLOUR ================= */
  const colour = {
    id: 'colour', label: 'Colour', icon: '🎨',
    render(p) {
      return `
        <div class="toolbar">
          <button class="btn primary" data-action="pal-preset">＋ From film looks</button>
          <button class="btn" data-action="pal-harmony">◐ Colour harmony</button>
          <button class="btn" data-action="pal-image">🖼 From reference image</button>
          <button class="btn" data-action="pal-blank">Blank</button>
        </div>
        ${p.palettes.length ? p.palettes.map((pal, i) => `
          <section class="card palette">
            <div class="strip">${pal.colors.map(c => `<span style="background:${c}"></span>`).join('')}</div>
            <div class="palette-head">
              <input class="title-input" data-bind="palettes.${i}.name" value="${esc(pal.name)}" aria-label="Palette name">
              <button class="icon-btn" data-action="pal-del" data-id="${pal.id}" title="Delete palette">🗑</button>
            </div>
            ${C.swatchRow(pal.colors, { editable: true, pid: pal.id })}
            <label class="field full"><span>Mood / where to use it</span><textarea rows="2" data-bind="palettes.${i}.mood" placeholder="e.g. Act 1, warm & safe. Wardrobe in the orange range, walls in teal.">${esc(pal.mood || '')}</textarea></label>
          </section>`).join('')
        : UI.empty('🎨', 'No palettes yet', 'Build a colour palette to guide wardrobe, set design, lighting gels and the grade.')}
        <details class="card guide" open>
          <summary>🧠 Colour psychology</summary>
          <div class="psych">${RB.colorPsych.map(c => `<div class="psych-item"><span class="dot" style="background:${c.color}"></span><b>${c.name}</b><span class="muted small">${c.meaning}</span></div>`).join('')}</div>
          <p class="small muted">Tip: pick one dominant colour, one supporting colour and one accent. Use the accent sparingly so it draws the eye to what matters.</p>
        </details>`;
    },
    onInput(el, ev, p) {
      if (el.matches('input[type=color][data-palette]')) {
        const pal = p.palettes.find(x => x.id === el.dataset.palette);
        pal.colors[+el.dataset.idx] = el.value;
        Store.save();
        if (ev.type === 'change') App.render();
        else {
          const sw = el.closest('.swatch');
          sw.style.background = el.value;
          sw.style.color = C.Color.textOn(el.value);
          sw.querySelector('.swatch-hex').textContent = el.value.toUpperCase();
        }
        return true;
      }
    },
    actions: {
      'pal-preset': () => {
        const m = UI.modal({
          title: 'Film look palettes', wide: true,
          body: `<div class="preset-grid">${RB.palettePresets.map((pp, i) => `
            <button class="preset" data-i="${i}">
              <div class="strip">${pp.colors.map(c => `<span style="background:${c}"></span>`).join('')}</div>
              <b>${esc(pp.name)}</b><small>${esc(pp.mood)}</small>
            </button>`).join('')}</div>`
        });
        m.el.querySelector('.preset-grid').addEventListener('click', ev => {
          const b = ev.target.closest('.preset'); if (!b) return;
          const pp = RB.palettePresets[+b.dataset.i];
          Store.project().palettes.push({ id: Store.uid(), name: pp.name, mood: pp.mood, colors: [...pp.colors] });
          Store.save(); m.close(); App.render();
        });
      },
      'pal-harmony': () => {
        let colors = [];
        UI.modal({
          title: 'Colour harmony generator',
          body: `<div class="form-grid">
              <label class="field"><span>Base colour</span><input type="color" name="base" value="#d9803c"></label>
              <label class="field"><span>Scheme</span><select name="scheme">${UI.opts(Object.entries(C.Color.schemes).map(([k, v]) => ({ value: k, label: v.split(':')[0] })), 'complementary')}</select></label>
            </div>
            <p class="small muted" data-desc></p><div data-prev></div>`,
          actions: [{ label: 'Cancel' }, { label: 'Add palette', kind: 'primary', onClick: (c, el) => {
            const s = el.querySelector('[name=scheme]').value;
            Store.project().palettes.push({ id: Store.uid(), name: C.Color.schemes[s].split(':')[0] + ' palette', mood: C.Color.schemes[s], colors });
            Store.save(); App.render();
          } }],
          onMount: el => {
            const upd = () => {
              const s = el.querySelector('[name=scheme]').value;
              colors = C.Color.harmony(el.querySelector('[name=base]').value, s);
              el.querySelector('[data-prev]').innerHTML = C.swatchRow(colors);
              el.querySelector('[data-desc]').textContent = C.Color.schemes[s];
            };
            el.addEventListener('input', upd); upd();
          }
        });
      },
      'pal-image': () => {
        let colors = [];
        UI.modal({
          title: 'Palette from a reference image',
          body: `<p class="small muted">Pick a film still, a location photo or a mood-board image. The colours are worked out on your device and the image is never uploaded.</p>
            <label class="btn file-btn">Choose image…<input type="file" accept="image/*" hidden></label>
            <label class="field"><span>Colours</span><select name="k">${UI.opts(['3', '4', '5', '6', '7', '8'], '5')}</select></label>
            <img class="ref-img hide" alt="Reference"><div data-prev></div>`,
          actions: [{ label: 'Cancel' }, { label: 'Add palette', kind: 'primary', onClick: () => {
            if (!colors.length) { UI.toast('Choose an image first', 'error'); return false; }
            Store.project().palettes.push({ id: Store.uid(), name: 'Reference palette', mood: '', colors });
            Store.save(); App.render();
          } }],
          onMount: el => {
            const img = el.querySelector('.ref-img');
            const run = () => { if (!img.naturalWidth) return; colors = C.Color.extract(img, +el.querySelector('[name=k]').value); el.querySelector('[data-prev]').innerHTML = C.swatchRow(colors); };
            el.querySelector('input[type=file]').addEventListener('change', ev => {
              const file = ev.target.files[0]; if (!file) return;
              const url = URL.createObjectURL(file);
              img.onload = () => { img.classList.remove('hide'); run(); };
              img.src = url;
            });
            el.querySelector('[name=k]').addEventListener('change', run);
          }
        });
      },
      'pal-blank': () => {
        Store.project().palettes.push({ id: Store.uid(), name: 'New palette', mood: '', colors: ['#1d1d1f', '#6e6e73', '#f5f5f7'] });
        Store.save(); App.render();
      },
      'pal-del': async el => {
        if (!(await UI.confirm('Delete this palette?'))) return;
        const p = Store.project(); p.palettes = p.palettes.filter(x => x.id !== el.dataset.id); Store.save(); App.render();
      },
      'swatch-add': el => {
        const pal = Store.project().palettes.find(x => x.id === el.dataset.pid);
        pal.colors.push(C.Color.hslToHex(Math.random() * 360, 55, 55)); Store.save(); App.render();
      },
      'swatch-del': el => {
        const pal = Store.project().palettes.find(x => x.id === el.dataset.pid);
        pal.colors.splice(+el.dataset.idx, 1); Store.save(); App.render();
      }
    }
  };

  /* ================= FRAME RATES ================= */
  const fps = {
    id: 'fps', label: 'Frame Rates', icon: '⏱️',
    render(p) {
      const base = parseFloat(p.meta.fps) || 24;
      const shootRates = [24, 25, 30, 48, 50, 60, 100, 120, 180, 240];
      return `
        <section class="card">
          <div class="row wrap">
            <label class="field"><span>Project base frame rate (timeline)</span><select data-bind="meta.fps" data-rerender>${UI.opts(RB.fpsOptions.map(f => ({ value: f, label: f + ' fps' })), p.meta.fps)}</select></label>
            <p class="small muted grow">Choose your base (timeline) frame rate before you shoot and stick to it. Anything shot faster can be slowed down to it for slow motion.</p>
          </div>
        </section>
        <div class="fps-grid">
          ${RB.frameRates.map(r => {
            const n = parseFloat(r.fps);
            const on = Math.abs(n - base) < 1.1;
            return `
            <article class="card fps-card ${on ? 'on' : ''}">
              <div class="fps-head"><b>${esc(r.label)}</b><span class="badge">${esc(r.tag)}</span></div>
              <p><b>Why:</b> ${esc(r.why)}</p>
              <p class="small"><b>Use for:</b> ${esc(r.use)}</p>
              <p class="small muted">180° shutter: ${esc(r.shutter)}${n > base * 1.3 ? ` · plays at ${Math.round(base / n * 100)}% speed on a ${base} fps timeline` : ''}</p>
            </article>`;
          }).join('')}
        </div>
        <section class="card">
          <h2>🐢 Slow-motion factor on your ${base} fps timeline</h2>
          <div class="table-wrap"><table class="table">
            <thead><tr><th>Shoot at</th>${shootRates.map(r => `<th>${r}</th>`).join('')}</tr></thead>
            <tbody><tr><td>Speed</td>${shootRates.map(r => `<td>${r <= base ? '100%' : Math.round(base / r * 100) + '%'}</td>`).join('')}</tr>
            <tr><td>Slower by</td>${shootRates.map(r => `<td>${r <= base ? '—' : (r / base).toFixed(1) + '×'}</td>`).join('')}</tr></tbody>
          </table></div>
          <ul class="tips">
            <li><b>180° shutter rule:</b> shutter speed ≈ 1 / (2 × fps). It gives natural motion blur. Use ND filters to keep it outdoors.</li>
            <li><b>Flicker:</b> under mains lighting, match your region: multiples of 25/50 in 50 Hz countries, 30/60 in 60 Hz countries.</li>
            <li><b>Light:</b> every doubling of frame rate (and shutter) costs one stop of light.</li>
            <li><b>Don’t mix</b> 24 and 25/30 fps footage at normal speed. Conversions stutter.</li>
          </ul>
        </section>`;
    }
  };

  /* ================= GLOSSARY ================= */
  function glossaryResults(q) {
    q = q.toLowerCase();
    const match = x => !q || [x.name, x.id, x.desc, x.use, x.gear, x.group].filter(Boolean).join(' ').toLowerCase().includes(q);
    const block = (title, items, extra = () => '') => {
      const hits = items.filter(match);
      return hits.length ? `<h3 class="group-title">${title}</h3><div class="gloss-grid">${hits.map(x => `
        <article class="gloss"><div class="gloss-head"><b>${esc(x.name)}</b>${extra(x)}</div><p class="small">${esc(x.desc)}</p><p class="small muted">${esc(x.use)}</p></article>`).join('')}</div>` : '';
    };
    const groups = [...new Set(RB.techniques.map(t => t.group))];
    const html = block('📐 Shot sizes', RB.sizes, x => `<span class="badge soft">${x.id}</span>`)
      + block('🎥 Camera angles', RB.angles)
      + block('➜ Camera movement', RB.movements, x => `<span class="badge ${x.type}">${x.type.toUpperCase()}</span><span class="badge soft">${esc(x.gear)}</span>`)
      + groups.map(g => block('✨ ' + g, RB.techniques.filter(t => t.group === g))).join('');
    return html || '<p class="muted">Nothing found.</p>';
  }

  const glossary = {
    id: 'glossary', label: 'Techniques', icon: '📚',
    render() {
      return `
        <div class="toolbar"><input class="search" type="search" data-ui-search placeholder="Search angles, moves, techniques… e.g. “tension”, “gimbal”, “low”" value="${esc(ui.q)}"></div>
        <div id="gloss-results">${glossaryResults(ui.q)}</div>`;
    },
    onInput(el) {
      if (el.matches('[data-ui-search]')) { ui.q = el.value; document.getElementById('gloss-results').innerHTML = glossaryResults(ui.q); return true; }
    }
  };

  /* ================= GEAR ================= */
  const gear = {
    id: 'gear', label: 'Gear', icon: '🎒',
    render(p) {
      const cats = [...new Set(p.gear.map(g => g.cat))];
      const packed = p.gear.filter(g => g.packed).length;
      return `
        <div class="toolbar">
          <button class="btn primary" data-action="gear-add">＋ Add item</button>
          <button class="btn" data-action="gear-reset">Unpack all</button>
          <span class="spacer"></span>
        </div>
        ${UI.progress(packed, p.gear.length)}
        <div class="gear-grid">
          ${cats.map(cat => {
            const items = p.gear.map((g, i) => ({ ...g, i })).filter(g => g.cat === cat);
            return `<section class="card">
              <h3>${esc(cat)} <span class="muted small">${items.filter(g => g.packed).length}/${items.length}</span></h3>
              <div class="checklist">${items.map(g => `
                <div class="check-row">
                  <label class="check"><input type="checkbox" data-bind="gear.${g.i}.packed" data-rerender ${g.packed ? 'checked' : ''}><span>${esc(g.text)}</span></label>
                  <button class="icon-btn subtle" data-action="gear-del" data-id="${g.id}" title="Remove">✕</button>
                </div>`).join('')}</div>
            </section>`;
          }).join('')}
        </div>`;
    },
    actions: {
      'gear-add': async () => {
        const p = Store.project();
        const cats = [...new Set(p.gear.map(g => g.cat))];
        const v = await UI.formModal('Add gear', [
          { key: 'text', label: 'Item', placeholder: 'e.g. 50mm f/1.8', full: true },
          { key: 'cat', label: 'Category', list: 'gear-cats', full: true, default: cats[0] || 'Camera' }
        ], {}, { wide: false, okLabel: 'Add', extra: `<datalist id="gear-cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>` });
        if (!v || !v.text) return;
        p.gear.push({ id: Store.uid(), text: v.text, cat: v.cat || 'Other', packed: false }); Store.save(); App.render();
      },
      'gear-del': el => { const p = Store.project(); p.gear = p.gear.filter(g => g.id !== el.dataset.id); Store.save(); App.render(); },
      'gear-reset': () => { Store.project().gear.forEach(g => { g.packed = false; }); Store.save(); App.render(); }
    }
  };

  /* ================= CREW & LOCATIONS ================= */
  const crewFields = [
    { key: 'name', label: 'Name' }, { key: 'role', label: 'Role', placeholder: 'Gaffer, talent, client…' },
    { key: 'phone', label: 'Phone', type: 'tel' }, { key: 'email', label: 'Email', type: 'email' },
    { key: 'call', label: 'Call time', type: 'time' }, { key: 'notes', label: 'Notes', placeholder: 'Dietary, parking…' }
  ];
  const locFields = [
    { key: 'name', label: 'Name', placeholder: 'Rooftop' },
    { key: 'permit', label: 'Permit / permission', type: 'select', options: ['Not needed', 'Needed', 'Requested', 'Approved'], default: 'Not needed' },
    { key: 'address', label: 'Address', full: true },
    { key: 'contact', label: 'Contact', placeholder: 'Name & phone' },
    { key: 'sun', label: 'Best light', placeholder: 'West-facing, sunset' },
    { key: 'notes', label: 'Notes: power, noise, parking, toilets', type: 'textarea', full: true }
  ];

  const people = {
    id: 'people', label: 'Crew & Places', icon: '👥',
    render(p) {
      return `
      <div class="grid two">
        <section class="card">
          <div class="card-head"><h2>👥 Crew & talent</h2><button class="btn primary sm" data-action="crew-add">＋ Add</button></div>
          ${p.crew.length ? `<div class="list">${p.crew.map(c => `
            <div class="list-row">
              <div class="grow"><b>${esc(c.name)}</b> <span class="badge soft">${esc(c.role)}</span>${c.call ? ` <span class="badge">Call ${esc(c.call)}</span>` : ''}
                <div class="small muted">${[c.phone && `<a href="tel:${esc(c.phone)}">📞 ${esc(c.phone)}</a>`, c.email && `<a href="mailto:${esc(c.email)}">✉️ ${esc(c.email)}</a>`, c.notes && esc(c.notes)].filter(Boolean).join(' · ')}</div></div>
              <button class="icon-btn" data-action="crew-edit" data-id="${c.id}">✎</button>
              <button class="icon-btn" data-action="crew-del" data-id="${c.id}">🗑</button>
            </div>`).join('')}</div>` : '<p class="muted small">Add your crew, talent and client contacts for quick calling on set.</p>'}
        </section>
        <section class="card">
          <div class="card-head"><h2>📍 Locations</h2><button class="btn primary sm" data-action="loc-add">＋ Add</button></div>
          ${p.locations.length ? `<div class="list">${p.locations.map(l => `
            <div class="list-row">
              <div class="grow"><b>${esc(l.name)}</b> <span class="badge ${l.permit === 'Approved' ? 'ok' : l.permit === 'Needed' ? 'warn' : 'soft'}">${esc(l.permit)}</span>
                <div class="small muted">${[l.address && `<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}">🗺 ${esc(l.address)}</a>`, l.contact && esc(l.contact), l.sun && `☀️ ${esc(l.sun)}`].filter(Boolean).join(' · ')}</div>
                ${l.notes ? `<div class="small">${esc(l.notes)}</div>` : ''}</div>
              <button class="icon-btn" data-action="loc-edit" data-id="${l.id}">✎</button>
              <button class="icon-btn" data-action="loc-del" data-id="${l.id}">🗑</button>
            </div>`).join('')}</div>` : '<p class="muted small">Log scouted locations, permits and practical notes.</p>'}
        </section>
      </div>`;
    },
    actions: crudActions()
  };

  function crudActions() {
    const make = (key, fields, title) => ({
      [`${key}-add`]: async () => {
        const v = await UI.formModal(`Add ${title}`, fields, {}, { okLabel: 'Add' });
        if (v && v.name) { Store.project()[key === 'crew' ? 'crew' : 'locations'].push({ id: Store.uid(), ...v }); Store.save(); App.render(); }
      },
      [`${key}-edit`]: async el => {
        const list = Store.project()[key === 'crew' ? 'crew' : 'locations'], x = list.find(i => i.id === el.dataset.id);
        const v = await UI.formModal(`Edit ${title}`, fields, x);
        if (v) { Object.assign(x, v); Store.save(); App.render(); }
      },
      [`${key}-del`]: async el => {
        if (!(await UI.confirm(`Delete this ${title}?`))) return;
        const p = Store.project(), k = key === 'crew' ? 'crew' : 'locations';
        p[k] = p[k].filter(i => i.id !== el.dataset.id); Store.save(); App.render();
      }
    });
    return { ...make('crew', crewFields, 'contact'), ...make('loc', locFields, 'location') };
  }

  const notes = { id: 'notes', label: 'Notes', icon: '📝', render: p => C.notesSection('prep', p) };

  Views.prep = {
    label: 'Prep', sub: 'Pre-production', icon: '📐',
    sections: [overview, shots, board, colour, fps, glossary, gear, people, notes],
    ui
  };
})();
