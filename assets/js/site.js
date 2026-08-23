/* ═══════════════════════════════════════════════════════════════════
   PRONTO HABITAT — Comportements du site
   Chargé en fin de <body> avec l'attribut defer.
   Socle repris de fx-services.fr (§22), adapté aux deux parcours PH.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var C = window.PHC || {};

  /* Une valeur du §23 est « en attente » tant qu'elle porte le
     marqueur. Une fonction unique, pour ne pas répéter le test. */
  function manquant(v) {
    return !v || String(v).indexOf('A-REMPLACER') !== -1;
  }

  /* ── Menu mobile ────────────────────────────────────────────────── */
  var toggle = document.querySelector('.nav-toggle');
  var nav    = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
    });

    /* closest() et non tagName : le jour où un lien du menu contient
       une icône ou un <span>, e.target est l'enfant et la fermeture
       casse. */
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) fermerNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        fermerNav();
        toggle.focus();
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1180) fermerNav();
    });
  }

  function fermerNav() {
    if (!nav) return;
    nav.classList.remove('is-open');
    document.body.classList.remove('nav-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }

  /* ── Injection des données de configuration ──────────────────────
     Le HTML porte des marqueurs data-ph. Quand la valeur est encore
     en attente, l'élément est RETIRÉ du document : le §42 interdit
     qu'un placeholder arrive en production, et un lien tel: vers rien
     est pire qu'un lien absent. */
  document.querySelectorAll('[data-ph]').forEach(function (el) {
    var cle = el.getAttribute('data-ph');
    var val;

    switch (cle) {
      case 'phone':      val = C.phone && C.phone.display; break;
      case 'phone-link': val = C.phone && C.phone.raw;     break;
      case 'email':      val = C.email;                    break;
      case 'hours':      val = C.hours;                    break;
      case 'hours-depannage': val = C.hoursDepannage;      break;
      case 'area':       val = C.area;                     break;
      case 'address':    val = C.legal && C.legal.address; break;
      default:
        /* Les mentions légales tirent une quinzaine de champs de
           C.legal. Plutôt que d'écrire quinze `case`, on résout par
           clé — data-ph="legal:siret" lit C.legal.siret. */
        if (cle.indexOf('legal:') === 0) {
          val = (C.legal || {})[cle.slice(6)];
          break;
        }
        return;
    }

    if (manquant(val)) {
      /* §42 — aucun placeholder ne doit arriver en production.
         L'élément est retiré, pas rempli d'un « À compléter » : une
         donnée absente doit se voir dans le suivi de projet, pas sur
         la page. On remonte au <li> ou au [data-ph-line] quand il y en
         a un : sinon la ligne resterait avec son étiquette et ses
         deux-points, ce qui est exactement le placeholder qu'on veut
         éviter. */
      var porteur = el.closest('li, [data-ph-line]') || el;
      porteur.remove();
      return;
    }

    if (cle === 'phone-link') {
      el.setAttribute('href', 'tel:' + val);
      var span = el.querySelector('[data-ph-text]');
      if (span) span.textContent = C.phone.display;
    } else if (cle === 'email') {
      el.textContent = val;
      if (el.tagName === 'A') el.setAttribute('href', 'mailto:' + val);
    } else {
      el.textContent = val;
    }
  });

  /* Un intitulé de colonne dont tous les liens ont été retirés doit
     partir avec eux : « Contact » suivi de rien est pire que rien. */
  document.querySelectorAll('.footer-col h2').forEach(function (h) {
    var n = h.nextElementSibling, vivant = false;
    while (n && n.tagName !== 'H2') {
      if (n.textContent.trim()) { vivant = true; break; }
      n = n.nextElementSibling;
    }
    if (!vivant) h.remove();
  });

  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ── Révélation au défilement ────────────────────────────────────
     Le CSS pose .reveal { opacity: 0 }. Si ce script ne s'exécute
     pas — erreur réseau, JS coupé — le contenu resterait invisible :
     la classe n'est donc AJOUTÉE QU'ICI, une fois qu'on sait pouvoir
     la retirer. Sans JS, rien n'est masqué. */
  var anime = !window.matchMedia
    || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (anime && window.IntersectionObserver) {
    var aReveler = document.querySelectorAll(
      '.assur-item, .tl-step, .enum-item, .presta-item, .budget-item, .reals-format > div');

    aReveler.forEach(function (el) { el.classList.add('reveal'); });

    var vue = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        vue.unobserve(e.target);   // une seule fois : pas de clignotement
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });

    aReveler.forEach(function (el) { vue.observe(el); });
  }

  /* ── Bascule entre les deux parcours du formulaire ────────────────
     Motif onglets ARIA. Les deux panneaux existent dans le DOM et
     sont des <form> complets : sans JS, l'utilisateur voit les deux
     formulaires l'un sous l'autre et peut toujours envoyer. */
  var onglets = document.querySelectorAll('.form-switch button[role="tab"]');

  if (onglets.length) {
    /* Le masquage n'est posé qu'ici, pour la même raison que .reveal. */
    onglets.forEach(function (btn, i) {
      var panneau = document.getElementById(btn.getAttribute('aria-controls'));
      if (panneau && i > 0) panneau.hidden = true;
      if (i === 0) btn.setAttribute('aria-selected', 'true');
    });

    /* Ouverture directe sur un parcours : contact.html#projet depuis
       les CTA « PARLER DE MON PROJET » du reste du site. */
    var ancre = window.location.hash.replace('#', '');
    if (ancre) {
      var cible = document.querySelector('.form-switch button[data-parcours="' + ancre + '"]');
      if (cible) activer(cible);
    }

    onglets.forEach(function (btn) {
      btn.addEventListener('click', function () { activer(btn); });
      btn.addEventListener('keydown', function (e) {
        var i = Array.prototype.indexOf.call(onglets, btn);
        if (e.key === 'ArrowRight') activer(onglets[(i + 1) % onglets.length]).focus();
        if (e.key === 'ArrowLeft')  activer(onglets[(i - 1 + onglets.length) % onglets.length]).focus();
      });
    });
  }

  function activer(btn) {
    onglets.forEach(function (b) {
      var sel = b === btn;
      b.setAttribute('aria-selected', String(sel));
      b.setAttribute('tabindex', sel ? '0' : '-1');
      var p = document.getElementById(b.getAttribute('aria-controls'));
      if (p) p.hidden = !sel;
    });
    return btn;
  }

  /* ── Canal WhatsApp ───────────────────────────────────
     Motif repris de sosfonte.com : chez un particulier, WhatsApp
     convertit mieux qu'un formulaire, parce qu'il permet d'envoyer
     une photo du problème en trois gestes.

     Le href n'est POSÉ QU'ICI, et seulement si le numéro existe. Le
     CSS masque tout [data-ph-wa] dépourvu de href : tant que le §23
     n'a pas fourni le numéro, le bouton n'apparaît pas du tout,
     plutôt que d'ouvrir un WhatsApp vide.                          */
  document.querySelectorAll('[data-ph-wa]').forEach(function (el) {
    var url = C.waUrl && C.waUrl(el.getAttribute('data-ph-wa') || 'default');
    if (!url) return;
    el.setAttribute('href', url);
    el.setAttribute('target', '_blank');
    el.setAttribute('rel', 'noopener');
  });

  /* ── Mode degrade : bandeau et en-tete ─────────────────
     Deux effets de bord quand le §23 n'est pas encore purge.

     1. Le bandeau propose « WhatsApp » puis « ou passer par le
        formulaire ». WhatsApp masque, la phrase commence par « ou »
        et ne veut plus rien dire. On reformule le repli.
     2. « Telephone a definir » est trop long pour l'en-tete et en
        deborde. Le manque reste signale par les blocs .todo et par
        l'avertissement console — inutile de casser la mise en page
        pour le redire une troisieme fois. */
  document.querySelectorAll('.action-band').forEach(function (band) {
    var wa  = band.querySelector('[data-ph-wa]');
    var alt = band.querySelector('[data-ph-alt]');
    if (alt && (!wa || !wa.getAttribute('href'))) {
      alt.textContent = alt.textContent.replace(/^ou\s+/i, '').trim();
      alt.textContent = alt.textContent.charAt(0).toUpperCase() + alt.textContent.slice(1);
    }
  });

  var tel = document.querySelector('.header-tel');
  if (tel && !tel.getAttribute('href')) tel.remove();

  /* ── Zone d'intervention ───────────────────────────────
     SOS Fonte accroche ses pages locales à cette section. Chez PH la
     liste vient de PHC.cities : vide, la section entière est retirée
     du DOM. Annoncer une couverture géographique qu'on n'a pas
     arbitrée (§23) est le pire des raccourcis commerciaux.          */
  var zone = document.querySelector('[data-ph-zone]');
  if (zone) {
    var villes = Array.isArray(C.cities) ? C.cities : [];
    if (!villes.length) {
      var sect = zone.closest('section');
      (sect || zone).remove();
    } else {
      var liste = zone.querySelector('.zone-list');
      if (liste) {
        liste.innerHTML = '';
        villes.forEach(function (v) {
          var nom = typeof v === 'string' ? v : v.name;
          var href = typeof v === 'string' ? null : v.url;
          var n = document.createElement(href ? 'a' : 'span');
          if (href) n.setAttribute('href', href);
          n.textContent = nom;
          liste.appendChild(n);
        });
      }
    }
  }

  /* ── Barre d'action mobile ───────────────────────────
     Elle ne garde que les canaux réellement joignables. Si aucun ne
     l'est, elle disparaît et la réserve de défilement avec elle. */
  var bar = document.querySelector('.action-bar');
  if (bar) {
    bar.querySelectorAll('a').forEach(function (a) {
      if (!a.getAttribute('href')) a.remove();
    });
    if (!bar.querySelector('a')) {
      bar.remove();
      document.body.style.paddingBottom = '0';
    }
  }

  /* ── Champs fichier ──────────────────────────────────────────────
     Le §18 prévoit photos, plans et documents sur les deux parcours,
     mais l'offre gratuite Formspree ne gère pas les pièces jointes.
     Les champs sont donc désactivés dans le HTML et n'apparaissent
     actifs que lorsque la configuration déclare l'inverse. Un champ
     qui accepte un fichier puis le perd en silence est pire qu'un
     champ absent. */
  if (C.formUploads) {
    document.querySelectorAll('[data-ph-upload]').forEach(function (el) {
      el.disabled = false;
    });
    document.querySelectorAll('[data-ph-upload-note]').forEach(function (el) {
      el.remove();
    });
  }

  /* ── Envoi des formulaires ───────────────────────────────────────
     Tant que l'endpoint n'est pas créé, on ne laisse PAS un POST
     partir dans le vide : le formulaire compose un brouillon d'email
     pré-rempli avec toutes les réponses. La demande arrive quand
     même, et l'utilisateur voit ce qu'il envoie. */
  document.querySelectorAll('form[data-ph-form]').forEach(function (form) {
    var statut = form.querySelector('.form-status');

    /* §4 du document de lancement — les leads PH partent sur
       l'endpoint de SOS Fonte le temps de la V1. Ils doivent donc
       arriver identifiables : une source explicite, et un objet
       préfixé pour qu'un filtre de messagerie sépare les deux
       circuits commerciaux à la lecture. */
    if (C.formSource && !form.querySelector('[name="source"]')) {
      var src = document.createElement('input');
      src.type = 'hidden'; src.name = 'source'; src.value = C.formSource;
      form.appendChild(src);
    }
    var sujet = form.querySelector('[name="_subject"]');
    if (sujet && C.formPrefixe && sujet.value.indexOf(C.formPrefixe) !== 0) {
      sujet.value = C.formPrefixe + ' ' + sujet.value.replace(/^\[[^\]]*\]\s*/, '');
    }

    if (!manquant(C.formEndpoint)) form.setAttribute('action', C.formEndpoint);

    form.addEventListener('submit', function (e) {
      /* Piège à robots : rempli = envoi silencieusement abandonné. */
      var piege = form.querySelector('input[name="_gotcha"]');
      if (piege && piege.value) { e.preventDefault(); return; }

      if (!manquant(C.formEndpoint)) return;   // POST normal vers Formspree

      e.preventDefault();
      if (!form.reportValidity()) return;

      var parcours = form.getAttribute('data-ph-form');

      /* §14 — l'attribution part avec la demande, y compris sur le
         repli mailto : sans elle on saurait qu'une campagne amene du
         trafic, jamais si elle amene des clients. */
      var attr = (window.phAttribution && window.phAttribution()) || {};
      if (Object.keys(attr).length && !form.querySelector('[name="attribution"]')) {
        var cache = document.createElement('input');
        cache.type = 'hidden'; cache.name = 'attribution';
        cache.value = JSON.stringify(attr);
        form.appendChild(cache);
      }

      var lignes = [];
      new FormData(form).forEach(function (v, k) {
        if (k.charAt(0) === '_' || !String(v).trim()) return;
        lignes.push(k.toUpperCase().replace(/-/g, ' ') + ' : ' + v);
      });

      var dest = manquant(C.email) ? '' : C.email;
      var sujet = '[Pronto Habitat] Demande ' + parcours;
      var corps = lignes.join('\n')
        + '\n\n— Envoyé depuis le site Pronto Habitat.';

      window.location.href = 'mailto:' + dest
        + '?subject=' + encodeURIComponent(sujet)
        + '&body='    + encodeURIComponent(corps);

      if (statut) {
        statut.className = 'form-status is-ok';
        statut.textContent = manquant(C.email)
          ? 'Votre message a été préparé dans votre logiciel de courrier. '
            + 'L\'adresse de destination reste à renseigner (§23).'
          : 'Votre message a été préparé dans votre logiciel de courrier. '
            + 'Il ne reste qu\'à l\'envoyer.';
      }
    });
  });

  /* ── Données structurées — §10 ────────────────────────────────
     Injectées depuis la configuration plutôt qu'écrites en dur dans
     les dix pages : une seule source de vérité, et rien à
     resynchroniser le jour où la zone ou les horaires arrivent.

     Google exécute le JavaScript avant d'interpréter le JSON-LD,
     donc l'injection convient. Le jour où les données seront figées,
     les figer aussi en statique dans le HTML serait plus robuste
     pour les moteurs qui ne rendent pas le JS.

     ⚠ RIEN N'EST INVENTÉ. Le §10 l'interdit explicitement : pas de
     note, pas de nombre d'avis, pas de prix, et ni `openingHours`
     ni `areaServed` tant que la configuration ne les porte pas.  */
  (function () {
    var lg = C.legal || {};
    if (!lg.entity) return;

    var schema = {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      '@id': window.location.origin + '/#pronto-habitat',
      name: 'Pronto Habitat',
      legalName: lg.entity,
      description: 'Dépannage, rénovation et amélioration de l\'habitat pour les '
        + 'particuliers : un interlocuteur identifié, un budget expliqué et une prise '
        + 'en charge du premier besoin jusqu\'aux finitions.',
      url: window.location.origin + '/',
      slogan: (C.brand && C.brand.baseline) || undefined,
    };

    if (lg.address) {
      /* L'adresse est celle du siège de FX Services : Pronto Habitat
         est un nom commercial, il n'a pas d'établissement propre. */
      var m = lg.address.match(/^(.+?),\s*(\d{5})\s+([^,]+)/);
      schema.address = m ? {
        '@type': 'PostalAddress',
        streetAddress: m[1], postalCode: m[2], addressLocality: m[3],
        addressCountry: 'FR',
      } : lg.address;
    }

    if (!manquant(C.phone && C.phone.e164)) schema.telephone = C.phone.e164;
    if (!manquant(C.email))                 schema.email = C.email;
    if (!manquant(C.area)) schema.areaServed = C.area;

    /* schema.org attend un format normé — « Mo-Sa 07:00-19:00 » — et
       ignore silencieusement « Lundi au samedi, 7h00 – 19h00 ».
       L'information était réelle et exacte, mais perdue : on publie
       la forme machine, et rien du tout si elle manque. */
    if (!manquant(C.hoursSchema))           schema.openingHours = C.hoursSchema;

    /* La marque mère et les marques sœurs, telles que les mentions
       légales les décrivent. */
    schema.parentOrganization = { '@type': 'Organization', name: lg.entity };

    /* PAS de `sameAs` vers les marques sœurs. `sameAs` signifie
       « la MÊME entité, ailleurs sur le web » : y mettre SOS Fonte
       et FX Services demande aux moteurs de fusionner trois marques
       distinctes en une. Le lien de parenté est déjà porté par
       `parentOrganization`, qui dit la vraie relation.
       `sameAs` reviendra le jour où Pronto Habitat aura ses propres
       profils — fiche Google, réseaux sociaux, annuaires. */

    Object.keys(schema).forEach(function (k) { if (schema[k] === undefined) delete schema[k]; });

    var el = document.createElement('script');
    el.type = 'application/ld+json';
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);
  })();

  /* ── Contrôle de recette ─────────────────────────────────────────
     Compte les blocs « à compléter » restants et le signale en
     console. Sert de garde-fou avant mise en ligne : le site ne doit
     pas partir en production avec des zones ouvertes. */
  var ouverts = document.querySelectorAll('.todo, .photo-todo').length;
  if (ouverts) {
    console.warn('[Pronto Habitat] ' + ouverts + ' zone(s) à compléter sur cette page — '
      + 'voir §23 et §24 du cadrage éditorial. Ne pas publier en l\'état.');
  }

})();
