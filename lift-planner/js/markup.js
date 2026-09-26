/* Full-screen photo markup: pen, arrow, line and text labels (e.g. "LP1").
 * LiftMarkup.open(blob) resolves to the marked-up JPEG blob, or null if cancelled.
 * LiftMarkup.blankSketch() makes a white gridded page to draw a sketch on. */
(function (root) {
  'use strict';

  const COLOURS = ['#e00000', '#ffd400', '#00a0ff', '#ffffff', '#000000'];
  const TOOLS = [
    { id: 'arrow', label: 'Arrow' },
    { id: 'pen', label: 'Pen' },
    { id: 'line', label: 'Line' },
    { id: 'text', label: 'Text' },
  ];

  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not open the image')); };
      img.src = url;
    });
  }

  function blankSketch(w = 1400, h = 1000) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#e3e8ef';
    g.lineWidth = 1;
    for (let x = 50; x < w; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 50; y < h; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  }

  function drawArrow(g, a, b, w) {
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const head = w * 4;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0] - Math.cos(ang) * head * 0.6, b[1] - Math.sin(ang) * head * 0.6);
    g.stroke();
    g.beginPath();
    g.moveTo(b[0], b[1]);
    g.lineTo(b[0] - head * Math.cos(ang - 0.45), b[1] - head * Math.sin(ang - 0.45));
    g.lineTo(b[0] - head * Math.cos(ang + 0.45), b[1] - head * Math.sin(ang + 0.45));
    g.closePath();
    g.fill();
  }

  function drawShape(g, s) {
    g.strokeStyle = s.color;
    g.fillStyle = s.color;
    g.lineWidth = s.w;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    if (s.type === 'pen') {
      g.beginPath();
      s.pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
      g.stroke();
    } else if (s.type === 'line') {
      g.beginPath(); g.moveTo(s.a[0], s.a[1]); g.lineTo(s.b[0], s.b[1]); g.stroke();
    } else if (s.type === 'arrow') {
      drawArrow(g, s.a, s.b, s.w);
    } else if (s.type === 'text') {
      g.font = `bold ${s.size}px system-ui, sans-serif`;
      g.textBaseline = 'middle';
      const pad = s.size * 0.3;
      const tw = g.measureText(s.text).width;
      const dark = s.color === '#000000';
      g.fillStyle = dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)';
      g.fillRect(s.x - pad, s.y - s.size / 2 - pad, tw + pad * 2, s.size + pad * 2);
      g.fillStyle = s.color;
      g.fillText(s.text, s.x, s.y);
    }
  }

  async function open(blob) {
    const img = await loadImage(blob);
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const lineW = Math.max(4, Math.round(Math.max(W, H) / 220));
    const textSize = Math.max(28, Math.round(Math.max(W, H) / 26));

    const el = document.createElement('div');
    el.className = 'markup';
    el.innerHTML = `
      <div class="markup-bar">
        <button type="button" class="btn" data-act="cancel">Cancel</button>
        <button type="button" class="btn" data-act="undo">Undo</button>
        <button type="button" class="btn primary" data-act="save">Save</button>
      </div>
      <div class="markup-stage"><canvas></canvas></div>
      <div class="markup-bar markup-tools">
        ${TOOLS.map((t) => `<button type="button" class="btn tool" data-tool="${t.id}">${t.label}</button>`).join('')}
      </div>
      <div class="markup-bar markup-colours">
        ${COLOURS.map((c) => `<button type="button" class="swatch" data-colour="${c}" style="background:${c}" aria-label="Colour ${c}"></button>`).join('')}
      </div>`;
    document.body.appendChild(el);
    document.body.classList.add('no-scroll');

    const canvas = el.querySelector('canvas');
    const stage = el.querySelector('.markup-stage');
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext('2d');
    const shapes = [];
    let tool = 'arrow';
    let colour = COLOURS[0];
    let current = null;

    function fit() {
      const r = stage.getBoundingClientRect();
      const scale = Math.min(r.width / W, r.height / H);
      canvas.style.width = W * scale + 'px';
      canvas.style.height = H * scale + 'px';
    }
    function redraw() {
      g.drawImage(img, 0, 0, W, H);
      shapes.forEach((s) => drawShape(g, s));
      if (current) drawShape(g, current);
    }
    function syncButtons() {
      el.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
      el.querySelectorAll('[data-colour]').forEach((b) => b.classList.toggle('active', b.dataset.colour === colour));
    }
    function point(e) {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
    }

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = point(e);
      if (tool === 'text') return;
      current = tool === 'pen'
        ? { type: 'pen', color: colour, w: lineW, pts: [p] }
        : { type: tool, color: colour, w: lineW, a: p, b: p };
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!current) return;
      const p = point(e);
      if (current.type === 'pen') current.pts.push(p);
      else current.b = p;
      redraw();
    });
    canvas.addEventListener('pointerup', (e) => {
      const p = point(e);
      if (tool === 'text') {
        const text = (prompt('Label text (e.g. LP1)') || '').trim();
        if (text) { shapes.push({ type: 'text', color: colour, size: textSize, x: p[0], y: p[1], text }); redraw(); }
        return;
      }
      if (current) {
        const tiny = current.type !== 'pen' && Math.hypot(current.b[0] - current.a[0], current.b[1] - current.a[1]) < lineW * 2;
        if (!tiny) shapes.push(current);
        current = null;
        redraw();
      }
    });
    canvas.addEventListener('pointercancel', () => { current = null; redraw(); });

    window.addEventListener('resize', fit);
    fit();
    redraw();
    syncButtons();

    return new Promise((resolve) => {
      function close(result) {
        window.removeEventListener('resize', fit);
        document.body.classList.remove('no-scroll');
        el.remove();
        resolve(result);
      }
      el.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.tool) { tool = b.dataset.tool; syncButtons(); }
        else if (b.dataset.colour) { colour = b.dataset.colour; syncButtons(); }
        else if (b.dataset.act === 'undo') { shapes.pop(); redraw(); }
        else if (b.dataset.act === 'cancel') {
          if (!shapes.length || confirm('Discard your markup?')) close(null);
        } else if (b.dataset.act === 'save') {
          if (!shapes.length) { close(null); return; }
          canvas.toBlob((out) => close(out), 'image/jpeg', 0.85);
        }
      });
    });
  }

  root.LiftMarkup = { open, blankSketch };
})(self);
