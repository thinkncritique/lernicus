/* Station 3: Symmetrie – „Spiegel und Zauberuhr“
   Das Spiel liegt als eigene Seite in spiegel-zauberuhr.html und wird hier eingebettet.
   Die Seite meldet Fortschritt und Ende per postMessage an die Schatzkarte. */
window.LernicusSymmetrie = { mount: function (root, opts) {
  opts = opts || {};
  var frame = document.createElement('iframe');
  frame.src = 'spiegel-zauberuhr.html?embed=1';
  frame.title = 'Spiel: Spiegel und Zauberuhr';
  frame.setAttribute('scrolling', 'no');
  frame.style.cssText = 'width:100%;height:760px;border:0;display:block;background:transparent;color-scheme:normal';
  root.innerHTML = '';
  root.appendChild(frame);

  function onMessage(e) {
    var d = e.data;
    if (e.source !== frame.contentWindow || !d || d.lernicus !== 'symmetrie') return;
    if (d.height) frame.style.height = d.height + 'px';
    if (d.progress && opts.onProgress) opts.onProgress(d.progress[0], d.progress[1]);
    if (d.finished && opts.onFinish) opts.onFinish(d.coins || 0);
  }
  window.addEventListener('message', onMessage);
  /* Listener aufräumen, sobald die Station verlassen wird */
  window.addEventListener('hashchange', function off() {
    window.removeEventListener('message', onMessage);
    window.removeEventListener('hashchange', off);
  });
} };
