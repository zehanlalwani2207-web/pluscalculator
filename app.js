'use strict';
/* Plus Calculator — a Digits-style tape calculator. Pure JS, runs inside an Android WebView. */

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const A = window.Android || null;

/* ---------- icons (line style) ---------- */
const sv = (p, w = 1.6) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const IC = {
  delrow: sv('<path d="M8 3h8l5 9-5 9H8l-5-9z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>'),
  back: sv('<path d="M8 6h12v12H8l-5-6z"/><path d="M11 9.5l5 5M16 9.5l-5 5"/>'),
  clearall: sv('<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>'),
  clear: sv('<path d="M17.5 7.2A7.5 7.5 0 1 0 17.5 16.8"/><path d="M15.4 9.1A4.6 4.6 0 1 0 15.4 14.9"/>', 1.4),
  mem: sv('<path d="M4 19V5l8 9 8-9v14"/><path d="M6.5 19V10.5l5.5 6.2 5.5-6.2V19"/>', 1.3),
  neg: sv('<path d="M12 4v8M8 8h8M7 18h10"/>'),
  tapes: sv('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M8 7h8M8 10h8M8 13h8M8 16h5"/>'),
  pct: sv('<path d="M18 5L6 19"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'),
  '÷': sv('<path d="M5 12h14"/><circle cx="12" cy="6.5" r="1.2" fill="currentColor"/><circle cx="12" cy="17.5" r="1.2" fill="currentColor"/>', 2.2),
  '×': sv('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 2.2),
  '−': sv('<path d="M5 12h14"/>', 2.2),
  '=': sv('<path d="M5 9h14M5 15h14"/>', 2.2),
  '+': sv('<path d="M12 3.5v17M3.5 12h17"/>', 2.6),
  share: sv('<path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H5v11h14V10h-2"/>'),
  settings: sv('<circle cx="12" cy="12" r="3"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/><circle cx="12" cy="12" r="6.2"/>'),
  themes: sv('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1.1-1.9-.6-1-.1-2.1 1.1-2.1H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>'),
  tips: sv('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>'),
  help: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r=".9" fill="currentColor"/>'),
  pDelete: sv('<path d="M8 3h8l5 9-5 9H8l-5-9z"/><path d="M9.5 9.5l5 5M14.5 9.5l-5 5"/>', 1.3),
  pEdit: sv('<path d="M16.5 3.5l4 4L8 20H4v-4z"/><path d="M14 6l4 4"/>', 1.3),
  pInsert: sv('<rect x="3" y="3" width="18" height="7" rx="1"/><path d="M3 14h10l3 3.5-3 3.5H3z"/>', 1.3),
  pCopy: sv('<rect x="8" y="8" width="13" height="13" rx="1.5"/><path d="M16 8V4.5A1.5 1.5 0 0 0 14.5 3h-10A1.5 1.5 0 0 0 3 4.5v10A1.5 1.5 0 0 0 4.5 16H8"/>', 1.3),
  pComment: sv('<path d="M4 4h16v12h-9l-5 4v-4H4z"/>', 1.3),
  pFlag: sv('<path d="M5 21V3h13l-3 5 3 5H5"/>', 1.3),
};

/* ---------- state ---------- */
const OPS = { '+': 1, '−': 1, '×': 1, '÷': 1, '^': 1, 'r': 1 };
const OPSYM = { '+': '+', '−': '−', '×': '×', '÷': '÷', '^': 'xʸ', 'r': 'ʸ√', '=': '=', 'C': 'C' };
const uid = () => Math.random().toString(36).slice(2, 10);

let S = load();
function defaults() {
  const t = newTape('Home');
  return {
    v: 1, tapes: [t], cur: t.id, memory: [],
    set: { theme: 'night', fmt: 'std', group: 'intl', sound: true, haptic: true, plusPct: 200, plusShape: 'tall', keyStyle: 'flat', borders: 'none', borderW: 1, gstRate: 18, gstMode: false, gstKeys: A ? 'col' : 'row', toolbar: true, autoScroll: true, deg: true, tipsSeen: false },
  };
}
function newTape(name) { return { id: uid(), name, start: 0, rows: [], created: Date.now(), updated: Date.now() }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem('tapecalc')); if (s && s.tapes && s.tapes.length) {
    // older builds stored the plus size as a preset name
    if (s.set && s.set.plus && s.set.plusPct == null) s.set.plusPct = { normal: 100, big: 180, huge: 250 }[s.set.plus] || 180;
    s.set = Object.assign(defaults().set, s.set); return s;
  } } catch (e) {}
  return defaults();
}
let saveT = 0;
function save() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('tapecalc', JSON.stringify(S)); } catch (e) {} }, 120); }
const T = () => S.tapes.find(t => t.id === S.cur) || S.tapes[0];

// entry / mode state (not persisted)
let E = { s: '', pct: false, label: '' };
let pendingOp = '+';
let mode = null;          // null | {type:'edit', i} | {type:'insert', i}
let sciPage = 0;
let selRow = -1;

/* ---------- math ---------- */
const round2 = n => Math.round(n * 100) / 100;
const clean = n => (isFinite(n) ? parseFloat(n.toPrecision(14)) : n);
function apply(a, op, b) {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    case '^': return Math.pow(a, b);
    case 'r': return b === 0 ? NaN : (a < 0 && Math.abs(b % 2) === 1 ? -Math.pow(-a, 1 / b) : Math.pow(a, 1 / b));
  }
  return a;
}
// recompute running totals; pct rows derive their value from the running total before them
function compute(t = T()) {
  let run = Number(t.start) || 0;
  for (const r of t.rows) {
    if (r.kind === 'total') { r.v = clean(run); r.res = r.v; continue; }
    if (r.kind === 'clear') { run = 0; r.v = 0; r.res = 0; continue; } // C row: start a fresh calculation
    if (r.pct != null) r.v = clean(run * r.pct / 100);
    // GST rows follow the running total above them: add = tax on it, rem = tax contained in it
    if (r.gst) r.v = round2(r.gst.mode === 'add' ? run * r.gst.rate / 100 : run - run / (1 + r.gst.rate / 100));
    run = clean(apply(run, r.op, r.v));
    r.res = run;
  }
  return run;
}
const total = () => compute();

/* ---------- formatting ---------- */
function fmt(n, mode = S.set.fmt) {
  if (n === undefined || n === null) return '';
  if (!isFinite(n)) return 'Error';
  if (Math.abs(n) >= 1e15 || (n !== 0 && Math.abs(n) < 1e-9 && mode === 'flt')) return n.toExponential(6).replace('e+', 'e');
  const loc = S.set.group === 'indian' ? 'en-IN' : S.set.group === 'none' ? 'en-US' : 'en-US';
  const o = mode === 'std' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : mode === 'whole' ? { maximumFractionDigits: 0 }
    : { maximumFractionDigits: 10 };
  o.useGrouping = S.set.group !== 'none';
  return n.toLocaleString(loc, o).replace(/^-/, '-');
}
function fmtEntry(s) {
  if (!s) return '0';
  const neg = s.startsWith('-'); let b = neg ? s.slice(1) : s;
  let [i, d] = b.split('.');
  const loc = S.set.group === 'indian' ? 'en-IN' : 'en-US';
  let iF = i === '' ? '0' : (S.set.group === 'none' ? i : Number(i).toLocaleString(loc));
  if (i.length > 15) iF = i;
  return (neg ? '-' : '') + iF + (b.includes('.') ? '.' + (d || '') : '');
}
const FMTNAME = { std: 'Standard', flt: 'Float', whole: 'Whole' };

/* ---------- feedback ---------- */
function tick() {
  if (A) { try { if (S.set.sound) A.click(); if (S.set.haptic) A.haptic(); } catch (e) {} }
  else if (S.set.haptic && navigator.vibrate) navigator.vibrate(8);
}
function toast(msg) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), 1600);
}
function copyText(s) {
  if (A) A.copy(s);
  else if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).catch(() => legacyCopy(s));
  else legacyCopy(s);
  toast('Copied');
}
function legacyCopy(s) {
  const ta = document.createElement('textarea'); ta.value = s; ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove();
}

/* ---------- rendering ---------- */
function renderTape() {
  const t = T(); compute(t);
  const rows = [];
  rows.push(rowHTML({ kind: 'start', v: Number(t.start) || 0, c: t.startC || '' }, 0));
  t.rows.forEach((r, i) => rows.push(rowHTML(r, i + 1)));
  // live preview of the number being typed (not committed yet)
  if (E.s && !mode) rows.push(`<div class="row pending"><span class="ix"></span><span class="lbl">${esc(E.label)}</span><span class="opc">${OPSYM[pendingOp]}</span><span class="val">${fmtEntry(E.s)}${E.pct ? '%' : ''}</span></div>`);
  $('#tape').innerHTML = rows.join('');
  if (S.set.autoScroll && !mode) { const w = $('#tapeWrap'); w.scrollTop = w.scrollHeight; }
}
function rowHTML(r, i) {
  const isTot = r.kind === 'total', isClr = r.kind === 'clear';
  const cls = ['row'];
  if (isTot) cls.push('total');
  if (isClr) cls.push('clr');
  if (r.v < 0) cls.push('neg');
  if (r.flag) cls.push('flag');
  if (selRow === i || (mode && mode.i === i && mode.type === 'edit')) cls.push('sel');
  // first number after a C line starts the new calculation, so it shows no operator (like row 0)
  const prev = i > 1 ? T().rows[i - 2] : null;
  const op = r.kind === 'start' ? '' : isTot ? '=' : isClr ? 'C' : (prev && prev.kind === 'clear' && r.op === '+') ? '' : OPSYM[r.op];
  const pct = r.pct != null ? `<small>${fmt(r.pct, 'std')}%</small>` : r.gst ? `<small>GST ${r.gst.rate}%${r.gst.mode === 'rem' ? ' incl.' : ''}</small>` : '';
  return `<div class="${cls.join(' ')}" data-i="${i}"><span class="ix">${i}</span><span class="lbl">${esc(r.c || '')}</span><span class="opc${isTot ? ' eq' : ''}">${op}</span><span class="val">${fmt(r.v)}${pct}</span></div>`;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function renderDisplay() {
  const t = T();
  const tot = total();
  $('#dispName').textContent = `"${t.name}" Total [${OPSYM[pendingOp]}${mode ? '' : '='}]`;
  $('#dispMode').textContent = mode ? (mode.type === 'edit' ? `· Editing row ${mode.i}` : `· Inserting after row ${mode.i - 1}`) : '';
  $('#dispFmt').textContent = FMTNAME[S.set.fmt] + (S.set.deg ? '' : ' · rad');
  $('#dispTotal').textContent = fmt(tot);
  let eHTML = fmtEntry(E.s);
  if (E.pct && E.s) eHTML = `${fmt(clean(runBefore() * parseFloat(E.s) / 100))}<small>${fmtEntry(E.s)}%</small>`;
  $('#dispEntry').innerHTML = eHTML;
  $('#dispOp').textContent = E.s || mode ? OPSYM[mode && mode.type === 'edit' ? (T().rows[mode.i - 1] || {}).op || pendingOp : pendingOp] || '' : '';
  $('#display').classList.toggle('edit', !!mode);
  renderGst();
  fitText($('#dispTotal'), $('#display').clientWidth - 70);
  fitText($('#dispEntryRow'), $('#display').clientWidth - 24);
  $$('.k.op').forEach(b => b.classList.toggle('pend', b.dataset.k === pendingOp && !E.s && T().rows.length > 0 && !mode && pendingOp !== '+'));
}
function fitText(el, maxW) {
  el.style.transform = ''; el.classList.add('fit');
  const w = el.scrollWidth;
  if (w > maxW) el.style.transform = `scale(${maxW / w})`;
}
// running total right before the row being typed (used by %)
function runBefore() {
  const t = T(); compute(t);
  if (mode && mode.type === 'edit') { const r = t.rows[mode.i - 2]; return r ? r.res : (Number(t.start) || 0); }
  if (mode && mode.type === 'insert') { const r = t.rows[mode.i - 2]; return r ? r.res : (Number(t.start) || 0); }
  return total();
}
function render() { renderTape(); renderDisplay(); save(); }

/* ---------- keypad logic ---------- */
function commitRow(op) {
  const t = T();
  const v = parseFloat(E.s);
  if (E.s === '' || E.s === '-' || isNaN(v)) return false;
  const row = { id: uid(), kind: 'num', op, v, c: E.label || '' };
  if (E.pct) { row.pct = v; row.v = clean(runBefore() * v / 100); }
  if (mode && mode.type === 'insert') { t.rows.splice(mode.i - 1, 0, row); mode.i++; }
  else t.rows.push(row);
  t.updated = Date.now();
  E = { s: '', pct: false, label: '' };
  return true;
}
function press(k) {
  const t = T();
  if (/^[0-9]$/.test(k)) {
    if (E.s.replace(/[-.]/g, '').length >= 15) return;
    if (E.s === '0') E.s = k; else if (E.s === '-0') E.s = '-' + k; else E.s += k;
    E.label = E.label && E.label.startsWith('=') ? '' : E.label;
  } else if (k === '.') {
    if (!E.s.includes('.')) E.s = (E.s === '' || E.s === '-' ? E.s + '0' : E.s) + '.';
  } else if (k === 'back') {
    if (E.pct) E.pct = false;
    else if (E.s) { E.s = E.s.slice(0, -1); if (E.s === '-') E.s = ''; }
    if (!E.s) E.label = '';
  } else if (k === 'clear') {
    // C ends the current calculation: writes a C line, total goes back to 0, history stays on the tape.
    // While editing / inserting it only cancels that.
    E = { s: '', pct: false, label: '' }; pendingOp = '+';
    if (mode) mode = null;
    else if (t.rows.length || Number(t.start)) { t.rows.push({ id: uid(), kind: 'clear', op: 'C', v: 0, c: '' }); t.updated = Date.now(); }
  } else if (k === 'clearall') {
    if (!t.rows.length && !E.s) return;
    confirmSheet('Clear the tape?', `All ${t.rows.length} rows of "${t.name}" will be removed.`, 'Clear Tape', () => {
      t.rows = []; t.start = 0; t.startC = ''; E = { s: '', pct: false, label: '' }; pendingOp = '+'; mode = null; render();
    });
    return;
  } else if (k === 'delrow') {
    if (mode && mode.type === 'edit') { t.rows.splice(mode.i - 1, 1); mode = null; }
    else if (E.s) E = { s: '', pct: false, label: '' };
    else if (t.rows.length) { t.rows.pop(); toast('Row deleted'); }
  } else if (k === 'neg') {
    if (E.s) E.s = E.s.startsWith('-') ? E.s.slice(1) : '-' + E.s;
    else { const tot = total(); if (tot) { E.s = String(-tot); E.label = ''; } }
  } else if (k === 'pct') {
    if (E.s) E.pct = !E.pct;
  } else if (OPS[k]) {
    opKey(k);
  } else if (k === '=') {
    eqKey();
  } else if (k === 'mem') { memorySheet(); return; }
  else if (k === 'tapes') { tapesSheet(); return; }
  else if (gstKey(k)) { /* handled */ }
  else if (sciKey(k)) { /* handled */ }
  render();
}
function opKey(k) {
  const t = T();
  if (mode && mode.type === 'edit') {
    const r = t.rows[mode.i - 1];
    if (r.kind === 'total') { mode = null; return; }
    if (E.s) { const v = parseFloat(E.s); if (!isNaN(v)) { delete r.gst; if (E.pct) { r.pct = v; } else { delete r.pct; r.v = v; } } }
    r.op = k; if (E.label) r.c = r.c || E.label;
    E = { s: '', pct: false, label: '' }; mode = null; return;
  }
  if (E.s) { commitRow(pendingOp); pendingOp = k; }
  else pendingOp = k;
}
function eqKey() {
  const t = T();
  if (mode && mode.type === 'edit') {
    const r = t.rows[mode.i - 1];
    if (E.s && r && r.kind !== 'total') { const v = parseFloat(E.s); if (!isNaN(v)) { delete r.gst; if (E.pct) r.pct = v; else { delete r.pct; r.v = v; } } }
    if (mode.i === 0 && E.s) t.start = parseFloat(E.s) || 0;
    E = { s: '', pct: false, label: '' }; mode = null; return;
  }
  if (E.s) commitRow(pendingOp);
  const last = mode && mode.type === 'insert' ? t.rows[mode.i - 2] : t.rows[t.rows.length - 1];
  if (last && last.kind !== 'total' && last.kind !== 'clear') {
    const tr = { id: uid(), kind: 'total', op: '=', v: 0, c: '' };
    if (mode && mode.type === 'insert') t.rows.splice(mode.i - 1, 0, tr); else t.rows.push(tr);
  }
  mode = null; pendingOp = '+';
}

/* GST keys. With a typed number they convert the entry (then tap an operator to put it on the tape).
   With nothing typed they work on the running total: +GST / −GST add a live tax row to the tape. */
const GST_SLABS = [3, 5, 12, 18, 28];
function gstKey(k) {
  if (!k.startsWith('gst')) return false;
  const r = S.set.gstRate, t = T();
  if (k === 'gstmode') { S.set.gstMode = !S.set.gstMode; applySettings(); toast(S.set.gstMode ? 'GST mode on' : 'GST mode off'); return true; }
  if (!S.set.gstMode && S.set.gstKeys === 'row') { toast('Turn on the GST switch first'); return true; }
  if (k === 'gstslab') { S.set.gstRate = GST_SLABS[(GST_SLABS.indexOf(r) + 1) % GST_SLABS.length]; toast(`GST slab ${S.set.gstRate}%`); return true; }
  const typed = E.s && !isNaN(parseFloat(E.s));
  const x = typed ? entryValue() : total();
  if (!typed && !mode) {
    if (k === 'gstamt') { E = { s: String(round2(x * r / 100)), pct: false, label: `${r}% GST on ${fmt(x)}` }; return true; }
    if (!t.rows.length && !Number(t.start)) { toast('Type an amount first'); return true; }
    const add = k === 'gstadd';
    t.rows.push({ id: uid(), kind: 'num', op: add ? '+' : '−', v: 0, c: add ? `+ GST ${r}%` : `Less GST ${r}% (incl.)`, gst: { rate: r, mode: add ? 'add' : 'rem' } });
    t.updated = Date.now(); pendingOp = '+';
    return true;
  }
  const y = k === 'gstadd' ? x * (1 + r / 100) : k === 'gstrem' ? x / (1 + r / 100) : x * r / 100;
  const lbl = k === 'gstadd' ? `${fmt(x)} + ${r}% GST` : k === 'gstrem' ? `${fmt(x)} excl. ${r}% GST` : `${r}% GST on ${fmt(x)}`;
  E = { s: String(round2(y)), pct: false, label: lbl };
  return true;
}
function entryValue() { const v = parseFloat(E.s); return E.pct ? clean(runBefore() * v / 100) : v; }
function renderGst() {
  $$('.slabV').forEach(el => { el.textContent = S.set.gstRate + '%'; });
  const tape = $('#tape');
  if (!S.set.gstMode) { tape.style.paddingTop = ''; return; }
  const r = S.set.gstRate, typed = E.s && !isNaN(parseFloat(E.s));
  const x = typed ? entryValue() : total();
  const inc = round2(x * (1 + r / 100)), tax = round2(x * r / 100);
  const exc = round2(x / (1 + r / 100)), taxIn = round2(x - exc), half = fmt(r / 2, 'flt');
  $('#gstPanel').innerHTML = `<div class="h">GST <b>${r}%</b> on ${typed ? 'entry' : 'total'} <b>${fmt(x)}</b></div>
    <div class="l" data-g="${inc}" data-n="+GST"><span>+GST</span><b class="v">${fmt(inc)}</b><i>tax ${fmt(tax)}</i></div>
    <div class="l" data-g="${exc}" data-n="−GST"><span>−GST</span><b class="v">${fmt(exc)}</b><i>tax ${fmt(taxIn)}</i></div>
    <div class="cs l" data-g="${round2(tax / 2)}" data-n="CGST"><div><span>CGST ${half}%</span> ${fmt(round2(tax / 2))}</div><div><span>SGST ${half}%</span> ${fmt(round2(tax / 2))}</div></div>`;
  // keep tape rows from hiding under the card
  tape.style.paddingTop = ($('#gstPanel').offsetHeight + 14) + 'px';
}

/* scientific keys: unary functions act on the entry, or on the total when the entry is empty */
function sciKey(k) {
  const unary = {
    sin: x => Math.sin(S.set.deg ? x * Math.PI / 180 : x), cos: x => Math.cos(S.set.deg ? x * Math.PI / 180 : x),
    tan: x => Math.tan(S.set.deg ? x * Math.PI / 180 : x), sq: x => x * x, cube: x => x * x * x, inv: x => 1 / x,
    sqrt: Math.sqrt, cbrt: Math.cbrt, ln: Math.log, log: Math.log10,
    fact: x => { if (x < 0 || x > 170 || x % 1) return NaN; let r = 1; for (let i = 2; i <= x; i++) r *= i; return r; },
  };
  const names = { sin: 'sin', cos: 'cos', tan: 'tan', sq: 'sqr', cube: 'cube', inv: '1/', sqrt: '√', cbrt: '∛', ln: 'ln', log: 'log', fact: 'fact' };
  if (unary[k]) {
    const x = E.s ? parseFloat(E.s) : total();
    const y = clean(unary[k](x));
    E = { s: isFinite(y) ? String(y) : '', pct: false, label: `${names[k]}(${fmt(x, 'flt')})` };
    if (!isFinite(y)) toast('Error');
    return true;
  }
  if (k === 'pi') { E = { s: String(clean(Math.PI)), pct: false, label: 'π' }; return true; }
  if (k === 'e') { E = { s: String(clean(Math.E)), pct: false, label: 'e' }; return true; }
  if (k === 'pow') { opKey('^'); return true; }
  if (k === 'root') { opKey('r'); return true; }
  if (k === 'angle') { S.set.deg = !S.set.deg; setAngleLabel(); toast(S.set.deg ? 'Degrees' : 'Radians'); return true; }
  return false;
}
function setAngleLabel() { const b = $('[data-k=angle]'); if (b) b.textContent = S.set.deg ? 'deg' : 'rad'; }

/* ---------- keypad wiring ---------- */
function bindKeys() {
  $$('.k').forEach(b => {
    const k = b.dataset.k;
    if (IC[k] && !b.classList.contains('t')) b.innerHTML = IC[k];
    b.addEventListener('pointerdown', e => { b.classList.add('down'); tick(); });
    const up = () => b.classList.remove('down');
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('click', () => { closePop(); press(k); });
  });
  $$('#toolbar button').forEach(b => {
    b.innerHTML = IC[b.dataset.t];
    b.addEventListener('click', () => { tick(); ({ share: shareSheet, settings: settingsSheet, themes: themesSheet, tips: tipsSheet, help: helpSheet })[b.dataset.t](); });
  });
  // swipe the function columns to reach the scientific pages
  const pane = $('#fnPane'); let sx = null, sy = 0;
  pane.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  pane.addEventListener('touchend', e => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) { setPage(sciPage + (dx < 0 ? 1 : -1)); $$('.k.down').forEach(b => b.classList.remove('down')); }
  });
  setPage(0);
  // tap a GST line in the display to use that number
  $('#gstPanel').addEventListener('click', e => {
    const l = e.target.closest('[data-g]'); if (!l) return; tick();
    const lbl = l.dataset.n;
    E = { s: l.dataset.g, pct: false, label: `${lbl} ${S.set.gstRate}%` }; render();
  });
  // display: tap format label to cycle; tap grabber to toggle toolbar
  $('#dispFmt').addEventListener('click', () => { const o = ['std', 'flt', 'whole']; S.set.fmt = o[(o.indexOf(S.set.fmt) + 1) % 3]; render(); });
  $('#grabber').parentElement.addEventListener('click', e => { if (e.target.id === 'dispTotal') { copyText(fmt(total(), 'flt')); } });
  $('#display').addEventListener('touchstart', e => { $('#display').dataset.y = e.touches[0].clientY; }, { passive: true });
  $('#display').addEventListener('touchend', e => {
    const dy = e.changedTouches[0].clientY - Number($('#display').dataset.y || 0);
    if (dy > 40) { S.set.toolbar = false; applySettings(); save(); } else if (dy < -40) { S.set.toolbar = true; applySettings(); save(); }
  });
}
function setPage(p) {
  sciPage = (p + 3) % 3;
  $$('.fnPage').forEach(pg => { pg.style.transform = `translateX(${(Number(pg.dataset.page) - sciPage) * 100}%)`; });
  $$('#pageDots i').forEach((d, i) => d.classList.toggle('on', i === sciPage));
}

/* ---------- tape interaction: tap = menu, long-press = drag to reorder ---------- */
function bindTape() {
  const wrap = $('#tapeWrap');
  let lp = null, drag = null, startY = 0, moved = false;
  wrap.addEventListener('touchstart', e => {
    const row = e.target.closest('.row[data-i]'); if (!row || document.body.classList.contains('commenting')) return;
    const i = Number(row.dataset.i); startY = e.touches[0].clientY; moved = false;
    if (i === 0) return;
    lp = setTimeout(() => { drag = { i, row, y0: startY, h: row.offsetHeight }; row.classList.add('drag'); tick(); if (A) A.haptic(); }, 450);
  }, { passive: true });
  wrap.addEventListener('touchmove', e => {
    const y = e.touches[0].clientY;
    if (Math.abs(y - startY) > 8) { moved = true; if (!drag) { clearTimeout(lp); } }
    if (drag) { e.preventDefault(); drag.row.style.transform = `translateY(${y - drag.y0}px)`; }
  }, { passive: false });
  wrap.addEventListener('touchend', e => {
    clearTimeout(lp);
    if (drag) {
      const t = T(); const dy = e.changedTouches[0].clientY - drag.y0;
      let to = drag.i + Math.round(dy / drag.h); to = Math.max(1, Math.min(t.rows.length, to));
      if (to !== drag.i) { const [r] = t.rows.splice(drag.i - 1, 1); t.rows.splice(to - 1, 0, r); t.updated = Date.now(); toast(`Moved to row ${to}`); }
      drag = null; render(); return;
    }
  });
  wrap.addEventListener('click', e => {
    if (document.body.classList.contains('commenting')) return;
    const row = e.target.closest('.row[data-i]'); if (!row || moved) return;
    tick(); openRowMenu(Number(row.dataset.i), row);
  });
}

function openRowMenu(i, el) {
  selRow = i; renderTape();
  el = $(`.row[data-i="${i}"]`) || el;
  const t = T(); const r = i === 0 ? null : t.rows[i - 1];
  const items = [
    ['pDelete', 'Delete', () => { if (i === 0) { t.start = 0; } else t.rows.splice(i - 1, 1); }],
    ['pEdit', 'Edit', () => editRow(i)],
    ['pInsert', 'Insert...', () => insertMenu(i)],
    ['pCopy', 'Copy...', () => copyMenu(i)],
    ['pComment', 'Comment', () => startComment(i)],
    ['pFlag', r && r.flag ? 'Unflag' : 'Flag', () => { if (r) r.flag = !r.flag; }],
  ];
  showPop(el, items.map(([ic, l, fn]) => ({ icon: IC[ic], label: l, fn })), false);
}
function showPop(anchor, items, list) {
  const pop = $('#pop');
  pop.className = list ? 'list' : '';
  pop.innerHTML = items.map((it, n) => `<button data-n="${n}">${it.icon || ''}<span>${it.label}</span></button>`).join('');
  pop.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation(); tick(); const it = items[Number(b.dataset.n)];
    const keep = it.fn(); if (keep !== 'keep') { closePop(); render(); }
  }));
  const ar = anchor.getBoundingClientRect(); const pw = pop.offsetWidth, ph = pop.offsetHeight;
  const vw = window.innerWidth, vh = window.innerHeight;
  let left = Math.min(Math.max(8, vw - pw - 12), Math.max(8, vw * 0.55 - pw / 2));
  let top = ar.bottom + 8, up = false;
  if (top + ph > vh - 8) { top = ar.top - ph - 8; up = true; }
  pop.style.left = left + 'px'; pop.style.top = Math.max(8, top) + 'px';
  pop.style.setProperty('--ax', Math.min(pw - 16, Math.max(16, vw * 0.7 - left)) + 'px');
  pop.classList.toggle('up', up);
}
function closePop() { if (!$('#pop').classList.contains('hidden') || selRow >= 0) { $('#pop').classList.add('hidden'); if (selRow >= 0) { selRow = -1; renderTape(); } } }
document.addEventListener('click', e => { if (!e.target.closest('#pop') && !e.target.closest('.row')) closePop(); }, true);

function editRow(i) {
  const t = T();
  if (i === 0) { mode = { type: 'edit', i: 0 }; E = { s: String(Number(t.start) || 0), pct: false, label: '' }; return; }
  const r = t.rows[i - 1];
  if (r.kind === 'total') { toast('Totals update automatically'); return; }
  if (r.kind === 'clear') { toast('C line: delete it to join the calculations again'); return; }
  mode = { type: 'edit', i };
  E = r.pct != null ? { s: String(r.pct), pct: true, label: '' } : { s: String(r.v), pct: false, label: '' };
  toast('Type a new value, then tap an operator');
}
function insertMenu(i) {
  const t = T();
  const flaggedSum = sign => t.rows.filter(r => r.flag && r.kind !== 'total').reduce((s, r) => s + (r.op === '−' ? -r.v : r.v), 0) * sign;
  showPop($(`.row[data-i="${i}"]`), [
    { label: 'Insert number below', fn: () => { mode = { type: 'insert', i: i + 1 }; pendingOp = '+'; E = { s: '', pct: false, label: '' }; toast('Type a number, then an operator'); } },
    { label: 'Insert total below', fn: () => { t.rows.splice(i, 0, { id: uid(), kind: 'total', op: '=', v: 0, c: '' }); } },
    { label: '+ Flagged', fn: () => { t.rows.splice(i, 0, { id: uid(), kind: 'num', op: '+', v: clean(flaggedSum(1)), c: '+ Flagged' }); } },
    { label: '− Flagged', fn: () => { t.rows.splice(i, 0, { id: uid(), kind: 'num', op: '−', v: clean(flaggedSum(1)), c: '− Flagged' }); } },
  ], true);
  $('#pop').classList.remove('hidden');
  return 'keep';
}
function copyMenu(i) {
  const t = T(); compute(t);
  const r = i === 0 ? { v: Number(t.start) || 0, c: t.startC || '', kind: 'start' } : t.rows[i - 1];
  showPop($(`.row[data-i="${i}"]`), [
    { label: 'Copy value', fn: () => copyText(fmt(r.v, 'flt')) },
    { label: 'Copy row', fn: () => copyText(`${r.c ? r.c + '  ' : ''}${r.kind === 'total' ? '=' : (OPSYM[r.op] || '')} ${fmt(r.v)}`) },
    { label: 'Copy tape', fn: () => copyText(tapeText(t)) },
    { label: 'Use value', fn: () => { E = { s: String(r.v), pct: false, label: r.c || '' }; } },
    { label: 'Save to memory', fn: () => { S.memory.push({ v: r.v, c: r.c || '' }); toast('Saved to memory'); } },
  ], true);
  $('#pop').classList.remove('hidden');
  return 'keep';
}

/* ---------- comments ---------- */
let cIdx = -1;
function startComment(i) {
  cIdx = i; document.body.classList.add('commenting'); closePop();
  renderTape();
  const row = $(`.row[data-i="${i}"]`); if (!row) return;
  const t = T(); const r = i === 0 ? null : t.rows[i - 1];
  const lbl = row.querySelector('.lbl');
  lbl.innerHTML = `<input id="cIn" maxlength="60" value="${esc(r ? r.c || '' : t.startC || '')}" placeholder="Comment">`;
  const inp = $('#cIn'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); moveComment(1); } });
  setTimeout(() => row.scrollIntoView({ block: 'center' }), 250);
  return 'keep';
}
function storeComment() {
  const inp = $('#cIn'); if (!inp) return; const t = T();
  if (cIdx === 0) t.startC = inp.value.trim(); else if (t.rows[cIdx - 1]) t.rows[cIdx - 1].c = inp.value.trim();
  t.updated = Date.now(); save();
}
function moveComment(d) {
  storeComment(); const n = cIdx + d;
  if (n < 0 || n > T().rows.length) { endComment(); return; }
  startComment(n);
}
function endComment() { storeComment(); cIdx = -1; document.body.classList.remove('commenting'); if (document.activeElement) document.activeElement.blur(); render(); }
$('#cbPrev').addEventListener('click', () => moveComment(-1));
$('#cbNext').addEventListener('click', () => moveComment(1));
$('#cbDone').addEventListener('click', endComment);

/* ---------- sheets ---------- */
function openSheet(html, after) {
  closePop();
  $('#sheet').innerHTML = html; $('#sheetBack').classList.remove('hidden');
  if (after) after($('#sheet'));
}
function closeSheet() { $('#sheetBack').classList.add('hidden'); }
$('#sheetBack').addEventListener('click', e => { if (e.target.id === 'sheetBack') closeSheet(); });
const on = (sel, fn) => $('#sheet').querySelectorAll(sel).forEach(b => b.addEventListener('click', e => { tick(); fn(b, e); }));

function confirmSheet(title, sub, btn, fn) {
  openSheet(`<h2>${esc(title)}</h2><p class="sub">${esc(sub)}</p><button class="item c dang" id="ok">${esc(btn)}</button><button class="cancel">Cancel</button>`, () => {
    on('#ok', () => { closeSheet(); fn(); }); on('.cancel', closeSheet);
  });
}
function promptSheet(title, value, btn, fn) {
  openSheet(`<h2>${esc(title)}</h2><input class="txt" id="pIn" maxlength="40" value="${esc(value)}"><button class="item c" id="ok">${esc(btn)}</button><button class="cancel">Cancel</button>`, () => {
    const i = $('#pIn'); setTimeout(() => { i.focus(); i.select(); }, 50);
    const go = () => { const v = i.value.trim(); if (!v) return; closeSheet(); fn(v); };
    on('#ok', go); on('.cancel', closeSheet); i.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  });
}

function shareSheet() {
  const t = T();
  openSheet(`<h2>Export or Print</h2><p class="sub">Share, print and back up "${esc(t.name)}" via WhatsApp, Mail, Drive, Files and other apps.</p>
    <button class="item c" data-x="doc">Tape Document</button>
    <button class="item c" data-x="pdf">PDF / Print</button>
    <button class="item c" data-x="img">Image</button>
    <button class="item c" data-x="txt">Text (Monospaced)</button>
    <button class="item c" data-x="csv">CSV (Tabbed)</button>
    <button class="item c" data-x="import">Import Tape Document…</button>
    <button class="cancel">Cancel</button>`, () => {
    on('.cancel', closeSheet);
    on('[data-x]', b => { closeSheet(); exportAs(b.dataset.x); });
  });
}
function tapeText(t) {
  compute(t);
  const lines = [`${t.name}`, new Date(t.updated).toLocaleString(), ''];
  const W = 34;
  const line = (c, op, v, extra = '') => { const left = (c || '').slice(0, 18); const right = `${op} ${v}`; return left.padEnd(W - right.length, ' ') + right + extra; };
  lines.push(line(t.startC, ' ', fmt(Number(t.start) || 0)));
  t.rows.forEach(r => {
    if (r.kind === 'total' || r.kind === 'clear') lines.push('-'.repeat(W));
    lines.push(line(r.c, r.kind === 'total' ? '=' : OPSYM[r.op], fmt(r.v), r.pct != null ? `  (${fmt(r.pct, 'std')}%)` : ''));
  });
  lines.push('', line('Total', '=', fmt(total())));
  return lines.join('\n');
}
function tapeCSV(t) {
  compute(t);
  const out = ['#\tComment\tOperator\tValue\tPercent\tRunning Total\tFlag'];
  out.push(`0\t${t.startC || ''}\t\t${Number(t.start) || 0}\t\t${Number(t.start) || 0}\t`);
  t.rows.forEach((r, i) => out.push(`${i + 1}\t${(r.c || '').replace(/\t/g, ' ')}\t${r.kind === 'total' ? '=' : OPSYM[r.op]}\t${r.v}\t${r.pct != null ? r.pct : ''}\t${r.res}\t${r.flag ? 'Y' : ''}`));
  return out.join('\n');
}
function tapeHTML(t) {
  compute(t);
  const tr = (i, c, op, v, cls = '', sub = '') => `<tr class="${cls}"><td class="i">${i}</td><td>${esc(c || '')}</td><td class="o">${op}</td><td class="v">${v}${sub}</td></tr>`;
  let rows = tr(0, t.startC, '', fmt(Number(t.start) || 0));
  t.rows.forEach((r, i) => rows += tr(i + 1, r.c, r.kind === 'total' ? '=' : OPSYM[r.op], fmt(r.v), (r.v < 0 ? 'n ' : '') + (r.kind === 'total' ? 't' : ''), r.pct != null ? `<br><small>${fmt(r.pct, 'std')}%</small>` : ''));
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:-apple-system,Roboto,Arial,sans-serif;margin:32px;color:#111}h1{font-size:20px;margin:0}p{color:#888;font-size:12px;margin:4px 0 18px}table{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}td{padding:5px 4px;border-bottom:1px solid #eee}td.i{color:#aaa;font-size:9px;width:18px}td.o{width:30px;text-align:center}td.v{text-align:right}tr.n td.v,tr.t td.o{color:#e5322d}tr.t td{border-top:1.5px solid #111;font-weight:600}small{color:#999;font-size:9px}.tot{margin-top:18px;text-align:right;font-size:24px}</style></head><body><h1>${esc(t.name)}</h1><p>${new Date(t.updated).toLocaleString()}</p><table>${rows}</table><div class="tot">Total ${fmt(total())}</div></body></html>`;
}
function tapeImage(t) {
  compute(t);
  const scale = 2, W = 420, rowH = 26, pad = 18;
  const n = t.rows.length + 1;
  const H = pad * 2 + 46 + n * rowH + 56;
  const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale;
  const g = c.getContext('2d'); g.scale(scale, scale);
  const cs = getComputedStyle(document.body);
  const bg = cs.getPropertyValue('--tapeBg').trim(), fg = cs.getPropertyValue('--tapeText').trim(), dim = cs.getPropertyValue('--tapeDim').trim(), neg = cs.getPropertyValue('--neg').trim();
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.fillStyle = fg; g.font = '600 18px sans-serif'; g.fillText(t.name, pad, pad + 18);
  g.fillStyle = dim; g.font = '11px sans-serif'; g.fillText(new Date(t.updated).toLocaleString(), pad, pad + 36);
  let y = pad + 46;
  const draw = (i, cmt, op, v, isNeg, sub) => {
    y += rowH; g.font = '9px sans-serif'; g.fillStyle = dim; g.textAlign = 'left'; g.fillText(String(i), pad - 10, y - 8);
    g.font = '14px sans-serif'; g.fillStyle = fg; g.fillText((cmt || '').slice(0, 24), pad + 6, y - 8);
    g.textAlign = 'center'; g.fillStyle = op === '=' ? neg : fg; g.fillText(op, W * 0.56, y - 8);
    g.textAlign = 'right'; g.fillStyle = isNeg ? neg : fg; g.fillText(v, W - pad, y - (sub ? 12 : 8));
    if (sub) { g.font = '9px sans-serif'; g.fillStyle = dim; g.fillText(sub, W - pad, y - 1); }
    g.textAlign = 'left';
  };
  draw(0, t.startC, '', fmt(Number(t.start) || 0), (Number(t.start) || 0) < 0);
  t.rows.forEach((r, i) => draw(i + 1, r.c, r.kind === 'total' ? '=' : OPSYM[r.op], fmt(r.v), r.v < 0, r.pct != null ? fmt(r.pct, 'std') + '%' : ''));
  const tot = total();
  g.font = '300 30px sans-serif'; g.textAlign = 'right'; g.fillStyle = tot < 0 ? neg : fg; g.fillText(fmt(tot), W - pad, H - pad);
  return c.toDataURL('image/png').split(',')[1];
}
function exportAs(kind) {
  const t = T(); const base = t.name.replace(/[^\w\- ]+/g, '').trim() || 'Tape';
  if (kind === 'import') { if (A) A.pickTape(); else webPickTape(); return; }
  if (!A) { webExport(kind, t, base); return; }
  if (kind === 'txt') A.shareText(tapeText(t), t.name);
  else if (kind === 'csv') A.shareFile(tapeCSV(t), base + '.csv', 'text/csv');
  else if (kind === 'doc') A.shareFile(JSON.stringify({ app: 'tapecalc', v: 1, tape: t }, null, 1), base + '.tape.json', 'application/json');
  else if (kind === 'pdf') A.print(tapeHTML(t), t.name);
  else if (kind === 'img') A.shareImage(tapeImage(t), base + '.png');
}
/* ---------- web (home-screen) version: no native bridge, use the browser's share sheet ---------- */
async function webShare(file, text, title) {
  try {
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title }); return; }
    if (!file && navigator.share) { await navigator.share({ text, title }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  if (file) { // no share sheet: download instead
    const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  } else copyText(text);
}
function webExport(kind, t, base) {
  if (kind === 'txt') webShare(null, tapeText(t), t.name);
  else if (kind === 'csv') webShare(new File([tapeCSV(t)], base + '.csv', { type: 'text/csv' }), '', t.name);
  else if (kind === 'doc') webShare(new File([JSON.stringify({ app: 'tapecalc', v: 1, tape: t }, null, 1)], base + '.tape.json', { type: 'application/json' }), '', t.name);
  else if (kind === 'img') {
    const bin = atob(tapeImage(t)); const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    webShare(new File([u8], base + '.png', { type: 'image/png' }), '', t.name);
  } else if (kind === 'pdf') { // print the tape page from a hidden frame (Save as PDF lives in the print sheet)
    const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0';
    document.body.appendChild(f);
    f.onload = () => { setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 60000); }, 100); };
    f.srcdoc = tapeHTML(t);
  }
}
function webPickTape() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json,text/plain';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => window.importTape(r.result); r.readAsText(f); };
  inp.click();
}

// called from Android after the user picks a .tape.json file
window.importTape = function (json) {
  try {
    const d = JSON.parse(json); const src = d.tape || d;
    if (!src.rows) throw 0;
    const t = newTape(src.name || 'Imported'); t.rows = src.rows; t.start = src.start || 0; t.startC = src.startC || '';
    if (S.tapes.some(x => x.name === t.name)) t.name += ' (imported)';
    S.tapes.unshift(t); S.cur = t.id; render(); toast(`Imported "${t.name}"`);
  } catch (e) { toast('Not a tape document'); }
};

function tapesSheet() {
  const list = S.tapes.slice().sort((a, b) => b.updated - a.updated);
  const html = list.map(t => { const tot = compute(t); return `<div class="tp${t.id === S.cur ? ' cur' : ''}" data-id="${t.id}"><div><div class="nm">${esc(t.name)}</div><div class="meta">${t.rows.length} rows · ${new Date(t.updated).toLocaleDateString()}</div></div><div class="tt">${fmt(tot)}</div><button class="more" data-more="${t.id}">⋯</button></div>`; }).join('');
  compute();
  openSheet(`<h2>Tapes</h2><button class="item c" id="newT">+ New Tape</button>${html}<button class="cancel">Done</button>`, () => {
    on('.cancel', closeSheet);
    on('#newT', () => promptSheet('New tape name', `Tape ${S.tapes.length + 1}`, 'Create', name => { const t = newTape(name); S.tapes.push(t); S.cur = t.id; E = { s: '', pct: false, label: '' }; mode = null; pendingOp = '+'; render(); }));
    on('.tp', (b, e) => { if (e.target.closest('.more')) return; S.cur = b.dataset.id; E = { s: '', pct: false, label: '' }; mode = null; pendingOp = '+'; closeSheet(); render(); });
    on('.more', b => tapeActions(S.tapes.find(t => t.id === b.dataset.more)));
  });
}
function tapeActions(t) {
  openSheet(`<h2>${esc(t.name)}</h2>
    <button class="item c" data-a="open">Open</button><button class="item c" data-a="rename">Rename</button>
    <button class="item c" data-a="dup">Duplicate</button><button class="item c" data-a="export">Export or Print</button>
    <button class="item c dang" data-a="del">Delete Tape</button><button class="cancel">Back</button>`, () => {
    on('.cancel', tapesSheet);
    on('[data-a]', b => {
      const a = b.dataset.a;
      if (a === 'open') { S.cur = t.id; closeSheet(); render(); }
      if (a === 'rename') promptSheet('Rename tape', t.name, 'Save', n => { t.name = n; render(); tapesSheet(); });
      if (a === 'dup') { const c = JSON.parse(JSON.stringify(t)); c.id = uid(); c.name = t.name + ' copy'; c.updated = Date.now(); S.tapes.push(c); save(); tapesSheet(); }
      if (a === 'export') { S.cur = t.id; render(); shareSheet(); }
      if (a === 'del') confirmSheet(`Delete "${t.name}"?`, 'This tape and its comments will be removed.', 'Delete', () => {
        S.tapes = S.tapes.filter(x => x.id !== t.id);
        if (!S.tapes.length) S.tapes.push(newTape('Home'));
        if (S.cur === t.id) S.cur = S.tapes[0].id;
        render(); tapesSheet();
      });
    });
  });
}

function memorySheet() {
  const cur = E.s ? parseFloat(E.s) : total();
  const items = S.memory.map((m, i) => `<button class="item" data-m="${i}"><span>M${i + 1}${m.c ? ' · ' + esc(m.c) : ''}</span><span class="memv">${fmt(m.v)}</span></button>`).reverse().join('');
  openSheet(`<h2>Memory</h2><p class="sub">Tap a memory to use it. ${E.s ? 'Entry' : 'Total'}: ${fmt(cur)}</p>
    <button class="item" data-x="ms"><span>MS</span><span class="r">Store ${E.s ? 'entry' : 'total'}</span></button>
    <button class="item" data-x="mp"><span>M+</span><span class="r">Add to last memory</span></button>
    <button class="item" data-x="mm"><span>M−</span><span class="r">Subtract from last memory</span></button>
    <button class="item" data-x="mr"><span>MR</span><span class="r">Recall last memory</span></button>
    ${items ? '<div class="grp">Saved</div>' + items : ''}
    ${items ? '<button class="item c dang" data-x="mc">Clear Memory</button>' : ''}
    <button class="cancel">Done</button>`, () => {
    on('.cancel', closeSheet);
    on('[data-x]', b => {
      const x = b.dataset.x, last = S.memory[S.memory.length - 1];
      if (x === 'ms') { S.memory.push({ v: cur, c: T().name }); toast('Stored'); }
      if (x === 'mp') { if (last) last.v = clean(last.v + cur); else S.memory.push({ v: cur, c: '' }); toast('M+'); }
      if (x === 'mm') { if (last) last.v = clean(last.v - cur); else S.memory.push({ v: -cur, c: '' }); toast('M−'); }
      if (x === 'mr') { if (last) { E = { s: String(last.v), pct: false, label: last.c || 'Memory' }; } }
      if (x === 'mc') { S.memory = []; }
      closeSheet(); render();
    });
    on('[data-m]', b => { const m = S.memory[Number(b.dataset.m)]; E = { s: String(m.v), pct: false, label: m.c || 'Memory' }; closeSheet(); render(); });
  });
}

const THEMES = [['night', 'Night', '#000', '#ffe600', '#f5d90a'], ['day', 'Classic', '#fff', '#d7f7ff', '#fff500'], ['blueprint', 'Blueprint', '#d9d9d9', '#c4c4c4', '#1b2944'], ['coral', 'Coral', '#fff4f2', '#ff6b66', '#ff6b66'], ['ocean', 'Ocean', '#0b1626', '#1f8fff', '#0b1626']];
function themesHTML() {
  return `<div class="swatches">${THEMES.map(([id, n, a, b, c]) => `<button class="swatch${S.set.theme === id ? ' on' : ''}" data-th="${id}"><i style="background:${a}"></i><i style="background:${b}"></i><i style="background:${c};flex:1.4"></i><b>${n}</b></button>`).join('')}</div>`;
}
function themesSheet() {
  openSheet(`<h2>Color Set</h2>${themesHTML()}<button class="cancel">Done</button>`, () => {
    on('.cancel', closeSheet); on('[data-th]', b => { S.set.theme = b.dataset.th; applySettings(); save(); themesSheet(); });
  });
}
function settingsSheet() {
  const sw = (k, label) => `<button class="item" data-sw="${k}"><span>${label}</span><span class="sw${S.set[k] ? ' on' : ''}"></span></button>`;
  const ch = (k, v, label) => `<button class="item${S.set[k] === v ? ' on' : ''}" data-ch="${k}" data-v="${v}"><span>${label}</span><span class="r">${S.set[k] === v ? '✓' : ''}</span></button>`;
  openSheet(`<h2>Settings</h2>
    <div class="grp">Color Set</div>${themesHTML()}
    <div class="grp">Buttons</div>${ch('keyStyle', 'flat', 'Flat')}${ch('keyStyle', 'emboss', 'Embossed (raised)')}
    <div class="grp">Button borders</div>${ch('borders', 'none', 'No borders')}${ch('borders', 'light', 'Light — thin, soft black')}${ch('borders', 'thick', 'Thick')}
    ${S.set.borders === 'none' ? '' : `<div class="grp">Border size</div>${slider('borderW', 0.5, 10, 0.5, [0.5, 1, 2, 3, 5, 8], 'px')}`}
    <div class="grp">Plus sign shape</div>${ch('plusShape', 'tall', 'Tall — one long + filling the key')}${ch('plusShape', 'normal', 'Normal +')}
    <div class="grp">Plus sign size / thickness</div>
    ${slider('plusPct', 100, 1000, 10, [100, 200, 300, 500, 750, 1000])}
    <div class="grp">Number format</div>${ch('fmt', 'std', 'Standard (2 decimals)')}${ch('fmt', 'flt', 'Float (all decimals)')}${ch('fmt', 'whole', 'Whole numbers')}
    <div class="grp">Digit grouping</div>${ch('group', 'intl', '1,234,567.00')}${ch('group', 'indian', '12,34,567.00 (Indian)')}${ch('group', 'none', '1234567.00')}
    <div class="grp">GST slab</div><div class="plusChips">${GST_SLABS.map(g => `<button data-gs="${g}"${S.set.gstRate === g ? ' class="on"' : ''}>${g}%</button>`).join('')}</div>
    ${ch('gstKeys', 'row', 'GST keys in a row above the keypad')}${ch('gstKeys', 'col', 'GST keys as a column in the keypad')}${ch('gstKeys', 'off', 'Hide GST keys')}
    ${sw('gstMode', 'GST mode (show GST breakdown on the tape)')}
    <div class="grp">Feedback</div>${sw('sound', 'Key sounds')}${sw('haptic', 'Vibration')}
    <div class="grp">Interface</div>${sw('toolbar', 'Show tool bar')}${sw('autoScroll', 'Scroll tape to newest entry')}${sw('deg', 'Trig in degrees')}
    <button class="cancel">Done</button>`, () => {
    on('.cancel', closeSheet);
    on('[data-sw]', b => { S.set[b.dataset.sw] = !S.set[b.dataset.sw]; applySettings(); render(); settingsKeepScroll(); });
    on('[data-ch]', b => {
      const k = b.dataset.ch, v = b.dataset.v;
      // switching border style starts from that style's usual width; the slider fine-tunes it
      if (k === 'borders' && v !== S.set.borders && v !== 'none') S.set.borderW = v === 'thick' ? 3 : 1;
      S.set[k] = v; applySettings(); render(); settingsKeepScroll();
    });
    on('[data-th]', b => { S.set.theme = b.dataset.th; applySettings(); save(); settingsKeepScroll(); });
    on('[data-gs]', b => { S.set.gstRate = Number(b.dataset.gs); render(); settingsKeepScroll(); });
    $$('#sheet .plusSize').forEach(row => {
      const key = row.dataset.key, r = row.querySelector('input');
      const set = p => {
        S.set[key] = p; r.value = p; row.querySelector('b').textContent = p + row.dataset.unit;
        $$(`#sheet [data-pk="${key}"]`).forEach(c => c.classList.toggle('on', Number(c.dataset.pv) === p));
        applySettings(); save();
      };
      r.addEventListener('input', () => set(Number(r.value)));
      // while dragging, fade the sheet away so the real + key is visible behind it
      const peek = v => { document.body.classList.toggle('peek', v); row.classList.toggle('active', v); };
      r.addEventListener('pointerdown', () => peek(true));
      ['pointerup', 'pointercancel', 'change'].forEach(ev => r.addEventListener(ev, () => peek(false)));
      on(`[data-pk="${key}"]`, b => set(Number(b.dataset.pv)));
    });
  });
}
function slider(key, min, max, step, chips, unit = '%') {
  const v = S.set[key];
  return `<div class="plusSize" data-key="${key}" data-unit="${unit}"><input type="range" min="${min}" max="${max}" step="${step}" value="${v}"><b>${v}${unit}</b></div>
    <div class="plusChips">${chips.map(p => `<button data-pk="${key}" data-pv="${p}"${v === p ? ' class="on"' : ''}>${p}${unit}</button>`).join('')}</div>`;
}
function settingsKeepScroll() { const y = $('#sheet').scrollTop; settingsSheet(); $('#sheet').scrollTop = y; }

function tipsSheet() {
  const tips = [
    ['Fix any entry', 'Tap a row on the tape → Edit. Type the new value and tap an operator (or =). Every total below updates by itself.'],
    ['Add notes', 'Tap a row → Comment. Use Previous / Next to label rows quickly, like "Rent", "Fuel", "GST".'],
    ['Reorder', 'Press and hold a row, then drag it up or down.'],
    ['Percent', 'Type 18 then % — it becomes 18% of the running total. Then tap + to add it (great for GST / tips / discounts).'],
    ['GST', 'Type 1000 then +GST → 1,180 (18% added). −GST takes GST out of an inclusive price. With nothing typed, +GST / −GST put a GST line on the tape for the running total, and it updates if you edit rows above. Tap the slab key to switch 3 / 5 / 12 / 18 / 28%. The yellow display shows the full breakdown; tap a line to use that number.'],
    ['Scientific keys', 'Swipe the two left key columns sideways for sin, cos, tan, powers, roots, π, e, log and more.'],
    ['Many tapes', 'The tape key (bottom-left) opens the tape browser: keep separate tapes for each shop, client or trip.'],
    ['Hide the tool bar', 'Swipe down on the yellow display to hide the tool bar, swipe up to bring it back.'],
    ['Copy the total', 'Tap the big total to copy it.'],
  ];
  openSheet(`<h2>Tips</h2><div class="help">${tips.map(([h, p]) => `<h3>${h}</h3><div>${p}</div>`).join('')}</div><button class="cancel">Got it</button>`, () => on('.cancel', () => { S.set.tipsSeen = true; save(); closeSheet(); }));
}
function helpSheet() {
  openSheet(`<h2>Guide</h2><div class="help">
    <h3>How the tape works</h3><div>Each number you enter is written to the tape with the operator applied to it. Type <b>550</b> then <b>+</b>, <b>200</b> then <b>−</b>… and the running total is always shown big in the display. <b>=</b> writes a total line; you can keep adding after it.</div>
    <h3>Keys</h3><div>
    <b>⬡×</b> delete last row (or the row being edited)<br><b>⌫</b> backspace<br><b>⊗</b> clear the whole tape<br><b>C</b> clear entry (tap again to cancel edit / reset operator)<br>
    <b>M</b> memory: MS, M+, M−, MR and a list of saved values<br><b>±</b> change sign<br><b>Tape</b> tape browser<br><b>%</b> percent of running total</div>
    <h3>Row menu</h3><div><b>Delete</b>, <b>Edit</b>, <b>Insert</b> (number, total, + / − flagged), <b>Copy</b> (value, row, whole tape, use, save to memory), <b>Comment</b>, <b>Flag</b>.</div>
    <h3>Export</h3><div>Share as a Tape Document (re-importable), PDF / Print, Image, plain Text or tab-separated CSV for Excel / Sheets.</div>
    <h3>Display</h3><div>Tap <b>Standard</b> to switch number format. Tap the big total to copy it.</div>
    </div><button class="cancel">Done</button>`, () => on('.cancel', closeSheet));
}

/* ---------- settings / theme ---------- */
function applySettings() {
  document.body.dataset.theme = S.set.theme;
  document.body.classList.toggle('notool', !S.set.toolbar);
  // 100% = the size of the other operator signs (26px)
  document.documentElement.style.setProperty('--plusSize', (26 * (Number(S.set.plusPct) || 300) / 100) + 'px');
  // in the tall shape the size slider sets the bar thickness instead (200% ≈ 6px)
  document.documentElement.style.setProperty('--plusThick', Math.max(2, 3 * (Number(S.set.plusPct) || 200) / 100) + 'px');
  $('.k.plus').classList.toggle('tall', S.set.plusShape !== 'normal');
  document.body.classList.toggle('emboss', S.set.keyStyle === 'emboss');
  document.body.classList.toggle('gstmode', !!S.set.gstMode);
  document.body.dataset.gst = S.set.gstKeys;
  document.body.dataset.borders = S.set.borders;
  document.documentElement.style.setProperty('--bw', (Number(S.set.borderW) || 1) + 'px');  setAngleLabel();
  const cs = getComputedStyle(document.body);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = cs.getPropertyValue('--tapeBg').trim();
  if (A && A.setBars) { try { A.setBars(cs.getPropertyValue('--tapeBg').trim(), cs.getPropertyValue(S.set.toolbar ? '--barBg' : '--numBg').trim()); } catch (e) {} }
}

/* ---------- hardware keyboard + Android back ---------- */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const map = { '+': '+', '-': '−', '*': '×', 'x': '×', '/': '÷', '=': '=', 'Enter': '=', '.': '.', ',': '.', 'Backspace': 'back', 'Escape': 'clear', 'Delete': 'clear', '%': 'pct' };
  const k = /^[0-9]$/.test(e.key) ? e.key : map[e.key];
  if (k) { e.preventDefault(); press(k); }
});
window.onAndroidBack = function () {
  if (document.body.classList.contains('commenting')) { endComment(); return true; }
  if (!$('#sheetBack').classList.contains('hidden')) { closeSheet(); return true; }
  if (!$('#pop').classList.contains('hidden')) { closePop(); return true; }
  if (mode) { mode = null; E = { s: '', pct: false, label: '' }; render(); return true; }
  return false;
};
window.addEventListener('resize', () => renderDisplay());
document.addEventListener('visibilitychange', () => { if (document.hidden) { try { localStorage.setItem('tapecalc', JSON.stringify(S)); } catch (e) {} } });

/* ---------- boot ---------- */
bindKeys(); bindTape(); applySettings(); render();
// offline support for the web version only (the Android / iPhone apps already bundle the files)
if (!A && 'serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
if (!S.set.tipsSeen) setTimeout(tipsSheet, 400);
