# advent-of-system-design

Calendrier de l'avent : 24 concepts de system design, une cassette VHS par jour sur une étagère 3D.
Clic sur la cassette du jour → fiche d'explication. Contenu en français.

## Commandes

Pas de build, pas de dépendance. Servir le dossier avec n'importe quel serveur statique
(`npx serve .`, `python3 -m http.server`) ou ouvrir `index.html` directement.

- `?day=N` simule le N décembre (`?day=24` pour tout débloquer, `?day=0` pour tout sceller).
- Toutes les cassettes sont emballées ; une cassette débloquée se déballe au premier clic, les jours déballés sont gardés dans `localStorage` (`aosd-deballe-<année>`).

## Architecture

- `concepts.js` : les données. `CATEGORIES`, `CONCEPTS` (un objet par jour, dans l'ordre) et `DIAGRAMS` (schémas SVG).
- `app.js` : le moteur. Une boucle `requestAnimationFrame` pilote l'étagère, la Web Animations API gère les transitions.
- Jaquettes et tranches dessinées en SVG inline (`coverArt`, `spineArt`). L'illustration de fond vient d'une case de la planche `SHEET` / `CELLS` (`concepts.js`).
- Verrouillage par date côté client, année dans `ADVENT_YEAR` (`app.js`). Contournable, c'est assumé.
- `styles.css` + `fonts.css` (Newsreader et Inter Tight, sous-ensemble latin, auto-hébergées dans `fonts/`).

## Pièges

- Aucun fade d'opacité : tous les reveals sont des masques, des clips ou des scales. Garder cette règle.
- Un concept sans `body` affiche une fiche « bientôt » avec le pitch seul.
- Textes : seuls `` `code` ``, `**gras**` et `*italique*` sont interprétés (`fmt` dans `app.js`), le reste est échappé.
- Les schémas utilisent les classes `.k-*` de `styles.css` pour les couleurs, pas de couleurs en dur.
- Illustrations : une planche unique de 24 cases, voir `PROMPTS.md`.
