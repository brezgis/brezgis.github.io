// NeurReps 2026: second-order similarity (Spearman correlation between RDMs)
// for 6 languages x 5 encoders. The cells bloom in one by one the first time
// the heatmap scrolls into view, then stay; a replay button runs it again.
(function () {
  var LANGS = ['English', 'Russian', 'Spanish', 'Italian', 'Greek', 'Turkish'];
  var CODES = ['EN', 'RU', 'ES', 'IT', 'EL', 'TR'];
  var MODELS = ['mBERT', 'XLM-R', 'XLM-R-L', 'mDeBERTa', 'mmBERT'];
  // Language-major order; from ph-project-v2 results/second_order_exploratory_20260824.
  var M = [[1.0,0.613,0.638,0.83,0.667,0.288,0.202,0.309,0.624,-0.122,0.378,0.172,0.295,0.348,0.454,0.125,0.216,0.468,0.288,0.207,0.045,-0.042,0.003,0.316,0.064,0.252,0.135,0.077,0.38,0.136],[0.613,1.0,0.739,0.621,0.608,-0.015,0.054,0.083,0.334,-0.084,0.357,-0.05,-0.008,0.123,0.163,0.125,0.176,0.317,0.167,-0.051,0.251,0.276,0.216,0.497,-0.134,0.35,0.217,-0.002,0.35,0.237],[0.638,0.739,1.0,0.59,0.469,0.018,-0.014,0.012,0.273,-0.111,0.276,-0.055,0.007,0.181,0.175,0.185,0.078,0.259,0.131,0.05,0.05,0.083,0.114,0.422,-0.076,0.256,0.196,0.013,0.26,0.191],[0.83,0.621,0.59,1.0,0.567,0.101,0.019,0.196,0.62,-0.041,0.28,0.168,0.165,0.453,0.468,-0.028,0.088,0.404,0.313,0.212,-0.044,0.163,0.111,0.426,-0.039,0.279,0.016,0.004,0.488,0.161],[0.667,0.608,0.469,0.567,1.0,0.282,0.278,0.336,0.462,-0.014,0.415,0.19,0.213,0.379,0.496,0.132,0.27,0.488,0.314,0.213,0.216,0.089,0.112,0.317,-0.059,0.222,0.292,0.189,0.44,0.299],[0.288,-0.015,0.018,0.101,0.282,1.0,0.72,0.62,0.569,0.014,0.347,0.469,0.406,0.166,0.424,0.279,0.29,0.348,0.236,0.15,0.169,-0.117,0.012,0.181,0.018,-0.031,0.17,0.228,0.193,0.072],[0.202,0.054,-0.014,0.019,0.278,0.72,1.0,0.692,0.499,0.049,0.563,0.505,0.424,0.245,0.433,0.391,0.454,0.377,0.348,0.174,0.422,0.168,0.06,0.405,0.109,0.229,0.354,0.231,0.216,0.166],[0.309,0.083,0.012,0.196,0.336,0.62,0.692,1.0,0.667,0.025,0.407,0.401,0.43,0.366,0.448,0.209,0.288,0.361,0.252,0.131,0.406,0.286,0.281,0.505,0.346,0.43,0.449,0.312,0.348,0.371],[0.624,0.334,0.273,0.62,0.462,0.569,0.499,0.667,1.0,-0.004,0.344,0.408,0.449,0.46,0.572,0.082,0.094,0.33,0.443,0.124,0.16,0.119,0.082,0.4,0.188,0.153,0.216,0.115,0.437,0.242],[-0.122,-0.084,-0.111,-0.041,-0.014,0.014,0.049,0.025,-0.004,1.0,0.047,0.247,0.192,0.173,0.077,0.05,0.124,0.092,0.149,0.099,0.135,-0.17,-0.165,-0.012,-0.147,0.192,0.03,-0.027,0.076,0.205],[0.378,0.357,0.276,0.28,0.415,0.347,0.563,0.407,0.344,0.047,1.0,0.478,0.473,0.421,0.511,0.521,0.58,0.487,0.59,0.245,0.308,0.221,0.092,0.369,0.028,0.362,0.219,0.244,0.114,0.207],[0.172,-0.05,-0.055,0.168,0.19,0.469,0.505,0.401,0.408,0.247,0.478,1.0,0.75,0.654,0.601,0.112,0.16,0.236,0.318,0.06,0.148,0.024,-0.01,0.114,-0.046,0.008,-0.056,0.027,0.118,-0.071],[0.295,-0.008,0.007,0.165,0.213,0.406,0.424,0.43,0.449,0.192,0.473,0.75,1.0,0.512,0.605,0.181,0.143,0.218,0.355,0.068,0.098,-0.083,-0.106,0.008,0.006,-0.002,0.056,0.088,0.034,0.033],[0.348,0.123,0.181,0.453,0.379,0.166,0.245,0.366,0.46,0.173,0.421,0.654,0.512,1.0,0.684,0.032,-0.017,0.26,0.48,0.066,0.065,0.124,0.02,0.268,0.009,0.17,0.029,0.018,0.29,0.093],[0.454,0.163,0.175,0.468,0.496,0.424,0.433,0.448,0.572,0.077,0.511,0.601,0.605,0.684,1.0,0.181,0.29,0.526,0.446,0.199,0.146,0.099,0.045,0.166,0.071,0.01,-0.047,-0.032,0.17,-0.007],[0.125,0.125,0.185,-0.028,0.132,0.279,0.391,0.209,0.082,0.05,0.521,0.112,0.181,0.032,0.181,1.0,0.624,0.55,0.539,0.298,0.3,0.213,0.088,0.129,-0.061,0.207,0.441,0.554,0.14,0.171],[0.216,0.176,0.078,0.088,0.27,0.29,0.454,0.288,0.094,0.124,0.58,0.16,0.143,-0.017,0.29,0.624,1.0,0.661,0.382,0.382,0.282,0.235,0.045,0.153,-0.103,0.374,0.363,0.301,0.123,0.078],[0.468,0.317,0.259,0.404,0.488,0.348,0.377,0.361,0.33,0.092,0.487,0.236,0.218,0.26,0.526,0.55,0.661,1.0,0.44,0.382,0.152,0.142,0.088,0.056,-0.081,0.242,0.118,0.16,0.228,0.069],[0.288,0.167,0.131,0.313,0.314,0.236,0.348,0.252,0.443,0.149,0.59,0.318,0.355,0.48,0.446,0.539,0.382,0.44,1.0,0.373,0.127,0.07,-0.091,0.174,-0.077,0.122,0.21,0.201,0.272,0.306],[0.207,-0.051,0.05,0.212,0.213,0.15,0.174,0.131,0.124,0.099,0.245,0.06,0.068,0.066,0.199,0.298,0.382,0.382,0.373,1.0,0.14,-0.013,-0.062,0.062,-0.111,0.093,0.09,0.11,0.22,0.169],[0.045,0.251,0.05,-0.044,0.216,0.169,0.422,0.406,0.16,0.135,0.308,0.148,0.098,0.065,0.146,0.3,0.282,0.152,0.127,0.14,1.0,0.463,0.401,0.549,0.393,0.376,0.508,0.18,0.246,0.404],[-0.042,0.276,0.083,0.163,0.089,-0.117,0.168,0.286,0.119,-0.17,0.221,0.024,-0.083,0.124,0.099,0.213,0.235,0.142,0.07,-0.013,0.463,1.0,0.712,0.621,0.292,0.434,0.347,0.16,0.243,0.274],[0.003,0.216,0.114,0.111,0.112,0.012,0.06,0.281,0.082,-0.165,0.092,-0.01,-0.106,0.02,0.045,0.088,0.045,0.088,-0.091,-0.062,0.401,0.712,1.0,0.563,0.342,0.317,0.202,0.132,0.185,0.267],[0.316,0.497,0.422,0.426,0.317,0.181,0.405,0.505,0.4,-0.012,0.369,0.114,0.008,0.268,0.166,0.129,0.153,0.056,0.174,0.062,0.549,0.621,0.563,1.0,0.253,0.664,0.529,0.23,0.526,0.51],[0.064,-0.134,-0.076,-0.039,-0.059,0.018,0.109,0.346,0.188,-0.147,0.028,-0.046,0.006,0.009,0.071,-0.061,-0.103,-0.081,-0.077,-0.111,0.393,0.292,0.342,0.253,1.0,0.205,0.253,0.129,0.03,0.296],[0.252,0.35,0.256,0.279,0.222,-0.031,0.229,0.43,0.153,0.192,0.362,0.008,-0.002,0.17,0.01,0.207,0.374,0.242,0.122,0.093,0.376,0.434,0.317,0.664,0.205,1.0,0.505,0.257,0.243,0.523],[0.135,0.217,0.196,0.016,0.292,0.17,0.354,0.449,0.216,0.03,0.219,-0.056,0.056,0.029,-0.047,0.441,0.363,0.118,0.21,0.09,0.508,0.347,0.202,0.529,0.253,0.505,1.0,0.731,0.507,0.57],[0.077,-0.002,0.013,0.004,0.189,0.228,0.231,0.312,0.115,-0.027,0.244,0.027,0.088,0.018,-0.032,0.554,0.301,0.16,0.201,0.11,0.18,0.16,0.132,0.23,0.129,0.257,0.731,1.0,0.442,0.381],[0.38,0.35,0.26,0.488,0.44,0.193,0.216,0.348,0.437,0.076,0.114,0.118,0.034,0.29,0.17,0.14,0.123,0.228,0.272,0.22,0.246,0.243,0.185,0.526,0.03,0.243,0.507,0.442,1.0,0.413],[0.136,0.237,0.191,0.161,0.299,0.072,0.166,0.371,0.242,0.205,0.207,-0.071,0.033,0.093,-0.007,0.171,0.078,0.069,0.306,0.169,0.404,0.274,0.267,0.51,0.296,0.523,0.57,0.381,0.413,1.0]];

  // RdBu (reversed), centered at 0 with vmin -0.25 / vmax 0.85, as in the paper figure.
  var STOPS = ['#053061','#2166ac','#4393c3','#92c5de','#d1e5f0','#f7f7f7','#fddbc7','#f4a582','#d6604d','#b2182b','#67001f'];
  var VMIN = -0.25, VMAX = 0.85, NEUTRAL = '#f7f7f7', SELF = '#ECEAE5';
  function hex(h) { return [1, 3, 5].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  var RGB = STOPS.map(hex);
  function color(v) {
    var t = v < 0 ? 0.5 * (1 - v / VMIN) : 0.5 + 0.5 * Math.min(v, VMAX) / VMAX;
    t = Math.max(0, Math.min(1, t)) * (RGB.length - 1);
    var i = Math.min(RGB.length - 2, Math.floor(t)), f = t - i;
    var c = RGB[i].map(function (a, k) { return Math.round(a + (RGB[i + 1][k] - a) * f); });
    return 'rgb(' + c.join(',') + ')';
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }

  function draw(root) {
    var plot = root.querySelector('.rsa-plot');
    plot.innerHTML = '';
    var W = plot.clientWidth || 640, narrow = W < 520;
    var N = 30, B = 5, gap = narrow ? 2 : 3;
    var left = narrow ? 54 : 74, right = narrow ? 6 : 64, top = 4, bottom = narrow ? 24 : 28;
    var cell = Math.floor((W - left - right - gap * 5) / N);
    var size = cell * N + gap * 5;
    var H = top + size + bottom;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': 'Heatmap of Spearman correlations between the color-term RDMs of five multilingual encoders in six languages. Correlations are highest within a language and generally positive across languages.' }, plot);
    var pos = function (k) { return Math.floor(k / B) * gap + k * cell; };
    // A faint ghost grid underneath, so the structure shows before the colors bloom in.
    var ghosts = el('g', { 'aria-hidden': 'true' }, svg);
    for (var gr = 0; gr < N; gr++) {
      for (var gc = 0; gc < N; gc++) {
        el('rect', { x: left + pos(gc), y: top + pos(gr), width: cell, height: cell, class: 'rsa-ghost' }, ghosts);
      }
    }
    var cells = [];
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var self = r === c;
        var rect = el('rect', { x: left + pos(c), y: top + pos(r), width: cell, height: cell, class: 'rsa-cell' }, svg);
        cells.push({ el: rect, r: r, c: c, fill: self ? SELF : color(M[r][c]), self: self });
      }
    }
    var fs = narrow ? 11 : 13;
    LANGS.forEach(function (name, k) {
      var mid = pos(k * B) + (B * cell) / 2;
      txt(svg, left - 8, top + mid + 4, narrow ? CODES[k] : name, { 'text-anchor': 'end', class: 'rsa-lang', 'font-size': fs });
      txt(svg, left + mid, top + size + (narrow ? 16 : 19), narrow ? CODES[k] : name, { 'text-anchor': 'middle', class: 'rsa-lang', 'font-size': fs });
    });
    if (!narrow) {
      for (var r2 = 0; r2 < N; r2++) {
        txt(svg, left + size + 6, top + pos(r2) + cell / 2 + 3, MODELS[r2 % B], { class: 'rsa-model', 'font-size': 8.5 });
      }
    }

    // Hover: which two encoders, and the correlation.
    var tip = document.createElement('div');
    tip.className = 'rsa-tip';
    plot.appendChild(tip);
    svg.addEventListener('mousemove', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('rsa-cell')) { tip.classList.remove('show'); return; }
      var d = cells[Array.prototype.indexOf.call(svg.querySelectorAll('.rsa-cell'), t)];
      var a = LANGS[Math.floor(d.r / B)] + ' ' + MODELS[d.r % B], b = LANGS[Math.floor(d.c / B)] + ' ' + MODELS[d.c % B];
      tip.innerHTML = d.self ? a + '<br><span>itself</span>' : a + '<br>× ' + b + '<br><strong>ρ = ' + M[d.r][d.c].toFixed(2) + '</strong>';
      var box = plot.getBoundingClientRect();
      tip.classList.add('show');
      tip.style.left = Math.min(e.clientX - box.left + 12, box.width - tip.offsetWidth - 4) + 'px';
      tip.style.top = (e.clientY - box.top + 12) + 'px';
    });
    svg.addEventListener('mouseleave', function () { tip.classList.remove('show'); });
    return cells;
  }

  function init(root) {
    var cells = draw(root);
    if (reduceMotion) {
      cells.forEach(function (d) { d.el.style.fill = d.fill; d.el.style.opacity = 1; });
      return;
    }
    // Bloom in once, the first time it's on screen, then stay so it can be read.
    // The replay button runs it again.
    function shuffle(a) {
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function bloom() {
      var order = shuffle(cells.map(function (_, i) { return i; }));
      var span = 4500;
      order.forEach(function (idx, k) {
        var d = cells[idx], delay = (k / order.length) * span + Math.random() * 220;
        d.el.style.transition = 'none';
        d.el.style.opacity = 0;
        d.el.style.fill = NEUTRAL;
        d.el.getBoundingClientRect();
        d.el.style.transition = 'opacity 0.5s ease ' + delay + 'ms, fill 1.1s ease ' + (delay + 250) + 'ms';
        d.el.style.opacity = 1;
        d.el.style.fill = d.fill;
      });
    }
    function settle() {               // final state, no animation
      cells.forEach(function (d) { d.el.style.transition = 'none'; d.el.style.opacity = 1; d.el.style.fill = d.fill; });
    }
    var played = false;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !played) { played = true; io.disconnect(); bloom(); }
      }, { threshold: 0.25 });
      io.observe(root);
    } else {
      played = true;
      bloom();
    }
    var replay = root.querySelector('.rsa-replay');
    if (replay) {
      replay.hidden = false;
      replay.addEventListener('click', function () {
        played = true;
        cells.forEach(function (d) { d.el.style.transition = 'opacity 0.35s ease'; d.el.style.opacity = 0; });
        setTimeout(bloom, 400);
      });
    }
    var lastW = window.innerWidth, t = null;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () {
        cells = draw(root);
        if (played) settle();
      }, 200);
    });
  }

  function start() {
    var root = document.getElementById('rsa-heatmap');
    if (root) init(root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
