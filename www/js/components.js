/* Reelbook — shared components: badges, quick notes, sketch pad, colour tools. */
window.C = (() => {
  const { esc } = UI;

  /* ---------- Badges ---------- */
  function catBadge(id) {
    const c = RB.find(RB.categories, id);
    if (!c) return '';
    return `<span class="badge cat" style="--c:${c.color}">${c.icon} ${esc(c.name)}</span>`;
  }

  function moveBadge(id) {
    const m = RB.find(RB.movements, id);
    if (!m) return '';
    return `<span class="badge ${m.type}">${m.type === 'static' ? '■ STATIC' : '➜ MOVING'}</span><span class="badge soft">${esc(m.name)}</span>`;
  }

  function shotBadges(s) {
    const size = RB.find(RB.sizes, s.size);
    const angle = RB.find(RB.angles, s.angle);
    return [
      catBadge(s.category),
      size ? `<span class="badge soft" title="${esc(size.name)}">${esc(size.id)}</span>` : '',
      angle ? `<span class="badge soft">${esc(angle.name)}</span>` : '',
      moveBadge(s.movement),
      s.lens ? `<span class="badge soft">${esc(s.lens)}</span>` : '',
      s.fps ? `<span class="badge soft">${esc(s.fps)} fps</span>` : ''
    ].join('');
  }

  const shotLabel = s => `${s.scene || '?'}${s.num || ''}`;

  /* ---------- Quick notes ---------- */
  const TAB_NAMES = { prep: 'Prep', roll: 'Roll', wrap: 'Wrap' };

  function notesSection(tab, p, { compact = false } = {}) {
    const list = [...(p.notes[tab] || [])].sort((a, b) => (b.pinned - a.pinned) || (b.time - a.time));
    const shown = compact ? list.slice(0, 3) : list;
    return `
      <section class="card notes-card">
        <div class="card-head"><h2>📝 Quick notes</h2>${compact && list.length > 3 ? `<a class="link" href="#${tab}/notes">All ${list.length} →</a>` : ''}</div>
        <div class="note-input">
          <textarea data-note-input="${tab}" rows="2" placeholder="Jot it down… (Ctrl/⌘+Enter to save)"></textarea>
          <button class="btn primary" data-action="note-add" data-tab="${tab}">Add</button>
        </div>
        <div class="notes-list">
          ${shown.length ? shown.map(n => `
            <div class="note ${n.pinned ? 'pinned' : ''}">
              <div class="note-text">${esc(n.text).replace(/\n/g, '<br>')}</div>
              <div class="note-meta">
                <span>${UI.fmtDateTime(n.time)}</span>
                <span class="note-actions">
                  <button class="icon-btn" data-action="note-pin" data-tab="${tab}" data-id="${n.id}" title="${n.pinned ? 'Unpin' : 'Pin'}">${n.pinned ? '📌' : '📍'}</button>
                  <button class="icon-btn" data-action="note-edit" data-tab="${tab}" data-id="${n.id}" title="Edit">✎</button>
                  <button class="icon-btn" data-action="note-del" data-tab="${tab}" data-id="${n.id}" title="Delete">🗑</button>
                </span>
              </div>
            </div>`).join('') : `<p class="muted small">No ${TAB_NAMES[tab]} notes yet.</p>`}
        </div>
      </section>`;
  }

  function addNote(tab, text) {
    text = (text || '').trim();
    if (!text) return false;
    Store.project().notes[tab].push({ id: Store.uid(), text, time: Date.now(), pinned: false });
    Store.save();
    return true;
  }

  const noteActions = {
    'note-add': el => {
      const ta = document.querySelector(`[data-note-input="${el.dataset.tab}"]`);
      if (addNote(el.dataset.tab, ta && ta.value)) App.render();
    },
    'note-pin': el => {
      const n = Store.project().notes[el.dataset.tab].find(x => x.id === el.dataset.id);
      n.pinned = !n.pinned; Store.save(); App.render();
    },
    'note-edit': async el => {
      const n = Store.project().notes[el.dataset.tab].find(x => x.id === el.dataset.id);
      const v = await UI.formModal('Edit note', [{ key: 'text', label: 'Note', type: 'textarea', rows: 6, full: true }], n, { wide: false });
      if (v && v.text) { n.text = v.text; Store.save(); App.render(); }
    },
    'note-del': async el => {
      if (!(await UI.confirm('Delete this note?'))) return;
      const p = Store.project();
      p.notes[el.dataset.tab] = p.notes[el.dataset.tab].filter(x => x.id !== el.dataset.id);
      Store.save(); App.render();
    }
  };

  /* ---------- Sketch pad (storyboard frames) ---------- */
  function aspectRatio(p) {
    const a = RB.find(RB.aspects, p.meta.aspect);
    return a ? a.ratio : 16 / 9;
  }

  function sketchPad(frame, onSave) {
    const ratio = aspectRatio(Store.project());
    const W = ratio >= 1 ? 800 : Math.round(800 * ratio);
    const H = ratio >= 1 ? Math.round(800 / ratio) : 800;
    const colors = ['#111111', '#7a7a7a', '#e23b3b', '#2f6fdf', '#1f9d55'];
    const body = `
      <div class="sketch-tools">
        <div class="seg" data-group="tool">
          <button class="on" data-tool="pen" title="Pen">✏️ Pen</button>
          <button data-tool="arrow" title="Arrow for camera / subject movement">↗ Arrow</button>
          <button data-tool="rect" title="Frame box">▭ Box</button>
          <button data-tool="erase" title="Eraser">⌫ Erase</button>
        </div>
        <div class="seg" data-group="size">
          <button data-size="2">S</button><button class="on" data-size="5">M</button><button data-size="12">L</button>
        </div>
        <div class="swatches">${colors.map((c, i) => `<button class="sw ${i === 0 ? 'on' : ''}" data-color="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}</div>
        <div class="seg">
          <button data-do="undo" title="Undo">↶ Undo</button>
          <button data-do="clear" title="Clear">Clear</button>
          <button data-do="grid" class="on" title="Rule-of-thirds overlay">#  Thirds</button>
        </div>
      </div>
      <div class="sketch-stage" style="aspect-ratio:${W}/${H}">
        <canvas width="${W}" height="${H}"></canvas>
        <div class="thirds"></div>
      </div>
      <p class="muted small">Tip: use <b style="color:#e23b3b">red arrows</b> for camera moves and <b style="color:#2f6fdf">blue</b> for subject movement.</p>`;

    UI.modal({
      title: `Sketch: frame ${frame.index || ''}`, wide: true, body,
      actions: [{ label: 'Cancel' }, { label: 'Save sketch', kind: 'primary', onClick: (close, el) => {
        const cv = el.querySelector('canvas');
        const png = cv.toDataURL('image/png');
        const jpg = cv.toDataURL('image/jpeg', 0.82);
        onSave(png.length < jpg.length ? png : jpg);
      } }],
      onMount: el => {
        const cv = el.querySelector('canvas');
        const ctx = cv.getContext('2d');
        let tool = 'pen', size = 5, color = colors[0], drawing = false, start = null, snap = null;
        const undo = [];
        const paper = () => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); };
        paper();
        if (frame.sketch) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0, W, H);
          img.src = frame.sketch;
        }
        const pos = ev => {
          const r = cv.getBoundingClientRect();
          return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height };
        };
        const style = () => {
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.strokeStyle = tool === 'erase' ? '#fff' : color;
          ctx.fillStyle = color;
          ctx.lineWidth = tool === 'erase' ? size * 4 : size;
        };
        const arrow = (a, b) => {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          const ang = Math.atan2(b.y - a.y, b.x - a.x), head = 10 + size * 2.5;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - head * Math.cos(ang - 0.45), b.y - head * Math.sin(ang - 0.45));
          ctx.lineTo(b.x - head * Math.cos(ang + 0.45), b.y - head * Math.sin(ang + 0.45));
          ctx.closePath(); ctx.fill();
        };
        cv.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          cv.setPointerCapture(ev.pointerId);
          undo.push(ctx.getImageData(0, 0, W, H));
          if (undo.length > 25) undo.shift();
          drawing = true; start = pos(ev); snap = ctx.getImageData(0, 0, W, H);
          style();
          if (tool === 'pen' || tool === 'erase') { ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(start.x + 0.1, start.y + 0.1); ctx.stroke(); }
        });
        cv.addEventListener('pointermove', ev => {
          if (!drawing) return;
          const p = pos(ev);
          style();
          if (tool === 'pen' || tool === 'erase') {
            ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(p.x, p.y); ctx.stroke(); start = p;
          } else {
            ctx.putImageData(snap, 0, 0);
            if (tool === 'arrow') arrow(start, p);
            else ctx.strokeRect(start.x, start.y, p.x - start.x, p.y - start.y);
          }
        });
        const end = () => { drawing = false; };
        cv.addEventListener('pointerup', end);
        cv.addEventListener('pointercancel', end);

        el.querySelector('.sketch-tools').addEventListener('click', ev => {
          const b = ev.target.closest('button');
          if (!b) return;
          if (b.dataset.tool) { tool = b.dataset.tool; setOn(b); }
          if (b.dataset.size) { size = +b.dataset.size; setOn(b); }
          if (b.dataset.color) {
            color = b.dataset.color;
            el.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b));
            if (tool === 'erase') { tool = 'pen'; setOn(el.querySelector('[data-tool=pen]')); }
          }
          if (b.dataset.do === 'undo' && undo.length) ctx.putImageData(undo.pop(), 0, 0);
          if (b.dataset.do === 'clear') { undo.push(ctx.getImageData(0, 0, W, H)); paper(); }
          if (b.dataset.do === 'grid') { b.classList.toggle('on'); el.querySelector('.thirds').classList.toggle('hide'); }
        });
        function setOn(b) { b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); }
      }
    });
  }

  /* ---------- Colour tools ---------- */
  const Color = {
    hexToRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
    rgbToHex(r, g, b) { return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join(''); },
    rgbToHsl(r, g, b) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
      if (max === min) return [0, 0, l * 100];
      const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return [h * 60, s * 100, l * 100];
    },
    hslToHex(h, s, l) {
      h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(100, s)) / 100; l = Math.max(0, Math.min(100, l)) / 100;
      const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return Color.rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
    },
    lum(hex) { const [r, g, b] = Color.hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; },
    textOn(hex) { return Color.lum(hex) > 0.55 ? '#111' : '#fff'; },
    schemes: {
      complementary: 'Complementary: opposites for maximum contrast (teal & orange)',
      analogous: 'Analogous: neighbours on the wheel, harmonious and calm',
      triadic: 'Triadic: three evenly spaced hues, vibrant and playful',
      split: 'Split-complementary: contrast with less tension',
      monochrome: 'Monochromatic: one hue in many tones, cohesive and moody'
    },
    harmony(hex, scheme) {
      const [h, s, l] = Color.rgbToHsl(...Color.hexToRgb(hex));
      const H = (dh, ds = 0, dl = 0) => Color.hslToHex(h + dh, s + ds, l + dl);
      switch (scheme) {
        case 'complementary': return [H(0, 0, -25), H(0), H(0, -30, 30), H(180), H(180, 0, -20)];
        case 'analogous': return [H(-40), H(-20), H(0), H(20), H(40)];
        case 'triadic': return [H(0), H(0, -20, 25), H(120), H(240), H(240, -20, -20)];
        case 'split': return [H(0), H(0, 0, 25), H(150), H(210), H(210, 0, -20)];
        default: return [H(0, 0, -35), H(0, 0, -18), H(0), H(0, -10, 18), H(0, -20, 34)];
      }
    },
    /* Simple k-means over a downscaled image. */
    extract(img, k = 5) {
      const S = 80, cv = document.createElement('canvas');
      const r = img.width / img.height;
      cv.width = r >= 1 ? S : Math.round(S * r); cv.height = r >= 1 ? Math.round(S / r) : S;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data, px = [];
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) px.push([data[i], data[i + 1], data[i + 2]]);
      if (!px.length) return [];
      let cents = Array.from({ length: k }, (_, i) => px[Math.floor((i + 0.5) * px.length / k)].slice());
      for (let it = 0; it < 12; it++) {
        const sums = cents.map(() => [0, 0, 0, 0]);
        px.forEach(p => {
          let best = 0, bd = Infinity;
          cents.forEach((c, ci) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = ci; } });
          const s = sums[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
        });
        cents = sums.map((s, i) => s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : cents[i]);
      }
      return cents.map(c => Color.rgbToHex(...c)).sort((a, b) => Color.lum(a) - Color.lum(b));
    }
  };

  function swatchRow(colors, { editable = false, pid = '' } = {}) {
    return `<div class="swatch-row">${colors.map((c, i) => `
      <div class="swatch" style="background:${c};color:${Color.textOn(c)}">
        <button class="swatch-hex" data-action="copy-hex" data-hex="${c}" title="Copy">${c.toUpperCase()}</button>
        ${editable ? `
          <label class="swatch-edit" title="Change colour">✎<input type="color" value="${c}" data-palette="${pid}" data-idx="${i}"></label>
          <button class="swatch-del" data-action="swatch-del" data-pid="${pid}" data-idx="${i}" title="Remove">✕</button>` : ''}
      </div>`).join('')}
      ${editable && colors.length < 8 ? `<button class="swatch add" data-action="swatch-add" data-pid="${pid}" title="Add colour">＋</button>` : ''}
    </div>`;
  }

  return { catBadge, moveBadge, shotBadges, shotLabel, notesSection, addNote, noteActions, sketchPad, aspectRatio, Color, swatchRow };
})();
