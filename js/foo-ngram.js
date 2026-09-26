// Foobar post: hover readout for the foobar/FUBAR Ngram chart (a crosshair plus both values).
(function () {
  var fig = document.querySelector('.foo-ngram');
  if (!fig) return;
  var svg = fig.querySelector('svg'), hit = fig.querySelector('.hit'), g = fig.querySelector('.hover');
  var tip = fig.querySelector('.foo-ngram-tip');
  var geo = JSON.parse(fig.dataset.geom), data = JSON.parse(fig.dataset.series), y0 = +fig.dataset.y0;
  var n = data.foobar.length;
  var sx = function (i) { return geo.L + i / (n - 1) * (geo.W - geo.L - geo.R); };
  var sy = function (v) { return geo.T + (1 - v / geo.ymax) * (geo.H - geo.T - geo.B); };
  function show(evt) {
    var pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    var i = Math.round((p.x - geo.L) / (geo.W - geo.L - geo.R) * (n - 1));
    i = Math.max(0, Math.min(n - 1, i));
    var x = sx(i);
    g.style.display = '';
    g.querySelector('.xh').setAttribute('x1', x); g.querySelector('.xh').setAttribute('x2', x);
    [['foobar', '.hp-foobar'], ['FUBAR', '.hp-FUBAR']].forEach(function (s) {
      var c = g.querySelector(s[1]); c.setAttribute('cx', x); c.setAttribute('cy', sy(data[s[0]][i]));
    });
    tip.hidden = false;
    tip.innerHTML = '<b>' + (y0 + i) + '</b><span><i class="k k-foobar"></i>foobar ' + data.foobar[i].toFixed(1) +
      '</span><span><i class="k k-FUBAR"></i>FUBAR ' + data.FUBAR[i].toFixed(1) + '</span>';
    var r = svg.getBoundingClientRect(), fr = fig.getBoundingClientRect();
    var left = r.left - fr.left + x / geo.W * r.width;
    var half = tip.offsetWidth / 2;
    tip.style.left = Math.min(Math.max(left, half), fr.width - half) + 'px';
    tip.style.top = (r.top - fr.top + 6) + 'px';
  }
  function hide() { g.style.display = 'none'; tip.hidden = true; }
  hit.addEventListener('pointermove', show);
  hit.addEventListener('pointerdown', show);
  hit.addEventListener('pointerleave', hide);
})();
