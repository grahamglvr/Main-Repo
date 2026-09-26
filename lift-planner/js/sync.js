/* Sends jobs that changed since their last upload to the sync address set in
 * Settings. Runs when the phone gets a connection back: from the page, and from
 * the service worker's background sync (Android Chrome) even if the app is closed. */
(function (root) {
  'use strict';

  const TIMEOUT_MS = 30000;
  let running = null;

  function isDirty(job) {
    return !job.syncedAt || job.updatedAt > job.syncedAt;
  }

  async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  async function buildPayload(job) {
    const photos = await root.LiftDB.jobPhotos(job.id);
    const out = [];
    for (const p of photos) {
      out.push({
        id: p.id,
        caption: p.caption || '',
        createdAt: p.createdAt,
        type: p.blob.type || 'image/jpeg',
        data: await blobToBase64(p.blob),
      });
    }
    return { app: 'lift-planner', format: 1, sentAt: new Date().toISOString(), job, photos: out };
  }

  async function sendJob(job, settings) {
    const payload = await buildPayload(job);
    const headers = { 'Content-Type': 'application/json' };
    if (settings.token) headers.Authorization = 'Bearer ' + settings.token;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(settings.endpoint, {
        method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal,
      });
      if (!res.ok) throw new Error('Server replied ' + res.status);
    } finally {
      clearTimeout(timer);
    }
    // Re-read the job so edits made during the upload are not overwritten.
    // It only counts as synced up to the version that was sent.
    const fresh = await root.LiftDB.getJob(job.id);
    if (fresh) {
      fresh.syncedAt = job.updatedAt;
      await root.LiftDB.putJob(fresh);
    }
  }

  async function syncAll() {
    const settings = (await root.LiftDB.kvGet('settings')) || {};
    if (!settings.endpoint) return { skipped: true, sent: 0, failed: 0 };
    const jobs = (await root.LiftDB.allJobs()).filter(isDirty);
    let sent = 0;
    let failed = 0;
    let error = null;
    for (const job of jobs) {
      try {
        await sendJob(job, settings);
        sent++;
      } catch (e) {
        failed++;
        error = e.name === 'AbortError' ? 'Timed out' : e.message;
      }
    }
    await root.LiftDB.kvSet('lastSync', { at: new Date().toISOString(), sent, failed, error });
    if (failed) {
      // Makes background sync try again later.
      const err = new Error(error);
      err.result = { sent, failed };
      throw err;
    }
    return { sent, failed };
  }

  root.LiftSync = {
    isDirty,
    buildPayload,
    // Only one sync at a time.
    syncAll() {
      if (!running) running = syncAll().finally(() => { running = null; });
      return running;
    },
  };
})(self);
