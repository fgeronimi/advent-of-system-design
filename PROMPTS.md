# Illustrations des jaquettes

Toutes les jaquettes viennent d'**une seule image**, la planche `assets/covers/sheet.webp`, découpée en
24 cases (4 colonnes × 6 lignes). Chaque case couvre toute la face avant de la cassette, au ratio
474:900 (≈ 1:1,9). Le titre, le sous-titre anglais, le numéro du jour et le badge VHS sont dessinés en
SVG par-dessus par `app.js` : l'illustration ne doit donc contenir **aucun texte**.

Pour l'instant, la planche est celle des 12 jaquettes de films empilée deux fois : les textes des films
s'y superposent encore aux textes SVG, c'est attendu.

## Changer la planche

1. Produire la nouvelle planche : 24 illustrations verticales 1:1,9, sans texte, rangées en 4 × 6.
2. L'exporter en WebP : `cwebp -q 85 planche.png -o assets/covers/sheet.webp`.
   Les PNG de `assets/covers/` sont ignorés par git, seul le WebP est versionné.
3. Dans `concepts.js`, mettre à jour `SHEET` (largeur, hauteur) et les 24 boîtes de `CELLS`
   (`[x, y, largeur, hauteur]` en pixels, dans l'ordre de lecture : case 1 = jour 1).

La tranche réutilise automatiquement le milieu de la case comme vignette.

## Prompt de base

Garder ce bloc identique pour les 24 cases. Seul `{SUJET}` change, il vient du champ `art` de chaque concept.

```
Vintage screen-print illustration for a 1980s VHS tape cover, duotone risograph style,
limited palette of ink black (#141414), cobalt blue (#1F3FB0), vermilion red (#C8412B)
and cream (#EFE6D2), visible halftone dots and slight ink misregistration, flat shapes,
bold silhouettes, worn paper texture, full-bleed vertical composition, illustration filling the whole front of the box,
worn cardboard edges.
Subject: {SUJET}.
No text, no letters, no numbers, no logos, no frame, no border.
Vertical aspect ratio 1:1.9.
```

Pour une famille de jaquettes plus cohérente, on peut ajouter la couleur dominante du thème :

| Thème | Couleur dominante à ajouter au prompt |
|---|---|
| Migration | `dominant colour deep green (#2F5D3A)` |
| Données | `dominant colour cobalt blue (#1F3FB0)` |
| Résilience | `dominant colour vermilion red (#C8412B)` |
| Distribué | `dominant colour ink black (#141414)` |
| Équipe | `dominant colour ochre (#C9952F)` |
| Sécurité | `dominant colour plum (#5B2A4A)` |

## Sujets, jour par jour

Ce sont les idées du champ `art`, traduites pour le prompt (les générateurs comprennent mieux l'anglais).

| Jour | Slug | Sujet |
|---|---|---|
| 01 | strangler-fig | a strangler fig tree whose roots wrap around a beige 1980s desktop computer |
| 02 | idempotence | a rubber stamp hitting the same box on a form ten times, leaving a single mark |
| 03 | conway | an org chart whose boxes turn into servers linked by cables |
| 04 | cqrs | a road splitting into two lanes, delivery trucks on one, newspaper readers on the other |
| 05 | circuit-breaker | a giant electrical circuit breaker, lever pulled down, small sparks around it |
| 06 | outbox | a mailbox standing on a filing cabinet, envelopes flying out of it |
| 07 | n-plus-un | an exhausted waiter making a hundred trips to bring a hundred plates |
| 08 | crypto-shredding | an antique key going through a paper shredder, confetti of encrypted letters |
| 09 | expand-contract | a half-open accordion resting on a stack of database tables |
| 10 | rate-limiting | a leaking bucket dropping tokens one by one into a funnel |
| 11 | sharding | a large porcelain vase broken into shards, each shard resting on a server |
| 12 | brooks | a crowd of bricklayers tripping over each other around one small brick wall |
| 13 | saga | a row of falling dominoes, the last ones standing back up in the other direction |
| 14 | cache-stampede | a herd of bison charging towards a small open safe |
| 15 | consistent-hashing | a large circular clock face with small servers placed around the ring |
| 16 | canary | a canary in a small cage hanging at a mine entrance, a miner's lamp beside it |
| 17 | depot-fichier | a parcel inside a glass cage, crossed by a scanner light beam |
| 18 | event-sourcing | a long ribbon of magnetic tape unrolling, each segment marked with a symbol |
| 19 | tracing | a magnifying glass following a red thread stretched between several servers |
| 20 | backpressure | a garden hose with a knot, the pressure making it swell upstream |
| 21 | geo | a map divided into nested squares getting smaller and smaller, a pin in the centre |
| 22 | dora | the dashboard of a vintage car with four needle gauges |
| 23 | monolithe-modulaire | a large stone block carved into compartments, like a toolbox |
| 24 | cap | a triangle whose three corners hold a balance scale, a lit lamp and an unplugged plug |
