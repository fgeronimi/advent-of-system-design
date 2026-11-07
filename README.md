# Advent of System Design · édition vidéoclub

Un calendrier de l’avent pour réviser le system design : 24 concepts, une cassette VHS par jour,
du 1er au 24 décembre, rangées sur l’étagère d’un vidéoclub un soir de Noël.

Chaque cassette arrive emballée. Le jour J, on la déballe et elle s’ouvre sur une fiche : le problème,
le principe, un schéma, les compromis, des exemples réels et les questions qu’on te posera en entretien.
Chaque fiche tient en quelques minutes de lecture.

**En ligne : [fgeronimi.github.io/advent-of-system-design](https://fgeronimi.github.io/advent-of-system-design/)**

Pas envie d’attendre décembre ? [Toutes les fiches en avance](https://fgeronimi.github.io/advent-of-system-design/?day=24).

## Au programme

| Thème | Concepts |
|---|---|
| Migration | Strangler Fig, Expand and Contract, Canary Release, Monolithe modulaire |
| Données | CQRS, Le problème N+1, Sharding, Consistent Hashing, Event Sourcing, Index géospatial, Le théorème CAP |
| Résilience | Idempotence, Circuit Breaker, Rate Limiting, La ruée vers le cache, Backpressure |
| Distribué | Transactional Outbox, Saga, Tracing distribué |
| Équipe | La loi de Conway, La loi de Brooks, Les métriques DORA |
| Sécurité | Crypto Shredding, Dépôt de fichiers |

## Naviguer

- **← →**, molette ou glisser pour parcourir l’étagère, **Entrée** ou clic pour ouvrir la cassette au centre.
- Les onglets sautent au concept le plus proche d’un thème, *Aujourd’hui* revient à la cassette du jour.
- Les cassettes encore emballées secouent leur paquet : pas d’avance.

## Lancer en local

Aucune dépendance, aucun build. Ouvre `index.html` ou sers le dossier avec n’importe quel serveur statique :

```sh
npx serve .
```

Les cassettes se débloquent selon la date. Pour tester sans attendre :

- `?day=N` simule le N décembre (`?day=24` ouvre tout, `?day=0` scelle tout).
- La cassette du jour ne se déballe qu’une fois par navigateur. Pour revoir le déballement :
  `localStorage.removeItem('aosd-deballe-2026')` dans la console.

## Contribuer

- Le contenu des fiches est dans `concepts.js`, une entrée par jour.
- Les illustrations des jaquettes suivent le guide de `PROMPTS.md`.
- Le moteur (étagère 3D, paquets, fiche) est dans `app.js`, le style dans `styles.css`.

## Crédits

Fonts : [Newsreader](https://fonts.google.com/specimen/Newsreader) et
[Inter Tight](https://fonts.google.com/specimen/Inter+Tight), sous licence SIL Open Font License 1.1.
