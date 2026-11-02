(() => {
const ADVENT_YEAR = 2026;
const COPIES = 3;
const N = CONCEPTS.length;
const LOOP = N * COPIES;
const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SHEET_EASE = 'cubic-bezier(.76,0,.18,1)';
const TILT_Z = -4.5;
const BLOBS = [0, 120, 220, 300, 360, 420, 180];
const CREAM = '#EFE6D2';
const ART = { y: 430, h: 350 }; // zone d'illustration de la jaquette : 406 × 350 (≈ 7:6)
const INK = '#141414';
const SERIF = 'Newsreader, Georgia, serif';
const SANS = 'Inter Tight, system-ui, sans-serif';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (q, el = document) => el.querySelector(q);
const mod = (a, n) => ((a % n) + n) % n;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (x) => x * x * (3 - 2 * x);
const relative = (v, s) => mod(v - s + LOOP / 2, LOOP) - LOOP / 2;
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/* Calendrier */
// ?day=N simule le N décembre, pour tester sans attendre.
const dayParam = new URLSearchParams(location.search).get('day');
const unlocked = (() => {
  if (dayParam !== null) return clamp(parseInt(dayParam, 10) || 0, 0, N);
  const now = new Date();
  if (now < new Date(ADVENT_YEAR, 11, 1)) return 0;
  if (now >= new Date(ADVENT_YEAR, 11, N + 1)) return N;
  return now.getDate();
})();
const isLocked = (i) => i >= unlocked;
function daysLeft(i) {
  if (dayParam !== null) return i + 1 - unlocked;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(ADVENT_YEAR, 11, i + 1) - today) / 864e5);
}
const inDays = (n) => (n <= 1 ? 'demain' : `dans ${n} jours`);

/* Couvertures et tranches, dessinées en SVG inline pour profiter des webfonts de la page */
function wrapTitle(title, max) {
  const lines = [];
  let line = '';
  for (const w of title.split(' ')) {
    const next = line ? line + ' ' + w : w;
    if (line && next.length > max) { lines.push(line); line = w; } else line = next;
  }
  lines.push(line);
  return lines;
}
// Resserre le texte s'il déborde, comme une typo condensée de jaquette.
const fit = (text, size, ratio, max) => (text.length * size * ratio > max ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '');

function coverArt(c, i, sealed) {
  const { bg, label } = CATEGORIES[c.cat];
  let out = `<rect width="474" height="900" fill="${CREAM}"/>`;
  const lines = wrapTitle(c.title.toUpperCase(), 10);
  const fs = lines.length <= 2 ? 78 : lines.length === 3 ? 64 : 54;
  out += `<rect x="16" y="16" width="442" height="868" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width="2"/>`;
  out += `<text x="237" y="66" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="3.5" fill="${INK}">ADVENT OF SYSTEM DESIGN</text>`;
  out += `<line x1="150" y1="84" x2="324" y2="84" stroke="${INK}" stroke-width="1.5"/>`;
  let y = 120 + fs * 0.82;
  for (const l of lines) {
    out += `<text x="237" y="${y}" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="${fs}" letter-spacing="-1" fill="${bg}"${fit(l, fs, 0.64, 420)}>${esc(l)}</text>`;
    y += fs * 0.94;
  }
  const en = c.en.toUpperCase();
  out += `<text x="237" y="${y + 10}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${INK}"${fit(en, 13, 0.78, 400)}>${esc(en)}</text>`;

  // Seule la zone d'illustration vient de l'image générée : le texte reste en SVG, les IA
  // d'image écrivent mal (surtout les accents).
  if (c.cover) {
    out += `<image href="${esc(c.cover)}" x="34" y="${ART.y}" width="406" height="${ART.h}" preserveAspectRatio="xMidYMid meet"/>`;
  } else {
    const cy = 612, r = 148;
    out += `<circle cx="237" cy="${cy}" r="${r}" fill="${bg}"/>`;
    for (let dy = 78; dy < r; dy += 16) {
      const hw = Math.sqrt(r * r - dy * dy);
      out += `<rect x="${237 - hw}" y="${cy + dy}" width="${hw * 2}" height="6" fill="${CREAM}"/>`;
    }
    out += `<text x="237" y="${cy - 8}" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="168" letter-spacing="-4" fill="${CREAM}">${pad(i + 1)}</text>`;
  }
  out += `<line x1="34" y1="790" x2="440" y2="790" stroke="${bg}" stroke-width="2"/>`;
  out += `<text x="34" y="846" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${INK}">JOUR ${pad(i + 1)} · ${esc(label.toUpperCase())}</text>`;
  out += `<rect x="372" y="818" width="70" height="38" fill="none" stroke="${INK}" stroke-width="2"/>`;
  out += `<text x="407" y="846" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="24" fill="${INK}">VHS</text>`;
  if (sealed) {
    out += `<g transform="rotate(-12 360 470)">`
      + `<circle cx="360" cy="470" r="64" fill="${INK}"/>`
      + `<circle cx="360" cy="470" r="56" fill="none" stroke="${CREAM}" stroke-width="1.5" stroke-dasharray="3 4"/>`
      + `<text x="360" y="456" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="12" letter-spacing="2" fill="${CREAM}">S’OUVRE LE</text>`
      + `<text x="360" y="494" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="34" fill="${CREAM}">${i + 1} déc.</text>`
      + `</g>`;
  }
  return out;
}

function spineArt(c, i, sealed) {
  const { bg, fg } = CATEGORIES[c.cat];
  let out = `<rect width="142" height="840" fill="${bg}"/>`;
  out += `<rect x="7" y="7" width="128" height="826" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="1.5"/>`;
  if (c.cover) {
    out += `<image href="${esc(c.cover)}" x="16" y="22" width="110" height="116" preserveAspectRatio="xMidYMid slice"/>`;
  } else {
    out += `<circle cx="71" cy="80" r="46" fill="${fg}"/>`;
    out += `<text x="71" y="82" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="50" letter-spacing="-1" fill="${bg}">${pad(i + 1)}</text>`;
  }
  const t = c.title.toUpperCase();
  out += `<text transform="translate(71 162) rotate(90)" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="60" letter-spacing="-.5" fill="${fg}"${fit(t, 60, 0.62, 530)}>${esc(t)}</text>`;
  out += `<text x="71" y="738" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2.5" fill="${fg}">JOUR ${pad(i + 1)}</text>`;
  out += `<rect x="26" y="758" width="90" height="40" fill="none" stroke="${fg}" stroke-width="2"/>`;
  out += `<text x="71" y="787" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="26" fill="${fg}">VHS</text>`;
  if (sealed) {
    out += `<g transform="rotate(-8 71 620)"><rect x="-12" y="600" width="166" height="40" fill="${CREAM}"/>`
      + `<text x="71" y="626" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="15" letter-spacing="2" fill="${INK}">${pad(i + 1)} DÉC</text></g>`;
  }
  return out;
}

const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;

/* Étagère */
const stage = $('.stage');
const shelf = $('.shelf');
const tapes = [];
for (let v = 0; v < LOOP; v++) {
  const i = v % N;
  const c = CONCEPTS[i];
  const el = document.createElement('div');
  el.className = 'tape' + (isLocked(i) ? ' locked' : '');
  const sp = document.createElement('div');
  sp.className = 'sp';
  sp.innerHTML = svg(142, 840, spineArt(c, i, isLocked(i)));
  const cv = document.createElement('div');
  cv.className = 'cv';
  cv.innerHTML = svg(474, 900, coverArt(c, i, isLocked(i)));
  el.append(sp, cv);
  stage.append(el);
  const t = { v, el, sp, cv, lift: 0, visible: true };
  el.addEventListener('pointerenter', () => { hover = v; });
  el.addEventListener('pointerleave', () => { if (hover === v) hover = -1; });
  el.addEventListener('click', () => onTapeClick(t));
  tapes.push(t);
}

let H = 0, ws = 0, d = 0, gap = 0;
function measure() {
  H = $('#probe').getBoundingClientRect().height;
  ws = H * 142 / 840;
  d = H * 474 / 900;
  gap = H * 0.03;
  stage.style.setProperty('--ws', ws + 'px');
  stage.style.setProperty('--d', d + 'px');
}
measure();
addEventListener('resize', () => { measure(); placeIndicator(); });

const start = (unlocked > 0 ? unlocked - 1 : 0) + N;
let s = start, T = start;
let hover = -1;
let active = -1;
let mx = innerWidth / 2, my = -1e4, cx = mx, cy = my;
let tiltX = 0, tiltY = 0;
let onCover = false;
let isOpen = false;
let dragging = false;
let overEl = null;
let shakeAt = -1e9;

function F(r) {
  const B = Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5;
  return r * (ws + gap) + (d - ws + 1.6 * gap) * B;
}

/* En-tête */
$('.top .month').textContent = `Décembre ${ADVENT_YEAR}`;
$('.top .progress').textContent = `${pad(unlocked)} / ${N} ouvertes`;

/* Légende */
const capTitle = $('.cap-title'), capSub = $('.cap-sub'), capDay = $('.cap-day');
function swapLine(mask, text, dir, instant) {
  if (instant || reduce) {
    mask.replaceChildren(Object.assign(document.createElement('span'), { textContent: text }));
    return;
  }
  const old = [...mask.children].filter((el) => !el._leaving);
  const next = Object.assign(document.createElement('span'), { textContent: text });
  mask.append(next);
  next.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }], { duration: 650, easing: EASE, fill: 'both' });
  for (const o of old) {
    o._leaving = true;
    const from = getComputedStyle(o).transform;
    o.animate([{ transform: from === 'none' ? 'translateY(0)' : from }, { transform: `translateY(${-dir * 105}%)` }], { duration: 650, easing: EASE, fill: 'both' })
      .onfinish = () => o.remove();
  }
}

function dayLine(i) {
  const base = `Jour ${pad(i + 1)} · ${i + 1} décembre`;
  return isLocked(i) ? `${base} · s’ouvre ${inDays(daysLeft(i))}` : base;
}

/* Onglets de thème */
const tabs = $('.tabs');
for (const [key, { label }] of Object.entries(CATEGORIES)) {
  const b = document.createElement('button');
  b.className = 'lbl';
  b.dataset.cat = key;
  b.textContent = label;
  tabs.append(b);
}
const tabBtns = [...tabs.querySelectorAll('button')];
const ind = $('.tabs .ind');
function placeIndicator() {
  if (active < 0) return;
  const btn = tabBtns.find((b) => b.dataset.cat === CONCEPTS[active].cat);
  tabBtns.forEach((b) => b.classList.toggle('on', b === btn));
  ind.style.width = btn.offsetWidth + 'px';
  ind.style.transform = `translateX(${btn.offsetLeft}px)`;
  if (tabs.scrollWidth > tabs.clientWidth) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
}

function setActive(i, dir, instant) {
  active = i;
  const c = CONCEPTS[i];
  swapLine(capTitle, c.title, dir, instant);
  swapLine(capSub, c.en, dir, instant);
  swapLine(capDay, dayLine(i), dir, instant);
  placeIndicator();
}

function goBy(delta) {
  if (isOpen) return;
  T = Math.round(T) + delta;
}
const shortest = (i) => mod(i - mod(Math.round(T), N) + N / 2, N) - N / 2;

tabBtns.forEach((b) => b.addEventListener('click', () => {
  const cat = b.dataset.cat;
  if (cat === 'today') { goBy(shortest(Math.max(0, unlocked - 1))); return; }
  // Le concept du thème le plus proche sur l'étagère, dans un sens ou dans l'autre.
  let best = null;
  CONCEPTS.forEach((c, i) => {
    if (c.cat !== cat) return;
    const delta = shortest(i);
    if (best === null || Math.abs(delta) < Math.abs(best) || (Math.abs(delta) === Math.abs(best) && delta > best)) best = delta;
  });
  if (best !== null) goBy(best);
}));
$('.arrow.prev').addEventListener('click', () => goBy(-1));
$('.arrow.next').addEventListener('click', () => goBy(1));
$('.play').addEventListener('click', () => tryOpen());

function tryOpen() {
  if (isOpen) return;
  if (isLocked(mod(Math.round(T), N))) { shakeAt = performance.now(); return; }
  openDetail();
}

let suppressClick = false;
function onTapeClick(t) {
  if (suppressClick || isOpen) return;
  const r = relative(t.v, s);
  if (Math.abs(r) < 0.5) tryOpen();
  else T = Math.round(T + r);
}

/* Molette */
let wheelTimer = 0;
addEventListener('wheel', (e) => {
  if (isOpen) return;
  e.preventDefault();
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  T += delta / (ws + gap) * 0.5;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { T = Math.round(T); }, 160);
}, { passive: false });

/* Glisser */
let down = null;
shelf.addEventListener('pointerdown', (e) => {
  if (isOpen || e.button !== 0) return;
  down = { x: e.clientX, T0: T };
});
const endDrag = () => {
  if (dragging) {
    T = Math.round(T);
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
  }
  dragging = false;
  down = null;
};
addEventListener('pointermove', (e) => {
  mx = e.clientX;
  my = e.clientY;
  if (e.pointerType === 'mouse') cursor.classList.add('live');
  if (!down) return;
  // Un pointerup peut se perdre (relâché hors de la fenêtre) : jamais de drag sans bouton enfoncé.
  if (e.buttons === 0) { endDrag(); return; }
  const dx = e.clientX - down.x;
  if (!dragging && Math.abs(dx) > 5) dragging = true;
  if (dragging) T = down.T0 - dx / (ws + gap);
});
addEventListener('pointerup', endDrag);
addEventListener('pointercancel', endDrag);
addEventListener('pointerover', (e) => { overEl = e.target; });
document.addEventListener('pointerleave', () => { mx = innerWidth / 2; my = -1e4; });

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeDetail(); return; }
  if (isOpen) return;
  if (e.key === 'ArrowLeft') goBy(-1);
  else if (e.key === 'ArrowRight') goBy(1);
  else if (e.key === 'Enter' && (document.activeElement === document.body || !document.activeElement)) tryOpen();
});

/* Page d'explication */
const detail = $('.detail');
const scroller = $('.scroller');
const lines = [...detail.querySelectorAll('.hero .dm > *')];
const circles = [...detail.querySelectorAll('mask circle')];
const pArt = $('.p-art');
const bodyEl = $('.body');
let inkStart = 0, inkRaf = 0, closing = false;

const list = (items, cls = '') => `<ul${cls ? ` class="${cls}"` : ''}>${items.map((x) => `<li>${fmt(x)}</li>`).join('')}</ul>`;
const paras = (items) => items.map((p) => `<p>${fmt(p)}</p>`).join('');

function renderBody(c) {
  const b = c.body;
  if (!b) return `<p class="soon">La fiche complète arrive bientôt. Pour l’instant, la cassette est là, la bande n’est pas encore enregistrée.</p>`;
  let html = `<section><h2>Le problème</h2>${paras(b.problem)}</section>`;
  html += `<section><h2>Le principe</h2>${paras(b.principle)}`;
  if (b.diagram && DIAGRAMS[b.diagram]) html += `<div class="figure">${DIAGRAMS[b.diagram]}</div>`;
  html += `</section>`;
  if (b.steps) {
    html += `<section><h2>En pratique</h2><ul class="steps">${b.steps.map(([t, x]) => `<li><b>${fmt(t)}</b>${fmt(x)}</li>`).join('')}</ul></section>`;
  }
  html += `<section><h2>Les compromis</h2><div class="tradeoffs">`
    + `<div><h3>Ce que ça apporte</h3>${list(b.pros)}</div>`
    + `<div><h3>Ce que ça coûte</h3>${list(b.cons)}</div></div></section>`;
  if (b.examples) html += `<section><h2>Dans la vraie vie</h2>${list(b.examples)}</section>`;
  if (b.interview) html += `<section><h2>En entretien</h2>${list(b.interview, 'interview')}</section>`;
  return html;
}

function readingTime(c) {
  const words = bodyEl.textContent.split(/\s+/).filter(Boolean).length;
  return c.body ? `Environ ${Math.max(1, Math.round(words / 220))} min de lecture.` : 'Fiche complète bientôt.';
}

function activeTape() {
  return tapes[mod(Math.round(T), LOOP)];
}

// Le rect de la couverture inclut son inclinaison de −4,5° : on la retire pour que la feuille
// parte de la vraie taille de la couverture avant de lui appliquer la même rotation.
function coverInset() {
  const r = activeTape().cv.getBoundingClientRect();
  const th = Math.abs(TILT_Z) * Math.PI / 180;
  const c = Math.cos(th), sn = Math.sin(th), c2 = Math.cos(2 * th);
  const w = (r.width * c - r.height * sn) / c2;
  const h = (r.height * c - r.width * sn) / c2;
  const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
  const top = oy - h / 2, left = ox - w / 2;
  return {
    origin: `${ox}px ${oy}px`,
    clip: `inset(${top}px ${innerWidth - left - w}px ${innerHeight - top - h}px ${left}px round 3px)`,
  };
}

function inkFrame(now) {
  const t = now - inkStart;
  circles.forEach((el, i) => {
    const p = clamp((t - BLOBS[i]) / 1250, 0, 1);
    el.setAttribute('r', 720 * (1 - (1 - p) ** 3));
  });
  if (t < 2400) inkRaf = requestAnimationFrame(inkFrame);
}

function openDetail() {
  if (isOpen) return;
  isOpen = true;
  closing = false;
  dragging = false;
  down = null;
  T = Math.round(T);
  const i = mod(T, N);
  const c = CONCEPTS[i];
  $('.d-sub').textContent = c.en;
  $('.d-title').textContent = c.title;
  $('.d-meta').textContent = `Jour ${pad(i + 1)} / ${CATEGORIES[c.cat].label} / ${i + 1} décembre`;
  $('.d-pitch').textContent = c.pitch;
  bodyEl.innerHTML = renderBody(c);
  $('.d-credit').textContent = readingTime(c);
  $('.d-read').style.display = c.body ? '' : 'none';
  pArt.innerHTML = coverArt(c, i, false);
  circles.forEach((el) => el.setAttribute('r', 0));

  const { origin, clip } = coverInset();
  detail.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  scroller.scrollTop = 0;
  detail.style.visibility = 'visible';
  detail.style.transformOrigin = origin;
  detail.animate([
    { clipPath: clip, transform: `rotate(${TILT_Z}deg)` },
    { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
  ], { duration: reduce ? 1 : 1050, easing: SHEET_EASE, fill: 'both' });

  lines.forEach((el, k) => el.animate(
    [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
    { duration: reduce ? 1 : 900, delay: reduce ? 0 : 620 + k * 75, easing: EASE, fill: 'both' },
  ));

  cancelAnimationFrame(inkRaf);
  inkStart = performance.now() + (reduce ? -5000 : 520);
  inkRaf = requestAnimationFrame(inkFrame);
  $('.close').focus({ preventScroll: true });
}

function closeDetail(then) {
  if (!isOpen || closing) return;
  closing = true;
  const { origin, clip } = coverInset();
  detail.getAnimations().forEach((a) => a.cancel());
  detail.style.transformOrigin = origin;
  detail.animate([
    { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
    { clipPath: clip, transform: `rotate(${TILT_Z}deg)` },
  ], { duration: reduce ? 1 : 850, easing: SHEET_EASE, fill: 'both' }).onfinish = () => {
    detail.style.visibility = 'hidden';
    detail.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    cancelAnimationFrame(inkRaf);
    isOpen = false;
    closing = false;
    document.activeElement?.blur();
    if (typeof then === 'function') then();
  };
}
$('.close').addEventListener('click', () => closeDetail());
$('.d-next').addEventListener('click', () => closeDetail(() => goBy(1)));
$('.d-read').addEventListener('click', () => bodyEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }));

/* Boucle */
const play = $('.play');
const cursor = $('.cur');
const cursorLabel = $('.cur .cl');
let cursorState = '';
let cursorFor = -1;
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const W = innerWidth, shelfY = innerHeight / 2;

  const k = dragging ? 18 : 5.2;
  s += (T - s) * (reduce ? 1 : 1 - Math.exp(-k * dt));
  if (Math.abs(T - s) < 1e-4) s = T;
  if (Math.abs(s - N) > LOOP * 4) {
    const shift = Math.sign(s - N) * LOOP * Math.floor(Math.abs(s - N) / LOOP);
    s -= shift;
    T -= shift;
  }

  const act = mod(Math.round(s), N);
  if (act !== active) setActive(act, Math.sign(T - s) || 1, active < 0);
  const activeSealed = isLocked(act);

  const settled = Math.abs(T - s) < 0.3;
  onCover = !isOpen && settled && Math.abs(mx - W / 2) < 0.55 * d && Math.abs(my - shelfY) < 0.55 * H;
  let tyT, txT;
  if (onCover) {
    tyT = (mx - W / 2) / (0.55 * d) * 9;
    txT = -(my - shelfY) / (H / 2) * 6;
  } else {
    tyT = clamp((mx - W / 2) / W, -0.5, 0.5) * 5;
    txT = 0;
  }
  const at = reduce ? 1 : 1 - Math.exp(-7 * dt);
  tiltY += (tyT - tiltY) * at;
  tiltX += (txT - tiltX) * at;

  // Une cassette scellée qu'on essaie d'ouvrir se secoue.
  const st = (now - shakeAt) / 1000;
  const shake = !reduce && st < 0.7 ? Math.sin(st * 48) * 3.2 * Math.exp(-st * 6) : 0;

  const al = reduce ? 1 : 1 - Math.exp(-12 * dt);
  const cull = W / 2 + 1.5 * d;
  for (const t of tapes) {
    const r = relative(t.v, s);
    const x = F(r);
    if (Math.abs(x) > cull) {
      if (t.visible) { t.el.style.visibility = 'hidden'; t.visible = false; }
      continue;
    }
    if (!t.visible) { t.el.style.visibility = ''; t.visible = true; }
    t.lift += ((hover === t.v && Math.abs(r) > 0.5 && !isOpen ? 1 : 0) - t.lift) * al;
    const o = smooth(Math.max(0, 1 - Math.abs(r)));
    const y = -o * 0.025 * H - t.lift * 0.045 * H;
    const rz = TILT_Z * o + (Math.abs(r) < 0.5 ? shake : 0);
    t.el.style.transform =
      `translate3d(${x}px,${y}px,${o * 0.2 * H}px) rotateZ(${rz}deg) rotateX(${tiltX * o}deg) rotateY(${-90 * o + tiltY * o}deg)`;
    t.el.style.zIndex = Math.round(100 - Math.abs(r) * 4);
    t.sp.style.setProperty('--shade', (o * 0.55).toFixed(3));
    t.cv.style.setProperty('--shade', ((1 - o) * 0.5).toFixed(3));
  }

  const ps = isOpen || activeSealed ? 0 : smooth(Math.max(0, 1 - Math.abs(T - s) * 3));
  play.style.left = (W / 2 - 0.5 * d - 6) + 'px';
  play.style.top = (shelfY + 0.36 * H) + 'px';
  play.style.transform = `scale(${ps})`;
  play.style.visibility = ps < 0.01 ? 'hidden' : '';

  const ac = 1 - Math.exp(-16 * dt);
  cx += (mx - cx) * ac;
  cy += (my - cy) * ac;
  cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
  const overBtn = overEl && overEl.closest && overEl.closest('button, a') && !overEl.closest('.shelf');
  const overSpine = !isOpen && hover >= 0 && Math.abs(relative(hover, s)) > 0.5;
  const state = overBtn ? 'btn' : onCover ? 'open' : overSpine ? 'spine' : '';
  if (state !== cursorState) {
    if (cursorState) cursor.classList.remove(cursorState);
    if (state) cursor.classList.add(state);
    cursorState = state;
  }
  if (cursorFor !== act) {
    cursorFor = act;
    cursor.classList.toggle('sealed', activeSealed);
    cursorLabel.innerHTML = activeSealed ? `J-${daysLeft(act)}<br>SCELLÉ` : 'OUVRIR<br>▶';
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.fonts.ready.then(placeIndicator);
})();
