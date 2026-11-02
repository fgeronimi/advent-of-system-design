// Données du calendrier. Un objet par jour, dans l'ordre d'ouverture (jour 1 en premier).
//
// - cat      : une des clés de CATEGORIES
// - en       : nom anglais, affiché en sous-titre cobalt
// - pitch    : une phrase, affichée sous le titre dans la page d'explication
// - art      : idée d'illustration, à injecter dans le prompt de génération (voir PROMPTS.md)
// - cell     : optionnel, index de la case de SHEET à utiliser. Par défaut le jour N prend la case
//              N-1, et on boucle sur les cases s'il y en a moins que de jours.
// - body     : contenu détaillé. Absent = page « bientôt » avec le pitch seul.
//              Dans les textes, `code` et **gras** sont reconnus.

const CATEGORIES = {
  migration: { label: 'Migration', bg: '#2F5D3A', fg: '#EFE6D2' },
  donnees: { label: 'Données', bg: '#1F3FB0', fg: '#EFE6D2' },
  resilience: { label: 'Résilience', bg: '#C8412B', fg: '#EFE6D2' },
  distribue: { label: 'Distribué', bg: '#1E1E1E', fg: '#EFE6D2' },
  equipe: { label: 'Équipe', bg: '#C9952F', fg: '#141414' },
  securite: { label: 'Sécurité', bg: '#5B2A4A', fg: '#EFE6D2' },
};

// Planche d'illustrations : une seule image, découpée en 24 cases de jaquette (ratio ≈ 474:900).
// Pour l'instant, c'est la planche des 12 jaquettes de films empilée deux fois (4 colonnes × 6 lignes).
// Les textes de la jaquette sont dessinés en SVG par-dessus.
const SHEET = {
  url: 'assets/covers/sheet.webp',
  w: 1744,
  h: 4672,
};

// Cases [x, y, largeur, hauteur] en pixels de la planche, dans l'ordre de lecture.
// Les lignes 4 à 6 sont les lignes 1 à 3 décalées d'une demi-planche (2336 px).
const CELLS = [
  [74, 72, 347, 659], [497, 72, 344, 659], [914, 72, 342, 659], [1332, 72, 344, 659],
  [74, 813, 344, 676], [497, 815, 344, 674], [915, 815, 342, 675], [1331, 815, 345, 675],
  [74, 1571, 345, 681], [496, 1577, 343, 678], [913, 1579, 343, 676], [1331, 1579, 344, 677],
  [74, 2408, 347, 659], [497, 2408, 344, 659], [914, 2408, 342, 659], [1332, 2408, 344, 659],
  [74, 3149, 344, 676], [497, 3151, 344, 674], [915, 3151, 342, 675], [1331, 3151, 345, 675],
  [74, 3907, 345, 681], [496, 3913, 343, 678], [913, 3915, 343, 676], [1331, 3915, 344, 677],
];

const CONCEPTS = [
  {
    slug: 'strangler-fig',
    title: 'Strangler Fig',
    en: 'Strangler Fig Pattern',
    cat: 'migration',
    pitch: 'Remplacer un vieux système morceau par morceau, en l’enveloppant jusqu’à pouvoir le couper.',
    art: 'un figuier étrangleur dont les racines enlacent un ordinateur beige des années 80',
    body: {
      problem: [
        'Ton monolithe a quinze ans, personne n’ose toucher au module de facturation, et chaque release prend une semaine de recette. La tentation : tout réécrire from scratch.',
        'Le **big bang rewrite** échoue presque toujours. Pendant des mois tu maintiens deux systèmes, le business continue de demander des features sur l’ancien, et le jour de la bascule tu découvres les vingt règles métier que personne n’avait documentées.',
      ],
      principle: [
        'Martin Fowler a nommé le pattern en 2004 d’après les figuiers étrangleurs : ils germent sur un arbre hôte, l’entourent de leurs racines, et finissent par tenir debout seuls quand l’hôte a disparu.',
        'En pratique, tu places une **façade** devant le legacy (reverse proxy, API gateway, ou simple routeur applicatif). Au début elle laisse tout passer. Puis, fonctionnalité par fonctionnalité, tu réécris un morceau dans le nouveau système et tu bascules la route correspondante. Le legacy rétrécit jusqu’à ce qu’on puisse l’éteindre.',
      ],
      diagram: 'strangler',
      steps: [
        ['Intercepter', 'Mettre la façade devant le legacy, sans rien changer d’autre. Tout le trafic passe par elle.'],
        ['Extraire', 'Choisir un périmètre petit et bien délimité (ex. `/api/catalogue`) et le réécrire dans le nouveau système.'],
        ['Rediriger', 'Basculer la route, idéalement progressivement : 1 %, 10 %, 100 % du trafic, avec retour arrière en un clic.'],
        ['Décommissionner', 'Supprimer le code mort côté legacy. Sans cette étape, tu n’as pas migré, tu as juste ajouté un système.'],
      ],
      pros: [
        'Tu livres de la valeur en continu, pas dans dix-huit mois.',
        'Le risque est découpé : une route qui casse se rebascule, pas tout le SI.',
        'Tu apprends le vrai comportement du legacy au fil de l’eau, sur du trafic réel.',
      ],
      cons: [
        '**Les données partagées** sont le vrai casse-tête : deux systèmes qui écrivent dans la même base, ou une synchro (CDC, double écriture) à maintenir.',
        'La façade devient un point de passage obligé : latence en plus, et un SPOF à rendre robuste.',
        'Le risque de ne jamais finir : les 20 % les plus pourris du legacy restent en prod cinq ans de plus.',
      ],
      examples: [
        'Un monolithe PHP derrière Nginx : `location /api/orders` part vers le nouveau service, tout le reste vers l’ancien.',
        'Une app mobile qui appelle une gateway (Kong, Envoy) : les routes migrées sont réécrites vers les nouveaux services sans republier l’app.',
        'Côté front, le même principe marche page par page : la nouvelle SPA reprend une URL à la fois.',
      ],
      interview: [
        'Comment migrer un monolithe critique sans geler les features pendant un an ?',
        'Que fais-tu de la base de données partagée entre l’ancien et le nouveau système ?',
        'Comment sais-tu qu’une route migrée se comporte exactement comme l’ancienne ? (indice : shadow traffic, comparaison de réponses)',
        'À quel moment peux-tu vraiment éteindre le legacy ?',
      ],
    },
  },
  {
    slug: 'idempotence',
    title: 'Idempotence',
    en: 'Idempotency',
    cat: 'resilience',
    pitch: 'Rejouer une requête dix fois doit avoir le même effet que l’exécuter une seule fois.',
    art: 'un tampon encreur qui frappe dix fois la même case d’un formulaire, une seule marque visible',
  },
  {
    slug: 'conway',
    title: 'La loi de Conway',
    en: 'Conway’s Law',
    cat: 'equipe',
    pitch: 'Ton architecture finit toujours par ressembler à ton organigramme.',
    art: 'un organigramme dont les cases se transforment en serveurs reliés par des câbles',
  },
  {
    slug: 'cqrs',
    title: 'CQRS',
    en: 'Command Query Responsibility Segregation',
    cat: 'donnees',
    pitch: 'Séparer le modèle qui écrit du modèle qui lit, et laisser chacun être bon dans son rôle.',
    art: 'une route qui se sépare en deux voies, l’une pour des camions qui livrent, l’autre pour des lecteurs de journaux',
  },
  {
    slug: 'circuit-breaker',
    title: 'Circuit Breaker',
    en: 'Circuit Breaker Pattern',
    cat: 'resilience',
    pitch: 'Arrêter d’appeler un service qui tombe, pour qu’il ne t’entraîne pas dans sa chute.',
    art: 'un disjoncteur électrique géant, levier abaissé, petites étincelles autour',
  },
  {
    slug: 'outbox',
    title: 'Transactional Outbox',
    en: 'Transactional Outbox',
    cat: 'distribue',
    pitch: 'Écrire en base et publier un événement sans jamais perdre l’un ou l’autre.',
    art: 'une boîte aux lettres posée sur une armoire à dossiers, des enveloppes qui s’en échappent',
  },
  {
    slug: 'n-plus-un',
    title: 'Le problème N+1',
    en: 'N+1 Query Problem',
    cat: 'donnees',
    pitch: 'Une requête pour la liste, puis une par élément : la page qui rame sans raison apparente.',
    art: 'un serveur de restaurant épuisé qui fait cent allers-retours pour apporter cent couverts',
  },
  {
    slug: 'crypto-shredding',
    title: 'Crypto Shredding',
    en: 'Crypto Shredding',
    cat: 'securite',
    pitch: 'Effacer une donnée partout, même dans les backups, en détruisant seulement sa clé.',
    art: 'une clé ancienne passée dans un broyeur à papier, des confettis de lettres chiffrées',
  },
  {
    slug: 'expand-contract',
    title: 'Expand and Contract',
    en: 'Parallel Change',
    cat: 'migration',
    pitch: 'Changer un schéma ou une API sans casser personne : élargir, migrer, puis resserrer.',
    art: 'un accordéon à moitié déplié posé sur une pile de tables de base de données',
  },
  {
    slug: 'rate-limiting',
    title: 'Rate Limiting',
    en: 'Rate Limiting · Token Bucket',
    cat: 'resilience',
    pitch: 'Dire non poliment avant que le trafic ne te dise non brutalement.',
    art: 'un seau percé qui laisse tomber des jetons un par un dans un entonnoir',
  },
  {
    slug: 'sharding',
    title: 'Sharding',
    en: 'Horizontal Partitioning',
    cat: 'donnees',
    pitch: 'Découper une base trop grosse en morceaux qui vivent sur des machines différentes.',
    art: 'un grand vase de porcelaine brisé en fragments, chaque fragment posé sur un serveur',
  },
  {
    slug: 'brooks',
    title: 'La loi de Brooks',
    en: 'Brooks’s Law',
    cat: 'equipe',
    pitch: 'Ajouter des gens à un projet en retard le met encore plus en retard.',
    art: 'une foule de maçons qui se marchent dessus autour d’un seul petit mur de briques',
  },
  {
    slug: 'saga',
    title: 'Saga',
    en: 'Saga Pattern',
    cat: 'distribue',
    pitch: 'Une transaction répartie sur plusieurs services, avec un plan de repli à chaque étape.',
    art: 'une rangée de dominos qui tombent, dont les derniers se relèvent dans l’autre sens',
  },
  {
    slug: 'cache-stampede',
    title: 'La ruée vers le cache',
    en: 'Cache Stampede',
    cat: 'resilience',
    pitch: 'Une clé chaude expire, et mille requêtes foncent en même temps sur la base.',
    art: 'un troupeau de bisons qui charge vers un petit coffre-fort ouvert',
    body: {
      problem: [
        'Ta page d’accueil est servie depuis un cache Redis avec un TTL de cinq minutes. Ça tient très bien la charge… jusqu’à la seconde où la clé expire en plein pic.',
        'À cet instant, les mille requêtes en vol ratent toutes le cache **en même temps**. Elles partent toutes recalculer la même valeur sur la base, qui sature. Le recalcul devient plus lent, donc encore plus de requêtes s’empilent, et parfois le cache ne se remplit jamais parce que la base timeout. On parle aussi de **thundering herd** ou de **dogpile effect**.',
      ],
      principle: [
        'Le problème n’est pas le cache, c’est l’**absence de coordination** au moment du miss. Toutes les solutions reviennent à une idée : une seule requête recalcule, les autres patientent ou se contentent d’une valeur un peu périmée.',
      ],
      diagram: 'stampede',
      steps: [
        ['Verrou / single-flight', 'Au miss, la requête tente de prendre un verrou (`SET lock:key NX PX 5000`). Celle qui l’obtient recalcule, les autres attendent un court instant puis relisent le cache. En local, `singleflight` en Go fait la même chose dans un process.'],
        ['Stale-while-revalidate', 'On garde la valeur après expiration et on la sert pendant qu’un seul worker la rafraîchit en tâche de fond. C’est aussi une directive HTTP : `Cache-Control: max-age=60, stale-while-revalidate=300`.'],
        ['Expiration anticipée probabiliste', 'Chaque lecture a une probabilité croissante de recalculer **avant** l’expiration (algorithme XFetch). Les recalculs s’étalent naturellement, sans verrou.'],
        ['Jitter sur les TTL', 'Ajouter un aléa (ex. 300 s ± 10 %) pour que des milliers de clés créées au même moment n’expirent pas toutes à la même seconde. Sinon on parle d’**avalanche**.'],
      ],
      pros: [
        'La base ne voit plus qu’un recalcul par clé, quelle que soit la charge.',
        'Le stale-while-revalidate garde une latence plate pour l’utilisateur.',
        'Le jitter et l’expiration anticipée ne coûtent presque rien à mettre en place.',
      ],
      cons: [
        'Un verrou distribué a ses propres pièges : que se passe-t-il si celui qui le détient crashe ? (d’où le TTL sur le verrou).',
        'Servir du périmé est un choix métier : acceptable pour une home, pas pour un solde bancaire.',
        'Les requêtes qui attendent le verrou consomment des connexions et des threads pendant ce temps.',
      ],
      examples: [
        'Nginx : `proxy_cache_lock on;` et `proxy_cache_use_stale updating;` règlent le problème devant n’importe quelle app.',
        'Varnish fait du request coalescing par défaut : une seule requête part vers le backend pour un même objet.',
        'Le jour du Black Friday, la page produit la plus vue est le cas d’école.',
      ],
      interview: [
        'Ta clé la plus chaude expire à 20 h pile pendant le pic de trafic. Que se passe-t-il, et comment l’éviter ?',
        'Tu poses un verrou distribué dans Redis : que se passe-t-il si le process qui le détient meurt ?',
        'Quelle différence entre cache stampede, cache avalanche et cache penetration ?',
      ],
    },
  },
  {
    slug: 'consistent-hashing',
    title: 'Consistent Hashing',
    en: 'Consistent Hashing',
    cat: 'donnees',
    pitch: 'Répartir des clés sur des serveurs sans tout redistribuer quand on en ajoute un.',
    art: 'un grand cadran d’horloge circulaire sur lequel sont posés de petits serveurs',
  },
  {
    slug: 'canary',
    title: 'Canary Release',
    en: 'Canary Deployment',
    cat: 'migration',
    pitch: 'Envoyer la nouvelle version à 1 % du trafic, et regarder si le canari chante encore.',
    art: 'un canari dans une petite cage suspendue à l’entrée d’une mine, une lampe de mineur à côté',
  },
  {
    slug: 'depot-fichier',
    title: 'Dépôt de fichiers',
    en: 'Secure Upload · Quarantine, ClamAV, CDR',
    cat: 'securite',
    pitch: 'Accepter des fichiers d’inconnus sans laisser entrer le loup : quarantaine, antivirus, désarmement.',
    art: 'un colis posé dans une cage de verre, traversé par un faisceau de scanner',
  },
  {
    slug: 'event-sourcing',
    title: 'Event Sourcing',
    en: 'Event Sourcing',
    cat: 'donnees',
    pitch: 'Ne plus stocker l’état, mais la suite d’événements qui y a mené.',
    art: 'un long ruban de bande magnétique qui se déroule, chaque segment marqué d’un symbole',
  },
  {
    slug: 'tracing',
    title: 'Tracing distribué',
    en: 'Distributed Tracing',
    cat: 'distribue',
    pitch: 'Suivre une requête de service en service pour savoir où passent les millisecondes.',
    art: 'une loupe qui suit un fil rouge tendu entre plusieurs serveurs',
  },
  {
    slug: 'backpressure',
    title: 'Backpressure',
    en: 'Backpressure',
    cat: 'resilience',
    pitch: 'Quand le consommateur sature, il doit pouvoir dire au producteur de ralentir.',
    art: 'un tuyau d’arrosage avec un nœud, la pression qui le fait gonfler en amont',
  },
  {
    slug: 'geo',
    title: 'Géo Trouve Tout',
    en: 'Geospatial Indexing · Geohash, Quadtree',
    cat: 'donnees',
    pitch: 'Trouver les dix livreurs les plus proches parmi un million, sans calculer un million de distances.',
    art: 'une carte découpée en carrés imbriqués de plus en plus petits, une épingle au centre',
  },
  {
    slug: 'dora',
    title: 'Les métriques DORA',
    en: 'DORA Metrics',
    cat: 'equipe',
    pitch: 'Quatre chiffres pour savoir si ton équipe livre vite et bien, ou juste vite.',
    art: 'le tableau de bord d’une voiture ancienne avec quatre cadrans à aiguille',
  },
  {
    slug: 'monolithe-modulaire',
    title: 'Monolithe modulaire',
    en: 'Modular Monolith',
    cat: 'migration',
    pitch: 'Des frontières de microservices, sans le réseau entre elles.',
    art: 'un grand bloc de pierre taillé en compartiments, comme une boîte à outils',
  },
  {
    slug: 'cap',
    title: 'Le théorème CAP',
    en: 'CAP Theorem',
    cat: 'donnees',
    pitch: 'Quand le réseau se coupe, il faut choisir : répondre faux, ou ne pas répondre.',
    art: 'un triangle dont les trois sommets portent une balance, une lampe allumée et une prise débranchée',
  },
];

// Schémas des pages détaillées. Les couleurs passent par des classes (.k-ink, .k-new, .k-old, .k-hot)
// définies dans styles.css, pour suivre la palette.
const DIAGRAMS = {
  strangler: `
<svg viewBox="0 0 640 330" role="img" aria-label="Une façade route le trafic vers le legacy ou les nouveaux services">
  <g class="k-ink">
    <rect x="12" y="140" width="92" height="50" rx="2"/>
    <text x="58" y="170">Client</text>
    <path d="M104 165 H170" class="k-arrow"/>
    <rect x="170" y="120" width="110" height="90" rx="2"/>
    <text x="225" y="160">Façade</text>
    <text x="225" y="180" class="k-small">proxy · gateway</text>
  </g>
  <g class="k-old">
    <rect x="360" y="16" width="268" height="148" rx="2"/>
    <text x="494" y="40" class="k-head">Legacy</text>
    <rect x="378" y="58" width="112" height="40"/><text x="434" y="83">Compte</text>
    <rect x="498" y="58" width="112" height="40"/><text x="554" y="83">Facturation</text>
    <rect x="378" y="106" width="112" height="40" class="k-dead"/><text x="434" y="131" class="k-dead-t">Catalogue</text>
    <rect x="498" y="106" width="112" height="40" class="k-dead"/><text x="554" y="131" class="k-dead-t">Commandes</text>
  </g>
  <g class="k-new">
    <rect x="360" y="196" width="268" height="118" rx="2"/>
    <text x="494" y="220" class="k-head">Nouveau système</text>
    <rect x="378" y="238" width="112" height="56"/><text x="434" y="271">Catalogue</text>
    <rect x="498" y="238" width="112" height="56"/><text x="554" y="271">Commandes</text>
  </g>
  <path d="M280 150 C320 150 320 90 360 90" class="k-arrow k-old-s"/>
  <path d="M280 180 C320 180 320 255 360 255" class="k-arrow k-new-s"/>
  <text x="296" y="104" class="k-small k-old-t">/compte, /factures</text>
  <text x="296" y="234" class="k-small k-new-t">/catalogue, /commandes</text>
</svg>`,
  stampede: `
<svg viewBox="0 0 640 330" role="img" aria-label="Sans coordination, mille requêtes ratent le cache ; avec un verrou, une seule recalcule">
  <text x="160" y="22" class="k-head k-hot-t">Sans coordination</text>
  <text x="480" y="22" class="k-head k-new-t">Avec verrou / single-flight</text>
  <g class="k-ink">
    <g class="k-reqs">
      <circle cx="40" cy="70" r="7"/><circle cx="40" cy="100" r="7"/><circle cx="40" cy="130" r="7"/>
      <circle cx="40" cy="160" r="7"/><circle cx="40" cy="190" r="7"/>
      <circle cx="360" cy="70" r="7"/><circle cx="360" cy="100" r="7"/><circle cx="360" cy="130" r="7"/>
      <circle cx="360" cy="160" r="7"/><circle cx="360" cy="190" r="7"/>
    </g>
    <rect x="120" y="100" width="80" height="60" rx="2"/>
    <text x="160" y="126">Cache</text><text x="160" y="146" class="k-small k-hot-t">MISS ×1000</text>
    <rect x="440" y="100" width="80" height="60" rx="2"/>
    <text x="480" y="126">Cache</text><text x="480" y="146" class="k-small">MISS</text>
  </g>
  <g class="k-arrow k-ink-s">
    <path d="M48 70 L120 115"/><path d="M48 100 L120 122"/><path d="M48 130 L120 130"/>
    <path d="M48 160 L120 138"/><path d="M48 190 L120 145"/>
    <path d="M368 70 L440 115"/><path d="M368 100 L440 122"/><path d="M368 130 L440 130"/>
    <path d="M368 160 L440 138"/><path d="M368 190 L440 145"/>
  </g>
  <g class="k-arrow k-hot-s">
    <path d="M140 160 L140 240"/><path d="M155 160 L155 240"/><path d="M170 160 L170 240"/><path d="M185 160 L185 240"/>
  </g>
  <path d="M480 160 L480 240" class="k-arrow k-new-s"/>
  <text x="560" y="135" class="k-small">les autres</text><text x="560" y="150" class="k-small">attendent</text>
  <g class="k-hot">
    <rect x="100" y="240" width="120" height="64" rx="2"/>
    <text x="160" y="268">Base</text><text x="160" y="288" class="k-small">CPU 100 %</text>
  </g>
  <g class="k-new">
    <rect x="420" y="240" width="120" height="64" rx="2"/>
    <text x="480" y="268">Base</text><text x="480" y="288" class="k-small">1 recalcul</text>
  </g>
</svg>`,
};
