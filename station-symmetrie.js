/* Station 3: Symmetrie – „Die zerrissene Schatzkarte“ */
window.LernicusSymmetrie = { mount: function (root, opts) {
  opts = opts || {};
  var fmt = LC.fmt, P = LC.pt;
  var ROUNDS = [
    { name: 'Parabel', formula: 'f(x) = x<sup>2</sup>', plain: 'x²', neg: '−x²', f: function (x) { return x * x; }, type: 'axis',
      sub: [['(−x)² = x²', 1], ['(−x)² = −x²', 0], ['(−x)² = −x', 0]], subHint: '(−x)² = (−x)·(−x). Minus mal minus ergibt plus.',
      why: 'f(−x) = x² = f(x) gilt für <b>alle</b> x. Der Graph ist achsensymmetrisch zur y-Achse.' },
    { name: 'Kubische Funktion', formula: 'f(x) = x<sup>3</sup>', plain: 'x³', neg: '−x³', f: function (x) { return x * x * x; }, type: 'point',
      sub: [['(−x)³ = −x³', 1], ['(−x)³ = x³', 0], ['(−x)³ = −x²', 0]], subHint: '(−x)³ = (−x)·(−x)·(−x). Drei Minuszeichen: Das Ergebnis bleibt negativ.',
      why: 'f(−x) = −x³ = −f(x) gilt für <b>alle</b> x. Der Graph ist punktsymmetrisch zum Ursprung.' },
    { name: 'Gemischte Funktion', formula: 'f(x) = x<sup>2</sup> + x', plain: 'x² + x', neg: '−x² − x', f: function (x) { return x * x + x; }, type: 'none',
      sub: [['(−x)² + (−x) = x² − x', 1], ['(−x)² + (−x) = x² + x', 0], ['(−x)² + (−x) = −x² − x', 0]], subHint: 'Setze −x an beiden Stellen ein: (−x)² wird x², und + (−x) wird − x.',
      why: 'f(−x) = x² − x ist weder f(x) = x² + x noch −f(x) = −x² − x. Gegenbeispiel: f(1) = 2, aber f(−1) = 0. Das ist weder 2 noch −2. Also hat der Graph <b>keine</b> dieser Symmetrien.' }
  ];
  var TOOLS = { axis: ['🪞', 'Magischer Spiegel', 'Spiegelung an der y-Achse: (x | y) → (−x | y)'], point: ['🔄', 'Drehschlüssel', 'Drehung um 180° um den Ursprung: (x | y) → (−x | −y)'], none: ['✖️', 'Keines der beiden', 'Weder Spiegel noch Drehschlüssel passen'] };
  var KNOWN = [1, 2], MISSING = [-1, -2];
  var plane = new LC.Plane({ xmin: -3, xmax: 3, ymin: -9, ymax: 9, w: 420, h: 400, ylab: 2 });
  var s;

  function fresh() { return { ri: 0, coins: 0, pieces: 0, finished: false }; }
  function setRound() {
    s.phase = 'guess'; s.guess = null; s.msg = null; s.rows = MISSING.map(function () { return { val: null, ok: false, err: 0 }; });
    s.tested = {}; s.anim = null; s.err = 0; s.revealAnim = false;
  }
  function R() { return ROUNDS[s.ri]; }

  function torn() {
    // Abgerissenes Kartenstück über der linken Hälfte (x < 0) mit gezackter Kante
    var x0 = plane.X(-3) - 30, xe = plane.X(0) - 34, y0 = 0, y1 = plane.h, d = 'M' + x0 + ' ' + y0 + ' L' + xe + ' ' + y0, n = 16;
    for (var i = 1; i <= n; i++) { var y = y0 + (y1 - y0) * i / n; d += ' L' + (xe + (i % 2 ? -9 : 3) + (i % 3) * 2) + ' ' + y.toFixed(1); }
    d += ' L' + x0 + ' ' + y1 + 'Z';
    return '<g class="torn' + (s.revealAnim ? ' off' : '') + '"><path d="' + d + '"/><text x="' + (plane.X(-1.5)) + '" y="' + (plane.h / 2) + '" text-anchor="middle">?</text>' +
      '<text class="tornlab" x="' + plane.X(-1.5) + '" y="' + (plane.h / 2 + 30) + '" text-anchor="middle">abgerissen</text></g>';
  }
  function mapSvg() {
    var r = R(), o = [], full = s.phase !== 'guess' && s.phase !== 'fill' || s.revealAnim;
    o.push('<svg class="plane" viewBox="0 0 ' + plane.w + ' ' + plane.h + '" role="img" aria-label="Schatzkarte mit dem Graphen von ' + r.formula.replace(/<[^>]+>/g, '') + '">');
    o.push('<defs><clipPath id="symclip"><rect x="' + plane.pad + '" y="' + plane.pad + '" width="' + (plane.w - 2 * plane.pad) + '" height="' + (plane.h - 2 * plane.pad) + '"/></clipPath></defs>');
    o.push(plane.axes());
    o.push('<g clip-path="url(#symclip)">');
    o.push('<path class="graph" d="' + plane.path(r.f, 0, 3) + '"/>');
    if (full) o.push('<path class="graph' + (s.revealAnim ? ' grow' : '') + '" d="' + plane.path(r.f, -3, 0) + '"/>');
    if (s.phase === 'test' && s.anim) {
      o.push('<g class="copy" data-tool="' + s.anim + '" style="transform-origin:' + plane.X(0) + 'px ' + plane.Y(0) + 'px"><path d="' + plane.path(r.f, 0, 3) + '"/></g>');
    }
    o.push('</g>');
    if (!full) o.push(torn());
    KNOWN.forEach(function (x) { var y = r.f(x); o.push(dot(x, y, 'known', P(x, y))); });
    MISSING.forEach(function (x, i) {
      var row = s.rows[i];
      if (row.val == null) { if (s.phase === 'fill') o.push('<g class="slot"><line x1="' + plane.X(x) + '" y1="' + plane.Y(-9) + '" x2="' + plane.X(x) + '" y2="' + plane.Y(9) + '"/></g>'); return; }
      var yy = Math.max(-9, Math.min(9, row.val));
      o.push(dot(x, yy, row.ok ? 'ok' : 'bad', P(x, row.val) + (row.ok ? ' ✓' : ' ✗')));
    });
    o.push('</svg>');
    return o.join('');
  }
  function dot(x, y, cls, lab) {
    var X = plane.X(x), Y = plane.Y(y), left = x < 0;
    return '<g class="pt ' + cls + '"><circle cx="' + X + '" cy="' + Y + '" r="6"/><text x="' + (X + (left ? -10 : 10)) + '" y="' + (Y - 9) + '" text-anchor="' + (left ? 'end' : 'start') + '">' + lab + '</text></g>';
  }

  function piecesSvg(n, big) {
    // Drei Kartenstücke; die ersten n sind gefunden
    var w = 300, h = 120, cuts = [[0, 0, 108, 0, 96, 40, 112, 80, 100, 120, 0, 120], [108, 0, 204, 0, 192, 46, 210, 86, 196, 120, 100, 120, 112, 80, 96, 40], [204, 0, 300, 0, 300, 120, 196, 120, 210, 86, 192, 46]];
    var o = '<svg class="pieces' + (big ? ' big' : '') + '" viewBox="-4 -4 ' + (w + 8) + ' ' + (h + 8) + '" role="img" aria-label="' + n + ' von 3 Kartenstücken gefunden">';
    cuts.forEach(function (c, i) {
      var d = 'M' + c[0] + ' ' + c[1]; for (var k = 2; k < c.length; k += 2) d += ' L' + c[k] + ' ' + c[k + 1]; d += 'Z';
      o += '<path class="piece' + (i < n ? ' got' : '') + '" d="' + d + '"/>';
      if (i >= n) o += '<text class="pq" x="' + (50 + i * 100) + '" y="68" text-anchor="middle">?</text>';
    });
    if (n >= 1) o += '<path class="trail" d="M20 96 Q50 60 90 76"/>';
    if (n >= 2) o += '<path class="trail" d="M110 70 Q150 30 196 52"/>';
    if (n >= 3) o += '<path class="trail" d="M214 50 Q240 90 262 64"/><path class="xmark" d="M254 52 L272 70 M272 52 L254 70"/>';
    o += '</svg>';
    return o;
  }

  function chips() {
    return ROUNDS.map(function (r, i) {
      var c = s.finished || i < s.ri ? 'done' : i === s.ri ? 'on' : '';
      return '<li class="' + c + '">' + (c === 'done' ? '✓ ' : '') + 'Karte ' + (i + 1) + ' · ' + r.name + '</li>';
    }).join('');
  }
  function fb() { return s.msg ? '<div class="fb ' + (s.msg.k || '') + '" role="status">' + s.msg.t + '</div>' : ''; }
  var STEPS = ['Vermuten', 'Ergänzen', 'Testen', 'Beweisen'];
  function steps() {
    var cur = { guess: 0, fill: 1, test: 2, alg1: 3, alg2: 3, piece: 4 }[s.phase];
    return '<ol class="steps">' + STEPS.map(function (t, i) { return '<li class="' + (i < cur ? 'done' : i === cur ? 'on' : '') + '">' + (i + 1) + '. ' + t + '</li>'; }).join('') + '</ol>';
  }

  function render() {
    var r = R(), h = '';
    var head = '<div class="dxr-top"><ol class="levels">' + chips() + '</ol><span class="score">🪙 <b>' + s.coins + '</b> · 🧩 ' + s.pieces + '/3</span></div>';
    if (s.finished) {
      root.innerHTML = '<div class="st3">' + head + '<div class="rule"><h2>Die Schatzkarte ist wieder ganz!</h2>' + piecesSvg(3, true) +
        '<p>Du hast <b>' + s.coins + ' Münzen</b> gesammelt und alle drei Kartenstücke gefunden.</p>' +
        '<p><b>Merke:</b> Setze −x ein. Gilt <span class="mono">f(−x) = f(x)</span>, ist der Graph achsensymmetrisch zur y-Achse. Gilt <span class="mono">f(−x) = −f(x)</span>, ist er punktsymmetrisch zum Ursprung. Gilt keines von beiden für alle x, liegt keine dieser Symmetrien vor.</p>' +
        '<button class="btn" data-a="restart">Noch einmal spielen</button></div></div>';
      report(); return;
    }
    root.innerHTML = '<div class="st3">' + head + steps() +
      '<div class="plaque"><small>Auf dem Kartenrest steht</small><div class="formula">' + r.formula + '</div></div>' +
      '<div class="mapbox">' + mapSvg() + '</div><div class="panel" data-r="panel"></div></div>';
    var panel = root.querySelector('[data-r="panel"]');

    if (s.phase === 'guess') {
      h = '<p class="q">Die linke Hälfte der Karte fehlt. Welches Werkzeug könnte sie wiederherstellen?</p><p class="fine">Das ist erst eine Vermutung. Schau dir die bekannten Punkte und den Verlauf an.</p><div class="tools">' +
        ['axis', 'point', 'none'].map(function (k) { var t = TOOLS[k]; return '<button class="tool" data-a="guess" data-v="' + k + '"><span class="ti">' + t[0] + '</span><b>' + t[1] + '</b><small>' + t[2] + '</small></button>'; }).join('') + '</div>';
    } else if (s.phase === 'fill') {
      var t = TOOLS[s.guess];
      h = '<p class="q">Ergänze die fehlenden Punkte auf der linken Seite.</p><p class="fine">Nutze 🪞 oder 🔄 auf den bekannten Punkt oder rechne f(x) selbst aus. Deine Vermutung: ' + t[0] + ' ' + t[1] + '.</p><div class="rows">' +
        MISSING.map(function (x, i) {
          var row = s.rows[i], src = -x, sy = r.f(src);
          return '<form class="symrow' + (row.ok ? ' ok' : '') + '" data-i="' + i + '" autocomplete="off"><div class="lbl">Aus ' + P(src, sy) + '</div>' +
            '<div class="coord"><span>(' + fmt(x) + ' |</span><label><span class="sr">y-Wert bei x = ' + fmt(x) + '</span><input inputmode="decimal" name="y" ' + (row.ok ? 'disabled ' : '') + 'value="' + (row.val == null ? '' : fmt(row.val)) + '" placeholder="y"></label><span>)</span></div>' +
            (row.ok ? '<span class="okmark">✓ liegt auf dem Graphen</span>' :
            '<div class="rowbtns"><button type="button" class="btn sm" data-a="tool" data-t="axis" data-i="' + i + '">🪞 Spiegel</button><button type="button" class="btn sm" data-a="tool" data-t="point" data-i="' + i + '">🔄 Drehschlüssel</button><button type="submit" class="btn sm go">Prüfen</button></div>') +
            '</form>';
        }).join('') + '</div>' + fb();
      if (s.rows.every(function (w) { return w.ok; })) h += '<button class="btn go" data-a="totest" data-focus>Weiter: Werkzeug am ganzen Graphen testen</button>';
    } else if (s.phase === 'test') {
      h = '<p class="q">Lege eine Kopie der rechten Hälfte an und wende ein Werkzeug darauf an.</p><div class="row">' +
        '<button class="btn" data-a="test" data-t="axis">🪞 Spiegelkopie testen</button><button class="btn" data-a="test" data-t="point">🔄 Drehkopie testen</button></div>' + fb() +
        '<p class="fine callout">Passende Punktpaare und eine deckungsgleiche Kopie sind <b>starke Hinweise</b>. Für den gesamten Graphen bestätigt es aber erst die Rechnung mit −x.</p>' +
        (Object.keys(s.tested).length ? '<button class="btn go" data-a="toalg" data-focus>Weiter: rechnerisch prüfen</button>' : '');
    } else if (s.phase === 'alg1') {
      h = '<p class="q">Setze −x in f ein. Was ergibt f(−x)?</p><div class="stack">' + s.subOpts.map(function (o, i) { return '<button class="btn opt" data-a="sub" data-i="' + i + '">f(−x) = ' + o[0] + '</button>'; }).join('') + '</div>' + fb();
    } else if (s.phase === 'alg2') {
      h = '<div class="rule tight"><p class="mono">f(−x) = ' + r.sub.filter(function (o) { return o[1]; })[0][0] + '</p><p class="mono">f(x) = ' + r.plain + ' &nbsp;&nbsp; −f(x) = ' + r.neg + '</p></div>' +
        '<p class="q">Welche Gleichung gilt für alle x?</p><div class="stack">' +
        [['axis', 'f(−x) = f(x) → achsensymmetrisch zur y-Achse'], ['point', 'f(−x) = −f(x) → punktsymmetrisch zum Ursprung'], ['none', 'Keine der beiden gilt für alle x → keine dieser Symmetrien']].map(function (o) { return '<button class="btn opt" data-a="rel" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>' + fb();
    } else if (s.phase === 'piece') {
      h = fb() + '<div class="rule"><h2>🧩 Kartenstück ' + s.pieces + ' von 3 gefunden</h2>' + piecesSvg(s.pieces) +
        '<button class="btn go" data-a="nextround" data-focus>' + (s.ri + 1 < ROUNDS.length ? 'Nächste Karte' : 'Station abschließen') + '</button></div>';
    }
    panel.innerHTML = h;
    if (s.phase === 'test' && s.anim) {
      var g = root.querySelector('.copy');
      requestAnimationFrame(function () { requestAnimationFrame(function () { if (g) g.classList.add('go'); }); });
    }
    var f = root.querySelector('[data-focus]'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
    report();
  }
  function report() {
    if (opts.onProgress) opts.onProgress(s.finished ? ROUNDS.length : s.ri + (s.phase === 'piece' ? 1 : 0), ROUNDS.length);
    if (s.finished && !s.reported) { s.reported = true; if (opts.onFinish) opts.onFinish(s.coins); }
  }
  function shuffle(a) { return a.map(function (v) { return [Math.random(), v]; }).sort(function (p, q) { return p[0] - q[0]; }).map(function (p) { return p[1]; }); }

  function checkRow(i, val, how) {
    var r = R(), x = MISSING[i], row = s.rows[i], truth = r.f(x);
    row.val = val;
    if (LC.near(val, truth)) {
      row.ok = true;
      s.coins += row.err ? 3 : 5;
      s.msg = { k: 'ok', t: '<b>' + (row.err ? 'Korrektur gelungen! +3 🪙' : 'Passt! +5 🪙') + '</b> ' + P(x, truth) + ' liegt auf dem Graphen, denn f(' + fmt(x) + ') = ' + fmt(truth) + '.' };
      if (s.rows.every(function (w) { return w.ok; })) { s.revealAnim = true; s.msg.t += ' <b>Die Karte ist rekonstruiert!</b>'; }
    } else {
      row.err++;
      var hint = how === 'axis' ? 'Der Spiegel liefert ' + P(x, val) + ', aber dieser Punkt liegt nicht auf dem Graphen.' :
        how === 'point' ? 'Der Drehschlüssel liefert ' + P(x, val) + ', aber dieser Punkt liegt nicht auf dem Graphen.' :
        P(x, val) + ' liegt nicht auf dem Graphen.';
      if (row.err >= 2) hint += ' Rechne direkt: f(' + fmt(x) + ') = ' + r.plain.replace(/x/g, '(' + fmt(x) + ')') + ' = ?';
      else hint += ' Probiere das andere Werkzeug oder rechne f(' + fmt(x) + ') selbst aus.';
      s.msg = { k: 'bad', t: '<b>Das Kartenstück passt nicht.</b> ' + hint };
    }
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a, r = R();
    if (a === 'restart') { s = fresh(); setRound(); render(); return; }
    if (a === 'guess') { s.guess = b.dataset.v; s.phase = 'fill'; s.msg = { k: '', t: 'Vermutung notiert: <b>' + TOOLS[s.guess][0] + ' ' + TOOLS[s.guess][1] + '</b>. Prüfe sie jetzt an den fehlenden Punkten.' }; }
    else if (a === 'tool') {
      var i = +b.dataset.i, src = -MISSING[i], y = r.f(src);
      checkRow(i, b.dataset.t === 'axis' ? y : -y, b.dataset.t);
    } else if (a === 'totest') { s.phase = 'test'; s.revealAnim = false; s.anim = null; s.msg = null; }
    else if (a === 'test') {
      var t = b.dataset.t, match = t === r.type;
      s.anim = t; s.tested[t] = true;
      s.msg = { k: match ? 'ok' : 'bad', t: match ? '<b>Deckungsgleich!</b> Die ' + (t === 'axis' ? 'gespiegelte' : 'gedrehte') + ' Kopie liegt genau auf der linken Hälfte.' :
        '<b>Passt nicht.</b> Die ' + (t === 'axis' ? 'gespiegelte' : 'gedrehte') + ' Kopie weicht vom Graphen ab.' };
    } else if (a === 'toalg') { s.phase = 'alg1'; s.anim = null; s.err = 0; s.subOpts = shuffle(r.sub.slice()); s.msg = null; }
    else if (a === 'sub') {
      var o = s.subOpts[+b.dataset.i];
      if (o[1]) { s.phase = 'alg2'; s.coins += s.err ? 3 : 5; s.msg = { k: 'ok', t: '<b>' + (s.err ? 'Korrektur gelungen! +3 🪙' : 'Richtig eingesetzt! +5 🪙') + '</b>' }; s.err = 0; }
      else { s.err++; s.msg = { k: 'bad', t: '<b>Fast.</b> ' + r.subHint }; }
    } else if (a === 'rel') {
      var v = b.dataset.v;
      if (v === r.type) {
        var pts = s.err ? 5 : 10, extra = s.guess === r.type ? ' Deine Vermutung war richtig. +5 🪙' : ' Du hast deine Vermutung korrigiert. +5 🪙';
        s.coins += pts + 5; s.pieces++;
        s.msg = { k: 'ok', t: '<b>' + (s.err ? 'Korrektur gelungen!' : 'Richtige Begründung!') + ' +' + pts + ' 🪙</b> ' + r.why + extra };
        s.phase = 'piece';
      } else {
        s.err++;
        s.msg = { k: 'bad', t: '<b>Schau noch einmal genau hin.</b> Vergleiche f(−x) Zeichen für Zeichen mit f(x) = ' + r.plain + ' und mit −f(x) = ' + r.neg + '. Stimmt eine der beiden für jedes x?' };
      }
    } else if (a === 'nextround') {
      if (s.ri + 1 < ROUNDS.length) { s.ri++; setRound(); } else s.finished = true;
    }
    render();
  }
  function onSubmit(e) {
    var form = e.target.closest('.symrow'); if (!form) return;
    e.preventDefault();
    var i = +form.dataset.i, v = LC.parseNum(form.y.value);
    if (isNaN(v)) { s.msg = { k: '', t: 'Trage den y-Wert als Zahl ein oder nutze ein Werkzeug.' }; render(); return; }
    checkRow(i, v, 'calc'); render();
  }
  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  s = fresh(); setRound(); render();
} };
