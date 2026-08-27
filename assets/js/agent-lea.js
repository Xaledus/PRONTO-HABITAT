/* ═══════════════════════════════════════════════════════════════════
   LÉA — Assistante projet Pronto Habitat
   JS vanilla, aucune dépendance. Chargé en fin de <body> avec defer.

   Léa remplace intégralement Ben (§22 de la recette). Ben appartient
   au territoire SOS Fonte : spécialiste, technique, diagnostic,
   urgence. Léa accompagne un particulier qui prépare un projet —
   elle n'est pas une technicienne, elle est l'assistante projet.

   ── Ce qui change par rapport au moteur précédent ──────────────

   TON (§24). Simple, chaleureuse, précise, courte. Jamais
   infantilisante, jamais excessivement enthousiaste. Aucun « Super ! »,
   aucun « Génial ! », aucune fanfare d'émojis. Léa parle comme une
   excellente chargée de clientèle travaux.

   PARCOURS (§25, §28). Cinq questions maximum : besoin, précision,
   urgence ou échéance, détail libre, identité minimale. Léa ne
   cherche pas à tout qualifier — elle comprend assez pour orienter
   et faciliter le premier échange humain.

   WHATSAPP PRIORITAIRE (§17). Les trois canaux ne sont plus à
   égalité : WhatsApp est un bouton plein, le rappel et l'email deux
   liens. C'est le seul canal où le visiteur joint une photo, et son
   message part déjà résumé — le §18 impose qu'il n'ait jamais à
   raconter son projet une deuxième fois.

   LA CONVERSION TERMINE LE PARCOURS (§23 à §27). L'étape « Autre
   chose pendant que je suis là ? » est supprimée : confirmation,
   adieu, fermeture. Aucune relance, aucune boucle.

   ACCESSIBILITÉ. Quatre défauts bloquants du moteur précédent sont
   corrigés ici :
     · fermé, le widget restait dans l'arbre d'accessibilité et
       exposait trois arrêts de tabulation invisibles sur chaque page
       — il est désormais `hidden` et `inert` ;
     · le focus retombait sur <body> à chaque étape, obligeant à
       retraverser tout le document — il suit maintenant l'étape ;
     · le fil se refermait seul au bout de 45 s en pleine
       conversation. La fermeture automatique ne subsiste qu'APRÈS
       conversion (§24), et elle est annulée si le focus est encore
       dans le widget — voir etapeAdieu ;
     · les messages d'erreur s'effaçaient au focus, c'est-à-dire au
       moment précis où on les lisait — ils s'effacent à la saisie.

   Le lead reste protégé par trois niveaux de repli :
   Supabase → Formspree → localStorage. Rien n'est jamais perdu.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var C = window.PHC || {};
  var L = C.lea || {};
  if (L.enabled === false) return;

  var _p = C.phone || {};

  function manquant(v) { return !v || String(v).indexOf('A-REMPLACER') !== -1; }

  var CFG = {
    formspree:  manquant(C.formEndpoint) ? null : C.formEndpoint,
    ingestUrl:  (C.supabase && C.supabase.ingestUrl) || null,
    anonKey:    (C.supabase && C.supabase.anonKey)   || null,
    tel:        manquant(_p.raw) ? null : _p.raw,
    telAffiche: manquant(_p.display) ? null : _p.display,
    email:      manquant(C.email) ? null : C.email,
    wa:         (C.waUrl && C.waUrl('projet')) || null,
    nom:        L.name || 'Léa',
    role:       L.role || 'Assistante Pronto Habitat',
    baseline:   L.baseline || 'Je vous aide à préciser votre besoin.',
    invite:     L.invite || 'Une question ? Léa peut vous aider.',
    ouverture:  typeof L.openHour  === 'number' ? L.openHour  : 8,
    fermeture:  typeof L.closeHour === 'number' ? L.closeHour : 19,
    slaWA:      manquant((L.sla || {}).whatsapp) ? null : L.sla.whatsapp,
    slaRappel:  manquant((L.sla || {}).rappel)   ? null : L.sla.rappel,
  };

  var POSES = L.poses || {};
  /* Le chemin des avatars est racine-relatif dans la configuration.
     Depuis /realisations/xxx.html il pointait a cote et Lea
     s'affichait sans visage. On calcule le prefixe depuis la
     profondeur de l'URL courante plutot que de coder '../' en dur :
     le jour ou un dossier s'ajoute, rien a reprendre ici. */
  var PROFONDEUR = (location.pathname.replace(/\/[^/]*$/, '/')
                     .split('/').filter(Boolean).length);
  var RACINE = new Array(PROFONDEUR + 1).join('../');
  var BASE  = RACINE + (L.avatarBase || 'assets/lea').replace(/\/$/, '');
  var IMAGES = !!L.avatars;
  function pose(cle) {
    var f = POSES[cle] || POSES.face;
    return f ? BASE + '/' + f : null;
  }

  var V = {
    tel:    function (v) { return /^(\+33|0033|0)[1-9](\s?\d{2}){4}$/.test(v.replace(/[\s.\-]/g, '')); },
    email:  function (v) { return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v.trim()); },
    postal: function (v) { return /^\d{5}$/.test(v.trim()); },
  };
  var MSG = {
    tel:    'Format attendu : 06 12 34 56 78',
    email:  'Format attendu : nom@domaine.fr',
    postal: 'Cinq chiffres, par exemple 75014',
  };

  /* ── État ───────────────────────────────────────────────────── */
  var ouvert = false, donnees = {}, sessionId = null;
  var portraitA, portraitB, creneau = 'A';
  var typingEl = null, dejaOuvert = false, essaisFAQ = 0;
  var elTrigger, elInvite, elWidget, elThread, elFoot;
  var CLE_RETOUR = 'ph_lea_retour';

  function horsHoraires() {
    var h = new Date().getHours();
    return h < CFG.ouverture || h >= CFG.fermeture;
  }

  /* ── Portrait ───────────────────────────────────────────────── */
  function noeudPortrait() {
    if (IMAGES && pose('face')) {
      var i = document.createElement('img');
      i.src = pose('face'); i.alt = ''; i.loading = 'lazy';
      return i;
    }
    var d = document.createElement('span');
    d.className = 'lea-mono';
    d.setAttribute('aria-hidden', 'true');
    d.textContent = CFG.nom.charAt(0).toUpperCase();
    return d;
  }

  /* Fondu enchaîné entre deux poses. Sans visuels, no-op. */
  function montrer(cle) {
    if (!IMAGES || !portraitA || !portraitB) return;
    var src = pose(cle);
    if (!src) return;
    var suivant = creneau === 'A' ? portraitB : portraitA;
    var courant = creneau === 'A' ? portraitA : portraitB;
    if (suivant.getAttribute('src') === src) return;
    suivant.src = src;
    var bascule = function () {
      suivant.classList.remove('is-hidden');
      courant.classList.add('is-hidden');
      creneau = creneau === 'A' ? 'B' : 'A';
    };
    suivant.complete ? bascule() : (suivant.onload = bascule);
  }

  /* ── Construction ───────────────────────────────────────────── */
  function construire() {
    elTrigger = document.createElement('button');
    elTrigger.id = 'lea-trigger';
    elTrigger.type = 'button';
    elTrigger.setAttribute('aria-label', 'Ouvrir la discussion avec ' + CFG.nom);
    elTrigger.setAttribute('aria-expanded', 'false');
    elTrigger.appendChild(noeudPortrait());
    document.body.appendChild(elTrigger);

    elInvite = document.createElement('p');
    elInvite.id = 'lea-invite';
    elInvite.hidden = true;
    elInvite.innerHTML = CFG.invite.replace(CFG.nom, '<strong>' + CFG.nom + '</strong>');
    document.body.appendChild(elInvite);

    elWidget = document.createElement('div');
    elWidget.id = 'lea-widget';
    elWidget.setAttribute('role', 'dialog');
    elWidget.setAttribute('aria-label', 'Discussion avec ' + CFG.nom + ', ' + CFG.role);
    elWidget.hidden = true;

    var head = document.createElement('div');
    head.className = 'lea-head';

    var portrait = document.createElement('span');
    portrait.className = 'lea-portrait';
    if (IMAGES && pose('face')) {
      portraitA = document.createElement('img'); portraitA.src = pose('face'); portraitA.alt = '';
      portraitB = document.createElement('img'); portraitB.src = pose('face'); portraitB.alt = '';
      portraitB.className = 'is-hidden';
      portrait.appendChild(portraitA); portrait.appendChild(portraitB);
    } else {
      portrait.appendChild(noeudPortrait());
    }

    var id = document.createElement('span');
    id.className = 'lea-id';
    id.innerHTML = '<strong>' + CFG.nom + ' — ' + CFG.role + '</strong>'
      + '<span><span class="lea-dot" id="lea-dot"></span><span id="lea-statut">'
      + CFG.baseline + '</span></span>';

    var fermer = document.createElement('button');
    fermer.type = 'button';
    fermer.className = 'lea-close';
    fermer.setAttribute('aria-label', 'Fermer la discussion');
    fermer.innerHTML = '&#10005;';

    head.appendChild(portrait); head.appendChild(id); head.appendChild(fermer);

    elThread = document.createElement('div');
    elThread.className = 'lea-thread';
    elThread.id = 'lea-thread';
    elThread.setAttribute('role', 'log');
    elThread.setAttribute('aria-live', 'polite');
    elThread.setAttribute('aria-relevant', 'additions');

    elFoot = document.createElement('div');
    elFoot.className = 'lea-foot';
    elFoot.id = 'lea-foot';

    elWidget.appendChild(head); elWidget.appendChild(elThread); elWidget.appendChild(elFoot);
    document.body.appendChild(elWidget);

    inerte(elWidget, true);

    elTrigger.addEventListener('click', function () { ouvert ? fermerWidget() : ouvrir(); });
    fermer.addEventListener('click', fermerWidget);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && ouvert) fermerWidget();
    });

    if (horsHoraires()) {
      document.getElementById('lea-dot').classList.add('is-off');
      document.getElementById('lea-statut').textContent = 'Je prends votre message';
    }

    /* §29 — le déclencheur apparaît, le micro-label l'accompagne une
       seule fois puis s'efface. Pas de bulle permanente. */
    var plage = L.inviteDelayMs || [14000, 20000];
    var delai = plage[0] + Math.floor(Math.random() * Math.max(1, plage[1] - plage[0]));
    setTimeout(function () {
      elTrigger.classList.add('is-shown');
      if (ouvert || dejaOuvert) return;
      elInvite.hidden = false;
      requestAnimationFrame(function () { elInvite.classList.add('is-shown'); });
      setTimeout(cacherInvite, 7000);
    }, delai);
  }

  function cacherInvite() {
    if (!elInvite) return;
    elInvite.classList.remove('is-shown');
    setTimeout(function () { elInvite.hidden = true; }, 300);
  }

  /* `inert` retire le sous-arbre du focus ET de l'arbre
     d'accessibilité. `hidden` couvre les navigateurs qui ne le
     connaissent pas encore. opacity:0 seul ne retirait rien. */
  function inerte(el, actif) {
    if (actif) { el.setAttribute('inert', ''); el.hidden = true; }
    else       { el.removeAttribute('inert'); el.hidden = false; }
  }

  /* ── Ouverture / fermeture ──────────────────────────────────── */
  function ouvrir() {
    ouvert = true; dejaOuvert = true;
    donnees = {}; essaisFAQ = 0;
    cacherInvite();
    sessionId = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0;
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    inerte(elWidget, false);
    elWidget.classList.add('is-open');
    elTrigger.setAttribute('aria-expanded', 'true');
    viderFil(); viderPied();
    tracer('lea_open');
    horsHoraires() ? etapeHorsHoraires() : (charger() ? etapeRetour(charger()) : etapeAccueil());
  }

  function fermerWidget() {
    if (ouvert) tracer('lea_closed');
    ouvert = false;
    elWidget.classList.remove('is-open');
    elTrigger.setAttribute('aria-expanded', 'false');
    inerte(elWidget, true);
    /* Le focus doit revenir sur le déclencheur : sans cela il reste
       sur un bouton devenu invisible. */
    elTrigger.focus();
    setTimeout(function () { viderFil(); viderPied(); }, 300);
  }

  /* ── Fil ────────────────────────────────────────────────────── */
  function viderFil()  { if (elThread) elThread.innerHTML = ''; }
  function viderPied() { if (elFoot) elFoot.innerHTML = ''; }
  function auBas() {
    requestAnimationFrame(function () { if (elThread) elThread.scrollTop = elThread.scrollHeight; });
  }

  function dire(qui, html, delai) {
    return new Promise(function (res) {
      setTimeout(function () {
        retirerTyping();
        var b = document.createElement('div');
        b.className = 'lea-msg from-' + qui;
        b.innerHTML = html;
        elThread.appendChild(b);
        auBas(); res();
      }, delai || 0);
    });
  }

  function typing(delai) {
    return new Promise(function (res) {
      setTimeout(function () {
        typingEl = document.createElement('div');
        typingEl.className = 'lea-typing';
        typingEl.setAttribute('aria-hidden', 'true');
        typingEl.innerHTML = '<i></i><i></i><i></i>';
        elThread.appendChild(typingEl);
        auBas(); res();
      }, delai || 0);
    });
  }
  function retirerTyping() { if (typingEl) { typingEl.remove(); typingEl = null; } }

  function echapper(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── Choix ──────────────────────────────────────────────────── */
  function choix(liste, avecRetour) {
    viderPied();
    var wrap = document.createElement('div');
    wrap.className = 'lea-choices';
    liste.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lea-choice';
      b.textContent = c.label;
      b.addEventListener('click', function () {
        wrap.querySelectorAll('.lea-choice').forEach(function (x) { x.disabled = true; });
        viderPied();
        dire('user', echapper(c.label)).then(c.action);
      });
      wrap.appendChild(b);
    });
    elFoot.appendChild(wrap);

    /* §10 — plus de « Revenir au début » en pleine largeur dans
       chaque liste : une action discrète, qui revient d'une étape. */
    if (avecRetour && histoire.length > 1) {
      var back = document.createElement('button');
      back.type = 'button';
      back.className = 'lea-back';
      back.textContent = '← Modifier mon choix';
      back.addEventListener('click', revenir);
      elFoot.appendChild(back);
    }

    /* Le focus suit l'étape. Sans cette ligne, l'utilisateur clavier
       repart du haut du document à chaque réponse. */
    var premier = wrap.querySelector('.lea-choice');
    if (premier) premier.focus();
  }

  function saisie(placeholder, onSend, labelPasser) {
    viderPied();
    var row = document.createElement('div');
    row.className = 'lea-row';
    var lbl = document.createElement('label');
    lbl.className = 'hp'; lbl.htmlFor = 'lea-saisie'; lbl.textContent = placeholder;
    var ta = document.createElement('textarea');
    ta.id = 'lea-saisie'; ta.rows = 1; ta.placeholder = placeholder;
    var env = document.createElement('button');
    env.type = 'button'; env.className = 'lea-send';
    env.setAttribute('aria-label', 'Envoyer');
    env.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
    row.appendChild(lbl); row.appendChild(ta); row.appendChild(env);

    function envoyer() {
      var v = ta.value.trim();
      if (!v) { ta.focus(); return; }
      ta.disabled = true; viderPied();
      dire('user', echapper(v)).then(function () { onSend(v); });
    }
    env.addEventListener('click', envoyer);
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(); }
    });
    elFoot.appendChild(row);

    /* Champ facultatif : le §14 impose que le budget puisse être
       passé. Sans ce lien, une question « facultative » ne l'est
       que sur le papier. */
    if (labelPasser) {
      var passer = document.createElement('button');
      passer.type = 'button';
      passer.className = 'lea-back';
      passer.textContent = labelPasser;
      passer.addEventListener('click', function () {
        ta.disabled = true;
        viderPied();
        onSend('');
      });
      elFoot.appendChild(passer);
    }

    ta.focus();
  }

  function formulaire(champs, libelle, onSubmit) {
    viderPied();
    var f = document.createElement('div');
    f.className = 'lea-form';
    var entrees = {}, erreurs = {};

    champs.forEach(function (c) {
      var w = document.createElement('div');
      w.className = 'lea-field';
      var idc = 'lea-f-' + c.cle;
      /* Étiquette visible et persistante : un placeholder disparaît à
         la première frappe et ne peut donc pas servir d'étiquette. */
      var lab = document.createElement('label');
      lab.htmlFor = idc; lab.textContent = c.label;
      var inp = document.createElement('input');
      inp.id = idc; inp.type = c.type || 'text'; inp.placeholder = c.exemple || '';
      inp.autocomplete = c.cle === 'tel' ? 'tel' : c.cle === 'email' ? 'email'
                       : c.cle === 'nom' ? 'given-name' : c.cle === 'cp' ? 'postal-code' : 'off';
      var err = document.createElement('span');
      err.className = 'lea-err'; err.id = idc + '-err';
      inp.setAttribute('aria-describedby', err.id);
      entrees[c.cle] = inp; erreurs[c.cle] = err;

      /* L'erreur s'efface à la SAISIE, pas au focus : l'effacer au
         focus la masque au moment précis où on vient la lire. */
      inp.addEventListener('input', function () {
        inp.classList.remove('is-ko');
        inp.removeAttribute('aria-invalid');
        err.classList.remove('is-shown');
      });
      w.appendChild(lab); w.appendChild(inp); w.appendChild(err);
      f.appendChild(w);
    });

    function marquer(cle, ok, texte) {
      entrees[cle].classList.toggle('is-ko', !ok);
      if (ok) entrees[cle].removeAttribute('aria-invalid');
      else entrees[cle].setAttribute('aria-invalid', 'true');
      erreurs[cle].textContent = ok ? '' : texte;
      erreurs[cle].classList.toggle('is-shown', !ok);
    }

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'lea-submit'; btn.textContent = libelle;
    btn.addEventListener('click', function () {
      var data = {}, ok = true, premierFautif = null;
      champs.forEach(function (c) {
        var v = entrees[c.cle].value.trim();
        if (!v) { marquer(c.cle, false, 'Ce champ est nécessaire'); ok = false; premierFautif = premierFautif || c.cle; return; }
        if (c.valide && !c.valide(v)) { marquer(c.cle, false, c.erreur); ok = false; premierFautif = premierFautif || c.cle; return; }
        marquer(c.cle, true, '');
        data[c.cle] = v;
      });
      /* Le focus va au premier champ fautif : sans cela un lecteur
         d'écran n'apprend rien de l'échec. */
      if (!ok) { entrees[premierFautif].focus(); return; }
      Object.assign(donnees, data);
      onSubmit(data);
    });
    f.appendChild(btn);

    var consent = document.createElement('p');
    consent.className = 'lea-consent';
    consent.innerHTML = 'Ces informations servent uniquement à traiter votre demande. '
      + '<a href="' + RACINE + 'mentions-legales.html#confidentialite">En savoir plus sur le traitement de vos données</a>.';
    f.appendChild(consent);

    elFoot.appendChild(f);
    var premier = f.querySelector('input');
    if (premier) premier.focus();
  }

  /* ── FAQ ─────────────────────────────────────────────────────
     Réponses alignées sur faq.html. Tout ce qui relève du §23 —
     zone, horaires, décennale, prix — n'est jamais répondu en dur :
     la valeur vient de la configuration et se dégrade proprement. */
  var FAQ = [
    { k: ['devis', 'gratuit', 'estimation'],
      a: 'Le devis explique <strong>ce qui est prévu</strong>, pas seulement un montant. Le périmètre et le prix sont définis avant que quoi que ce soit ne commence.' },
    { k: ['budget', 'prix', 'tarif', 'cout', 'combien', 'enveloppe'],
      a: 'Nous distinguons l’<strong>indispensable</strong>, le <strong>recommandé</strong> et l’<strong>optionnel</strong>. L’objectif n’est pas de faire le maximum de travaux, c’est de faire les bons.' },
    { k: ['depassement', 'plus cher', 'supplement', 'rallonge'],
      a: 'Aucun travail supplémentaire n’est engagé sans vous en avoir expliqué l’origine et obtenu votre accord.' },
    { k: ['imprevu', 'surprise', 'probleme pendant'],
      a: 'Un chantier peut réserver des surprises. Nous vous informons rapidement, nous expliquons les conséquences, et vous décidez.' },
    { k: ['plusieurs metiers', 'corps d etat', 'coordination', 'artisans', 'plombier electricien'],
      a: 'Nous organisons les métiers nécessaires et veillons à leur enchaînement. Vous n’avez pas à devenir le conducteur de vos propres travaux.' },
    { k: ['interlocuteur', 'qui suit', 'referent', 'contact unique'],
      a: 'Un interlocuteur identifié suit votre dossier du premier échange jusqu’à la fin de l’intervention.' },
    { k: ['proprete', 'salir', 'poussiere', 'nettoyage', 'protection'],
      a: 'Protection des zones de passage, rangement et nettoyage font partie du travail, pas d’une option.' },
    { k: ['finition', 'finitions', 'soigne', 'qualite'],
      a: 'Un projet est terminé quand ce qui était prévu est réalisé — pas quand les artisans partent. Les détails visibles comptent autant que ce qui est derrière le mur.' },
    { k: ['reparer', 'remplacer', 'reparation', 'changer'],
      a: 'Un dépannage commence par un diagnostic, pas par un devis de remplacement. Quand une réparation suffit, nous réparons.' },
    { k: ['locataire', 'bailleur', 'proprietaire', 'copropriete', 'syndic', 'investisseur'],
      a: 'Nous intervenons pour les propriétaires occupants, les bailleurs, les nouveaux acquéreurs, les investisseurs et les copropriétaires.' },
    { k: ['photo', 'photos', 'plan', 'envoyer'],
      a: 'Oui, et c’est très utile : une ou deux photos permettent souvent de comprendre la situation avant de se déplacer.' },
    { k: ['vocabulaire', 'technique', 'je ne sais pas comment'],
      a: 'Vous n’avez pas besoin de connaître le nom technique des travaux. Dites-le avec vos mots, c’est mon métier de traduire.' },
    { k: ['delai', 'quand', 'combien de temps', 'rapidite', 'urgence'],
      dyn: function () {
        var dep = manquant(C.hoursDepannage) ? '' :
          'Pour un dépannage, nous intervenons <strong>' + C.hoursDepannage + '</strong>. ';
        var proj = manquant(C.hours) ? '' :
          '<span class="lea-note">Les équipes projet sont joignables ' + C.hours + '.</span>';
        return dep + 'Sur un projet, le calendrier est défini avec vous avant le démarrage, '
             + 'et nous vous prévenons si un événement peut le modifier.' + proj;
      } },
    { k: ['zone', 'secteur', 'ou intervenez', 'ville', 'departement', 'deplacement'],
      dyn: function () {
        return manquant(C.area)
          ? 'Notre zone d’intervention est en cours de publication. Donnez-moi votre code postal : je transmets et on vous confirme très vite.'
          : 'Nous intervenons sur le secteur suivant : <strong>' + C.area + '</strong>.';
      } },
    { k: ['assurance', 'decennale', 'garantie', 'assure'],
      dyn: function () {
        return manquant((C.legal || {}).insurance)
          ? 'Nos attestations d’assurance vous sont transmises avec le devis.'
          : 'Nous sommes couverts : ' + C.legal.insurance + '. L’attestation est jointe au devis.';
      } },
    { k: ['qui etes vous', 'fx services', 'societe', 'entreprise'],
      a: 'Pronto Habitat est la marque de <strong>FX&nbsp;Services</strong> dédiée aux particuliers.<span class="lea-note"><a href="' + RACINE + 'pronto-habitat.html">En savoir plus</a></span>' },
  ];

  function normaliser(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function chercherFAQ(q) {
    var n = normaliser(q);
    if (n.length < 3) return null;
    var best = null, score = 0;
    FAQ.forEach(function (e) {
      e.k.forEach(function (kw) {
        var nk = normaliser(kw);
        if (n.indexOf(nk) !== -1 && nk.length > score) { score = nk.length; best = e; }
      });
    });
    return best;
  }

  /* ── Visiteur connu ─────────────────────────────────────────── */
  function memoriser(tel, branche, label, nom) {
    try {
      localStorage.setItem(CLE_RETOUR, JSON.stringify({
        tel: tel, branche: branche, label: label, nom: nom || null,
        cp: donnees.cp || null,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }),
      }));
    } catch (e) {}
  }
  function charger() {
    try { return JSON.parse(localStorage.getItem(CLE_RETOUR) || 'null'); } catch (e) { return null; }
  }

  /* ── Historique — « ← Modifier mon choix » ───────────────────
     Le §10 supprime le bouton « Revenir au début » systématique au
     profit d'une action discrète, qui revient d'UNE étape et non au
     départ. On empile donc la fonction de chaque étape à choix ; y
     revenir consiste à dépiler et à retirer les deux derniers
     messages du fil — la question et la réponse qu'on rectifie. */
  var histoire = [];

  function poser(fn) { histoire.push(fn); }

  function revenir() {
    histoire.pop();
    var precedente = histoire.pop();
    var msgs = [].slice.call(elThread.querySelectorAll('.lea-msg'));
    msgs.slice(-2).forEach(function (m) { m.remove(); });
    viderPied();
    (precedente || function () { etapeAccueil(true); })();
  }

  /* ── Visiteur connu — §6 ─────────────────────────────────────
     Le rappel détaillé date + sujet est supprimé : les données
     restent en mémoire, elles ne sont simplement plus exposées. */
  async function etapeRetour(r) {
    if (r.tel) donnees.tel = r.tel;
    if (r.nom) donnees.nom = r.nom;
    if (r.cp)  donnees.cp  = r.cp;
    var prenom = (r.nom || '').trim().split(' ')[0];
    montrer('accueil');
    await typing(260);
    await dire('lea', (prenom ? 'Bonjour ' + echapper(prenom) + ', ravie de vous revoir.' : 'Bonjour, ravie de vous revoir.')
      + '<br>Vous revenez pour votre précédente demande ?', 800);
    tracer('lea_returning');
    poser(function () { etapeRetour(r); });
    choix([
      { label: 'Oui', action: function () {
          donnees.relance = true;
          donnees.branche = r.branche;
          donnees.brancheLabel = r.label;
          etapeCanal();
        } },
      { label: 'J’ai un autre besoin', action: function () { viderFil(); histoire = []; etapeAccueil(true); } },
    ]);
  }

  /* ── Message transmis — §18 ──────────────────────────────────
     Le message WhatsApp reprend tout le contexte déjà acquis. Le
     prospect ne doit jamais avoir à raconter son projet une
     deuxième fois. Seules les lignes réellement renseignées
     apparaissent : pas de « Échéance : — ». */
  function message() {
    var l = ['Bonjour, je viens du site Pronto Habitat.', ''];
    var prenom = (donnees.nom || '').trim().split(' ')[0];
    if (donnees.relance) l[0] = 'Bonjour, je vous recontacte au sujet de ma demande précédente.';
    if (prenom)              l.push('Prénom : ' + prenom);
    if (donnees.brancheLabel) l.push('Mon besoin : ' + donnees.brancheLabel);
    if (donnees.precision)    l.push('Projet : ' + donnees.precision);
    if (donnees.urgence)      l.push('Urgence : fuite en cours');
    if (donnees.echeance)     l.push('Échéance : ' + donnees.echeance);
    if (donnees.budget)       l.push('Budget : ' + donnees.budget);
    if (donnees.situation)    l.push('Situation : ' + donnees.situation);
    if (donnees.cp)           l.push('Code postal : ' + donnees.cp);
    return l.join('\n');
  }

  function ouvrirWA() {
    if (!CFG.wa) return;
    tracer('lea_whatsapp_clicked');
    window.open('https://wa.me/' + _p.wa + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
  }

  function ouvrirEmail() {
    tracer('lea_email_selected');
    window.location.href = 'mailto:' + (CFG.email || '')
      + '?subject=' + encodeURIComponent('[Pronto Habitat] ' + (donnees.brancheLabel || 'Demande'))
      + '&body=' + encodeURIComponent(message());
  }

  /* ── Collecte minimale ───────────────────────────────────────
     Règle §4 : une information acquise n'est jamais redemandée.
     Un visiteur connu ne repasse donc pas par cette étape. */
  function champsManquants(besoin) {
    var f = [];
    if (!donnees.nom) f.push({ cle: 'nom', label: 'Votre prénom', exemple: 'Camille' });
    if (besoin === 'tel' && !donnees.tel)
      f.push({ cle: 'tel', label: 'Votre téléphone', type: 'tel', exemple: '06 12 34 56 78', valide: V.tel, erreur: MSG.tel });
    if (besoin === 'email' && !donnees.email)
      f.push({ cle: 'email', label: 'Votre email', type: 'email', exemple: 'prenom@exemple.fr', valide: V.email, erreur: MSG.email });
    if (!donnees.cp)
      f.push({ cle: 'cp', label: 'Votre code postal', exemple: '75014', valide: V.postal, erreur: MSG.postal });
    return f;
  }

  /* ── QUESTION 5 — identité minimale, puis passage à l'humain ── */
  async function etapeCanal() {
    viderPied();
    var f = champsManquants(null);
    if (!f.length) { etapePasseMain(); return; }
    await typing(250);
    await dire('lea', 'Deux dernières informations et je vous passe la main.', 650);
    formulaire(f, 'Continuer', function () { etapePasseMain(); });
  }

  /* ── §17 — WhatsApp est le canal prioritaire ─────────────────
     Les trois canaux ne sont plus à égalité. WhatsApp est un CTA
     plein ; le rappel et l'email deviennent deux liens discrets.
     Motif : c'est le seul canal où le visiteur peut joindre une
     photo, et son message part déjà résumé. */
  async function etapePasseMain() {
    viderPied();
    montrer('ok');
    await typing(280);
    await dire('lea', '<strong>C’est bon, j’ai l’essentiel.</strong>', 600);

    if (!CFG.wa) { etapeCanauxSecondaires(); return; }

    await dire('lea', 'Le plus simple est de continuer sur WhatsApp. Votre demande sera déjà '
      + 'résumée et vous pourrez ajouter vos photos si besoin.', 550);
    tracer('lea_whatsapp_proposed');

    var bloc = document.createElement('div');
    bloc.className = 'lea-cta';

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'is-wa';
    b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg> Continuer sur WhatsApp';
    b.addEventListener('click', function () {
      donnees.canal = 'whatsapp';
      ouvrirWA();
      envoyerLead();
      etapeAdieu();
    });
    bloc.appendChild(b);

    var alt = document.createElement('div');
    alt.className = 'lea-alt';
    [['Je préfère être rappelé', canalRappel], ['Je préfère l’email', canalEmail]].forEach(function (o) {
      var a = document.createElement('button');
      a.type = 'button'; a.className = 'lea-altlink'; a.textContent = o[0];
      a.addEventListener('click', o[1]);
      alt.appendChild(a);
    });
    bloc.appendChild(alt);

    elFoot.appendChild(bloc);
    b.focus();
  }

  /* Repli quand WhatsApp n'est pas configuré. */
  async function etapeCanauxSecondaires() {
    viderPied();
    if (!CFG.tel && !CFG.email) {
      await dire('lea', 'Nos coordonnées ne sont pas encore publiées. Le formulaire reste le moyen '
        + 'le plus sûr de nous joindre.<span class="lea-note"><a href="' + RACINE + 'contact.html">Ouvrir le formulaire</a></span>', 550);
      return;
    }
    await dire('lea', 'Comment préférez-vous qu’on vous réponde ?', 550);
    choix([
      { label: 'Rappelez-moi', action: canalRappel },
      { label: 'Par email',    action: canalEmail },
    ]);
  }

  /* ── §19 — rappel téléphonique ───────────────────────────────── */
  async function canalRappel() {
    donnees.canal = 'tel';
    tracer('lea_callback_selected');
    viderPied();
    var f = champsManquants('tel');
    var confirmer = async function () {
      viderPied();
      montrer('ok');
      var prenom = (donnees.nom || '').trim().split(' ')[0];
      var m = 'C’est noté' + (prenom ? ', ' + echapper(prenom) : '') + '.<br>'
            + 'Nous avons les informations nécessaires pour vous rappeler.';
      if (CFG.slaRappel) m += ' Nous vous rappelons ' + CFG.slaRappel + '.';
      await dire('lea', m, 600);
      envoyerLead();
      etapeAdieu();
    };
    if (!f.length) { confirmer(); return; }
    await typing(240);
    await dire('lea', 'Il me faut juste votre numéro.', 600);
    formulaire(f, 'Valider', confirmer);
  }

  /* ── §20 — email ─────────────────────────────────────────────── */
  async function canalEmail() {
    donnees.canal = 'email';
    viderPied();
    var f = champsManquants('email');
    var envoyer = async function () {
      viderPied();
      montrer('ok');
      ouvrirEmail();
      envoyerLead();
      await dire('lea', 'Votre messagerie s’ouvre avec le message déjà rédigé'
        + (CFG.email ? ', à envoyer à <strong>' + CFG.email + '</strong>' : '') + '.', 600);
      etapeAdieu();
    };
    if (!f.length) { envoyer(); return; }
    await typing(240);
    await dire('lea', 'Il me faut juste votre email.', 600);
    formulaire(f, 'Valider', envoyer);
  }

  /* ── §23 à §27 — la conversion termine le parcours ───────────
     L'étape « Autre chose pendant que je suis là ? » est supprimée.
     Une conversion réussie ne relance pas la conversation : elle la
     referme.

     ⚠ ARBITRAGE D'ACCESSIBILITÉ. Le §24 demande une fermeture
     automatique après 3 à 5 secondes. C'est en dessous du temps de
     lecture du message d'adieu par une synthèse vocale, et le
     critère WCAG 2.2.1 proscrit une limite de temps non ajustable.
     Compromis retenu : la fermeture est programmée comme demandé,
     mais ANNULÉE si le focus se trouve encore dans le widget —
     c'est-à-dire si quelqu'un le parcourt au clavier ou au lecteur
     d'écran. Pour tous les autres, le comportement est celui de la
     spécification. Aucune donnée n'est perdue : le lead est déjà
     parti au moment où l'adieu s'affiche. */
  async function etapeAdieu() {
    viderPied();
    montrer('aurevoir');
    tracer('lea_completed');
    await dire('lea', 'Merci. À bientôt chez Pronto Habitat 👋', 500);

    /* Zero, absent ou negatif : on ne ferme jamais. Le widget garde
       son bouton de fermeture — c'est a l'utilisateur de decider,
       pas a un minuteur. */
    var delai = Number(L.closeDelayMs);
    if (!(delai > 0)) return;
    setTimeout(function () {
      if (!ouvert) return;
      if (elWidget.contains(document.activeElement)) return;
      fermerWidget();
    }, delai);
  }

  /* ══════════════════════════════════════════════════════════════
     PARCOURS — cinq questions maximum (§2, §28)
     Q1 besoin · Q2 précision · Q3 urgence, échéance ou budget ·
     Q4 détail libre · Q5 identité minimale, puis passage à l'humain.
  ══════════════════════════════════════════════════════════════ */

  async function etapeAccueil(court) {
    histoire = [];
    montrer(court ? 'ecoute' : 'accueil');
    await typing(200);
    await dire('lea', court
      ? 'Je vous écoute. De quoi s’agit-il ?'
      : 'Bonjour, je suis <strong>' + CFG.nom + '</strong>.<br>Vous avez un problème à résoudre, ou un projet en tête ?', 780);
    poser(function () { etapeAccueil(true); });
    choix([
      { label: 'Quelque chose ne fonctionne plus',     action: brancheDepannage },
      { label: 'Je veux refaire une pièce',            action: brancheRenovation },
      { label: 'Je veux aménager un espace',           action: brancheAmenagement },
      { label: 'Je veux améliorer mon confort',        action: brancheConfort },
      { label: 'J’ai une question de budget ou de devis', action: brancheBudget },
      { label: 'J’ai une autre question',              action: brancheFAQ },
    ]);
  }

  /* Q2 — une précision par branche. */
  function precision(fnSoi, titre, options, suite) {
    return (async function () {
      viderPied();
      montrer('ecoute');
      await typing(250);
      await dire('lea', titre, 620);
      poser(fnSoi);
      choix(options.map(function (o) {
        return { label: o, action: function () { donnees.precision = o; suite(); } };
      }), true);
    })();
  }

  function brancheDepannage() {
    donnees.branche = 'depannage'; donnees.brancheLabel = 'Dépannage';
    tracer('lea_branch_selected');
    return precision(brancheDepannage, 'Qu’est-ce qui ne va pas ?', [
      /* Ordre maître du §6 : plomberie, CVC, sanitaire, électricité.
         « Serrure, porte, menuiserie » est retiré — la serrurerie sort
         du périmètre mis en avant (§5). */
      'Une fuite d’eau', 'Chauffage, ventilation ou eau chaude',
      'Sanitaire ou évacuation', 'Un problème électrique',
      'Autre chose à réparer',
    ], etapeUrgence);
  }
  function brancheRenovation() {
    donnees.branche = 'renovation'; donnees.brancheLabel = 'Rénovation';
    tracer('lea_branch_selected');
    return precision(brancheRenovation, 'Quelle pièce souhaitez-vous refaire ?', [
      'La salle de bain', 'La cuisine', 'Une chambre ou un séjour',
      'Le logement entier', 'Juste rafraîchir',
    ], etapeEcheance);
  }
  function brancheAmenagement() {
    donnees.branche = 'amenagement'; donnees.brancheLabel = 'Aménagement';
    tracer('lea_branch_selected');
    return precision(brancheAmenagement, 'Quel espace souhaitez-vous transformer ?', [
      'Un garage, une annexe, un sous-sol', 'Redistribuer les pièces',
      'Transformer une pièce en bureau', 'Gagner du rangement',
    ], etapeEcheance);
  }
  function brancheConfort() {
    donnees.branche = 'confort'; donnees.brancheLabel = 'Confort & optimisation';
    tracer('lea_branch_selected');
    return precision(brancheConfort, 'Qu’est-ce qui vous gêne au quotidien ?', [
      'Une pièce trop froide', 'Trop chaud l’été', 'Éclairage ou prises mal placés',
      'Des factures trop élevées', 'Un équipement vieillissant',
    ], etapeEcheance);
  }

  /* ── §13 — budget simplifié ──────────────────────────────────
     Le discours « indispensable / recommandé / optionnel » sort du
     chat : il est développé sur le site, et le répéter ici alourdit
     sans faire avancer le parcours. Léa pose une question, pas un
     argumentaire. */
  async function brancheBudget() {
    donnees.branche = 'budget'; donnees.brancheLabel = 'Budget & devis';
    tracer('lea_branch_selected');
    viderPied();
    montrer('explique');
    await typing(250);
    await dire('lea', 'Vous avez déjà une idée de votre budget ?<br>'
      + '<span class="lea-note">Même approximative, ça nous aide à vous proposer quelque chose de cohérent.</span>', 700);
    poser(brancheBudget);
    choix([
      { label: 'Oui, j’ai une enveloppe', action: function () {
          donnees.precision = 'Enveloppe définie'; etapeMontant();
        } },
      { label: 'Je voudrais d’abord un devis', action: function () {
          donnees.precision = 'Demande de devis'; etapeEcheance();
        } },
      { label: 'Pas encore', action: async function () {
          donnees.precision = 'Budget à définir';
          await dire('lea', 'Aucun problème. On pourra en parler après avoir mieux compris votre projet.', 500);
          etapeEcheance();
        } },
    ], true);
  }

  /* ── §14 — plus de fourchettes imposées ──────────────────────
     Les quatre tranches disparaissent : un champ libre, facultatif,
     avec la possibilité explicite de passer. Le §18 du cadrage
     éditorial impose que le budget reste optionnel au premier
     contact — une liste fermée en faisait de fait une obligation. */
  async function etapeMontant() {
    viderPied();
    await typing(230);
    await dire('lea', 'Vous pouvez nous donner un montant ou une fourchette si vous le souhaitez.', 620);
    saisie('Par exemple : autour de 15 000 €', function (t) {
      if (t) donnees.budget = t;
      etapeDetail();
    }, 'Je préfère ne pas le dire');
  }

  /* ── §11 — urgence, uniquement quand elle apporte quelque chose ── */
  async function etapeUrgence() {
    viderPied();
    if (donnees.precision !== 'Une fuite d’eau') { etapeDetail(); return; }
    montrer('ecoute');
    await typing(240);
    await dire('lea', 'L’eau coule en ce moment ?', 600);
    poser(etapeUrgence);
    choix([
      { label: 'Oui, ça coule maintenant', action: async function () {
          donnees.urgence = true;
          await dire('lea', 'Coupez l’arrivée d’eau dès que vous pouvez : c’est le premier geste pour limiter les dégâts.', 550);
          etapeDetail();
        } },
      { label: 'Ça goutte, ou par intermittence', action: function () { donnees.urgence = false; etapeDetail(); } },
      { label: 'C’est une trace, de l’humidité',  action: function () { donnees.urgence = false; etapeDetail(); } },
    ], true);
  }

  /* ── §12 — échéance ──────────────────────────────────────────── */
  async function etapeEcheance() {
    viderPied();
    await typing(230);
    await dire('lea', 'Vous aimeriez démarrer quand ?', 600);
    poser(etapeEcheance);
    choix([
      { label: 'Dès que possible',            action: function () { donnees.echeance = 'Dès que possible'; etapeDetail(); } },
      { label: 'Dans les trois mois',         action: function () { donnees.echeance = 'Dans les trois mois'; etapeDetail(); } },
      { label: 'Plus tard',                   action: function () { donnees.echeance = 'Plus tard'; etapeDetail(); } },
      { label: 'Je me renseigne pour le moment', action: function () { donnees.echeance = 'Renseignement'; etapeDetail(); } },
    ], true);
  }

  /* ── Q4 — le seul champ libre du parcours (§15) ──────────────── */
  async function etapeDetail() {
    viderPied();
    montrer('ecoute');
    await typing(250);
    await dire('lea', 'Dites-moi en quelques mots ce qui se passe, ou ce que vous aimeriez obtenir.<br>'
      + '<span class="lea-note">Pas besoin de vocabulaire technique.</span>', 680);
    saisie('Votre situation en quelques mots…', async function (t) {
      donnees.situation = t;
      tracer('lea_detail_completed');
      /* §16 — la mention photos prépare la conversion WhatsApp sans
         créer une question de plus. */
      if (CFG.wa) {
        montrer('montre');
        await dire('lea', 'Si vous avez une photo, un plan ou une inspiration, vous pourrez nous '
          + 'l’envoyer directement sur WhatsApp.', 520);
      }
      etapeCanal();
    });
  }

  /* ── §21, §22 — FAQ ──────────────────────────────────────────── */
  async function brancheFAQ() {
    essaisFAQ = 0;
    tracer('lea_branch_selected');
    viderPied();
    montrer('explique');
    await typing(250);
    await dire('lea', 'Posez votre question, j’essaie d’y répondre simplement.', 650);
    saisie('Votre question…', repondreFAQ);
  }

  async function repondreFAQ(q) {
    viderPied();
    essaisFAQ++;
    var m = chercherFAQ(q);

    if (m) {
      tracer('lea_faq_hit');
      await typing(360);
      await dire('lea', m.dyn ? m.dyn() : m.a, 640);
      choix([
        { label: 'J’ai une autre question', action: function () { saisie('Votre question…', repondreFAQ); } },
        { label: 'Transmettre ma demande', action: function () {
            donnees.branche = donnees.branche || 'faq';
            donnees.brancheLabel = donnees.brancheLabel || 'Question';
            donnees.situation = donnees.situation || q;
            etapeCanal();
          } },
      ]);
      return;
    }

    if (essaisFAQ < 2) {
      montrer('reflexion');
      await typing(560);
      await dire('lea', 'Je n’ai pas de réponse précise à celle-là. Vous pouvez la reformuler ?', 660);
      saisie('Reformulez…', repondreFAQ);
      return;
    }

    /* Deux échecs : Léa passe la main, avec la question en contexte. */
    tracer('lea_faq_handoff');
    montrer('rassure');
    await typing(620);
    await dire('lea', 'Je préfère passer la main à quelqu’un qui saura vous répondre précisément.', 660);
    donnees.branche = 'faq';
    donnees.brancheLabel = 'Question';
    donnees.situation = q;
    etapeCanal();
  }

  /* ── §7 — hors horaires ──────────────────────────────────────── */
  async function etapeHorsHoraires() {
    montrer('accueil');
    await typing(260);
    await dire('lea', 'Bonjour. Nous sommes actuellement fermés, mais vous pouvez quand même nous '
      + 'laisser votre demande.<br>Elle sera reprise dès notre retour.', 780);
    choix([
      { label: 'Laisser ma demande', action: function () { donnees.horsHoraires = true; etapeAccueil(true); } },
      { label: 'J’ai une question',  action: brancheFAQ },
    ]);
  }

  /* ── Envoi du lead ──────────────────────────────────────────── */
  function envoyerLead() {
    var label = donnees.brancheLabel || donnees.branche || 'Demande';
    if (donnees.tel) memoriser(donnees.tel, donnees.branche, label, donnees.nom || null);

    var formspree = {
      _subject:  (C.formPrefixe || '[Pronto Habitat]') + ' Léa — ' + label
                 + (donnees.urgence ? ' — URGENT' : ''),
      source:    C.formSource || 'PRONTO_HABITAT',
      branche:   label,
      urgence:   donnees.urgence ? 'OUI' : 'non',
      precision: donnees.precision || '—',
      echeance:  donnees.echeance  || '—',
      budget:    donnees.budget    || '—',
      nom:       donnees.nom       || '—',
      telephone: donnees.tel       || '—',
      email:     donnees.email     || '—',
      codepostal: donnees.cp       || '—',
      situation: donnees.situation || '—',
      canal:     donnees.canal     || '—',
      horsHoraires: donnees.horsHoraires ? 'oui' : 'non',
      page:      window.location.href,
      horodatage: new Date().toLocaleString('fr-FR'),
      attribution: JSON.stringify((window.phAttribution && window.phAttribution()) || {}),
    };

    var supabase = {
      action: 'lead', brand: 'prontohabitat', agent: 'lea',
      branche: label,
      nom: donnees.nom || null, telephone: donnees.tel || null,
      email: donnees.email || null, codepostal: donnees.cp || null,
      message: donnees.situation || null, precision: donnees.precision || null,
      echeance: donnees.echeance || null, budget: donnees.budget || null,
      is_urgence: donnees.urgence === true, canal_contact: donnees.canal || null,
      session_id: sessionId, page: window.location.href,
      /* §14 — savoir quelle campagne produit de vrais prospects,
         pas seulement combien de clics elle achete. */
      attribution: (window.phAttribution && window.phAttribution()) || null,
    };

    function stocker(raison) {
      try {
        var l = JSON.parse(localStorage.getItem('ph_lea_leads') || '[]');
        l.push(formspree);
        localStorage.setItem('ph_lea_leads', JSON.stringify(l));
      } catch (e) {}
      console.warn('[Léa] Lead conservé en local (' + raison + ')');
    }

    function viaFormspree() {
      if (!CFG.formspree) { stocker('aucun endpoint configuré'); return; }
      fetch(CFG.formspree, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(formspree),
      }).then(function (r) { return r.json(); })
        .then(function (r) { if (!r.ok) throw r; console.log('[Léa] Formspree OK'); })
        .catch(function () { stocker('échec Formspree'); });
    }

    if (CFG.ingestUrl) {
      fetch(CFG.ingestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CFG.anonKey },
        body: JSON.stringify(supabase),
      }).then(function (r) { return r.json(); })
        .then(function (r) {
          if (r && r.ok) { window.__LEA = window.__LEA || {}; window.__LEA.leadId = r.lead_id; }
          else viaFormspree();
        }).catch(viaFormspree);
    } else {
      viaFormspree();
    }
  }

  function tracer(type) {
    /* Le bus commun retransmet vers dataLayer, gtag et Supabase.
       Lea garde en plus son envoi direct pour rester autonome si
       tracking.js n'est pas charge. */
    if (window.phTrack) window.phTrack(type, { agent: 'lea' });
    if (!CFG.ingestUrl) return;
    fetch(CFG.ingestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CFG.anonKey },
      body: JSON.stringify({
        action: 'event', brand: 'prontohabitat', agent: 'lea', event_type: type,
        session_id: sessionId,
        lead_id: (window.__LEA && window.__LEA.leadId) || null,
        page_url: window.location.href,
      }),
      keepalive: true,
    }).catch(function () {});
  }

  /* ── Init ───────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', construire);
  } else {
    construire();
  }

})();
