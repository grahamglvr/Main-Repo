/* Reelbook — UI helpers: escaping, modals, forms, toasts. */
window.UI = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg, kind) {
    let host = document.getElementById('toasts');
    if (!host) { host = document.createElement('div'); host.id = 'toasts'; document.body.appendChild(host); }
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200);
    setTimeout(() => t.remove(), 2600);
  }

  /* Generic modal. `actions` is a list of {label, kind, onClick(close, el) -> false to keep open}. */
  function modal({ title, body, actions = [], wide = false, onMount }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <header><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Close">✕</button></header>
        <div class="modal-body">${body}</div>
        ${actions.length ? `<footer>${actions.map((a, i) => `<button class="btn ${a.kind || ''}" data-act="${i}">${esc(a.label)}</button>`).join('')}</footer>` : ''}
      </div>`;
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = ev => { if (ev.key === 'Escape') close(); };
    wrap.addEventListener('click', ev => {
      if (ev.target === wrap || ev.target.closest('[data-close]')) return close();
      const b = ev.target.closest('[data-act]');
      if (b) {
        const a = actions[+b.dataset.act];
        if (!a.onClick || a.onClick(close, wrap) !== false) close();
      }
    });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    const first = wrap.querySelector('input:not([type=checkbox]):not([type=color]), textarea, select');
    if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
    if (onMount) onMount(wrap, close);
    return { el: wrap, close };
  }

  function confirm(message, okLabel = 'Delete') {
    return new Promise(resolve => {
      modal({
        title: 'Are you sure?',
        body: `<p>${esc(message)}</p>`,
        actions: [
          { label: 'Cancel', onClick: () => resolve(false) },
          { label: okLabel, kind: 'danger', onClick: () => resolve(true) }
        ]
      });
    });
  }

  function prompt(title, value = '', label = 'Name') {
    return new Promise(resolve => {
      modal({
        title,
        body: `<label class="field full"><span>${esc(label)}</span><input name="v" value="${esc(value)}"></label>`,
        actions: [
          { label: 'Cancel', onClick: () => resolve(null) },
          { label: 'Save', kind: 'primary', onClick: (c, el) => resolve(el.querySelector('[name=v]').value.trim()) }
        ],
        onMount: (el, close) => el.querySelector('input').addEventListener('keydown', ev => {
          if (ev.key === 'Enter') { resolve(ev.target.value.trim()); close(); }
        })
      });
    });
  }

  const opts = (list, value, empty) =>
    (empty !== undefined ? `<option value="">${esc(empty)}</option>` : '') +
    list.map(o => {
      const v = typeof o === 'object' ? o.value : o;
      const l = typeof o === 'object' ? o.label : o;
      return `<option value="${esc(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${esc(l)}</option>`;
    }).join('');

  /* Field spec: {key, label, type, options, empty, hint(value), full, placeholder} */
  function formHTML(fields, values = {}) {
    return `<div class="form-grid">${fields.map(f => {
      const v = values[f.key] ?? f.default ?? '';
      const ph = f.placeholder ? `placeholder="${esc(f.placeholder)}"` : '';
      let input;
      if (f.type === 'textarea') input = `<textarea name="${f.key}" rows="${f.rows || 3}" ${ph}>${esc(v)}</textarea>`;
      else if (f.type === 'select') input = `<select name="${f.key}">${opts(f.options, v, f.empty)}</select>`;
      else input = `<input name="${f.key}" type="${f.type || 'text'}" value="${esc(v)}" ${ph} ${f.list ? `list="${f.list}"` : ''}>`;
      const hint = f.hint ? `<small class="hint" data-hint="${f.key}">${esc(f.hint(v))}</small>` : '';
      return `<label class="field ${f.full ? 'full' : ''}"><span>${esc(f.label)}</span>${input}${hint}</label>`;
    }).join('')}</div>`;
  }

  function readForm(root, fields) {
    const out = {};
    fields.forEach(f => {
      const el = root.querySelector(`[name="${f.key}"]`);
      if (el) out[f.key] = el.value.trim();
    });
    return out;
  }

  /* Live-update the hint text under selects (angle / movement / fps explanations). */
  function wireHints(root, fields) {
    fields.filter(f => f.hint).forEach(f => {
      const el = root.querySelector(`[name="${f.key}"]`);
      const h = root.querySelector(`[data-hint="${f.key}"]`);
      if (el && h) el.addEventListener('input', () => { h.textContent = f.hint(el.value); });
    });
  }

  /* Open a form in a modal. Resolves with the values, or null if cancelled. */
  function formModal(title, fields, values, { okLabel = 'Save', wide = true, extra = '' } = {}) {
    return new Promise(resolve => {
      modal({
        title, wide,
        body: formHTML(fields, values) + extra,
        actions: [
          { label: 'Cancel', onClick: () => resolve(null) },
          { label: okLabel, kind: 'primary', onClick: (c, el) => resolve(readForm(el, fields)) }
        ],
        onMount: el => wireHints(el, fields)
      });
    });
  }

  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDateTime = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  function download(filename, text, type = 'application/json') {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast(`Copied ${text}`); }
    catch { toast(text); }
  }

  const slug = s => (s || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const progress = (done, total) => {
    const pct = total ? Math.round((done / total) * 100) : 0;
    return `<div class="progress"><div class="bar" style="width:${pct}%"></div><span>${done} / ${total} · ${pct}%</span></div>`;
  };

  const empty = (icon, title, text, actions = '') =>
    `<div class="empty"><div class="empty-icon">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actions}</div>`;

  return { esc, toast, modal, confirm, prompt, opts, formHTML, readForm, wireHints, formModal, fmtTime, fmtDateTime, download, copy, slug, progress, empty };
})();
