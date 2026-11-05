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
const fmt = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');

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

const cellOf = (c, i) => (CELLS.length ? CELLS[c.cell ?? i % CELLS.length] : null);
// Affiche la région [x, y, w, h] de la planche dans le cadre (dx, dy, dw, dh) : le <svg> imbriqué
// sert de fenêtre et découpe le reste.
const sheetCrop = ([x, y, w, h], dx, dy, dw, dh) =>
  `<svg x="${dx}" y="${dy}" width="${dw}" height="${dh}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="none">`
  + `<image href="${esc(SHEET.url)}" width="${SHEET.w}" height="${SHEET.h}"/></svg>`;

function coverArt(c, i, sealed) {
  const { bg, label } = CATEGORIES[c.cat];
  const cell = cellOf(c, i);
  // Sans palette (planche pas encore lue, ou file://), couleurs du thème.
  const { title: titleInk, text: textInk } = palettes[i]?.cover || { title: bg, text: INK };
  let out = `<rect width="474" height="900" fill="${CREAM}"/>`;
  if (cell) out += sheetCrop(cell, 0, 0, 474, 900);
  const lines = wrapTitle(c.title.toUpperCase(), 10);
  // Les capitales de Newsreader font ~0,74 em de large. Au-delà de TITLE_W, le titre mordait sur
  // le bord usé de l'illustration : on réduit le corps, en tolérant 15 % de condensation.
  const TITLE_W = 370;
  const widest = Math.max(...lines.map((l) => l.length));
  const fs = Math.min(lines.length <= 2 ? 78 : lines.length === 3 ? 64 : 54, Math.floor((TITLE_W * 1.15) / (widest * 0.74)));
  out += `<rect x="16" y="16" width="442" height="868" fill="none" stroke="${textInk}" stroke-opacity=".22" stroke-width="2"/>`;
  out += `<text x="237" y="66" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="3.5" fill="${textInk}">ADVENT OF SYSTEM DESIGN</text>`;
  out += `<line x1="150" y1="84" x2="324" y2="84" stroke="${textInk}" stroke-width="1.5"/>`;
  let y = 120 + fs * 0.82;
  for (const l of lines) {
    out += `<text x="237" y="${y}" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="${fs}" letter-spacing="-1" fill="${titleInk}"${fit(l, fs, 0.74, TITLE_W)}>${esc(l)}</text>`;
    y += fs * 0.94;
  }
  const en = c.en.toUpperCase();
  out += `<text x="237" y="${y + 10}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${textInk}"${fit(en, 13, 0.78, TITLE_W)}>${esc(en)}</text>`;

  if (!cell) {
    const cy = 612, r = 148;
    out += `<circle cx="237" cy="${cy}" r="${r}" fill="${bg}"/>`;
    for (let dy = 78; dy < r; dy += 16) {
      const hw = Math.sqrt(r * r - dy * dy);
      out += `<rect x="${237 - hw}" y="${cy + dy}" width="${hw * 2}" height="6" fill="${CREAM}"/>`;
    }
    out += `<text x="237" y="${cy - 8}" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="168" letter-spacing="-4" fill="${CREAM}">${pad(i + 1)}</text>`;
  }
  out += `<text x="34" y="846" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${textInk}">JOUR ${pad(i + 1)} · ${esc(label.toUpperCase())}</text>`;
  // Le badge VHS n'est dessiné que sans illustration : sur la planche, il est déjà imprimé.
  if (!cell) {
    out += `<rect x="372" y="818" width="70" height="38" fill="none" stroke="${INK}" stroke-width="2"/>`;
    out += `<text x="407" y="846" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="24" fill="${INK}">VHS</text>`;
  }
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
  const { bg, fg } = palettes[i]?.spine || CATEGORIES[c.cat];
  let out = `<rect width="142" height="840" fill="${bg}"/>`;
  out += `<rect x="7" y="7" width="128" height="826" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="1.5"/>`;
  out += `<circle cx="71" cy="80" r="46" fill="${fg}"/>`;
  out += `<text x="71" y="82" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="50" letter-spacing="-1" fill="${bg}">${pad(i + 1)}</text>`;
  const t = c.title.toUpperCase();
  // dominant-baseline="central" centre la boîte em, pas les capitales : le titre penchait à droite.
  // On pose la ligne de base à une demi-hauteur de capitale (0,7 em pour Newsreader) de l'axe.
  out += `<text transform="translate(${71 - 60 * 0.35} 162) rotate(90)" font-family="${SERIF}" font-weight="600" font-size="60" letter-spacing="-.5" fill="${fg}"${fit(t, 60, 0.62, 530)}>${esc(t)}</text>`;
  out += `<text x="71" y="738" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2.5" fill="${fg}">JOUR ${pad(i + 1)}</text>`;
  out += `<rect x="26" y="758" width="90" height="40" fill="none" stroke="${fg}" stroke-width="2"/>`;
  out += `<text x="71" y="787" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="26" fill="${fg}">VHS</text>`;
  if (sealed) {
    out += `<g transform="rotate(-8 71 620)"><rect x="-12" y="600" width="166" height="40" fill="${CREAM}"/>`
      + `<text x="71" y="626" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="15" letter-spacing="2" fill="${INK}">${pad(i + 1)} DÉC</text></g>`;
  }
  return out;
}

/* Couleurs tirées des jaquettes */
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const hex = (rgb) => '#' + rgb.map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');
const fallbackOn = (bg) => (lum(bg) > 0.5 ? [20, 20, 20] : [239, 230, 210]);

// Couleurs d'une région de la planche, de la plus présente à la moins présente. Elles sont regroupées
// par paliers de 16 niveaux par canal pour que les dégradés et la trame ne dispersent pas les votes.
function regionColors(ctx, img, [x, y, w, h]) {
  const cw = 48, ch = 92;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, x, y, w, h, 0, 0, cw, ch);
  const px = ctx.getImageData(0, 0, cw, ch).data;
  const buckets = new Map();
  let total = 0;
  for (let k = 0; k < px.length; k += 4) {
    if (px[k + 3] < 128) continue;
    const key = ((px[k] >> 4) << 8) | ((px[k + 1] >> 4) << 4) | (px[k + 2] >> 4);
    const b = buckets.get(key) || { n: 0, rgb: [0, 0, 0] };
    b.n++;
    b.rgb[0] += px[k]; b.rgb[1] += px[k + 1]; b.rgb[2] += px[k + 2];
    buckets.set(key, b);
    total++;
  }
  const list = [...buckets.values()].sort((a, b) => b.n - a.n).map((b) => ({ n: b.n, rgb: b.rgb.map((v) => v / b.n) }));
  return { total, list };
}

// Couleur la plus présente qui se détache du fond de la région : dans la zone du titre, c'est l'encre
// du titre imprimé.
function inkOf({ total, list }, minContrast) {
  if (!total) return null;
  const bg = list[0].rgb;
  const ink = list.find((b) => b.n > total * 0.02 && Math.abs(lum(b.rgb) - lum(bg)) > minContrast);
  return ink ? ink.rgb : fallbackOn(bg);
}

// Tranche : fond = couleur dominante de la case, texte = encre qui contraste avec lui.
// Jaquette : titre = encre de la zone du titre de l'image, petits textes = encre de la ligne du haut
// (« A LEON VASARI FILM » sur la planche actuelle).
function cellPalette(ctx, img, cell) {
  const [x, y, w, h] = cell;
  const all = regionColors(ctx, img, cell);
  if (!all.total) return null;
  const bg = all.list[0].rgb;
  const fg = inkOf(all, 0.45);
  const title = inkOf(regionColors(ctx, img, [x, y + h * 0.1, w, h * 0.25]), 0.3) || fg;
  const text = inkOf(regionColors(ctx, img, [x, y + h * 0.02, w, h * 0.07]), 0.3) || fg;
  return { spine: { bg: hex(bg), fg: hex(fg) }, cover: { title: hex(title), text: hex(text) } };
}

let palettes = [];
// Préchargée dès le départ pour que la première cassette ouverte ne montre jamais une jaquette vide.
const sheetImg = new Image();
sheetImg.src = SHEET.url;
sheetImg.decode().then(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 92;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  try {
    palettes = CONCEPTS.map((c, i) => { const cell = cellOf(c, i); return cell && cellPalette(ctx, sheetImg, cell); });
  } catch {
    // Ouvert en file:// : le canvas est « tainted », on garde les couleurs des thèmes.
    return;
  }
  for (const t of tapes) {
    const i = t.v % N;
    t.sp.innerHTML = spineHTML(t.v);
    t.cv.innerHTML = svg(474, 900, coverArt(CONCEPTS[i], i, isLocked(i)));
  }
}).catch(() => {});

const svg = (w, h, inner) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${inner}</svg>`;

/* Usure des tranches */
// Une seule texture pour toutes les tranches : le navigateur la rastérise une fois, puis chaque
// tranche en montre une fenêtre différente (texture deux fois plus haute qu'une tranche, décalée
// et parfois retournée) pour que le grain, les arêtes et les plis ne se répètent pas d'une tranche à l'autre.
const wearTexture = (() => {
  const H2 = 1680;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let creases = '';
  for (let k = 0; k < 3; k++) {
    // Pli : une ligne sombre doublée d'une ligne claire, comme un carton marqué.
    const y = 120 + rnd() * (H2 - 240);
    creases += `<rect x="0" y="${y}" width="142" height="2" fill="#000" opacity=".16"/><rect x="0" y="${y + 2}" width="142" height="1.5" fill="#fff" opacity=".14"/>`;
  }
  const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 142 ${H2}" width="142" height="${H2}" preserveAspectRatio="none">`
    + `<filter id="dk"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="3" stitchTiles="stitch"/>`
    + `<feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1.7 -.95"/></filter>`
    + `<filter id="lt"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="11" stitchTiles="stitch"/>`
    + `<feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.9 -1.15"/></filter>`
    + `<filter id="rough" x="-20%" y="0" width="140%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".06 .35" numOctaves="2" seed="5"/>`
    + `<feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter>`
    + `<rect width="142" height="${H2}" filter="url(#dk)" opacity=".38"/>`
    + `<rect width="142" height="${H2}" filter="url(#lt)" opacity=".3"/>`
    + `<g filter="url(#rough)">`
    + `<rect x="-6" y="0" width="13" height="${H2}" fill="#000" opacity=".26"/>`
    + `<rect x="135" y="0" width="13" height="${H2}" fill="#000" opacity=".26"/>`
    + `<rect x="3" y="0" width="3" height="${H2}" fill="#fff" opacity=".2"/>`
    + `<rect x="136" y="0" width="3" height="${H2}" fill="#fff" opacity=".2"/>`
    + creases
    + `</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svgText)}")`;
})();
document.documentElement.style.setProperty('--wear', wearTexture);

function spineHTML(v) {
  const i = v % N;
  const y = (v * 37) % 100;
  const flip = v % 3 === 1 ? ' scale(-1, 1)' : v % 3 === 2 ? ' scale(1, -1)' : '';
  return svg(142, 840, spineArt(CONCEPTS[i], i, isLocked(i)))
    + `<div class="wear" style="background-position: 0 ${y}%;${flip ? ` transform:${flip}` : ''}"></div>`;
}

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
  sp.innerHTML = spineHTML(v);
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
  // Pas d'explication tant que la case montre encore une image de film.
  $('.d-why').textContent = c.why || '';
  $('.d-why-line').style.display = c.why ? '' : 'none';
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
