// Metaphor project page: the pair-highlighting demo and two small SVG charts.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Demo: which words is it judging? ----------
  // Real LCC (English small) sentences, each holding a metaphorical and a
  // literal pair. Scores are the mean human rating, 0-3.
  var SENTENCES = [
    { words: ['Democracy', 'is', 'fun', '...', 'democracy', 'with', 'a', 'jambox', 'is', 'better.'],
      pairs: [{ src: 2, tgt: 0, label: 'metaphor', score: '2' },
              { src: 7, tgt: 4, label: 'literal', score: '0' }] },
    { words: ['AT&amp;T', 'agrees', 'to', 'help', 'fight', 'childhood', 'hunger'],
      pairs: [{ src: 4, tgt: 6, label: 'metaphor', score: '3' },
              { src: 5, tgt: 6, label: 'literal', score: '0' }] },
    { words: ['They', 'awfully', 'good', 'at', 'spending', 'Monopoly', 'Money.'],
      pairs: [{ src: 5, tgt: 6, label: 'metaphor', score: '3' },
              { src: 4, tgt: 6, label: 'literal', score: '0' }] }
  ];

  // Ambient loop: words drift in, a gray underline sweeps the whole sentence
  // (all a sentence-level model sees), then each labeled pair lights up with
  // an arc from source to target. No captions; the motion carries it.
  var NSD = 'http://www.w3.org/2000/svg';
  function initDemo(root) {
    root.innerHTML =
      '<div class="mx-stage"><p class="mx-sentence"></p>' +
      '<svg class="mx-arcs" aria-hidden="true">' +
      '<defs>' +
      '<marker id="mx-head-metaphor" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="#C47A2C"/></marker>' +
      '<marker id="mx-head-literal" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 1 L9 5 L0 9 Z" fill="#2F6DB0"/></marker>' +
      '</defs><path class="mx-arc"/></svg></div>' +
      '<div class="mx-foot"><span class="mx-verdict" aria-live="polite"><i></i><span></span></span>' +
      '<button type="button" class="mx-play" aria-label="Pause animation">' +
      '<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path class="mx-ico-pause" d="M4 3h3v10H4zM9 3h3v10H9z"/><path class="mx-ico-play" d="M4 2.5v11l9-5.5z"/></svg>' +
      '</button></div>';
    var stage = root.querySelector('.mx-stage');
    var sentEl = root.querySelector('.mx-sentence');
    var arc = root.querySelector('.mx-arc');
    var svg = root.querySelector('.mx-arcs');
    var verdict = root.querySelector('.mx-verdict');
    var play = root.querySelector('.mx-play');
    var s = 0, timers = [], playing = !reduceMotion, visible = true, ws = [];

    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    function clearAll() { timers.forEach(clearTimeout); timers = []; }

    function setSentence(i) {
      var S = SENTENCES[i];
      sentEl.innerHTML = S.words.map(function (w, k) {
        return '<span class="mx-w" style="--i:' + k + '">' + w + '</span>';
      }).join(' ');
      ws = sentEl.querySelectorAll('.mx-w');
      svg.setAttribute('width', stage.clientWidth);
      svg.setAttribute('height', stage.clientHeight);
    }
    function center(w) {
      var r = w.getBoundingClientRect(), b = stage.getBoundingClientRect();
      return { x: r.left - b.left + r.width / 2, y: r.top - b.top };
    }
    function showPair(P) {
      sentEl.classList.add('mx-dim');
      ws.forEach(function (w) { w.classList.remove('on', 'is-metaphor', 'is-literal'); });
      [P.src, P.tgt].forEach(function (k) { ws[k].classList.add('on', 'is-' + P.label); });
      ws[P.src].setAttribute('data-role', 'source');   // role tags sit under the words
      ws[P.tgt].setAttribute('data-role', 'target');
      var a = center(ws[P.src]), b = center(ws[P.tgt]);
      var lift = Math.min(46, 18 + Math.abs(b.x - a.x) * 0.18);
      a.y -= 3; b.y -= 3;
      // Rise above the higher word, so an arc between wrapped lines clears the text.
      var cy = Math.min(a.y, b.y) - lift;
      arc.setAttribute('d', 'M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + cy + ' ' + b.x + ' ' + cy + ' ' + b.x + ' ' + b.y);
      arc.setAttribute('class', 'mx-arc is-' + P.label);
      arc.setAttribute('marker-end', 'url(#mx-head-' + P.label + ')');
      var len = arc.getTotalLength();
      arc.style.strokeDasharray = len;
      arc.style.strokeDashoffset = reduceMotion ? 0 : len;
      arc.getBoundingClientRect();              // commit start state before animating
      arc.classList.add('draw');
      arc.style.strokeDashoffset = 0;
      verdict.className = 'mx-verdict show is-' + P.label;
      verdict.querySelector('span').textContent = P.label;
    }
    function hidePair() {
      arc.classList.remove('draw');
      arc.classList.add('fade');
      verdict.className = 'mx-verdict';
      ws.forEach(function (w) { w.classList.remove('on'); });
    }

    function cycle() {
      clearAll();
      var S = SENTENCES[s];
      setSentence(s);
      arc.setAttribute('class', 'mx-arc'); arc.removeAttribute('d');
      sentEl.classList.remove('mx-dim', 'mx-out', 'mx-sweep');
      sentEl.classList.add('mx-in');
      var t = 400 + S.words.length * 70;
      later(function () { sentEl.classList.add('mx-sweep'); }, t);              // whole-sentence underline
      later(function () { sentEl.classList.remove('mx-sweep'); showPair(S.pairs[0]); }, t += 1900);
      later(hidePair, t += 2800);
      later(function () { showPair(S.pairs[1]); }, t += 600);
      later(hidePair, t += 2800);
      later(function () { sentEl.classList.remove('mx-dim'); sentEl.classList.add('mx-out'); }, t += 500);
      later(function () {
        sentEl.classList.remove('mx-in');
        s = (s + 1) % SENTENCES.length;
        if (playing && visible) cycle();
      }, t += 900);
    }

    function setPlay(on) {
      playing = on;
      root.classList.toggle('paused', !on);
      play.setAttribute('aria-label', on ? 'Pause animation' : 'Play animation');
      if (on && visible) cycle(); else clearAll();
    }
    play.addEventListener('click', function () { setPlay(!playing); });

    if (reduceMotion) {
      // A single still frame: the first sentence with its metaphorical pair.
      setSentence(0);
      sentEl.classList.add('mx-in');
      showPair(SENTENCES[0].pairs[0]);
      play.hidden = true;
      return;
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        var was = visible;
        visible = es[0].isIntersecting;
        if (visible && !was && playing) cycle();
        if (!visible) clearAll();
      }).observe(root);
    }
    setPlay(true);
  }

  // ---------- Chart helpers ----------
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el('text', Object.assign({ x: x, y: y, 'font-size': 12, fill: '#5C5C5C' }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function tooltip(plot) {
    var tip = document.createElement('div');
    tip.className = 'mx-tip';
    plot.appendChild(tip);
    return {
      show: function (html, evt) {
        tip.innerHTML = html;
        var r = plot.getBoundingClientRect();
        var x = evt.clientX - r.left + 12, y = evt.clientY - r.top + 12;
        tip.classList.add('show');
        x = Math.min(x, r.width - tip.offsetWidth - 4);
        tip.style.left = x + 'px';
        tip.style.top = y + 'px';
      },
      hide: function () { tip.classList.remove('show'); }
    };
  }
  function onVisible(node, fn) {
    if (reduceMotion || !('IntersectionObserver' in window)) { fn(true); return; }
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); fn(false); }
    }, { threshold: 0.35 });
    io.observe(node);
  }

  // ---------- Chart 1: the climb ----------
  var CLIMB = [
    { label: 'Sentence-level baseline', sub: 'BoW + frozen BERT [CLS], whole sentence', f1: 0.512, ci: '0.46\u20130.56' },
    { label: 'Handcrafted pair features', sub: 'source/target lemmas, chars, LM signals', f1: 0.717, ci: '0.67–0.76' },
    { label: 'Frozen mDeBERTa + MLP', sub: 'pair spans, 6× more training data', f1: 0.812, ci: '0.78–0.84' },
    { label: 'Fine-tuned mDeBERTa', sub: 'trained on all four languages', f1: 0.827, ci: '≈0.79–0.86' }
  ];
  var HUMAN_EN = 0.66;

  function drawClimb(root, animate) {
    var plot = root.querySelector('.mx-plot');
    plot.innerHTML = '';
    var W = plot.clientWidth || 640, narrow = W < 520;
    var labelW = narrow ? 0 : 236, rowH = narrow ? 58 : 46, top = 8, axisH = 26;
    var H = top + CLIMB.length * rowH + axisH;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': 'Test F1 rises from 0.51 for a sentence-level baseline to 0.83 for the fine-tuned model.' }, plot);
    var x0 = narrow ? 2 : labelW, x1 = W - 44;
    var X = function (v) { return x0 + v * (x1 - x0); };
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      el('line', { x1: X(v), x2: X(v), y1: top, y2: H - axisH, stroke: '#E2E0DB', 'stroke-width': 1 }, svg);
      txt(svg, X(v), H - 8, v === 0 ? '0' : v.toFixed(2).replace(/^0/, ''), { 'text-anchor': 'middle', 'font-size': 11, fill: '#8A8A8A' });
    });
    var tip = tooltip(plot);
    var bars = [];
    CLIMB.forEach(function (d, i) {
      var y = top + i * rowH;
      var barY = narrow ? y + 26 : y + 12, barH = 16;
      if (narrow) {
        txt(svg, x0, y + 16, d.label, { fill: '#2D2D2D', 'font-size': 13, 'font-weight': 500 });
      } else {
        txt(svg, labelW - 14, y + 20, d.label, { 'text-anchor': 'end', fill: '#2D2D2D', 'font-size': 13, 'font-weight': 500 });
        txt(svg, labelW - 14, y + 35, d.sub, { 'text-anchor': 'end', 'font-size': 10.5, fill: '#8A8A8A' });
      }
      var bar = el('rect', { x: x0, y: barY, height: barH, width: 0, rx: 4, fill: '#2F6DB0' }, svg);
      var val = txt(svg, X(d.f1) + 6, barY + 12.5, d.f1.toFixed(2), { fill: '#2D2D2D', 'font-size': 12, 'font-weight': 600, opacity: 0 });
      bars.push({ bar: bar, val: val, w: X(d.f1) - x0 });
      var hit = el('rect', { x: x0, y: y, width: x1 - x0, height: rowH, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', function (e) {
        tip.show('<strong>' + d.label + '</strong><br>' + d.sub + '<br>Test F1 ' + d.f1.toFixed(3) + ' (95% CI ' + d.ci + ')', e);
      });
      hit.addEventListener('mouseleave', tip.hide);
    });
    // Human reference: one annotator scored against another.
    el('line', { x1: X(HUMAN_EN), x2: X(HUMAN_EN), y1: top - 4, y2: H - axisH, stroke: '#8A8A8A', 'stroke-width': 1.5 }, svg);
    var reveal = animate ? onVisible : function (node, fn) { fn(true); };
    reveal(plot, function (instant) {
      bars.forEach(function (b, i) {
        if (instant) { b.bar.setAttribute('width', b.w); b.val.setAttribute('opacity', 1); return; }
        var t0 = null, delay = i * 220, dur = 700;
        function frame(t) {
          if (t0 === null) t0 = t;
          var p = Math.min(1, Math.max(0, (t - t0 - delay) / dur));
          var e = 1 - Math.pow(1 - p, 3);
          b.bar.setAttribute('width', b.w * e);
          if (p >= 1) { b.val.setAttribute('opacity', 1); return; }
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      });
    });
  }

  // ---------- Chart 2: languages ----------
  var LANGS = [
    { lang: 'English', model: 0.827, human: 0.66, kappa: 0.51 },
    { lang: 'Spanish', model: 0.737, human: 0.60, kappa: 0.48 },
    { lang: 'Russian', model: 0.857, human: 0.82, kappa: 0.69 },
    { lang: 'Farsi',   model: 0.682, human: 0.39, kappa: 0.12 }
  ];
  function drawLangs(root) {
    var plot = root.querySelector('.mx-plot');
    plot.innerHTML = '';
    var W = plot.clientWidth || 640, labelW = W < 520 ? 64 : 80, rowH = 40, top = 6, axisH = 26;
    var H = top + LANGS.length * rowH + axisH;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img',
      'aria-label': 'Model F1 and annotator agreement by language; the model scores higher in every language and both are highest for Russian and lowest for Farsi.' }, plot);
    var x0 = labelW, x1 = W - 20;
    var X = function (v) { return x0 + v * (x1 - x0); };
    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      el('line', { x1: X(v), x2: X(v), y1: top, y2: H - axisH, stroke: '#E2E0DB', 'stroke-width': 1 }, svg);
      txt(svg, X(v), H - 8, v === 0 ? '0' : v.toFixed(2).replace(/^0/, ''), { 'text-anchor': 'middle', 'font-size': 11, fill: '#8A8A8A' });
    });
    var tip = tooltip(plot);
    LANGS.forEach(function (d, i) {
      var cy = top + i * rowH + rowH / 2;
      txt(svg, labelW - 14, cy + 4, d.lang, { 'text-anchor': 'end', fill: '#2D2D2D', 'font-size': 13, 'font-weight': 500 });
      el('line', { x1: X(d.human), x2: X(d.model), y1: cy, y2: cy, stroke: '#C9C6BF', 'stroke-width': 2 }, svg);
      el('circle', { cx: X(d.human), cy: cy, r: 5.5, fill: '#FAFAF7', stroke: '#8A8A8A', 'stroke-width': 2 }, svg);
      el('circle', { cx: X(d.model), cy: cy, r: 6, fill: '#2F6DB0', stroke: '#FFFFFF', 'stroke-width': 2 }, svg);
      var hit = el('rect', { x: x0, y: cy - rowH / 2, width: x1 - x0, height: rowH, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', function (e) {
        tip.show('<strong>' + d.lang + '</strong><br>Model F1 ' + d.model.toFixed(2) + '<br>Annotator vs. annotator F1 ' + d.human.toFixed(2) + '<br>Cohen’s κ ' + d.kappa.toFixed(2), e);
      });
      hit.addEventListener('mouseleave', tip.hide);
    });
  }

  // ---------- Pipeline: alternate the two examples, one per loop ----------
  var PIPE = [
    { chip: 'the [[ <b class="m">tax</b> ]] &lt;&lt; <b class="m">burden</b> &gt;&gt; is lower', label: 'metaphor' },
    { chip: 'on &lt;&lt; <b class="l">ordinary</b> &gt;&gt; [[ <b class="l">income</b> ]]', label: 'literal' }
  ];
  function initPipe(root) {
    var chip = root.querySelector('.mx-chip');
    var verdict = root.querySelector('.mx-verdict');
    var ci = 0, vi = 0;
    function setVerdict(i) {
      verdict.className = 'mx-verdict show is-' + PIPE[i].label;
      verdict.querySelector('span').textContent = PIPE[i].label;
    }
    chip.innerHTML = PIPE[0].chip;
    setVerdict(0);
    // Each swaps at the start of its own cycle, while it is invisible.
    chip.addEventListener('animationiteration', function () { ci = (ci + 1) % PIPE.length; chip.innerHTML = PIPE[ci].chip; });
    verdict.addEventListener('animationiteration', function () { vi = (vi + 1) % PIPE.length; setVerdict(vi); });
  }


  // Static examples: an arrow from the source word up and over to the target.
  function drawExamples(root) {
    root.querySelectorAll('.mx-ex').forEach(function (p) {
      var old = p.querySelector('.mx-ex-arc'); if (old) old.remove();
      var src = p.querySelector('[data-role="source"]'), tgt = p.querySelector('[data-role="target"]');
      if (!src || !tgt) return;
      var b = p.getBoundingClientRect();
      function top(w) { var r = w.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top - 3 }; }
      var a = top(src), c = top(tgt);
      var lift = Math.min(40, 16 + Math.abs(c.x - a.x) * 0.18);
      var cy = Math.min(a.y, c.y) - lift;
      // End the curve a few px short of the word and finish with a filled arrowhead pointing down.
      var ey = c.y - 6;
      var svg = document.createElementNS(NSD, 'svg');
      svg.setAttribute('class', 'mx-ex-arc'); svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('width', p.clientWidth); svg.setAttribute('height', p.clientHeight);
      svg.innerHTML = '<path class="line" d="M' + a.x + ' ' + a.y + ' C' + a.x + ' ' + cy + ' ' + c.x + ' ' + cy + ' ' + c.x + ' ' + ey + '"/>' +
        '<path class="head" d="M' + (c.x - 5) + ' ' + (ey - 2) + ' L' + (c.x + 5) + ' ' + (ey - 2) + ' L' + c.x + ' ' + (c.y + 1) + ' Z"/>';
      p.appendChild(svg);
    });
  }

  function init() {
    var demo = document.getElementById('mx-demo');
    if (demo) initDemo(demo);
    var pipe = document.getElementById('mx-pipe');
    if (pipe) initPipe(pipe);

    var examples = document.getElementById('mx-examples');
    if (examples) {
      drawExamples(examples);
      if (document.fonts) document.fonts.ready.then(function () { drawExamples(examples); });
    }

    var climb = document.getElementById('mx-climb');
    var langs = document.getElementById('mx-langs');
    if (climb) drawClimb(climb, false);   // static: bars drawn at full width, no grow-in
    if (langs) drawLangs(langs);
    var lastW = window.innerWidth, t = null;
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW) return;   // ignore mobile URL-bar height changes
      lastW = window.innerWidth;
      clearTimeout(t);
      t = setTimeout(function () {
        if (examples) drawExamples(examples);
        if (climb) drawClimb(climb, false);
        if (langs) drawLangs(langs);
      }, 150);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
