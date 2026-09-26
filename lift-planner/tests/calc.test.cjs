// Run with: node --test lift-planner/tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');

const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} is not close to ${b}`);

test('sling geometry: sling length and spread', () => {
  // 2 m legs, 2 m spread: equilateral triangle, 30° from vertical.
  const r = C.slingGeometry({ L: 2, S: 2 });
  near(r.fromVertical, 30);
  near(r.included, 60);
  near(r.H, Math.sqrt(3));
  near(r.tensionFactor, 1 / Math.cos(Math.PI / 6));
  assert.equal(r.warnings.length, 0);
});

test('sling geometry: every pair of inputs gives the same triangle', () => {
  const ref = C.slingGeometry({ L: 3, S: 4 });
  const pairs = [
    { L: 3, H: ref.H }, { S: 4, H: ref.H }, { L: 3, a: ref.fromVertical },
    { S: 4, a: ref.fromVertical }, { H: ref.H, a: ref.fromVertical },
  ];
  for (const p of pairs) {
    const r = C.slingGeometry(p);
    near(r.L, 3); near(r.S, 4); near(r.H, ref.H); near(r.fromVertical, ref.fromVertical);
  }
});

test('sling geometry: angle warnings', () => {
  assert.equal(C.slingGeometry({ L: 1, a: 50 }).warnings[0].level, 'caution');
  assert.equal(C.slingGeometry({ L: 1, a: 65 }).warnings[0].level, 'danger');
});

test('sling geometry: bad input', () => {
  assert.ok(C.slingGeometry({ L: 1 }).error);
  assert.ok(C.slingGeometry({ L: 1, S: 2 }).error); // cannot reach
  assert.ok(C.slingGeometry({ L: 1, H: 2 }).error);
  assert.ok(C.slingGeometry({ L: 1, S: 1, H: 1 }).error); // too many
  assert.ok(C.slingGeometry({ L: 1, a: 90 }).error);
});

test('leg tension', () => {
  const r = C.legTension({ W: 1000, a: 60, sharing: 2 });
  near(r.perLeg, 1000); // 500 kg per leg × factor 2
  near(C.legTension({ W: 250, a: 0, sharing: 2 }).perLeg, 125);
  assert.ok(C.legTension({ W: 0, a: 10, sharing: 2 }).error);
});

test('centre of gravity load share', () => {
  const r = C.cogShare({ W: 1000, d1: 1, d2: 3 });
  near(r.r1, 750);
  near(r.r2, 250);
  near(r.pct1 + r.pct2, 100);
});

test('cross-haul: load directly under LP A puts all the weight on A', () => {
  const r = C.crossHaul({ W: 250, span: 2, x: 0, drop: 2 });
  near(r.tA, 250);
  near(r.tB, 0);
  near(r.angA, 0);
});

test('cross-haul: load centred between two level points', () => {
  // 45° chains each side: each chain takes W / (2 cos 45°).
  const r = C.crossHaul({ W: 250, span: 2, x: 1, drop: 1 });
  near(r.tA, 250 / (2 * Math.cos(Math.PI / 4)));
  near(r.tB, r.tA);
  near(r.angA, 45);
  near(r.between, 90);
  near(r.lenA, Math.SQRT2);
});

test('cross-haul: forces balance for an uneven case', () => {
  const W = 400;
  const r = C.crossHaul({ W, span: 3, dh: 0.5, x: 1, drop: 2 });
  const aA = (r.angA * Math.PI) / 180;
  const aB = (r.angB * Math.PI) / 180;
  near(r.tA * Math.sin(aA), r.tB * Math.sin(aB)); // horizontal
  near(r.tA * Math.cos(aA) + r.tB * Math.cos(aB), W); // vertical
});

test('cross-haul: load outside the span is flagged', () => {
  const r = C.crossHaul({ W: 250, span: 2, x: -0.5, drop: 2 });
  assert.ok(r.tB < 0);
  assert.equal(r.warnings[0].level, 'danger');
});

test('pipe weight: 6in sch40 carbon steel', () => {
  // 168.3 × 7.11 mm is about 28.26 kg/m.
  const r = C.pipeWeight({ od: 168.3, wt: 7.11, length: 1 });
  near(r.perMetre, 28.26, 0.05);
  const wet = C.pipeWeight({ od: 168.3, wt: 7.11, length: 1, fillWater: true });
  assert.ok(wet.water > 18 && wet.water < 19);
});

test('plate and bar weight', () => {
  near(C.plateWeight({ l: 1000, w: 1000, t: 10 }).total, 78.5);
  near(C.barWeight({ d: 100, length: 1 }).total, Math.PI * 0.05 * 0.05 * 7850);
});

test('mode factor', () => {
  near(C.modeFactorWll({ wll: 1000, modeId: 'single-choke' }).maxLoad, 800);
  near(C.modeFactorWll({ wll: 1000, modeId: '4leg-45' }).maxLoad, 2100);
  assert.ok(C.modeFactorWll({ wll: 1000, modeId: 'nope' }).error);
});
