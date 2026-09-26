/* Reelbook — native bridge. Uses Capacitor's built-in bridge when running as an
   iOS / Android app, and falls back to browser behaviour on the web. */
window.Native = (() => {
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const platform = isNative ? cap.getPlatform() : 'web';
  const has = name => isNative && cap.isPluginAvailable ? cap.isPluginAvailable(name) || !!(cap.PluginHeaders || []).find(h => h.name === name) : false;
  const call = (plugin, method, opts = {}) => has(plugin) ? cap.nativePromise(plugin, method, opts) : Promise.reject(new Error(`${plugin} unavailable`));
  const quiet = p => p.catch(() => {});

  const DATA_FILE = 'reelbook-data.json';

  /* ---------- Persistent storage (app sandbox file, safer than WebView localStorage) ---------- */
  async function readData() {
    if (!has('Filesystem')) return null;
    try {
      const r = await call('Filesystem', 'readFile', { path: DATA_FILE, directory: 'DATA', encoding: 'utf8' });
      return r && r.data ? r.data : null;
    } catch { return null; }
  }

  let writing = Promise.resolve();
  function writeData(json) {
    if (!has('Filesystem')) return Promise.resolve(false);
    // Serialise writes so an older snapshot never lands after a newer one.
    writing = writing.then(() => call('Filesystem', 'writeFile', { path: DATA_FILE, data: json, directory: 'DATA', encoding: 'utf8', recursive: true }))
      .then(() => true, e => { console.warn('Reelbook: native save failed', e); return false; });
    return writing;
  }

  /* ---------- Share / export a file ---------- */
  async function shareFile(filename, text, title) {
    const w = await call('Filesystem', 'writeFile', { path: filename, data: text, directory: 'CACHE', encoding: 'utf8', recursive: true });
    await call('Share', 'share', { title: title || filename, files: [w.uri], dialogTitle: title || 'Share' });
  }

  /* ---------- Feedback ---------- */
  const haptic = (style = 'MEDIUM') => { if (has('Haptics')) quiet(call('Haptics', 'impact', { style })); else if (navigator.vibrate) navigator.vibrate(style === 'HEAVY' ? 60 : 25); };
  const hapticSuccess = () => { if (has('Haptics')) quiet(call('Haptics', 'notification', { type: 'SUCCESS' })); };

  /* ---------- Screen ---------- */
  let awake = false;
  function keepAwake(on) {
    if (on === awake || !has('KeepAwake')) return;
    awake = on;
    quiet(call('KeepAwake', on ? 'keepAwake' : 'allowSleep'));
  }
  const statusBar = dark => {
    if (!has('StatusBar')) return;
    quiet(call('StatusBar', 'setStyle', { style: dark ? 'DARK' : 'LIGHT' }));
  };
  const hideStatusBar = hide => { if (has('StatusBar')) quiet(call('StatusBar', hide ? 'hide' : 'show')); };
  const hideSplash = () => { if (has('SplashScreen')) quiet(call('SplashScreen', 'hide', { fadeOutDuration: 200 })); };

  /* ---------- Location ---------- */
  async function locate() {
    if (has('Geolocation')) {
      try { await call('Geolocation', 'requestPermissions', { permissions: ['location'] }); } catch { /* iOS asks on first use */ }
      const pos = await call('Geolocation', 'getCurrentPosition', { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
      return pos.coords;
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('unavailable'));
      navigator.geolocation.getCurrentPosition(p => resolve(p.coords), reject, { timeout: 10000 });
    });
  }

  /* ---------- App lifecycle ---------- */
  function onBack(handler) {
    if (!has('App')) return;
    cap.addListener('App', 'backButton', handler);
  }
  function onPause(handler) {
    if (!has('App')) return;
    cap.addListener('App', 'pause', handler);
    cap.addListener('App', 'appStateChange', s => { if (s && s.isActive === false) handler(); });
  }
  const minimize = () => quiet(call('App', 'minimizeApp'));

  if (isNative) document.documentElement.classList.add('native', `platform-${platform}`);

  return { isNative, platform, readData, writeData, shareFile, haptic, hapticSuccess, keepAwake, statusBar, hideStatusBar, hideSplash, locate, onBack, onPause, minimize };
})();
