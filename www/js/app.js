/* Reelbook — app shell: routing, rendering, event delegation, projects. */
window.App = (() => {
  const { esc } = UI;
  const TAB_ORDER = ['prep', 'roll', 'wrap'];
  let route = { tab: 'prep', sec: 'overview' };
  let actions = {};
  const lastSec = {};

  const $ = sel => document.querySelector(sel);

  function parseHash() {
    const [tab, sec] = (location.hash.replace('#', '') || Store.state.route || '').split('/');
    const t = Views[tab] ? tab : 'prep';
    const want = sec || lastSec[t];
    const s = Views[t].sections.some(x => x.id === want) ? want : Views[t].sections[0].id;
    return { tab: t, sec: s };
  }

  function go(tab, sec) {
    location.hash = `${tab}/${sec || Views[tab].sections[0].id}`;
  }

  function setPath(obj, path, val) {
    const keys = path.split('.');
    let o = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (o[keys[i]] == null) o[keys[i]] = {};
      o = o[keys[i]];
    }
    o[keys[keys.length - 1]] = val;
  }

  function currentSection() {
    return Views[route.tab].sections.find(s => s.id === route.sec);
  }

  function renderChrome() {
    const p = Store.project();
    $('#project-name').textContent = p.name;
    document.body.dataset.tab = route.tab;
    $('#tabs').innerHTML = TAB_ORDER.map(id => {
      const t = Views[id];
      return `<a class="tab ${route.tab === id ? 'on' : ''}" href="#${id}" data-tab="${id}">
        <span class="tab-icon">${t.icon}</span><span class="tab-text"><b>${t.label}</b><small>${t.sub}</small></span></a>`;
    }).join('');
    $('#subnav').innerHTML = Views[route.tab].sections.map(s =>
      `<a class="sub ${route.sec === s.id ? 'on' : ''}" href="#${route.tab}/${s.id}">${s.icon} ${esc(s.label)}</a>`).join('');
    const on = $('#subnav .sub.on');
    if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function render() {
    const p = Store.project();
    const sec = currentSection();
    const roll = Views.roll.ui;
    if (roll.full && !(route.tab === 'roll' && route.sec === 'slate')) { roll.full = false; Native.hideStatusBar(false); }
    Native.keepAwake(route.tab === 'roll'); // keep the screen on while shooting
    renderChrome();
    const view = $('#view');
    view.innerHTML = `<div class="view-head"><h1>${sec.icon} ${esc(sec.label)}</h1></div>` + sec.render(p);
    if (sec.after) sec.after(view);
  }

  function onRoute() {
    const r = parseHash();
    const changed = r.tab !== route.tab || r.sec !== route.sec;
    route = r;
    lastSec[r.tab] = r.sec;
    Store.state.route = `${r.tab}/${r.sec}`;
    Store.save();
    render();
    if (changed) window.scrollTo(0, 0);
  }

  /* ---------- Event delegation ---------- */
  function onClick(ev) {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const fn = actions[el.dataset.action];
    if (fn) { ev.preventDefault(); fn(el, ev); }
  }

  function onInput(ev) {
    const el = ev.target;
    const p = Store.project();
    const sec = currentSection();
    if (sec.onInput && sec.onInput(el, ev, p)) return;

    if (el.dataset.bind) {
      const val = el.type === 'checkbox' ? el.checked : el.value;
      const rerender = el.hasAttribute('data-rerender') || el.hasAttribute('data-rerender-change');
      if (rerender && ev.type !== 'change') return;
      if (!rerender && ev.type === 'change' && el.type !== 'checkbox') return; // already handled on input
      setPath(p, el.dataset.bind, val);
      Store.save();
      if (el.hasAttribute('data-header')) $('#project-name').textContent = val || 'Untitled';
      if (rerender) render();
      return;
    }
    if (el.dataset.ui && ev.type === 'change') { Views[route.tab].ui[el.dataset.ui] = el.value; render(); return; }
    if (el.dataset.uiToggle && ev.type === 'change') { Views[route.tab].ui[el.dataset.uiToggle] = el.checked; render(); }
  }

  function onKey(ev) {
    const t = ev.target;
    if (t.matches && t.matches('[data-note-input]') && ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
      ev.preventDefault();
      if (C.addNote(t.dataset.noteInput, t.value)) { render(); UI.toast('Note saved'); }
    }
  }

  /* ---------- Global actions ---------- */
  const globalActions = {
    'copy-hex': el => UI.copy(el.dataset.hex),
    'theme': () => {
      const s = Store.state;
      s.theme = s.theme === 'light' ? 'dark' : 'light';
      applyTheme(); Store.save();
    },
    'quick-note': () => {
      const tab = route.tab;
      UI.modal({
        title: `Quick note → ${Views[tab].label}`,
        body: `<textarea name="qn" rows="5" placeholder="What do you need to remember?"></textarea>
               <div class="seg qn-tabs">${TAB_ORDER.map(t => `<button data-t="${t}" class="${t === tab ? 'on' : ''}">${Views[t].icon} ${Views[t].label}</button>`).join('')}</div>`,
        actions: [{ label: 'Cancel' }, { label: 'Save note', kind: 'primary', onClick: (c, el) => {
          const target = el.querySelector('.qn-tabs .on').dataset.t;
          if (!C.addNote(target, el.querySelector('[name=qn]').value)) return false;
          render(); UI.toast(`Saved to ${Views[target].label} notes`);
        } }],
        onMount: el => {
          el.querySelector('[name=qn]').focus();
          el.querySelector('.qn-tabs').addEventListener('click', ev => {
            const b = ev.target.closest('button'); if (!b) return;
            el.querySelectorAll('.qn-tabs button').forEach(x => x.classList.toggle('on', x === b));
          });
          el.querySelector('[name=qn]').addEventListener('keydown', ev => {
            if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) el.querySelector('footer .primary').click();
          });
        }
      });
    },
    'projects': () => openProjects(),
    'project-export': () => exportProject(Store.project())
  };

  function exportProject(p) {
    UI.download(`${UI.slug(p.name)}.reelbook.json`, JSON.stringify(p, null, 1));
  }

  function openProjects() {
    const s = Store.state;
    const list = Object.values(s.projects).sort((a, b) => b.created - a.created);
    const m = UI.modal({
      title: 'Projects', wide: true,
      body: `<div class="list projects">${list.map(p => `
        <div class="list-row ${p.id === s.currentId ? 'current' : ''}">
          <button class="grow proj-open" data-open="${p.id}">
            <span><b>${esc(p.name)}</b>${p.id === s.currentId ? ' <span class="badge ok">open</span>' : ''}</span>
            <span class="small muted">${[p.meta.client, p.meta.date, `${p.shots.length} shots`, `${p.frames.length} frames`, `${p.takes.length} takes`].filter(Boolean).map(esc).join(' · ')}</span>
          </button>
          <button class="icon-btn" data-rename="${p.id}" title="Rename">✎</button>
          <button class="icon-btn" data-dup="${p.id}" title="Duplicate">⧉</button>
          <button class="icon-btn" data-export="${p.id}" title="Export">⬇</button>
          <button class="icon-btn" data-del="${p.id}" title="Delete">🗑</button>
        </div>`).join('')}</div>
        <div class="row wrap">
          <button class="btn primary" data-new>＋ New project</button>
          <label class="btn file-btn">⬆ Import project file<input type="file" accept=".json,application/json" hidden></label>
        </div>
        <p class="small muted">Everything is saved on this device only (in your browser). Export projects to back them up or move them to another device.</p>`,
      onMount: (el, close) => {
        el.addEventListener('click', async ev => {
          const b = ev.target.closest('button'); if (!b) return;
          if (b.dataset.open) { s.currentId = b.dataset.open; Store.saveNow(); close(); render(); }
          else if (b.dataset.rename) {
            const name = await UI.prompt('Rename project', s.projects[b.dataset.rename].name);
            if (name) { s.projects[b.dataset.rename].name = name; Store.saveNow(); close(); render(); openProjects(); }
          } else if (b.dataset.dup) { Store.duplicateProject(b.dataset.dup); close(); openProjects(); }
          else if (b.dataset.export) exportProject(s.projects[b.dataset.export]);
          else if (b.dataset.del) {
            if (await UI.confirm(`Delete “${s.projects[b.dataset.del].name}” and everything in it? This cannot be undone.`)) {
              Store.deleteProject(b.dataset.del); close(); render(); openProjects();
            }
          } else if (b.hasAttribute('data-new')) {
            const name = await UI.prompt('New project', '', 'Project name');
            if (name !== null) { Store.createProject(name || 'Untitled Project'); close(); go('prep', 'overview'); render(); }
          }
        });
        el.querySelector('input[type=file]').addEventListener('change', ev => {
          const file = ev.target.files[0]; if (!file) return;
          const r = new FileReader();
          r.onload = () => {
            try { const p = Store.importProject(JSON.parse(r.result)); close(); render(); UI.toast(`Imported “${p.name}”`); }
            catch (e) { UI.toast('That file is not a Reelbook project', 'error'); }
          };
          r.readAsText(file);
        });
      }
    });
    return m;
  }

  function applyTheme() {
    document.documentElement.dataset.theme = Store.state.theme === 'light' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name=theme-color]');
    if (meta) meta.content = Store.state.theme === 'light' ? '#f4f1ea' : '#0e0f12';
    Native.statusBar(Store.state.theme !== 'light');
  }

  /* Android hardware back: close a sheet, leave full-screen slate, go back a section, or leave the app. */
  function onBack() {
    const modals = document.querySelectorAll('.modal-backdrop');
    if (modals.length) { const x = modals[modals.length - 1].querySelector('[data-close]'); if (x) x.click(); return; }
    if (Views.roll.ui.full) { Views.roll.ui.full = false; Native.hideStatusBar(false); render(); return; }
    if (history.length > 1 && location.hash && location.hash !== '#prep/overview') { history.back(); return; }
    Native.minimize();
  }

  async function init() {
    await Store.load();
    applyTheme();
    actions = { ...globalActions, ...C.noteActions };
    TAB_ORDER.forEach(t => Views[t].sections.forEach(s => Object.assign(actions, s.actions || {})));
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onRoute);
    if (!location.hash && Store.state.route) history.replaceState(null, '', '#' + Store.state.route);
    Native.onBack(onBack);
    onRoute();
    Native.hideSplash();
    if (!Native.isNative && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return { init, render, go };
})();

document.addEventListener('DOMContentLoaded', App.init);
