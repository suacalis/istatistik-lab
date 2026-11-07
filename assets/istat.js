/* İstatistik Laboratuvarı — ortak yardımcı kütüphane (window.I) */
(function () {
  const I = {};
  const NS = 'http://www.w3.org/2000/svg';
  I.$ = id => document.getElementById(id);
  I.el = (tag, at = {}, par, metin) => {
    const e = document.createElementNS(NS, tag);
    for (const k in at) if (at[k] !== undefined && at[k] !== null) e.setAttribute(k, at[k]);
    if (metin !== undefined) e.textContent = metin;
    if (par) par.appendChild(e);
    return e;
  };
  I.f = (v, d = 2) => (v == null || !isFinite(v)) ? '—' : v.toLocaleString('tr-TR', {minimumFractionDigits: d, maximumFractionDigits: d});
  I.yz = (v, d = 1) => (v == null || !isFinite(v)) ? '—' : '%' + I.f(v * 100, d);
  I.isaretli = (v, d = 2) => (v > 0 ? '+' : '') + I.f(v, d);

  /* ---------- Rastgele sayılar ---------- */
  I.tohumlu = a => function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  I.rnorm = (r = Math.random) => { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  I.rgamma = (k, r = Math.random) => { // Marsaglia–Tsang
    if (k < 1) return I.rgamma(k + 1, r) * Math.pow(r(), 1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) { let x, v; do { x = I.rnorm(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r();
      if (u < 1 - 0.0331 * x ** 4) return d * v; if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v; }
  };
  I.rbeta = (a, b, r = Math.random) => { const x = I.rgamma(a, r), y = I.rgamma(b, r); return x / (x + y); };
  I.karistir = (dizi, r = Math.random) => { const a = dizi.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------- Betimsel ---------- */
  I.ort = a => a.reduce((s, v) => s + v, 0) / a.length;
  I.sd = (a, orneklem = true) => { if (a.length < 2) return NaN; const m = I.ort(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - (orneklem ? 1 : 0))); };
  I.kantil = (a, p) => { const s = a.slice().sort((x, y) => x - y); const h = (s.length - 1) * p, l = Math.floor(h); return s[l] + (h - l) * ((s[Math.min(l + 1, s.length - 1)]) - s[l]); };
  I.ozet5 = a => { const s = a.slice().sort((x, y) => x - y); const q1 = I.kantil(s, .25), q3 = I.kantil(s, .75), iqr = q3 - q1;
    const alt = q1 - 1.5 * iqr, ust = q3 + 1.5 * iqr; const ic = s.filter(v => v >= alt && v <= ust);
    return {min: s[0], q1, med: I.kantil(s, .5), q3, max: s[s.length - 1], iqr, bigMin: ic[0], bigMax: ic[ic.length - 1], aykiri: s.filter(v => v < alt || v > ust), n: s.length, ort: I.ort(s), sd: I.sd(s)}; };
  I.carpiklik = a => { const m = I.ort(a), s = I.sd(a, false); return a.reduce((t, v) => t + ((v - m) / s) ** 3, 0) / a.length; };
  I.korelasyon = (x, y) => { const mx = I.ort(x), my = I.ort(y); let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; syy += (y[i] - my) ** 2; } return sxy / Math.sqrt(sxx * syy); };
  I.dogrusal = (x, y) => { const mx = I.ort(x), my = I.ort(y); let sxy = 0, sxx = 0;
    for (let i = 0; i < x.length; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; } const b1 = sxy / sxx; return {b0: my - b1 * mx, b1}; };

  /* ---------- Dağılımlar ---------- */
  I.phi = x => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  I.Phi = x => { // erfc tabanlı, ~1e-14 doğruluk (W. J. Cody benzeri)
    const z = Math.abs(x) / Math.SQRT2, t = 1 / (1 + 0.5 * z);
    const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return x >= 0 ? 1 - r / 2 : r / 2; };
  I.invPhi = p => { // Acklam
    if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.3577518672690, -30.66479806614716, 2.506628277459239],
      b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572],
      c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783],
      d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416], pl = 0.02425; let q, r;
    if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); };
  I.lgamma = x => { const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - I.lgamma(1 - x);
    x -= 1; let a = c[0]; const t = x + g + 0.5; for (let i = 1; i < 9; i++) a += c[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a); };
  I.tPdf = (t, df) => Math.exp(I.lgamma((df + 1) / 2) - I.lgamma(df / 2) - 0.5 * Math.log(df * Math.PI) - (df + 1) / 2 * Math.log(1 + t * t / df));
  function betacf(a, b, x) { const MAXIT = 200, EPS = 3e-14, FPMIN = 1e-300; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN; d = 1 / d; let h = d;
    for (let m = 1; m <= MAXIT; m++) { const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2)); d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN; c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < EPS) break; } return h; }
  I.ibeta = (x, a, b) => { if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(I.lgamma(a + b) - I.lgamma(a) - I.lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b; };
  I.tCdf = (t, df) => { const x = df / (df + t * t); const p = 0.5 * I.ibeta(x, df / 2, 0.5); return t >= 0 ? 1 - p : p; };
  I.tInv = (p, df) => { let lo = -1000, hi = 1000; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (I.tCdf(m, df) < p) lo = m; else hi = m; } return (lo + hi) / 2; };

  /* ---------- Ölçek ve eksen ---------- */
  I.olcek = (d0, d1, r0, r1) => { const f = v => r0 + (v - d0) / (d1 - d0 || 1) * (r1 - r0); f.ters = p => d0 + (p - r0) / (r1 - r0) * (d1 - d0); return f; };
  I.tikler = (min, max, adet = 6) => { const aralik = max - min || 1; const kaba = aralik / adet; const us = Math.pow(10, Math.floor(Math.log10(kaba)));
    const k = kaba / us; const adim = (k >= 5 ? 10 : k >= 2 ? 5 : k >= 1 ? 2 : 1) * us; const t = [];
    for (let v = Math.ceil(min / adim - 1e-9) * adim; v <= max + adim * 1e-9; v += adim) t.push(+v.toFixed(10)); return t; };
  I.tiklerKapsa = (min, max, adet = 6) => { const t = I.tikler(min, max, adet); const a = t.length > 1 ? t[1] - t[0] : 1;
    while (t[t.length - 1] < max - 1e-9) t.push(+(t[t.length - 1] + a).toFixed(10)); while (t[0] > min + 1e-9) t.unshift(+(t[0] - a).toFixed(10)); return t; };
  I.ondalik = adimlar => { if (adimlar.length < 2) return 0; const a = Math.abs(adimlar[1] - adimlar[0]); return a >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(a) - 1e-9)); };
  /* eksen çizimi: o = {W,H,L,R,T,B,x,y,xt,yt,xEt,yEt,izgara,xBicim,yBicim} */
  I.eksenler = (svg, o) => {
    const g = I.el('g', {}, svg);
    const xd = I.ondalik(o.xt || []), yd = I.ondalik(o.yt || []);
    (o.yt || []).forEach(v => { const y = o.y(v);
      if (o.izgara !== false) I.el('line', {x1: o.L, x2: o.W - o.R, y1: y, y2: y, stroke: '#ececec'}, g);
      I.el('text', {x: o.L - 7, y: y + 4, 'text-anchor': 'end', 'font-size': 11, fill: '#666', class: 'svg-yazi'}, g, o.yBicim ? o.yBicim(v) : I.f(v, yd)); });
    (o.xt || []).forEach(v => { const x = o.x(v);
      if (o.xIzgara) I.el('line', {x1: x, x2: x, y1: o.T, y2: o.H - o.B, stroke: '#f0f0f0'}, g);
      I.el('line', {x1: x, x2: x, y1: o.H - o.B, y2: o.H - o.B + 5, stroke: '#aaa'}, g);
      I.el('text', {x, y: o.H - o.B + 18, 'text-anchor': 'middle', 'font-size': 11, fill: '#666', class: 'svg-yazi'}, g, o.xBicim ? o.xBicim(v) : I.f(v, xd)); });
    I.el('line', {x1: o.L, x2: o.W - o.R, y1: o.H - o.B, y2: o.H - o.B, stroke: '#999'}, g);
    if (o.yEksen !== false) I.el('line', {x1: o.L, x2: o.L, y1: o.T, y2: o.H - o.B, stroke: '#999'}, g);
    if (o.xEt) I.el('text', {x: (o.L + o.W - o.R) / 2, y: o.H - 6, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#444'}, g, o.xEt);
    if (o.yEt) I.el('text', {x: 14, y: (o.T + o.H - o.B) / 2, 'text-anchor': 'middle', 'font-size': 12, 'font-weight': 700, fill: '#444', transform: `rotate(-90 14 ${(o.T + o.H - o.B) / 2})`}, g, o.yEt);
    return g;
  };
  I.etiket = (svg, x, y, metin, renk = '#c8202e', yazi = '#fff') => { const w = metin.length * 7 + 14;
    const g = I.el('g', {}, svg); I.el('rect', {x: x - w / 2, y, width: w, height: 20, rx: 3, fill: renk}, g);
    I.el('text', {x, y: y + 14, 'text-anchor': 'middle', 'font-size': 11.5, 'font-weight': 700, fill: yazi, class: 'svg-yazi'}, g, metin); return g; };
  I.halo = {stroke: '#fff', 'stroke-width': 3, 'paint-order': 'stroke'};

  /* ---------- CSV / dosya ---------- */
  I.csvOku = metin => {
    metin = metin.replace(/^﻿/, '').trim();
    const ilk = metin.split(/\r?\n/)[0];
    const ayr = [',', ';', '\t'].map(c => [c, ilk.split(c).length]).sort((a, b) => b[1] - a[1])[0][0];
    const satirlar = []; let alan = '', satir = [], tirnak = false;
    for (let i = 0; i < metin.length; i++) { const ch = metin[i];
      if (tirnak) { if (ch === '"') { if (metin[i + 1] === '"') { alan += '"'; i++; } else tirnak = false; } else alan += ch; }
      else if (ch === '"') tirnak = true;
      else if (ch === ayr) { satir.push(alan); alan = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && metin[i + 1] === '\n') i++; satir.push(alan); satirlar.push(satir); satir = []; alan = ''; }
      else alan += ch; }
    satir.push(alan); satirlar.push(satir);
    const kolonlar = satirlar[0].map(s => s.trim());
    const veri = satirlar.slice(1).filter(s => s.some(x => x.trim() !== '')).map(s => { const o = {}; kolonlar.forEach((k, i) => o[k] = (s[i] ?? '').trim()); return o; });
    return I.tiple(kolonlar, veri);
  };
  I.sayiMi = v => v !== '' && v != null && isFinite(+String(v).replace(',', '.'));
  I.tiple = (kolonlar, veri) => {
    const sayisal = kolonlar.filter(k => { const d = veri.map(r => r[k]).filter(v => v !== '' && v != null); return d.length > 0 && d.every(I.sayiMi); });
    veri.forEach(r => sayisal.forEach(k => { r[k] = (r[k] === '' || r[k] == null) ? null : +String(r[k]).replace(',', '.'); }));
    return {kolonlar, veri, sayisal, kategorik: kolonlar.filter(k => !sayisal.includes(k))};
  };
  I.dosyaOku = async dosya => {
    const ad = dosya.name.toLowerCase();
    if (ad.endsWith('.xlsx') || ad.endsWith('.xls')) {
      if (!window.XLSX) await new Promise((ok, hata) => { const s = document.createElement('script'); s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'; s.onload = ok; s.onerror = () => hata(new Error('Excel okuyucu yüklenemedi (internet bağlantısı gerekli).')); document.head.appendChild(s); });
      const wb = XLSX.read(await dosya.arrayBuffer());
      return I.csvOku(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]));
    }
    return I.csvOku(await dosya.text());
  };
  I.birakmaAlani = (kutu, girdi, cb) => {
    kutu.addEventListener('click', () => girdi.click());
    girdi.addEventListener('change', () => girdi.files[0] && cb(girdi.files[0]));
    ['dragenter', 'dragover'].forEach(e => kutu.addEventListener(e, ev => { ev.preventDefault(); kutu.classList.add('uzerinde'); }));
    ['dragleave', 'drop'].forEach(e => kutu.addEventListener(e, ev => { ev.preventDefault(); kutu.classList.remove('uzerinde'); }));
    kutu.addEventListener('drop', ev => ev.dataTransfer.files[0] && cb(ev.dataTransfer.files[0]));
  };

  /* ---------- SVG dışa aktarma ---------- */
  I.svgIndir = (svg, ad, tur = 'svg') => {
    const kopya = svg.cloneNode(true); kopya.setAttribute('xmlns', NS);
    const vb = svg.viewBox.baseVal; const W = vb.width || svg.clientWidth, H = vb.height || svg.clientHeight;
    kopya.setAttribute('width', W); kopya.setAttribute('height', H);
    const arka = I.el('rect', {x: 0, y: 0, width: W, height: H, fill: '#fff'}); kopya.insertBefore(arka, kopya.firstChild);
    kopya.setAttribute('style', 'font-family:Segoe UI,Arial,sans-serif');
    const metin = new XMLSerializer().serializeToString(kopya);
    const indir = (url, uzanti) => { const a = document.createElement('a'); a.href = url; a.download = ad + '.' + uzanti; a.click(); };
    if (tur === 'svg') { indir(URL.createObjectURL(new Blob([metin], {type: 'image/svg+xml'})), 'svg'); return; }
    const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = W * 2; c.height = H * 2;
      const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
      indir(c.toDataURL(tur === 'jpg' ? 'image/jpeg' : 'image/png', .95), tur); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(metin);
  };

  /* ---------- Ortak arayüz davranışları ---------- */
  document.addEventListener('click', e => {
    const pm = e.target.closest('.pm[data-k]');
    if (pm) { const inp = I.$(pm.dataset.k); const adim = +(inp.step || 1);
      const v = Math.min(+inp.max, Math.max(+inp.min, +inp.value + adim * +pm.dataset.y)); inp.value = +v.toFixed(6); inp.dispatchEvent(new Event('input', {bubbles: true})); }
    const sk = e.target.closest('.sekme[data-hedef]');
    if (sk) { const grup = sk.parentElement; grup.querySelectorAll('.sekme').forEach(x => x.classList.toggle('aktif', x === sk));
      document.querySelectorAll('.panel').forEach(p => p.classList.toggle('aktif', p.id === sk.dataset.hedef));
      window.dispatchEvent(new CustomEvent('sekme', {detail: sk.dataset.hedef})); }
    const bu = e.target.closest('.buyut[data-tuval]');
    if (bu) { const t = I.$(bu.dataset.tuval); if (document.fullscreenElement) document.exitFullscreen(); else if (t.requestFullscreen) t.requestFullscreen(); }
  });
  I.buyutDugme = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';
  document.addEventListener('DOMContentLoaded', () => document.querySelectorAll('.buyut:empty').forEach(b => b.innerHTML = I.buyutDugme));
  I.bekle = ms => new Promise(r => setTimeout(r, ms));
  window.I = I;
})();
