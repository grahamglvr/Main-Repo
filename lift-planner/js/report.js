/* Builds the lift plan report, laid out like the LOLER lift plan sections.
 * Used for Print / Save as PDF and for the shareable report file. */
(function (root) {
  'use strict';

  const M = root.LiftModel;

  const esc = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const nl = (v) => esc(v).replace(/\n/g, '<br>');
  const val = (v) => (v == null || v === '' ? '<span class="r-empty">–</span>' : nl(v));

  function row(label, value) {
    return `<tr><th>${esc(label)}</th><td>${val(value)}</td></tr>`;
  }

  function photoGrid(ids, photos) {
    const list = (ids || []).map((id) => photos[id]).filter(Boolean);
    if (!list.length) return '';
    return `<div class="r-photos">${list.map((p) => `
      <figure><img src="${p.src}" alt=""><figcaption>${esc(p.caption)}</figcaption></figure>`).join('')}</div>`;
  }

  function dims(l) {
    const parts = [l.length, l.width, l.height].map((v) => (v == null || v === '' ? '?' : v));
    return parts.every((p) => p === '?') ? '' : `${parts.join(' × ')} mm (L × W × H)`;
  }

  /* job: the job; photos: { [photoId]: { src, caption } } */
  function body(job, photos) {
    const d = job.details;
    const l = job.load;
    const total = M.totalLoadKg(job);
    const checks = M.checks(job);
    let stepNo = 0;
    const steps = job.steps.map((s) => {
      if (s.type === 'stage') { stepNo = 0; return `<tr class="r-stage"><td colspan="3">${esc(s.text)}</td></tr>`; }
      stepNo++;
      return `<tr><td class="r-no">${stepNo}</td><td>${nl(s.text)}</td><td class="r-who">${esc(s.who)}</td></tr>`;
    }).join('');

    const hazards = M.HAZARDS.map((h) => {
      const a = job.hazards[h.id] || {};
      if (!a.applicable) return '';
      return `<tr><td>${esc(h.label)}</td><td>${a.applicable === 'yes' ? 'Yes' : 'No'}</td>
        <td>${a.applicable === 'yes' ? (a.eliminated === 'yes' ? 'Yes' : a.eliminated === 'no' ? 'No' : '–') : ''}</td>
        <td>${nl(a.note)}</td></tr>`;
    }).join('');

    return `
    <article class="r-doc">
      <header class="r-head">
        <div>
          <div class="r-kicker">Lift plan (draft)</div>
          <h1>${esc(d.name || 'Untitled lift')}</h1>
        </div>
        <div class="r-ref">${esc(d.liftPlanNo)}<br>${esc(d.revision)}</div>
      </header>

      <h2>1.0 Details</h2>
      <table class="r-kv">
        ${row('Location', d.location)}${row('Area', d.area)}
        ${row('Lift plan no.', d.liftPlanNo)}${row('Work order', d.workOrder)}
        ${row('Permit no.', d.permitNo)}${row('Risk assessment no.', d.raNo)}
        ${row('Author', d.author)}${row('Date / revision', [d.date, d.revision].filter(Boolean).join(' – '))}
      </table>

      <h2>2.0 Lifting operation description</h2>
      <p>${val(d.description)}</p>
      <table class="r-kv">
        ${row('Category of lift', d.category)}
        ${row('Communication', (d.comms || []).join(', '))}
        ${row('Personnel', d.personnel)}
        ${row('Colour code', d.colourCode)}
      </table>

      <h2>3.0 Load and weight</h2>
      <table class="r-kv">
        ${row('Equipment / tag no.', l.tag)}${row('Type', l.type)}
        ${row('Description', l.description)}
        ${row('Weight of load', l.weightKg ? M.fmtKg(Number(l.weightKg)) : '')}
        ${row('Weight source', [l.weightSource, l.weightVerified === 'yes' ? 'Verified' : l.weightVerified === 'no' ? 'NOT verified' : ''].filter(Boolean).join(' – '))}
        ${row('Rigging weight', l.riggingKg ? M.fmtKg(Number(l.riggingKg)) : '')}
        ${row('Total hook load', total ? M.fmtKg(total) : '')}
        ${row('Dimensions', dims(l))}
        ${row('Centre of gravity', l.cog)}
        ${row('Lifting attachment', l.attachment)}
        ${row('Load notes', [...(l.flags || []).map((f) => (M.LOAD_FLAGS.find((x) => x.id === f) || {}).label).filter(Boolean), l.notes].filter(Boolean).join('\n'))}
      </table>
      ${photoGrid(l.photos, photos)}

      ${checks.length ? `<div class="r-checks">${checks.map((c) => `<div class="r-${c.level}">${c.level === 'danger' ? '✖' : '!'} ${esc(c.text)}</div>`).join('')}</div>` : ''}

      <h2>Lifting points</h2>
      ${job.liftingPoints.length ? job.liftingPoints.map((lp) => `
        <section class="r-lp">
          <h3>${esc(lp.name)} <small>${lp.role === 'load' ? 'Attachment on load' : 'Suspension point'}${lp.type ? ' – ' + esc(lp.type) : ''}</small></h3>
          <table class="r-kv">
            ${lp.role === 'suspension' ? row('SWL', lp.swlKg ? M.fmtKg(Number(lp.swlKg)) : '') : ''}
            ${row('Cert / ID no.', lp.certNo)}${row('Location', lp.location)}
            ${row('Rigging at this point', lp.rigging)}${row('Notes', lp.notes)}
          </table>
          ${photoGrid(lp.photos, photos)}
        </section>`).join('') : '<p class="r-empty">No lifting points added.</p>'}

      <h2>Task details step by step</h2>
      ${job.steps.length ? `<table class="r-steps"><thead><tr><th>No</th><th>Step</th><th>Responsibility</th></tr></thead><tbody>${steps}</tbody></table>` : '<p class="r-empty">No steps added.</p>'}

      <h2>6.0 Lifting equipment and accessories</h2>
      ${job.rigging.length ? `<ul class="r-list">${job.rigging.map((r) => `<li>${esc(M.riggingLine(r))}</li>`).join('')}</ul>` : '<p class="r-empty">No equipment added.</p>'}

      ${job.calcs.length ? `<h2>Calculations</h2>${job.calcs.map((c) => `
        <div class="r-calc"><strong>${esc(c.title)}</strong><br>${nl(c.summary)}</div>`).join('')}` : ''}

      ${job.photos.length ? `<h2>7.0 Lift drawings, sketches and photos</h2>${photoGrid(job.photos, photos)}` : ''}

      <h2>9.0 Non-generic hazards</h2>
      ${hazards ? `<table class="r-steps"><thead><tr><th>Hazard</th><th>Applies</th><th>Eliminated by method</th><th>Notes / controls</th></tr></thead><tbody>${hazards}</tbody></table>` : '<p class="r-empty">Hazard checklist not completed.</p>'}

      <h2>Risk assessment notes</h2>
      <table class="r-kv">
        ${row('Notes', job.risk.notes)}${row('Extra controls', job.risk.controls)}${row('Toolbox talk notes', job.risk.tbt)}
      </table>

      <footer class="r-foot">Prepared with Lift Planner on ${esc(new Date().toLocaleString('en-GB'))}. Draft for the competent person to transfer to and approve on the site LOLER lift plan form.</footer>
    </article>`;
  }

  const CSS = `
    .r-doc{-webkit-print-color-adjust:exact;print-color-adjust:exact;font:14px/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;background:#fff;max-width:900px;margin:0 auto;padding:16px}
    .r-head{display:flex;justify-content:space-between;gap:12px;border-bottom:3px solid #111;padding-bottom:8px;margin-bottom:8px}
    .r-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#555}
    .r-doc h1{font-size:22px;margin:2px 0}
    .r-ref{text-align:right;font-weight:600}
    .r-doc h2{font-size:15px;background:#111;color:#fff;padding:4px 8px;margin:18px 0 8px;break-after:avoid}
    .r-doc h3{font-size:14px;margin:10px 0 4px}
    .r-doc h3 small{font-weight:400;color:#555}
    .r-kv,.r-steps{width:100%;border-collapse:collapse}
    .r-kv th,.r-kv td,.r-steps td,.r-steps th{border:1px solid #bbb;padding:4px 6px;vertical-align:top;text-align:left}
    .r-kv th{width:32%;background:#f2f2f2;font-weight:600}
    .r-steps thead th{background:#f2f2f2}
    .r-steps tr{break-inside:avoid}
    .r-stage td{background:#e8e8e8;font-weight:700}
    .r-no{width:34px;text-align:center}
    .r-who{width:22%}
    .r-empty{color:#888}
    .r-photos{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:8px 0}
    .r-photos figure{margin:0;break-inside:avoid}
    .r-photos img{width:100%;border:1px solid #bbb;display:block}
    .r-photos figcaption{font-size:12px;color:#333}
    .r-list{margin:0;padding-left:20px}
    .r-calc{border:1px solid #bbb;padding:6px 8px;margin-bottom:6px;break-inside:avoid}
    .r-checks{margin:8px 0}
    .r-checks div{padding:4px 8px;margin-bottom:4px;border-left:4px solid}
    .r-danger{border-color:#c00;background:#fde8e8}
    .r-caution{border-color:#d90;background:#fff4d6}
    .r-lp{break-inside:avoid}
    .r-foot{margin-top:20px;font-size:11px;color:#666;border-top:1px solid #bbb;padding-top:6px}`;

  function standalone(job, photos) {
    const title = [job.details.liftPlanNo, job.details.name].filter(Boolean).join(' – ') || 'Lift plan';
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{margin:0;background:#fff}${CSS}@media print{.r-doc{padding:0}}</style></head>
<body>${body(job, photos)}</body></html>`;
  }

  root.LiftReport = { body, standalone, CSS, esc };
})(self);
