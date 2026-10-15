// Topology of Color page: a persistent-homology explainer (ambient loop) and
// three charts. All data is embedded; see the comments above each dataset.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var BLUE = '#2F6DB0', AMBER = '#C47A2C', REF = '#8A8A8A', GRID = '#E2E0DB';
  var TEXT = '#2D2D2D', SOFT = '#5C5C5C', SOFTER = '#8A8A8A', CARD = '#FFFFFF';

  // ---------- helpers ----------
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y, 'font-size': 12, fill: SOFT }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  // "H" with a subscript dimension, as SVG text.
  function hdim(parent, x, y, d, attrs) {
    var t = txt(parent, x, y, 'H', attrs);
    var s = el('tspan', { 'font-size': '0.72em', dy: 3 }, t);
    s.textContent = d;
    return t;
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function tooltip(plot) {
    var tip = document.createElement('div');
    tip.className = 'tc-tip';
    plot.appendChild(tip);
    return {
      show: function (html, evt) {
        tip.innerHTML = html;
        var r = plot.getBoundingClientRect();
        tip.classList.add('show');
        var x = evt.clientX - r.left + 12, y = evt.clientY - r.top + 14;
        x = Math.max(0, Math.min(x, r.width - tip.offsetWidth - 4));
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
      },
      hide: function () { tip.classList.remove('show'); }
    };
  }
  function onVisible(node, fn, threshold) {
    if (reduceMotion || !('IntersectionObserver' in window)) { fn(true); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); fn(false); }
    }, { threshold: threshold || 0.35 });
    io.observe(node);
  }
  function tween(dur, fn, done) {          // fn(p) with p eased 0..1
    if (reduceMotion) { fn(1); if (done) done(); return; }
    var t0 = null;
    function frame(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      fn(ease(p));
      if (p < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
  }
  function toggle(root, onChange) {          // segmented control: buttons with data-v
    var bs = root.querySelectorAll('.tc-toggle button');
    Array.prototype.forEach.call(bs, function (b) {
      b.addEventListener('click', function () {
        if (b.getAttribute('aria-pressed') === 'true') return;
        Array.prototype.forEach.call(bs, function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        onChange(b.getAttribute('data-v'));
      });
    });
  }
  function fmtP(p) {
    if (p < 0.00011) return 'p < 0.0001';
    return 'p = ' + (p < 0.01 ? p.toFixed(4) : p < 0.1 ? p.toFixed(3) : p.toFixed(2));
  }

  // =====================================================================
  // 1. Filtration explainer
  // English color KWIC line 1138 (data/kwic/en/color.csv), mBERT
  // (bert-base-multilingual-cased) layer 2, head 7, counting from 0. Built as
  // in vendor/tda4atd/ripser_count.matrix_to_ripser: keep the 12 real tokens,
  // row-normalise, drop weights <= 1e-3, distance = 1 - max(a_ij, a_ji).
  // Edges: [i, j, distance] for distance < 1. h0: Kruskal merges (one H0 bar
  // dies at each). h1: ripser Vietoris-Rips pairs (identical to the project's
  // stored barcode), with a representative cycle closed by the birth edge.
  // =====================================================================
  var FILT = {"sentence":"They are blue and have a very unique look.","layer":2,"head":7,"tokens":["[CLS]","They","are","blue","and","have","a","very","unique","look",".","[SEP]"],"edges":[[0,1,0.0177],[6,7,0.0744],[4,5,0.0929],[1,2,0.1983],[5,6,0.273],[3,4,0.3065],[8,9,0.3238],[0,3,0.4062],[7,8,0.4214],[0,10,0.498],[0,11,0.5086],[10,11,0.5205],[9,10,0.582],[2,3,0.6516],[0,8,0.6719],[0,4,0.7097],[0,9,0.7407],[0,6,0.7764],[0,2,0.8385],[0,5,0.9305],[0,7,0.9329],[6,8,0.9591],[8,10,0.9809],[1,3,0.9863],[3,11,0.9866],[2,4,0.9868],[7,9,0.9902],[9,11,0.9907],[4,6,0.9914],[3,5,0.9922],[6,9,0.9923],[1,11,0.9951],[1,5,0.9958],[2,11,0.9959],[2,10,0.9964],[1,8,0.9964],[8,11,0.9967],[5,7,0.9971],[6,11,0.9981],[1,9,0.9982],[3,6,0.9985],[6,10,0.9985],[2,9,0.9987],[5,8,0.9989],[3,8,0.9989],[3,10,0.999]],"h0":[{"d":0.0177,"e":[0,1]},{"d":0.0744,"e":[6,7]},{"d":0.0929,"e":[4,5]},{"d":0.1983,"e":[1,2]},{"d":0.273,"e":[5,6]},{"d":0.3065,"e":[3,4]},{"d":0.3238,"e":[8,9]},{"d":0.4062,"e":[0,3]},{"d":0.4214,"e":[7,8]},{"d":0.498,"e":[0,10]},{"d":0.5086,"e":[0,11]}],"h1":[{"b":0.582,"d":0.9329,"cyc":[10,0,3,4,5,6,7,8,9]},{"b":0.6516,"d":0.8385,"cyc":[3,0,1,2]},{"b":0.6719,"d":0.7407,"cyc":[8,9,10,0]},{"b":0.7764,"d":0.9305,"cyc":[6,7,8,0]}]};
  var R_END = 0.95;          // the sweep stops here; past it only near-zero attention joins
  var R_STILL = 0.66;        // reduced-motion frame: two loops alive, all components merged
  // one loop: nodes fade in, the threshold sweeps, hold, fade out
  var T_IN = 700, T_SWEEP = 9300, T_HOLD = 2200, T_OUT = 800;
  var T_ALL = T_IN + T_SWEEP + T_HOLD + T_OUT;

  function initFiltration(root) {
    var plot = root.querySelector('.tc-plot');
    var card = root.querySelector('.tc-card') || root;
    var foot = document.createElement('div');
    foot.className = 'tc-foot';
    foot.innerHTML = '<button type="button" class="tc-play" aria-label="Pause animation">' +
      '<svg viewBox="0 0 16 16" aria-hidden="true"><path class="tc-ico-pause" d="M4 3h3v10H4zM9 3h3v10H9z"/><path class="tc-ico-play" d="M4 2.5v11l9-5.5z"/></svg></button>';
    card.appendChild(foot);
    var play = foot.querySelector('.tc-play');
    var n = FILT.tokens.length;
    var mergeEdge = {};
    FILT.h0.forEach(function (b) { mergeEdge[b.e[0] + '-' + b.e[1]] = true; });
    var edges = FILT.edges.filter(function (e) { return e[2] <= R_END; });
    var G;                          // current drawing
    var hover = null;               // bar under the pointer (highlighted in the graph)

    function draw() {
      plot.innerHTML = '';
      var W = plot.clientWidth || 640, wide = W >= 540;
      var gw, gh, cx, cy, rad, bx0, bx1, by0, rowsH;
      if (wide) {
        gw = Math.min(380, Math.round(W * 0.54)); gh = gw;
        rad = gw / 2 - 46; cx = gw / 2; cy = gh / 2;
        bx0 = gw + 40; bx1 = W - 10; by0 = 24; rowsH = gh - by0 - 50;
      } else {
        gw = W; rad = Math.min(W / 2 - 54, 150); gh = 2 * rad + 64;
        cx = W / 2; cy = gh / 2;
        bx0 = 30; bx1 = W - 10; by0 = gh + 16; rowsH = 170;
      }
      var H = by0 + rowsH + 46;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
        'aria-label': 'Animation: the 12 tokens of "They are blue and have a very unique look." sit on a circle. As a threshold on one minus attention rises, edges from mBERT layer 2, head 7 appear one by one; the components merge into one by 0.51, then four loops form between 0.58 and 0.78 and are filled in by 0.93. A barcode beside it records each component and loop as a bar from birth to death.' }, plot);

      // --- graph ---
      var P = FILT.tokens.map(function (_, i) {
        var a = -Math.PI / 2 + 2 * Math.PI * i / n;
        return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a), a: a };
      });
      var gAll = el('g', {}, svg);
      var gFill = el('g', { 'aria-hidden': 'true' }, gAll);
      var gEdge = el('g', { 'aria-hidden': 'true', 'stroke-linecap': 'round' }, gAll);
      var gLoop = el('g', { 'aria-hidden': 'true', fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gAll);
      var gHi = el('g', { 'aria-hidden': 'true', fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gAll);
      var gNode = el('g', {}, gAll);
      var E = edges.map(function (e) {
        var merge = !!mergeEdge[e[0] + '-' + e[1]];
        return { i: e[0], j: e[1], w: e[2], merge: merge,
          el: el('line', { x1: P[e[0]].x, y1: P[e[0]].y, x2: P[e[0]].x, y2: P[e[0]].y,
            stroke: merge ? BLUE : '#B9B5AD', 'stroke-width': merge ? 2.4 : 1.3, opacity: 0 }, gEdge) };
      });
      function cyclePath(cyc) {
        return cyc.map(function (k, m) { return (m ? 'L' : 'M') + P[k].x.toFixed(1) + ' ' + P[k].y.toFixed(1); }).join(' ') + ' Z';
      }
      var L1 = FILT.h1.map(function (h) {
        var d = cyclePath(h.cyc);
        return { h: h,
          fill: el('path', { d: d, fill: AMBER, opacity: 0 }, gFill),
          line: el('path', { d: d, stroke: AMBER, 'stroke-width': 2.6, opacity: 0 }, gLoop) };
      });
      var tip = tooltip(plot);
      var nodeR = wide ? 5.5 : 5;
      var N = P.map(function (p, i) {
        var tok = FILT.tokens[i], special = tok.charAt(0) === '[';
        var c = el('circle', { cx: p.x, cy: p.y, r: nodeR, fill: CARD, stroke: SOFTER, 'stroke-width': 1.6 }, gNode);
        var ca = Math.cos(p.a), sa = Math.sin(p.a), off = nodeR + 8;
        var anchor = ca > 0.35 ? 'start' : ca < -0.35 ? 'end' : 'middle';
        var lab = txt(gNode, p.x + off * ca, p.y + off * sa + 4 + (sa > 0.8 ? 6 : sa < -0.8 ? -4 : 0), tok,
          { 'text-anchor': anchor, class: 'tc-tok' + (special ? ' special' : ''), 'font-size': null, fill: null });
        var hit = el('circle', { cx: p.x, cy: p.y, r: 14, fill: 'transparent' }, gNode);
        hit.addEventListener('mousemove', function (e) {
          tip.show('<strong>' + tok + '</strong>' + (special ? '<br><span>' + (i ? 'end-of-sequence token' : 'start-of-sequence token') + '</span>' : ''), e);
        });
        hit.addEventListener('mouseleave', tip.hide);
        return { c: c, lab: lab };
      });

      // --- barcode ---
      var gBar = el('g', {}, svg);
      var X = function (v) { return bx0 + v * (bx1 - bx0); };
      var nH0 = FILT.h0.length + 1, nH1 = FILT.h1.length, gap = 14;
      var step = Math.min(12, (rowsH - gap) / (nH0 + nH1)), th = Math.max(4, step * 0.55);
      [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
        el('line', { x1: X(v), x2: X(v), y1: by0 - 6, y2: by0 + rowsH + 2, stroke: GRID, 'stroke-width': 1 }, gBar);
        txt(gBar, X(v), by0 + rowsH + 18, v === 0 ? '0' : v === 1 ? '1' : String(v).replace(/^0/, ''), { 'text-anchor': 'middle', 'font-size': 11, fill: SOFTER });
      });
      txt(gBar, (X(0) + X(1)) / 2, by0 + rowsH + 38, 'threshold: 1 − attention', { 'text-anchor': 'middle', 'font-size': 11.5, fill: SOFT });
      var rowsY0 = by0, rowsY1 = by0 + nH0 * step + gap;
      hdim(gBar, bx0 - 8, rowsY0 + (nH0 * step) / 2 + 3, '0', { 'text-anchor': 'end', 'font-size': 13, fill: TEXT, 'font-weight': 600 });
      hdim(gBar, bx0 - 8, rowsY1 + (nH1 * step) / 2 + 3, '1', { 'text-anchor': 'end', 'font-size': 13, fill: TEXT, 'font-weight': 600 });
      var bars = [];
      FILT.h0.forEach(function (b, k) { bars.push({ dim: 0, b: 0, d: b.d, e: b.e, y: rowsY0 + k * step }); });
      bars.push({ dim: 0, b: 0, d: Infinity, y: rowsY0 + FILT.h0.length * step });
      FILT.h1.forEach(function (h, k) { bars.push({ dim: 1, b: h.b, d: h.d, cyc: h.cyc, y: rowsY1 + k * step }); });
      bars.forEach(function (b) {
        b.el = el('rect', { x: X(b.b), y: b.y + (step - th) / 2, height: th, width: 0, rx: th / 2, fill: b.dim ? AMBER : BLUE }, gBar);
        var hit = el('rect', { x: bx0 - 30, y: b.y, width: bx1 - bx0 + 30, height: step, fill: 'transparent' }, gBar);
        hit.addEventListener('mousemove', function (e) {
          var t = FILT.tokens;
          var html;
          if (b.dim === 0 && b.d === Infinity) html = '<strong>The last component</strong><br>never dies: everything is connected by 0.51';
          else if (b.dim === 0) html = '<strong>Two components merge</strong> at ' + b.d.toFixed(2) + '<br><span>edge</span> ' + t[b.e[0]] + ' – ' + t[b.e[1]] + ', <span>attention</span> ' + (1 - b.d).toFixed(2);
          else html = '<strong>A loop of ' + b.cyc.length + ' tokens</strong><br>born ' + b.b.toFixed(2) + ', filled in at ' + b.d.toFixed(2);
          tip.show(html, e);
          if (hover !== b) { hover = b; highlight(); }
        });
        hit.addEventListener('mouseleave', function () { tip.hide(); hover = null; highlight(); });
      });
      var sweep = el('line', { x1: X(0), x2: X(0), y1: by0 - 8, y2: by0 + rowsH + 4, stroke: TEXT, 'stroke-width': 1.2, opacity: 0.45 }, gBar);

      function highlight() {
        gHi.innerHTML = '';
        if (!hover || (hover.dim === 0 && !hover.e)) return;
        if (hover.dim === 0) {
          el('line', { x1: P[hover.e[0]].x, y1: P[hover.e[0]].y, x2: P[hover.e[1]].x, y2: P[hover.e[1]].y, stroke: TEXT, 'stroke-width': 3.5 }, gHi);
        } else {
          el('path', { d: cyclePath(hover.cyc), stroke: TEXT, 'stroke-width': 3, 'stroke-dasharray': '1 5' }, gHi);
        }
      }
      G = { svg: svg, all: gAll, E: E, L1: L1, N: N, bars: bars, X: X, sweep: sweep, P: P };
    }

    // Everything on screen is a function of the threshold r (and a fade).
    function render(r, fade, rw) {
      var g = G, X = g.X;
      if (rw === undefined) rw = r;
      var joined = {};
      g.E.forEach(function (e) {
        var p = clamp((rw - e.w) / 0.035, 0, 1);
        if (p > 0) { joined[e.i] = joined[e.j] = true; }
        var q = ease(p), a = g.P[e.i], b = g.P[e.j];
        e.el.setAttribute('x2', a.x + (b.x - a.x) * q);
        e.el.setAttribute('y2', a.y + (b.y - a.y) * q);
        e.el.setAttribute('opacity', p > 0 ? 1 : 0);
      });
      g.N.forEach(function (nd, i) {
        nd.c.setAttribute('fill', joined[i] ? BLUE : CARD);
        nd.c.setAttribute('stroke', joined[i] ? BLUE : SOFTER);
      });
      g.L1.forEach(function (l) {
        var b = l.h.b, d = l.h.d, fo = 0, lo = 0;
        if (rw >= b && rw < d) {             // alive: outlined, lightly tinted
          // stroke at full strength (a half-transparent amber over blue reads brown)
          lo = 1; fo = 0.1 * clamp((rw - b) / 0.03, 0, 1);
        } else if (rw >= d && rw < d + 0.06) { // filled in: a brief wash, then gone
          var f = (rw - d) / 0.06;
          lo = 0; fo = 0.32 * (1 - f);
        }
        l.line.setAttribute('opacity', lo);
        l.fill.setAttribute('opacity', fo);
      });
      g.bars.forEach(function (b) {
        var w = r <= b.b ? 0 : X(Math.min(r, b.d)) - X(b.b);
        b.el.setAttribute('width', Math.max(0, w));
        b.el.setAttribute('opacity', r > b.b ? 1 : 0);
      });
      g.sweep.setAttribute('x1', X(r)); g.sweep.setAttribute('x2', X(r));
      g.all.setAttribute('opacity', fade);
      g.sweep.setAttribute('opacity', 0.45 * fade);
      g.bars.forEach(function (b) { if (fade < 1) b.el.setAttribute('opacity', (r > b.b ? 1 : 0) * fade); });
    }
    function frameAt(t) {                  // t in [0, T_ALL)
      var rw = R_END * (t - T_IN) / T_SWEEP;  // keeps running after the sweep stops
      if (t < T_IN) return { r: 0, rw: 0, fade: t / T_IN };
      if (t < T_IN + T_SWEEP) return { r: rw, rw: rw, fade: 1 };
      if (t < T_IN + T_SWEEP + T_HOLD) return { r: R_END, rw: rw, fade: 1 };
      return { r: R_END, rw: rw, fade: 1 - (t - T_IN - T_SWEEP - T_HOLD) / T_OUT };
    }

    var elapsed = 0, last = null, raf = null, playing = !reduceMotion, visible = false, cur = { r: R_STILL, fade: 1 };
    function tick(now) {
      if (last !== null) elapsed = (elapsed + now - last) % T_ALL;
      last = now;
      cur = frameAt(elapsed);
      render(cur.r, cur.fade, cur.rw);
      raf = requestAnimationFrame(tick);
    }
    function run() {
      var go = playing && visible;
      if (go && raf === null) { last = null; raf = requestAnimationFrame(tick); }
      if (!go && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    }
    function setPlay(on) {
      playing = on;
      root.classList.toggle('tc-paused', !on);
      play.setAttribute('aria-label', on ? 'Pause animation' : 'Play animation');
      run();
    }
    play.addEventListener('click', function () { setPlay(!playing); });

    draw();
    if (reduceMotion) { play.hidden = true; render(R_STILL, 1); }
    else {
      render(0, 0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; run(); }).observe(root);
      } else visible = true;
      setPlay(true);
    }
    return function redraw() { draw(); render(cur.r, cur.fade, cur.rw); };
  }

  // =====================================================================
  // 2. Language effect (results/figures/final/fig1_language_effect_values.csv)
  // z of the language effect (permutation test, 10,000 shuffles) for color
  // terms vs. Dixon's non-color adjectives.
  // [metric, domain, dim, subset, n, z, p]
  // =====================================================================
  var EFFECT = [
    ['bottleneck','adjective',0,'all',720,71.89,9.999e-05],['bottleneck','color',0,'all',680,66.67,9.999e-05],
    ['bottleneck','adjective',0,'lm',309,2.57,0.0196],['bottleneck','color',0,'lm',282,2.656,0.0164],
    ['bottleneck','adjective',1,'all',720,97.83,9.999e-05],['bottleneck','color',1,'all',680,68.28,9.999e-05],
    ['bottleneck','adjective',1,'lm',309,35.75,9.999e-05],['bottleneck','color',1,'lm',282,32.83,9.999e-05],
    ['wasserstein','adjective',0,'all',720,93.84,9.999e-05],['wasserstein','color',0,'all',680,79.67,9.999e-05],
    ['wasserstein','adjective',0,'lm',309,4.078,0.0046],['wasserstein','color',0,'lm',282,4.45,0.0034],
    ['wasserstein','adjective',1,'all',720,112.2,9.999e-05],['wasserstein','color',1,'all',680,54.55,9.999e-05],
    ['wasserstein','adjective',1,'lm',309,35.26,9.999e-05],['wasserstein','color',1,'lm',282,34.11,9.999e-05]
  ];
  function effectRow(metric, domain, dim, subset) {
    for (var i = 0; i < EFFECT.length; i++) {
      var d = EFFECT[i];
      if (d[0] === metric && d[1] === domain && d[2] === dim && d[3] === subset) return { n: d[4], z: d[5], p: d[6] };
    }
  }
  var ROWS = [
    { dim: 0, subset: 'all', label: 'all sentences' }, { dim: 0, subset: 'lm', label: 'length-matched' },
    { dim: 1, subset: 'all', label: 'all sentences' }, { dim: 1, subset: 'lm', label: 'length-matched' }
  ];

  // Static: one panel per distance (Wasserstein above, bottleneck below), drawn
  // at their final positions, no toggle or animation.
  function initEffect(root) {
    var panels = Array.prototype.map.call(root.querySelectorAll('.tc-plot[data-metric]'), function (plot) {
      return { plot: plot, metric: plot.getAttribute('data-metric') };
    });
    function drawPanel(P, last) {
      var plot = P.plot, metric = P.metric;
      plot.innerHTML = '';
      var W = plot.clientWidth || 640, narrow = W < 520;
      var labelW = narrow ? 104 : 150, rowH = 30, groupH = 24, top = 2, axisH = last ? 44 : 22;
      var yEnd = top + 2 * groupH + 4 * rowH + 8;
      var H = yEnd + axisH;
      var m = metric.charAt(0).toUpperCase() + metric.slice(1);
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
        'aria-label': m + ' distance: language effect z for color terms and control adjectives. On all sentences both domains show very large effects on H0 and H1. Matched for length, the H0 effect falls to about z = 3 to 4 while the H1 effect stays near z = 35, and the adjectives sit next to the color terms in every row.' }, plot);
      var x0 = labelW, x1 = W - 46;
      var X = function (v) { return x0 + (v / 120) * (x1 - x0); };
      [0, 25, 50, 75, 100].forEach(function (v) {
        el('line', { x1: X(v), x2: X(v), y1: top, y2: yEnd, stroke: GRID, 'stroke-width': 1 }, svg);
        txt(svg, X(v), yEnd + 16, String(v), { 'text-anchor': 'middle', 'font-size': 11, fill: SOFTER });
      });
      if (last) txt(svg, (x0 + x1) / 2, yEnd + 36, 'language effect (z against shuffled languages)', { 'text-anchor': 'middle', 'font-size': 11.5, fill: SOFT });
      var tip = tooltip(plot), y = top;
      ROWS.forEach(function (R, i) {
        if (i % 2 === 0) {
          var g = txt(svg, 0, y + 16, R.dim ? 'Loops ' : 'Components ', { fill: TEXT, 'font-size': 13, 'font-weight': 600 });
          var s = el('tspan', { 'font-weight': 400, fill: SOFT }, g); s.textContent = '(H';
          var sub = el('tspan', { 'font-size': '0.72em', dy: 3, 'font-weight': 400, fill: SOFT }, g); sub.textContent = R.dim;
          var cl = el('tspan', { dy: -3, 'font-weight': 400, fill: SOFT }, g); cl.textContent = ')';
          y += groupH;
        }
        var cy = y + rowH / 2;
        var c = effectRow(metric, 'color', R.dim, R.subset), a = effectRow(metric, 'adjective', R.dim, R.subset);
        txt(svg, narrow ? 8 : 14, cy + 4, R.label, { fill: TEXT, 'font-size': 12.5 });
        el('line', { x1: X(Math.min(c.z, a.z)), x2: X(Math.max(c.z, a.z)), y1: cy, y2: cy, stroke: '#C9C6BF', 'stroke-width': 2 }, svg);
        // the two series sit a few px apart vertically so near-ties stay visible
        el('circle', { cx: X(a.z), cy: cy + 3.5, r: 5.5, fill: AMBER, stroke: CARD, 'stroke-width': 1.5 }, svg);
        el('circle', { cx: X(c.z), cy: cy - 3.5, r: 5.5, fill: BLUE, stroke: CARD, 'stroke-width': 1.5 }, svg);
        var val = txt(svg, X(Math.max(c.z, a.z)) + 11, cy + 4, 'z ≈ ' + Math.round(Math.max(c.z, a.z)), { 'font-size': 11, fill: SOFT });
        var bb = val.getBBox ? val.getBBox() : null;
        if (bb && bb.x + bb.width > X(120) + 34) { val.setAttribute('x', X(Math.min(c.z, a.z)) - 11); val.setAttribute('text-anchor', 'end'); }
        var hit = el('rect', { x: 0, y: cy - rowH / 2, width: W, height: rowH, fill: 'transparent' }, svg);
        hit.addEventListener('mousemove', function (e) {
          tip.show('<span>' + m + ', H' + R.dim + ', ' + R.label + '</span>' +
            '<br><strong>color terms</strong> z = ' + c.z.toFixed(1) + ', ' + fmtP(c.p) + ', N = ' + c.n +
            '<br><strong>adjectives</strong> z = ' + a.z.toFixed(1) + ', ' + fmtP(a.p) + ', N = ' + a.n, e);
        });
        hit.addEventListener('mouseleave', tip.hide);
        y += rowH;
        if (i === 1) y += 8;
      });
    }
    function drawAll() { panels.forEach(function (P, i) { drawPanel(P, i === panels.length - 1); }); }
    drawAll();
    return drawAll;
  }

  // =====================================================================
  // 3. Per-head effects (results/phase3_diagram_distances/
  // language_effect_color_wasserstein.csv, subset = length_matched, N = 282).
  // z[layer][head]; sig = passes Benjamini-Hochberg.
  // =====================================================================
  var HEADS = {"h0":{"z":[[0.11,5.61,2.57,-1.23,0.9,-0.3,1.39,-0.55,15.05,28.68,1.28,-0.56],[47.9,3.99,4.41,13.72,7.93,-1.0,28.42,2.9,40.86,6.48,18.75,3.31],[3.61,-0.54,16.79,3.64,0.71,4.53,26.99,2.54,64.14,35.65,7.14,0.42],[7.95,2.83,-0.78,-1.44,0.95,5.62,2.92,-1.01,-0.66,-0.96,1.34,5.59],[1.29,12.17,-1.77,62.45,0.55,0.22,6.4,14.01,8.55,1.8,2.6,-0.27],[-2.07,4.32,-1.86,9.92,0.38,-1.73,-0.8,-0.93,-0.26,11.52,6.94,-2.22],[-0.91,2.82,0.16,1.94,1.03,1.87,-1.8,10.95,-0.96,20.21,2.92,-0.33],[-1.29,-1.67,-1.59,0.6,-1.09,-1.98,-0.53,-1.48,0.54,-1.02,-1.29,4.74],[0.17,-0.22,1.03,-1.65,-1.22,0.08,-0.65,-1.89,-1.61,-1.76,-1.72,-1.85],[-1.33,-0.79,-1.14,-1.85,-1.61,-2.03,1.52,-0.67,-1.49,8.9,13.16,-1.85],[6.95,-1.34,-1.12,7.57,-0.98,-1.77,-1.42,-0.46,1.5,-1.12,2.66,-1.17],[-1.12,-0.86,-1.43,0.97,2.0,-2.03,-1.04,40.02,-0.35,0.24,0.44,-1.08]],"sig":[[0,1,0,0,0,0,0,0,1,1,0,0],[1,1,1,1,1,0,1,0,1,1,1,1],[1,0,1,1,0,1,1,0,1,1,1,0],[1,0,0,0,0,1,0,0,0,0,0,1],[0,1,0,1,0,0,1,1,1,0,0,0],[0,1,0,1,0,0,0,0,0,1,1,0],[0,0,0,0,0,0,0,1,0,1,0,0],[0,0,0,0,0,0,0,0,0,0,0,1],[0,0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,1,1,0],[1,0,0,1,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,1,0,0,0,0]]},"h1":{"z":[[25.41,36.37,25.65,10.19,39.01,0.11,3.21,41.21,26.82,6.53,19.08,41.53],[-0.33,-0.13,1.33,4.3,5.22,3.79,8.64,4.4,12.32,6.67,17.12,21.54],[5.88,10.6,5.37,0.12,-0.14,5.13,1.24,2.23,13.23,9.65,3.98,24.85],[2.56,7.86,-1.09,2.85,2.66,0.74,6.01,0.84,11.57,-0.24,0.88,15.18],[0.0,0.98,2.01,5.73,2.92,2.51,6.71,0.95,1.06,4.89,2.41,1.69],[1.63,2.44,-0.32,7.58,4.31,1.68,5.52,5.36,2.95,22.99,6.43,0.91],[3.45,3.23,1.02,1.86,0.92,5.49,1.0,6.81,0.81,6.12,3.38,4.71],[2.37,-0.05,0.3,5.62,0.47,-0.33,-0.6,2.47,10.78,1.48,0.67,14.99],[2.67,2.58,0.84,-0.57,5.86,1.3,2.16,1.12,2.3,2.15,4.18,0.13],[2.18,-0.45,0.45,1.61,1.84,-0.7,4.79,2.6,6.18,2.0,9.47,0.37],[8.8,4.19,1.08,5.76,4.39,0.18,8.75,5.26,2.43,0.95,1.41,2.22],[1.35,11.23,1.57,14.81,1.91,0.53,4.86,9.08,8.25,20.9,17.85,6.32]],"sig":[[1,1,1,1,1,0,1,1,1,1,1,1],[0,0,0,1,1,1,1,1,1,1,1,1],[1,1,1,0,0,1,0,0,1,1,1,1],[1,1,0,1,1,0,1,0,1,0,0,1],[0,0,0,1,1,1,1,0,0,1,1,0],[0,1,0,1,1,0,1,1,1,1,1,0],[1,1,0,0,0,1,0,1,0,1,1,1],[1,0,0,1,0,0,0,1,1,0,0,1],[1,1,0,0,1,0,0,0,1,0,1,0],[0,0,0,0,0,0,1,1,1,0,1,0],[1,1,0,1,1,0,1,1,1,0,0,0],[0,1,0,1,0,0,1,1,1,1,1,1]]}};
  // matplotlib "Blues", on a square-root scale clipped at 0, shared by both panels (as in fig2).
  var BLUES = ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'];
  var ZMAX = 65;
  function hexrgb(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  var BRGB = BLUES.map(hexrgb);
  function blueT(z) { return Math.sqrt(clamp(z, 0, ZMAX) / ZMAX); }
  function blue(z) {
    var t = 0.06 + 0.94 * blueT(z), s = t * (BRGB.length - 1);
    var i = Math.min(BRGB.length - 2, Math.floor(s)), f = s - i;
    return 'rgb(' + BRGB[i].map(function (a, k) { return Math.round(a + (BRGB[i + 1][k] - a) * f); }).join(',') + ')';
  }
  function countSig(dim) {
    return HEADS[dim].sig.reduce(function (s, r) { return s + r.reduce(function (a, b) { return a + b; }, 0); }, 0);
  }

  // Static: H0 and H1 side by side (stacked on narrow screens), one shared colour scale.
  function initHeads(root) {
    var plot = root.querySelector('.tc-plot');
    function draw() {
      plot.innerHTML = '';
      var W = plot.clientWidth || 640, stack = W < 520;
      var left = 30, top = 22, gap = 2, colGap = 26;
      var panelW = stack ? W : (W - colGap) / 2;
      var cell = Math.min(30, Math.floor((panelW - left - gap * 11) / 12));
      var size = cell * 12 + gap * 11;
      var panelH = top + size + 34;
      var nRows = stack ? 2 : 1;
      var scaleY = nRows * panelH + 26;
      var H = scaleY + 30;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
        'aria-label': 'Two heatmaps of the length-matched language effect for color terms in each of mBERT\'s 144 attention heads, 12 layers by 12 heads. For components (H0), 41 heads are significant, mostly in the early layers; for loops (H1), 85 heads are significant, spread across all layers and strongest in layer 0.' }, plot);
      var pos = function (k) { return k * (cell + gap); };
      var tip = tooltip(plot), fs = 10;
      ['h0', 'h1'].forEach(function (dim, p) {
        var ox = stack ? 0 : p * (panelW + colGap), oy = stack ? p * panelH : 0;
        var gx = ox + left, gy = oy + top;
        var t = txt(svg, gx, oy + 12, dim === 'h0' ? 'Components ' : 'Loops ', { fill: TEXT, 'font-size': 13, 'font-weight': 600 });
        var a1 = el('tspan', { 'font-weight': 400, fill: SOFT }, t); a1.textContent = '(H';
        var a2 = el('tspan', { 'font-size': '0.72em', dy: 3, 'font-weight': 400, fill: SOFT }, t); a2.textContent = dim.charAt(1);
        var a3 = el('tspan', { dy: -3, 'font-weight': 400, fill: SOFT }, t); a3.textContent = ')';
        var a4 = el('tspan', { 'font-weight': 400, fill: SOFTER, 'font-size': 11.5 }, t); a4.textContent = '  ' + countSig(dim) + ' of 144 significant';
        for (var L = 0; L < 12; L++) for (var Hh = 0; Hh < 12; Hh++) {
          var z = HEADS[dim].z[L][Hh], sig = HEADS[dim].sig[L][Hh];
          var rect = el('rect', { x: gx + pos(Hh), y: gy + pos(L), width: cell, height: cell, rx: 2, fill: blue(z),
            'data-d': dim, 'data-l': L, 'data-h': Hh }, svg);
          if (sig) el('circle', { cx: gx + pos(Hh) + cell / 2, cy: gy + pos(L) + cell / 2, r: Math.max(1.6, cell * 0.09),
            fill: blueT(z) > 0.55 ? '#FFFFFF' : TEXT, 'pointer-events': 'none' }, svg);
        }
        for (var k = 0; k < 12; k += (cell < 20 ? 2 : 1)) {
          txt(svg, gx - 5, gy + pos(k) + cell / 2 + 3.5, String(k), { 'text-anchor': 'end', 'font-size': fs, fill: SOFTER });
          txt(svg, gx + pos(k) + cell / 2, gy + size + 13, String(k), { 'text-anchor': 'middle', 'font-size': fs, fill: SOFTER });
        }
        txt(svg, 0, 0, 'Layer', { 'text-anchor': 'middle', 'font-size': 11, fill: SOFT,
          transform: 'translate(' + (ox + 8) + ',' + (gy + size / 2) + ') rotate(-90)' });
        txt(svg, gx + size / 2, gy + size + 28, 'Head', { 'text-anchor': 'middle', 'font-size': 11, fill: SOFT });
      });
      // shared colour scale (square-root positions)
      var sx0 = left, sw = Math.min(300, W - left - 10);
      var defs = el('defs', {}, svg);
      var grad = el('linearGradient', { id: 'tc-blues', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
      for (var s = 0; s <= 10; s++) el('stop', { offset: s / 10, 'stop-color': blue(ZMAX * Math.pow(s / 10, 2)) }, grad);
      el('rect', { x: sx0, y: scaleY, width: sw, height: 8, rx: 4, fill: 'url(#tc-blues)' }, svg);
      [0, 2, 5, 10, 20, 40, 60].forEach(function (v) {
        txt(svg, sx0 + sw * blueT(v), scaleY + 22, String(v), { 'text-anchor': 'middle', 'font-size': 10.5, fill: SOFTER });
      });
      txt(svg, sx0, scaleY - 7, 'language effect (z), square-root scale', { 'font-size': 11, fill: SOFT });
      svg.addEventListener('mousemove', function (e) {
        var d = e.target.getAttribute && e.target.getAttribute('data-d');
        if (!d) { tip.hide(); return; }
        var L = +e.target.getAttribute('data-l'), Hh = +e.target.getAttribute('data-h');
        tip.show('H' + d.charAt(1) + ', layer ' + L + ', head ' + Hh + ': <strong>z = ' + HEADS[d].z[L][Hh].toFixed(1) + '</strong><br><span>' +
          (HEADS[d].sig[L][Hh] ? 'significant after BH correction' : 'not significant') + '</span>', e);
      });
      svg.addEventListener('mouseleave', tip.hide);
    }
    draw();
    return draw;
  }

  // =====================================================================
  // 4. Russian blues (results/phase3_diagram_distances/robustness_summary.csv):
  // p and z of the per-term / zoom permutation tests, order W-H0, W-H1, B-H0, B-H1.
  // =====================================================================
  var BLUE_GROUPS = [
    { label: 'синий vs. голубой', p: [0.9101, 0.7624, 0.9697, 0.5688], z: [-0.11, 0.29, -0.04, 0.56] },
    { label: '{blue, azul, синий}', p: [0.0963, 0.0685, 0.1464, 0.0439], z: [1.66, 1.81, 1.46, 2.01] },
    { label: '{blue, azul, голубой}', p: [0.5226, 0.3362, 0.5235, 0.9796], z: [-0.63, -0.96, -0.64, 0.03] }
  ];
  var BLUE_ROWS = [['Wasserstein', 0], ['Wasserstein', 1], ['Bottleneck', 0], ['Bottleneck', 1]];

  function initBlue(root) {
    var plot = root.querySelector('.tc-plot');
    var marks = [], shown = false, X;
    var PMIN = 0.01, PMAX = 1;
    function draw() {
      plot.innerHTML = '';
      var W = plot.clientWidth || 640, narrow = W < 520;
      var labelW = narrow ? 108 : 150, rowH = 24, groupH = 28, top = 26, axisH = 44;
      var H = top + BLUE_GROUPS.length * (groupH + 4 * rowH + 8) + axisH;
      var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
        'aria-label': 'Permutation-test p-values on a log scale. Синий versus голубой: all four tests between 0.57 and 0.97. The triple with синий: 0.04 to 0.15, only bottleneck H1 below 0.05. The triple with голубой: 0.34 to 0.98.' }, plot);
      var x0 = labelW, x1 = W - 16;
      var lg = function (v) { return Math.log(v) / Math.LN10; };
      X = function (p) { return x0 + (lg(clamp(p, PMIN, PMAX)) - lg(PMIN)) / (lg(PMAX) - lg(PMIN)) * (x1 - x0); };
      var yEnd = H - axisH;
      [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].forEach(function (v) {
        el('line', { x1: X(v), x2: X(v), y1: top - 4, y2: yEnd, stroke: GRID, 'stroke-width': 1 }, svg);
        if (narrow && (v === 0.02 || v === 0.2)) return;
        txt(svg, X(v), yEnd + 16, String(v).replace(/^0\./, '.'), { 'text-anchor': 'middle', 'font-size': 11, fill: SOFTER });
      });
      txt(svg, (x0 + x1) / 2, yEnd + 36, 'permutation p-value (log scale)', { 'text-anchor': 'middle', 'font-size': 11.5, fill: SOFT });
      el('line', { x1: X(0.05), x2: X(0.05), y1: top - 10, y2: yEnd, stroke: REF, 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }, svg);
      txt(svg, X(0.05), top - 14, 'p = 0.05', { 'text-anchor': 'middle', 'font-size': 11, fill: SOFT });
      var tip = tooltip(plot);
      marks = [];
      var y = top;
      BLUE_GROUPS.forEach(function (g) {
        txt(svg, 0, y + 19, g.label, { fill: TEXT, 'font-size': 13, 'font-weight': 600 });
        y += groupH;
        BLUE_ROWS.forEach(function (R, k) {
          var cy = y + rowH / 2;
          var lab = txt(svg, narrow ? 8 : 14, cy + 4, R[0] + ' ', { fill: TEXT, 'font-size': 12 });
          var h = el('tspan', { fill: SOFT }, lab); h.textContent = 'H';
          var sb = el('tspan', { 'font-size': '0.72em', dy: 3, fill: SOFT }, lab); sb.textContent = R[1];
          var p = g.p[k], sig = p < 0.05;
          var c = el('circle', { cx: X(1), cy: cy, r: 5.5, fill: sig ? BLUE : CARD, stroke: BLUE, 'stroke-width': 2, opacity: 0 }, svg);
          marks.push({ c: c, p: p });
          var hit = el('rect', { x: 0, y: cy - rowH / 2, width: W, height: rowH, fill: 'transparent' }, svg);
          hit.addEventListener('mousemove', function (e) {
            tip.show('<span>' + g.label + ', ' + R[0] + ' H' + R[1] + '</span><br><strong>' + fmtP(p) + '</strong>, z = ' + g.z[k].toFixed(2), e);
          });
          hit.addEventListener('mouseleave', tip.hide);
          y += rowH;
        });
        y += 8;
      });
    }
    function settle() { marks.forEach(function (m) { m.c.setAttribute('cx', X(m.p)); m.c.setAttribute('opacity', 1); }); }
    draw();
    onVisible(plot, function (instant) {
      shown = true;
      if (instant) { settle(); return; }
      marks.forEach(function (m, i) {
        setTimeout(function () {
          tween(900, function (p) {
            var lp = Math.log(PMAX) + (Math.log(m.p) - Math.log(PMAX)) * p;
            m.c.setAttribute('cx', X(Math.exp(lp)));
            m.c.setAttribute('opacity', Math.min(1, p * 3));
          });
        }, i * 70);
      });
    });
    return function redraw() { draw(); if (shown) settle(); };
  }

  // ---------- boot ----------
  function init() {
    var redraws = [];
    var a = document.getElementById('tc-filtration'); if (a) redraws.push(initFiltration(a));
    var b = document.getElementById('tc-effect'); if (b) redraws.push(initEffect(b));
    var c = document.getElementById('tc-heads'); if (c) redraws.push(initHeads(c));
    var d = document.getElementById('tc-blue'); if (d) redraws.push(initBlue(d));
    var lastW = window.innerWidth, t = null;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;   // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () { redraws.forEach(function (f) { f(); }); }, 150);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
