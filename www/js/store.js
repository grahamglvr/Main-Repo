/* Reelbook — state & persistence (localStorage, multi-project). */
window.Store = (() => {
  const KEY = 'reelbook.v1';
  let state = null;
  let saveTimer = null;

  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  function defaultGear() {
    const out = [];
    Object.entries(RB.gearDefaults).forEach(([cat, items]) =>
      items.forEach(text => out.push({ id: uid(), cat, text, packed: false })));
    return out;
  }

  function newProject(name) {
    return {
      id: uid(),
      name: name || 'Untitled Project',
      created: Date.now(),
      meta: { client: '', date: '', director: '', dop: '', location: '', logline: '', aspect: '16:9', fps: '24', resolution: '4K UHD', lat: '', lng: '' },
      prepChecklist: {},
      shots: [],
      frames: [],
      palettes: [],
      gear: defaultGear(),
      crew: [],
      locations: [],
      takes: [],
      slate: { roll: 'A001', scene: '1', shot: 'A', take: 1, intExt: 'INT', dayNight: 'DAY' },
      media: [],
      wrapChecklist: {},
      post: {},
      postNotes: {},
      gradeNotes: '',
      editNotes: '',
      deliverables: [],
      notes: { prep: [], roll: [], wrap: [] }
    };
  }

  /* Fill in any keys added in later versions so old saves keep working. */
  function upgrade(p) {
    const base = newProject(p.name);
    const out = Object.assign(base, p);
    out.meta = Object.assign(base.meta, p.meta || {});
    out.slate = Object.assign(newProject().slate, p.slate || {});
    out.notes = Object.assign({ prep: [], roll: [], wrap: [] }, p.notes || {});
    return out;
  }

  async function load() {
    let raw = null;
    if (Native.isNative) raw = await Native.readData();
    if (!raw) { try { raw = localStorage.getItem(KEY); } catch { /* storage blocked */ } }
    try {
      if (raw) {
        const s = JSON.parse(raw);
        Object.keys(s.projects || {}).forEach(id => { s.projects[id] = upgrade(s.projects[id]); });
        state = s;
      }
    } catch (e) { console.warn('Reelbook: could not load saved data', e); }
    if (!state || !state.projects || !Object.keys(state.projects).length) {
      const p = newProject('My First Shoot');
      state = { projects: { [p.id]: p }, currentId: p.id, theme: 'dark', route: 'prep/overview' };
    }
    if (!state.projects[state.currentId]) state.currentId = Object.keys(state.projects)[0];
    return state;
  }

  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    const json = JSON.stringify(state);
    if (Native.isNative) Native.writeData(json).then(ok => { if (!ok) UI.toast('Could not save. Is the device storage full?', 'error'); });
    try {
      localStorage.setItem(KEY, json);
    } catch (e) {
      // In the app the file above is the source of truth; on the web localStorage is all we have.
      if (!Native.isNative) { UI.toast('Storage full! Delete some storyboard sketches or export your project.', 'error'); return false; }
    }
    return true;
  }

  const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 250); };

  const project = () => state.projects[state.currentId];

  function createProject(name) {
    const p = newProject(name);
    state.projects[p.id] = p;
    state.currentId = p.id;
    saveNow();
    return p;
  }

  function duplicateProject(id) {
    const copy = JSON.parse(JSON.stringify(state.projects[id]));
    copy.id = uid();
    copy.name += ' (copy)';
    copy.created = Date.now();
    state.projects[copy.id] = copy;
    saveNow();
    return copy;
  }

  function deleteProject(id) {
    delete state.projects[id];
    if (!Object.keys(state.projects).length) createProject('Untitled Project');
    if (!state.projects[state.currentId]) state.currentId = Object.keys(state.projects)[0];
    saveNow();
  }

  function importProject(obj) {
    if (!obj || typeof obj !== 'object' || !obj.meta) throw new Error('Not a Reelbook project file');
    const p = upgrade(obj);
    p.id = uid();
    state.projects[p.id] = p;
    state.currentId = p.id;
    saveNow();
    return p;
  }

  const flush = () => { if (saveTimer) saveNow(); };
  window.addEventListener('beforeunload', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  Native.onPause(flush);

  return { load, save, saveNow, project, createProject, duplicateProject, deleteProject, importProject, uid, get state() { return state; } };
})();
