/* Reelbook — sun position times (after the SunCalc / NOAA approximations). */
window.Sun = (() => {
  const rad = Math.PI / 180, dayMs = 86400000, J1970 = 2440588, J2000 = 2451545, e = rad * 23.4397, J0 = 0.0009;
  const toDays = d => d.valueOf() / dayMs - 0.5 + J1970 - J2000;
  const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
  const declination = l => Math.asin(Math.sin(e) * Math.sin(l));
  const meanAnomaly = d => rad * (357.5291 + 0.98560028 * d);
  const eclipticLng = M => M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
  const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const transitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

  /* Returns {noon, [angle]: {rise, set}} for each requested sun elevation (degrees). */
  function times(date, lat, lng, angles) {
    const lw = rad * -lng, phi = rad * lat;
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = meanAnomaly(ds);
    const L = eclipticLng(M);
    const dec = declination(L);
    const Jnoon = transitJ(ds, M, L);
    const out = { noon: fromJulian(Jnoon) };
    angles.forEach(a => {
      const w = hourAngle(a * rad, phi, dec);
      if (isNaN(w)) { out[a] = { rise: null, set: null }; return; }
      const Jset = transitJ(approxTransit(w, lw, n), M, L);
      out[a] = { rise: fromJulian(Jnoon - (Jset - Jnoon)), set: fromJulian(Jset) };
    });
    return out;
  }

  /* Filmmaker-friendly summary for a given day. */
  function day(date, lat, lng) {
    const noonLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    const t = times(noonLocal, lat, lng, [-6, -4, -0.833, 6]);
    return {
      noon: t.noon,
      civilDawn: t[-6].rise, blueEndAM: t[-4].rise, sunrise: t[-0.833].rise, goldenEndAM: t[6].rise,
      goldenStartPM: t[6].set, sunset: t[-0.833].set, bluePM: t[-4].set, civilDusk: t[-6].set
    };
  }

  return { times, day };
})();
