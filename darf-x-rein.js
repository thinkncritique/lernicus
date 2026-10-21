/* Station 1: „Darf x rein?“ – als Modul, das sich in ein beliebiges Element einhängt. */
window.LernicusDarfXRein = { mount: function (root, opts) {
  opts = opts || {};
  root.innerHTML =
    '<div class="dxr">' +
    '<div class="dxr-top"><ol class="levels" data-r="levels"></ol><span class="score" data-r="score" aria-live="polite"></span></div>' +
    '<div data-r="plaque"></div>' +
    '<div class="scene" data-r="scene" data-mood="idle" role="img" aria-label="Szene: Links die Straße mit der Warteschlange, in der Mitte der Student als Türsteher an der Tür, rechts die Party der Zahlen im Club."></div>' +
    '<div class="dxr-stage" data-r="stage"></div>' +
    '<p class="fine">Kein Zeitdruck. Nach einem Hinweis darfst du noch einmal entscheiden. <button class="linkbtn" data-r="restart">Neu starten</button></p>' +
    '</div>';
  var $r = function (k) { return root.querySelector('[data-r="' + k + '"]'); };
  var KEY = 'lernicus-darf-x-rein';
  var fmt = function (n) { var r = Math.round(n * 1e6) / 1e6; return String(r).replace('.', ',').replace('-', '−'); };
  var frac = function (a, b) { return '<span class="frac"><span>' + a + '</span><span>' + b + '</span></span>'; };

  var LEVELS = [
    { name: 'Alle willkommen',
      rule: 'Bei Funktionen wie x² + 3 oder 2x − 5 kannst du jede reelle Zahl einsetzen. Es gibt nichts, was nicht ausrechenbar wäre. Der Definitionsbereich ist ganz ℝ.',
      rounds: [
        { formula: 'f(x) = x<sup>2</sup> + 3', f: function (x) { return x * x + 3; }, cards: [-3, 0, 2.5, 7],
          opts: [['ℝ', 1], ['ℝ \\ {0}', 0], ['ℝ⁺ (nur x > 0)', 0], ['ℝ \\ {−3}', 0]], df: 'ℝ' },
        { formula: 'f(x) = 2x − 5', f: function (x) { return 2 * x - 5; }, cards: [-4, 0, 1.5, 10],
          opts: [['ℝ', 1], ['ℝ \\ {2,5}', 0], ['x ≥ 0', 0], ['ℝ \\ {0}', 0]], df: 'ℝ' }
      ] },
    { name: 'Verbotene Zahlen',
      rule: 'Im Nenner eines Bruchs darf nie null stehen. Setze den Nenner gleich null, löse die Gleichung und schließe diese Zahl aus. Bei 1/(x − 2) ist das die 2: D<sub>f</sub> = ℝ \\ {2}. Negative Funktionswerte sind dagegen völlig in Ordnung.',
      rounds: [
        { formula: 'f(x) = ' + frac(1, 'x − 2'), f: function (x) { return 1 / (x - 2); }, den: function (x) { return x - 2; },
          denText: function (x) { return fmt(x) + ' − 2'; }, cards: [-3, 0, 1.9, 2, 2.1, 5], bad: 2, line: [-3, 6],
          opts: [['ℝ \\ {2}', 1], ['ℝ', 0], ['ℝ \\ {−2}', 0], ['x > 2', 0]], df: 'ℝ \\ {2}' },
        { formula: 'f(x) = ' + frac(3, 'x + 1'), f: function (x) { return 3 / (x + 1); }, den: function (x) { return x + 1; },
          denText: function (x) { return fmt(x) + ' + 1'; }, cards: [-2, -1, -0.9, 0, 4], bad: -1, line: [-4, 4],
          opts: [['ℝ \\ {−1}', 1], ['ℝ \\ {1}', 0], ['ℝ', 0], ['x > −1', 0]], df: 'ℝ \\ {−1}' }
      ] }
  ];
  var SOON = [];
  var finished = false;

  var maxScore = 0;
  LEVELS.forEach(function (L) { L.rounds.forEach(function (R) {
    maxScore += R.cards.length * 10 + (R.den ? 5 + 10 : 0) + 10;
  }); });

  var best = 0;
  try { best = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) {}
  var stage = $r('stage');
  var plaqueEl = $r('plaque');
  var sceneEl = $r('scene');
  var guestsEl, bubbleEl, guestEls = [], sceneKey = '', runId = 0;
  var s;

  /* ---------- Szene ---------- */
  function logoSvg() {
    var n = '#1f3a5f';
    return '<g fill="' + n + '">' +
      '<polygon points="16,24 50,11 84,24 50,37"/><path d="M31 29 v11 q19 9 38 0 v-11 l-19 8z"/>' +
      '<path d="M82 25 v12" stroke="' + n + '" stroke-width="2" fill="none"/><circle cx="82" cy="39" r="2.4"/>' +
      '<path d="M26 52 L29 36 L40 42 L60 42 L71 36 L74 52 q0 11 -24 11 q-24 0 -24 -11z"/>' +
      '<ellipse cx="50" cy="76" rx="26" ry="23"/></g>' +
      '<circle cx="40" cy="49" r="10" fill="#fff"/><circle cx="60" cy="49" r="10" fill="#fff"/>' +
      '<circle cx="40" cy="49" r="5" fill="' + n + '"/><circle cx="60" cy="49" r="5" fill="' + n + '"/>' +
      '<circle cx="40" cy="49" r="1.8" fill="#fff"/><circle cx="60" cy="49" r="1.8" fill="#fff"/>' +
      '<path d="M46 56 L50 63 L54 56z" fill="#fff"/>' +
      '<path d="M50 62 C38 66 36 82 50 94 C64 82 62 66 50 62z" fill="none" stroke="#fff" stroke-width="2.2"/>' +
      '<path d="M45 72q2.5 3 5 0M52 72q2.5 3 5 0M42 79q2.5 3 5 0M49 79q2.5 3 5 0M56 79q2.5 3 5 0M46 86q2.5 3 5 0M52 86q2.5 3 5 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<g fill="' + n + '"><path d="M8 90 Q32 86 50 97 V103 Q30 93 8 96z"/><path d="M92 90 Q68 86 50 97 V103 Q70 93 92 96z"/><rect x="6" y="103" width="88" height="3" rx="1.5"/></g>' +
      '<path d="M14 93 Q32 90 47 99M86 93 Q68 90 53 99" stroke="#fff" stroke-width="1.3" fill="none"/>';
  }
  function lampSvg() {
    var o = '';
    o += '<circle cx="150" cy="70" r="44" fill="url(#glow)" style="opacity:var(--lampop)"/>';
    // Mast mit Fuß, Ring und geschwungenem Ausleger
    o += '<rect class="s-pole" x="108" y="236" width="20" height="14" rx="2"/><rect class="s-pole" x="112" y="228" width="12" height="10" rx="2"/>';
    o += '<rect class="s-pole" x="115" y="64" width="6" height="168"/>';
    o += '<path class="s-pole" d="M115 66 q0 -16 20 -16 h16 v5 h-16 q-15 0 -15 11z"/>';
    // Lampenkopf
    o += '<path class="s-pole" d="M142 50 h28 l-4 8 h-20z"/><path d="M146 58 h20 l-3 6 h-14z" fill="var(--lamp)"/>';
    // Querstange und Banner mit Logo
    o += '<rect class="s-pole" x="62" y="80" width="60" height="4" rx="2"/><circle class="s-pole" cx="62" cy="82" r="3.5"/>';
    o += '<path d="M70 84 v-1M118 84 v-1" stroke="var(--pole)" stroke-width="1.5"/>';
    o += '<path d="M70 83 H118 V157 L94 147 L70 157Z" fill="#f6f8fb" stroke="#1f3a5f" stroke-width="1.6" stroke-linejoin="round"/>';
    o += '<g transform="translate(76 89) scale(.36)">' + logoSvg() + '</g>';
    o += '<text x="94" y="139" text-anchor="middle" font-size="6.4" font-weight="800" fill="#1f3a5f" letter-spacing=".3" font-family="Bricolage Grotesque, Trebuchet MS, sans-serif">LERNICUS</text>';
    return o;
  }
  function sceneSvg() {
    var o = [], i, c;
    o.push('<svg viewBox="0 0 560 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">');
    o.push('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky-top)"/><stop offset="1" style="stop-color:var(--sky-bot)"/></linearGradient>' +
      '<radialGradient id="glow"><stop offset="0" style="stop-color:var(--lamp);stop-opacity:.8"/><stop offset="1" style="stop-color:var(--lamp);stop-opacity:0"/></radialGradient></defs>');
    o.push('<rect width="560" height="300" fill="url(#sky)"/>');
    var houses = [[0, 120, 64, 130, 's-house2', [10, 36], [134, 160, 186]], [66, 92, 84, 158, 's-house', [76, 100, 124], [106, 134, 162, 190]], [152, 130, 92, 120, 's-house2', [162, 186, 210], [144, 172, 200]]];
    houses.forEach(function (H) {
      o.push('<rect class="' + H[4] + '" x="' + H[0] + '" y="' + H[1] + '" width="' + H[2] + '" height="' + H[3] + '"/>');
      H[5].forEach(function (wx) { H[6].forEach(function (wy) { o.push('<rect class="s-win" x="' + wx + '" y="' + wy + '" width="14" height="16" rx="1"/>'); }); });
    });
    o.push('<rect class="s-trunk" x="54" y="196" width="8" height="56"/><circle class="s-tree" cx="58" cy="184" r="26"/><circle class="s-tree" cx="40" cy="198" r="18"/><circle class="s-tree" cx="76" cy="198" r="18"/>');
    o.push(lampSvg());
    o.push('<rect class="s-bench" x="172" y="238" width="38" height="5" rx="1"/><rect class="s-bench" x="172" y="227" width="38" height="4" rx="1"/><rect class="s-bench" x="175" y="243" width="3" height="9"/><rect class="s-bench" x="204" y="243" width="3" height="9"/>');
    o.push('<rect class="s-pave" x="0" y="250" width="560" height="50"/><rect class="s-curb" x="0" y="250" width="560" height="4"/>');
    for (i = 0; i < 11; i++) o.push('<path class="s-curb" d="M' + (i * 56) + ' 254 L' + (i * 56 - 12) + ' 300" stroke="var(--curb)" stroke-width="1.5" opacity=".6" fill="none"/>');
    // Club
    o.push('<rect class="s-trim" x="240" y="26" width="326" height="12" rx="2"/><rect class="s-wall" x="246" y="34" width="314" height="216" rx="3"/>');
    o.push('<rect class="s-inter" x="300" y="58" width="248" height="192"/><rect class="s-inter" x="258" y="118" width="44" height="132"/>');
    for (c = 0; c < 8; c++) {
      o.push('<rect class="' + (c % 2 ? 's-fa' : 's-fb') + '" x="' + (300 + c * 31) + '" y="214" width="31" height="19"/>');
      o.push('<rect class="' + (c % 2 ? 's-fb' : 's-fa') + '" x="' + (300 + c * 31) + '" y="233" width="31" height="17"/>');
    }
    o.push('<rect class="s-fb" x="258" y="214" width="42" height="36"/>');
    o.push('<polygon class="beam" points="424,90 350,214 392,214" fill="#ff5fa2"/><polygon class="beam b2" points="424,90 410,214 462,214" fill="#46d3ff"/><polygon class="beam b3" points="424,90 482,214 526,214" fill="#ffd24a"/>');
    o.push('<rect class="s-spk" x="306" y="150" width="24" height="62" rx="3"/><circle cx="318" cy="166" r="6" fill="none" stroke="#6b5a8c" stroke-width="2"/><circle cx="318" cy="193" r="9" fill="none" stroke="#6b5a8c" stroke-width="2"/>');
    o.push('<rect class="s-spk" x="518" y="150" width="24" height="62" rx="3"/><circle cx="530" cy="166" r="6" fill="none" stroke="#6b5a8c" stroke-width="2"/><circle cx="530" cy="193" r="9" fill="none" stroke="#6b5a8c" stroke-width="2"/>');
    o.push('<path d="M424 58 V76" stroke="#8d97b0" stroke-width="2"/><circle class="s-ball" cx="424" cy="90" r="14"/><path d="M410 90h28M424 76v28" stroke="#8d97b0" stroke-width="1.2" fill="none"/><ellipse cx="424" cy="90" rx="7" ry="14" fill="none" stroke="#8d97b0" stroke-width="1.2"/>');
    o.push('<circle cx="326" cy="72" r="5" fill="#ff5fa2"/><circle cx="520" cy="72" r="5" fill="#46d3ff"/>');
    o.push('<rect x="256" y="116" width="48" height="136" fill="none" stroke="var(--trim)" stroke-width="5"/>');
    o.push('<rect class="s-sign" x="232" y="62" width="94" height="38" rx="7" stroke="#ff5fa2" stroke-width="2"/><text class="s-neon" x="279" y="89" text-anchor="middle" font-size="21" font-weight="800" fill="#ff7ab8" font-family="Bricolage Grotesque, Trebuchet MS, sans-serif">x-Club</text>');
    o.push('<path d="M258 250 L302 250 L324 288 L238 288 Z" fill="#b3222f" opacity=".92"/>');
    // Student als Türsteher
    var skin = '#e2a982', hood = '#e8743b', hood2 = '#cf5f2a', pack = '#3a3a4c';
    o.push('<g>' +
      '<ellipse cx="228" cy="274" rx="28" ry="5" fill="#000" opacity=".22"/>' +
      '<rect x="204" y="186" width="50" height="46" rx="12" fill="' + pack + '"/>' +
      '<rect x="214" y="230" width="12" height="38" rx="3" fill="#35507a"/><rect x="232" y="230" width="12" height="38" rx="3" fill="#35507a"/>' +
      '<rect x="210" y="264" width="19" height="8" rx="4" fill="#f4f4f4"/><rect x="229" y="264" width="19" height="8" rx="4" fill="#f4f4f4"/>' +
      '<rect x="209" y="184" width="40" height="52" rx="14" fill="' + hood + '"/>' +
      '<path d="M214 186 q15 14 30 0 q-4 -6 -15 -6 q-11 0 -15 6z" fill="' + hood2 + '"/>' +
      '<rect x="218" y="216" width="22" height="11" rx="4" fill="' + hood2 + '"/>' +
      '<path d="M217 190v26M241 190v26" stroke="' + pack + '" stroke-width="3" fill="none"/>' +
      '<path d="M222 190 L229 212 L236 190" stroke="#d9415a" stroke-width="2" fill="none"/><rect x="224" y="210" width="10" height="13" rx="2" fill="#fff"/><rect x="226" y="213" width="6" height="2" fill="#98a2b3"/>' +
      '<circle cx="229" cy="166" r="15" fill="' + skin + '"/>' +
      '<path d="M213 164 q-1 -19 16 -19 q17 0 16 19 q-5 -9 -16 -9 q-11 0 -16 9z" fill="#2c2830"/>' +
      '<circle cx="223" cy="169" r="5" fill="none" stroke="#1c1c24" stroke-width="1.6"/><circle cx="235" cy="169" r="5" fill="none" stroke="#1c1c24" stroke-width="1.6"/><path d="M228 169h2" stroke="#1c1c24" stroke-width="1.6"/><circle cx="223" cy="169" r="1.5" fill="#1c1c24"/><circle cx="235" cy="169" r="1.5" fill="#1c1c24"/>' +
      '<path class="m-smile" d="M224 177 q5 5 10 0" stroke="#7a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/><path class="m-flat" d="M225 178 h8" stroke="#7a3b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<path d="M211 192 q-8 12 -2 26 l8 2" stroke="' + hood + '" stroke-width="9" stroke-linecap="round" fill="none"/>' +
      '<rect x="207" y="206" width="20" height="26" rx="3" fill="#1d2433"/><rect x="209.5" y="209" width="15" height="20" rx="1.5" fill="#dfe9ff"/><path d="M212 214h9M212 218h9M212 222h6" stroke="#5a6ea3" stroke-width="1.4"/><circle cx="214" cy="228" r="4" fill="' + skin + '"/>' +
      '<g class="a-idle"><path d="M247 192 q8 14 2 28" stroke="' + hood + '" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="249" cy="223" r="4" fill="' + skin + '"/></g>' +
      '<g class="a-in"><path d="M247 192 L266 198 L284 194" stroke="' + hood + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="288" cy="194" r="4.2" fill="' + skin + '"/><path d="M291 193 h6" stroke="' + skin + '" stroke-width="3" stroke-linecap="round"/></g>' +
      '<g class="a-out"><path d="M247 192 L260 188 L260 170" stroke="' + hood + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none"/><rect x="254.5" y="154" width="11" height="16" rx="5" fill="' + skin + '"/></g>' +
      '</g>');
    o.push('</svg>');
    return o.join('');
  }
  function buildScene() {
    sceneEl.innerHTML = sceneSvg() + '<div class="guests" id="guests"></div><div class="bubble" id="bubble"></div>';
    guestsEl = sceneEl.querySelector('.guests');
    bubbleEl = sceneEl.querySelector('.bubble');
  }
  function syncScene() {
    var r = R(), key = runId + '-' + s.li + '-' + s.ri;
    if (key !== sceneKey) {
      sceneKey = key; guestsEl.innerHTML = ''; guestEls = [];
      r.cards.forEach(function (c, i) {
        var g = document.createElement('div');
        g.className = 'guest pop wait';
        g.style.setProperty('--h', String((i * 57 + 20) % 360));
        g.style.animationDelay = (i * 0.12) + 's';
        g.innerHTML = '<span>' + fmt(c) + '</span>';
        g.dataset.st = '';
        guestsEl.appendChild(g); guestEls.push(g);
      });
    }
    var inK = 0, outK = 0;
    r.cards.forEach(function (c, i) {
      var g = guestEls[i], m = s.marks[i], st, L, B, k;
      if (m === 'in') { k = inK++; st = 'in'; L = 63 + (k % 4) * 10; B = (k < 4 ? 17 : 25) + (k % 2 ? 2 : 0); }
      else if (m === 'out') { k = outK++; st = 'out'; L = 8 + k * 9; B = 1.5; }
      else if (i === s.ci) { st = 'cur'; L = 31; B = 8; }
      else { var j = i - s.ci, step = Math.min(6, 24 / Math.max(1, r.cards.length - 1)); st = 'wait'; L = 29 - j * step; B = j % 2 ? 15.5 : 8; }
      g.style.zIndex = String(Math.round(100 - B));
      if (st === 'in' && g.dataset.st !== 'in') {
        g.style.left = '49%'; g.style.bottom = '14%';
        clearTimeout(g._t);
        g._t = setTimeout((function (gg, l, b) { return function () { gg.style.left = l + '%'; gg.style.bottom = b + '%'; }; })(g, L, B), 550);
      } else { g.style.left = L + '%'; g.style.bottom = B + '%'; }
      if (g.dataset.st !== st) {
        g.dataset.st = st;
        g.className = 'guest ' + st;
        if (st === 'in') g.style.animationDelay = ((i * 0.17) % 0.8) + 's';
      }
    });
    var ended = s.phase === 'levelEnd' || s.phase === 'finish';
    var bt = ended ? 'Gute Arbeit!' : s.phase === 'roundEnd' ? 'Der Club ist offen.' : s.phase === 'line' ? 'Wer war draußen?' : s.phase === 'domain' ? 'Die Gästeliste?' : s.bubble;
    bubbleEl.textContent = bt;
    sceneEl.setAttribute('data-mood', (s.phase === 'cards' || s.phase === 'reason' || s.phase === 'explain') ? s.mood : 'idle');
  }

  /* ---------- Spiellogik ---------- */
  function shuffle(a) { return a.map(function (v) { return [Math.random(), v]; }).sort(function (x, y) { return x[0] - y[0]; }).map(function (p) { return p[1]; }); }
  function fresh() { runId++; return { li: 0, ri: 0, ci: 0, phase: 'cards', tries: 0, rt: 0, lt: 0, dt: 0, score: 0, msg: null, marks: [], anim: '', picked: null, reasons: null, opts: null, mood: 'idle', bubble: 'Wer darf rein?' }; }
  function R() { return LEVELS[s.li].rounds[s.ri]; }
  function isBad(x) { var r = R(); return !!r.den && Math.abs(r.den(x)) < 1e-9; }
  function setRound() { s.ci = 0; s.marks = []; s.tries = s.rt = s.lt = s.dt = 0; s.phase = 'cards'; s.msg = null; s.anim = ''; s.mood = 'idle'; s.bubble = 'Wer darf rein?'; s.opts = shuffle(R().opts.map(function (o) { return o.slice(); })); }
  function reveal(x) { s.mood = isBad(x) ? 'out' : 'in'; s.bubble = isBad(x) ? 'Heute nicht.' : 'Komm rein!'; }

  function fbHtml() { return s.msg ? '<div class="fb ' + (s.msg.k || '') + '" role="status">' + s.msg.t + '</div>' : ''; }
  function ticketHtml(x, state) {
    var cl = state === 'in' ? 'ok' : state === 'out' ? 'no' : '';
    var stamp = state === 'in' ? '<span class="stamp">Drin</span>' : state === 'out' ? '<span class="stamp">Draußen</span>' : '';
    return '<div class="ticket ' + cl + ' ' + (s.anim || '') + '"><div><div class="lbl">Will rein: x =</div><div class="num">' + fmt(x) + '</div></div>' + stamp + '</div>';
  }
  function plaque() { return '<div class="plaque"><small>Die Funktion am Eingang</small><div class="formula">' + R().formula + '</div></div>'; }

  function explain(x) {
    var r = R(), v;
    if (isBad(x)) {
      return '<b>Muss draußen bleiben.</b> Für x = ' + fmt(x) + ' wird der Nenner ' + r.denText(x) + ' = 0. Durch null dürfen wir nicht teilen.';
    }
    v = r.f(x);
    var t = '<b>Darf rein.</b> Für x = ' + fmt(x) + ' ergibt sich f(' + fmt(x) + ') = ' + fmt(v) + '.';
    if (r.den) {
      t += ' Der Nenner ist ' + r.denText(x) + ' = ' + fmt(r.den(x)) + ', also nicht null.';
      if (v < 0) t += ' Ein negatives Ergebnis ist erlaubt.';
    }
    return t;
  }

  function render() {
    var r = R(), L = LEVELS[s.li], x = r.cards[s.ci], h = '';
    $r('score').innerHTML = 'Punkte <b>' + s.score + '</b> / ' + maxScore + (best ? ' · Bestwert ' + best : '');
    var lv = LEVELS.map(function (l, i) {
      var c = s.phase === 'finish' || i < s.li ? 'done' : i === s.li ? 'on' : '';
      return '<li class="' + c + '">Level ' + (i + 1) + ' · ' + l.name + '</li>';
    }).join('') + SOON.map(function (n, i) { return '<li class="soon">Level ' + (LEVELS.length + i + 1) + ' · ' + n + ' (bald)</li>'; }).join('');
    $r('levels').innerHTML = lv;
    reportProgress();

    var ended = s.phase === 'finish' || s.phase === 'levelEnd';
    plaqueEl.innerHTML = ended ? '' : plaque();
    syncScene();

    if (s.phase === 'finish') {
      h = '<div class="rule"><h2>Der Club ist geöffnet.</h2><p>Du hast <b>' + s.score + ' von ' + maxScore + ' Punkten</b> geholt.</p>' +
        '<p class="fine">Du kannst jetzt zwei Fälle erkennen: Bei Polynomen gibt es keine Einschränkung, bei Brüchen darf der Nenner nicht null werden.</p>' +
        '<button class="btn go" id="again" data-a="restart">Noch einmal spielen</button></div>';
      stage.innerHTML = h;
      if (!finished) { finished = true; if (opts.onFinish) opts.onFinish(s.score, maxScore); }
      return;
    }
    if (s.phase === 'levelEnd') {
      h = '<div class="rule"><h2>Level ' + (s.li + 1) + ' geschafft: ' + L.name + '</h2><p><b>Regel, die du entdeckt hast:</b></p><p>' + L.rule + '</p>' +
        '<button class="btn go" id="lnext" data-a="lnext" data-focus>' + (s.li + 1 < LEVELS.length ? 'Weiter zu Level ' + (s.li + 2) : 'Fertig') + '</button></div>';
      stage.innerHTML = h; return;
    }

    if (s.phase === 'cards' || s.phase === 'reason' || s.phase === 'explain') {
      var st = s.phase === 'cards' ? '' : (isBad(x) ? 'out' : 'in');
      h += ticketHtml(x, st);
    }
    if (s.phase === 'cards') {
      h += '<p class="q">Darf diese Zahl in den Club?</p><p class="fine dxr-drag">Tippe auf eine Schaltfläche oder ziehe die Karte darauf.</p><div class="row">' +
        '<button class="btn yes" id="b-in" data-a="decide" data-v="in" data-focus>Darf rein</button>' +
        '<button class="btn no" id="b-out" data-a="decide" data-v="out">Muss draußen bleiben</button></div>' + fbHtml();
    } else if (s.phase === 'reason') {
      h += '<p class="q">Warum muss x = ' + fmt(x) + ' draußen bleiben?</p><div class="stack">' +
        s.reasons.map(function (o, i) { return '<button class="btn" id="reason-' + i + '" data-a="reason" data-i="' + i + '"' + (i === 0 ? ' data-focus' : '') + '>' + o[0] + '</button>'; }).join('') + '</div>' + fbHtml();
    } else if (s.phase === 'explain') {
      h += fbHtml() + '<button class="btn go" id="next" data-a="next" data-focus>Nächste Zahl</button>';
    } else if (s.phase === 'line') {
      var ticks = '';
      for (var n = r.line[0]; n <= r.line[1]; n++) {
        ticks += '<button class="tick' + (s.picked === n ? ' mark' : '') + '" id="tick-' + (n < 0 ? 'm' + (-n) : n) + '" data-a="tick" data-v="' + n + '"><i></i><span>' + fmt(n) + '</span></button>';
      }
      h += '<p class="q">Markiere auf der Zahlengeraden die Zahl, die draußen bleiben muss.</p><div class="line" role="group" aria-label="Zahlengerade">' + ticks + '</div>' + fbHtml();
    } else if (s.phase === 'domain') {
      h += '<p class="q">Wie lautet der Definitionsbereich?</p><div class="stack">' +
        s.opts.map(function (o, i) { return '<button class="btn opt" id="dom-' + i + '" data-a="dom" data-i="' + i + '"' + (i === 0 ? ' data-focus' : '') + '>D<sub>f</sub> = ' + o[0] + '</button>'; }).join('') + '</div>' + fbHtml();
    } else if (s.phase === 'roundEnd') {
      h += '<div class="rule"><h2>Runde geschafft</h2><p>Für <span class="mono">' + r.formula + '</span> gilt:</p><p class="mono" style="font-size:1.3rem">D<sub>f</sub> = ' + r.df + '</p>' +
        '<button class="btn go" id="rnext" data-a="rnext" data-focus>' + (s.ri + 1 < L.rounds.length ? 'Nächste Funktion' : 'Level abschließen') + '</button></div>';
    }
    stage.innerHTML = h;
    var f = stage.querySelector('[data-focus]');
    if (f) { try { f.focus({ preventScroll: true }); } catch (e) {} }
  }

  function finishIfDone() {
    try { if (s.score > best) { best = s.score; localStorage.setItem(KEY, String(best)); } } catch (e) {}
  }

  stage.addEventListener('click', handle);
  $r('restart').addEventListener('click', function () { s = fresh(); setRound(); render(); });
  function handle(e) {
    var b = e.target.closest('[data-a]'); if (!b) return;
    var a = b.dataset.a, r = R(), x = r.cards[s.ci];
    if (a === 'restart') { s = fresh(); setRound(); render(); return; }
    if (a === 'decide') {
      var inn = b.dataset.v === 'in', ok = inn === !isBad(x);
      if (ok) {
        s.score += s.tries === 0 ? 10 : 5; s.marks.push(inn ? 'in' : 'out'); s.anim = inn ? 'fly-in' : 'fly-out';
        reveal(x);
        if (!inn) { s.phase = 'reason'; s.rt = 0; s.msg = null;
          s.reasons = shuffle([['Der Nenner wird null.', 1], ['Das Ergebnis wird negativ.', 0], ['Die Zahl ist zu groß.', 0]]);
        } else { s.phase = 'explain'; s.msg = { k: 'ok', t: explain(x) }; }
      } else {
        s.tries++;
        if (s.tries >= 2) { s.marks.push(isBad(x) ? 'out' : 'in'); s.phase = 'explain'; s.anim = ''; reveal(x); s.msg = { k: 'bad', t: explain(x) }; }
        else { s.bubble = 'Hmm, sicher?'; s.msg = { k: '', t: isBad(x) ? '<b>Hinweis:</b> Setze die Zahl in den Nenner ein und rechne aus. Was kommt heraus?' : '<b>Hinweis:</b> Setze die Zahl ein und rechne f(x) aus. Geht das ohne Problem?' }; }
      }
    } else if (a === 'reason') {
      var o = s.reasons[+b.dataset.i];
      if (o[1]) { if (s.rt === 0) s.score += 5; s.phase = 'explain'; s.msg = { k: 'ok', t: explain(x) }; }
      else { s.rt++;
        if (s.rt >= 2) { s.phase = 'explain'; s.msg = { k: 'bad', t: explain(x) }; }
        else s.msg = { k: '', t: '<b>Hinweis:</b> Rechne den Nenner für x = ' + fmt(x) + ' aus: ' + r.denText(x) + '. Was passiert mit dem Bruch?' };
      }
    } else if (a === 'next') {
      s.ci++; s.tries = 0; s.msg = null; s.anim = ''; s.mood = 'idle'; s.bubble = 'Wer darf rein?';
      if (s.ci >= r.cards.length) { s.phase = r.den ? 'line' : 'domain'; s.picked = null; }
      else s.phase = 'cards';
    } else if (a === 'tick') {
      var n = +b.dataset.v;
      if (n === r.bad) { if (s.lt === 0) s.score += 10; s.picked = n; s.phase = 'domain'; s.msg = null; }
      else { s.lt++; s.picked = n;
        if (s.lt >= 2) { s.picked = r.bad; s.phase = 'domain'; s.msg = { k: 'bad', t: 'Gesucht war die ' + fmt(r.bad) + '. Dort wird der Nenner null.' }; }
        else s.msg = { k: '', t: '<b>Hinweis:</b> Welche Zahl hat dich vorhin nicht hineingelassen?' };
      }
    } else if (a === 'dom') {
      var op = s.opts[+b.dataset.i];
      if (op[1]) { if (s.dt === 0) s.score += 10; s.phase = 'roundEnd'; s.msg = null; }
      else { s.dt++;
        if (s.dt >= 2) { s.phase = 'roundEnd'; s.msg = null; }
        else s.msg = { k: '', t: '<b>Hinweis:</b> ' + (r.den ? 'Welche Zahl hast du ausgeschlossen? Nur diese fehlt im Definitionsbereich.' : 'Gab es eine Zahl, die nicht eingesetzt werden konnte?') };
      }
    } else if (a === 'rnext') {
      if (s.ri + 1 < LEVELS[s.li].rounds.length) { s.ri++; setRound(); } else { s.phase = 'levelEnd'; }
    } else if (a === 'lnext') {
      if (s.li + 1 < LEVELS.length) { s.li++; s.ri = 0; setRound(); } else { s.phase = 'finish'; finishIfDone(); }
    }
    render();
  }

  /* Fortschritt nach außen melden: abgeschlossene Runden von allen Runden */
  function reportProgress() {
    if (!opts.onProgress) return;
    var total = 0, done = 0;
    LEVELS.forEach(function (L, li) { L.rounds.forEach(function (Rr, ri) {
      total++;
      if (s.phase === 'finish' || li < s.li || (li === s.li && (ri < s.ri || (ri === s.ri && (s.phase === 'roundEnd' || s.phase === 'levelEnd'))))) done++;
    }); });
    opts.onProgress(done, total);
  }

  /* Drag-and-drop: Karte auf „Darf rein“ oder „Muss draußen bleiben“ ziehen */
  stage.addEventListener('pointerdown', function (e) {
    var t = e.target.closest('.ticket');
    if (!t || s.phase !== 'cards' || e.button > 0) return;
    var sx = e.clientX, sy = e.clientY, moved = false, over = null;
    t.setPointerCapture && t.setPointerCapture(e.pointerId);
    function mv(ev) {
      var dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!moved && Math.abs(dx) + Math.abs(dy) < 6) return;
      moved = true; t.classList.add('dragging');
      t.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx / 40) + 'deg)';
      t.style.pointerEvents = 'none';
      var el = document.elementFromPoint(ev.clientX, ev.clientY);
      var b = el && el.closest('[data-a="decide"]');
      if (over && over !== b) over.classList.remove('drop');
      over = b; if (b) b.classList.add('drop');
    }
    function up() {
      t.removeEventListener('pointermove', mv); t.removeEventListener('pointerup', up); t.removeEventListener('pointercancel', up);
      t.style.pointerEvents = '';
      if (over) { over.classList.remove('drop'); handle({ target: over }); return; }
      t.classList.remove('dragging'); t.style.transform = '';
    }
    t.addEventListener('pointermove', mv); t.addEventListener('pointerup', up); t.addEventListener('pointercancel', up);
  });

  buildScene();
  s = fresh(); setRound(); render();
} };
