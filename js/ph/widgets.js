/* widgets.js — persistent-homology widgets embeddable in blog posts.
 * Adapted from the standalone "Shape of a Point Cloud" page: same engine
 * (js/ph/engine.js) and canvas plumbing (js/ph/viz.js); each widget below
 * only wires up if its canvas is present in the page, so a post may embed
 * any subset.
 * Coordinates live in a world rect [0, W] x [0, 1] with W = 1.6 for the wide
 * panels; the engine works on raw coordinates, the mapper letterboxes them.
 * Engine times are Rips scale ε, and so is the UI: each slider is ε, and the
 * drawn disks have radius ε/2, so two disks meet exactly when their edge appears.
 */
(function () {
  'use strict';
  const V = window.VIZ, T = V.Theme;
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const W = 1.6; // world width of the wide panels

  // edges & triangles present at Rips scale eps (simplices sorted by time)
  function complexAt(filt, eps) {
    const edges = [], tris = [];
    for (const s of filt.simplices) {
      if (s.t > eps) break;
      if (s.dim === 1) edges.push(s.verts);
      else if (s.dim === 2) tris.push(s.verts);
    }
    return { edges, tris };
  }

  // highlight for a hovered bar: vertex set (H0) or edge list (H1)
  function featureOf(bar, filt) {
    if (!bar) return null;
    if (bar.dim === 0) {
      if (!bar._comp) {
        const v = filt.simplices[bar.birthIdx].verts[0];
        bar._comp = new Set(PH.componentAt(filt, v, bar.death));
      }
      return { verts: bar._comp, edges: null };
    }
    if (bar.dim === 1 && bar.rep) {
      const vs = new Set();
      for (const [a, b] of bar.rep) { vs.add(a); vs.add(b); }
      return { verts: vs, edges: bar.rep };
    }
    return null;
  }

  function drawFeature(env, map, pts, feat) {
    if (!feat) return;
    const C = T.get();
    if (feat.edges) V.drawEdges(env, map, pts, feat.edges, { color: C.hi, width: 3.4 });
    V.drawPoints(env, map, pts, { color: 'transparent', highlight: feat.verts, hiColor: C.hi, r: 3.2 });
  }

  // local generators (engine presets are centered for the unit square)
  function ring(seed, n, noise, cx, cy, R) {
    return PH.presets.noisyRing(seed, n, noise, cx === undefined ? W / 2 : cx, cy === undefined ? 0.5 : cy, R === undefined ? 0.3 : R);
  }
  function blob(seed, n, cx, cy, spread) {
    const r = PH.rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const a = r() * 2 * Math.PI, d = Math.sqrt(r()) * spread;
      pts.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
    }
    return pts;
  }
  // evenly spaced ring with a little jitter: unlike noisyRing it never leaves
  // a big gap, so the loop closes at a predictable ε and reads as a loop.
  function evenRing(seed, n, noise, cx, cy, R, phase) {
    const r = PH.rng(seed), pts = [], step = 2 * Math.PI / n;
    for (let i = 0; i < n; i++) {
      const a = (phase || 0) + i * step + (r() - 0.5) * 0.3 * step;
      const rr = R + (r() - 0.5) * 2 * noise;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return pts;
  }

  // Pants and plants share one body: two big loops side by side (the legs;
  // the male and female cycles). They differ only in their small loops —
  // seven belt loops spaced all the way around the waistband (seen from
  // above, the waist is the outline of both legs), or one gemma-cup cloning
  // loop off each side — which are the short bars on the barcode.
  const BIG_R = 0.19, BIG_Y = 0.56, BIG_DX = 0.212;
  function bigTwo(seed) {
    return evenRing(seed, 16, 0.012, W / 2 - BIG_DX, BIG_Y, BIG_R, 0.1)
      .concat(evenRing(seed + 1, 16, 0.012, W / 2 + BIG_DX, BIG_Y, BIG_R, 0.3));
  }
  // small loop sitting just outside a big ring at angle `deg` (0 = right,
  // -90 = up; y points down on screen)
  function smallLoopsOn(seed, spots, R, per) {
    const out = [];
    spots.forEach(([side, deg], i) => {
      const t = deg * Math.PI / 180, cx = W / 2 + side * BIG_DX, d = BIG_R + R + 0.03;
      out.push.apply(out, evenRing(seed + i * 7, per, 0.003,
        cx + d * Math.cos(t), BIG_Y + d * Math.sin(t), R, t));
    });
    return out;
  }
  function scatter(seed, n) {
    const r = PH.rng(seed), pts = [];
    for (let i = 0; i < n; i++) pts.push([0.12 + r() * (W - 0.24), 0.12 + r() * 0.76]);
    return pts;
  }

  function bindChips(chips, onPick) {
    chips.forEach(ch => ch.addEventListener('click', () => {
      chips.forEach(c => c.classList.toggle('active', c === ch));
      onPick(ch);
    }));
  }

  /* ================= the hook: what statistics can't see ================= */
  (function shape() {
    const canvas = $('#shape-canvas');
    if (!canvas) return;
    const pts = ring(12, 24, 0.045);
    const on = new Set();
    const mean = [
      pts.reduce((s, p) => s + p[0], 0) / pts.length,
      pts.reduce((s, p) => s + p[1], 0) / pts.length,
    ];
    // principal axis of the 2x2 covariance
    let sxx = 0, syy = 0, sxy = 0;
    for (const p of pts) {
      const dx = p[0] - mean[0], dy = p[1] - mean[1];
      sxx += dx * dx; syy += dy * dy; sxy += dx * dy;
    }
    const theta = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const meanR = pts.reduce((s, p) => s + Math.hypot(p[0] - mean[0], p[1] - mean[1]), 0) / pts.length;

    // Labels have fixed homes so any combination of overlays stays legible:
    // the average is labelled above the ring (with a leader), the trend line
    // past the ring on its lower end, the hole inside, just under the centre.
    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      const ctx = e.ctx;
      const cx = map.x(mean[0]), cy = map.y(mean[1]), rp = map.d(meanR);
      if (on.has('trend')) {
        const L = 0.9;
        ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(map.x(mean[0] - Math.cos(theta) * L), map.y(mean[1] - Math.sin(theta) * L));
        ctx.lineTo(map.x(mean[0] + Math.cos(theta) * L), map.y(mean[1] + Math.sin(theta) * L));
        ctx.stroke();
      }
      if (on.has('eye')) {
        ctx.strokeStyle = C.h1; ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.arc(cx, cy, rp, 0, 2 * Math.PI); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (on.has('mean')) {
        ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - rp - 22); ctx.stroke();
        ctx.fillStyle = C.h0;
        ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = C.h0; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 2 * Math.PI); ctx.stroke();
      }
      V.drawPoints(e, map, pts, { color: C.ink, r: 3.6 });
      // labels last, haloed, so lines and points never cut through them
      if (on.has('trend')) {
        // the end of the line that points down the canvas, just past the ring
        const s = Math.sin(theta) >= 0 ? 1 : -1;
        const ux = s * Math.cos(theta), uy = s * Math.sin(theta);
        const d = rp + 26;
        V.label(e, 'the trend line, shrugging', cx + ux * d + 12, cy + uy * d, { align: 'left' });
      }
      if (on.has('eye')) {
        // two short lines when the ring is too small to hold one long one
        if (rp > 90) V.label(e, 'a hole, obviously', cx, cy + 26, { align: 'center', color: C.h1 });
        else {
          V.label(e, 'a hole,', cx, cy + 22, { align: 'center', color: C.h1 });
          V.label(e, 'obviously', cx, cy + 36, { align: 'center', color: C.h1 });
        }
      }
      if (on.has('mean')) V.label(e, 'the average — in the one spot with no data', cx, cy - rp - 32, { align: 'center' });
    }, { fit: W });

    const shapeBars = $('#shape-bars');
    if (shapeBars) {
      const sb = PH.persistence(pts).bars;
      const fin = sb.filter(b => isFinite(b.death)).map(b => b.death);
      const bc = V.Barcode(shapeBars, {
        dims: [0, 1],
        rMax: (fin.length ? Math.max.apply(null, fin) : 1) * 1.08,
      });
      bc.set(sb);
    }

    $$('#ph-shape [data-overlay]').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.overlay;
        if (on.has(k)) on.delete(k); else on.add(k);
        btn.classList.toggle('active', on.has(k));
        env.draw();
      });
    });
  })();

  /* ================= inflate: union of disks ================= */
  (function grow() {
    const canvas = $('#grow-canvas');
    if (!canvas) return;
    // a ring plus a few stragglers, placed by hand so none lands in the hole
    const pts = ring(5, 22, 0.035).concat([[0.2, 0.22], [0.3, 0.8], [1.37, 0.2], [1.43, 0.68], [0.12, 0.5]]);
    const slider = $('#grow-r'), read = $('#grow-read');
    let r = parseFloat(slider.value);

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      V.unionDisks(e, map, pts, r / 2, 0.9, C.wash);
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
    }, { fit: W });
    const growBars = $('#grow-bars');
    const gbc = growBars ? V.Barcode(growBars, { dims: [0, 1], rMax: 0.6 }) : null;
    if (gbc) { gbc.set(PH.persistence(pts).bars); gbc.sweep(r); }

    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'ε = ' + V.fmt(r);
      if (gbc) gbc.sweep(r);
      env.draw();
    });
  })();

  /* ================= H0: islands merging ================= */
  (function merge() {
    const canvas = $('#merge-canvas');
    if (!canvas) return;
    const pts = blob(41, 9, 0.42, 0.36, 0.09)
      .concat(blob(43, 9, 1.16, 0.62, 0.085))
      .concat([[0.82, 0.16], [0.15, 0.82], [1.42, 0.22]]);
    const { bars, filtration } = PH.persistence(pts);
    const slider = $('#merge-r'), read = $('#merge-read');
    let r = parseFloat(slider.value);
    let feat = null;

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      V.unionDisks(e, map, pts, r / 2, 0.9, C.wash);
      const { edges } = complexAt(filtration, r);
      V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
      drawFeature(e, map, pts, feat);
    }, { fit: W });

    const bc = V.Barcode($('#merge-bars'), { dims: [0, 1], rMax: 0.64 });
    bc.set(bars);
    bc.sweep(r);
    bc.onHover = (bar) => { feat = featureOf(bar, filtration); env.draw(); };

    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'ε = ' + V.fmt(r);
      bc.sweep(r);
      env.draw();
    });
  })();

  /* ================= H1: loops ================= */
  (function loops() {
    const canvas = $('#loops-canvas');
    if (!canvas) return;
    const clouds = {
      ring: ring(21, 20, 0.02),
      eight: ring(22, 13, 0.012, W / 2 - 0.235, 0.5, 0.185)
        .concat(ring(23, 12, 0.012, W / 2 + 0.21, 0.5, 0.16)),
      random: scatter(31, 24),
    };
    const cache = {};
    function data(k) {
      if (!cache[k]) cache[k] = PH.persistence(clouds[k]);
      return cache[k];
    }
    let shape = 'ring';
    const slider = $('#loops-r'), read = $('#loops-read');
    let r = parseFloat(slider.value);
    let feat = null;

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      const pts = clouds[shape];
      const { edges, tris } = complexAt(data(shape).filtration, r);
      V.unionDisks(e, map, pts, r / 2, 0.45, C.wash);
      V.unionTris(e, map, pts, tris, 0.85, C.washTri);
      V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
      drawFeature(e, map, pts, feat);
    }, { fit: W });

    const bc = V.Barcode($('#loops-bars'), { dims: [0, 1], rMax: 0.6 });
    function refresh() {
      feat = null;
      bc.set(data(shape).bars);
      bc.sweep(r);
      env.draw();
    }
    bc.onHover = (bar) => { feat = featureOf(bar, data(shape).filtration); env.draw(); };

    bindChips($$('#ph-loops [data-shape]'), (ch) => { shape = ch.dataset.shape; refresh(); });
    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'ε = ' + V.fmt(r);
      bc.sweep(r);
      env.draw();
    });
    refresh();
  })();

  /* ================= sandbox ================= */
  (function sandbox() {
    const canvas = $('#sand-canvas');
    if (!canvas) return;
    const CAP = 72;
    let seedTick = 0;
    let pts = ring(77, 24, 0.03);
    let pers = null;
    let feat = null;
    const slider = $('#sand-r'), read = $('#sand-read'), counter = $('#sand-count');
    let r = parseFloat(slider.value);
    let computeQueued = false;
    let ver = 0; // bumped on every edit to pts; pers.ver says which edit it describes

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      // between an edit and the queued recompute, pers still describes the
      // old cloud; draw just the points until it catches up
      if (pers && pers.ver === ver) {
        const { edges, tris } = complexAt(pers.filtration, r);
        V.unionDisks(e, map, pts, r / 2, 0.45, C.wash);
        V.unionTris(e, map, pts, tris, 0.85, C.washTri);
        V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      }
      V.drawPoints(e, map, pts, { color: C.ink, r: 3.4 });
      drawFeature(e, map, pts, feat);
    }, { fit: W });

    const bc = V.Barcode($('#sand-bars'), { dims: [0, 1], rMax: 0.6 });
    const dg = V.Diagram($('#sand-bars'), { rMax: 0.6 });
    dg.env.enabled = false;
    const onHover = (bar) => { feat = pers ? featureOf(bar, pers.filtration) : null; env.draw(); };
    bc.onHover = onHover; dg.onHover = onHover;

    function recompute() {
      ver++;
      if (computeQueued) return;
      computeQueued = true;
      requestAnimationFrame(() => {
        computeQueued = false;
        pers = pts.length ? PH.persistence(pts) : null;
        if (pers) pers.ver = ver;
        feat = null;
        bc.set(pers ? pers.bars : []);
        dg.set(pers ? pers.bars : []);
        bc.sweep(r);
        counter.textContent = `${pts.length} / ${CAP} points${pts.length >= CAP ? ' — full' : ''}`;
        env.draw();
      });
    }

    canvas.addEventListener('pointerdown', (ev) => {
      const rect = canvas.getBoundingClientRect();
      const map = V.mapper(env, W, 20);
      const wx = map.fromX(ev.clientX - rect.left), wy = map.fromY(ev.clientY - rect.top);
      let hit = -1, bd = map.d ? 12 / map.s : 0.03;
      pts.forEach((p, i) => {
        const d = Math.hypot(p[0] - wx, p[1] - wy);
        if (d < bd) { bd = d; hit = i; }
      });
      if (hit >= 0) pts.splice(hit, 1);
      else if (pts.length < CAP && wx > -0.02 && wx < W + 0.02 && wy > -0.02 && wy < 1.02)
        pts.push([wx, wy]);
      else return;
      recompute(); // bumps ver first, so this draw skips the stale complex
      env.draw();
    });

    $$('#ph-sandbox [data-preset]').forEach(btn => btn.addEventListener('click', () => {
      seedTick++;
      const k = btn.dataset.preset;
      if (k === 'pants') pts = bigTwo(50 + seedTick).concat(smallLoopsOn(120 + seedTick,
        [[-1, -135], [-1, 180], [-1, 135], [1, -45], [1, 0], [1, 45]], 0.036, 5))
        // and the seventh, at center back between the legs
        .concat(evenRing(190 + seedTick, 5, 0.003, W / 2, BIG_Y - 0.165, 0.036));
      else if (k === 'plants') pts = bigTwo(50 + seedTick).concat(smallLoopsOn(160 + seedTick,
        [[-1, 180], [1, 0]], 0.045, 6));
      else if (k === 'clusters') pts = blob(30 + seedTick, 10, 0.4, 0.35, 0.09)
        .concat(blob(60 + seedTick, 10, 1.15, 0.6, 0.09))
        .concat(scatter(80 + seedTick, 3));
      else if (k === 'random') pts = scatter(10 + seedTick, 28);
      else pts = [];
      recompute();
    }));

    bindChips($$('#ph-sandbox [data-view]'), (ch) => {
      const dia = ch.dataset.view === 'diagram';
      bc.env.enabled = !dia; dg.env.enabled = dia;
      (dia ? dg : bc).redraw();
    });

    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'ε = ' + V.fmt(r);
      bc.sweep(r);
      env.draw();
    });
    recompute();
  })();
  /* ================= stability: perturb the cloud, watch the diagram =====
   * Each point is nudged by at most delta, so the Hausdorff (hence
   * Gromov-Hausdorff) distance between the two clouds is at most delta, and
   * the bottleneck stability theorem bounds every diagram point's movement by
   * 2*delta. The dashed boxes are exactly that bound: nothing may leave one.
   */
  (function stability() {
    const canvas = $('#stab-canvas');
    if (!canvas) return;
    const dgCanvas = $('#stab-diagram');
    const slider = $('#stab-d'), read = $('#stab-read');
    const RMAX = 0.62;

    const base = ring(41, 20, 0.025).concat([[0.24, 0.3], [1.38, 0.24], [1.3, 0.8], [0.32, 0.82]]);
    // fixed unit directions, so sliding delta moves each point smoothly
    const rnd = PH.rng(2024);
    const dirs = base.map(() => {
      const a = rnd() * 2 * Math.PI;
      const m = 0.35 + 0.65 * rnd();
      return [Math.cos(a) * m, Math.sin(a) * m];
    });

    let delta = parseFloat(slider.value);
    const baseBars = PH.persistence(base).bars;
    let movedBars = baseBars;
    let moved = base;

    function recompute() {
      moved = base.map((p, i) => [p[0] + dirs[i][0] * delta, p[1] + dirs[i][1] * delta]);
      movedBars = PH.persistence(moved).bars;
    }

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      const ctx = e.ctx;
      // tolerance disc around each original point
      if (delta > 0) {
        ctx.fillStyle = C.wash;
        for (const p of base) {
          ctx.beginPath();
          ctx.arc(map.x(p[0]), map.y(p[1]), map.d(delta), 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      V.drawPoints(e, map, base, { color: C.inkFaint, r: 2.6 });
      V.drawPoints(e, map, moved, { color: C.ink, r: 3.4 });
    }, { fit: W });

    // same diagram as the sandbox's, with the original features drawn hollow
    // and the theorem's bound (every feature moves at most 2δ, in L∞) shaded
    // around each of them
    const dg = V.Diagram(dgCanvas, { rMax: RMAX });
    dg.ghost = baseBars;
    function refresh() {
      dg.box = 2 * delta;
      dg.set(movedBars);
      env.draw();
    }

    slider.addEventListener('input', () => {
      delta = parseFloat(slider.value);
      read.textContent = 'δ = ' + V.fmt(delta);
      recompute();
      refresh();
    });
    recompute();
    refresh();
  })();

  /* ================= the curse of dimensionality =====================
   * A ring of points in the first two coordinates, plus a little Gaussian
   * noise (σ per coordinate) in every one of D coordinates. The noise matrix
   * is drawn once for the largest D, so raising D only appends coordinates.
   * The plane shows the points laid out in 2-D so as to keep their
   * D-dimensional distances (metric MDS by SMACOF, each layout started from
   * the previous one and turned to match it), with the Rips complex at ε
   * drawn on top. Everything is measured as a fraction of the largest
   * distance, like the histogram. As D grows the distances bunch up
   * (≈ √(chord² + 2Dσ²)): the ring loses its shape, nothing connects for a
   * long while and then everything connects at once, and the loop's bar
   * shrinks.
   */
  (function dims() {
    const canvas = $('#dims-canvas');
    if (!canvas) return;
    const slider = $('#dims-d'), read = $('#dims-read'), note = $('#dims-note');
    const eSlider = $('#dims-e'), eRead = $('#dims-eread');
    const DS = [2, 3, 5, 10, 20, 50, 100, 200, 500, 768, 1000];
    const N = 30, R = 0.3, SIGMA = 0.02, BINS = 36;
    const DMAX = DS[DS.length - 1];
    const SPAN = 0.74; // world length of the largest distance in the layout

    const rnd = PH.rng(7);
    const gauss = () => {
      const u = rnd() || 1e-9, v = rnd();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const noise = [];
    for (let i = 0; i < N; i++) {
      const row = new Float64Array(DMAX);
      for (let k = 0; k < DMAX; k++) row[k] = gauss() * SIGMA;
      noise.push(row);
    }

    function measure(D) {
      const pts = [];
      for (let i = 0; i < N; i++) {
        const a = 2 * Math.PI * i / N, p = new Array(D);
        for (let k = 0; k < D; k++) p[k] = noise[i][k];
        p[0] += R * Math.cos(a); p[1] += R * Math.sin(a);
        pts.push(p);
      }
      const dist = pts.map(() => new Float64Array(N));
      let dmax = 0;
      const hist = new Array(BINS).fill(0), all = [];
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          let s = 0;
          for (let k = 0; k < D; k++) { const d = pts[i][k] - pts[j][k]; s += d * d; }
          s = Math.sqrt(s); all.push(s); if (s > dmax) dmax = s;
          dist[i][j] = dist[j][i] = s;
        }
      for (const d of all) hist[Math.min(BINS - 1, Math.floor(d / dmax * BINS))]++;
      const { bars, filtration } = PH.persistence(pts);
      const loops = bars.filter(b => b.dim === 1 && b.death - b.birth > 1e-9)
        .sort((a, b) => (b.death - b.birth) - (a.death - a.birth));
      return { dist, dmax, hist, loops, filtration };
    }

    // metric MDS (SMACOF): 2-D positions whose distances match the targets
    function smacof(target, init, iters) {
      let X = init.map(p => p.slice());
      for (let it = 0; it < iters; it++) {
        const Y = X.map(() => [0, 0]);
        for (let i = 0; i < N; i++) {
          let bi = 0;
          for (let j = 0; j < N; j++) {
            if (i === j) continue;
            const d = Math.hypot(X[i][0] - X[j][0], X[i][1] - X[j][1]) || 1e-9;
            const b = -target[i][j] / d;
            bi -= b;
            Y[i][0] += b * X[j][0]; Y[i][1] += b * X[j][1];
          }
          Y[i][0] += bi * X[i][0]; Y[i][1] += bi * X[i][1];
        }
        X = Y.map(p => [p[0] / N, p[1] / N]);
      }
      return X;
    }
    const centre = (X) => {
      const cx = X.reduce((s, p) => s + p[0], 0) / N, cy = X.reduce((s, p) => s + p[1], 0) / N;
      return X.map(p => [p[0] - cx, p[1] - cy]);
    };
    // turn (and if it fits better, mirror) Y onto the reference layout
    function align(Y, ref) {
      let best = null;
      for (const flip of [1, -1]) {
        const Z = Y.map(p => [p[0], flip * p[1]]);
        let sxy = 0, sxx = 0;
        for (let i = 0; i < N; i++) {
          sxx += Z[i][0] * ref[i][0] + Z[i][1] * ref[i][1];
          sxy += Z[i][0] * ref[i][1] - Z[i][1] * ref[i][0];
        }
        const t = Math.atan2(sxy, sxx), c = Math.cos(t), sn = Math.sin(t);
        const R2 = Z.map(p => [c * p[0] - sn * p[1], sn * p[0] + c * p[1]]);
        let err = 0;
        for (let i = 0; i < N; i++) err += (R2[i][0] - ref[i][0]) ** 2 + (R2[i][1] - ref[i][1]) ** 2;
        if (!best || err < best.err) best = { err, X: R2 };
      }
      return best.X;
    }

    // every dimension's numbers and layout, each layout grown from the last
    const data = new Map();
    let prev = null;
    for (const D of DS) {
      const m = measure(D);
      const target = m.dist.map(row => Array.from(row, d => d / m.dmax * SPAN));
      const init = prev || Array.from({ length: N }, (_, i) =>
        [R * Math.cos(2 * Math.PI * i / N), R * Math.sin(2 * Math.PI * i / N)]);
      let X = centre(smacof(target, init, prev ? 120 : 300));
      if (prev) X = align(X, prev);
      // keep it inside the panel
      const ext = Math.max(...X.map(p => Math.max(Math.abs(p[0]) / 0.75, Math.abs(p[1]) / 0.46)));
      if (ext > 1) X = X.map(p => [p[0] / ext, p[1] / ext]);
      m.layout = X;
      data.set(D, m);
      prev = X;
    }

    let D = DS[parseInt(slider.value, 10)];
    let eps = parseFloat(eSlider.value); // as a fraction of the largest distance
    let shown = data.get(D).layout.map(p => p.slice());
    const world = () => shown.map(p => [W / 2 + p[0], 0.5 + p[1]]);

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      const cur = data.get(D), pts = world();
      const { edges, tris } = complexAt(cur.filtration, eps * cur.dmax);
      V.unionTris(e, map, pts, tris, 0.45, C.washTri);
      V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      const top = cur.loops[0];
      if (top && top.rep && eps * cur.dmax >= top.birth && eps * cur.dmax < top.death)
        V.drawEdges(e, map, pts, top.rep, { color: C.h1, width: 2.4 });
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
      V.label(e, 'laid out to keep their distances in D dimensions', 8, 14, { color: C.inkFaint });
    }, { fit: W });

    const PAD_L = 40, PAD_R = 16, AXIS_H = 26;
    const chart = V.makeCanvas($('#dims-chart'), (e) => {
      const C = T.get(), ctx = e.ctx;
      const cur = data.get(D);
      const plotW = e.w - PAD_L - PAD_R;
      const X = (f) => PAD_L + f * plotW;
      const axisY = e.h - AXIS_H + 6;
      const histTop = 10, histH = (axisY - 16) * 0.55;
      const barTop = histTop + histH + 14, barH = axisY - 8 - barTop;

      // grid + ticks, as a fraction of the largest distance
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.strokeStyle = C.hair; ctx.lineWidth = 1;
      for (let v = 0; v <= 1.0001; v += 0.2) {
        ctx.beginPath(); ctx.moveTo(X(v), histTop); ctx.lineTo(X(v), axisY - 3); ctx.stroke();
        ctx.fillStyle = C.inkFaint;
        ctx.fillText(V.fmt(Math.round(v * 10) / 10), X(v), axisY);
      }
      ctx.textAlign = 'left';
      ctx.fillText('ε', 6, axisY);

      // histogram of all pairwise distances
      const peak = Math.max.apply(null, cur.hist);
      const bw = plotW / BINS;
      ctx.fillStyle = C.h0;
      ctx.globalAlpha = 0.55;
      cur.hist.forEach((c, i) => {
        const h = c / peak * histH;
        ctx.fillRect(X(i / BINS) + 0.5, histTop + histH - h, Math.max(1, bw - 1), h);
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.inkSoft; ctx.textBaseline = 'top';
      ctx.fillText('dist.', 6, histTop + 1);

      // the loops, longest first, on the same axis
      ctx.fillText('H₁', 6, barTop + 1);
      const loops = cur.loops.slice(0, 4);
      const rowH = Math.min(12, barH / Math.max(1, loops.length));
      loops.forEach((b, i) => {
        const y = barTop + i * rowH + rowH / 2;
        ctx.strokeStyle = C.h1; ctx.lineWidth = Math.max(1.6, rowH - 4);
        ctx.beginPath();
        ctx.moveTo(X(b.birth / cur.dmax), y);
        ctx.lineTo(Math.max(X(b.death / cur.dmax), X(b.birth / cur.dmax) + 1.5), y);
        ctx.stroke();
      });

      // sweep line at ε
      ctx.strokeStyle = C.sweep; ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(X(eps), histTop - 2); ctx.lineTo(X(eps), axisY - 2); ctx.stroke();
      ctx.setLineDash([]);
    }, { fitH: () => 210 });

    // glide the points to the new layout when D changes
    let anim = 0;
    function moveTo(target) {
      cancelAnimationFrame(anim);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        shown = target.map(p => p.slice()); env.draw(); return;
      }
      const from = shown.map(p => p.slice()), t0 = performance.now(), dur = 450;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur), k = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
        shown = from.map((p, i) => [p[0] + (target[i][0] - p[0]) * k, p[1] + (target[i][1] - p[1]) * k]);
        env.draw();
        if (t < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }

    function refresh() {
      const cur = data.get(D);
      const top = cur.loops[0];
      read.textContent = 'D = ' + D;
      eRead.textContent = 'ε = ' + eps.toFixed(2);
      note.textContent = top
        ? 'longest loop: ' + Math.round((top.death - top.birth) / cur.dmax * 100) + '% of the range'
        : 'no loop';
      env.draw(); chart.draw();
    }
    slider.addEventListener('input', () => {
      D = DS[parseInt(slider.value, 10)];
      moveTo(data.get(D).layout);
      refresh();
    });
    eSlider.addEventListener('input', () => {
      eps = parseFloat(eSlider.value);
      refresh();
    });
    refresh();
  })();

})();
