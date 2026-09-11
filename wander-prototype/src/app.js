/* Wander prototype · app.js
   One card per entity, one DOM node for its whole life. Views publish slots; the card layer lays cards onto them. */
(function () {
'use strict';
const D = window.WANDER_DATA;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ICON = {
  must: '<svg viewBox="0 0 24 24"><path d="M12 3v18M5 10l7-7 7 7"/></svg>',
  lock: '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  flag: '<svg viewBox="0 0 24 24"><path d="M12 8v5M12 16h.01"/></svg>',
};
const MODE_DASH = { drive: '', fly: '10 8', rail: '6 4', walk: '1 6', ferry: '14 6 2 6', proposed: '2 4' };

// ---------------------------------------------------------------- state
const state = {
  stage: 'globe', dest: null, start: '2024-08-10', end: '2024-08-24', party: 'Couple', shape: 'Exact',
  tray: [], must: new Set(), locked: new Set(), booked: new Set(), pegs: {}, hints: {},
  answers: {}, questions: [], qi: 0,
  options: [], optIdx: 0, mode: 'options', compare: false,
  plan: null, removed: {}, history: [], chips: [], flyFromLast: false, reached: new Set(['globe']),
};
function nights() { return Math.max(1, Math.round((new Date(state.end) - new Date(state.start)) / 864e5)); }
function days() { return nights() + 1; }
function dateOf(i) { const d = new Date(state.start + 'T00:00:00'); d.setDate(d.getDate() + i); return d; }
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtD = (d) => `${DOW[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`;
const fmtShort = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${d.getDate()} ${MON[d.getMonth()]}`; };
function dayIndexOf(iso) { return Math.round((new Date(iso + 'T00:00:00') - new Date(state.start + 'T00:00:00')) / 864e5); }
function haversine(a, b) { const R = 6371, dLat = (b.lat - a.lat) * Math.PI / 180, dLon = (b.lon - a.lon) * Math.PI / 180; const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); }

// ---------------------------------------------------------------- toasts
function toast(text, opts = {}) {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span>${text}</span>${opts.mono ? `<span class="mono">${esc(opts.mono)}</span>` : ''}${opts.action ? `<button type="button">${esc(opts.action)}</button>` : ''}`;
  if (opts.action) $('button', t).addEventListener('click', () => { opts.onAction && opts.onAction(); t.remove(); });
  $('#toasts').append(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity 300ms'; setTimeout(() => t.remove(), 320); }, opts.ms || 3200);
}

// ---------------------------------------------------------------- THE CARD LAYER
const layer = $('#cards');
const cards = new Map();
const RADIUS = { pin: '999px', chip: '8px', tile: '12px', hero: '18px', ctl: '10px' };
function shapeFor(w, h) { if (w <= 40) return 'pin'; if (w < 110) return 'chip'; if (w >= 280) return 'hero'; return 'tile'; }

function ensureCard(id) {
  if (cards.has(id)) return cards.get(id);
  const e = D.byId[id];
  const el = document.createElement('div');
  el.className = 'card off'; el.dataset.id = id; el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', e.name);
  const typeLabel = e.type === 'event' ? fmtShort(e.date) : e.type;
  el.innerHTML = `<img src="${e.src}" alt="" draggable="false"><div class="scrim"></div><span class="type ${e.type === 'event' ? 'date' : ''}">${esc(typeLabel)}</span>
    <div class="meta"><span>${e.regionName}</span>${e.dur ? `<span>~${e.dur} h</span>` : ''}<span>${e.best}</span>${e.season ? `<span>${e.season}</span>` : ''}</div>
    <div class="name">${esc(e.name)}</div>
    <span class="badge b-must">${ICON.must}</span><span class="badge b-lock">${ICON.lock}</span><span class="badge b-book">${ICON.check}</span>
    <button class="act add" type="button" aria-label="Add">${ICON.plus}</button><button class="act x" type="button" aria-label="Remove">${ICON.x}</button>`;
  layer.append(el); cards.set(id, el);
  bindCard(el);
  return el;
}
function syncCardState(id) {
  const el = cards.get(id); if (!el) return;
  el.classList.toggle('must', state.must.has(id));
  el.classList.toggle('locked', state.locked.has(id));
  el.classList.toggle('booked', state.booked.has(id));
  el.classList.toggle('intray', state.tray.includes(id));
}
function place(el, r, instant) {
  if (instant) { el.style.transition = 'none'; }
  el.style.left = r.left + 'px'; el.style.top = r.top + 'px'; el.style.width = r.width + 'px'; el.style.height = r.height + 'px';
  if (instant) { void el.offsetWidth; el.style.transition = ''; }
}
let layoutPending = false, layoutMode = null;
function requestLayout(mode) { layoutMode = mode || layoutMode; if (layoutPending) return; layoutPending = true; requestAnimationFrame(() => { layoutPending = false; const m = layoutMode; layoutMode = null; layout(m); }); }

function layout(mode) {
  if (mode) layer.classList.add(mode);
  const claims = new Map(); const losers = [];
  for (const s of $$('[data-slot]')) {
    if (!s.getClientRects().length) continue;
    const id = s.dataset.slot; if (!D.byId[id]) continue;
    let prio = +(s.dataset.prio || 0); if (s.classList.contains('focus')) prio += 100;
    const c = claims.get(id);
    if (!c || prio > c.prio) { if (c) losers.push(c.slot); claims.set(id, { slot: s, prio }); } else losers.push(s);
  }
  for (const s of losers) { s.classList.add('ghosted'); s.style.setProperty('--ghost', `url("${D.byId[s.dataset.slot].src}")`); }
  const vw = innerWidth, vh = innerHeight;
  claims.forEach(({ slot }, id) => {
    slot.classList.remove('ghosted');
    const el = ensureCard(id);
    let r = slot.getBoundingClientRect();
    // clip to the nearest scroll container
    let clip = ''; let box = null; let anc = slot.parentElement;
    while (anc) { if (anc.classList && anc.classList.contains('clip')) { const c = anc.getBoundingClientRect(); box = box ? { left: Math.max(box.left, c.left), top: Math.max(box.top, c.top), right: Math.min(box.right, c.right), bottom: Math.min(box.bottom, c.bottom) } : { left: c.left, top: c.top, right: c.right, bottom: c.bottom }; } anc = anc.parentElement; }
    if (box) {
      if (r.right < box.left || r.left > box.right || r.bottom < box.top || r.top > box.bottom) { hideCard(el); return; }
      const t = Math.max(0, box.top - r.top), l = Math.max(0, box.left - r.left), b = Math.max(0, r.bottom - box.bottom), rr = Math.max(0, r.right - box.right);
      clip = (t || l || b || rr) ? `inset(${t}px ${rr}px ${b}px ${l}px)` : '';
    }
    if (r.right < -50 || r.left > vw + 50 || r.bottom < -50 || r.top > vh + 50) { hideCard(el); return; }
    const shape = slot.dataset.shape || shapeFor(r.width, r.height);
    const wasOff = el.classList.contains('off');
    if (el._slot !== slot) {
      if (!wasOff && el._slot) fly(el);
      else if (wasOff && el._last && state.flyFromLast) { place(el, el._last, true); fly(el); }
      else if (wasOff) { place(el, r, true); }
      el._slot = slot;
    }
    el.dataset.shape = shape; el.dataset.role = slot.dataset.role || '';
    el.style.borderRadius = RADIUS[shape] || '12px';
    el.style.clipPath = clip;
    place(el, r, false);
    el.classList.remove('off');
    syncCardState(id);
  });
  cards.forEach((el, id) => { if (!claims.has(id)) hideCard(el); });
  if (mode) requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.remove(mode)));
}
function hideCard(el) {
  if (!el.classList.contains('off')) { el._last = { left: parseFloat(el.style.left), top: parseFloat(el.style.top), width: parseFloat(el.style.width), height: parseFloat(el.style.height) }; }
  el.classList.add('off'); el._slot = null; el.style.clipPath = '';
}
function fly(el) { el.classList.add('flying'); clearTimeout(el._ft); el._ft = setTimeout(() => el.classList.remove('flying'), 380); }

// scroll & resize → instant re-layout
let scrollIdle;
document.addEventListener('scroll', () => { requestLayout('instant'); clearTimeout(scrollIdle); }, true);
addEventListener('resize', () => { requestLayout('instant'); renderMaps(); });

// ---------------------------------------------------------------- card interaction (click vs drag)
let drag = null;
function bindCard(el) {
  el.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    const id = el.dataset.id, role = el.dataset.role;
    if (ev.target.closest('.act')) return;
    drag = { el, id, role, x0: ev.clientX, y0: ev.clientY, started: false, ox: ev.clientX - el.getBoundingClientRect().left, oy: ev.clientY - el.getBoundingClientRect().top };
    el.setPointerCapture(ev.pointerId);
  });
  el.addEventListener('pointermove', (ev) => {
    if (!drag || drag.el !== el) return;
    const dx = ev.clientX - drag.x0, dy = ev.clientY - drag.y0;
    if (!drag.started) { if (Math.hypot(dx, dy) < 7) return; if (!['tray', 'day', 'gallery', 'leftout'].includes(drag.role)) return; startDrag(ev); }
    el.style.left = (ev.clientX - drag.ox) + 'px'; el.style.top = (ev.clientY - drag.oy) + 'px';
    dragOver(ev);
  });
  const end = (ev) => { if (!drag || drag.el !== el) return; const d = drag; drag = null; if (d.started) endDrag(d, ev); else cardClick(d.id, d.role, el, ev); };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  $('.act.add', el).addEventListener('click', (ev) => { ev.stopPropagation(); addToTray(el.dataset.id); });
  $('.act.x', el).addEventListener('click', (ev) => { ev.stopPropagation(); const r = el.dataset.role; if (r === 'tray') removeFromTray(el.dataset.id); else if (r === 'day') dropFromPlan(el.dataset.id, 'you removed it'); });
  el.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cardClick(el.dataset.id, el.dataset.role, el, ev); } });
}
function startDrag(ev) {
  drag.started = true; const el = drag.el; el.classList.add('dragging'); el.style.pointerEvents = 'none'; el.style.clipPath = '';
  const r = el.getBoundingClientRect(); const w = Math.min(r.width, 120), h = Math.min(r.height, 120);
  drag.ox = drag.ox * (w / r.width); drag.oy = drag.oy * (h / r.height);
  el.style.width = w + 'px'; el.style.height = h + 'px';
}
function dragOver(ev) {
  $$('.day.over,#tray.over').forEach(x => x.classList.remove('over'));
  const t = document.elementFromPoint(ev.clientX, ev.clientY); if (!t) return;
  const day = t.closest('.day:not(.endday)'); if (day && drag.role !== 'tray' && drag.role !== 'gallery') day.classList.add('over');
  const tray = t.closest('#tray-wrap'); if (tray && (drag.role === 'gallery' || drag.role === 'tray')) $('#tray').classList.add('over');
}
function endDrag(d, ev) {
  const el = d.el; el.classList.remove('dragging'); el.style.pointerEvents = '';
  $$('.day.over,#tray.over').forEach(x => x.classList.remove('over'));
  const t = document.elementFromPoint(ev.clientX, ev.clientY);
  const dy = ev.clientY - d.y0;
  if (d.role === 'tray') {
    if (t && t.closest('#ribbon')) { pegToRibbon(d.id, ev.clientX); }
    else if (t && t.closest('#board-map')) { state.hints[d.id] = true; toast(`Noted — ${D.byId[d.id].name} roughly here.`, { mono: 'map hint' }); }
    else if (dy < -70) { removeFromTray(d.id); }
    else if (t && t.closest('#tray')) { reorderTray(d.id, ev.clientX); }
  } else if (d.role === 'gallery') {
    if (t && t.closest('#tray-wrap')) addToTray(d.id); else if (t && t.closest('#ribbon')) { addToTray(d.id); pegToRibbon(d.id, ev.clientX); }
  } else if (d.role === 'day' || d.role === 'leftout') {
    const day = t && t.closest('.day:not(.endday)');
    if (day) moveToDay(d.id, +day.dataset.day, ev.clientY, day);
  }
  requestLayout();
}
function cardClick(id, role, el, ev) {
  if (role === 'gallery' || role === 'globe' || role === 'sugg') { if (role === 'globe') { pickDestination(D.destinations[0]); goStage('board'); } addToTray(id); }
  else if (role === 'tray') { toggleMust(id); }
  else if (role === 'day' || role === 'map' || role === 'leftout' || role === 'compare' || role === 'variant') { openHero(id, el); }
}

// ---------------------------------------------------------------- hero popover
const hero = $('#hero');
function openHero(id, anchor) {
  const e = D.byId[id]; const inPlan = planHas(id); const inTray = state.tray.includes(id);
  const w = D.warnings[id];
  hero.innerHTML = `<div class="hslot" data-slot="${id}" data-shape="hero" data-prio="200" data-role="hero"></div>
    <div class="hb"><p>${esc(e.blurb)}</p>
    <div class="row"><span class="tag">${e.regionName}</span>${e.dur ? `<span class="tag">~${e.dur} h</span>` : ''}<span class="tag">${e.best}</span>${e.lead ? `<span class="tag">book ${e.lead} d ahead</span>` : ''}${e.season ? `<span class="tag">${e.season}</span>` : ''}</div>
    ${w ? `<span class="flag ${w.level}">${ICON.flag}${esc(w.text)}</span>` : ''}
    <div class="row">
      ${state.stage === 'board' ? (inTray ? `<button class="btn quiet sm" data-act="must">${state.must.has(id) ? 'Un-must' : 'Make it a must'}</button><button class="btn quiet sm" data-act="remove">Remove</button>` : `<button class="btn primary sm" data-act="add">Add to board</button>`) : ''}
      ${(state.stage === 'work' && state.mode === 'refine') ? (inPlan ? `<button class="btn quiet sm" data-act="lock">${state.locked.has(id) ? 'Unlock' : 'Lock'}</button><button class="btn quiet sm" data-act="drop">Drop</button><button class="btn quiet sm" data-act="chip">Reference in chat</button>` : `<button class="btn primary sm" data-act="readd">Put it back in</button>`) : ''}
      ${(state.stage === 'work' && state.mode === 'options') ? `<button class="btn quiet sm" data-act="chip">Reference in chat</button>` : ''}
      <button class="btn bare sm" data-act="close">Close</button>
    </div></div>`;
  hero.hidden = false;
  const r = anchor.getBoundingClientRect();
  let x = r.right + 12, y = r.top - 20; if (x + 350 > innerWidth) x = r.left - 352; if (x < 8) x = 8; y = clamp(y, 64, innerHeight - 380);
  hero.style.left = x + 'px'; hero.style.top = y + 'px';
  hero.onclick = (ev) => {
    const b = ev.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act;
    if (a === 'close') closeHero();
    if (a === 'add') { addToTray(id); closeHero(); }
    if (a === 'must') { toggleMust(id); closeHero(); }
    if (a === 'remove') { removeFromTray(id); closeHero(); }
    if (a === 'lock') { toggleLock(id); closeHero(); }
    if (a === 'drop') { dropFromPlan(id, 'you removed it'); closeHero(); }
    if (a === 'readd') { readdToPlan(id); closeHero(); }
    if (a === 'chip') { addChip({ kind: 'card', id }); closeHero(); }
  };
  requestLayout();
}
function closeHero() { hero.hidden = true; hero.innerHTML = ''; requestLayout(); }
document.addEventListener('pointerdown', (ev) => { if (!hero.hidden && !ev.target.closest('#hero') && !ev.target.closest('.card')) closeHero(); });
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeHero(); });

// ---------------------------------------------------------------- MAP (shared renderer)
const maps = {};
function project(el) {
  const W = el.clientWidth, H = el.clientHeight; const pad = 28;
  const lon0 = 79.55, lon1 = 81.95, lat0 = 5.85, lat1 = 9.95;
  const sx = (W - pad * 2) / (lon1 - lon0), sy = (H - pad * 2) / (lat1 - lat0); const s = Math.min(sx, sy);
  const ox = (W - (lon1 - lon0) * s) / 2, oy = (H - (lat1 - lat0) * s) / 2;
  return (lon, lat) => [ox + (lon - lon0) * s, oy + (lat1 - lat) * s];
}
function renderMap(el, opts) {
  maps[el.id] = opts;
  const P = project(el); const W = el.clientWidth, H = el.clientHeight;
  let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
  for (let lon = 79; lon <= 82.5; lon += .5) { const [x] = P(lon, 7); svg += `<line class="grat" x1="${x}" y1="0" x2="${x}" y2="${H}"/>`; }
  for (let lat = 5.5; lat <= 10; lat += .5) { const [, y] = P(80, lat); svg += `<line class="grat" x1="0" y1="${y}" x2="${W}" y2="${y}"/>`; }
  const pts = D.outline.map(([lo, la]) => P(lo, la));
  const path = 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join('L') + 'Z';
  svg += `<path class="land" d="${path}"/>`;
  // region labels
  const labels = opts.labels || Object.keys(D.regions);
  for (const k of labels) { const r = D.regions[k]; const [x, y] = P(r.lon, r.lat); const big = opts.bases && opts.bases.includes(k); svg += `<text class="lbl ${big ? 'big' : ''}" x="${x + 10}" y="${y + (big ? 5 : 3)}">${r.name}</text>`; }
  // dots for all entities (board)
  if (opts.dots) for (const e of D.entities) { const [x, y] = P(e.lon, e.lat); svg += `<circle cx="${x}" cy="${y}" r="2.2" fill="var(--sk-ink-3)" opacity=".55"/>`; }
  // thread
  if (opts.route) {
    const segs = opts.route; // [{from:{lon,lat}, to:{...}, mode}]
    let halo = '', line = '', legs = '';
    segs.forEach((sg, i) => {
      const a = P(sg.from.lon, sg.from.lat), b = P(sg.to.lon, sg.to.lat);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; const dx = b[0] - a[0], dy = b[1] - a[1]; const len = Math.hypot(dx, dy) || 1;
      const bend = sg.mode === 'fly' ? .35 : .12; const cx = mx - dy / len * len * bend, cy = my + dx / len * len * bend;
      const d = `M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`;
      halo += `<path class="thread halo ${opts.animate ? 'anim' : ''}" d="${d}"/>`;
      line += `<path class="thread ${sg.proposed ? 'proposed' : ''} ${opts.animate ? 'anim' : ''}" d="${d}" stroke-dasharray="${MODE_DASH[sg.proposed ? 'proposed' : sg.mode] || ''}"/>`;
      if (sg.label) legs += `<text class="legs" x="${(a[0] + cx + b[0]) / 3 + 6}" y="${(a[1] + cy + b[1]) / 3 - 4}">${sg.label}</text>`;
    });
    svg += halo + line + legs;
    if (opts.bases) for (const k of opts.bases) { const r = D.regions[k]; const [x, y] = P(r.lon, r.lat); svg += `<circle class="base" cx="${x}" cy="${y}" r="5"/>`; }
  }
  if (opts.conflicts) for (const [a, b] of opts.conflicts) { const A = P(D.byId[a].lon, D.byId[a].lat), B = P(D.byId[b].lon, D.byId[b].lat); svg += `<path class="conflict" d="M${A[0]},${A[1]} L${B[0]},${B[1]}"/><text class="legs" fill="var(--sk-bad)" x="${(A[0] + B[0]) / 2 + 6}" y="${(A[1] + B[1]) / 2}" style="fill:var(--sk-bad)">~${Math.round(haversine(D.byId[a], D.byId[b]) * 1.4 / 45)} h by road</text>`; }
  svg += '</svg>';
  let html = svg;
  // stickers
  if (opts.stickers !== false) html += D.mapStickers.map(s => { const [x, y] = P(s.lon, s.lat); return `<img class="stick" src="${s.src}" alt="" style="left:${x}px;top:${y}px;width:${s.w}px">`; }).join('');
  // pin slots
  html += '<div class="pins">' + (opts.pins || []).map(id => { const e = D.byId[id]; const [x, y] = P(e.lon, e.lat); return `<div class="pslot" data-slot="${id}" data-shape="pin" data-prio="${opts.pinPrio || 1}" data-role="map" style="left:${x}px;top:${y}px"></div>`; }).join('') + '</div>';
  if (opts.title) html += `<div class="maptitle"><b>${opts.title}</b><span>${opts.subtitle || ''}</span></div>`;
  if (opts.legend) html += `<div class="legend">${['drive', 'rail', 'fly'].map(m => `<div><svg viewBox="0 0 34 8"><path d="M1 4h32" stroke="var(--sk-thread)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${MODE_DASH[m]}"/></svg>${m}</div>`).join('')}</div>`;
  el.innerHTML = html;
  // ghost hover → focus
  $$('.pslot', el).forEach(s => {
    s.style.pointerEvents = 'auto';
    s.addEventListener('pointerenter', () => { s.classList.add('focus', 'hover'); requestLayout('quick'); });
    s.addEventListener('pointerleave', () => { s.classList.remove('focus', 'hover'); requestLayout('quick'); });
  });
  if (opts.animate) {
    $$('.thread.anim', el).forEach((p, i) => { const L = p.getTotalLength(); const dash = p.getAttribute('stroke-dasharray'); p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = L; p.style.transition = `stroke-dashoffset 700ms ${Math.floor(i / 2) * 260}ms ease-out`; requestAnimationFrame(() => requestAnimationFrame(() => { p.style.strokeDashoffset = 0; })); if (dash) setTimeout(() => { p.style.strokeDasharray = dash; }, 700 + Math.floor(i / 2) * 260 + 50); });
  }
  requestLayout('instant');
}
function renderMaps() { for (const id in maps) { const el = document.getElementById(id); if (el && el.getClientRects().length) renderMap(el, maps[id]); } }

// ---------------------------------------------------------------- STAGES
const STAGES = ['globe', 'board', 'options', 'refine', 'export'];
function goStage(s) {
  closeHero();
  const prev = state.stage;
  state.stage = (s === 'options' || s === 'refine') ? 'work' : s;
  state.reached.add(s);
  $('#app').dataset.stage = state.stage;
  $('#v-globe').hidden = state.stage !== 'globe';
  $('#v-board').hidden = !(state.stage === 'board' || state.stage === 'questions');
  $('#v-questions').hidden = state.stage !== 'questions';
  $('#v-work').hidden = state.stage !== 'work';
  $('#v-export').hidden = state.stage !== 'export';
  if (s === 'options' || s === 'refine') { state.mode = s; $('#v-work').dataset.mode = s; }
  $$('#crumbs button').forEach(b => { const k = b.dataset.go; b.disabled = !state.reached.has(k); b.classList.toggle('on', k === s || (k === 'board' && s === 'questions')); b.classList.toggle('done', state.reached.has(k) && k !== s); });
  if (state.stage === 'globe') startGlobe(); else stopGlobe();
  if (state.stage === 'board') { renderBoard(); }
  if (state.stage === 'work') { renderWork(); }
  if (state.stage === 'export') { renderExport(); }
  renderTripline();
  requestAnimationFrame(() => { renderMaps(); requestLayout(prev === state.stage ? 'instant' : undefined); });
}
$('#crumbs').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b || b.disabled) return; goStage(b.dataset.go); });
function renderTripline() {
  const t = $('#tripline'); if (!state.dest) { t.innerHTML = ''; return; }
  t.innerHTML = `<span><b>${state.dest.name}</b></span><span class="mono">${fmtShort(state.start)} → ${fmtShort(state.end)}</span><span class="mono">${nights()} nights</span><span>${state.party}</span>`;
}

// theme
$$('[data-theme]').forEach(b => b.addEventListener('click', () => { const t = b.dataset.theme; if (t === 'sys') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); $$('[data-theme]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); try { localStorage.setItem('wander-theme', t); } catch (e) { } }));
try { const t = localStorage.getItem('wander-theme'); if (t) { const b = $(`[data-theme="${t}"]`); b && b.click(); } } catch (e) { }

// ---------------------------------------------------------------- 1 · GLOBE
const gc = $('#globe'); const gctx = gc.getContext('2d');
let gRot = 0, gRaf = null, gLast = 0, gPaused = false, gZoom = 0;
const FEATURED = ['sigiriya', 'kandy-train', 'perahera', 'coconut-hill', 'yala-leopard', 'galle-fort'];
const featOffsets = [[-26, 14], [22, 18], [-20, -16], [26, -12], [4, 28], [-4, -30]];
function startGlobe() { if (gRaf) return; gLast = performance.now(); const feat = $('#globe-feat'); if (!feat.children.length) feat.innerHTML = FEATURED.map(id => `<div class="fslot" data-slot="${id}" data-shape="chip" data-prio="1" data-role="globe"></div>`).join(''); const tick = (t) => { gRaf = requestAnimationFrame(tick); const dt = Math.min(50, t - gLast); gLast = t; if (!gPaused) gRot += dt * 0.006; drawGlobe(); }; gRaf = requestAnimationFrame(tick); }
function stopGlobe() { if (gRaf) cancelAnimationFrame(gRaf); gRaf = null; }
$('#globe-feat').addEventListener('pointerover', () => gPaused = true); $('#globe-feat').addEventListener('pointerout', () => gPaused = false);
function sph(lat, lon, rot) { const la = lat * Math.PI / 180, lo = (lon + rot) * Math.PI / 180; const tilt = -0.28; let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt); return [x, y2, z2]; }
function drawGlobe() {
  const box = gc.parentElement.getBoundingClientRect(); const dpr = devicePixelRatio || 1;
  if (gc.width !== box.width * dpr || gc.height !== box.height * dpr) { gc.width = box.width * dpr; gc.height = box.height * dpr; }
  const W = box.width, H = box.height; const ctx = gctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const cs = getComputedStyle(document.documentElement); const ink = cs.getPropertyValue('--sk-ink').trim(), thread = cs.getPropertyValue('--sk-thread').trim(), bill = cs.getPropertyValue('--sk-bill').trim(), surface = cs.getPropertyValue('--sk-surface').trim(), ink3 = cs.getPropertyValue('--sk-ink-3').trim();
  const R = Math.min(W, H) * 0.36 * (1 + gZoom * 2.2); const cx = W * 0.5 - gZoom * (W * 0.1), cy = H * 0.52;
  const rot = -80.7 + 40 + gRot; // keep Sri Lanka drifting near the front
  // sphere
  const grd = ctx.createRadialGradient(cx - R * .35, cy - R * .4, R * .1, cx, cy, R); grd.addColorStop(0, surface); grd.addColorStop(1, cs.getPropertyValue('--sk-thread-soft').trim());
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = grd; ctx.fill(); ctx.strokeStyle = thread; ctx.globalAlpha = .35; ctx.lineWidth = 1; ctx.stroke(); ctx.globalAlpha = 1;
  // graticule
  ctx.strokeStyle = thread; ctx.globalAlpha = .18; ctx.lineWidth = .7;
  for (let lat = -60; lat <= 60; lat += 30) { ctx.beginPath(); let first = true; for (let lon = 0; lon <= 360; lon += 4) { const [x, y, z] = sph(lat, lon, rot); if (z < 0) { first = true; continue; } const px = cx + x * R, py = cy - y * R; if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); } ctx.stroke(); }
  for (let lon = 0; lon < 360; lon += 30) { ctx.beginPath(); let first = true; for (let lat = -90; lat <= 90; lat += 3) { const [x, y, z] = sph(lat, lon, rot); if (z < 0) { first = true; continue; } const px = cx + x * R, py = cy - y * R; if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py); } ctx.stroke(); }
  ctx.globalAlpha = 1;
  // cities
  for (const [la, lo] of D.cities) { const [x, y, z] = sph(la, lo, rot); if (z < 0) continue; ctx.beginPath(); ctx.arc(cx + x * R, cy - y * R, 1.6 + z * 1.2, 0, Math.PI * 2); ctx.fillStyle = ink3; ctx.globalAlpha = .35 + z * .5; ctx.fill(); }
  ctx.globalAlpha = 1;
  // destinations
  for (const d of D.destinations) { const [x, y, z] = sph(d.lat, d.lon, rot); if (z < 0) continue; const px = cx + x * R, py = cy - y * R; ctx.beginPath(); ctx.arc(px, py, d.ready ? 6 : 3.2, 0, Math.PI * 2); ctx.fillStyle = d.ready ? bill : thread; ctx.fill(); if (d.ready) { ctx.beginPath(); ctx.arc(px, py, 6 + 6 * (0.5 + 0.5 * Math.sin(performance.now() / 350)), 0, Math.PI * 2); ctx.strokeStyle = bill; ctx.globalAlpha = .4; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.font = `600 13px ${cs.getPropertyValue('--sk-font-display')}`; ctx.fillText(d.name, px + 12, py + 4); } }
  // featured cards on the sphere
  const sl = D.destinations[0]; const slots = $$('#globe-feat .fslot');
  slots.forEach((s, i) => { const [dlat, dlon] = featOffsets[i]; const [x, y, z] = sph(sl.lat + dlat, sl.lon + dlon, rot); if (z < 0.05) { s.style.display = 'none'; return; } s.style.display = ''; const lift = 1.16; const px = cx + x * R * lift, py = cy - y * R * lift; const sz = 56 + z * 44; s.style.left = px + 'px'; s.style.top = py + 'px'; s.style.width = sz + 'px'; s.style.height = sz * 1.25 + 'px'; s.style.opacity = String(z); });
  layout('instant');
}
// search
const whereIn = $('#where'), drop = $('#where-drop'); let selIdx = 0;
function renderDrop() {
  const q = whereIn.value.trim().toLowerCase(); const list = D.destinations.filter(d => !q || d.name.toLowerCase().includes(q) || (q === 'sri' || q === 'lanka'));
  if (!list.length) { drop.hidden = true; return; }
  drop.innerHTML = list.map((d, i) => `<button type="button" class="${i === selIdx ? 'sel' : ''}" data-i="${D.destinations.indexOf(d)}"><b>${d.name}</b><small>${d.sub}</small>${d.ready ? '<span class="ok">built</span>' : ''}</button>`).join(''); drop.hidden = false;
}
whereIn.addEventListener('focus', renderDrop); whereIn.addEventListener('input', () => { selIdx = 0; renderDrop(); });
whereIn.addEventListener('keydown', (ev) => { if (ev.key === 'ArrowDown') { selIdx++; renderDrop(); ev.preventDefault(); } if (ev.key === 'ArrowUp') { selIdx = Math.max(0, selIdx - 1); renderDrop(); ev.preventDefault(); } if (ev.key === 'Enter') { const b = $('#where-drop button.sel') || $('#where-drop button'); if (b) b.click(); } if (ev.key === 'Escape') drop.hidden = true; });
drop.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; pickDestination(D.destinations[+b.dataset.i]); });
document.addEventListener('pointerdown', (ev) => { if (!ev.target.closest('.search')) drop.hidden = true; });
function pickDestination(d) {
  drop.hidden = true;
  if (!d.ready) { toast(`${d.name} isn't built in this prototype yet — Sri Lanka is.`, { action: 'Use Sri Lanka', onAction: () => pickDestination(D.destinations[0]) }); whereIn.value = ''; return; }
  state.dest = d; whereIn.value = d.name; $('#go-board').disabled = false; renderTripline(); feasibility();
}
$('#d-start').addEventListener('change', () => { state.start = $('#d-start').value; feasibility(); renderTripline(); });
$('#d-end').addEventListener('change', () => { state.end = $('#d-end').value; feasibility(); renderTripline(); });
$$('#d-shape button').forEach(b => b.addEventListener('click', () => { $$('#d-shape button').forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); state.shape = b.textContent.trim(); feasibility(); }));
$$('#party .pill').forEach(b => b.addEventListener('click', () => { $$('#party .pill').forEach(x => x.classList.remove('on')); b.classList.add('on'); state.party = b.textContent.trim(); renderTripline(); }));
function feasibility() {
  const n = nights(); $('#d-len').textContent = `${n} nights · ${days()} days`;
  const f = $('#feas'); f.classList.remove('tight');
  let txt;
  if (state.shape === 'Not sure') txt = 'No dates yet — the board will show you what\'s worth timing a trip for. August has the Kandy Perahera and the Minneriya elephant gathering.';
  else if (n < 6) { txt = `${n} nights is tight for the whole island — want to focus on the hills, or the south coast?`; f.classList.add('tight'); }
  else if (n < 10) txt = `${n} nights covers the hills and one coast comfortably. Sigiriya and a safari fit if you keep moving.`;
  else if (n <= 16) txt = `${n} nights is the classic Sri Lanka loop — enough for the hills, a safari and the coast.`;
  else txt = `${n} nights is generous — room for the east coast, which is in season in August.`;
  $('span', f).textContent = txt;
}
feasibility();
$('#go-board').addEventListener('click', () => { if (!state.dest) return; zoomToIsland(() => goStage('board')); });
$('#express').addEventListener('click', () => { pickDestination(D.destinations[0]); ['sigiriya', 'kandy-train', 'perahera', 'yala-leopard', 'galle-fort', 'coconut-hill', 'nine-arch', 'minneriya', 'villa', 'pettah'].forEach(id => { if (!state.tray.includes(id)) state.tray.push(id); }); state.must.add('perahera'); state.must.add('sigiriya'); zoomToIsland(() => { goStage('board'); setTimeout(startQuestions, 500); }); });
function zoomToIsland(done) { const t0 = performance.now(); const step = (t) => { gZoom = clamp((t - t0) / 650, 0, 1); if (gZoom < 1) requestAnimationFrame(step); else { done(); gZoom = 0; } }; requestAnimationFrame(step); }

// ---------------------------------------------------------------- 2 · BOARD
function renderBoard() {
  renderShelves(); renderTray(); renderRibbon(); renderMeter();
  renderMap($('#board-map'), { dots: true, pins: state.tray, pinPrio: 1, title: 'Sri Lanka', subtitle: `${fmtShort(state.start)} – ${fmtShort(state.end)} · ${nights()} nights` });
}
function nearShelf() {
  if (!state.tray.length) return [];
  const near = new Map();
  for (const e of D.entities) { if (state.tray.includes(e.id)) continue; let best = 1e9; for (const t of state.tray) best = Math.min(best, haversine(e, D.byId[t])); if (best < 45) near.set(e.id, best); }
  return [...near.entries()].sort((a, b) => a[1] - b[1]).slice(0, 8).map(x => x[0]);
}
function renderShelves() {
  const c = $('#board-shelves'); c.classList.add('clip');
  const sizes = ['', 'tall', 'wide', '', 'wide', 'tall', '', ''];
  let html = `<div class="board-h"><div><h2>Build it out of photographs.</h2><p>Tap what you want. Wander reads each photo as a place, a duration, a season and a booking — you just pick.</p></div>
    <div class="sugg" id="sugg" hidden></div></div>`;
  for (const sh of D.shelves) {
    const ids = sh.dynamic ? nearShelf() : sh.ids;
    const why = sh.id === 'dates' ? `${fmtShort(state.start)} – ${fmtShort(state.end)} · events and seasonal moments` : sh.why;
    html += `<div class="shelf ${ids.length ? '' : 'empty'}" data-shelf="${sh.id}"><div class="shelf-h"><h3>${sh.title}</h3><span class="why">${why}</span></div>
      <div class="shelf-row clip">${ids.length ? ids.map((id, i) => `<div class="tslot ${sizes[(i + sh.title.length) % sizes.length]}" data-slot="${id}" data-shape="tile" data-prio="1" data-role="gallery"></div>`).join('') : '<span>Add something and this shelf fills with what\'s nearby.</span>'}</div></div>`;
  }
  c.innerHTML = html;
  // hover a gallery card → pulse its dot on the map (via focus of a temp pin)
  requestLayout('instant');
}
function renderTray() {
  const t = $('#tray');
  if (!state.tray.length) { t.innerHTML = `<div class="empty"><i></i>Your tray. Tap any photo to start.</div>`; }
  else t.innerHTML = state.tray.map(id => `<div class="tslot" data-slot="${id}" data-shape="chip" data-prio="2" data-role="tray"></div>`).join('');
  const pi = $('#plan-it'); pi.disabled = !state.tray.length;
  const m = meter(); pi.innerHTML = (m.ratio > 1.15 ? 'Plan it — I\'ll help you cut' : m.ratio > 0.92 ? 'Plan it (tight)' : 'Plan it') + ` <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  requestLayout();
}
// fisheye
$('#tray').addEventListener('pointermove', (ev) => { if (drag) return; const slots = $$('#tray .tslot'); slots.forEach(s => { const r = s.getBoundingClientRect(); const d = Math.abs(ev.clientX - (r.left + r.width / 2)); const f = Math.max(0, 1 - d / 130); s.style.flexGrow = String(1 + 1.1 * f * f); s.style.height = (56 + 16 * f * f) + 'px'; s.style.maxWidth = (96 + 60 * f * f) + 'px'; }); requestLayout('quick'); });
$('#tray').addEventListener('pointerleave', () => { $$('#tray .tslot').forEach(s => { s.style.flexGrow = ''; s.style.height = ''; s.style.maxWidth = ''; }); requestLayout('quick'); });
function meter() {
  const hours = state.tray.reduce((a, id) => a + (D.byId[id].dur || 0), 0);
  const regions = new Set(state.tray.map(id => D.byId[id].region));
  const need = hours / 7 + Math.max(0, regions.size - 1) * 0.55 + (state.tray.some(id => D.byId[id].region === 'trinco' || D.byId[id].region === 'arugam') && state.tray.some(id => ['galle', 'mirissa', 'hikkaduwa'].includes(D.byId[id].region)) ? 1.5 : 0);
  return { need, have: days(), ratio: need / days() };
}
function renderMeter() {
  const m = meter(); const fill = $('#meter-fill'); const pct = clamp(m.ratio * 100, 0, 100);
  requestAnimationFrame(() => { fill.style.width = pct + '%'; fill.style.background = m.ratio > 1.05 ? 'var(--sk-bad)' : m.ratio > 0.9 ? 'var(--sk-warn)' : 'var(--sk-ok)'; });
  const n = Math.round(m.need * 2) / 2;
  $('#meter-txt').innerHTML = state.tray.length ? `About <strong>${n} day${n === 1 ? '' : 's'}</strong> of things for a <strong>${m.have}-day</strong> trip` : `<strong>${m.have} days</strong> to fill`;
}
function renderRibbon() {
  const r = $('#ribbon'); const n = days(); let html = '<div class="track"></div>';
  for (let i = 0; i < n; i++) { const x = (i + .5) / n * 100; const d = dateOf(i); html += `<span class="d ${i === 0 ? 'first' : i === n - 1 ? 'last' : ''}" style="left:${x}%">${i === 0 || i === n - 1 || n <= 10 || i % 2 === 0 ? `${DOW[d.getDay()][0]} ${d.getDate()}` : ''}</span>`; }
  for (const id of state.tray) { const e = D.byId[id]; let di = null, hard = false; if (e.date) { di = dayIndexOf(e.date); hard = true; } else if (state.pegs[id] != null) di = state.pegs[id]; if (di == null || di < 0 || di >= n) continue; const x = (di + .5) / n * 100; html += `<div class="peg ${hard ? 'hard' : 'soft'}" style="left:${x}%" title="${esc(e.name)} · ${fmtD(dateOf(di))}"><div class="pslot" data-slot="${id}" data-shape="pin" data-prio="1" data-role="peg"></div><s></s></div>`; }
  r.innerHTML = html;
}
function pegToRibbon(id, clientX) { const r = $('#ribbon').getBoundingClientRect(); const di = clamp(Math.floor((clientX - r.left) / r.width * days()), 0, days() - 1); state.pegs[id] = di; renderRibbon(); toast(`${D.byId[id].name} pegged to ${fmtD(dateOf(di))}`, { mono: 'soft peg' }); requestLayout(); }
function addToTray(id) {
  if (state.tray.includes(id)) { toggleMust(id); return; }
  state.tray.push(id); renderTray(); renderMeter(); renderRibbon();
  renderMap($('#board-map'), { ...maps['board-map'], pins: state.tray });
  refreshNear(id);
  suggest(id);
}
function refreshNear(id) {
  const sh = $('[data-shelf="near"]'); if (!sh) return; const ids = nearShelf(); sh.classList.toggle('empty', !ids.length);
  const sizes = ['', 'tall', 'wide', '', 'wide', 'tall', '', ''];
  $('.shelf-row', sh).innerHTML = ids.length ? ids.map((x, i) => `<div class="tslot ${sizes[i % sizes.length]}" data-slot="${x}" data-shape="tile" data-prio="1" data-role="gallery"></div>`).join('') : '<span>Add something and this shelf fills with what\'s nearby.</span>';
  requestLayout();
}
const SUGG = { sigiriya: 'pidurangala', 'coconut-hill': 'parrot-rock', 'galle-fort': 'galle-cafe', 'kandy-train': 'nine-arch', 'yala-leopard': 'yala-elephant', perahera: 'guesthouse', minneriya: 'dambulla', 'nine-arch': 'tea-mist', villa: 'king-coconut', pettah: 'garden-dinner', trinco: 'arugam', unawatuna: 'roti' };
function suggest(id) {
  const s = SUGG[id]; const box = $('#sugg'); if (!s || state.tray.includes(s)) { box.hidden = true; return; }
  box.hidden = false; box.innerHTML = `<div class="sslot" data-slot="${s}" data-shape="chip" data-prio="1" data-role="sugg"></div><span>${esc(D.byId[id].name)} added — <b>${esc(D.byId[s].name)}</b> is right there.</span><button class="btn bare sm" type="button">Add</button>`;
  $('button', box).addEventListener('click', () => { addToTray(s); box.hidden = true; });
  requestLayout();
}
function removeFromTray(id) { state.tray = state.tray.filter(x => x !== id); state.must.delete(id); delete state.pegs[id]; renderTray(); renderMeter(); renderRibbon(); refreshNear(); renderMap($('#board-map'), { ...maps['board-map'], pins: state.tray }); toast(`Removed ${D.byId[id].name}`, { action: 'Undo', onAction: () => addToTray(id) }); }
function toggleMust(id) { if (state.must.has(id)) state.must.delete(id); else state.must.add(id); syncCardState(id); toast(state.must.has(id) ? `${D.byId[id].name} is a must-have` : `${D.byId[id].name} back to optional`, { ms: 1600 }); if (state.stage === 'work') renderStats(); }
function reorderTray(id, clientX) { const slots = $$('#tray .tslot').filter(s => s.dataset.slot !== id); let idx = slots.findIndex(s => clientX < s.getBoundingClientRect().left + s.getBoundingClientRect().width / 2); if (idx < 0) idx = slots.length; state.tray = state.tray.filter(x => x !== id); state.tray.splice(idx, 0, id); renderTray(); }
$('#plan-it').addEventListener('click', startQuestions);

// ---------------------------------------------------------------- 3 · QUESTIONS
function buildQuestions() {
  const q = []; const T = state.tray;
  const south = T.some(id => ['galle', 'mirissa', 'hikkaduwa'].includes(D.byId[id].region)); const east = T.some(id => ['trinco', 'arugam'].includes(D.byId[id].region));
  if (T.includes('whales')) q.push(D.questions.whales);
  if (south && east) q.push(D.questions.coasts);
  q.push(D.questions.pace, D.questions.base, D.questions.budget);
  return q.slice(0, 5);
}
function startQuestions() {
  state.questions = buildQuestions(); state.qi = 0; state.answers = {};
  state.stage = 'questions'; $('#app').dataset.stage = 'questions'; $('#v-questions').hidden = false;
  renderQuestion();
}
function renderQuestion() {
  const q = state.questions[state.qi]; const c = $('#qcard');
  if (!q) { finishQuestions(); return; }
  const conflicts = q.map ? [[q.map[0], q.map[1]]] : null;
  renderMap($('#board-map'), { ...maps['board-map'], conflicts, pins: state.tray });
  const prog = state.questions.map((x, i) => `<i class="${i === state.qi ? 'on' : i < state.qi ? 'done' : ''}"></i>`).join('');
  let body = '';
  if (q.kind === 'conflict' || q.kind === 'pick') body = `<div class="qopts">${q.options.map(o => o.img ? `<button class="qopt img" data-k="${o.k}"><div class="ph" style="background-image:url('assets/${o.img}')"></div><div class="tx"><b>${o.label}</b><small>${o.note}</small></div></button>` : `<button class="qopt" data-k="${o.k}"><b>${o.label}</b><small>${o.note}</small></button>`).join('')}</div>`;
  if (q.kind === 'slider') body = `<div class="qslider"><input type="range" min="0" max="100" value="55" id="q-range"><div class="ends"><span>${q.min}</span><span>Balanced</span><span>${q.max}</span></div></div>`;
  c.innerHTML = `<img class="qmini" src="${D.deco.splashOrange}" alt=""><div class="prog">${prog}<span>${state.qi + 1} of ${state.questions.length}</span></div><h2>${q.title}</h2><p>${q.body}</p>${body}
    <div class="qfoot"><button class="btn bare" data-k="__decide">Just decide for me</button>${q.kind === 'slider' ? '<button class="btn ink" data-k="__slider">Next</button>' : '<span class="label">pick one</span>'}</div>`;
  c.onclick = (ev) => { const b = ev.target.closest('[data-k]'); if (!b) return; let k = b.dataset.k; if (k === '__decide') k = q.kind === 'slider' ? 55 : (q.options[0].k); if (k === '__slider') k = +$('#q-range').value; state.answers[q.id] = k; state.qi++; renderQuestion(); };
}
function finishQuestions() { $('#v-questions').hidden = true; generate(); }

// ---------------------------------------------------------------- 4 · GENERATION
function buildOptions() {
  // Start from the three authored options, then honour the answers: whales, coasts, pace.
  const A = state.answers; const opts = JSON.parse(JSON.stringify(D.options));
  const pace = +(A['q-pace'] ?? 55);
  for (const o of opts) {
    if (pace < 35) { for (const d of o.days) if (d.slots.length > 2) d.slots = d.slots.slice(0, 2); }
    if (pace > 75) { for (const d of o.days) if (d.slots.length === 1 && !d.end) { const extra = ['king-coconut', 'curry', 'roti'].find(x => !d.slots.some(s => s.id === x)); d.slots.push({ id: extra, t: '12:30' }); } }
    if (A['q-whales'] === 'keep') { const md = o.days.find(d => d.base === 'mirissa'); if (md) md.slots.unshift({ id: 'whales', t: '06:30' }); }
    // fold tray items the planner can fit: any tray item whose region is a base and which isn't scheduled → drop into the first day at that base with < 3 slots
    for (const id of state.tray) { if (o.days.some(d => d.slots.some(s => s.id === id))) continue; const e = D.byId[id]; if (e.type === 'stay' || e.offSeason) continue; const day = o.days.find(d => d.base === e.region && !d.end && d.slots.length < 3); if (day) day.slots.push({ id, t: e.best === 'dawn' ? '06:30' : e.best === 'dusk' ? '17:30' : e.best === 'night' ? '19:30' : '11:00' }); }
    // trim days to the trip length
    const n = days(); if (o.days.length > n) { o.days = o.days.slice(0, n - 1).concat([o.days[o.days.length - 1]]); } while (o.days.length < n) o.days.splice(o.days.length - 1, 0, { base: o.days[o.days.length - 2].base, slots: [] });
  }
  if (A['q-coasts'] === 'east' || A['q-whales'] === 'swap') opts.unshift(opts.splice(2, 1)[0]);
  if (A['q-base'] === 'bases' && opts[0].id !== 'slow') { const i = opts.findIndex(o => o.id === 'slow'); opts.unshift(opts.splice(i, 1)[0]); }
  return opts;
}
function generate() {
  state.options = buildOptions(); state.optIdx = 0; state.plan = null; state.removed = {}; state.history = []; state.compare = false;
  state.flyFromLast = true;
  goStage('options');
  const gen = $('#gen'); gen.hidden = false;
  const lines = [`Reading ${state.tray.length} pins across ${new Set(state.tray.map(id => D.byId[id].region)).size} regions…`, 'Checking August: Perahera, the Gathering, monsoon on the south-west…', 'Pricing transit between bases…', 'Building three different shapes…'];
  let i = 0; const tick = () => { if (i < lines.length) { $('#gen-txt').innerHTML = `${lines[i]}`; i++; setTimeout(tick, 650); } else { gen.hidden = true; } }; tick();
  $('#chat-log').innerHTML = ''; $('#chat-sub').textContent = 'building options';
  chatSys(`Board · ${state.tray.length} pins · ${state.must.size} must-haves`);
  setTimeout(() => plannerSay(`I read your board. ${state.must.size ? `Must-haves first: ${[...state.must].map(id => D.byId[id].name).join(', ')}.` : ''} Here are three shapes for ${nights()} nights — each one drops something, and says why.`), 900);
  setTimeout(() => { state.flyFromLast = false; $('#chat-sub').textContent = 'three options ready'; plannerSay('Pick a tab to walk through it, or Compare to see them side by side. When one feels right, <b>Go with this one</b> and we\'ll refine it together.'); }, 3800);
}
function optionRoute(o) {
  const segs = []; let prev = null;
  o.days.forEach((d) => { if (prev && d.base !== prev) { const a = D.regions[prev], b = D.regions[d.base]; const mode = d.leg ? d.leg.mode : 'drive'; segs.push({ from: a, to: b, mode, label: d.leg ? `${mode} · ${Math.floor(d.leg.min / 60)}h${d.leg.min % 60 ? (' ' + d.leg.min % 60) : ''}` : '' }); } prev = d.base; });
  return segs;
}
function optionStats(o) {
  let km = 0, mins = 0, beds = 1, prev = null;
  o.days.forEach(d => { if (prev && d.base !== prev) { km += haversine(D.regions[prev], D.regions[d.base]) * 1.35; beds++; mins += d.leg ? d.leg.min : Math.round(haversine(D.regions[prev], D.regions[d.base]) * 1.35 / 40 * 60); } prev = d.base; });
  const sched = new Set(o.days.flatMap(d => d.slots.map(s => s.id)));
  const musts = [...state.must]; const mustIn = musts.filter(id => sched.has(id)).length;
  const bud = state.answers['q-budget']; const cost = bud === 'v' ? '€€€' : bud === 'g' ? '€' : '€€';
  const bookable = [...sched].filter(id => D.byId[id].lead > 0); const booked = bookable.filter(id => state.booked.has(id)).length;
  const free = o.days.filter(d => !d.end && d.slots.length <= 1).length;
  return { km: Math.round(km), hours: Math.round(mins / 60 * 10) / 10, beds, mustIn, musts: musts.length, cost, booked, bookable: bookable.length, free, sched };
}
function currentOption() { return state.mode === 'refine' ? state.plan : state.options[state.optIdx]; }
function planHas(id) { const o = currentOption(); return !!o && o.days.some(d => d.slots.some(s => s.id === id)); }
function leftOut(o) { const s = optionStats(o).sched; return state.tray.filter(id => !s.has(id)).map(id => ({ id, reason: state.removed[id] || (o.reasons && o.reasons[id]) || (D.byId[id].type === 'stay' ? 'stays are set per base' : 'no room on this route') })); }

function renderWork() {
  const o = currentOption(); if (!o) return;
  // tabs
  $('#tabs').innerHTML = state.options.map((x, i) => { const st = optionStats(x); return `<button class="tab" role="tab" aria-selected="${i === state.optIdx}" data-i="${i}" style="--acc:${x.accent}"><span class="th"><i></i>${x.thesis}</span><span class="tr">${x.tag} · ${x.trade}${st.mustIn < st.musts ? ` · <b>${st.musts - st.mustIn} must-have${st.musts - st.mustIn > 1 ? 's' : ''} out</b>` : ''}</span></button>`; }).join('');
  $$('#tabs .tab').forEach(t => t.addEventListener('click', () => { state.optIdx = +t.dataset.i; state.compare = false; $('#compare').textContent = 'Compare'; renderWork(); }));
  $('#chosen-title').textContent = o.thesis; $('#chosen-sub').textContent = `${nights()} nights · ${fmtShort(state.start)} – ${fmtShort(state.end)} · v${state.history.length + 1}`;
  $('#choose').hidden = state.mode !== 'options'; $('#compare').hidden = state.mode !== 'options'; $('#to-export').hidden = state.mode !== 'refine';
  renderDays(); renderStats(); renderVariants();
  renderMap($('#dash-map'), { route: optionRoute(o), bases: [...new Set(o.days.map(d => d.base))], labels: [...new Set(o.days.map(d => d.base))], pins: o.days.flatMap(d => d.slots.map(s => s.id)), pinPrio: 1, animate: true, legend: true, title: o.thesis, subtitle: `${optionStats(o).km} km · ${optionStats(o).beds} beds` });
  renderQuick();
}
function transitSVG(mode) { return `<svg viewBox="0 0 44 20"><path d="M22 0v20" stroke="var(--sk-thread)" stroke-width="2" stroke-dasharray="${MODE_DASH[mode] || ''}" stroke-linecap="round"/></svg>`; }
function renderDays() {
  const c = $('#dash-days'); c.classList.add('clip');
  if (state.compare) { renderCompare(); return; }
  c.classList.remove('compare');
  const o = currentOption(); const prio = 2;
  let html = '';
  o.days.forEach((d, i) => {
    const date = dateOf(i); const r = D.regions[d.base];
    if (d.end) { html += `<div class="day endday" data-day="${i}"><b>Fly home</b>${fmtD(date)}<br>from Colombo</div>`; return; }
    let inner = `<div class="day-h" data-day="${i}"><div><h4>Day ${i + 1}</h4><span class="base">${r.name}</span></div><span class="d">${fmtD(date)}</span></div>`;
    if (d.leg) inner += `<div class="transit">${transitSVG(d.leg.mode)}<span class="m">${d.leg.mode} · ${Math.floor(d.leg.min / 60)}h${d.leg.min % 60 ? ' ' + d.leg.min % 60 : ''}${d.leg.note ? ' · ' + d.leg.note : ''}</span></div>`;
    d.slots.forEach((s, j) => {
      const e = D.byId[s.id]; const w = D.warnings[s.id]; const lockd = state.locked.has(s.id);
      if (j > 0) { const p = D.byId[d.slots[j - 1].id]; const km = haversine(p, e); const mode = km < 1.5 ? 'walk' : 'drive'; inner += `<div class="transit">${transitSVG(mode)}<span class="m">${mode} · ${km < 1.5 ? Math.max(5, Math.round(km * 14)) + ' min' : Math.max(10, Math.round(km * 1.3 / 35 * 60)) + ' min'}</span></div>`; }
      inner += `<div class="slot"><div class="dslot" data-slot="${s.id}" data-shape="chip" data-prio="${prio}" data-role="day"></div><div><div class="t" data-ref="${s.id}">${esc(e.name)}</div><div class="m">${s.t}${e.dur ? ` · ~${e.dur} h` : ''}${e.type === 'stay' ? ' · check in' : ''}</div>${w ? `<span class="flag ${w.level}">${ICON.flag}${esc(w.text)}</span>` : ''}${state.mode === 'refine' ? `<div class="tools"><button data-lock="${s.id}" class="${lockd ? 'on' : ''}" title="${lockd ? 'Unlock' : 'Lock — the planner may not move this'}">${ICON.lock}${lockd ? 'locked' : 'lock'}</button><button data-drop="${s.id}" title="Remove from the plan">${ICON.x}</button></div>` : ''}</div></div>`;
    });
    if (d.slots.length <= 1) inner += `<div class="free">${d.slots.length ? '~5 h free' : 'a free day'} · ${r.name}</div>`;
    inner += `<div class="stay"><i></i>sleep in ${r.name}</div>`;
    html += `<div class="day ${state.changedDay === i ? 'changed' : ''}" data-day="${i}">${inner}</div>`;
  });
  const lo = leftOut(o);
  html += `<div class="leftout"><h4>Left out <span>${lo.length}</span></h4>${lo.length ? lo.map(x => `<div class="lo"><div class="loslot" data-slot="${x.id}" data-shape="chip" data-prio="1" data-role="leftout"></div><div><div class="t">${esc(D.byId[x.id].name)}</div><div class="r">${esc(x.reason)}</div>${state.mode === 'refine' ? `<button data-readd="${x.id}">Put it back in</button>` : `<button data-chipq="${x.id}">Ask why</button>`}</div></div>`).join('') : '<div class="r" style="font-family:var(--sk-font-data);font-size:10px;color:var(--sk-ink-3)">Everything on your board is in.</div>'}</div>`;
  c.innerHTML = html; state.changedDay = null;
  c.onclick = (ev) => {
    const b = ev.target.closest('button,[data-ref],.day-h'); if (!b) return;
    if (b.dataset.lock) toggleLock(b.dataset.lock);
    else if (b.dataset.drop) dropFromPlan(b.dataset.drop, 'you removed it');
    else if (b.dataset.readd) readdToPlan(b.dataset.readd);
    else if (b.dataset.chipq) { addChip({ kind: 'card', id: b.dataset.chipq }); $('#chat-in').value = 'why is this left out?'; $('#chat-in').focus(); }
    else if (b.dataset.ref) addChip({ kind: 'card', id: b.dataset.ref });
    else if (b.classList.contains('day-h')) addChip({ kind: 'day', i: +b.dataset.day });
  };
  requestLayout();
}
function renderCompare() {
  const c = $('#dash-days'); c.classList.add('compare');
  c.innerHTML = state.options.map((o, oi) => { const st = optionStats(o); return `<div class="day" style="width:auto;border-color:${oi === state.optIdx ? 'var(--sk-ink)' : 'var(--sk-line)'}" data-opt="${oi}"><div class="day-h"><div><h4 style="color:${o.accent}">${o.thesis}</h4><span class="base">${o.tag}</span></div><span class="d">${st.km} km · ${st.beds} beds</span></div>${o.days.map((d, i) => d.end ? '' : `<div class="slot" style="grid-template-columns:52px 1fr"><div class="m" style="margin:0">D${i + 1}<br>${D.regions[d.base].name.slice(0, 7)}</div><div style="display:flex;gap:3px;flex-wrap:wrap">${d.slots.map(s => `<div class="dslot" style="width:26px;height:26px;border-radius:6px" data-slot="${s.id}" data-shape="pin" data-prio="${oi === state.optIdx ? 2 : 1}" data-role="compare"></div>`).join('')}</div></div>`).join('')}<button class="btn quiet sm" data-pick="${oi}" style="margin-top:6px">Walk through this one</button></div>`; }).join('');
  c.onclick = (ev) => { const b = ev.target.closest('[data-pick]'); if (b) { state.optIdx = +b.dataset.pick; state.compare = false; $('#compare').textContent = 'Compare'; renderWork(); } };
  requestLayout();
}
$('#compare').addEventListener('click', () => { state.compare = !state.compare; $('#compare').textContent = state.compare ? 'Walk through' : 'Compare'; renderDays(); });
function renderStats() {
  const o = currentOption(); if (!o) return; const st = optionStats(o); const c = $('#dash-stats');
  const prev = c._prev || {};
  const cell = (k, v, unit, cls) => `<div class="stat ${cls || ''}"><div class="v ${prev[k] !== undefined && prev[k] !== v ? 'bump' : ''}">${v}${unit ? `<small>${unit}</small>` : ''}</div><div class="k">${k}</div></div>`;
  c.innerHTML = cell('travelled', st.km, 'km') + cell('in transit', st.hours, 'h', st.hours > 14 ? 'warn' : '') + cell('beds', st.beds, '', st.beds > 6 ? 'warn' : '') + cell('must-haves', `${st.mustIn}<small>/ ${st.musts}</small>`, '', st.mustIn < st.musts ? 'bad' : 'ok') + cell('cost band', st.cost) + cell('free days', st.free) + (state.mode === 'refine' ? cell('booked', `${st.booked}<small>/ ${st.bookable}</small>`, '', st.booked === st.bookable ? 'ok' : '') : '');
  c._prev = { travelled: st.km, 'in transit': st.hours, beds: st.beds };
}
$('#choose').addEventListener('click', () => {
  state.plan = JSON.parse(JSON.stringify(state.options[state.optIdx])); state.history = []; state.compare = false;
  goStage('refine');
  plannerSay(`<b>${state.plan.thesis}</b> it is. Drag things between days, lock what must not move, or just tell me. Every change shows what it costs and has an undo.`);
  $('#chat-sub').textContent = 'refining';
});
$('#to-export').addEventListener('click', () => goStage('export'));

// ---------------------------------------------------------------- refine: edits, locks, undo
function snapshot(msg) { state.history.push({ plan: JSON.parse(JSON.stringify(state.plan)), removed: { ...state.removed }, locked: new Set(state.locked), msg }); }
function undo() { const h = state.history.pop(); if (!h) return; state.plan = h.plan; state.removed = h.removed; state.locked = h.locked; renderWork(); chatSys(`undid · ${h.msg}`); }
function findSlot(id) { for (let i = 0; i < state.plan.days.length; i++) { const j = state.plan.days[i].slots.findIndex(s => s.id === id); if (j >= 0) return { i, j }; } return null; }
function applyChange(msg, delta, fn) {
  const before = optionStats(state.plan); snapshot(msg); fn(); const after = optionStats(state.plan);
  renderWork();
  const d = []; if (after.km !== before.km) d.push(`${after.km - before.km > 0 ? '+' : ''}${after.km - before.km} km`); if (after.hours !== before.hours) d.push(`${after.hours - before.hours > 0 ? '+' : ''}${Math.round((after.hours - before.hours) * 10) / 10} h transit`); if (after.beds !== before.beds) d.push(`${after.beds - before.beds > 0 ? '+' : ''}${after.beds - before.beds} beds`); if (after.mustIn !== before.mustIn) d.push(`must-haves ${after.mustIn}/${after.musts}`);
  plannerSay(msg, { undo: true, delta: (delta || []).concat(d) });
}
function toggleLock(id) { if (state.locked.has(id)) state.locked.delete(id); else state.locked.add(id); syncCardState(id); renderDays(); chatSys(`${state.locked.has(id) ? 'locked' : 'unlocked'} · ${D.byId[id].name}`); }
function dropFromPlan(id, reason) { const p = findSlot(id); if (!p) return; if (state.locked.has(id)) { plannerSay(`${D.byId[id].name} is locked — unlock it first if you want it out.`); return; } state.changedDay = p.i; applyChange(`Dropped ${D.byId[id].name} from day ${p.i + 1}.`, [], () => { state.plan.days[p.i].slots.splice(p.j, 1); state.removed[id] = reason; }); }
function readdToPlan(id) {
  const e = D.byId[id]; if (e.offSeason) { plannerSay(`${e.name} is off-season in August — I can put it in, but expect the boats to stay in port. Say "add it anyway" if you want it.`); return; }
  let best = -1, bestScore = -1e9;
  state.plan.days.forEach((d, i) => { if (d.end) return; let s = -d.slots.length * 2; if (d.base === e.region) s += 10; else s -= haversine(D.regions[d.base], e) / 20; if (s > bestScore) { bestScore = s; best = i; } });
  state.changedDay = best; applyChange(`Put ${e.name} back in on day ${best + 1} (${D.regions[state.plan.days[best].base].name}).`, [], () => { delete state.removed[id]; state.plan.days[best].slots.push({ id, t: e.best === 'dawn' ? '06:30' : e.best === 'dusk' ? '17:30' : e.best === 'night' ? '19:30' : '11:00' }); sortDay(best); });
}
function sortDay(i) { state.plan.days[i].slots.sort((a, b) => a.t.localeCompare(b.t)); }
function moveToDay(id, di, clientY, dayEl) {
  if (state.mode !== 'refine') { plannerSay('Choose an option first, then you can move things around.'); return; }
  if (state.locked.has(id)) { plannerSay(`${D.byId[id].name} is locked.`); return; }
  const p = findSlot(id); const e = D.byId[id];
  const tIdx = $$('.slot', dayEl).findIndex(s => clientY < s.getBoundingClientRect().top + s.getBoundingClientRect().height / 2);
  const t = e.best === 'dawn' ? '06:30' : e.best === 'dusk' ? '17:30' : e.best === 'night' ? '19:30' : tIdx === 0 ? '09:00' : '14:00';
  state.changedDay = di;
  applyChange(p ? `Moved ${e.name} to day ${di + 1}.` : `Added ${e.name} to day ${di + 1}.`, [], () => { if (p) state.plan.days[p.i].slots.splice(p.j, 1); delete state.removed[id]; state.plan.days[di].slots.push({ id, t }); sortDay(di); });
}
// variants drawer (remix by the day)
function renderVariants() {
  const c = $('#variants'); if (state.mode !== 'refine') { c.innerHTML = ''; return; }
  const others = state.options.filter(o => o.id !== state.plan.id);
  c.innerHTML = `<div class="vh">Remix · days from the other options</div>` + others.flatMap(o => o.days.filter((d, i) => !d.end && d.slots.length).map((d, i) => { const idx = o.days.indexOf(d); return `<div class="vday" data-o="${o.id}" data-i="${idx}" style="border-left:3px solid ${o.accent}"><div class="vslots">${d.slots.slice(0, 3).map(s => `<div class="vslot" data-slot="${s.id}" data-shape="pin" data-prio="0" data-role="variant"></div>`).join('')}</div><div class="vt"><b>${D.regions[d.base].name} · day ${idx + 1}</b><span>${o.thesis}</span></div><button data-use="1">Use as day ${idx + 1}</button></div>`; })).join('');
  $$('.vday', c).forEach(v => {
    const o = state.options.find(x => x.id === v.dataset.o); const d = o.days[+v.dataset.i]; const idx = +v.dataset.i;
    let priceEl = null;
    v.addEventListener('pointerenter', () => { if (!state.plan.days[idx] || state.plan.days[idx].end) return; const trial = JSON.parse(JSON.stringify(state.plan)); trial.days[idx] = JSON.parse(JSON.stringify(d)); const a = optionStats(state.plan), b = optionStats(trial); const dk = b.km - a.km, dh = Math.round((b.hours - a.hours) * 10) / 10, db = b.beds - a.beds; const out = state.plan.days[idx].slots.filter(s => !d.slots.some(x => x.id === s.id)).map(s => D.byId[s.id].name); priceEl = document.createElement('div'); priceEl.className = 'price'; priceEl.textContent = `${dk >= 0 ? '+' : ''}${dk} km · ${dh >= 0 ? '+' : ''}${dh} h · ${db >= 0 ? '+' : ''}${db} beds${out.length ? ' · drops ' + out.slice(0, 2).join(', ') : ''}`; document.body.append(priceEl); const r = v.getBoundingClientRect(); priceEl.style.left = r.left + 'px'; priceEl.style.top = (r.top - 34) + 'px'; v.classList.add('pricing'); const day = $(`.day[data-day="${idx}"]`); day && day.classList.add('over'); renderMap($('#dash-map'), { ...maps['dash-map'], route: optionRoute(state.plan).concat(optionRoute(trial).map(s => ({ ...s, proposed: true }))), animate: false }); });
    v.addEventListener('pointerleave', () => { priceEl && priceEl.remove(); v.classList.remove('pricing'); $$('.day.over').forEach(x => x.classList.remove('over')); renderMap($('#dash-map'), { ...maps['dash-map'], route: optionRoute(state.plan), animate: false }); });
    $('button', v).addEventListener('click', () => { if (!state.plan.days[idx] || state.plan.days[idx].end) return; const lockedOut = state.plan.days[idx].slots.filter(s => state.locked.has(s.id) && !d.slots.some(x => x.id === s.id)); if (lockedOut.length) { plannerSay(`Day ${idx + 1} has ${lockedOut.map(s => D.byId[s.id].name).join(', ')} locked. Unlock first, or I keep the day as it is.`); return; } state.changedDay = idx; applyChange(`Used ${o.thesis}'s day ${idx + 1} (${D.regions[d.base].name}).`, [], () => { state.plan.days[idx] = JSON.parse(JSON.stringify(d)); }); });
  });
}

// ---------------------------------------------------------------- CHAT
function chatSys(t) { const m = document.createElement('div'); m.className = 'msg sys'; m.textContent = t; $('#chat-log').append(m); scrollChat(); }
function plannerSay(html, opts = {}) {
  const log = $('#chat-log'); const typing = document.createElement('div'); typing.className = 'msg planner typing'; typing.innerHTML = '<i></i><i></i><i></i>'; log.append(typing); scrollChat();
  setTimeout(() => { typing.className = 'msg planner'; typing.innerHTML = html + (opts.undo ? `<button class="undo" type="button">Undo</button>` : '') + (opts.delta && opts.delta.length ? `<div class="delta">${opts.delta.map(d => `<span>${esc(d)}</span>`).join('')}</div>` : '') + (opts.qa ? `<div class="qa">${opts.qa.map(q => `<button type="button">${esc(q)}</button>`).join('')}</div>` : ''); if (opts.undo) $('.undo', typing).addEventListener('click', () => { undo(); typing.querySelector('.undo').remove(); }); if (opts.qa) $$('.qa button', typing).forEach(b => b.addEventListener('click', () => userSays(b.textContent))); scrollChat(); }, opts.instant ? 0 : 420);
}
function scrollChat() { const l = $('#chat-log'); l.scrollTop = l.scrollHeight; }
function addChip(c) { if (state.chips.some(x => x.kind === c.kind && x.id === c.id && x.i === c.i)) return; state.chips.push(c); renderChips(); $('#chat-in').focus(); }
function chipHTML(c) { if (c.kind === 'card') { const e = D.byId[c.id]; return `<span class="refchip"><img src="${e.src}" alt="">${esc(e.name)}</span>`; } return `<span class="refchip"><span class="rslot" style="background:var(--sk-thread);display:inline-block"></span>Day ${c.i + 1} · ${D.regions[currentOption().days[c.i].base].name}</span>`; }
function renderChips() { $('#chips').innerHTML = state.chips.map((c, i) => chipHTML(c).replace('</span>', `<button type="button" data-rm="${i}" aria-label="Remove">×</button></span>`)).join(''); $$('#chips [data-rm]').forEach(b => b.addEventListener('click', () => { state.chips.splice(+b.dataset.rm, 1); renderChips(); })); }
function renderQuick() { const q = $('#quick'); q.innerHTML = (state.mode === 'refine' ? ['Less driving', 'One more beach day', 'Lock the Perahera', 'What needs booking?', 'Is Yala worth it in August?'] : ['Why is whale watching out?', 'Which option has the least driving?', 'What\'s the weather in August?']).map(t => `<button type="button">${t}</button>`).join(''); $$('button', q).forEach(b => b.addEventListener('click', () => userSays(b.textContent))); }
$('#chat-send').addEventListener('click', () => userSays($('#chat-in').value)); $('#chat-in').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') userSays($('#chat-in').value); });
function userSays(text) {
  text = (text || '').trim(); if (!text && !state.chips.length) return;
  const m = document.createElement('div'); m.className = 'msg user'; m.innerHTML = state.chips.map(chipHTML).join(' ') + ' ' + esc(text); $('#chat-log').append(m); scrollChat();
  const chips = state.chips.slice(); state.chips = []; renderChips(); $('#chat-in').value = '';
  setTimeout(() => brain(text, chips), 200);
}
function findEntity(text, chips) {
  const c = chips.find(x => x.kind === 'card'); if (c) return D.byId[c.id];
  const t = text.toLowerCase(); let best = null, bestN = 0;
  for (const e of D.entities) { const words = e.name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3); const n = words.filter(w => t.includes(w)).length; if (n > bestN) { bestN = n; best = e; } }
  if (bestN) return best;
  for (const k in D.regions) if (t.includes(D.regions[k].name.toLowerCase())) { const o = currentOption(); const d = o && o.days.find(d => d.base === k && d.slots.length); if (d) return D.byId[d.slots[0].id]; }
  return null;
}
function brain(text, chips) {
  const t = text.toLowerCase(); const refine = state.mode === 'refine'; const dayChip = chips.find(x => x.kind === 'day'); const e = findEntity(text, chips);
  const dayMatch = t.match(/day\s*(\d+)/); const targetDay = dayChip ? dayChip.i : dayMatch ? +dayMatch[1] - 1 : null;
  // FAQ first
  if (/whale/.test(t)) return plannerSay('Blue whales are off Mirissa from November to April, when the sea is flat. In August the south-west monsoon makes it rough and most operators don\'t sail. If whales matter, Trincomalee on the east coast has sightings in season — or come back in February.', { qa: refine ? ['Swap in Trincomalee', 'Fine, drop it'] : undefined });
  if (/perahera/.test(t) && !/lock|move|drop/.test(t)) return plannerSay('The Esala Perahera runs ten nights around the Temple of the Tooth; the Randoli nights (15–19 Aug 2024) are the biggest, and the final night is the one people fly in for. Pavement spots are free but you\'ll stand from 5pm; grandstand seats are sold by hotels and go weeks ahead.', { qa: refine ? ['Lock the Perahera'] : undefined });
  if (/train|ticket/.test(t) && !/move|drop/.test(t)) return plannerSay('The Kandy → Ella train is the ride everyone means. Reserved seats (1st and 2nd class) open exactly 30 days out on the railway site and sell out within the hour; unreserved 2nd/3rd class always exists — you may stand, you\'ll be fine. Sit on the right heading to Ella.');
  if (/weather|monsoon|rain|august/.test(t)) return plannerSay('August is south-west monsoon: the west and south coasts get afternoon showers and rougher sea, the hills are cool and mostly dry, and the east coast — Trincomalee, Arugam Bay — is at its best. The cultural triangle is hot and dry; that\'s why Sigiriya is a 7am climb.');
  if (/yala|leopard|worth/.test(t) && !/move|drop|lock/.test(t)) return plannerSay('Yes — August is dry season, water is scarce, and animals come to the tanks. Block 1 usually closes for September, so mid-August is close to the last good window. Go at gate-open; the afternoon drive is emptier.');
  if (/book|booking|reserve/.test(t)) { const o = currentOption(); const b = [...optionStats(o).sched].filter(id => D.byId[id].lead > 0).sort((a, z) => D.byId[z].lead - D.byId[a].lead); return plannerSay(`Things that sell out, most urgent first: ${b.map(id => `<b>${D.byId[id].name}</b> (${D.byId[id].lead} days ahead)`).join(', ')}. The export page has the checklist with links.`); }
  if (/least driving|less driving|fewer beds|too much transit/.test(t)) { if (!refine) { const best = state.options.map((o, i) => ({ i, h: optionStats(o).hours })).sort((a, b) => a.h - b.h)[0]; return plannerSay(`<b>${state.options[best.i].thesis}</b> has the least transit at ${best.h} h. ${state.options[state.optIdx].thesis} is ${optionStats(state.options[state.optIdx]).hours} h.`, { qa: [`Show ${state.options[best.i].thesis}`] }); } const o = state.plan; const yi = o.days.findIndex(d => d.base === 'yala'); if (yi > 0 && !o.days.slice(yi).some(d => d.base === 'yala' && d.slots.some(s => state.locked.has(s.id)))) { return plannerSay('The biggest saving is the Yala night: skip the bed there, do Udawalawe as a stop on the way to the coast instead. That cuts a bed and about 2 hours, and you lose the dawn leopard drive.', { qa: ['Do that', 'Keep Yala'] }); } return plannerSay('The route is already fairly tight — the long legs are Kandy → Ella by train (which you want) and the coast → Colombo. I can merge the two Galle days into Mirissa to drop a bed.', { qa: ['Merge Galle into Mirissa'] }); }
  if (/^show /.test(t)) { const i = state.options.findIndex(o => t.includes(o.thesis.toLowerCase())); if (i >= 0) { state.optIdx = i; renderWork(); return plannerSay(`Showing <b>${state.options[i].thesis}</b>.`, { instant: true }); } }
  if (/^do that|skip yala|udawalawe instead/.test(t) && refine) { const yi = state.plan.days.findIndex(d => d.base === 'yala'); if (yi >= 0) { state.changedDay = yi; return applyChange('Dropped the Yala night; Udawalawe on the way to the coast instead.', [], () => { const prevBase = state.plan.days[yi - 1].base; state.plan.days[yi] = { base: prevBase, slots: [{ id: 'tea-mist', t: '09:00' }] }; const next = state.plan.days[yi + 1]; if (next) { next.leg = { mode: 'drive', min: 240 }; next.slots = next.slots.filter(s => s.id !== 'yala-leopard'); next.slots.unshift({ id: 'udawalawe', t: '09:30' }); } state.removed['yala-leopard'] = 'you traded it for one fewer bed'; state.removed['yala-elephant'] = 'you traded it for one fewer bed'; }); } }
  if (/merge galle/.test(t) && refine) { const gi = state.plan.days.findIndex(d => d.base === 'galle'); if (gi >= 0) { state.changedDay = gi; return applyChange('Merged Galle into the Mirissa stay — day trips instead of a second bed.', [], () => { state.plan.days.forEach(d => { if (d.base === 'galle') { d.base = 'mirissa'; if (d.leg) d.leg = null; } }); }); } }
  if (/beach|slow/.test(t) && refine) { const cand = ['unawatuna', 'cove', 'parrot-rock', 'slow-beach', 'hikkaduwa'].find(id => !planHas(id)); if (!cand) return plannerSay('You already have every beach on the board in. Want me to find another?'); return readdToPlan(cand); }
  if (/why.*(left|out|drop)/.test(t) && e) { const o = currentOption(); const r = leftOut(o).find(x => x.id === e.id); return plannerSay(r ? `${e.name}: ${r.reason}.` : `${e.name} is in — day ${findSlotIn(o, e.id) + 1}.`, { qa: refine && r ? ['Put it back in'] : undefined }); }
  if (/put it back|add it anyway|add it back/.test(t) && refine) { const lo = leftOut(state.plan); const id = e ? e.id : lo[0] && lo[0].id; if (!id) return plannerSay('Nothing is left out.'); if (/anyway/.test(t)) { D.byId[id].offSeason = false; } return readdToPlan(id); }
  if (/swap.*trinco|trincomalee/.test(t) && refine) { return plannerSay('Swapping coasts is a bigger rebuild than a chat edit — pick <b>East, in Season</b> from the remix strip below, day by day, and I\'ll price each one.'); }
  if (!refine && /(lock|move|drop|remove|swap|add)/.test(t)) return plannerSay('Pick an option first (<b>Go with this one</b>) and I can move, lock, drop and add things.');
  if (refine && e) {
    if (/lock/.test(t)) { if (!planHas(e.id)) return plannerSay(`${e.name} isn\'t in the plan yet.`); if (!state.locked.has(e.id)) toggleLock(e.id); return plannerSay(`Locked ${e.name}. I won\'t move it.`, { instant: true }); }
    if (/unlock/.test(t)) { if (state.locked.has(e.id)) toggleLock(e.id); return plannerSay(`Unlocked ${e.name}.`, { instant: true }); }
    if (/drop|remove|cut|skip/.test(t)) { if (!planHas(e.id)) return plannerSay(`${e.name} isn\'t in the plan.`); return dropFromPlan(e.id, 'you asked to drop it'); }
    if (/add|put|include/.test(t) && !planHas(e.id)) { if (targetDay != null) return moveToDay(e.id, targetDay, 0, $(`.day[data-day="${targetDay}"]`)); return readdToPlan(e.id); }
    if (/earlier|later|move|to day|morning|evening/.test(t)) {
      const p = findSlot(e.id); if (!p) return readdToPlan(e.id);
      if (state.locked.has(e.id)) return plannerSay(`${e.name} is locked — unlock it first.`);
      if (targetDay != null && targetDay !== p.i) return moveToDay(e.id, targetDay, 0, $(`.day[data-day="${targetDay}"]`));
      if (/earlier|morning/.test(t)) { state.changedDay = p.i; return applyChange(`Moved ${e.name} to the morning of day ${p.i + 1}.`, [], () => { state.plan.days[p.i].slots[p.j].t = '08:00'; sortDay(p.i); }); }
      if (/later|evening/.test(t)) { state.changedDay = p.i; return applyChange(`Moved ${e.name} to the evening of day ${p.i + 1}.`, [], () => { state.plan.days[p.i].slots[p.j].t = '17:30'; sortDay(p.i); }); }
      const ni = Math.min(state.plan.days.length - 2, p.i + 1); return moveToDay(e.id, ni, 0, $(`.day[data-day="${ni}"]`));
    }
    return plannerSay(`${e.name}: ${e.blurb}`, { qa: planHas(e.id) ? [`Lock ${e.name}`, `Drop ${e.name}`] : [`Add ${e.name}`] });
  }
  if (refine && targetDay != null && !e) { const d = state.plan.days[targetDay]; if (d) return plannerSay(`Day ${targetDay + 1} is ${D.regions[d.base].name}: ${d.slots.map(s => D.byId[s.id].name).join(', ') || 'free'}. Tell me what to move, add or drop.`); }
  plannerSay('I can move, lock, drop, swap or add things — click any card or day header to reference it precisely — or ask about the trip: the Perahera, the train, the weather, what needs booking.', { qa: refine ? ['What needs booking?', 'Less driving'] : ['What\'s the weather in August?'] });
}
function findSlotIn(o, id) { return o.days.findIndex(d => d.slots.some(s => s.id === id)); }

// ---------------------------------------------------------------- 5 · EXPORT
function renderExport() {
  const o = currentOption() || state.options[0]; if (!o) return; const st = optionStats(o);
  const bookable = [...st.sched].filter(id => D.byId[id].lead > 0).sort((a, b) => D.byId[b].lead - D.byId[a].lead);
  const c = $('#exp');
  c.innerHTML = `<div class="exp-h"><div><h2>Out of the app, into the trip.</h2><p>A print page, a live link for the people you're going with, and the short list of things that sell out.</p></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn quiet" id="back-refine">← Back to refine</button><button class="btn ink" id="print-btn">Print / PDF</button><button class="btn primary" id="cal-btn">Add to calendar</button></div></div>
    <div class="exp-grid">
      <div class="paper" id="paper"><img class="brush" src="${D.deco.brush}" alt=""><div class="kick">Wander · ${o.thesis}</div><h3>Sri Lanka,<br>${MON[new Date(state.start).getMonth()]} ${new Date(state.start).getFullYear()}</h3><div class="sub">${fmtD(dateOf(0))} → ${fmtD(dateOf(days() - 1))} · ${nights()} nights · ${state.party} · ${st.km} km · ${st.beds} beds</div>
        <div class="pmap map" id="exp-map"></div>
        <div>${o.days.map((d, i) => d.end ? `<div class="pday"><div class="n">${i + 1}<small>${fmtD(dateOf(i))}</small></div><div class="items"><span class="pi">Fly home from Colombo</span></div></div>` : `<div class="pday"><div class="n">${i + 1}<small>${fmtD(dateOf(i))}<br>${D.regions[d.base].name}</small></div><div class="items">${d.leg ? `<span class="pi">${d.leg.mode} ${Math.floor(d.leg.min / 60)}h${d.leg.min % 60 ? d.leg.min % 60 : ''}</span>` : ''}${d.slots.map(s => `<span class="pi ${state.must.has(s.id) ? 'must' : ''}"><img src="${D.byId[s.id].src}" alt="">${s.t} ${esc(D.byId[s.id].name)}</span>`).join('')}</div></div>`).join('')}</div>
      </div>
      <div class="side">
        <div class="box"><h4>Booking readiness <span id="ready-txt">${st.booked} of ${bookable.length}</span></h4><div class="ready"><i id="ready-bar" style="width:${bookable.length ? st.booked / bookable.length * 100 : 0}%"></i></div>
          ${bookable.map(id => { const e = D.byId[id]; const hot = e.lead >= 30; return `<div class="book"><img src="${e.src}" alt=""><div><div>${esc(e.name)}</div><div class="w ${hot ? 'hot' : ''}">${e.lead >= 30 ? 'sells out · ' : ''}book ${e.lead} days ahead${e.date ? ' · ' + e.dateLabel : ''}</div></div><button data-book="${id}" class="${state.booked.has(id) ? 'done' : ''}">${state.booked.has(id) ? 'booked' : 'mark booked'}</button></div>`; }).join('')}</div>
        <div class="box"><h4>Share <span>live link</span></h4><div class="share"><input value="wander.app/t/sri-lanka-aug-24" readonly><button class="btn quiet sm" id="copy-link">Copy</button></div><p style="font-size:var(--sk-t-2);color:var(--sk-ink-2)">Anyone with the link sees the plan as it changes, can heart days and leave comments. Comments show up here as suggestions.</p></div>
        <div class="box"><h4>Offline day view <span>phone</span></h4><p style="font-size:var(--sk-t-2);color:var(--sk-ink-2)">One day at a time, next transit always on screen, works without signal in the hills. Sends to your phone when you save.</p><button class="btn quiet sm" id="phone-btn">Send to my phone</button></div>
      </div>
    </div>`;
  renderMap($('#exp-map'), { route: optionRoute(o), bases: [...new Set(o.days.map(d => d.base))], labels: [...new Set(o.days.map(d => d.base))], pins: [], legend: true, stickers: true });
  $('#back-refine').addEventListener('click', () => goStage(state.mode === 'refine' ? 'refine' : 'options'));
  $('#print-btn').addEventListener('click', () => { $('#print').innerHTML = `<div style="font-family:Georgia,serif;padding:24px">${$('#paper').innerHTML.replace(/<img class="brush"[^>]*>/, '')}</div>`; window.print(); });
  $('#cal-btn').addEventListener('click', () => toast(`${o.days.reduce((a, d) => a + d.slots.length, 0)} events ready for your calendar`, { mono: 'ics · prototype' }));
  $('#copy-link').addEventListener('click', () => toast('Link copied', { ms: 1400 }));
  $('#phone-btn').addEventListener('click', () => toast('Sent — open Wander on your phone', { ms: 2000 }));
  $$('[data-book]', c).forEach(b => b.addEventListener('click', () => { const id = b.dataset.book; if (state.booked.has(id)) state.booked.delete(id); else { state.booked.add(id); state.locked.add(id); } syncCardState(id); renderExport(); }));
  requestLayout('instant');
}

// ---------------------------------------------------------------- init
function init() {
  D.entities.forEach(e => ensureCard(e.id));
  goStage('globe');
}
init();
})();
