/* On-phone storage in IndexedDB. Data survives locking the phone, closing the
 * browser and restarting. Loaded by the page and by the service worker. */
(function (root) {
  'use strict';

  const DB_NAME = 'lift-planner';
  const DB_VERSION = 1;
  let dbPromise = null;

  function open() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('jobs')) db.createObjectStore('jobs', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('photos')) {
            db.createObjectStore('photos', { keyPath: 'id' }).createIndex('jobId', 'jobId');
          }
          if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return dbPromise;
  }

  // Run one request in its own transaction; resolves once the data is written.
  async function run(store, mode, fn) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction(store, mode);
      const req = fn(t.objectStore(store));
      t.oncomplete = () => resolve(req ? req.result : undefined);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Save aborted'));
    });
  }

  const LiftDB = {
    allJobs: () => run('jobs', 'readonly', (s) => s.getAll()),
    getJob: (id) => run('jobs', 'readonly', (s) => s.get(id)),
    putJob: (job) => run('jobs', 'readwrite', (s) => s.put(job)),
    async deleteJob(id) {
      const photos = await LiftDB.jobPhotos(id);
      for (const p of photos) await LiftDB.deletePhoto(p.id);
      return run('jobs', 'readwrite', (s) => s.delete(id));
    },

    getPhoto: (id) => run('photos', 'readonly', (s) => s.get(id)),
    putPhoto: (photo) => run('photos', 'readwrite', (s) => s.put(photo)),
    deletePhoto: (id) => run('photos', 'readwrite', (s) => s.delete(id)),
    jobPhotos: (jobId) => run('photos', 'readonly', (s) => s.index('jobId').getAll(jobId)),

    kvGet: (key) => run('kv', 'readonly', (s) => s.get(key)),
    kvSet: (key, value) => run('kv', 'readwrite', (s) => s.put(value, key)),
  };

  root.LiftDB = LiftDB;
})(self);
