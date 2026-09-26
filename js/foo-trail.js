// Foobar post: the cursor leaves a trail of tiny translucent "foo"s and "bar"s, alternating.
// Mouse/trackpad only; off for touch screens and for reduced-motion users.
(function () {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var WORDS = ['foo', 'bar'];
  var TONES = ['#637556', '#A65E4A', '#8B6B32', '#586C83', '#805C70', '#80684D'];
  var GAP = 26;        // px the cursor must travel between foos
  var LIFE = 1100;     // ms each foo lingers
  var MAX_LIVE = 40;
  var lastX = null, lastY = null, live = 0, i = 0;

  function spawn(x, y) {
    if (live >= MAX_LIVE) return;
    var el = document.createElement('span');
    el.className = 'foo-trail';
    el.textContent = WORDS[i % WORDS.length];
    el.setAttribute('aria-hidden', 'true');
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.color = TONES[i++ % TONES.length];
    document.body.appendChild(el);
    live++;
    var rot = (Math.random() * 24 - 12).toFixed(1);
    var dx = (Math.random() * 16 - 8).toFixed(1);
    var anim = el.animate([
      { opacity: 0.45, transform: 'translate(-50%,-50%) rotate(' + rot + 'deg) scale(1)' },
      { opacity: 0, transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + 14px)) rotate(' + rot + 'deg) scale(.8)' }
    ], { duration: LIFE, easing: 'ease-out', fill: 'forwards' });
    anim.onfinish = function () { el.remove(); live--; };
  }

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
    var dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (dx * dx + dy * dy < GAP * GAP) return;
    lastX = e.clientX; lastY = e.clientY;
    spawn(e.clientX, e.clientY);
  }, { passive: true });
})();
