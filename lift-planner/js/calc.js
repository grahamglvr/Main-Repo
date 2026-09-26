/* Lifting & rigging calculations. Pure functions, no DOM.
 * Units: weights in kg, lengths in any consistent unit (m), angles in degrees.
 * Works in the browser (self.LiftCalc) and in Node (module.exports) for tests. */
(function (root) {
  'use strict';

  const DEG = Math.PI / 180;
  const isNum = (v) => typeof v === 'number' && isFinite(v);

  // Angle checks, measured from vertical (half the included angle).
  function angleWarnings(fromVertical) {
    const w = [];
    if (fromVertical > 60) {
      w.push({ level: 'danger', text: 'Over 60° from vertical (120° included). Do not use this angle.' });
    } else if (fromVertical > 45) {
      w.push({ level: 'caution', text: 'Between 45° and 60° from vertical (90° to 120° included). Use the reduced WLL / mode factor.' });
    }
    return w;
  }

  /* Symmetric sling triangle (two-leg bridle, or one sling between two points).
   *   L = sling leg length (hook / master link to lifting point)
   *   S = spread, the distance between the two lifting points
   *   H = height from the lifting points up to the hook
   *   a = angle of each leg from vertical
   * Give any two of these and the others are worked out. */
  function slingGeometry(input) {
    let { L, S, H, a } = input;
    const given = [L, S, H, a].filter(isNum);
    if (given.length < 2) return { error: 'Enter any two values.' };
    if (given.length > 2) return { error: 'Enter only two values. Clear the others.' };
    if ([L, S, H].some((v) => isNum(v) && v <= 0)) return { error: 'Lengths must be greater than zero.' };
    if (isNum(a) && (a <= 0 || a >= 90)) return { error: 'Angle from vertical must be between 0° and 90°.' };

    if (isNum(L) && isNum(S)) {
      if (S / 2 >= L) return { error: 'The spread is too wide for this sling length. The slings would not reach.' };
      H = Math.sqrt(L * L - (S / 2) * (S / 2));
      a = Math.asin(S / 2 / L) / DEG;
    } else if (isNum(L) && isNum(H)) {
      if (H >= L) return { error: 'The height must be less than the sling length.' };
      S = 2 * Math.sqrt(L * L - H * H);
      a = Math.acos(H / L) / DEG;
    } else if (isNum(S) && isNum(H)) {
      L = Math.hypot(S / 2, H);
      a = Math.atan2(S / 2, H) / DEG;
    } else if (isNum(L) && isNum(a)) {
      S = 2 * L * Math.sin(a * DEG);
      H = L * Math.cos(a * DEG);
    } else if (isNum(S) && isNum(a)) {
      L = S / 2 / Math.sin(a * DEG);
      H = S / 2 / Math.tan(a * DEG);
    } else {
      L = H / Math.cos(a * DEG);
      S = 2 * H * Math.tan(a * DEG);
    }

    return {
      L, S, H,
      fromVertical: a,
      included: 2 * a,
      fromHorizontal: 90 - a,
      tensionFactor: 1 / Math.cos(a * DEG),
      warnings: angleWarnings(a),
    };
  }

  /* Tension in each leg of a symmetric multi-leg sling.
   *   W = load (kg), a = leg angle from vertical,
   *   sharing = number of legs assumed to carry the load
   *   (for 3 and 4 leg slings, assume only 2 legs carry it unless it is proven otherwise). */
  function legTension({ W, a, sharing }) {
    if (!isNum(W) || W <= 0) return { error: 'Enter the load weight.' };
    if (!isNum(a) || a < 0 || a >= 90) return { error: 'Enter a leg angle from vertical between 0° and 90°.' };
    if (!isNum(sharing) || sharing < 1) return { error: 'Enter how many legs carry the load.' };
    const factor = 1 / Math.cos(a * DEG);
    return {
      perLeg: (W / sharing) * factor,
      factor,
      included: 2 * a,
      warnings: angleWarnings(a),
    };
  }

  /* Load share between two lifting points with an offset centre of gravity.
   *   d1 = horizontal distance from point 1 to the CoG
   *   d2 = horizontal distance from the CoG to point 2 */
  function cogShare({ W, d1, d2 }) {
    if (!isNum(W) || W <= 0) return { error: 'Enter the load weight.' };
    if (!isNum(d1) || !isNum(d2) || d1 < 0 || d2 < 0 || d1 + d2 <= 0) {
      return { error: 'Enter both distances to the centre of gravity.' };
    }
    const r1 = (W * d2) / (d1 + d2);
    const r2 = (W * d1) / (d1 + d2);
    return { r1, r2, pct1: (100 * r1) / W, pct2: (100 * r2) / W };
  }

  /* Cross-haul between two suspension points, for example two chain blocks.
   * Point A is at (0, 0). Point B is `span` to the right and `dh` higher (negative if lower).
   * The load hangs at `x` to the right of A and `drop` below A.
   * Returns the tension in each chain, its angle from vertical and its length. */
  function crossHaul({ W, span, dh = 0, x, drop }) {
    if (!isNum(W) || W <= 0) return { error: 'Enter the load weight.' };
    if (!isNum(span) || span <= 0) return { error: 'Enter the distance between the two lifting points.' };
    if (!isNum(x)) return { error: 'Enter the load position measured from LP A.' };
    if (!isNum(drop) || drop <= 0) return { error: 'Enter how far the load hangs below LP A.' };
    if (!isNum(dh)) dh = 0;
    if (dh + drop <= 0) return { error: 'The load must hang below both lifting points.' };

    const vA = [-x, drop];
    const vB = [span - x, dh + drop];
    const lenA = Math.hypot(vA[0], vA[1]);
    const lenB = Math.hypot(vB[0], vB[1]);
    const uA = [vA[0] / lenA, vA[1] / lenA];
    const uB = [vB[0] / lenB, vB[1] / lenB];
    const det = uA[0] * uB[1] - uB[0] * uA[1];
    if (Math.abs(det) < 1e-9) return { error: 'The two chains are in line, so the load cannot be worked out.' };

    // Solve tA*uA + tB*uB = (0, W): the chains together hold the load up.
    const tA = (-uB[0] * W) / det;
    const tB = (uA[0] * W) / det;
    const angA = Math.atan2(Math.abs(vA[0]), vA[1]) / DEG;
    const angB = Math.atan2(Math.abs(vB[0]), vB[1]) / DEG;
    const between = Math.acos(Math.max(-1, Math.min(1, uA[0] * uB[0] + uA[1] * uB[1]))) / DEG;

    const warnings = [];
    if (tA < -1e-6 || tB < -1e-6) {
      warnings.push({
        level: 'danger',
        text: 'The load is outside the span between the two lifting points. It would swing towards one point and the other chain would go slack.',
      });
    } else if (Math.max(tA, tB) > W * 1.0001) {
      warnings.push({
        level: 'caution',
        text: 'One chain carries more than the load weight because the angle between the chains is wide.',
      });
    }
    if (between > 120) {
      warnings.push({ level: 'danger', text: 'The angle between the chains is over 120°.' });
    }

    return { tA, tB, angA, angB, lenA, lenB, between, warnings };
  }

  /* Weight estimates for steel and other materials. Densities in kg/m³. */
  const MATERIALS = {
    carbon: { label: 'Carbon steel', density: 7850 },
    stainless: { label: 'Stainless steel (316)', density: 8000 },
    duplex: { label: 'Duplex / super duplex', density: 7800 },
    cuni: { label: 'Copper-nickel (90/10)', density: 8900 },
    aluminium: { label: 'Aluminium', density: 2700 },
  };

  // Pipe: OD and wall thickness in mm, length in m.
  function pipeWeight({ od, wt, length, density = 7850, fillWater = false }) {
    if (!isNum(od) || !isNum(wt) || !isNum(length) || od <= 0 || wt <= 0 || length <= 0) {
      return { error: 'Enter the outside diameter, wall thickness and length.' };
    }
    if (wt * 2 >= od) return { error: 'The wall thickness is too big for this diameter.' };
    const ro = od / 2000;
    const ri = ro - wt / 1000;
    const steel = Math.PI * (ro * ro - ri * ri) * length * density;
    const water = fillWater ? Math.PI * ri * ri * length * 1000 : 0;
    return { steel, water, total: steel + water, perMetre: steel / length };
  }

  // Plate or block: dimensions in mm.
  function plateWeight({ l, w, t, density = 7850 }) {
    if (![l, w, t].every((v) => isNum(v) && v > 0)) return { error: 'Enter the length, width and thickness.' };
    return { total: (l / 1000) * (w / 1000) * (t / 1000) * density };
  }

  // Solid round bar: diameter in mm, length in m.
  function barWeight({ d, length, density = 7850 }) {
    if (![d, length].every((v) => isNum(v) && v > 0)) return { error: 'Enter the diameter and length.' };
    const r = d / 2000;
    return { total: Math.PI * r * r * length * density };
  }

  /* Uniform load method mode factors (LEEA / EN 13414-1, EN 818-4, EN 1492).
   * Marked WLL × factor = the most the sling arrangement may lift. */
  const MODE_FACTORS = [
    { id: 'single', label: 'Single leg, straight', factor: 1.0 },
    { id: 'single-choke', label: 'Single leg, choked', factor: 0.8 },
    { id: 'basket-parallel', label: 'Basket, legs parallel', factor: 2.0 },
    { id: 'basket-45', label: 'Basket, 0–45° from vertical', factor: 1.4 },
    { id: 'basket-60', label: 'Basket, 45–60° from vertical', factor: 1.0 },
    { id: '2leg-45', label: '2 leg, 0–45° from vertical', factor: 1.4 },
    { id: '2leg-60', label: '2 leg, 45–60° from vertical', factor: 1.0 },
    { id: '2leg-choke-45', label: '2 leg choked, 0–45°', factor: 1.12 },
    { id: '2leg-choke-60', label: '2 leg choked, 45–60°', factor: 0.8 },
    { id: '4leg-45', label: '3 or 4 leg, 0–45° from vertical', factor: 2.1 },
    { id: '4leg-60', label: '3 or 4 leg, 45–60° from vertical', factor: 1.5 },
    { id: '4leg-choke-45', label: '3 or 4 leg choked, 0–45°', factor: 1.68 },
    { id: '4leg-choke-60', label: '3 or 4 leg choked, 45–60°', factor: 1.2 },
  ];

  function modeFactorWll({ wll, modeId }) {
    const m = MODE_FACTORS.find((f) => f.id === modeId);
    if (!m) return { error: 'Choose a slinging method.' };
    if (!isNum(wll) || wll <= 0) return { error: 'Enter the WLL marked on the sling.' };
    return { factor: m.factor, label: m.label, maxLoad: wll * m.factor };
  }

  const api = {
    slingGeometry, legTension, cogShare, crossHaul,
    pipeWeight, plateWeight, barWeight, modeFactorWll,
    angleWarnings, MATERIALS, MODE_FACTORS,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.LiftCalc = api;
})(typeof self !== 'undefined' ? self : this);
