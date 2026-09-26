/* Reelbook — WRAP tab (post-production). */
(() => {
  const { esc } = UI;
  const ui = {};

  /* ================= BACKUP ================= */
  const mediaFields = [
    { key: 'card', label: 'Card / roll', placeholder: 'A001' },
    { key: 'size', label: 'Size (GB)', type: 'number' },
    { key: 'content', label: 'Content', placeholder: 'Scene 1–3, interview', full: true },
    { key: 'notes', label: 'Notes', full: true }
  ];
  const COPIES = [['a', 'Drive A'], ['b', 'Drive B'], ['cloud', 'Cloud'], ['verified', 'Verified']];

  const backup = {
    id: 'backup', label: 'Wrap & Backup', icon: '💾',
    render(p) {
      const all = RB.wrapChecklist.flatMap((g, gi) => g.items.map((_, ii) => `g${gi}i${ii}`));
      const done = all.filter(k => p.wrapChecklist[k]).length;
      const totalGB = p.media.reduce((a, m) => a + (+m.size || 0), 0);
      return `
        ${UI.progress(done, all.length)}
        <div class="grid two">
          ${RB.wrapChecklist.map((g, gi) => `
            <section class="card">
              <h2>${gi === 0 ? '🎬' : '🛡️'} ${esc(g.group)}</h2>
              <div class="checklist">${g.items.map((t, ii) => `<label class="check"><input type="checkbox" data-bind="wrapChecklist.g${gi}i${ii}" data-rerender ${p.wrapChecklist[`g${gi}i${ii}`] ? 'checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div>
            </section>`).join('')}
        </div>
        <section class="card">
          <div class="card-head"><h2>🗂 Media log</h2><button class="btn primary sm" data-action="media-add">＋ Add card</button></div>
          ${p.media.length ? `<div class="table-wrap"><table class="table">
            <thead><tr><th>Card</th><th>Content</th><th>GB</th>${COPIES.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead>
            <tbody>${p.media.map((m, i) => `
              <tr class="${COPIES.every(c => m[c[0]]) ? 'row-ok' : ''}">
                <td><b>${esc(m.card)}</b></td><td>${esc(m.content)}${m.notes ? `<br><small class="muted">${esc(m.notes)}</small>` : ''}</td><td>${esc(m.size)}</td>
                ${COPIES.map(c => `<td class="center"><input type="checkbox" data-bind="media.${i}.${c[0]}" data-rerender ${m[c[0]] ? 'checked' : ''} aria-label="${c[1]}"></td>`).join('')}
                <td class="nowrap"><button class="icon-btn" data-action="media-edit" data-id="${m.id}">✎</button><button class="icon-btn" data-action="media-del" data-id="${m.id}">🗑</button></td>
              </tr>`).join('')}</tbody>
            <tfoot><tr><td colspan="2">Total</td><td>${totalGB.toFixed(0)}</td><td colspan="${COPIES.length + 1}" class="small muted">Only format a card when every box on its row is ticked.</td></tr></tfoot>
          </table></div>` : '<p class="muted small">Log each card as you offload it. Only format a card once it’s in at least two places.</p>'}
        </section>
        <section class="card row wrap">
          <div class="grow"><h2>📦 Project file</h2><p class="small muted">Download everything in this project (shots, storyboards, notes, logs) as a file you can archive or open on another device.</p></div>
          <button class="btn" data-action="project-export">⬇ Export project</button>
        </section>
        ${C.notesSection('wrap', p, { compact: true })}`;
    },
    actions: {
      'media-add': async () => {
        const p = Store.project();
        const v = await UI.formModal('Add card / media', mediaFields, { card: p.slate.roll }, { okLabel: 'Add' });
        if (v) { p.media.push({ id: Store.uid(), ...v }); Store.save(); App.render(); }
      },
      'media-edit': async el => {
        const m = Store.project().media.find(x => x.id === el.dataset.id);
        const v = await UI.formModal('Edit media', mediaFields, m);
        if (v) { Object.assign(m, v); Store.save(); App.render(); }
      },
      'media-del': async el => {
        if (!(await UI.confirm('Remove this media entry?'))) return;
        const p = Store.project(); p.media = p.media.filter(x => x.id !== el.dataset.id); Store.save(); App.render();
      }
    }
  };

  /* ================= SELECTS ================= */
  const selects = {
    id: 'selects', label: 'Selects', icon: '⭐',
    render(p) {
      const good = p.takes.filter(t => t.rating === 'good');
      const groups = {};
      good.forEach(t => { const k = `${t.scene}${t.shot}`; (groups[k] = groups[k] || []).push(t); });
      const missing = p.shots.filter(s => !p.takes.some(t => t.rating === 'good' && String(t.scene) === String(s.scene) && String(t.shot) === String(s.num)));
      return `
        <div class="grid two">
          <section class="card">
            <h2>⭐ Circled takes <span class="muted small">${good.length}</span></h2>
            ${good.length ? Object.entries(groups).map(([k, list]) => `
              <div class="select-group">
                <h3>${esc(k)}</h3>
                ${list.map(t => `<div class="select-row"><span class="badge ok">T${esc(t.take)}</span>${t.clip ? `<span class="badge soft">${esc(t.clip)}</span>` : ''}<span class="small">${esc(t.notes || '')}</span></div>`).join('')}
              </div>`).join('') : '<p class="muted small">Rate takes as “Good” on the Slate or in the Take Log and they’ll collect here for your edit.</p>'}
          </section>
          <section class="card">
            <h2>⚠️ Coverage check</h2>
            ${p.shots.length ? (missing.length ? `<p class="small muted">Planned shots with no “Good” take logged:</p>
              <div class="list">${missing.map(s => `<div class="list-row"><b>${esc(C.shotLabel(s))}</b><span class="grow small">${esc(s.desc || '')}</span>${s.done ? '<span class="badge soft">marked done</span>' : '<span class="badge warn">not shot?</span>'}</div>`).join('')}</div>`
              : '<p class="ok-text">Every planned shot has a circled take. 🎉</p>') : '<p class="muted small">No shot list to check against.</p>'}
          </section>
        </div>
        <section class="card">
          <h2>✂️ Notes for the editor</h2>
          <textarea data-bind="editNotes" rows="6" placeholder="Story beats, favourite moments, music ideas, things to avoid, client must-haves…">${esc(p.editNotes || '')}</textarea>
        </section>`;
    }
  };

  /* ================= POST PIPELINE ================= */
  const post = {
    id: 'post', label: 'Post Pipeline', icon: '🛠️',
    render(p) {
      const done = RB.postPipeline.filter(s => p.post[s.id]).length;
      return `
        ${UI.progress(done, RB.postPipeline.length)}
        <div class="pipeline">
          ${RB.postPipeline.map((s, i) => `
            <div class="stage ${p.post[s.id] ? 'done' : ''}">
              <label class="stage-check"><input type="checkbox" data-bind="post.${s.id}" data-rerender ${p.post[s.id] ? 'checked' : ''}><span class="stage-no">${i + 1}</span></label>
              <div class="grow">
                <b>${esc(s.name)}</b>
                <p class="small muted">${esc(s.desc)}</p>
                <input class="stage-note" data-bind="postNotes.${s.id}" value="${esc(p.postNotes[s.id] || '')}" placeholder="Notes / due date / who…">
              </div>
            </div>`).join('')}
        </div>`;
    }
  };

  /* ================= GRADE ================= */
  const grade = {
    id: 'grade', label: 'Colour Grade', icon: '🎨',
    render(p) {
      return `
        <div class="grid two">
          <section class="card">
            <div class="card-head"><h2>🎨 Palette reference</h2><a class="link" href="#prep-colour">Edit in Prep →</a></div>
            ${p.palettes.length ? p.palettes.map(pal => `<div class="grade-pal"><b>${esc(pal.name)}</b>${C.swatchRow(pal.colors)}${pal.mood ? `<p class="small muted">${esc(pal.mood)}</p>` : ''}</div>`).join('')
              : '<p class="muted small">No palettes yet. Build one in Prep → Colour to guide the grade.</p>'}
          </section>
          <section class="card">
            <h2>🪜 Grading order</h2>
            <ol class="steps">
              <li><b>Technical transform:</b> log → Rec.709 (CST or the camera’s LUT).</li>
              <li><b>Balance:</b> exposure, contrast, white balance, one shot at a time.</li>
              <li><b>Match:</b> make shots in each scene look consistent.</li>
              <li><b>Look:</b> creative grade toward your palette (film looks, split-toning).</li>
              <li><b>Secondaries:</b> skin tones, skies, power windows, vignettes.</li>
              <li><b>Output:</b> check on a second screen and a phone, watch for clipping, then export.</li>
            </ol>
          </section>
        </div>
        <section class="card">
          <h2>📝 Grade notes & LUTs</h2>
          <textarea data-bind="gradeNotes" rows="6" placeholder="Look intent per scene, LUTs used, reference stills, client feedback…">${esc(p.gradeNotes || '')}</textarea>
        </section>`;
    }
  };

  /* ================= DELIVER ================= */
  const delivFields = [
    { key: 'name', label: 'Deliverable', placeholder: '16:9 master', full: true },
    { key: 'spec', label: 'Spec', placeholder: '3840×2160 H.264 −14 LUFS' },
    { key: 'due', label: 'Due', type: 'date' }
  ];

  const deliver = {
    id: 'deliver', label: 'Deliver', icon: '🚀',
    render(p) {
      const done = p.deliverables.filter(d => d.done).length;
      return `
        <section class="card">
          <div class="card-head"><h2>📬 Deliverables</h2><button class="btn primary sm" data-action="deliv-add">＋ Add</button></div>
          ${p.deliverables.length ? UI.progress(done, p.deliverables.length) + `<div class="list">${p.deliverables.map((d, i) => `
            <div class="list-row ${d.done ? 'done' : ''}">
              <label class="check grow"><input type="checkbox" data-bind="deliverables.${i}.done" data-rerender ${d.done ? 'checked' : ''}><span><b>${esc(d.name)}</b> ${d.spec ? `<span class="small muted">${esc(d.spec)}</span>` : ''}</span></label>
              ${d.due ? `<span class="badge soft">Due ${esc(new Date(d.due + 'T12:00').toLocaleDateString())}</span>` : ''}
              <button class="icon-btn" data-action="deliv-edit" data-id="${d.id}">✎</button>
              <button class="icon-btn" data-action="deliv-del" data-id="${d.id}">🗑</button>
            </div>`).join('')}</div>`
          : `<p class="muted small">List every version the client needs: masters, cut-downs, vertical edits, subtitles, stills.</p>
             <button class="btn" data-action="deliv-starter">Add a typical set</button>`}
        </section>
        <h3 class="group-title">📐 Typical delivery specs</h3>
        <div class="spec-grid">
          ${RB.deliverySpecs.map(s => `
            <article class="card spec">
              <div class="spec-head"><b>${esc(s.name)}</b><span class="badge">${esc(s.aspect)}</span></div>
              <dl><dt>Resolution</dt><dd>${esc(s.res)}</dd><dt>Codec</dt><dd>${esc(s.codec)}</dd><dt>Frame rate</dt><dd>${esc(s.fps)}</dd></dl>
              <p class="small muted">${esc(s.extra)}</p>
            </article>`).join('')}
        </div>
        <p class="small muted">Platforms change their specs often. Treat these as starting points and check the latest guidelines before final export.</p>`;
    },
    actions: {
      'deliv-add': async () => {
        const v = await UI.formModal('Add deliverable', delivFields, {}, { okLabel: 'Add' });
        if (v && v.name) { Store.project().deliverables.push({ id: Store.uid(), ...v, done: false }); Store.save(); App.render(); }
      },
      'deliv-edit': async el => {
        const d = Store.project().deliverables.find(x => x.id === el.dataset.id);
        const v = await UI.formModal('Edit deliverable', delivFields, d);
        if (v) { Object.assign(d, v); Store.save(); App.render(); }
      },
      'deliv-del': el => { const p = Store.project(); p.deliverables = p.deliverables.filter(x => x.id !== el.dataset.id); Store.save(); App.render(); },
      'deliv-starter': () => {
        const p = Store.project();
        [['Master (16:9)', 'ProRes 422 HQ, native res'], ['Web version (16:9)', 'H.264 MP4, −14 LUFS'], ['Vertical cut-down (9:16)', '1080×1920, 15–60s'],
          ['Captions', 'SRT file + burned-in version'], ['Stills / thumbnails', 'JPG frame grabs']].forEach(([name, spec]) =>
          p.deliverables.push({ id: Store.uid(), name, spec, due: '', done: false }));
        Store.save(); App.render();
      }
    }
  };

  const notes = { id: 'notes', label: 'Notes', icon: '📝', render: p => C.notesSection('wrap', p) };

  Views.wrap = {
    label: 'Wrap', sub: 'Post-production', icon: '🎞️',
    sections: [backup, selects, post, grade, deliver, notes],
    ui
  };
})();
