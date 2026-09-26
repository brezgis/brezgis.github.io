// Foobar post: a little record player for the song. The record spins while it plays.
// If this script doesn't run, the plain <audio> player stays visible instead.
(function () {
  var fig = document.querySelector('.foo-song');
  if (!fig) return;
  var audio = fig.querySelector('audio');
  var card = fig.querySelector('.foo-record-card');
  var btn = fig.querySelector('.foo-record-play');
  var seek = fig.querySelector('.foo-record-seek');
  var time = fig.querySelector('.foo-record-time');
  if (!audio || !card || !btn || !seek || !time) return;
  var titleEl = fig.querySelector('.foo-song-title');
  var name = titleEl ? titleEl.textContent : 'the song';

  card.hidden = false;
  fig.classList.add('is-ready');

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function sync() {
    var d = audio.duration;
    if (d && isFinite(d)) seek.value = Math.round(1000 * audio.currentTime / d);
    time.textContent = fmt(audio.paused && !audio.currentTime ? d : audio.currentTime);
  }

  btn.addEventListener('click', function () {
    if (audio.paused) audio.play(); else audio.pause();
  });
  audio.addEventListener('play', function () {
    fig.classList.add('is-playing');
    btn.setAttribute('aria-label', 'Pause ' + name);
  });
  audio.addEventListener('pause', function () {
    fig.classList.remove('is-playing');
    btn.setAttribute('aria-label', 'Play ' + name);
  });
  audio.addEventListener('ended', function () { audio.currentTime = 0; sync(); });
  audio.addEventListener('timeupdate', sync);
  audio.addEventListener('loadedmetadata', sync);
  seek.addEventListener('input', function () {
    var d = audio.duration;
    if (d && isFinite(d)) audio.currentTime = d * seek.value / 1000;
  });
  sync();
})();
