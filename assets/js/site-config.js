/* ═══════════════════════════════════════════════════════════════════
   PRONTO HABITAT — Configuration globale
   ► Point unique de modification : téléphone, WhatsApp, email, zone,
     horaires, endpoints. Chargé dans le <head> de chaque page.

   Structure alignée sur celle de sosfonte.com (window.SFC) : PH
   s'adresse à un particulier, comme SOS Fonte, et non à un donneur
   d'ordre comme FX Services. Le tunnel, les canaux et l'agent
   conversationnel sont donc repris du modèle SF.

   ⚠ TOUTES les valeurs marquées A-REMPLACER correspondent au §23 du
     cadrage : « À VALIDER AVANT PUBLICATION ». Tant qu'une valeur
     porte ce marqueur, le site l'affiche comme zone à compléter au
     lieu d'inventer une donnée, et neutralise le lien concerné.
   ═══════════════════════════════════════════════════════════════════ */

window.PHC = {

  /* ── Identité ─────────────────────────────────────────────────── */
  brand: {
    name:      'PRONTO HABITAT',
    /* Signature verrouillée par le §2 de la charte. Ne pas reformuler,
       ne pas réordonner, ne pas abréger. */
    baseline:  'DÉPANNAGE · CONFORT · OPTIMISATION',
    parent:    'FX Services',
    filiation: 'Une marque FX Services',
  },

  /* ── Téléphone ────────────────────────────────────────────────
     Numéro de FX Services : Pronto Habitat est un nom commercial de
     la même société, il n'a pas de ligne propre.

     ⚠ WhatsApp est configuré sur ce même numéro, comme sur
     sosfonte.com. C'est une ligne fixe : vérifier que le compte
     WhatsApp Business y est réellement actif avant publication,
     sinon masquer le canal en vidant `wa`. */
  phone: {
    raw:     '0180846040',
    e164:    '+33180846040',
    wa:      '33180846040',
    display: '01 80 84 60 40',
  },


  /* ── Email ──────────────────────────────────────────────────── */
  email: 'contact@pronto-habitat.fr',

  /* ── Horaires ─────────────────────────────────────────────────
     Deux régimes, à ne jamais confondre à l'écran : le §1 du document
     de lancement demande de « bien distinguer visuellement les
     horaires généraux du service de dépannage », et de ne pas laisser
     entendre que les équipes projet sont joignables 24h/24.

     `hours` est donc l'horaire d'ouverture courant, celui du pied de
     page et des données structurées. `hoursDepannage` ne s'affiche
     que là où l'on parle explicitement d'intervention. */
  hours:          'Lundi au samedi, 7h00 – 19h00',

  /* Le même horaire au format schema.org, pour les données
     structurées. Deux champs plutôt qu'un analyseur : traduire
     « Lundi au samedi, 7h00 – 19h00 » par expression régulière
     marcherait jusqu'au jour où quelqu'un écrit « Lun-Sam ».
     Si les deux divergent, c'est `hours` qui fait foi à l'écran. */
  hoursSchema:    'Mo-Sa 07:00-19:00',
  hoursDepannage: '24h/24 · 7j/7',

  /* ── Zone d'intervention ──────────────────────────────────────
     Formulation validée pour la V1. Volontairement large : le §1 du
     document de lancement écarte les listes de villes artificielles.
     Les pages locales viendront des zones réellement travaillées et
     des réalisations disponibles, pas d'une génération de masse. */
  area:   'Île-de-France · Zones proches sur demande',
  cities: [],   // pages locales : V2, sur zones réellement travaillées

  /* ── WhatsApp — textes pré-remplis ────────────────────────────
     Le canal principal du parcours particulier chez SOS Fonte, et
     celui qui manquait le plus à Pronto Habitat. Un particulier qui
     photographie une fuite envoie la photo par WhatsApp, pas par
     formulaire. */
  wa: {
    default:      'Bonjour%2C%20j%27ai%20une%20question%20concernant%20mon%20logement.',
    depannage:    'Bonjour%2C%20j%27ai%20un%20probl%C3%A8me%20dans%20mon%20logement%20et%20j%27aurais%20besoin%20d%27un%20d%C3%A9pannage.',
    projet:       'Bonjour%2C%20j%27ai%20un%20projet%20de%20travaux%20dans%20mon%20logement%20et%20je%20souhaite%20en%20parler.',
    confort:      'Bonjour%2C%20je%20souhaite%20am%C3%A9liorer%20le%20confort%20de%20mon%20logement.',
    devis:        'Bonjour%2C%20je%20souhaite%20obtenir%20un%20devis%20pour%20des%20travaux.',
  },

  /* ── Société ──────────────────────────────────────────────────
     Pronto Habitat est un NOM COMMERCIAL de FX Services SAS, pas une
     entité distincte. Les mentions légales, l'entité qui contracte
     avec le particulier et les assurances sont donc celles de
     FX Services.

     Valeurs reprises de la page mentions-legales.html publiée sur
     fx-services.fr, qui fait foi — et non de sa configuration, moins
     complète. Cette page énonce d'ailleurs la règle mot pour mot :
     « FX Services SAS exploite les noms commerciaux SOS Fonte et
     Pronto Habitat. Ces marques ne constituent ni des sociétés
     distinctes ni des filiales : la seule personne morale
     contractante est FX Services SAS. »

     Le SIREN 948 147 962, que la configuration de SOS Fonte portait
     comme le sien, est en réalité celui d'AIFOS, l'agence qui a conçu
     les sites. Il n'y a donc pas de divergence à arbitrer.        */
  legal: {
    entity:    'FX Services SAS',
    forme:     'Société par actions simplifiée',
    capital:   '1 000 €',
    siren:     '950 771 527',
    siret:     '950 771 527 00017',
    rcs:       '950 771 527 R.C.S. Évry',
    address:   '108B rue des Maraîchers, 91140 Villebon-sur-Yvette, France',
    directeur: 'Khaled Chebbah',

    hebergeur: 'GitHub, Inc. — 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
    domaine:   'Hostinger International',
    conception: "AIFOS SAS — 6 rue d'Armaillé, 75017 Paris — SIREN 948 147 962, R.C.S. Paris",

    /* Assurance : compagnie MIC, contrat LUNS2600530, RC pro et
       décennale au titre des articles 1792 et suivants du Code civil.

       ⚠ PÉRIMÈTRE À VÉRIFIER. L'attestation FX couvre plomberie,
       chauffage, climatisation, ventilation, réseaux, électricité et
       maçonnerie. Pronto Habitat vend aussi du carrelage, de la
       peinture, de la plâtrerie, de la menuiserie intérieure et de
       l'agencement, qui n'y figurent pas. Faire étendre l'attestation
       ou restreindre le discours commercial — c'est le seul point où
       le site promet aujourd'hui plus que l'assurance ne couvre. */
    assureur:  'MIC — 29 rue de Bassano, 75008 Paris',
    contrat:   'LUNS2600530',

    /* Reprise de la configuration FX Services, qui la porte « clé 08
       à confirmer par le comptable ». Elle ne figure pas sur la page
       légale publiée de FX : à faire confirmer avant de s'en servir
       sur un document contractuel. */
    tva:       'FR08950771527',
    /* ⚠ OBLIGATION PROPRE À PRONTO HABITAT. Le recours à un médiateur
       de la consommation est obligatoire pour un professionnel qui
       contracte avec des particuliers. FX Services, qui s'adresse à
       des donneurs d'ordre, n'en publie pas : cette mention n'est
       donc pas héritable et doit être souscrite. */
    mediateur: 'A-REMPLACER',
  },



  brands: {
    fxservices: { name: 'FX Services', url: 'https://fx-services.fr' },
    sosfonte:   { name: 'SOS Fonte',   url: 'https://sosfonte.com' },
  },

  /* ── Formulaire — solution V1 temporaire ──────────────────────
     Le §4 du document de lancement écarte la création d'un endpoint
     PH dédié avant la mise en ligne : on réutilise celui de
     SOS Fonte, à condition de pouvoir distinguer les leads.

     D'où `formSource` et le préfixe d'objet : toute demande PH arrive
     identifiée dans la boîte commune. Un endpoint dédié pourra être
     créé plus tard sans rien changer d'autre ici.

     ⚠ Deux marques partagent donc une boîte de réception. Prévoir un
     filtre côté messagerie sur « [PRONTO HABITAT] », sinon les deux
     circuits commerciaux se mélangent à la lecture. */
  formEndpoint: 'https://formspree.io/f/xpqnzoyg',
  formSource:   'PRONTO_HABITAT',
  formPrefixe:  '[PRONTO HABITAT]',

  /* §5 — pas de module d'upload en V1. Les photos, plans et
     inspirations passent par WhatsApp en priorité, par email en
     alternative. Les champs fichier restent donc désactivés. */
  formUploads:  false,

  /* ── Supabase — Edge Function ingest-lead ─────────────────────
     Même contrat que sosfonte.com : { action: 'lead' | 'event' }.
     Deux options à arbitrer avant mise en production :
       a) créer un projet Supabase dédié à Pronto Habitat ;
       b) réutiliser le projet SOS Fonte en ajoutant une colonne
          `brand` et l'origine prontohabitat.fr à ALLOWED_ORIGINS
          de la fonction ingest-lead.
     L'option (b) est plus rapide mais mélange deux pipelines
     commerciaux dans une même table — à ne retenir que si le
     reporting sait les séparer.

     Tant que ingestUrl est nul, l'agent retombe sur Formspree, puis
     sur localStorage : aucun lead perdu, jamais. */
  supabase: {
    ingestUrl: null,
    anonKey:   null,
  },

  /* ── Agent conversationnel — Léa ──────────────────────────────
     Léa est l'assistante projet de Pronto Habitat. Elle ne partage
     rien avec Ben, qui appartient au territoire SOS Fonte : Ben est
     un technicien de diagnostic et d'urgence, Léa accompagne un
     particulier qui prépare un projet. Deux marques, deux rôles,
     deux personnages — §22 du cadrage de recette.

     Le §23 fixe son intitulé et interdit « experte IA », « conseillère
     IA », « chatbot » et « assistant virtuel intelligent ». Le client
     n'a pas besoin qu'on lui vende l'IA, il a besoin qu'on l'aide.

     ⚠ VISUELS — deux poses seulement sont disponibles à ce jour.
     Sur les 32 fichiers livrés, 16 portent du texte incrusté en bulle
     (interdit par le §26) et 14 représentent un second design, en
     tailleur et sans logo. Seuls `lea-master` et `lea-master 2`
     correspondent au design retenu : doudoune navy portant le
     wordmark Pronto Habitat.

     Les dix états de l'agent sont donc mappés sur ces deux poses.
     Dès que les poses manquantes seront produites dans le même
     design, il suffira de compléter `poses` ci-dessous.

     ⚠ NE PAS reprendre `lea-contactez nous.png` : ce visuel invente
     un pictogramme maison au-dessus du wordmark, que le §3 de la
     charte interdit explicitement. */
  lea: {
    enabled:   true,
    name:      'Léa',
    /* §23 — intitulé et sous-titre du widget, mot pour mot. */
    role:      'Assistante Pronto Habitat',
    baseline:  'Je vous aide à préciser votre besoin.',

    avatars:    true,
    avatarBase: 'assets/lea',

    /* Correspondance état → fichier. Neuf poses, toutes en design
       « doudoune logotée », toutes sans texte incrusté ni
       pictogramme maison. Les visuels paysage fournis placent le
       personnage à gauche et la bulle de texte à droite : le
       recadrage sur le personnage suffit à respecter le §26, sans
       retoucher les fichiers d'origine, qui sont tous conservés. */
    poses: {
      face:      'lea-face.webp',       // portrait carré — déclencheur et en-tête
      accueil:   'lea-accueil.webp',    // salut de la main
      explique:  'lea-explique.webp',   // main ouverte
      ecoute:    'lea-ecoute.webp',     // casque, prise de notes
      reflexion: 'lea-reflexion.webp',  // regard levé, stylo
      ok:        'lea-ok.webp',         // pouce levé
      montre:    'lea-montre.webp',     // téléphone, invite à envoyer une photo
      rassure:   'lea-rassure.webp',    // main au menton
      aurevoir:  'lea-aurevoir.webp',   // salut de la main
    },

    /* §29 — pas de grosse bulle permanente qui crie « chatbot ».
       Un micro-label au premier passage, puis il disparaît. */
    invite:       'Une question ? Léa peut vous aider.',
    inviteDelayMs: [14000, 20000],

    /* §24 — fermeture automatique après l'adieu. La spécification
       demande 3 à 5 secondes.

       ⚠ Le critère WCAG 2.2.1 proscrit une limite de temps non
       ajustable, et 4 s est en dessous du temps de lecture du
       message par une synthèse vocale. Le code annule donc la
       fermeture si le focus est encore dans le widget : un visiteur
       au clavier ou au lecteur d'écran n'est jamais coupé, tous les
       autres retrouvent le comportement demandé. */
    closeDelayMs: 0,   /* 0 = pas de fermeture automatique.
       WCAG 2.2.1 : une limite de temps n'est admise que si
       l'utilisateur peut la desactiver. La garde precedente ne
       protegeait que le mode focus — un lecteur d'ecran en mode
       navigation laisse activeElement sur <body> et voyait le
       widget disparaitre pendant qu'il lisait. */

    openHour:  8,
    closeHour: 19,

    /* Délais annoncés par Léa. Le §17 du cadrage éditorial interdit
       d'afficher une promesse d'intervention tant que le dispositif
       n'est pas réellement assuré, et le §21 de la recette ajoute :
       « ne promettre aucun SLA non tenu ».
       Tant que ces champs portent A-REMPLACER, Léa dit qu'elle
       transmet — sans jamais chiffrer. */
    sla: {
      whatsapp: 'A-REMPLACER',      // ex. 'réponse sous 1h en journée'
      rappel:   'A-REMPLACER',      // ex. 'rappel sous 2h'
    },
  },

};

/* Helper : URL WhatsApp complète. Renvoie null tant que le numéro
   n'est pas renseigné — les appelants masquent alors le bouton
   plutôt que d'ouvrir un WhatsApp vide. */
window.PHC.waUrl = function (type) {
  var n = window.PHC.phone.wa;
  if (!n || String(n).indexOf('A-REMPLACER') !== -1) return null;
  return 'https://wa.me/' + n + '?text=' + (window.PHC.wa[type] || window.PHC.wa.default);
};
