// Données du calendrier. Un objet par jour, dans l'ordre d'ouverture (jour 1 en premier).
//
// - cat      : une des clés de CATEGORIES
// - en       : nom anglais, affiché en sous-titre cobalt
// - pitch    : une phrase, affichée sous le titre dans la page d'explication
// - art      : idée d'illustration, à injecter dans le prompt de génération (voir PROMPTS.md)
// - cell     : optionnel, index de la case de SHEET à utiliser. Par défaut le jour N prend la case
//              N-1, et on boucle sur les cases s'il y en a moins que de jours.
// - body     : contenu détaillé. Absent = page « bientôt » avec le pitch seul.
//              Dans les textes, `code`, **gras** et *italique* sont reconnus.

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
    why: 'Sur la jaquette, un figuier étrangleur a poussé sur un vieil ordinateur à bandes. Il enlace son hôte, prend racine à côté, et finit par tenir debout seul quand la machine s’effrite : exactement ce que fait le nouveau système autour du legacy.',
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
    why: 'Sur la jaquette, un tampon frappe encore et encore la même case, mais il ne reste qu’une seule marque. Rejouer l’opération ne change rien au résultat : c’est toute la définition.',
    body: {
      problem: [
        'Ton utilisateur valide un paiement depuis son téléphone, dans le métro. Le serveur reçoit la requête, débite la carte… et la connexion coupe avant que la réponse n’arrive. L’app ne sait pas si ça a marché, alors elle retente. Résultat : deux débits.',
        'Et ce n’est pas un cas rare : les clients HTTP retentent, les load balancers retentent, les files de messages livrent **au moins une fois**. Dans un système distribué, les doublons ne sont pas une anomalie, c’est le fonctionnement normal.',
      ],
      principle: [
        'Une opération est **idempotente** si l’exécuter une fois ou dix fois produit le même effet. Par définition HTTP, `GET`, `PUT` et `DELETE` le sont ; `POST` ne l’est pas.',
        'Pour rendre un `POST` idempotent, le client envoie une **clé d’idempotence** (header `Idempotency-Key`), unique par intention. Le serveur enregistre la clé avec le résultat. Si la même clé revient, il ne refait rien : il rejoue la réponse stockée.',
      ],
      diagram: 'idempotence',
      steps: [
        ['Générer la clé côté client', 'Un UUID par intention de l’utilisateur, **pas par tentative** : le retry doit réutiliser la même clé.'],
        ['Réserver la clé avant d’agir', 'Insérer la clé avec un statut « en cours » sous contrainte d’unicité (`INSERT … ON CONFLICT DO NOTHING`). Si l’insert échoue, quelqu’un traite déjà ou a déjà traité.'],
        ['Rejouer la réponse', 'Clé connue et terminée : renvoyer exactement la réponse stockée (même code, même corps). Clé en cours : `409`, le client réessaie un peu plus tard.'],
        ['Vérifier et expirer', 'Même clé avec un payload différent : erreur `422`, c’est un bug client. Purger les clés après 24 h environ.'],
      ],
      pros: [
        'Les retries deviennent sans danger, côté client comme côté infrastructure.',
        'Une livraison « au moins une fois » devient, en pratique, un effet « une seule fois ».',
        'Les clients restent simples : en cas de doute, ils retentent.',
      ],
      cons: [
        'Il faut stocker les clés et leurs réponses, et gérer leur expiration.',
        'Deux requêtes concurrentes avec la même clé doivent être sérialisées, sinon le double traitement revient par la fenêtre.',
        'Les effets de bord externes (e-mail, appel à un partenaire) doivent eux aussi être protégés, sinon ils partent deux fois.',
      ],
      examples: [
        'Stripe : toutes les requêtes `POST` acceptent un header `Idempotency-Key`, conservé 24 h.',
        'Un consommateur Kafka qui garde la table des identifiants de messages déjà traités, dans la même transaction que l’effet métier.',
        'Préférer les écritures naturellement idempotentes : `SET status = \'paid\'` se rejoue sans risque, `balance = balance - 10` non.',
      ],
      interview: [
        'Comment éviter de débiter deux fois un client quand l’app mobile retente après un timeout ?',
        'Que se passe-t-il si deux requêtes avec la même clé arrivent en même temps sur deux serveurs ?',
        'Quelle différence entre idempotence et livraison « exactly-once » ?',
      ],
    },
  },
  {
    slug: 'conway',
    title: 'La loi de Conway',
    en: 'Conway’s Law',
    cat: 'equipe',
    pitch: 'Ton architecture finit toujours par ressembler à ton organigramme.',
    art: 'un organigramme dont les cases se transforment en serveurs reliés par des câbles',
    why: 'Sur la jaquette, le soleil se reflète dans la rivière, trait pour trait. Un système fait pareil avec l’organisation qui le construit : il en renvoie l’image fidèle, frontières et silences compris.',
    body: {
      problem: [
        'Tu as une équipe front, une équipe back et une équipe base de données. Chaque nouvelle feature traverse les trois backlogs, trois priorités, trois plannings. Et ton architecture ? Trois couches bien séparées, avec des contrats lourds entre elles.',
        'Ce n’est pas un hasard. L’architecture n’est pas seulement un choix technique : elle se moule sur la façon dont les gens se parlent.',
      ],
      principle: [
        'Melvin Conway l’a formulé en 1967 : une organisation qui conçoit un système produit une architecture qui **copie sa structure de communication**. Les frontières entre modules se placent là où la coordination entre équipes coûte cher.',
        'La conséquence pratique s’appelle la **manœuvre de Conway inversée** : si tu veux une architecture, dessine d’abord les équipes qui la produiront. C’est le cœur de l’approche Team Topologies.',
      ],
      diagram: 'conway',
      steps: [
        ['Cartographier', 'Qui doit parler à qui pour livrer une feature typique ? Les dépendances entre équipes sont tes vraies frontières d’architecture.'],
        ['Comparer à la cible', 'Si l’architecture visée découpe par domaine métier et les équipes par couche technique, l’une des deux finira par gagner, et ce sera l’organisation.'],
        ['Aligner les équipes sur les domaines', 'Une équipe par flux de valeur (catalogue, commande, paiement), qui possède son code de bout en bout.'],
        ['Réduire les dépendances restantes', 'Contrats d’API explicites, équipe plateforme pour l’outillage commun, et le moins possible de releases coordonnées.'],
      ],
      pros: [
        'Des équipes autonomes, qui livrent sans attendre les autres.',
        'Un ownership clair : chaque service a une équipe responsable.',
        'Moins de réunions de synchronisation, parce que la frontière d’équipe est aussi une frontière de code.',
      ],
      cons: [
        'Une réorganisation coûte cher et prend du temps, bien plus qu’un refactoring.',
        'Si les domaines sont mal compris au départ, on fige un mauvais découpage dans l’organigramme.',
        'Les équipes transverses (plateforme, sécurité, data) deviennent vite des goulots si elles ne livrent pas en libre-service.',
      ],
      examples: [
        'Les « two-pizza teams » d’Amazon : chaque équipe possède son service et son API, c’est l’organisation qui a produit l’architecture.',
        'Un monolithe partagé par dix équipes sans frontières : files de merge interminables et releases du vendredi soir.',
        'Une migration vers des microservices qui garde les équipes par couche : on obtient un monolithe distribué.',
      ],
      interview: [
        'Vos microservices obligent cinq équipes à livrer ensemble à chaque release. Pourquoi, et que changeriez-vous ?',
        'Comment découperiez-vous les équipes pour un nouveau produit de zéro ?',
        'Qu’est-ce que la manœuvre de Conway inversée, et quelles en sont les limites ?',
      ],
    },
  },
  {
    slug: 'cqrs',
    title: 'CQRS',
    en: 'Command Query Responsibility Segregation',
    cat: 'donnees',
    pitch: 'Séparer le modèle qui écrit du modèle qui lit, et laisser chacun être bon dans son rôle.',
    art: 'une route qui se sépare en deux voies, l’une pour des camions qui livrent, l’autre pour des lecteurs de journaux',
    why: 'Sur la jaquette, un cargo spatial a deux flancs : d’un côté des navettes déchargent le fret, de l’autre des passagers regardent tranquillement les étoiles. Un seul vaisseau, deux usages qui ne se gênent pas, l’écriture d’un côté et la lecture de l’autre.',
    body: {
      problem: [
        'Le même modèle sert à écrire (règles métier, invariants, transactions) et à lire (écrans, recherches, tableaux de bord qui agrègent cinq tables). Il devient un compromis qui ne satisfait personne : jointures lentes en lecture, entités tordues pour coller aux écrans en écriture.',
        'Et la charge est asymétrique : tu lis souvent cent fois plus que tu n’écris, mais tu dois tout scaler ensemble.',
      ],
      principle: [
        'CQRS sépare les **commandes**, qui changent l’état et ne renvoient presque rien, des **requêtes**, qui lisent et ne changent rien. Côté écriture, un modèle de domaine normalisé, centré sur les règles. Côté lecture, des **projections** dénormalisées, taillées pour chaque écran, éventuellement dans un autre moteur (Elasticsearch, Redis).',
        'Les deux côtés se synchronisent par des événements. La lecture est donc **cohérente à terme** : elle a un léger retard sur l’écriture.',
      ],
      diagram: 'cqrs',
      steps: [
        ['Séparer dans le code', 'Des classes de commande et de requête distinctes, sur la même base. Souvent, ça suffit déjà à clarifier le modèle.'],
        ['Projections dédiées', 'Des vues ou tables de lecture construites pour un écran donné (vues matérialisées, tables dénormalisées).'],
        ['Stores séparés', 'Le modèle d’écriture publie des événements, des projecteurs alimentent les modèles de lecture dans le moteur adapté.'],
        ['Gérer le décalage', 'L’utilisateur doit voir sa propre modification : lire son écriture côté écriture, ou attendre la version de la projection.'],
      ],
      pros: [
        'Des lectures rapides et simples : la donnée est déjà dans la forme de l’écran.',
        'Lecture et écriture se dimensionnent indépendamment.',
        'Le modèle d’écriture reste centré sur le métier, sans compromis pour l’affichage.',
      ],
      cons: [
        'La cohérence à terme se voit : « j’ai enregistré mais ma liste n’a pas changé ».',
        'Plus de pièces à opérer : projecteurs, reconstruction des projections, supervision du retard.',
        'Pour un CRUD simple, c’est de la complexité sans bénéfice.',
      ],
      examples: [
        'Un e-commerce : commandes dans Postgres, catalogue de recherche dans Elasticsearch alimenté par CDC.',
        'Une vue matérialisée Postgres rafraîchie régulièrement pour un tableau de bord : c’est déjà du CQRS léger.',
        'CQRS est souvent associé à l’Event Sourcing, mais les deux sont indépendants.',
      ],
      interview: [
        'Dans quel cas CQRS est-il une mauvaise idée ?',
        'L’utilisateur ne voit pas sa modification juste après l’avoir faite : comment le gérer ?',
        'CQRS implique-t-il l’Event Sourcing ?',
      ],
    },
  },
  {
    slug: 'circuit-breaker',
    title: 'Circuit Breaker',
    en: 'Circuit Breaker Pattern',
    cat: 'resilience',
    pitch: 'Arrêter d’appeler un service qui tombe, pour qu’il ne t’entraîne pas dans sa chute.',
    art: 'un disjoncteur électrique géant, levier abaissé, petites étincelles autour',
    why: 'Sur la jaquette, une flamme seule dans le noir. Quand un service tombe et que tout le monde continue de l’appeler, l’incendie se propage de proche en proche : le disjoncteur coupe avant que tout brûle.',
    body: {
      problem: [
        'Le service de paiement ne tombe pas : il devient lent, avec des réponses à trente secondes. Tous tes threads restent bloqués à l’attendre, ton pool de connexions sature, et c’est maintenant **ton** service qui ne répond plus. Puis celui qui t’appelle. C’est une panne en cascade.',
        'Pire : chaque client retente, ce qui envoie encore plus de trafic vers un service déjà à genoux.',
      ],
      principle: [
        'Le circuit breaker est un disjoncteur entre toi et ta dépendance. **Fermé**, les appels passent et on compte les échecs. Au-delà d’un seuil (par exemple 50 % d’échecs sur les 20 derniers appels), il **s’ouvre** : les appels échouent immédiatement, sans même partir, pendant un délai.',
        'Ensuite il passe **semi-ouvert** : quelques appels de test passent. S’ils réussissent, le circuit se referme ; sinon il se rouvre. Pendant que c’est ouvert, tu sers un **fallback**.',
      ],
      diagram: 'circuit',
      steps: [
        ['D’abord des timeouts', 'Sans timeout court sur chaque appel, aucun disjoncteur ne te sauvera : un appel qui pend ne compte jamais comme un échec.'],
        ['Un seuil sur fenêtre glissante', 'Taux d’échec et appels lents sur les N derniers appels, avec un nombre minimum d’appels pour ne pas s’ouvrir sur deux erreurs.'],
        ['Un fallback utile', 'Valeur en cache, réponse par défaut, ou fonctionnalité masquée. Échouer vite vaut mieux qu’échouer lentement.'],
        ['Observer les transitions', 'Chaque ouverture est un signal à remonter dans les métriques et les alertes.'],
      ],
      pros: [
        'Échec rapide : tes ressources ne restent pas bloquées sur une dépendance malade.',
        'La dépendance respire : on arrête de la bombarder pendant qu’elle récupère.',
        'Dégradation gracieuse : la page s’affiche, sans le bloc qui dépend du service en panne.',
      ],
      cons: [
        'Le réglage des seuils est délicat : trop sensible, il s’ouvre pour rien ; trop lâche, il ne protège pas.',
        'Il ne remplace ni les timeouts ni l’isolation des ressources (bulkhead).',
        'L’état est souvent par instance : chaque pod a son propre disjoncteur, avec des comportements différents.',
      ],
      examples: [
        'Resilience4j en Java, Polly en .NET, et Hystrix chez Netflix, qui a popularisé le pattern.',
        'Envoy et les service meshes le font au niveau réseau (outlier detection).',
        'Une page produit qui masque le bloc « avis clients » quand le service d’avis est ouvert.',
      ],
      interview: [
        'Quelle différence entre un retry et un circuit breaker, et comment les combiner ?',
        'Que renvoyer à l’utilisateur quand le circuit est ouvert ?',
        'Pourquoi le combiner avec un bulkhead ?',
      ],
    },
  },
  {
    slug: 'outbox',
    title: 'Transactional Outbox',
    en: 'Transactional Outbox',
    cat: 'distribue',
    pitch: 'Écrire en base et publier un événement sans jamais perdre l’un ou l’autre.',
    art: 'une boîte aux lettres posée sur une armoire à dossiers, des enveloppes qui s’en échappent',
    why: 'Sur la jaquette, un naufragé écrit son journal et glisse chaque fois une copie dans une bouteille. Les bouteilles attendent sur le sable que la marée les emporte : le journal et le message sont écrits ensemble, l’envoi vient après, sans rien perdre.',
    body: {
      problem: [
        'Ton service crée une commande en base, puis publie `OrderCreated` sur Kafka pour que la facturation et la logistique suivent. Si le process crashe entre les deux, la commande existe mais personne n’est prévenu. Si tu publies d’abord, l’événement peut partir pour une commande jamais enregistrée.',
        'C’est le problème du **dual write** : deux systèmes, pas de transaction commune. Une transaction distribuée (2PC) entre la base et le broker est rarement disponible, et rarement souhaitable.',
      ],
      principle: [
        'On écrit l’événement dans une table `outbox` **dans la même transaction** que la donnée métier. Soit les deux sont enregistrés, soit aucun.',
        'Un **relais** séparé lit ensuite l’outbox et publie les événements sur le broker, puis les marque comme envoyés. Il peut interroger la table à intervalles réguliers (polling) ou lire le journal de la base (CDC).',
      ],
      diagram: 'outbox',
      steps: [
        ['Créer la table', '`outbox(id, aggregate_id, type, payload, created_at)` : l’événement tel qu’il sera publié.'],
        ['Écrire dans la même transaction', 'L’insert dans `orders` et l’insert dans `outbox` partagent le même `COMMIT`.'],
        ['Publier avec un relais', 'Polling avec `SELECT … FOR UPDATE SKIP LOCKED`, ou CDC avec Debezium qui lit le WAL. Dans l’ordre, par agrégat.'],
        ['Rendre les consommateurs idempotents', 'Le relais peut publier deux fois (crash entre l’envoi et le marquage) : c’est une livraison au moins une fois.'],
      ],
      pros: [
        'L’atomicité est garantie : pas de commande sans événement, ni l’inverse.',
        'Pas de transaction distribuée, seulement une transaction locale classique.',
        'L’ordre des événements d’un même agrégat est préservé.',
      ],
      cons: [
        'Les doublons sont possibles : tous les consommateurs doivent être idempotents.',
        'Un peu de latence entre l’écriture et la publication, selon le relais.',
        'Une table qui grossit et un relais de plus à opérer et à superviser.',
      ],
      examples: [
        'Debezium et son « Outbox Event Router », qui transforme les lignes de l’outbox en messages Kafka.',
        'Un relais maison : un worker qui publie les lignes non envoyées toutes les secondes.',
        'Le pendant côté consommateur est l’**inbox** : on enregistre les identifiants de messages reçus pour dédupliquer.',
      ],
      interview: [
        'Pourquoi ne pas simplement publier l’événement puis écrire en base ?',
        'Comment garantir l’ordre des événements d’une même commande ?',
        'Le relais publie deux fois le même événement : que se passe-t-il, et qui doit le gérer ?',
      ],
    },
  },
  {
    slug: 'n-plus-un',
    title: 'Le problème N+1',
    en: 'N+1 Query Problem',
    cat: 'donnees',
    pitch: 'Une requête pour la liste, puis une par élément : la page qui rame sans raison apparente.',
    art: 'un serveur de restaurant épuisé qui fait cent allers-retours pour apporter cent couverts',
    why: 'Sur la jaquette, un ascenseur monte une seule enveloppe à la fois pendant que la file attend en bas. Un aller-retour par élément au lieu d’un seul voyage chargé : c’est le N+1.',
    body: {
      problem: [
        'Ta page liste 50 articles avec le nom de leur auteur. L’ORM fait une requête pour les articles, puis, à chaque fois que le template affiche `article.author.name`, une requête de plus pour charger l’auteur. Total : 51 requêtes.',
        'En dev, avec trois articles et une base locale, c’est invisible. En prod, chaque requête coûte un aller-retour réseau, et la page met deux secondes sans qu’aucune requête ne soit lente individuellement.',
      ],
      principle: [
        'On charge les relations **en bloc** au lieu de les charger une par une. Soit par une jointure (eager loading), soit par une deuxième requête qui récupère tous les auteurs d’un coup : `WHERE id IN (…)`.',
        'On passe de N+1 requêtes à une ou deux, quel que soit le nombre de lignes.',
      ],
      diagram: 'nplus1',
      steps: [
        ['Détecter', 'Compter les requêtes par requête HTTP : profiler Symfony, Django Debug Toolbar, Bullet pour Rails, ou l’APM en prod.'],
        ['Charger en avance', 'Jointure explicite : `JOIN FETCH` en Doctrine, `select_related` en Django, `include` en Prisma.'],
        ['Ou charger par lot', 'Une seconde requête `IN` pour les collections : `prefetch_related` en Django, DataLoader en GraphQL.'],
        ['Verrouiller par un test', 'Un test qui vérifie le nombre de requêtes d’un endpoint empêche la régression.'],
      ],
      pros: [
        'La latence de la page ne dépend plus du nombre de lignes.',
        'La charge sur la base chute, souvent d’un ordre de grandeur.',
        'La correction est généralement locale : une ligne dans le repository.',
      ],
      cons: [
        'Joindre plusieurs collections à la fois crée un produit cartésien : beaucoup de lignes dupliquées à hydrater.',
        'Pagination et jointure de collection ne font pas bon ménage : le `LIMIT` s’applique aux lignes jointes, pas aux entités.',
        'Charger trop en avance ramène des données dont la page n’a pas besoin.',
      ],
      examples: [
        'Doctrine : `->leftJoin(\'a.author\', \'u\')->addSelect(\'u\')` sur le QueryBuilder.',
        'GraphQL : un resolver `author` par article est un N+1 par construction, DataLoader regroupe les appels.',
        'La version la plus chère : un N+1 en appels HTTP entre microservices, avec 50 ms par appel.',
      ],
      interview: [
        'Comment repérer un N+1 en production ?',
        'Jointure ou requête `IN` séparée : comment choisir ?',
        'Comment éviter un N+1 dans un resolver GraphQL ?',
      ],
    },
  },
  {
    slug: 'crypto-shredding',
    title: 'Crypto Shredding',
    en: 'Crypto Shredding',
    cat: 'securite',
    pitch: 'Effacer une donnée partout, même dans les backups, en détruisant seulement sa clé.',
    art: 'une clé ancienne passée dans un broyeur à papier, des confettis de lettres chiffrées',
    why: 'Sur la jaquette, une silhouette jette une clé au feu au milieu d’une salle remplie de coffres. On ne vide aucun coffre : sans la clé, ils resteront scellés pour toujours, sauvegardes comprises.',
    body: {
      problem: [
        'Un utilisateur exerce son droit à l’effacement (RGPD, article 17). Facile dans la table `users`. Mais ses données sont aussi dans les réplicas, dans trente jours de backups, dans les logs, dans le data lake, dans un topic Kafka et dans un event store **qui n’autorise que l’ajout**.',
        'Réécrire chaque backup pour en retirer une personne est irréaliste. Et un event store immuable, par définition, ne se modifie pas.',
      ],
      principle: [
        'On chiffre les données personnelles de chaque utilisateur avec **sa propre clé**, stockée à part, dans un coffre (KMS, Vault). Partout ailleurs, on ne stocke que du chiffré.',
        'Pour effacer, on **détruit la clé**. Toutes les copies, y compris les backups et les événements immuables, deviennent du bruit illisible. On n’a rien eu à réécrire.',
      ],
      diagram: 'shredding',
      steps: [
        ['Une clé par personne', 'Une data key par utilisateur, elle-même chiffrée par une clé maître du KMS (envelope encryption).'],
        ['Chiffrer avant de stocker', 'Au niveau applicatif, champ par champ : e-mail, nom, adresse. Le reste de la donnée peut rester en clair.'],
        ['Garder les clés hors des backups de données', 'Le coffre a son propre cycle de vie : si les clés sont sauvegardées avec les données, détruire la clé ne sert à rien.'],
        ['Effacer et prouver', 'Supprimer la clé, journaliser l’opération, et vérifier que la clé a aussi disparu des sauvegardes du coffre après leur rétention.'],
      ],
      pros: [
        'L’effacement couvre toutes les copies, y compris celles qu’on ne peut pas modifier.',
        'Compatible avec les architectures immuables : event sourcing, logs, data lake.',
        'L’opération d’effacement est simple, rapide et facile à prouver.',
      ],
      cons: [
        'Le coffre de clés devient critique : indisponible, plus rien ne se lit ; clé perdue par erreur, donnée perdue pour de bon.',
        'On ne peut plus chercher ni indexer un champ chiffré directement (il faut un blind index, un HMAC du champ).',
        'Un coût de déchiffrement à chaque lecture, et une gestion de clés à industrialiser.',
      ],
      examples: [
        'Un event store où chaque événement contient les données personnelles chiffrées avec la clé de l’utilisateur concerné.',
        'AWS KMS, Google Cloud KMS ou le moteur Transit de Vault pour gérer les clés maîtres.',
        'Retrouver un utilisateur par e-mail : on stocke `HMAC(email)` à côté de l’e-mail chiffré et on cherche sur le HMAC.',
      ],
      interview: [
        'Comment appliquer le droit à l’oubli sur un event store immuable ?',
        'Que se passe-t-il pour les backups du coffre de clés lui-même ?',
        'Comment chercher un utilisateur par e-mail si l’e-mail est chiffré ?',
      ],
    },
  },
  {
    slug: 'expand-contract',
    title: 'Expand and Contract',
    en: 'Parallel Change',
    cat: 'migration',
    pitch: 'Changer un schéma ou une API sans casser personne : élargir, migrer, puis resserrer.',
    art: 'un accordéon à moitié déplié posé sur une pile de tables de base de données',
    why: 'Sur la jaquette, des rails neufs courent à côté des anciens, la locomotive passe l’aiguillage et des ouvriers démontent la vieille voie derrière elle. Les trois temps du pattern : les deux voies coexistent, on bascule, puis on retire l’ancienne.',
    body: {
      problem: [
        'Tu veux renommer la colonne `name` en `full_name`. Tu écris la migration, tu déploies. Pendant le rolling deploy, la moitié des pods tourne encore avec l’ancien code, qui cherche `name`… et plante.',
        'Même problème pour une API : tu changes un champ, et les vieilles versions de l’app mobile, que personne ne met à jour, cassent. Dès que deux versions cohabitent, un changement « en une fois » est un changement cassant.',
      ],
      principle: [
        'On découpe le changement en trois temps, chacun compatible avec le précédent. **Expand** : on ajoute le nouveau à côté de l’ancien, et le code écrit dans les deux. **Migrate** : on recopie l’existant (backfill), puis on bascule les lectures. **Contract** : quand plus personne n’utilise l’ancien, on le supprime.',
        'À chaque étape, l’ancienne et la nouvelle version du code fonctionnent. On peut déployer et revenir en arrière à tout moment.',
      ],
      diagram: 'expand',
      steps: [
        ['Expand', 'Migration purement additive : ajouter `full_name`, nullable, sans valeur par défaut coûteuse. Le code écrit dans `name` et `full_name`.'],
        ['Backfill', 'Recopier les anciennes lignes par lots, pour ne pas verrouiller la table ni saturer la réplication.'],
        ['Basculer les lectures', 'Le code lit `full_name`. On vérifie en prod que plus rien ne lit `name` (logs, requêtes, clients API).'],
        ['Contract', 'Arrêter d’écrire `name`, puis supprimer la colonne dans une release suivante.'],
      ],
      pros: [
        'Aucune coupure de service, même sur des tables énormes.',
        'Un retour arrière possible à chaque étape.',
        'La même méthode marche pour les schémas, les API et les formats d’événements.',
      ],
      cons: [
        'Plusieurs releases pour un seul changement : il faut de la discipline et un suivi.',
        'Le code de double écriture est temporaire, et devient de la dette si on oublie l’étape Contract.',
        'Le backfill d’une grosse table se planifie : charge, verrous, retard de réplication.',
      ],
      examples: [
        'Renommer une colonne Postgres sur une table de plusieurs centaines de millions de lignes sans coupure.',
        'Une API qui marque un champ comme déprécié, annonce une date de fin avec le header `Sunset`, puis le retire.',
        'Un format d’événement qui ajoute un champ avant que les consommateurs ne l’utilisent, et ne retire l’ancien qu’après.',
      ],
      interview: [
        'Comment renommer une colonne sur une table de 500 millions de lignes sans interruption ?',
        'Pourquoi ne pas livrer la migration et le nouveau code dans le même déploiement ?',
        'Comment sais-tu que plus personne n’utilise l’ancien champ ?',
      ],
    },
  },
  {
    slug: 'rate-limiting',
    title: 'Rate Limiting',
    en: 'Rate Limiting · Token Bucket',
    cat: 'resilience',
    pitch: 'Dire non poliment avant que le trafic ne te dise non brutalement.',
    art: 'un seau percé qui laisse tomber des jetons un par un dans un entonnoir',
    why: 'Sur la jaquette, un seau déverse ses jetons dans un entonnoir qui ne les laisse passer qu’au compte-gouttes. Peu importe la vitesse à laquelle on verse, le débit en sortie reste le même.',
    body: {
      problem: [
        'Un client buggé tourne en boucle sur ton API à 5 000 requêtes par seconde. Ou un scraper. Ou une attaque par credential stuffing sur `/login`. Sans limite, un seul appelant consomme les ressources de tous les autres.',
        'Et ce n’est pas forcément malveillant : un batch de nuit mal écrit suffit à faire tomber le service pour tout le monde.',
      ],
      principle: [
        'On limite le nombre de requêtes **par clé** (utilisateur, clé d’API, IP) et par période. Au-delà, on répond `429 Too Many Requests` avec un header `Retry-After`.',
        'L’algorithme le plus courant est le **token bucket** : un seau de capacité B se remplit de r jetons par seconde, chaque requête consomme un jeton, seau vide = refus. Il tolère des rafales courtes tout en tenant un débit moyen. Les alternatives : fenêtre fixe (simple, mais des pics aux frontières), fenêtre glissante, leaky bucket (débit de sortie constant).',
      ],
      diagram: 'ratelimit',
      steps: [
        ['Choisir la clé', 'Par utilisateur authentifié de préférence. Par IP seulement en dernier recours : des milliers de personnes peuvent partager une IP derrière un NAT.'],
        ['Choisir l’algorithme', 'Token bucket par défaut. Fenêtre glissante si tu veux une limite stricte par minute, facile à expliquer.'],
        ['Stocker les compteurs', 'Dans Redis, avec une opération atomique (script Lua, ou `INCR` + `EXPIRE` pour une fenêtre fixe), partagée par toutes les instances.'],
        ['Répondre proprement', '`429`, `Retry-After`, et les headers `RateLimit-Limit` / `RateLimit-Remaining` pour que les clients s’adaptent.'],
      ],
      pros: [
        'Protège contre les abus et les « voisins bruyants ».',
        'Garde des coûts et une capacité prévisibles.',
        'Assure l’équité entre clients, et permet des offres par palier (gratuit, payant).',
      ],
      cons: [
        'Un compteur partagé ajoute un aller-retour vers Redis à chaque requête, ou impose des approximations locales.',
        'Les faux positifs existent : NAT d’entreprise, réseaux mobiles, proxys.',
        'Il faut décider quoi faire si le stockage des compteurs tombe : tout laisser passer, ou tout refuser.',
      ],
      examples: [
        'L’API GitHub : 5 000 requêtes par heure et par token, avec les headers de quota dans chaque réponse.',
        'Nginx : `limit_req` (leaky bucket) devant n’importe quelle application.',
        'Une page de login : 5 tentatives par minute et par compte, en plus d’une limite par IP.',
      ],
      interview: [
        'Concevoir un rate limiter distribué pour un million de requêtes par seconde.',
        'Token bucket ou fenêtre fixe : quelles différences en pratique ?',
        'Que fait le rate limiter si Redis tombe ?',
      ],
    },
  },
  {
    slug: 'sharding',
    title: 'Sharding',
    en: 'Horizontal Partitioning',
    cat: 'donnees',
    pitch: 'Découper une base trop grosse en morceaux qui vivent sur des machines différentes.',
    art: 'un grand vase de porcelaine brisé en fragments, chaque fragment posé sur un serveur',
    why: 'Sur la jaquette, une station de combat s’est séparée en segments qui volent chacun de leur côté. Une seule base devenue plusieurs morceaux autonomes, chacun avec sa part de l’ensemble.',
    body: {
      problem: [
        'Ta base fait 4 To et encaisse 50 000 écritures par seconde. Le plus gros serveur du catalogue ne suffit plus. Les réplicas en lecture aident pour les lectures, mais toutes les écritures passent toujours par un seul primaire.',
      ],
      principle: [
        'On découpe les données **horizontalement** : chaque shard contient une partie des lignes et vit sur sa propre machine. Une **clé de sharding** (souvent `user_id` ou `tenant_id`) décide où va chaque ligne.',
        'Trois stratégies : par **plage** (A à F sur le shard 1…), simple mais sujette aux points chauds ; par **hash**, qui répartit bien mais rend les requêtes par plage coûteuses ; par **annuaire**, une table qui dit où se trouve chaque clé. Le routage se fait dans l’application, dans un proxy (Vitess) ou dans la base elle-même (Citus, MongoDB).',
      ],
      diagram: 'sharding',
      steps: [
        ['Choisir la clé', 'Forte cardinalité, bien répartie, et présente dans la grande majorité des requêtes. C’est la décision la plus difficile à changer.'],
        ['Choisir la répartition', 'Hash pour l’équilibre, plage si les requêtes par intervalle dominent, annuaire si tu veux déplacer des clés à la main.'],
        ['Prévoir le resharding', 'Créer beaucoup de shards logiques (par exemple 1 024) répartis sur peu de machines : on déplace des shards entiers, pas des lignes.'],
        ['Gérer le cross-shard', 'Les requêtes sans clé de sharding partent vers tous les shards (scatter-gather). À limiter, et à servir autrement si elles sont fréquentes.'],
      ],
      pros: [
        'Les écritures et le stockage montent en charge horizontalement.',
        'Une panne n’affecte qu’une partie des données.',
        'On peut placer les données près de leurs utilisateurs (un shard par région).',
      ],
      cons: [
        'Jointures et transactions entre shards : coûteuses, voire impossibles.',
        'Les shards chauds : une célébrité ou un très gros client concentre la charge sur une machine.',
        'Le resharding et l’exploitation (backups, migrations) sont multipliés par le nombre de shards.',
      ],
      examples: [
        'Instagram encode le shard logique directement dans ses identifiants.',
        'Vitess shardise MySQL chez YouTube et Slack ; Citus fait de même pour Postgres.',
        'En SaaS multi-tenant, le shard par `tenant_id` est le cas d’école : un client = un shard logique.',
      ],
      interview: [
        'Quelle clé de sharding choisirais-tu pour un réseau social ?',
        'Comment gérer un utilisateur avec 100 millions d’abonnés qui fait chauffer son shard ?',
        'Comment passer de 4 à 8 shards sans interruption ?',
      ],
    },
  },
  {
    slug: 'brooks',
    title: 'La loi de Brooks',
    en: 'Brooks’s Law',
    cat: 'equipe',
    pitch: 'Ajouter des gens à un projet en retard le met encore plus en retard.',
    art: 'une foule de maçons qui se marchent dessus autour d’un seul petit mur de briques',
    why: 'Sur la jaquette, une foule de maçons se marche dessus autour d’un petit mur qui n’avance pas. Ajouter des bras à un chantier en retard, c’est surtout ajouter des gens à coordonner.',
    body: {
      problem: [
        'Le projet a deux mois de retard. La direction ajoute quatre développeurs pour rattraper. Trois mois plus tard, le retard s’est creusé.',
      ],
      principle: [
        'Fred Brooks l’a écrit en 1975 dans *The Mythical Man-Month* : ajouter des gens à un projet logiciel en retard le retarde encore plus. Trois raisons. Les nouveaux doivent être **formés**, par les anciens, qui produisent donc moins. Les **canaux de communication** explosent : n personnes, c’est n(n−1)/2 liens à entretenir. Et beaucoup de tâches ne se **divisent** pas : neuf femmes ne font pas un bébé en un mois.',
      ],
      diagram: 'brooks',
      steps: [
        ['Réduire le périmètre', 'Le levier le plus rapide sur une date est presque toujours le scope, pas l’effectif.'],
        ['Découper avant de staffer', 'Des sous-systèmes indépendants, avec des interfaces claires, permettent à plus de gens de travailler sans se coordonner en permanence.'],
        ['Renforcer tôt, pas tard', 'Un renfort au début du projet a le temps d’être rentabilisé ; à trois semaines de la fin, il coûte plus qu’il ne rapporte.'],
        ['Protéger les experts', 'Ne pas transformer toutes les personnes clés en formateurs en même temps.'],
      ],
      pros: [
        'Un argument chiffré pour négocier le périmètre plutôt que l’effectif.',
        'Pousse à investir dans le découpage et les interfaces, qui rendent une équipe scalable.',
        'Rappelle que le coût de coordination est réel, même quand il ne se voit pas dans un planning.',
      ],
      cons: [
        'Brooks lui-même la présentait comme une simplification « scandaleusement » réductrice.',
        'Elle ne s’applique pas aux tâches réellement parallélisables, ni aux renforts qui connaissent déjà le domaine.',
        'Utilisée de travers, elle sert à refuser toute aide, même quand elle serait utile.',
      ],
      examples: [
        'Cinq freelances ajoutés en urgence : trois semaines d’onboarding pendant lesquelles l’équipe d’origine livre deux fois moins.',
        'Le noyau Linux absorbe des milliers de contributeurs parce qu’il est découpé en sous-systèmes avec leurs propres mainteneurs.',
        'Le lien avec Conway : une architecture bien découpée est ce qui permet de faire grandir une équipe sans exploser les canaux.',
      ],
      interview: [
        'Ton équipe de six a deux mois de retard et la direction propose six développeurs de plus. Que réponds-tu ?',
        'Comment l’architecture aide-t-elle une organisation à grandir ?',
        'Dans quels cas ajouter des gens fait vraiment gagner du temps ?',
      ],
    },
  },
  {
    slug: 'saga',
    title: 'Saga',
    en: 'Saga Pattern',
    cat: 'distribue',
    pitch: 'Une transaction répartie sur plusieurs services, avec un plan de repli à chaque étape.',
    art: 'une rangée de dominos qui tombent, dont les derniers se relèvent dans l’autre sens',
    why: 'Sur la jaquette, une cordée redescend prudemment vers le camp précédent après la glissade du premier. Pas de retour magique en arrière : chacun défait son étape, dans l’ordre inverse, comme les compensations d’une saga.',
    body: {
      problem: [
        'Passer une commande, c’est réserver le stock (service Stock), débiter le client (service Paiement) et planifier la livraison (service Livraison). Trois services, trois bases. Pas de transaction ACID possible entre les trois, et une transaction distribuée (2PC) serait lente, bloquante et mal supportée.',
        'Alors que faire quand la livraison échoue alors que le stock est réservé et le client déjà débité ?',
      ],
      principle: [
        'Une saga découpe la transaction en une **suite de transactions locales**, une par service. Chaque étape a une **compensation** qui annule son effet au sens métier : libérer le stock, rembourser le client. Si une étape échoue, on exécute les compensations des étapes déjà faites, dans l’ordre inverse.',
        'Deux styles : la **chorégraphie**, où chaque service réagit aux événements des autres, et l’**orchestration**, où un orchestrateur pilote les étapes et sait où en est chaque saga.',
      ],
      diagram: 'saga',
      steps: [
        ['Lister étapes et compensations', 'Pour chaque action, son annulation métier. Ce n’est pas un rollback : un remboursement reste une opération visible.'],
        ['Choisir le style', 'Orchestration pour les flux longs ou complexes (lisible, centralisé) ; chorégraphie pour deux ou trois étapes très découplées.'],
        ['Rendre tout idempotent', 'Étapes et compensations seront rejouées en cas de panne ou de doublon de message.'],
        ['Placer l’irréversible en dernier', 'Une étape impossible à compenser (envoyer un e-mail, expédier un colis) doit venir après toutes celles qui peuvent échouer.'],
      ],
      pros: [
        'Pas de verrou distribué : chaque service garde sa base et sa transaction locale.',
        'Les échecs sont modélisés explicitement, au lieu d’être cachés.',
        'Fonctionne sur des processus longs (minutes, jours), là où une transaction ne tiendrait pas.',
      ],
      cons: [
        'Pas d’isolation : les états intermédiaires sont visibles (un stock réservé puis libéré).',
        'Certaines actions ne se compensent pas, et une compensation peut elle-même échouer.',
        'Le débogage est difficile sans tracing distribué ni état de saga persistant.',
      ],
      examples: [
        'Temporal ou Camunda comme orchestrateurs de sagas.',
        'Une chorégraphie sur Kafka : `StockRéservé` déclenche le paiement, `PaiementRefusé` déclenche la libération du stock.',
        'L’exemple d’école : réserver vol, hôtel et voiture, et tout annuler si l’un échoue.',
      ],
      interview: [
        'Orchestration ou chorégraphie : comment choisir ?',
        'Que fais-tu si une compensation échoue ?',
        'Comment montrer à l’utilisateur l’état d’une commande dont la saga est en cours ?',
      ],
    },
  },
  {
    slug: 'cache-stampede',
    title: 'La ruée vers le cache',
    en: 'Cache Stampede',
    cat: 'resilience',
    pitch: 'Une clé chaude expire, et mille requêtes foncent en même temps sur la base.',
    art: 'un troupeau de bisons qui charge vers un petit coffre-fort ouvert',
    why: 'Sur la jaquette, une vallée où mène un seul chemin, comme pendant une ruée vers l’or. Le jour où le cache expire, toutes les requêtes se précipitent au même endroit en même temps, et c’est la base qui encaisse la cavalcade.',
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
    why: 'Sur la jaquette, des satellites sont répartis sur une orbite et chaque signal monte vers le prochain dans le sens de rotation. Quand un nouveau satellite s’insère, il ne récupère que les signaux de son voisin : l’anneau de hachage, vu de l’espace.',
    body: {
      problem: [
        'Tu répartis tes clés de cache sur 4 serveurs avec `serveur = hash(clé) % 4`. Simple et équilibré. Puis tu ajoutes un cinquième serveur : `hash(clé) % 5` envoie maintenant environ **80 % des clés** sur un autre serveur que la veille.',
        'Le cache est d’un coup presque vide, toutes les requêtes tombent sur la base… et tu viens de déclencher une ruée vers le cache géante.',
      ],
      principle: [
        'On place serveurs et clés sur un **anneau** : l’espace des valeurs de hash, refermé sur lui-même. Chaque clé appartient au premier serveur rencontré en tournant dans le sens horaire.',
        'Ajouter un serveur ne déplace que les clés situées entre lui et son prédécesseur, soit environ **1/N** des clés. Pour lisser la répartition, chaque serveur occupe plusieurs positions sur l’anneau : ce sont les **nœuds virtuels**.',
      ],
      diagram: 'ring',
      steps: [
        ['Placer les serveurs', 'Hasher chaque serveur 100 à 200 fois (`hash("A#1")`, `hash("A#2")`…) et trier ces positions.'],
        ['Trouver le serveur d’une clé', 'Hasher la clé, puis chercher la première position supérieure par recherche binaire, en revenant au début si on dépasse la fin.'],
        ['Répliquer', 'Les N serveurs distincts suivants sur l’anneau gardent les copies de la clé.'],
        ['Ajouter ou retirer', 'Seul le segment concerné migre : les autres serveurs ne voient aucun changement.'],
      ],
      pros: [
        'Ajouter ou retirer un serveur ne déplace qu’environ 1/N des clés.',
        'Pas de coordination centrale : tout client qui connaît la liste des serveurs calcule la même réponse.',
        'Les machines de tailles différentes se gèrent avec plus ou moins de nœuds virtuels.',
      ],
      cons: [
        'Sans nœuds virtuels, la répartition est très inégale.',
        'Ne règle pas les clés chaudes : une clé très demandée reste sur un seul serveur.',
        'Plus complexe qu’un modulo ; des alternatives plus simples existent (rendezvous hashing, jump hash).',
      ],
      examples: [
        'Amazon Dynamo et Cassandra répartissent leurs données sur un anneau de tokens.',
        'Les clients memcached avec l’algorithme ketama.',
        'Les load balancers qui collent un utilisateur à un backend : ring hash dans Envoy, Maglev chez Google.',
      ],
      interview: [
        'Pourquoi pas simplement `hash(clé) % N` ?',
        'À quoi servent les nœuds virtuels ?',
        'Comment répliquer chaque clé sur trois nœuds avec un anneau ?',
      ],
    },
  },
  {
    slug: 'canary',
    title: 'Canary Release',
    en: 'Canary Deployment',
    cat: 'migration',
    pitch: 'Envoyer la nouvelle version à 1 % du trafic, et regarder si le canari chante encore.',
    art: 'un canari dans une petite cage suspendue à l’entrée d’une mine, une lampe de mineur à côté',
    why: 'Sur la jaquette, des oiseaux s’envolent au-dessus d’une forêt sombre. Clin d’œil au canari des mineurs, qui sentait le danger avant les hommes : une petite partie du trafic part en éclaireur avant tout le monde.',
    body: {
      problem: [
        'Tu déploies la nouvelle version à 100 % d’un coup. Elle a une fuite mémoire, ou une régression de latence, ou un bug métier sur un cas que la préprod n’a jamais vu. Tous tes utilisateurs le découvrent en même temps que toi.',
        'Les tests et la préprod ne reproduisent jamais le vrai trafic : ses volumes, ses données tordues, ses clients d’il y a trois versions.',
      ],
      principle: [
        'On envoie d’abord une petite part du trafic (1 %, puis 5 %) vers la nouvelle version, et on compare ses métriques à celles de l’ancienne : taux d’erreur, latence p99, métriques métier. Si tout va bien, on augmente par paliers ; sinon, on revient en arrière, idéalement automatiquement.',
        'Le nom vient des canaris que les mineurs descendaient dans les galeries : s’ils s’arrêtaient de chanter, il y avait du grisou.',
      ],
      diagram: 'canary',
      steps: [
        ['Déployer à côté', 'La nouvelle version tourne en parallèle de l’ancienne, sans remplacer quoi que ce soit.'],
        ['Router une petite part', 'Par poids au load balancer, ou par cohorte : les employés, une région, les comptes gratuits.'],
        ['Comparer à une référence', 'Canari contre ancienne version, sur des échantillons de même taille et sur la même période. Pas contre « la semaine dernière ».'],
        ['Monter par paliers', '1 %, 5 %, 25 %, 100 %, avec un rollback automatique dès qu’un seuil est franchi.'],
      ],
      pros: [
        'Le rayon d’impact d’un bug est limité à une petite part des utilisateurs.',
        'La validation se fait sur le vrai trafic de production.',
        'Le retour arrière est rapide : on remet le poids à zéro.',
      ],
      cons: [
        'Sans bonne observabilité, un canari ne sert à rien : il faut des métriques comparables par version.',
        'Deux versions cohabitent : schémas et API doivent rester compatibles (voir Expand and Contract).',
        'Sur 1 % du trafic, un bug rare peut passer inaperçu : le signal statistique est faible.',
      ],
      examples: [
        'Argo Rollouts ou Flagger sur Kubernetes, avec analyse automatique des métriques.',
        'Spinnaker et Kayenta chez Netflix, qui comparent statistiquement canari et référence.',
        'Les feature flags permettent un canari au niveau d’une fonctionnalité plutôt que d’un déploiement.',
      ],
      interview: [
        'Quelle différence entre un canary release et un déploiement blue-green ?',
        'Comment décider automatiquement de promouvoir ou d’annuler ?',
        'Que fais-tu d’une migration de base de données pendant un canari ?',
      ],
    },
  },
  {
    slug: 'depot-fichier',
    title: 'Dépôt de fichiers',
    en: 'Secure Upload · Quarantine, ClamAV, CDR',
    cat: 'securite',
    pitch: 'Accepter des fichiers d’inconnus sans laisser entrer le loup : quarantaine, antivirus, désarmement.',
    art: 'un colis posé dans une cage de verre, traversé par un faisceau de scanner',
    why: 'Sur la jaquette, un colis attend dans une cage de verre, traversé par le faisceau d’un scanner. Rien ne touche le système avant d’avoir été isolé, analysé et nettoyé : c’est la quarantaine.',
    body: {
      problem: [
        'Ton app accepte des CV, des factures, des avatars. Des fichiers envoyés par des inconnus. Parmi eux : des malwares, des PDF qui embarquent du JavaScript, des documents Office avec macros, des **polyglottes** (une image valide qui est aussi un fichier HTML), des zip bombs, des noms de fichiers piégés (`../../etc/passwd`).',
        'Et si tu sers ces fichiers depuis ton propre domaine, un HTML déguisé en image devient une faille XSS stockée.',
      ],
      principle: [
        'Aucun fichier n’est servi tant qu’il n’a pas passé une chaîne de contrôles. Il atterrit d’abord en **quarantaine** : un stockage isolé, jamais exposé. Un worker vérifie ensuite son **type réel** et sa taille, le passe à l’**antivirus** (ClamAV), puis le **désarme par reconstruction** (CDR, Content Disarm and Reconstruction) : on extrait le contenu utile et on reconstruit un fichier neuf, sans macros, scripts ni objets embarqués.',
        'Seule cette copie propre est promue vers le stockage servi, depuis un **domaine séparé** de l’application.',
      ],
      diagram: 'upload',
      steps: [
        ['Upload direct en quarantaine', 'URL présignée vers un bucket isolé, avec taille maximale imposée : le fichier ne transite pas par tes serveurs d’API.'],
        ['Valider le type réel', 'Lire les magic bytes, jamais l’extension ni le `Content-Type` envoyé par le client. Refuser les archives imbriquées.'],
        ['Scanner', 'ClamAV (démon `clamd`, signatures mises à jour en continu). Fichier suspect : bucket de rejet, jamais supprimé en silence.'],
        ['Désarmer et reconstruire', 'Réencoder les images (ce qui retire aussi les métadonnées EXIF), aplatir les PDF, supprimer les macros Office.'],
        ['Servir à part', 'Depuis un domaine dédié (`usercontent.example.com`), nom de fichier régénéré, `Content-Disposition: attachment` et `X-Content-Type-Options: nosniff`.'],
      ],
      pros: [
        'Une défense en profondeur : chaque étape rattrape ce que la précédente rate.',
        'Le CDR neutralise aussi les menaces inconnues, qu’aucun antivirus ne connaît encore.',
        'Tout est asynchrone : l’API ne porte ni le poids des fichiers ni le temps d’analyse.',
      ],
      cons: [
        'Le fichier n’est pas disponible tout de suite : il faut un état « en cours d’analyse » dans l’interface.',
        'Le CDR peut altérer le document : mise en page, formulaires, signatures électroniques cassées.',
        'ClamAV seul a un taux de détection limité, et l’ensemble a un coût de calcul réel.',
      ],
      examples: [
        'Un bucket S3 de quarantaine, un événement d’upload qui déclenche un worker ClamAV, puis la promotion vers le bucket servi.',
        'Réencoder toutes les images avec libvips ou ImageMagick, qui ne garde que les pixels.',
        'Google sert les contenus de ses utilisateurs depuis `googleusercontent.com`, pas depuis `google.com`.',
      ],
      interview: [
        'Pourquoi servir les fichiers des utilisateurs depuis un autre domaine ?',
        'Pourquoi l’extension et le `Content-Type` ne suffisent-ils pas à connaître le type d’un fichier ?',
        'Que montres-tu à l’utilisateur pendant l’analyse, et que fais-tu d’un fichier rejeté ?',
      ],
    },
  },
  {
    slug: 'event-sourcing',
    title: 'Event Sourcing',
    en: 'Event Sourcing',
    cat: 'donnees',
    pitch: 'Ne plus stocker l’état, mais la suite d’événements qui y a mené.',
    art: 'un long ruban de bande magnétique qui se déroule, chaque segment marqué d’un symbole',
    why: 'Sur la jaquette, une machine à écrire tape seule un rouleau sans fin qui remplit la pièce. Rien ne s’efface, tout s’ajoute à la suite, et c’est en relisant le rouleau qu’on sait où on en est.',
    body: {
      problem: [
        'Ta table `accounts` dit que le solde vaut 120. Pourquoi 120 ? Qui l’a changé, quand, et depuis quelle valeur ? Le modèle CRUD écrase l’état à chaque mise à jour : l’historique est perdu, et la table d’audit ajoutée à côté finit toujours par diverger.',
        'Impossible aussi de répondre à « quel était l’état hier à 14 h ? » pour comprendre un bug.',
      ],
      principle: [
        'On ne stocke plus l’état, mais la **suite des événements** qui y a mené : `CompteOuvert`, `DépôtEffectué(100)`, `RetraitEffectué(30)`… Ils sont immuables et ajoutés à la fin d’un **event store**.',
        'L’état courant se **calcule** en rejouant les événements. Pour aller vite, on prend des **snapshots** de temps en temps, et on construit des **projections** pour les lectures (souvent avec CQRS).',
      ],
      diagram: 'eventsourcing',
      steps: [
        ['Nommer des faits métier', 'Des événements au passé, porteurs de sens : `CommandeExpédiée`, pas `StatutModifié`.'],
        ['Ajouter avec contrôle de concurrence', 'On écrit en précisant la version attendue de l’agrégat : si quelqu’un a écrit entre-temps, l’ajout est refusé.'],
        ['Reconstruire et photographier', 'Rejouer les événements pour obtenir l’état, avec un snapshot tous les N événements.'],
        ['Projeter et versionner', 'Des projections pour chaque besoin de lecture, et une stratégie pour faire évoluer le format des anciens événements (upcasting).'],
      ],
      pros: [
        'Un audit complet, natif et fiable : l’historique est la donnée.',
        'On peut rejouer le passé pour déboguer, ou recalculer l’état à n’importe quelle date.',
        'On crée de nouvelles projections à partir de tout l’historique, même pour des besoins imprévus.',
      ],
      cons: [
        'Faire évoluer le format d’événements immuables est douloureux.',
        'Sans projection, les requêtes ad hoc (« tous les comptes à découvert ») sont difficiles.',
        'L’effacement de données personnelles demande une technique dédiée (voir Crypto Shredding).',
        'Une courbe d’apprentissage réelle, et un surcoût injustifié pour un simple CRUD.',
      ],
      examples: [
        'La comptabilité fait de l’event sourcing depuis des siècles : le grand livre ne s’efface pas, on passe des écritures de correction.',
        'EventStoreDB, Axon, ou une simple table append-only dans Postgres.',
        'Git en est une bonne intuition : l’état du dépôt est le résultat de la suite des commits.',
      ],
      interview: [
        'Comment changer le format d’un événement déjà stocké des millions de fois ?',
        'Comment lire rapidement l’état d’un compte qui a un million d’événements ?',
        'Event Sourcing sans CQRS, est-ce possible ?',
      ],
    },
  },
  {
    slug: 'tracing',
    title: 'Tracing distribué',
    en: 'Distributed Tracing',
    cat: 'distribue',
    pitch: 'Suivre une requête de service en service pour savoir où passent les millisecondes.',
    art: 'une loupe qui suit un fil rouge tendu entre plusieurs serveurs',
    why: 'Sur la jaquette, un enquêteur suit un fil rouge punaisé de machine en machine. Un seul fil traverse tout le tableau : c’est l’identifiant de trace qui accompagne la requête d’un service à l’autre.',
    body: {
      problem: [
        'L’endpoint `/checkout` met 3 secondes au p99. La requête traverse la gateway, six services, deux files de messages et trois bases. Chaque service a ses logs, bien rangés… et rien ne permet de retrouver, dans chacun, les lignes qui concernent **cette** requête.',
      ],
      principle: [
        'Chaque requête reçoit un **trace id**, propagé à chaque appel (header `traceparent`, standard W3C). Chaque opération (appel HTTP, requête SQL, message) produit un **span** : un début, une durée, un parent et des attributs.',
        'Les spans sont envoyés à un collecteur qui reconstruit l’arbre complet de la requête, affiché en cascade. On voit d’un coup d’œil où passe le temps. OpenTelemetry est devenu le standard pour instrumenter et exporter.',
      ],
      diagram: 'tracing',
      steps: [
        ['Instrumenter', 'L’auto-instrumentation OpenTelemetry couvre déjà HTTP, les drivers de base et les clients de messages ; on ajoute des spans métier à la main.'],
        ['Propager le contexte', 'Dans les headers HTTP, mais aussi dans les headers des messages Kafka ou RabbitMQ : sans ça, la trace se coupe à la première file.'],
        ['Exporter et stocker', 'Vers un OpenTelemetry Collector, puis Jaeger, Grafana Tempo ou un SaaS.'],
        ['Échantillonner', 'Garder 1 à 10 % des traces au départ (head sampling), ou décider après coup pour garder toutes les erreurs et les requêtes lentes (tail sampling).'],
        ['Relier aux logs', 'Écrire le trace id dans chaque ligne de log : on passe d’une trace lente aux logs exacts de cette requête.'],
      ],
      pros: [
        'On voit le chemin critique : quel appel, dans quel service, coûte vraiment.',
        'Révèle les appels séquentiels qui pourraient être parallèles, et les N+1 entre services.',
        'Relie logs, métriques et traces autour d’une même requête.',
      ],
      cons: [
        'Le volume est énorme : on échantillonne, et on peut rater le cas rare qu’on cherchait.',
        'Un seul composant non instrumenté casse la propagation et coupe la trace en deux.',
        'Un surcoût léger à chaque appel, et un stockage à budgéter.',
      ],
      examples: [
        'Dapper, le système de Google décrit en 2010, a inspiré Zipkin, Jaeger puis OpenTelemetry.',
        'Une cascade Jaeger qui montre 2,4 s passées dans une requête SQL du service de paiement.',
        'Le trace id renvoyé dans un header de réponse, que le support demande aux clients quand ils signalent un bug.',
      ],
      interview: [
        'Comment propager une trace à travers une file de messages ?',
        'Head sampling ou tail sampling : quelles différences, quels coûts ?',
        'Le p99 a doublé depuis hier : comment utilises-tu les traces pour trouver pourquoi ?',
      ],
    },
  },
  {
    slug: 'backpressure',
    title: 'Backpressure',
    en: 'Backpressure',
    cat: 'resilience',
    pitch: 'Quand le consommateur sature, il doit pouvoir dire au producteur de ralentir.',
    art: 'un tuyau d’arrosage avec un nœud, la pression qui le fait gonfler en amont',
    why: 'Sur la jaquette, l’ouvrier submergé en bas de la chaîne sonne la cloche, et celui qui alimente le tapis s’arrête. Le signal remonte vers la source au lieu de laisser les cartons s’empiler.',
    body: {
      problem: [
        'Ton producteur envoie 10 000 messages par seconde, ton consommateur en traite 2 000. La différence s’accumule quelque part : dans un buffer en mémoire, dans une file, dans un pool de threads.',
        'La latence grimpe sans fin, puisque chaque message attend derrière tous les autres. Puis la mémoire déborde, le process est tué, et tout ce qui était en attente est perdu.',
      ],
      principle: [
        'La backpressure, c’est la capacité du consommateur à dire « ralentis » au producteur. Quand le consommateur ne suit plus, il n’y a que quatre options : **ralentir** le producteur (il ne prend que ce qu’on lui demande), **bloquer** (l’appelant attend qu’il y ait de la place), **rejeter** (`503`, `429`, délestage), ou **bufferiser**, mais de façon bornée.',
        'La règle d’or : **toute file doit être bornée**. Une file infinie ne supprime pas la surcharge, elle la transforme en latence infinie puis en crash.',
      ],
      diagram: 'backpressure',
      steps: [
        ['Borner toutes les files', 'Taille maximale explicite pour chaque buffer, file et pool. Si tu ne choisis pas la limite, c’est la mémoire qui la choisira.'],
        ['Choisir la politique quand c’est plein', 'Bloquer l’appelant, rejeter la nouvelle demande, ou jeter la plus ancienne si seule la donnée fraîche compte.'],
        ['Propager en amont', 'Fenêtre TCP, `503` avec `Retry-After`, `request(n)` en Reactive Streams, consommation en pull plutôt qu’en push.'],
        ['Mesurer l’attente', 'Surveiller la longueur des files et le temps d’attente, pas seulement le débit, et scaler les consommateurs sur ce signal.'],
      ],
      pros: [
        'Le système reste stable sous surcharge au lieu de s’effondrer.',
        'La latence reste bornée, donc prévisible.',
        'La surcharge devient visible et localisée, au lieu de se transformer en panne mystérieuse.',
      ],
      cons: [
        'Rejeter, c’est produire des erreurs visibles pour certains clients.',
        'Bloquer propage la lenteur en amont : il faut choisir qui ralentit.',
        'Tout le pipeline doit jouer le jeu : un seul maillon sans limite annule le reste.',
      ],
      examples: [
        'TCP : la fenêtre de réception dit à l’émetteur combien il peut encore envoyer.',
        'Kafka : les consommateurs tirent les messages à leur rythme, et le retard (lag) sert à décider du scaling.',
        'Les channels bornés de Go, le `highWaterMark` des streams Node, Reactive Streams en Java.',
      ],
      interview: [
        'Ta file grossit sans arrêt depuis ce matin : que fais-tu ?',
        'Bloquer ou rejeter : comment choisir ?',
        'Pourquoi une file non bornée est-elle une bombe à retardement ?',
      ],
    },
  },
  {
    slug: 'geo',
    title: 'Index Géospatial',
    en: 'Geohash · Quadtree',
    cat: 'donnees',
    pitch: 'Trouver les dix livreurs les plus proches parmi un million, sans calculer un million de distances.',
    art: 'une carte découpée en carrés imbriqués de plus en plus petits, une épingle au centre',
    why: 'Sur la jaquette, un phare balaie la côte. Son rôle est de guider chacun vers le bon endroit, au plus près : c’est exactement ce qu’on demande à un index géospatial.',
    body: {
      problem: [
        'Une app de livraison doit trouver les dix livreurs les plus proches d’un restaurant. Il y a un million de livreurs, et chacun envoie sa position toutes les cinq secondes.',
        'Calculer la distance à chacun, c’est un million de calculs par recherche. Et un index classique sur `(lat, lng)` ne sert à rien : un B-tree trie sur une dimension, pas sur la proximité en deux dimensions.',
      ],
      principle: [
        'On découpe la carte en **cellules**, et on indexe chaque point par sa cellule. Le **geohash** encode une position en une chaîne : chaque caractère ajouté divise la cellule, et deux points proches partagent en général le même préfixe. Le **quadtree** divise récursivement en quatre les zones denses seulement. Google utilise S2 (des cellules sur la sphère), Uber H3 (des hexagones).',
        'Une recherche prend la cellule du point et ses **8 voisines**, récupère les candidats, puis calcule la distance exacte uniquement sur eux.',
      ],
      diagram: 'geo',
      steps: [
        ['Choisir la précision', 'Un geohash à 6 caractères fait environ 1,2 km × 0,6 km : assez pour une ville, à adapter à la densité.'],
        ['Indexer chaque position', 'Stocker la cellule de chaque livreur, en mémoire si les positions changent souvent (Redis `GEOADD`).'],
        ['Chercher autour', 'Cellule du point plus ses 8 voisines, puis élargir si les résultats sont insuffisants.'],
        ['Affiner', 'Calculer la vraie distance (formule de haversine) sur les seuls candidats, et trier.'],
      ],
      pros: [
        'La recherche coûte en fonction du nombre de candidats proches, pas du nombre total de points.',
        'Un geohash se range dans un simple index de chaînes, sans moteur spécialisé.',
        'Le découpage est hiérarchique : on zoome ou dézoome en ajoutant ou retirant des caractères.',
      ],
      cons: [
        'Effet de bord : deux points voisins peuvent tomber dans des cellules aux préfixes différents, d’où l’obligation de regarder les voisines.',
        'La densité est inégale : une cellule de Paris contient mille fois plus de livreurs qu’une cellule de campagne. Quadtree et H3 s’adaptent mieux.',
        'Des mises à jour très fréquentes coûtent cher sur disque : on garde les positions vivantes en mémoire.',
      ],
      examples: [
        'Redis : `GEOADD` et `GEOSEARCH`, avec du geohash sous le capot.',
        'PostGIS et son index GiST, Elasticsearch et le type `geo_point`.',
        'Uber a créé H3 pour découper les villes en hexagones et calculer l’offre et la demande par zone.',
      ],
      interview: [
        'Concevoir « les livreurs autour de moi » pour un million de livreurs en mouvement.',
        'Pourquoi le geohash oblige-t-il à regarder les cellules voisines ?',
        'Quadtree ou geohash : lequel choisir, et pourquoi ?',
      ],
    },
  },
  {
    slug: 'dora',
    title: 'Les métriques DORA',
    en: 'DORA Metrics',
    cat: 'equipe',
    pitch: 'Quatre chiffres pour savoir si ton équipe livre vite et bien, ou juste vite.',
    art: 'le tableau de bord d’une voiture ancienne avec quatre cadrans à aiguille',
    why: 'Sur la jaquette, quatre mécaniciens changent les quatre roues sous un chronomètre. Livrer vite et réparer vite sans tout casser : les quatre métriques DORA mesurent exactement ça.',
    body: {
      problem: [
        'Comment savoir si une équipe livre bien ? La vélocité en points, le nombre de tickets fermés, les lignes de code : faciles à mesurer, faciles à manipuler, et elles ne disent rien de la stabilité ni de la valeur livrée.',
      ],
      principle: [
        'Le programme de recherche DORA (DevOps Research and Assessment), popularisé par le livre *Accelerate*, a identifié quatre métriques liées à la performance des équipes. Deux mesurent la **vitesse** : la **fréquence de déploiement** et le **délai de mise en production** (du commit à la prod). Deux mesurent la **stabilité** : le **taux d’échec des changements** et le **temps de restauration** après un incident.',
        'Le résultat clé de leurs études : les meilleures équipes sont bonnes sur les quatre à la fois. Vitesse et stabilité ne s’opposent pas, elles se renforcent : des petits changements fréquents cassent moins et se réparent plus vite.',
      ],
      diagram: 'dora',
      steps: [
        ['Fréquence de déploiement', 'Le nombre de mises en production par jour ou par semaine, tiré directement de la CI/CD.'],
        ['Délai de mise en production', 'Le temps entre un commit et son arrivée en prod, mesuré sur les commits réellement déployés.'],
        ['Taux d’échec des changements', 'La part des déploiements qui provoquent un incident, un rollback ou un correctif urgent.'],
        ['Temps de restauration', 'La durée entre le début d’un incident et le retour à la normale, tirée de l’outil d’incidents.'],
      ],
      pros: [
        'Mesurables automatiquement, à partir des outils existants.',
        'Équilibrées : on ne peut pas améliorer la vitesse en sacrifiant la stabilité sans que ça se voie.',
        'Un langage commun entre équipes techniques et direction.',
      ],
      cons: [
        'Loi de Goodhart : dès qu’elles deviennent des objectifs, on les manipule (des déploiements vides pour gonfler la fréquence).',
        'Elles ne mesurent ni la valeur produit, ni la satisfaction des utilisateurs, ni la santé de l’équipe (le cadre SPACE les complète).',
        'Comparer des équipes aux contextes différents est trompeur : on suit la tendance d’une équipe, pas un classement.',
      ],
      examples: [
        'Le niveau « elite » des rapports DORA : déploiements à la demande, plusieurs fois par jour, et restauration en moins d’une heure.',
        'Four Keys, l’outil open source de Google, calcule les quatre métriques à partir des événements Git et CI/CD.',
        'Une équipe qui passe de releases mensuelles à des déploiements quotidiens voit souvent son taux d’échec baisser, pas monter.',
      ],
      interview: [
        'Ton taux d’échec augmente quand la fréquence de déploiement augmente. Que fais-tu ?',
        'Comment mesurerais-tu concrètement le délai de mise en production ?',
        'Pourquoi est-ce une mauvaise idée de fixer des objectifs DORA par équipe ?',
      ],
    },
  },
  {
    slug: 'monolithe-modulaire',
    title: 'Monolithe modulaire',
    en: 'Modular Monolith',
    cat: 'migration',
    pitch: 'Des frontières de microservices, sans le réseau entre elles.',
    art: 'un grand bloc de pierre taillé en compartiments, comme une boîte à outils',
    why: 'Sur la jaquette, cinq véhicules s’assemblent en un seul robot géant, jointures bien visibles. Un seul corps à déployer, des modules aux frontières nettes, et chacun peut repartir seul le jour où on en a besoin.',
    body: {
      problem: [
        'Ton monolithe est devenu une « grosse boule de boue » : tout dépend de tout, chaque modification casse quelque chose ailleurs. Le réflexe : passer aux microservices.',
        'Mais distribuer, c’est ajouter le réseau, la latence, la cohérence à terme, le déploiement de dizaines de services, le tracing… Pour une équipe de quinze personnes, c’est souvent troquer un problème de structure contre dix problèmes d’infrastructure.',
      ],
      principle: [
        'Le monolithe modulaire garde **un seul déployable**, mais découpé en **modules alignés sur les domaines** (catalogue, commandes, paiement), avec des frontières strictes. Chaque module expose une **API publique** et cache tout le reste ; il possède ses propres tables ; les autres modules ne passent que par son API ou par ses événements internes.',
        'Ces règles sont **vérifiées par l’outillage**, pas seulement par la bonne volonté. Le jour où un module doit vraiment devenir un service, la couture existe déjà.',
      ],
      diagram: 'modulith',
      steps: [
        ['Découper par domaine', 'Pas par couche technique (contrôleurs, services, repositories) : par capacité métier.'],
        ['Définir l’API publique', 'Un petit ensemble de classes ou d’interfaces exposées ; tout le reste est interne au module.'],
        ['Séparer les données', 'Chaque module possède ses tables (un schéma par module) ; aucune jointure entre modules.'],
        ['Faire respecter les frontières', 'deptrac en PHP, ArchUnit ou Spring Modulith en Java, Packwerk en Ruby : la CI échoue si un module viole une dépendance.'],
      ],
      pros: [
        'La simplicité opérationnelle d’un monolithe : un déploiement, des transactions locales, des appels en mémoire.',
        'Déplacer du code entre modules reste un refactoring, pas une migration entre services.',
        'Un chemin clair vers les microservices, si un module en a un jour réellement besoin.',
      ],
      cons: [
        'Sans outillage ni discipline, les frontières s’érodent et la boule de boue revient.',
        'Tout se déploie et se dimensionne ensemble : un module gourmand impose sa taille aux autres.',
        'Une fuite mémoire ou un crash dans un module emporte toute l’application.',
      ],
      examples: [
        'Shopify découpe son monolithe Rails en composants dont les frontières sont vérifiées par Packwerk.',
        'Spring Modulith formalise le pattern pour les applications Spring.',
        'En 2023, une équipe de Prime Video a raconté avoir regroupé un pipeline de microservices en un seul service, avec une forte baisse des coûts.',
      ],
      interview: [
        'Microservices ou monolithe modulaire pour une startup de dix développeurs ?',
        'Comment empêcher un module d’aller lire directement les tables d’un autre ?',
        'À quels signes reconnais-tu qu’un module doit devenir un service à part ?',
      ],
    },
  },
  {
    slug: 'cap',
    title: 'Le théorème CAP',
    en: 'CAP Theorem',
    cat: 'donnees',
    pitch: 'Quand le réseau se coupe, il faut choisir : répondre faux, ou ne pas répondre.',
    art: 'un triangle dont les trois sommets portent une balance, une lampe allumée et une prise débranchée',
    why: 'Sur la jaquette, le pont entre les deux tours est coupé. L’horloge de gauche s’est arrêtée plutôt que de donner une heure fausse, celle de droite continue mais n’affiche plus la même : pendant une partition, il faut choisir entre cohérence et disponibilité.',
    body: {
      problem: [
        'Ta base est répliquée entre Paris et Francfort. Le lien entre les deux datacenters coupe. Un client écrit `x = 2` à Paris ; une seconde plus tard, un autre lit `x` à Francfort, qui n’a pas reçu la mise à jour.',
        'Que doit faire Francfort : répondre `x = 1`, une valeur périmée, ou refuser de répondre ?',
      ],
      principle: [
        'Le théorème CAP (conjecture d’Eric Brewer en 2000, démontrée par Gilbert et Lynch en 2002) dit qu’en cas de **partition** réseau (P), un système distribué doit choisir entre la **cohérence** (C : toute lecture voit la dernière écriture) et la **disponibilité** (A : tout nœud en état de marche répond).',
        'Comme les partitions finissent toujours par arriver, le vrai choix est **CP ou AP, pendant la partition**. Le modèle PACELC complète : en l’absence de partition (Else), on arbitre encore entre **latence** et cohérence.',
      ],
      diagram: 'cap',
      steps: [
        ['Classer les données', 'Où une incohérence coûte cher (solde, stock, réservation) et où elle est tolérable (compteur de likes, panier, fil d’actualité).'],
        ['Pour du CP', 'Quorum de majorité ou consensus (Raft, Paxos) : le côté minoritaire de la partition refuse les écritures, voire les lectures.'],
        ['Pour de l’AP', 'Accepter les écritures des deux côtés, puis réconcilier : last-write-wins, horloges vectorielles, CRDTs.'],
        ['Penser au cas nominal', 'Avec PACELC : même sans panne, attendre la confirmation d’un quorum distant coûte de la latence à chaque requête.'],
      ],
      pros: [
        'Oblige à faire un choix explicite, donnée par donnée, au lieu de le découvrir en pleine panne.',
        'Donne un vocabulaire commun pour comparer les bases de données.',
        'Rappelle que la disponibilité totale et la cohérence forte ne vont pas ensemble.',
      ],
      cons: [
        'CAP est binaire et caricatural : C y signifie linéarisabilité, A une disponibilité de 100 %. La réalité est faite de nuances.',
        'Beaucoup de systèmes sont réglables requête par requête (niveaux de cohérence de Cassandra), et ne sont ni « CP » ni « AP » en bloc.',
        'Il ne dit rien de la latence en fonctionnement normal, qui est souvent la vraie contrainte : d’où PACELC.',
      ],
      examples: [
        'etcd, ZooKeeper et Spanner choisissent la cohérence : sans majorité, ils refusent les écritures.',
        'Cassandra et DynamoDB (dans leur configuration par défaut) penchent vers la disponibilité.',
        'Le panier Amazon de l’article Dynamo : mieux vaut un article réapparu dans le panier qu’un panier indisponible.',
      ],
      interview: [
        'CP ou AP pour un système de paiement ? Et pour un compteur de vues ?',
        'Pourquoi un système « CA » n’a-t-il pas de sens pour une base distribuée ?',
        'Qu’apporte PACELC par rapport à CAP ?',
      ],
    },
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
  idempotence: `
<svg viewBox="0 0 640 300" role="img" aria-label="Un retry avec la même clé rejoue la réponse stockée au lieu de débiter une seconde fois">
  <g class="k-ink">
    <rect x="20" y="50" width="120" height="56" rx="2"/><text x="80" y="75">App mobile</text><text x="80" y="93" class="k-small">clé abc-123</text>
    <rect x="250" y="50" width="140" height="56" rx="2"/><text x="320" y="75">API paiement</text><text x="320" y="93" class="k-small">POST /payments</text>
    <rect x="20" y="180" width="120" height="56" rx="2"/><text x="80" y="205">App mobile</text><text x="80" y="223" class="k-small">retry, même clé</text>
    <rect x="250" y="180" width="140" height="56" rx="2"/><text x="320" y="205">API paiement</text><text x="320" y="223" class="k-small">POST /payments</text>
  </g>
  <g class="k-new">
    <rect x="480" y="100" width="140" height="80" rx="2"/>
    <text x="550" y="124" class="k-head">Clés vues</text>
    <text x="550" y="148" class="k-small">abc-123 → 201</text><text x="550" y="164" class="k-small">{ id: 42 }</text>
  </g>
  <path d="M140 78 H250" class="k-arrow"/><text x="195" y="68" class="k-small">1re tentative</text>
  <path d="M140 208 H250" class="k-arrow"/><text x="195" y="198" class="k-small">après timeout</text>
  <path d="M390 78 C440 78 450 100 480 120" class="k-arrow k-new-s"/><text x="440" y="70" class="k-small k-new-t">enregistre</text>
  <path d="M390 208 C440 208 450 180 480 165" class="k-arrow k-new-s"/><text x="440" y="226" class="k-small k-new-t">clé connue</text>
  <text x="320" y="282" class="k-new-t">Réponse rejouée : 201 { id: 42 }, aucun second débit</text>
</svg>`,
  conway: `
<svg viewBox="0 0 640 300" role="img" aria-label="Des équipes par couche produisent une architecture en couches, des équipes par domaine produisent un service par domaine">
  <text x="160" y="22" class="k-head">Équipes par couche</text>
  <text x="480" y="22" class="k-head k-new-t">Équipes par domaine</text>
  <g class="k-old">
    <rect x="60" y="40" width="200" height="44" rx="2"/><text x="160" y="67">Équipe front</text>
    <rect x="60" y="100" width="200" height="44" rx="2"/><text x="160" y="127">Équipe back</text>
    <rect x="60" y="160" width="200" height="44" rx="2"/><text x="160" y="187">Équipe base de données</text>
  </g>
  <path d="M160 84 V100" class="k-line"/><path d="M160 144 V160" class="k-line"/>
  <text x="160" y="236" class="k-small">→ une architecture en 3 couches :</text>
  <text x="160" y="252" class="k-small">chaque feature traverse 3 équipes</text>
  <g class="k-new">
    <rect x="350" y="40" width="84" height="164" rx="2"/><text x="392" y="64">Catalogue</text>
    <rect x="440" y="40" width="84" height="164" rx="2"/><text x="482" y="64">Commande</text>
    <rect x="530" y="40" width="84" height="164" rx="2"/><text x="572" y="64">Paiement</text>
  </g>
  <g>
    <text x="392" y="110" class="k-small">front</text><text x="392" y="130" class="k-small">back</text><text x="392" y="150" class="k-small">données</text>
    <text x="482" y="110" class="k-small">front</text><text x="482" y="130" class="k-small">back</text><text x="482" y="150" class="k-small">données</text>
    <text x="572" y="110" class="k-small">front</text><text x="572" y="130" class="k-small">back</text><text x="572" y="150" class="k-small">données</text>
  </g>
  <text x="482" y="236" class="k-small k-new-t">→ un service par équipe :</text>
  <text x="482" y="252" class="k-small k-new-t">une feature = une équipe</text>
</svg>`,
  cqrs: `
<svg viewBox="0 0 640 300" role="img" aria-label="Les commandes passent par le modèle d’écriture, des projecteurs alimentent les modèles de lecture interrogés par les requêtes">
  <g class="k-ink">
    <rect x="20" y="120" width="80" height="56" rx="2"/><text x="60" y="153">UI</text>
    <rect x="420" y="128" width="190" height="40" rx="2"/><text x="515" y="146">Projecteur</text><text x="515" y="161" class="k-small">écoute les événements</text>
  </g>
  <g class="k-old">
    <rect x="180" y="30" width="160" height="60" rx="2"/><text x="260" y="56">Modèle d’écriture</text><text x="260" y="74" class="k-small">règles métier</text>
    <rect x="420" y="30" width="190" height="60" rx="2"/><text x="515" y="56">Base normalisée</text><text x="515" y="74" class="k-small">source de vérité</text>
  </g>
  <g class="k-new">
    <rect x="180" y="210" width="160" height="60" rx="2"/><text x="260" y="236">Requêtes</text><text x="260" y="254" class="k-small">lecture seule</text>
    <rect x="420" y="210" width="190" height="60" rx="2"/><text x="515" y="236">Modèles de lecture</text><text x="515" y="254" class="k-small">une vue par écran</text>
  </g>
  <path d="M100 135 C140 135 140 60 180 60" class="k-arrow"/><text x="104" y="76" class="k-small">commande</text>
  <path d="M340 60 H420" class="k-arrow"/>
  <path d="M515 90 V128" class="k-arrow"/><text x="560" y="114" class="k-small">événements</text>
  <path d="M515 168 V210" class="k-arrow k-new-s"/>
  <path d="M420 240 H340" class="k-arrow k-new-s"/>
  <path d="M180 240 C140 240 140 162 100 162" class="k-arrow k-new-s"/><text x="104" y="232" class="k-small k-new-t">requête</text>
</svg>`,
  circuit: `
<svg viewBox="0 0 640 280" role="img" aria-label="Les trois états du disjoncteur : fermé, ouvert, semi-ouvert">
  <g class="k-new">
    <rect x="30" y="100" width="150" height="60" rx="2"/><text x="105" y="126">Fermé</text><text x="105" y="144" class="k-small">les appels passent</text>
  </g>
  <g class="k-hot">
    <rect x="460" y="100" width="150" height="60" rx="2"/><text x="535" y="126">Ouvert</text><text x="535" y="144" class="k-small">échec immédiat</text>
  </g>
  <g class="k-ink">
    <rect x="245" y="200" width="150" height="60" rx="2"/><text x="320" y="226">Semi-ouvert</text><text x="320" y="244" class="k-small">quelques appels test</text>
  </g>
  <path d="M180 115 C260 40 380 40 460 115" class="k-arrow k-hot-s"/><text x="320" y="44" class="k-small k-hot-t">seuil d’échecs atteint</text>
  <path d="M535 160 C535 220 470 230 395 230" class="k-arrow"/><text x="530" y="246" class="k-small">délai écoulé</text>
  <path d="M245 230 C170 230 105 220 105 160" class="k-arrow k-new-s"/><text x="120" y="246" class="k-small k-new-t">test réussi</text>
  <path d="M380 200 C420 180 440 170 470 160" class="k-arrow k-hot-s"/><text x="440" y="196" class="k-small k-hot-t">test raté</text>
</svg>`,
  outbox: `
<svg viewBox="0 0 640 300" role="img" aria-label="La donnée et l’événement sont écrits dans la même transaction, un relais publie ensuite l’outbox sur le broker">
  <g class="k-ink">
    <rect x="20" y="120" width="110" height="56" rx="2"/><text x="75" y="153">Service</text>
    <rect x="390" y="190" width="110" height="48" rx="2"/><text x="445" y="212">Relais</text><text x="445" y="228" class="k-small">polling ou CDC</text>
    <rect x="535" y="190" width="95" height="48" rx="2"/><text x="582" y="219">Broker</text>
    <rect x="520" y="40" width="110" height="48" rx="2"/><text x="575" y="69">Consommateurs</text>
  </g>
  <g class="k-new">
    <rect x="170" y="40" width="180" height="210" rx="2" class="k-dead"/>
    <text x="260" y="64" class="k-head">1 transaction</text>
    <rect x="190" y="84" width="140" height="56" rx="2"/><text x="260" y="109">orders</text><text x="260" y="126" class="k-small">la commande</text>
    <rect x="190" y="170" width="140" height="56" rx="2"/><text x="260" y="195">outbox</text><text x="260" y="212" class="k-small">OrderCreated</text>
  </g>
  <path d="M130 140 C150 140 160 112 190 112" class="k-arrow"/>
  <path d="M130 158 C150 158 160 198 190 198" class="k-arrow"/>
  <path d="M330 214 H390" class="k-arrow"/>
  <path d="M500 214 H535" class="k-arrow"/>
  <path d="M582 190 V88" class="k-arrow"/>
  <text x="445" y="262" class="k-small k-hot-t">au moins une fois : doublons possibles</text>
</svg>`,
  nplus1: `
<svg viewBox="0 0 640 290" role="img" aria-label="N+1 envoie une requête par auteur, le chargement par lot n’en envoie que deux">
  <text x="160" y="22" class="k-head k-hot-t">N+1 : 51 requêtes</text>
  <text x="480" y="22" class="k-head k-new-t">Par lot : 2 requêtes</text>
  <g>
    <text x="24" y="52" class="k-left k-mono">SELECT * FROM articles LIMIT 50</text>
    <text x="24" y="76" class="k-left k-mono k-hot-t">SELECT * FROM users WHERE id = 1</text>
    <text x="24" y="96" class="k-left k-mono k-hot-t">SELECT * FROM users WHERE id = 2</text>
    <text x="24" y="116" class="k-left k-mono k-hot-t">SELECT * FROM users WHERE id = 3</text>
    <text x="24" y="136" class="k-left k-mono k-hot-t">…</text>
    <text x="24" y="156" class="k-left k-mono k-hot-t">SELECT * FROM users WHERE id = 50</text>
    <text x="344" y="52" class="k-left k-mono">SELECT * FROM articles LIMIT 50</text>
    <text x="344" y="76" class="k-left k-mono k-new-t">SELECT * FROM users</text>
    <text x="344" y="96" class="k-left k-mono k-new-t">WHERE id IN (1, 2, 3, …, 50)</text>
  </g>
  <path d="M320 36 V180" class="k-line k-dash"/>
  <text x="24" y="214" class="k-left k-small">temps passé en allers-retours réseau</text>
  <rect x="24" y="226" width="270" height="14" class="k-bar k-hot-f"/>
  <text x="24" y="262" class="k-left k-small k-hot-t">51 × ~2 ms</text>
  <rect x="344" y="226" width="12" height="14" class="k-bar k-new-f"/>
  <text x="344" y="262" class="k-left k-small k-new-t">2 × ~2 ms</text>
</svg>`,
  shredding: `
<svg viewBox="0 0 640 300" role="img" aria-label="Toutes les copies sont chiffrées avec la clé de l’utilisateur, détruire la clé les rend illisibles">
  <g class="k-ink">
    <rect x="20" y="115" width="140" height="70" rx="2"/><text x="90" y="142">Coffre de clés</text><text x="90" y="162" class="k-small">clé de l’utilisateur 42</text>
  </g>
  <g class="k-old">
    <rect x="240" y="30" width="170" height="42" rx="2"/><text x="325" y="56">Base de données</text>
    <rect x="240" y="96" width="170" height="42" rx="2"/><text x="325" y="122">Backups J-1 à J-30</text>
    <rect x="240" y="162" width="170" height="42" rx="2"/><text x="325" y="188">Logs, data lake</text>
    <rect x="240" y="228" width="170" height="42" rx="2"/><text x="325" y="254">Event store immuable</text>
  </g>
  <g class="k-line k-dash">
    <path d="M160 140 C200 140 200 51 240 51"/><path d="M160 146 C200 146 200 117 240 117"/>
    <path d="M160 154 C200 154 200 183 240 183"/><path d="M160 160 C200 160 200 249 240 249"/>
  </g>
  <text x="200" y="290" class="k-small">tout est chiffré avec la clé 42</text>
  <g class="k-hot">
    <rect x="470" y="115" width="150" height="70" rx="2"/><text x="545" y="142">Clé 42 détruite</text><text x="545" y="162" class="k-small">copies illisibles</text>
  </g>
  <path d="M410 150 H470" class="k-arrow k-hot-s"/><text x="440" y="140" class="k-small k-hot-t">effacer</text>
</svg>`,
  expand: `
<svg viewBox="0 0 640 260" role="img" aria-label="Expand ajoute la nouvelle colonne, Migrate bascule les lectures, Contract supprime l’ancienne">
  <g class="k-ink">
    <rect x="20" y="30" width="180" height="200" rx="2"/>
    <rect x="230" y="30" width="180" height="200" rx="2"/>
    <rect x="440" y="30" width="180" height="200" rx="2"/>
  </g>
  <text x="110" y="56" class="k-head k-new-t">1 · Expand</text>
  <text x="320" y="56" class="k-head k-new-t">2 · Migrate</text>
  <text x="530" y="56" class="k-head k-new-t">3 · Contract</text>
  <g class="k-ink"><rect x="45" y="80" width="130" height="36"/><text x="110" y="103">name</text></g>
  <g class="k-new"><rect x="45" y="126" width="130" height="36"/><text x="110" y="149">full_name</text></g>
  <text x="110" y="190" class="k-small">ajout, le code</text><text x="110" y="206" class="k-small">écrit les deux</text>
  <g class="k-old"><rect x="255" y="80" width="130" height="36"/><text x="320" y="103">name</text></g>
  <g class="k-new"><rect x="255" y="126" width="130" height="36"/><text x="320" y="149">full_name</text></g>
  <text x="320" y="190" class="k-small">backfill, lectures</text><text x="320" y="206" class="k-small">sur full_name</text>
  <g class="k-old"><rect x="465" y="80" width="130" height="36" class="k-dead"/><text x="530" y="103" class="k-dead-t">name</text></g>
  <g class="k-new"><rect x="465" y="126" width="130" height="36"/><text x="530" y="149">full_name</text></g>
  <text x="530" y="190" class="k-small">l’ancienne colonne</text><text x="530" y="206" class="k-small">est supprimée</text>
  <path d="M200 130 H230" class="k-arrow"/><path d="M410 130 H440" class="k-arrow"/>
  <text x="320" y="252" class="k-small k-new-t">chaque étape reste compatible avec la précédente</text>
</svg>`,
  ratelimit: `
<svg viewBox="0 0 640 290" role="img" aria-label="Un seau de jetons : chaque requête consomme un jeton, un seau vide renvoie 429">
  <text x="290" y="24" class="k-small">+5 jetons par seconde</text>
  <path d="M290 32 V58" class="k-arrow"/>
  <path d="M220 66 L240 226 L340 226 L360 66" class="k-line"/>
  <g>
    <circle cx="266" cy="208" r="9" class="k-dot k-new-f"/><circle cx="290" cy="208" r="9" class="k-dot k-new-f"/>
    <circle cx="314" cy="208" r="9" class="k-dot k-new-f"/><circle cx="278" cy="186" r="9" class="k-dot k-new-f"/>
    <circle cx="302" cy="186" r="9" class="k-dot k-new-f"/>
  </g>
  <text x="290" y="252" class="k-small">capacité : 10 jetons</text>
  <g class="k-reqs">
    <circle cx="40" cy="110" r="7"/><circle cx="40" cy="140" r="7"/><circle cx="40" cy="170" r="7"/><circle cx="40" cy="200" r="7"/>
  </g>
  <text x="40" y="232" class="k-small">requêtes</text>
  <g class="k-arrow k-ink-s">
    <path d="M48 110 L222 130"/><path d="M48 140 L224 140"/><path d="M48 170 L226 150"/><path d="M48 200 L228 160"/>
  </g>
  <g class="k-new"><rect x="460" y="90" width="160" height="44" rx="2"/><text x="540" y="117">200 OK</text></g>
  <g class="k-hot"><rect x="460" y="170" width="160" height="56" rx="2"/><text x="540" y="194">429 Too Many Requests</text><text x="540" y="212" class="k-small">Retry-After: 1</text></g>
  <path d="M355 112 H460" class="k-arrow k-new-s"/><text x="408" y="102" class="k-small k-new-t">un jeton dispo</text>
  <path d="M345 190 H460" class="k-arrow k-hot-s"/><text x="408" y="180" class="k-small k-hot-t">seau vide</text>
</svg>`,
  sharding: `
<svg viewBox="0 0 640 280" role="img" aria-label="Un routeur envoie chaque utilisateur vers un shard selon le hash de son identifiant">
  <g class="k-ink">
    <rect x="20" y="112" width="100" height="56" rx="2"/><text x="70" y="145">App</text>
    <rect x="170" y="104" width="160" height="72" rx="2"/><text x="250" y="134">Routeur</text><text x="250" y="154" class="k-small k-mono">hash(user_id) % 4</text>
  </g>
  <g class="k-new">
    <rect x="430" y="18" width="190" height="48" rx="2"/><text x="525" y="39">Shard 0</text><text x="525" y="56" class="k-small">users 0, 4, 8…</text>
    <rect x="430" y="82" width="190" height="48" rx="2"/><text x="525" y="103">Shard 1</text><text x="525" y="120" class="k-small">users 1, 5, 9…</text>
    <rect x="430" y="146" width="190" height="48" rx="2"/><text x="525" y="167">Shard 2</text><text x="525" y="184" class="k-small">users 2, 6, 10…</text>
    <rect x="430" y="210" width="190" height="48" rx="2"/><text x="525" y="231">Shard 3</text><text x="525" y="248" class="k-small">users 3, 7, 11…</text>
  </g>
  <path d="M120 140 H170" class="k-arrow"/>
  <g class="k-arrow k-new-s">
    <path d="M330 126 C380 126 380 42 430 42"/><path d="M330 134 C380 134 380 106 430 106"/>
    <path d="M330 146 C380 146 380 170 430 170"/><path d="M330 154 C380 154 380 234 430 234"/>
  </g>
</svg>`,
  brooks: (() => {
    const graph = (pts, cls) => {
      let out = '';
      for (let a = 0; a < pts.length; a++) {
        for (let b = a + 1; b < pts.length; b++) out += `<path d="M${pts[a][0]} ${pts[a][1]} L${pts[b][0]} ${pts[b][1]}" class="k-line ${cls}"/>`;
      }
      return out + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" class="k-dot"/>`).join('');
    };
    const ring = (cx, cy, r, n) => Array.from({ length: n }, (_, k) => {
      const t = (k / n) * Math.PI * 2 - Math.PI / 2;
      return [+(cx + r * Math.cos(t)).toFixed(1), +(cy + r * Math.sin(t)).toFixed(1)];
    });
    return `
<svg viewBox="0 0 640 270" role="img" aria-label="Quatre personnes ont six canaux de communication, huit personnes en ont vingt-huit">
  ${graph(ring(160, 120, 70, 4), '')}
  ${graph(ring(480, 120, 80, 8), 'k-hot-s')}
  <text x="160" y="232">4 personnes</text><text x="160" y="250" class="k-small">6 canaux</text>
  <text x="480" y="232" class="k-hot-t">8 personnes</text><text x="480" y="250" class="k-small k-hot-t">28 canaux</text>
  <text x="320" y="128" class="k-mono">n(n − 1) / 2</text>
</svg>`;
  })(),
  saga: `
<svg viewBox="0 0 640 260" role="img" aria-label="Quand la livraison échoue, les compensations remboursent le client puis libèrent le stock">
  <g class="k-new">
    <rect x="20" y="40" width="170" height="52" rx="2"/><text x="105" y="63">Réserver le stock</text><text x="105" y="80" class="k-small">service Stock</text>
    <rect x="235" y="40" width="170" height="52" rx="2"/><text x="320" y="63">Débiter le client</text><text x="320" y="80" class="k-small">service Paiement</text>
  </g>
  <g class="k-hot">
    <rect x="450" y="40" width="170" height="52" rx="2"/><text x="535" y="63">Planifier la livraison</text><text x="535" y="80" class="k-small">échec</text>
  </g>
  <g class="k-old">
    <rect x="20" y="170" width="170" height="52" rx="2" class="k-dead"/><text x="105" y="193">Libérer le stock</text><text x="105" y="210" class="k-small">compensation</text>
    <rect x="235" y="170" width="170" height="52" rx="2" class="k-dead"/><text x="320" y="193">Rembourser</text><text x="320" y="210" class="k-small">compensation</text>
  </g>
  <path d="M190 66 H235" class="k-arrow k-new-s"/><path d="M405 66 H450" class="k-arrow k-new-s"/>
  <path d="M535 92 C535 150 470 196 405 196" class="k-arrow k-hot-s"/>
  <path d="M235 196 H190" class="k-arrow k-hot-s"/>
  <text x="320" y="128" class="k-small">transactions locales, dans l’ordre</text>
  <text x="320" y="250" class="k-small k-hot-t">compensations, dans l’ordre inverse</text>
</svg>`,
  ring: `
<svg viewBox="0 0 640 300" role="img" aria-label="Sur l’anneau, un nouveau serveur ne récupère que les clés entre lui et son prédécesseur">
  <circle cx="190" cy="150" r="110" class="k-line"/>
  <path d="M190 40 A110 110 0 0 1 267.8 72.2" class="k-line k-hot-s" style="stroke-width:4"/>
  <g>
    <circle cx="190" cy="40" r="10" class="k-dot k-new-f"/><text x="190" y="22" class="k-new-t">A</text>
    <circle cx="300" cy="150" r="10" class="k-dot k-new-f"/><text x="320" y="155" class="k-new-t">B</text>
    <circle cx="190" cy="260" r="10" class="k-dot k-new-f"/><text x="190" y="288" class="k-new-t">C</text>
    <circle cx="80" cy="150" r="10" class="k-dot k-new-f"/><text x="60" y="155" class="k-new-t">D</text>
    <circle cx="267.8" cy="72.2" r="10" class="k-dot k-hot-f"/><text x="300" y="66" class="k-hot-t">E</text>
  </g>
  <g>
    <circle cx="227.6" cy="46.6" r="4" class="k-dot"/><circle cx="249" cy="57" r="4" class="k-dot"/>
    <circle cx="285.3" cy="95" r="4" class="k-dot"/><circle cx="285.3" cy="205" r="4" class="k-dot"/>
    <circle cx="135" cy="245.3" r="4" class="k-dot"/><circle cx="86.6" cy="112.4" r="4" class="k-dot"/>
  </g>
  <text x="360" y="60" class="k-left k-head k-hot-t">Avec hash(clé) % N</text>
  <text x="360" y="82" class="k-left k-small">ajouter un 5e serveur déplace</text>
  <text x="360" y="98" class="k-left k-small">environ 80 % des clés</text>
  <text x="360" y="150" class="k-left k-head k-new-t">Avec l’anneau</text>
  <text x="360" y="172" class="k-left k-small">ajouter E ne déplace que les clés</text>
  <text x="360" y="188" class="k-left k-small">entre A et E (en rouge), qui</text>
  <text x="360" y="204" class="k-left k-small">passent de B à E : environ 1/N</text>
</svg>`,
  canary: `
<svg viewBox="0 0 640 260" role="img" aria-label="Le load balancer envoie 5 % du trafic au canari, ses métriques sont comparées à celles de la version stable">
  <g class="k-reqs">
    <circle cx="30" cy="100" r="7"/><circle cx="30" cy="130" r="7"/><circle cx="30" cy="160" r="7"/>
  </g>
  <g class="k-ink">
    <rect x="70" y="102" width="120" height="56" rx="2"/><text x="130" y="127">Load balancer</text><text x="130" y="145" class="k-small">poids 95 / 5</text>
    <rect x="290" y="30" width="160" height="56" rx="2"/><text x="370" y="55">v1 · stable</text><text x="370" y="73" class="k-small">95 % du trafic</text>
    <rect x="510" y="102" width="120" height="56" rx="2"/><text x="570" y="127">Comparaison</text><text x="570" y="145" class="k-small">erreurs, p99, métier</text>
  </g>
  <g class="k-new">
    <rect x="290" y="174" width="160" height="56" rx="2"/><text x="370" y="199">v2 · canari</text><text x="370" y="217" class="k-small">5 % du trafic</text>
  </g>
  <path d="M38 130 H70" class="k-arrow"/>
  <path d="M190 120 C240 120 240 58 290 58" class="k-arrow"/>
  <path d="M190 140 C240 140 240 202 290 202" class="k-arrow k-new-s"/>
  <path d="M450 58 C480 58 480 120 510 120" class="k-arrow"/>
  <path d="M450 202 C480 202 480 140 510 140" class="k-arrow k-new-s"/>
  <text x="570" y="190" class="k-small k-new-t">ok : 25 %, puis 100 %</text>
  <text x="570" y="208" class="k-small k-hot-t">sinon : rollback</text>
</svg>`,
  upload: `
<svg viewBox="0 0 640 270" role="img" aria-label="Le fichier passe par la quarantaine, la validation, l’antivirus et le désarmement avant d’être servi depuis un domaine séparé">
  <g class="k-ink">
    <rect x="20" y="40" width="100" height="56" rx="2"/><text x="70" y="65">Client</text><text x="70" y="83" class="k-small">URL présignée</text>
    <rect x="330" y="40" width="130" height="56" rx="2"/><text x="395" y="65">Validation</text><text x="395" y="83" class="k-small">type réel, taille</text>
    <rect x="500" y="40" width="120" height="56" rx="2"/><text x="560" y="65">ClamAV</text><text x="560" y="83" class="k-small">signatures</text>
    <rect x="500" y="170" width="120" height="56" rx="2"/><text x="560" y="195">CDR</text><text x="560" y="213" class="k-small">fichier reconstruit</text>
  </g>
  <g class="k-hot">
    <rect x="160" y="40" width="130" height="56" rx="2"/><text x="225" y="65">Quarantaine</text><text x="225" y="83" class="k-small">jamais servie</text>
  </g>
  <g class="k-new">
    <rect x="330" y="170" width="130" height="56" rx="2"/><text x="395" y="195">Stockage propre</text><text x="395" y="213" class="k-small">copie désarmée</text>
    <rect x="130" y="170" width="160" height="56" rx="2"/><text x="210" y="195">Domaine séparé</text><text x="210" y="213" class="k-small">usercontent.example</text>
  </g>
  <path d="M120 68 H160" class="k-arrow"/><path d="M290 68 H330" class="k-arrow"/><path d="M460 68 H500" class="k-arrow"/>
  <path d="M560 96 V170" class="k-arrow"/>
  <path d="M500 198 H460" class="k-arrow k-new-s"/><path d="M330 198 H290" class="k-arrow k-new-s"/>
  <text x="478" y="130" class="k-small k-hot-t">suspect → rejet</text>
</svg>`,
  eventsourcing: `
<svg viewBox="0 0 640 260" role="img" aria-label="L’état courant est calculé en rejouant les événements, un snapshot évite de tout rejouer">
  <g class="k-new">
    <rect x="20" y="50" width="105" height="56" rx="2"/><text x="72" y="75">Ouvert</text><text x="72" y="93" class="k-small">v1</text>
    <rect x="140" y="50" width="105" height="56" rx="2"/><text x="192" y="75">Dépôt</text><text x="192" y="93" class="k-small">+100 · v2</text>
    <rect x="260" y="50" width="105" height="56" rx="2"/><text x="312" y="75">Retrait</text><text x="312" y="93" class="k-small">−30 · v3</text>
    <rect x="380" y="50" width="105" height="56" rx="2"/><text x="432" y="75">Dépôt</text><text x="432" y="93" class="k-small">+50 · v4</text>
  </g>
  <g class="k-ink">
    <rect x="520" y="50" width="100" height="56" rx="2"/><text x="570" y="75">Solde : 120</text><text x="570" y="93" class="k-small">état calculé</text>
    <rect x="200" y="190" width="240" height="48" rx="2"/><text x="320" y="211">Projections de lecture</text><text x="320" y="228" class="k-small">relevés, historique, statistiques</text>
  </g>
  <path d="M125 78 H140" class="k-line"/><path d="M245 78 H260" class="k-line"/><path d="M365 78 H380" class="k-line"/>
  <path d="M485 78 H520" class="k-arrow"/>
  <path d="M20 124 V132 H365 V124" class="k-line k-old-s"/>
  <text x="192" y="150" class="k-small">snapshot v3 : solde 70, on ne rejoue que la suite</text>
  <path d="M432 106 C432 150 380 160 360 190" class="k-arrow k-new-s"/>
  <text x="20" y="34" class="k-left k-small">event store : on ne fait qu’ajouter →</text>
</svg>`,
  tracing: `
<svg viewBox="0 0 640 270" role="img" aria-label="Une trace en cascade montre que le paiement et sa requête en base occupent l’essentiel des 3 secondes">
  <text x="20" y="24" class="k-left k-small k-mono">trace 4bf92f3577b34da6</text>
  <path d="M140 40 H620" class="k-line"/>
  <text x="140" y="56" class="k-small">0</text><text x="300" y="56" class="k-small">1 s</text><text x="460" y="56" class="k-small">2 s</text><text x="620" y="56" class="k-small">3 s</text>
  <g>
    <text x="20" y="84" class="k-left">gateway</text><rect x="140" y="73" width="480" height="14" class="k-bar"/>
    <text x="32" y="110" class="k-left k-small">auth</text><rect x="143" y="99" width="10" height="14" class="k-bar k-old-f"/>
    <text x="32" y="136" class="k-left k-small">panier</text><rect x="156" y="125" width="48" height="14" class="k-bar k-old-f"/>
    <text x="32" y="162" class="k-left k-small k-hot-t">paiement</text><rect x="212" y="151" width="392" height="14" class="k-bar k-hot-f"/>
    <text x="44" y="188" class="k-left k-small k-hot-t">requête SQL</text><rect x="220" y="177" width="368" height="14" class="k-bar k-hot-f"/>
    <text x="32" y="214" class="k-left k-small">notification</text><rect x="607" y="203" width="11" height="14" class="k-bar k-new-f"/>
  </g>
  <text x="400" y="250" class="k-small k-hot-t">chemin critique : paiement → requête SQL (2,3 s)</text>
</svg>`,
  backpressure: `
<svg viewBox="0 0 640 240" role="img" aria-label="La file bornée est pleine, le consommateur demande au producteur de ralentir">
  <g class="k-ink">
    <rect x="20" y="70" width="130" height="56" rx="2"/><text x="85" y="95">Producteur</text><text x="85" y="113" class="k-small">10 000 msg/s</text>
    <rect x="200" y="70" width="240" height="56" rx="2"/>
    <rect x="490" y="70" width="130" height="56" rx="2"/><text x="555" y="95">Consommateur</text><text x="555" y="113" class="k-small">2 000 msg/s</text>
  </g>
  <g>
    <rect x="208" y="80" width="18" height="36" class="k-bar k-hot-f"/><rect x="231" y="80" width="18" height="36" class="k-bar k-hot-f"/>
    <rect x="254" y="80" width="18" height="36" class="k-bar k-hot-f"/><rect x="277" y="80" width="18" height="36" class="k-bar k-hot-f"/>
    <rect x="300" y="80" width="18" height="36" class="k-bar k-hot-f"/><rect x="323" y="80" width="18" height="36" class="k-bar k-hot-f"/>
    <rect x="346" y="80" width="18" height="36" class="k-bar k-hot-f"/><rect x="369" y="80" width="18" height="36" class="k-bar k-hot-f"/>
    <rect x="392" y="80" width="18" height="36" class="k-bar k-hot-f"/><rect x="415" y="80" width="18" height="36" class="k-bar k-hot-f"/>
  </g>
  <text x="320" y="58" class="k-small k-hot-t">file bornée : pleine</text>
  <path d="M150 98 H200" class="k-arrow"/><path d="M440 98 H490" class="k-arrow"/>
  <path d="M555 126 C555 190 85 190 85 126" class="k-arrow k-new-s"/>
  <text x="320" y="210" class="k-small k-new-t">« ralentis » : demander moins, bloquer ou rejeter (429, 503)</text>
</svg>`,
  geo: `
<svg viewBox="0 0 640 300" role="img" aria-label="La recherche porte sur la cellule du point et ses huit voisines, puis la distance exacte est calculée sur les candidats">
  <g class="k-new">
    <rect x="40" y="20" width="195" height="195"/>
  </g>
  <rect x="105" y="85" width="65" height="65" class="k-bar k-new-f" style="opacity:.16"/>
  <g class="k-line" style="stroke-opacity:.5">
    <path d="M105 20 V280"/><path d="M170 20 V280"/><path d="M235 20 V280"/>
    <path d="M40 85 H300"/><path d="M40 150 H300"/><path d="M40 215 H300"/>
    <path d="M137.5 85 V150" class="k-dash"/><path d="M105 117.5 H170" class="k-dash"/>
  </g>
  <rect x="40" y="20" width="260" height="260" class="k-line"/>
  <circle cx="165" cy="144" r="7" class="k-dot k-hot-f"/>
  <circle cx="182" cy="156" r="5" class="k-dot"/><circle cx="122" cy="102" r="5" class="k-dot"/>
  <circle cx="70" cy="190" r="5" class="k-dot"/><circle cx="262" cy="248" r="5" class="k-dot"/><circle cx="280" cy="40" r="5" class="k-dot"/>
  <text x="340" y="44" class="k-left k-head">Geohash</text>
  <text x="340" y="66" class="k-left k-small k-mono">u09tv  → cellule ≈ 4,9 × 4,9 km</text>
  <text x="340" y="84" class="k-left k-small k-mono">u09tvw → cellule ≈ 1,2 × 0,6 km</text>
  <text x="340" y="130" class="k-left k-head k-new-t">Recherche</text>
  <text x="340" y="152" class="k-left k-small">cellule du point + 8 voisines (en bleu),</text>
  <text x="340" y="168" class="k-left k-small">puis distance exacte sur les candidats</text>
  <text x="340" y="214" class="k-left k-head k-hot-t">Effet de bord</text>
  <text x="340" y="236" class="k-left k-small">le livreur juste à côté du point est</text>
  <text x="340" y="252" class="k-left k-small">dans une autre cellule : sans les</text>
  <text x="340" y="268" class="k-left k-small">voisines, on le raterait</text>
</svg>`,
  dora: `
<svg viewBox="0 0 640 230" role="img" aria-label="Deux métriques de vitesse et deux métriques de stabilité">
  <text x="165" y="22" class="k-head k-new-t">Vitesse</text>
  <text x="475" y="22" class="k-head k-hot-t">Stabilité</text>
  <g class="k-new">
    <rect x="20" y="36" width="140" height="170" rx="2"/><rect x="170" y="36" width="140" height="170" rx="2"/>
    <text x="90" y="74">Fréquence de</text><text x="90" y="92">déploiement</text>
    <text x="240" y="74">Délai de mise</text><text x="240" y="92">en production</text>
  </g>
  <g class="k-hot">
    <rect x="330" y="36" width="140" height="170" rx="2"/><rect x="480" y="36" width="140" height="170" rx="2"/>
    <text x="400" y="74">Taux d’échec</text><text x="400" y="92">des changements</text>
    <text x="550" y="74">Temps de</text><text x="550" y="92">restauration</text>
  </g>
  <g>
    <path d="M50 168 A40 40 0 0 1 130 168" class="k-line"/><path d="M90 168 L118 140" class="k-line k-new-s" style="stroke-width:2"/>
    <path d="M200 168 A40 40 0 0 1 280 168" class="k-line"/><path d="M240 168 L268 140" class="k-line k-new-s" style="stroke-width:2"/>
    <path d="M360 168 A40 40 0 0 1 440 168" class="k-line"/><path d="M400 168 L372 140" class="k-line k-hot-s" style="stroke-width:2"/>
    <path d="M510 168 A40 40 0 0 1 590 168" class="k-line"/><path d="M550 168 L522 140" class="k-line k-hot-s" style="stroke-width:2"/>
  </g>
  <text x="90" y="194" class="k-small">élite : plusieurs / jour</text>
  <text x="240" y="194" class="k-small">élite : moins d’un jour</text>
  <text x="400" y="194" class="k-small">élite : environ 5 %</text>
  <text x="550" y="194" class="k-small">élite : moins d’une heure</text>
</svg>`,
  modulith: `
<svg viewBox="0 0 640 290" role="img" aria-label="Un seul déployable contient quatre modules qui ne communiquent que par leurs API publiques">
  <g class="k-ink">
    <rect x="20" y="20" width="600" height="250" rx="2"/>
  </g>
  <text x="320" y="44" class="k-head">1 déployable · 1 process</text>
  <g class="k-new">
    <rect x="50" y="64" width="250" height="78" rx="2"/><text x="175" y="92">Catalogue</text><text x="175" y="112" class="k-small">API publique · tables privées</text>
    <rect x="340" y="64" width="250" height="78" rx="2"/><text x="465" y="92">Commandes</text><text x="465" y="112" class="k-small">API publique · tables privées</text>
    <rect x="50" y="172" width="250" height="78" rx="2"/><text x="175" y="200">Compte</text><text x="175" y="220" class="k-small">API publique · tables privées</text>
    <rect x="340" y="172" width="250" height="78" rx="2"/><text x="465" y="200">Paiement</text><text x="465" y="220" class="k-small">API publique · tables privées</text>
  </g>
  <path d="M300 103 H340" class="k-arrow k-new-s"/>
  <path d="M465 142 V172" class="k-arrow k-new-s"/><text x="520" y="162" class="k-small k-new-t">via l’API</text>
  <path d="M300 236 H340" class="k-line k-hot-s k-dash"/>
  <text x="320" y="230" class="k-hot-t">✕</text>
  <text x="320" y="264" class="k-small k-hot-t">accès direct aux tables d’un autre module : refusé par la CI</text>
</svg>`,
  cap: `
<svg viewBox="0 0 640 280" role="img" aria-label="Pendant une partition, Francfort doit choisir entre refuser de répondre et répondre une valeur périmée">
  <g class="k-ink">
    <rect x="40" y="30" width="160" height="56" rx="2"/><text x="120" y="55">Paris</text><text x="120" y="73" class="k-small">écrit x = 2</text>
    <rect x="440" y="30" width="160" height="56" rx="2"/><text x="520" y="55">Francfort</text><text x="520" y="73" class="k-small">a encore x = 1</text>
  </g>
  <path d="M200 58 H300" class="k-line k-hot-s"/><path d="M340 58 H440" class="k-line k-hot-s"/>
  <text x="320" y="63" class="k-hot-t">✕</text>
  <text x="320" y="40" class="k-small k-hot-t">partition réseau</text>
  <g class="k-new">
    <rect x="40" y="160" width="270" height="96" rx="2"/>
    <text x="175" y="186" class="k-head">Choix CP</text>
    <text x="175" y="212" class="k-small">Francfort refuse de répondre</text>
    <text x="175" y="230" class="k-small">→ cohérent, mais indisponible</text>
  </g>
  <g class="k-ink">
    <rect x="330" y="160" width="270" height="96" rx="2"/>
    <text x="465" y="186" class="k-head">Choix AP</text>
    <text x="465" y="212" class="k-small">Francfort répond x = 1</text>
    <text x="465" y="230" class="k-small">→ disponible, mais périmé</text>
  </g>
  <path d="M500 86 C500 130 200 120 175 160" class="k-arrow k-new-s"/>
  <path d="M520 86 C520 120 470 130 465 160" class="k-arrow"/>
</svg>`,
};
