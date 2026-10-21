/* Gemeinsame Helfer für alle Stationen: Zahlen formatieren, Eingaben lesen, Koordinatensysteme zeichnen. */
window.LC = (function () {
  function fmt(n) {
    var r = Math.round(n * 1e6) / 1e6;
    if (Object.is(r, -0)) r = 0;
    return String(r).replace('.', ',').replace('-', '−');
  }
  /* Liest Eingaben wie "-2", "−2", "2,5", "1/2" */
  function parseNum(str) {
    if (str == null) return NaN;
    var t = String(str).trim().replace(/\s+/g, '').replace(/[−–]/g, '-').replace(',', '.');
    if (t === '' || t === '-' ) return NaN;
    var m = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
    if (m) return +m[2] === 0 ? NaN : +m[1] / +m[2];
    if (!/^-?\d*\.?\d+$/.test(t)) return NaN;
    return +t;
  }
  function near(a, b) { return Math.abs(a - b) < 1e-9; }
  function pt(x, y) { return '(' + fmt(x) + ' | ' + fmt(y) + ')'; }

  /* Koordinatensystem: bildet Mathe-Koordinaten auf SVG-Pixel ab */
  function Plane(o) {
    this.x0 = o.xmin; this.x1 = o.xmax; this.y0 = o.ymin; this.y1 = o.ymax;
    this.w = o.w || 400; this.h = o.h || 400; this.pad = o.pad == null ? 26 : o.pad;
    this.xstep = o.xstep || 1; this.ystep = o.ystep || 1;
    this.xlab = o.xlab || this.xstep; this.ylab = o.ylab || this.ystep;
  }
  Plane.prototype.X = function (x) { return this.pad + (x - this.x0) / (this.x1 - this.x0) * (this.w - 2 * this.pad); };
  Plane.prototype.Y = function (y) { return this.h - this.pad - (y - this.y0) / (this.y1 - this.y0) * (this.h - 2 * this.pad); };
  Plane.prototype.invX = function (px) { return this.x0 + (px - this.pad) / (this.w - 2 * this.pad) * (this.x1 - this.x0); };
  Plane.prototype.invY = function (py) { return this.y0 + (this.h - this.pad - py) / (this.h - 2 * this.pad) * (this.y1 - this.y0); };
  Plane.prototype.axes = function () {
    var o = [], v, X = this.X.bind(this), Y = this.Y.bind(this);
    o.push('<g class="grid">');
    for (v = Math.ceil(this.x0 / this.xstep) * this.xstep; v <= this.x1 + 1e-9; v += this.xstep) o.push('<line x1="' + X(v) + '" y1="' + Y(this.y0) + '" x2="' + X(v) + '" y2="' + Y(this.y1) + '"/>');
    for (v = Math.ceil(this.y0 / this.ystep) * this.ystep; v <= this.y1 + 1e-9; v += this.ystep) o.push('<line x1="' + X(this.x0) + '" y1="' + Y(v) + '" x2="' + X(this.x1) + '" y2="' + Y(v) + '"/>');
    o.push('</g><g class="axis">');
    o.push('<line x1="' + X(this.x0) + '" y1="' + Y(0) + '" x2="' + (X(this.x1) + 10) + '" y2="' + Y(0) + '"/>');
    o.push('<line x1="' + X(0) + '" y1="' + Y(this.y0) + '" x2="' + X(0) + '" y2="' + (Y(this.y1) - 10) + '"/>');
    o.push('<path d="M' + (X(this.x1) + 14) + ' ' + Y(0) + ' l-9 -5 v10z M' + X(0) + ' ' + (Y(this.y1) - 14) + ' l-5 9 h10z" class="arrow"/>');
    o.push('</g><g class="ticks">');
    for (v = Math.ceil(this.x0 / this.xlab) * this.xlab; v <= this.x1 + 1e-9; v += this.xlab) {
      if (near(v, 0)) continue;
      o.push('<line x1="' + X(v) + '" y1="' + (Y(0) - 4) + '" x2="' + X(v) + '" y2="' + (Y(0) + 4) + '"/><text x="' + X(v) + '" y="' + (Y(0) + 17) + '" text-anchor="middle">' + fmt(v) + '</text>');
    }
    for (v = Math.ceil(this.y0 / this.ylab) * this.ylab; v <= this.y1 + 1e-9; v += this.ylab) {
      if (near(v, 0)) continue;
      o.push('<line x1="' + (X(0) - 4) + '" y1="' + Y(v) + '" x2="' + (X(0) + 4) + '" y2="' + Y(v) + '"/><text x="' + (X(0) - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + fmt(v) + '</text>');
    }
    o.push('<text x="' + (X(0) - 7) + '" y="' + (Y(0) + 16) + '" text-anchor="end">0</text>');
    o.push('<text class="axlab" x="' + (X(this.x1) + 12) + '" y="' + (Y(0) - 10) + '" text-anchor="middle">x</text>');
    o.push('<text class="axlab" x="' + (X(0) + 13) + '" y="' + (Y(this.y1) - 6) + '">y</text>');
    o.push('</g>');
    return o.join('');
  };
  /* Pfad eines Funktionsgraphen, abgeschnitten am sichtbaren Bereich */
  Plane.prototype.path = function (f, a, b, n) {
    a = a == null ? this.x0 : a; b = b == null ? this.x1 : b; n = n || 240;
    var d = '', pen = false, lo = this.y0 - (this.y1 - this.y0) * 0.3, hi = this.y1 + (this.y1 - this.y0) * 0.3;
    for (var i = 0; i <= n; i++) {
      var x = a + (b - a) * i / n, y = f(x);
      if (!isFinite(y) || y < lo || y > hi) { pen = false; continue; }
      d += (pen ? 'L' : 'M') + this.X(x).toFixed(2) + ' ' + this.Y(y).toFixed(2) + ' ';
      pen = true;
    }
    return d;
  };
  /* Klickposition im SVG in Mathe-Koordinaten umrechnen */
  Plane.prototype.fromEvent = function (svg, e) {
    var r = svg.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width * this.w, py = (e.clientY - r.top) / r.height * this.h;
    return { px: px, py: py, x: this.invX(px), y: this.invY(py) };
  };

  /* Kleine Schatztruhe als SVG; open = Deckel auf */
  function chest(open, size) {
    size = size || 30;
    return '<svg class="chest' + (open ? ' open' : '') + '" viewBox="0 0 40 36" width="' + size + '" height="' + (size * 0.9) + '" aria-hidden="true">' +
      '<g class="coins"><circle cx="14" cy="15" r="4"/><circle cx="21" cy="13" r="4.4"/><circle cx="27" cy="15.5" r="3.8"/></g>' +
      '<rect x="4" y="16" width="32" height="18" rx="2.5" class="c-body"/><rect x="4" y="22" width="32" height="3" class="c-band"/>' +
      '<rect x="17.5" y="20" width="5" height="7" rx="1" class="c-lock"/>' +
      '<g class="lid"><path d="M4 17 V12 Q4 4 20 4 Q36 4 36 12 V17 Z" class="c-body"/><rect x="4" y="13" width="32" height="3" class="c-band"/></g>' +
      '</svg>';
  }

  return { fmt: fmt, parseNum: parseNum, near: near, pt: pt, Plane: Plane, chest: chest };
})();
