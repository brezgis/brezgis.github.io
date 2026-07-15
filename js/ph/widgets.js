/* widgets.js — persistent-homology widgets embeddable in blog posts.
 * Adapted from the standalone "Shape of a Point Cloud" page: same engine
 * (js/ph/engine.js) and canvas plumbing (js/ph/viz.js); each widget below
 * only wires up if its canvas is present in the page, so a post may embed
 * any subset.
 * Coordinates live in a world rect [0, W] x [0, 1] with W = 1.6 for the wide
 * panels; the engine works on raw coordinates, the mapper letterboxes them.
 * Engine times are Rips scale ε; the UI everywhere shows disk radius r = ε/2.
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

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      const ctx = e.ctx;
      ctx.font = V.SANS;
      if (on.has('trend')) {
        const L = 0.62;
        ctx.strokeStyle = C.inkFaint; ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(map.x(mean[0] - Math.cos(theta) * L), map.y(mean[1] - Math.sin(theta) * L));
        ctx.lineTo(map.x(mean[0] + Math.cos(theta) * L), map.y(mean[1] + Math.sin(theta) * L));
        ctx.stroke();
        ctx.fillStyle = C.inkSoft;
        ctx.textAlign = 'left';
        ctx.fillText('the trend line, shrugging', map.x(mean[0] + Math.cos(theta) * L) - 150, map.y(mean[1] + Math.sin(theta) * L) - 10);
      }
      if (on.has('eye')) {
        ctx.strokeStyle = C.h1; ctx.lineWidth = 2;
        ctx.setLineDash([6, 5]);
        ctx.beginPath();
        ctx.arc(map.x(mean[0]), map.y(mean[1]), map.d(meanR), 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.h1; ctx.textAlign = 'center';
        ctx.fillText('a hole, obviously', map.x(mean[0]), map.y(mean[1]) + 5);
      }
      if (on.has('mean')) {
        ctx.fillStyle = C.h0;
        ctx.beginPath(); ctx.arc(map.x(mean[0]), map.y(mean[1]), 5.5, 0, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = C.h0; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(map.x(mean[0]), map.y(mean[1]), 10, 0, 2 * Math.PI); ctx.stroke();
        ctx.fillStyle = C.inkSoft; ctx.textAlign = 'left';
        ctx.fillText('the average — in the one spot with no data', map.x(mean[0]) + 16, map.y(mean[1]) - 12);
      }
      V.drawPoints(e, map, pts, { color: T.get().ink, r: 3.6 });
    });

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
    const pts = ring(5, 22, 0.035).concat(scatter(9, 5));
    const slider = $('#grow-r'), read = $('#grow-read');
    let r = parseFloat(slider.value);

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      V.unionDisks(e, map, pts, r, 0.9, C.wash);
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
    });
    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'r = ' + V.fmt(r);
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
      V.unionDisks(e, map, pts, r, 0.9, C.wash);
      const { edges } = complexAt(filtration, 2 * r);
      V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
      drawFeature(e, map, pts, feat);
    });

    const bc = V.Barcode($('#merge-bars'), { dims: [0], rMax: 0.32 });
    bc.set(bars);
    bc.sweep(r);
    bc.onHover = (bar) => { feat = featureOf(bar, filtration); env.draw(); };

    slider.addEventListener('input', () => {
      r = parseFloat(slider.value);
      read.textContent = 'r = ' + V.fmt(r);
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
      const { edges, tris } = complexAt(data(shape).filtration, 2 * r);
      V.unionDisks(e, map, pts, r, 0.45, C.wash);
      V.unionTris(e, map, pts, tris, 0.85, C.washTri);
      V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      V.drawPoints(e, map, pts, { color: C.ink, r: 3 });
      drawFeature(e, map, pts, feat);
    });

    const bc = V.Barcode($('#loops-bars'), { dims: [1], rMax: 0.3 });
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
      read.textContent = 'r = ' + V.fmt(r);
      bc.sweep(r);
      env.draw();
    });
    refresh();
  })();

  /* ================= sandbox ================= */
  (function sandbox() {
    const canvas = $('#sand-canvas');
    if (!canvas) return;
    const CAP = 60;
    let seedTick = 0;
    let pts = ring(77, 24, 0.03);
    let pers = null;
    let feat = null;
    const slider = $('#sand-r'), read = $('#sand-read'), counter = $('#sand-count');
    let r = parseFloat(slider.value);
    let computeQueued = false;

    const env = V.makeCanvas(canvas, (e) => {
      const C = T.get();
      const map = V.mapper(e, W, 20);
      if (pers) {
        const { edges, tris } = complexAt(pers.filtration, 2 * r);
        V.unionDisks(e, map, pts, r, 0.45, C.wash);
        V.unionTris(e, map, pts, tris, 0.85, C.washTri);
        V.drawEdges(e, map, pts, edges, { color: C.inkFaint, width: 1 });
      }
      V.drawPoints(e, map, pts, { color: C.ink, r: 3.4 });
      drawFeature(e, map, pts, feat);
    });

    const bc = V.Barcode($('#sand-bars'), { dims: [0, 1], rMax: 0.3 });
    const dg = V.Diagram($('#sand-bars'), { rMax: 0.3 });
    dg.env.enabled = false;
    const onHover = (bar) => { feat = pers ? featureOf(bar, pers.filtration) : null; env.draw(); };
    bc.onHover = onHover; dg.onHover = onHover;

    function recompute() {
      if (computeQueued) return;
      computeQueued = true;
      requestAnimationFrame(() => {
        computeQueued = false;
        pers = pts.length ? PH.persistence(pts) : null;
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
      env.draw();
      recompute();
    });

    $$('#ph-sandbox [data-preset]').forEach(btn => btn.addEventListener('click', () => {
      seedTick++;
      const k = btn.dataset.preset;
      if (k === 'ring') pts = ring(77 + seedTick, 24, 0.03);
      else if (k === 'eight') pts = ring(50 + seedTick, 14, 0.02, W / 2 - 0.24, 0.5, 0.19)
        .concat(ring(90 + seedTick, 13, 0.02, W / 2 + 0.22, 0.5, 0.16));
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
      read.textContent = 'r = ' + V.fmt(r);
      bc.sweep(r);
      env.draw();
    });
    recompute();
  })();
})();
