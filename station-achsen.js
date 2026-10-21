/* Station 2: Achsenschnittpunkte – „Schatzsuche im Koordinatensystem“ */
window.LernicusAchsen = { mount: function (root, opts) {
  opts = opts || {};
  var fmt = LC.fmt, P = LC.pt;
  var ROUNDS = [
    { name: 'Zwei Nullstellen', formula: 'f(x) = x<sup>2</sup> − 4', f: function (x) { return x * x - 4; },
      view: { xmin: -5, xmax: 5, ymin: -6, ymax: 6 },
      pts: [
        { x: -2, y: 0, k: 'x', calc: 'f(x) = 0: &nbsp;x² − 4 = 0 &nbsp;⇔&nbsp; x² = 4 &nbsp;⇔&nbsp; x = −2 oder x = 2', hint: 'x² = 4 hat zwei Lösungen. Dieser Schatz liegt links der y-Achse.' },
        { x: 2, y: 0, k: 'x', calc: 'f(x) = 0: &nbsp;x² − 4 = 0 &nbsp;⇔&nbsp; x² = 4 &nbsp;⇔&nbsp; x = −2 oder x = 2', hint: 'x² = 4 hat zwei Lösungen. Dieser Schatz liegt rechts der y-Achse.' },
        { x: 0, y: -4, k: 'y', calc: 'f(0) = 0² − 4 = −4', hint: 'Setze 0 für x ein: 0² − 4 = ?' }
      ],
      insight: 'Zwei Nullstellen und ein y-Achsenschnittpunkt. Eine Funktion hat immer höchstens einen Schnittpunkt mit der y-Achse, denn für x = 0 gibt es genau einen Funktionswert.' },
    { name: 'Berührpunkt', formula: 'f(x) = x<sup>2</sup> − 2x + 1', f: function (x) { return x * x - 2 * x + 1; },
      view: { xmin: -4, xmax: 5, ymin: -3, ymax: 7 },
      pts: [
        { x: 1, y: 0, k: 'x', touch: true, calc: 'f(x) = 0: &nbsp;x² − 2x + 1 = 0 &nbsp;⇔&nbsp; (x − 1)² = 0 &nbsp;⇔&nbsp; x = 1', hint: 'Erkennst du eine binomische Formel? x² − 2x + 1 = (x − 1)².' },
        { x: 0, y: 1, k: 'y', calc: 'f(0) = 0² − 2·0 + 1 = 1', hint: 'Setze 0 für x ein: 0² − 2·0 + 1 = ?' }
      ],
      insight: 'Bei x = 1 <b>berührt</b> der Graph die x-Achse nur, ohne sie zu durchqueren. Die Gleichung (x − 1)² = 0 hat nur eine Lösung: eine doppelte Nullstelle.' },
    { name: 'Keine Nullstelle', formula: 'f(x) = x<sup>2</sup> + 2', f: function (x) { return x * x + 2; },
      view: { xmin: -4, xmax: 4, ymin: -3, ymax: 8 },
      pts: [
        { x: 0, y: 2, k: 'y', calc: 'f(0) = 0² + 2 = 2', hint: 'Setze 0 für x ein: 0² + 2 = ?' }
      ],
      insight: 'f(x) = 0 führt zu x² + 2 = 0 &nbsp;⇔&nbsp; x² = −2. Ein Quadrat ist nie negativ, also gibt es <b>keine Nullstelle</b>. Der Graph trifft die x-Achse nie. Auch das ist ein vollständiges Ergebnis.' },
    { name: 'Durch den Ursprung', formula: 'f(x) = x<sup>2</sup> − 3x', f: function (x) { return x * x - 3 * x; },
      view: { xmin: -3, xmax: 6, ymin: -4, ymax: 6 },
      pts: [
        { x: 0, y: 0, k: 'both', calc: 'f(0) = 0² − 3·0 = 0 &nbsp;und&nbsp; x² − 3x = 0 &nbsp;⇔&nbsp; x(x − 3) = 0 &nbsp;⇔&nbsp; x = 0 oder x = 3', hint: 'Der Punkt liegt auf beiden Achsen. Was ist dort x, was ist dort y?' },
        { x: 3, y: 0, k: 'x', calc: 'f(x) = 0: &nbsp;x² − 3x = 0 &nbsp;⇔&nbsp; x(x − 3) = 0 &nbsp;⇔&nbsp; x = 0 oder x = 3', hint: 'Klammere x aus: x(x − 3) = 0. Ein Produkt ist null, wenn ein Faktor null ist.' }
      ],
      insight: 'Der Ursprung (0 | 0) liegt auf <b>beiden</b> Achsen. Er zählt als <b>ein</b> Fund: Er ist gleichzeitig Nullstelle und y-Achsenschnittpunkt.' }
  ];
  var IDEAS = [['zero', 'f(x) = 0 lösen'], ['y', 'x = 0 einsetzen'], ['both', 'Beides – der Punkt liegt auf beiden Achsen']];
  var s, plane;

  function fresh() { return { ri: 0, coins: 0, finished: false }; }
  function setRound() {
    var r = ROUNDS[s.ri];
    s.phase = 'mark'; s.found = r.pts.map(function () { return false; }); s.order = []; s.opened = r.pts.map(function () { return false; });
    s.miss = null; s.msg = null; s.si = 0; s.step = 'idea'; s.err = 0; s.checks = 0; s.justOpened = -1;
    plane = new LC.Plane({ xmin: r.view.xmin, xmax: r.view.xmax, ymin: r.view.ymin, ymax: r.view.ymax, w: 420, h: 380 });
  }
  function R() { return ROUNDS[s.ri]; }
  function want(p) { return p.k === 'x' ? 'zero' : p.k; }

  function mapSvg() {
    var r = R(), o = [];
    o.push('<svg class="plane" viewBox="0 0 ' + plane.w + ' ' + plane.h + '" role="img" aria-label="Koordinatensystem mit dem Graphen von ' + r.formula.replace(/<[^>]+>/g, '') + '">');
    o.push(plane.axes());
    o.push('<path class="graph" d="' + plane.path(r.f) + '"/>');
    if (s.miss) o.push('<g class="miss" transform="translate(' + s.miss.px + ' ' + s.miss.py + ')"><path d="M-6 -6 L6 6 M6 -6 L-6 6"/></g>');
    s.order.forEach(function (i, n) {
      var p = r.pts[i], X = plane.X(p.x), Y = plane.Y(p.y);
      var cur = s.phase === 'solve' && s.order[s.si] === i;
      o.push('<g class="marker' + (cur ? ' cur' : '') + (s.opened[i] ? ' done' : '') + '">');
      o.push('<circle class="spot" cx="' + X + '" cy="' + Y + '" r="' + (cur ? 9 : 6) + '"/>');
      o.push('<g transform="translate(' + (X - 15) + ' ' + (Y - 36) + ')">' + LC.chest(s.opened[i], 30).replace('class="chest', 'class="chest' + (s.justOpened === i ? ' pop' : '')) + '</g>');
      if (s.opened[i]) o.push('<text class="ptlab" x="' + (X + (p.x < 0 ? -18 : 18)) + '" y="' + (Y - 18) + '" text-anchor="' + (p.x < 0 ? 'end' : 'start') + '">' + P(p.x, p.y) + '</text>');
      else o.push('<text class="ptnum" x="' + (X + 12) + '" y="' + (Y - 6) + '">' + (n + 1) + '</text>');
      o.push('</g>');
    });
    o.push('</svg>');
    return o.join('');
  }

  function chips() {
    return ROUNDS.map(function (r, i) {
      var c = s.finished || i < s.ri ? 'done' : i === s.ri ? 'on' : '';
      return '<li class="' + c + '">' + (c === 'done' ? '✓ ' : '') + 'Runde ' + (i + 1) + ' · ' + r.name + '</li>';
    }).join('');
  }
  function fb() { return s.msg ? '<div class="fb ' + (s.msg.k || '') + '" role="status">' + s.msg.t + '</div>' : ''; }

  function render() {
    var r = R(), h = '';
    root.innerHTML =
      '<div class="st2">' +
      '<div class="dxr-top"><ol class="levels">' + chips() + '</ol><span class="score">🪙 <b>' + s.coins + '</b> Münzen</span></div>' +
      (s.finished ? '' : '<div class="plaque"><small>Die Schatzkarte zeigt den Graphen von</small><div class="formula">' + r.formula + '</div></div>' +
      '<div class="mapbox' + (s.phase === 'mark' ? ' clickable' : '') + '">' + mapSvg() + '</div>') +
      '<div class="panel" data-r="panel"></div></div>';
    var panel = root.querySelector('[data-r="panel"]');

    if (s.finished) {
      h = '<div class="rule"><h2>' + LC.chest(true, 40) + ' Alle Schätze geborgen!</h2><p>Du hast <b>' + s.coins + ' Münzen</b> gesammelt.</p>' +
        '<p><b>Merke:</b> Nullstellen findest du mit <span class="mono">f(x) = 0</span>, den y-Achsenschnittpunkt mit <span class="mono">f(0)</span>. Es kann zwei, eine (Berührpunkt) oder keine Nullstelle geben, aber höchstens einen y-Achsenschnittpunkt.</p>' +
        '<button class="btn" data-a="restart">Noch einmal spielen</button></div>';
    } else if (s.phase === 'mark') {
      var n = s.found.filter(Boolean).length;
      h = '<p class="q">Tippe auf alle Stellen, an denen der Graph eine Koordinatenachse schneidet oder berührt.</p>' +
        '<p class="fine">Gefundene Schätze: <b>' + n + '</b>. Wenn du glaubst, alle zu haben, sag Bescheid.</p>' + fb() +
        '<button class="btn go" data-a="check">Ich habe alle Schätze markiert</button>';
    } else if (s.phase === 'solve') {
      var i = s.order[s.si], p = r.pts[i];
      h = '<div class="solvecard"><div class="lbl">Schatz ' + (s.si + 1) + ' von ' + s.order.length + (p.touch ? ' · Berührpunkt' : '') + '</div>';
      if (s.step === 'idea') {
        h += '<p class="q">Mit welcher Rechenidee bestätigst du diesen Punkt?</p><div class="stack">' +
          IDEAS.map(function (d) { return '<button class="btn opt" data-a="idea" data-v="' + d[0] + '">' + d[1] + '</button>'; }).join('') + '</div>';
      } else if (s.step === 'coord') {
        var lead = want(p) === 'y' ? 'Berechne f(0).' : want(p) === 'zero' ? 'Löse f(x) = 0.' : 'Setze x = 0 ein und löse f(x) = 0.';
        h += '<p class="q">' + lead + ' Wie lauten die genauen Koordinaten?</p>' +
          '<form class="coord" data-r="coord" autocomplete="off"><span>(</span><label><span class="sr">x-Koordinate</span><input inputmode="decimal" name="x" placeholder="x"></label><span>|</span><label><span class="sr">y-Koordinate</span><input inputmode="decimal" name="y" placeholder="y"></label><span>)</span>' +
          '<button class="btn go" type="submit">Truhe öffnen</button></form>';
      } else {
        h += '<button class="btn go" data-a="nextpt" data-focus>' + (s.si + 1 < s.order.length ? 'Nächster Schatz' : 'Runde abschließen') + '</button>';
      }
      h += fb() + '</div>';
    } else if (s.phase === 'roundEnd') {
      h = '<div class="rule"><h2>Runde ' + (s.ri + 1) + ' geschafft</h2><p>Gefunden: ' + r.pts.map(function (p) { return '<span class="mono">' + P(p.x, p.y) + '</span>'; }).join(', ') + '</p>' +
        '<p>' + r.insight + '</p>' +
        '<button class="btn go" data-a="nextround" data-focus>' + (s.ri + 1 < ROUNDS.length ? 'Nächste Karte' : 'Station abschließen') + '</button></div>';
    }
    panel.innerHTML = h;
    var inp = root.querySelector('input[name="x"]'); if (inp && s.focusInput) { try { inp.focus({ preventScroll: true }); } catch (e) {} s.focusInput = false; }
    var f = root.querySelector('[data-focus]'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
    s.justOpened = -1;
    if (opts.onProgress) opts.onProgress(s.finished ? ROUNDS.length : s.ri + (s.phase === 'roundEnd' ? 1 : 0), ROUNDS.length);
    if (s.finished && !s.reported) { s.reported = true; if (opts.onFinish) opts.onFinish(s.coins); }
  }

  function onMap(e) {
    if (s.phase !== 'mark') return;
    var svg = root.querySelector('svg.plane'); if (!svg || !svg.contains(e.target)) return;
    var r = R(), c = plane.fromEvent(svg, e), best = -1, bd = 1e9;
    var scale = svg.getBoundingClientRect().width / plane.w; // Toleranz in Bildschirmpixeln (~26px)
    r.pts.forEach(function (p, i) {
      var d = Math.hypot(plane.X(p.x) - c.px, plane.Y(p.y) - c.py) * scale;
      if (d < bd) { bd = d; best = i; }
    });
    if (bd <= 26) {
      if (!s.found[best]) { s.found[best] = true; s.order.push(best); s.miss = null; s.msg = { k: 'ok', t: '<b>Treffer!</b> Hier liegt ein Schatz.' + (r.pts[best].k === 'both' ? ' Er liegt sogar auf beiden Achsen.' : '') }; }
      else s.msg = { k: '', t: 'Diesen Schatz hast du schon markiert.' };
    } else {
      s.miss = c;
      var onGraph = Math.abs(plane.Y(r.f(c.x)) - c.py) * scale < 18;
      var onAxis = Math.abs(c.px - plane.X(0)) * scale < 16 || Math.abs(c.py - plane.Y(0)) * scale < 16;
      s.msg = { k: '', t: '<b>Hier liegt kein Schatz.</b> ' + (onGraph ? 'Der Punkt liegt zwar auf dem Graphen, aber auf keiner Achse.' : onAxis ? 'Der Punkt liegt zwar auf einer Achse, aber nicht auf dem Graphen.' : 'Schätze liegen dort, wo der Graph eine Achse trifft.') };
    }
    render();
  }

  function onClick(e) {
    var b = e.target.closest('[data-a]');
    if (!b) { onMap(e); return; }
    var a = b.dataset.a, r = R();
    if (a === 'restart') { s = fresh(); setRound(); render(); return; }
    if (a === 'check') {
      s.checks++;
      var missing = r.pts.filter(function (p, i) { return !s.found[i]; });
      if (!missing.length) {
        s.phase = 'solve'; s.si = 0; s.step = 'idea'; s.err = 0; s.miss = null;
        s.msg = r.pts.length === 1 ? { k: 'ok', t: 'Richtig, auf dieser Karte gibt es nur <b>einen</b> Schatz. Jetzt bestätigst du ihn rechnerisch.' } : { k: 'ok', t: 'Alle Schätze markiert. Jetzt bestätigst du jeden rechnerisch.' };
      } else {
        var y = missing.some(function (p) { return p.k !== 'x'; });
        s.msg = { k: '', t: '<b>Es fehlt noch etwas.</b> ' + (y ? 'Schau dir die y-Achse genau an: Wo kreuzt der Graph sie?' : 'Folge dem Graphen: Wo trifft er die x-Achse noch?') };
      }
    } else if (a === 'idea') {
      var p = r.pts[s.order[s.si]], v = b.dataset.v;
      if (v === want(p)) {
        if (s.err) { s.coins += 3; s.msg = { k: 'ok', t: '<b>Korrektur gelungen! +3 🪙</b> ' + ideaWhy(p) }; }
        else { s.coins += 5; s.msg = { k: 'ok', t: '<b>Richtige Idee! +5 🪙</b> ' + ideaWhy(p) }; }
        s.step = 'coord'; s.err = 0; s.focusInput = true;
      } else {
        s.err++;
        s.msg = { k: 'bad', t: '<b>Nicht ganz.</b> ' + (p.k === 'both' ? 'Das stimmt teilweise, aber dieser Punkt liegt auf beiden Achsen.' : p.k === 'x' ? 'Dieser Punkt liegt auf der x-Achse. Dort ist der y-Wert 0, also gilt f(x) = 0.' : 'Dieser Punkt liegt auf der y-Achse. Dort ist x = 0.') };
      }
    } else if (a === 'nextpt') {
      if (s.si + 1 < s.order.length) { s.si++; s.step = 'idea'; s.err = 0; s.msg = null; }
      else { s.phase = 'roundEnd'; s.msg = null; }
    } else if (a === 'nextround') {
      if (s.ri + 1 < ROUNDS.length) { s.ri++; setRound(); } else { s.finished = true; }
    }
    render();
  }
  function ideaWhy(p) {
    return p.k === 'x' ? 'Auf der x-Achse ist y = 0, also löst du f(x) = 0.' : p.k === 'y' ? 'Auf der y-Achse ist x = 0, also berechnest du f(0).' : 'Der Ursprung liegt auf beiden Achsen: x = 0 und y = 0.';
  }
  function onSubmit(e) {
    var form = e.target.closest('[data-r="coord"]'); if (!form) return;
    e.preventDefault();
    var r = R(), i = s.order[s.si], p = r.pts[i];
    var x = LC.parseNum(form.x.value), y = LC.parseNum(form.y.value);
    if (isNaN(x) || isNaN(y)) { s.msg = { k: '', t: 'Trage bitte beide Koordinaten als Zahl ein, z. B. <span class="mono">−2</span> und <span class="mono">0</span>.' }; render(); keep(form); return; }
    if (LC.near(x, p.x) && LC.near(y, p.y)) {
      s.opened[i] = true; s.justOpened = i; s.step = 'done';
      var bonus = s.err ? 'Korrektur gelungen! +5 🪙' : 'Genau! +10 🪙';
      s.coins += s.err ? 5 : 10;
      s.msg = { k: 'ok', t: '<b>' + bonus + ' Die Truhe ist offen.</b><br><span class="mono">' + p.calc + '</span><br>Also liegt der Schatz bei <b class="mono">' + P(p.x, p.y) + '</b>.' };
    } else {
      s.err++;
      var t = '';
      if (p.k === 'x' && !LC.near(y, 0)) t = 'Auf der x-Achse ist der y-Wert immer 0.';
      else if (p.k === 'y' && !LC.near(x, 0)) t = 'Auf der y-Achse ist der x-Wert immer 0.';
      else if (p.k === 'both' && !(LC.near(x, 0) && LC.near(y, 0))) t = 'Der Punkt liegt auf beiden Achsen. Dort ist x = 0 <b>und</b> y = 0.';
      else t = p.hint;
      if (s.err >= 3) t += '<br><b>Rechnung:</b> <span class="mono">' + p.calc + '</span>';
      s.msg = { k: 'bad', t: '<b>Die Truhe bleibt noch zu.</b> ' + t };
    }
    var vals = [form.x.value, form.y.value];
    render();
    if (s.step === 'coord') keep(root.querySelector('[data-r="coord"]'), vals);
  }
  function keep(form, vals) { if (form && vals) { form.x.value = vals[0]; form.y.value = vals[1]; } }

  root.addEventListener('click', onClick);
  root.addEventListener('submit', onSubmit);
  s = fresh(); setRound(); render();
} };
