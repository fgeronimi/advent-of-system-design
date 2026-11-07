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

function coverArt(c, i) {
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
  // Sur un cartouche crème : posée directement sur l'illustration, la ligne se perdait dans le dessin.
  const foot = `JOUR ${pad(i + 1)} · ${label.toUpperCase()}`;
  out += `<rect x="24" y="824" width="${Math.round(foot.length * 10.6 + 22)}" height="32" fill="${CREAM}"/>`;
  out += `<text x="35" y="846" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${INK}">${esc(foot)}</text>`;
  // Le badge VHS n'est dessiné que sans illustration : sur la planche, il est déjà imprimé.
  if (!cell) {
    out += `<rect x="372" y="818" width="70" height="38" fill="none" stroke="${INK}" stroke-width="2"/>`;
    out += `<text x="407" y="846" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="24" fill="${INK}">VHS</text>`;
  }
  return out;
}

function spineArt(c, i) {
  const { bg, fg } = palettes[i]?.spine || CATEGORIES[c.cat];
  let out = `<rect width="142" height="840" fill="${bg}"/>`;
  out += `<rect x="7" y="7" width="128" height="826" fill="none" stroke="${fg}" stroke-opacity=".35" stroke-width="1.5"/>`;
  out += `<circle cx="71" cy="80" r="46" fill="${fg}"/>`;
  out += `<text x="71" y="82" text-anchor="middle" dominant-baseline="central" font-family="${SERIF}" font-weight="600" font-size="50" letter-spacing="-1" fill="${bg}">${pad(i + 1)}</text>`;
  const t = c.title.toUpperCase();
  // dominant-baseline="central" centre la boîte em, pas les capitales : le titre penchait à droite.
  // On pose la ligne de base à une demi-hauteur de capitale (0,7 em pour Newsreader) de l'axe.
  // Même chasse de 0,74 em que sur la jaquette : à 0,62, « RATE LIMITING » débordait sans être resserré.
  out += `<text transform="translate(${71 - 60 * 0.35} 162) rotate(90)" font-family="${SERIF}" font-weight="600" font-size="60" letter-spacing="-.5" fill="${fg}"${fit(t, 60, 0.74, 530)}>${esc(t)}</text>`;
  out += `<text x="71" y="738" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2.5" fill="${fg}">JOUR ${pad(i + 1)}</text>`;
  out += `<rect x="26" y="758" width="90" height="40" fill="none" stroke="${fg}" stroke-width="2"/>`;
  out += `<text x="71" y="787" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="26" fill="${fg}">VHS</text>`;
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
const sheetReady = sheetImg.decode().then(() => {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 92;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  try {
    palettes = CONCEPTS.map((c, i) => { const cell = cellOf(c, i); return cell && cellPalette(ctx, sheetImg, cell); });
  } catch {
    // Ouvert en file:// : le canvas est « tainted », on garde les couleurs des thèmes.
    return false;
  }
  return true;
}).catch(() => false);

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

/* Neige posée */
// Un bourrelet de neige sur le haut de chaque face, dessiné dans le SVG pour suivre la 3D sans calcul.
// Les paquets pas encore ouverts sont bien enneigés, les cassettes déballées n'en gardent qu'un peu.
// Pas de dégradé ni de filtre : ils exigeraient des id, dupliqués d'une copie de cassette à l'autre.
function snowCap(w, i, salt, deep) {
  let seed = (i + 1) * 7919 + salt;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const depth = (deep ? 26 : 10) * (w / 142) ** 0.35;
  const steps = Math.max(8, Math.round(w / 18));
  const ys = Array.from({ length: steps + 1 }, () => depth * (0.6 + rnd() * 0.45));
  // Deux ou trois coulures plus longues, jamais collées aux bords.
  const drips = 2 + Math.floor(rnd() * 2);
  for (let k = 0; k < drips; k++) ys[1 + Math.floor(rnd() * (steps - 1))] += depth * (0.5 + rnd() * 0.7);
  const dx = w / steps;
  const edge = (dy) => {
    let d = `M0 0H${w}V${ys[steps] + dy}`;
    for (let k = steps; k > 0; k--) {
      const x0 = k * dx, x1 = (k - 1) * dx;
      d += `Q${x0 - dx / 2} ${Math.max(ys[k], ys[k - 1]) * 1.12 + dy} ${x1} ${ys[k - 1] + dy}`;
    }
    return d + 'Z';
  };
  return `<path d="${edge(3)}" fill="#000" opacity=".22"/>`
    + `<path d="${edge(0)}" fill="#EEF2F5"/>`
    + `<path d="${edge(-depth * 0.45)}" fill="#FFFFFF"/>`;
}

/* Paquets cadeaux */
// Le jour J, la cassette reste emballée jusqu'au premier clic : on la déballe une fois, ensuite elle
// reste ouverte. Le dernier jour déballé est retenu dans le navigateur.
const UNWRAP_KEY = `aosd-deballe-${ADVENT_YEAR}`;
let unwrappedUpTo = 0;
try { unwrappedUpTo = parseInt(localStorage.getItem(UNWRAP_KEY), 10) || 0; } catch {}
const isWrapped = (i) => isLocked(i) || (i === unlocked - 1 && unwrappedUpTo < unlocked);

const GIFT_PAPERS = [
  { bg: '#A8262D', stripe: '#BC3A3A', dot: '#E0B25A', ribbon: '#E0B25A', fold: '#A9803A' },
  { bg: '#1F5C3A', stripe: '#2A6B47', dot: '#F1E9D8', ribbon: '#C8343A', fold: '#8C1F26' },
  { bg: '#EFE6D2', stripe: '#E4D7BC', dot: '#A8262D', ribbon: '#1F5C3A', fold: '#123A24' },
];
// Rayures à 45° et pois entre les rayures, dessinés en un seul path chacun pour ne pas multiplier
// les nœuds sur 72 cassettes.
function giftPaper(w, h, p) {
  const period = 44, sw = 16;
  let stripes = '', dots = '';
  for (let k = 0; k < w + h; k += period) stripes += `M${k} 0h${sw}l${-h} ${h}h${-sw}Z`;
  const c = sw + (period - sw) / 2;
  for (let y = period / 2; y < h; y += period / 2) {
    for (let x = mod(c - y, period); x < w; x += period) dots += `M${x - 3} ${y}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`;
  }
  return `<rect width="${w}" height="${h}" fill="${p.bg}"/><path d="${stripes}" fill="${p.stripe}"/><path d="${dots}" fill="${p.dot}"/>`;
}
function bow(cx, cy, k, p) {
  const loop = (sx) => `M${cx} ${cy}c${sx * -22 * k} ${-36 * k} ${sx * -60 * k} ${-32 * k} ${sx * -54 * k} ${-4 * k}c${sx * 4 * k} ${18 * k} ${sx * 36 * k} ${12 * k} ${sx * 54 * k} ${4 * k}Z`;
  const inner = (sx) => `M${cx} ${cy}c${sx * -14 * k} ${-20 * k} ${sx * -36 * k} ${-20 * k} ${sx * -34 * k} ${-6 * k}c${sx * 6 * k} ${6 * k} ${sx * 22 * k} ${6 * k} ${sx * 34 * k} ${6 * k}Z`;
  const tail = (sx) => `M${cx} ${cy}l${sx * -26 * k} ${46 * k}l${sx * 8 * k} ${-2 * k}l${sx * 6 * k} ${9 * k}l${sx * 18 * k} ${-50 * k}Z`;
  return `<path d="${tail(1)}${tail(-1)}" fill="${p.fold}"/>`
    + `<path d="${loop(1)}${loop(-1)}" fill="${p.ribbon}"/>`
    + `<path d="${inner(1)}${inner(-1)}" fill="${p.fold}" opacity=".55"/>`
    + `<rect x="${cx - 9 * k}" y="${cy - 9 * k}" width="${18 * k}" height="${18 * k}" rx="${5 * k}" fill="${p.ribbon}" stroke="${p.fold}" stroke-width="${1.5 * k}"/>`;
}
const ribbonV = (x, w, h, p) => `<rect x="${x}" width="${w}" height="${h}" fill="${p.ribbon}"/><path d="M${x + 3} 0V${h}M${x + w - 3} 0V${h}" stroke="${p.fold}" stroke-width="1.5"/>`;
const ribbonH = (y, h, w, p) => `<rect y="${y}" width="${w}" height="${h}" fill="${p.ribbon}"/><path d="M0 ${y + 3}H${w}M0 ${y + h - 3}H${w}" stroke="${p.fold}" stroke-width="1.5"/>`;
// Étiquette en carton accrochée au nœud par une ficelle.
function giftTag(x, y, w, h, rot, from, inner) {
  return `<path d="M${from[0]} ${from[1]}Q${(from[0] + x + w / 2) / 2 - 20} ${(from[1] + y) / 2 + 30} ${x + w / 2} ${y + 14}" fill="none" stroke="${INK}" stroke-width="1.5" opacity=".7"/>`
    + `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})">`
    + `<path d="M${x + 14} ${y}H${x + w - 14}L${x + w} ${y + 14}V${y + h}H${x}V${y + 14}Z" fill="${CREAM}" stroke="#000" stroke-opacity=".2"/>`
    + `<circle cx="${x + w / 2}" cy="${y + 14}" r="4" fill="#00000055"/>`
    + inner(x + w / 2, y)
    + `</g>`;
}
function giftSpine(i) {
  const p = GIFT_PAPERS[i % GIFT_PAPERS.length];
  return giftPaper(142, 840, p) + ribbonV(56, 30, 840, p) + ribbonH(250, 30, 142, p)
    + giftTag(30, 330, 82, 118, -6, [71, 270], (cx, y) =>
      `<text x="${cx}" y="${y + 70}" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="40" fill="${INK}">${pad(i + 1)}</text>`
      + `<text x="${cx}" y="${y + 96}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${INK}">DÉC</text>`)
    + bow(71, 265, 1.1, p) + snowCap(142, i, 1, true);
}
function giftCover(i) {
  const p = GIFT_PAPERS[i % GIFT_PAPERS.length];
  return giftPaper(474, 900, p) + ribbonV(300, 48, 900, p) + ribbonH(290, 48, 474, p)
    + giftTag(70, 450, 236, 150, -8, [324, 314], (cx, y) =>
      `<text x="${cx}" y="${y + 56}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="13" letter-spacing="2" fill="${INK}">${isLocked(i) ? 'NE PAS OUVRIR AVANT LE' : 'À DÉBALLER CE'}</text>`
      + `<text x="${cx}" y="${y + 112}" text-anchor="middle" font-family="${SERIF}" font-weight="600" font-size="48" fill="${INK}">${i + 1} déc.</text>`)
    + bow(324, 314, 2, p) + snowCap(474, i, 2, true);
}
const giftHTML = (w, h, art) => `<div class="gift">${svg(w, h, art)}</div>`;

/* Stickers de vidéoclub */
// Coups de cœur du vidéoclub, en numéros de jour.
const STAFF_PICKS = new Set([3, 14, 21]);
function stickerOf(i) {
  if (i === unlocked - 1) return 'new';
  if (!isLocked(i) && STAFF_PICKS.has(i + 1)) return 'pick';
  return null;
}
// Étoile fluo pour la nouveauté, pastille rose pour le coup de cœur, posées de travers comme à la main.
function sticker(kind, cx, cy, r, rot) {
  const k = r / 42;
  const t = (y, size, txt, font = SANS) => `<text x="${cx}" y="${cy + y * k}" text-anchor="middle" font-family="${font}" font-weight="700" font-size="${size * k}" letter-spacing="${0.5 * k}" fill="${INK}">${txt}</text>`;
  let out = `<g transform="rotate(${rot} ${cx} ${cy})">`;
  if (kind === 'new') {
    let d = '';
    for (let a = 0; a < 20; a++) {
      const rr = a % 2 ? r * 0.84 : r;
      const th = (a / 20) * Math.PI * 2;
      d += `${a ? 'L' : 'M'}${(cx + rr * Math.cos(th)).toFixed(1)} ${(cy + rr * Math.sin(th)).toFixed(1)}`;
    }
    out += `<path d="${d}Z" fill="#000" opacity=".25" transform="translate(${2 * k} ${3 * k})"/><path d="${d}Z" fill="#FF7A1A"/>`
      + t(-4, 15, 'NOUVEAU') + t(14, 11, '★ ★ ★');
  } else {
    out += `<circle cx="${cx + 2 * k}" cy="${cy + 3 * k}" r="${r}" fill="#000" opacity=".25"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="#FF4F8B"/>`
      + `<circle cx="${cx}" cy="${cy}" r="${r - 5 * k}" fill="none" stroke="${INK}" stroke-width="${1.2 * k}" stroke-dasharray="${2 * k} ${3 * k}"/>`
      + t(-9, 12, 'COUP DE') + t(7, 14, 'CŒUR') + t(22, 12, '♥');
  }
  return out + '</g>';
}

function spineHTML(v) {
  const i = v % N;
  const y = (v * 37) % 100;
  const flip = v % 3 === 1 ? ' scale(-1, 1)' : v % 3 === 2 ? ' scale(1, -1)' : '';
  const st = stickerOf(i);
  return svg(142, 840, spineArt(CONCEPTS[i], i) + snowCap(142, i, 1, false) + (st ? sticker(st, 90, 752, 46, -12) : ''))
    + (isWrapped(i) ? giftHTML(142, 840, giftSpine(i)) : '')
    + `<div class="wear" style="background-position: 0 ${y}%;${flip ? ` transform:${flip}` : ''}"></div>`;
}

/* Étagère */
const stage = $('.stage');
const shelf = $('.shelf');
const tapes = [];
for (let v = 0; v < LOOP; v++) {
  const i = v % N;
  const el = document.createElement('div');
  el.className = 'tape';
  const sp = document.createElement('div');
  sp.className = 'sp';
  const cv = document.createElement('div');
  cv.className = 'cv';
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
$('.foot .count').textContent = `${unlocked} / ${N} cassettes en rayon`;

/* Guirlande */
// Une ampoule par jour : la guirlande sert de compteur, chaque jour ouvert en allume une de plus.
const BULB_COLORS = ['#E0473F', '#E0B25A', '#4FA36B', '#F1E9D8'];
const BULB_SVG = '<svg viewBox="0 0 16 26" aria-hidden="true"><rect x="5" y="0" width="6" height="6" rx="1" fill="#4A5246"/>'
  + '<path class="glass" d="M8 5C13 5 14 12 13 17C12 22 10 25 8 25C6 25 4 22 3 17C2 12 3 5 8 5Z"/></svg>';
const garland = $('.garland');
garland.setAttribute('aria-label', `${unlocked} jours ouverts sur ${N}`);
// Le fil pend entre deux crochets et chaque ampoule est accrochée au creux d'une boucle.
const wire = Array.from({ length: N }, (_, k) => `Q${k * 100 + 50} 36 ${(k + 1) * 100} 4`).join(' ');
garland.innerHTML = `<svg class="wire" viewBox="0 0 ${N * 100} 40" preserveAspectRatio="none" aria-hidden="true"><path d="M0 4 ${wire}" vector-effect="non-scaling-stroke"/></svg>`;
const bulbs = CONCEPTS.map((c, i) => {
  const b = document.createElement('button');
  b.className = 'bulb' + (i < unlocked ? ' lit' : '') + (i === unlocked - 1 ? ' today' : '');
  b.style.left = `${(i + 0.5) / N * 100}%`;
  b.style.setProperty('--c', BULB_COLORS[i % BULB_COLORS.length]);
  b.style.setProperty('--r', `${(i % 2 ? 1 : -1) * (5 + (i * 7) % 5)}deg`);
  b.setAttribute('aria-label', `Jour ${i + 1} : ${c.title}`);
  b.innerHTML = BULB_SVG;
  b.addEventListener('click', () => goBy(shortest(i)));
  garland.append(b);
  return b;
});

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
  next.animate([{ transform: `translateY(${dir * 105}%)` }, { transform: 'translateY(0)' }], { duration: 340, easing: EASE, fill: 'both' });
  for (const o of old) {
    o._leaving = true;
    const from = getComputedStyle(o).transform;
    o.animate([{ transform: from === 'none' ? 'translateY(0)' : from }, { transform: `translateY(${-dir * 105}%)` }], { duration: 340, easing: EASE, fill: 'both' })
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
  bulbs.forEach((b, k) => b.classList.toggle('current', k === i));
  placeIndicator();
}

function goBy(delta) {
  if (isOpen || unwrapping) return;
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
  if (isOpen || unwrapping) return;
  const i = mod(Math.round(T), N);
  if (isLocked(i)) { shakeAt = performance.now(); return; }
  if (isWrapped(i)) { unwrap(i); return; }
  openDetail();
}

// Le paquet frissonne, puis le papier se déchire de haut en bas et la fiche s'ouvre.
let unwrapping = false;
function unwrap(i) {
  unwrapping = true;
  unwrappedUpTo = i + 1;
  try { localStorage.setItem(UNWRAP_KEY, String(unwrappedUpTo)); } catch {}
  cursorFor = -1;
  const gifts = tapes.filter((t) => t.v % N === i).flatMap((t) => [...t.el.querySelectorAll('.gift')]);
  const done = () => {
    gifts.forEach((g) => g.remove());
    unwrapping = false;
    openDetail();
  };
  if (reduce) { done(); return; }
  shakeAt = performance.now();
  // Bord déchiré en dents de scie, légèrement en biais ; la partie gardée est sous le bord.
  const edge = (base) => Array.from({ length: 11 }, (_, k) => `${k * 10}% ${base + k * 1.2 + (k % 2 ? 3 : -3)}%`).join(',');
  const clip = (base) => `polygon(${edge(base)},100% 100%,0% 100%)`;
  let last;
  for (const g of gifts) {
    last = g.animate([{ clipPath: clip(-20) }, { clipPath: clip(110) }],
      { duration: 650, delay: 260, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
  }
  if (last) last.onfinish = () => setTimeout(done, 120);
  else done();
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
  if (isOpen || unwrapping) return;
  e.preventDefault();
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  T += delta / (ws + gap) * 0.5;
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => { T = Math.round(T); }, 160);
}, { passive: false });

/* Glisser */
let down = null;
shelf.addEventListener('pointerdown', (e) => {
  if (isOpen || unwrapping || e.button !== 0) return;
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
  else if (e.key === 'Enter' && (document.activeElement === document.body || !document.activeElement)) {
    // openDetail donne le focus à « Fermer » : sans preventDefault, le clic clavier que le navigateur
    // déclenche juste après sur l'élément focus referme aussitôt la fiche.
    e.preventDefault();
    tryOpen();
  }
});

/* Page d'explication */
const detail = $('.detail');
const scroller = $('.scroller');
const lines = [...detail.querySelectorAll('.hero .dm > *')];
const circles = [...detail.querySelectorAll('mask circle')];
const pArt = $('.p-art');
const ticket = $('.ticket');
const stamp = $('.stamp');
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
  $('.t-no').textContent = `N° ${ADVENT_YEAR}-${pad(i + 1)}`;
  $('.t-title').textContent = c.title;
  $('.t-cat').textContent = CATEGORIES[c.cat].label;
  $('.t-out').textContent = `${i + 1} déc.`;
  $('.t-back').textContent = i + 2 === 25 ? '25 déc. · Noël' : `${i + 2} déc.`;
  $('.t-stamp').textContent = `${pad(i + 1)}·12·${String(ADVENT_YEAR).slice(2)}`;
  pArt.innerHTML = coverArt(c, i);
  circles.forEach((el) => el.setAttribute('r', 0));

  const { origin, clip } = coverInset();
  detail.getAnimations({ subtree: true }).forEach((a) => a.cancel());
  scroller.scrollTop = 0;
  detail.style.visibility = 'visible';
  detail.style.transformOrigin = origin;
  detail.animate([
    { clipPath: clip, transform: `rotate(${TILT_Z}deg)` },
    { clipPath: 'inset(0px 0px 0px 0px round 0px)', transform: 'rotate(0deg)' },
  ], { duration: reduce ? 1 : 750, easing: SHEET_EASE, fill: 'both' });

  lines.forEach((el, k) => el.animate(
    [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }],
    { duration: reduce ? 1 : 700, delay: reduce ? 0 : 350 + k * 50, easing: EASE, fill: 'both' },
  ));

  // Le ticket sort comme d'une imprimante de caisse, puis on le tamponne.
  ticket.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: reduce ? 1 : 700, delay: reduce ? 0 : 500, easing: EASE, fill: 'both' });
  stamp.animate([
    { clipPath: 'inset(50% round 50%)', transform: 'scale(1.8)' },
    { clipPath: 'inset(0% round 0%)', transform: 'scale(.94)', offset: 0.7 },
    { clipPath: 'inset(0% round 0%)', transform: 'scale(1)' },
  ], { duration: reduce ? 1 : 280, delay: reduce ? 0 : 1250, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'both' });

  cancelAnimationFrame(inkRaf);
  inkStart = performance.now() + (reduce ? -5000 : 300);
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
  ], { duration: reduce ? 1 : 420, easing: SHEET_EASE, fill: 'both' }).onfinish = () => {
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

/* Neige qui tombe */
// Un seul canvas pour tous les flocons : en CSS, au-delà d'une dizaine d'éléments animés, ça ne tient plus.
// Trois plans de profondeur, du petit flocon lent du fond au gros flocon rapide du premier plan.
// Les deux plans du fond tombent derrière l'étagère, seul le premier plan passe devant : la neige
// ne brouille plus les titres et l'étagère gagne en profondeur.
const snowCvs = [$('.snow.back'), $('.snow.front')];
const snowCtxs = snowCvs.map((cv) => cv.getContext('2d'));
const LAYERS = [
  { r: [0.6, 1.2], vy: [18, 30], a: 0.35, front: false },
  { r: [1.2, 2], vy: [32, 52], a: 0.6, front: false },
  { r: [2.6, 4.2], vy: [58, 85], a: 0.85, front: true },
];
// Flocon flou pré-rendu : les gros flocons du premier plan sont hors de la mise au point, comme filmés.
const softFlake = document.createElement('canvas');
softFlake.width = softFlake.height = 32;
{
  const g = softFlake.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.4, 'rgba(255,255,255,.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
}
let flakes = [];
const between = ([a, b]) => a + Math.random() * (b - a);
function resetSnow() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  snowCvs.forEach((cv, k) => {
    cv.width = innerWidth * dpr;
    cv.height = innerHeight * dpr;
    snowCtxs[k].setTransform(dpr, 0, 0, dpr, 0, 0);
  });
  const count = Math.min(140, Math.round(innerWidth * innerHeight / 14000));
  flakes = Array.from({ length: count }, (_, k) => {
    const L = LAYERS[k % LAYERS.length];
    return { x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: between(L.r), vy: between(L.vy), a: L.a, front: L.front, sway: 8 + Math.random() * 18, ph: Math.random() * 6.28 };
  });
}
function drawSnow(dt, now) {
  const [back, front] = snowCtxs;
  back.clearRect(0, 0, innerWidth, innerHeight);
  front.clearRect(0, 0, innerWidth, innerHeight);
  // Sous la fiche, la neige ne se voit pas : inutile de la dessiner.
  if (reduce || isOpen) return;
  back.fillStyle = '#fff';
  for (const f of flakes) {
    f.y += f.vy * dt;
    if (f.y > innerHeight + 10) { f.y = -10; f.x = Math.random() * innerWidth; }
    const x = f.x + Math.sin(now / 1000 * 0.9 + f.ph) * f.sway;
    if (f.front) {
      front.globalAlpha = f.a;
      front.drawImage(softFlake, x - f.r * 1.6, f.y - f.r * 1.6, f.r * 3.2, f.r * 3.2);
    } else {
      back.globalAlpha = f.a;
      back.beginPath();
      back.arc(x, f.y, f.r, 0, 6.2832);
      back.fill();
    }
  }
  back.globalAlpha = 1;
  front.globalAlpha = 1;
}
if (!reduce) {
  resetSnow();
  addEventListener('resize', resetSnow);
}

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
    cursorLabel.innerHTML = activeSealed ? `J-${daysLeft(act)}<br>SCELLÉ` : isWrapped(act) ? 'DÉBALLER<br>★' : 'OUVRIR<br>▶';
  }

  drawSnow(dt, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.fonts.ready.then(placeIndicator);

/* Chargement */
function paint(t) {
  const i = t.v % N;
  t.sp.innerHTML = spineHTML(t.v);
  const st = stickerOf(i);
  t.cv.innerHTML = svg(474, 900, coverArt(CONCEPTS[i], i) + snowCap(474, i, 2, false) + (st ? sticker(st, 388, 742, 66, 10) : ''))
    + (isWrapped(i) ? giftHTML(474, 900, giftCover(i)) : '');
}

// Les cassettes ne sont dessinées qu'une fois les couleurs de la planche connues : sinon on voyait
// d'abord les couleurs des thèmes, puis le basculement.
let revealed = false;
function reveal() {
  if (revealed) return;
  revealed = true;
  tapes.forEach(paint);
  document.documentElement.classList.remove('is-loading');
  if (reduce) return;
  // `composite: 'add'` empile la montée sur le transform que la boucle écrit à chaque frame.
  for (const t of tapes) {
    const r = Math.abs(relative(t.v, s));
    if (r > 12) continue;
    t.el.animate([{ transform: `translateY(${innerHeight}px)` }, { transform: 'translateY(0)' }],
      { duration: 900, delay: r * 45, easing: EASE, fill: 'backwards', composite: 'add' });
  }
  for (const m of [capTitle, capSub, capDay]) m.replaceChildren();
  setTimeout(() => setActive(active, 1, false), 450);
}
// Réseau lent ou planche absente : on montre quand même l'étagère, avec les couleurs des thèmes.
const bgImg = new Image();
bgImg.src = 'assets/videoclub-bg.webp';
const bgReady = bgImg.decode().catch(() => {});
Promise.race([Promise.all([sheetReady, bgReady, document.fonts.ready]), new Promise((r) => setTimeout(r, 4000))]).then(reveal);
sheetReady.then((ok) => { if (ok && revealed) tapes.forEach(paint); });
})();
