/* ═══════════════════════════════════════════════════════════════════
   PRONTO HABITAT — Mesure des conversions et attribution
   Chargé avant site.js et agent-lea.js.

   §14 de la recette : avant toute campagne, savoir « non seulement
   combien de clics arrivent, mais quelles campagnes produisent de
   vrais prospects ».

   ── PARTI PRIS : ce fichier ne charge AUCUN script tiers ──────────

   Il n'installe ni Google Analytics, ni Meta Pixel, ni balise
   quelconque. Il se contente d'ÉMETTRE des événements et de les
   pousser dans trois directions, selon ce qui est disponible :

     1. `window.dataLayer` — s'il existe. Brancher Google Tag Manager
        plus tard suffit donc à tout recevoir, sans retoucher une
        seule ligne de ce site.
     2. `gtag()` — si une balise GA4 a été posée par ailleurs.
     3. l'Edge Function Supabase — si elle est configurée.

   Conséquence directe : tant qu'aucun outil tiers n'est branché, le
   site ne dépose aucun cookie publicitaire et n'appelle aucun
   domaine externe. Le bandeau de consentement devient nécessaire le
   jour où GTM ou GA4 est ajouté — pas avant. C'est ce que dit la
   page mentions légales, et cela reste vrai.

   ── ATTRIBUTION ──────────────────────────────────────────────────

   Les paramètres UTM sont conservés en `sessionStorage`, jamais en
   cookie, et jamais au-delà de la session. Ils ne partent que
   lorsque le visiteur envoie lui-même une demande : ils servent à
   savoir d'où vient un prospect, pas à le suivre.

   ⚠ À faire valider par la personne qui porte la conformité : selon
   la lecture retenue, une attribution de campagne peut relever du
   consentement même sans cookie. Le stockage est volontairement
   réduit au strict nécessaire pour que cette discussion soit
   simple à trancher.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CLE_UTM = 'ph_attribution';

  /* ── Capture de l'attribution ────────────────────────────────────
     Modèle retenu : **dernier contact non direct**, le standard pour
     attribuer un lead à une campagne.

     Concrètement : tant que le visiteur navigue sans nouveaux
     paramètres de campagne, l'attribution ne bouge pas. Dès qu'il
     revient par une nouvelle publicité, l'ancienne campagne est
     REMPLACÉE EN BLOC, pas fusionnée.

     Le remplacement en bloc est le point important. Une fusion
     champ par champ laisserait cohabiter le `gclid` d'une campagne
     Google avec l'`utm_source=meta` de la suivante, et le lead
     serait attribué à deux régies à la fois — donc à aucune de
     façon fiable.

     Seule la date de première visite survit d'une campagne à
     l'autre : elle mesure le délai de décision, pas l'origine. */
  var CHAMPS  = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var CLICS   = ['gclid', 'fbclid', 'msclkid', 'ttclid'];

  function capturer() {
    var deja = lire();
    var p = new URLSearchParams(window.location.search);
    var nouvelle = CHAMPS.concat(CLICS).some(function (c) { return p.get(c); });

    if (!nouvelle) {
      if (deja) return deja;
      /* Première arrivée sans campagne : on note quand même l'origine
         pour distinguer le direct du référent organique. */
      var a0 = { premiere_visite: new Date().toISOString(), landing: window.location.pathname };
      var ref = referentExterne();
      if (ref) a0.referrer = ref;
      ecrire(a0);
      return a0;
    }

    var a = { premiere_visite: (deja && deja.premiere_visite) || new Date().toISOString() };
    CHAMPS.concat(CLICS).forEach(function (c) { if (p.get(c)) a[c] = p.get(c); });
    a.landing = window.location.pathname;
    a.campagne_vue_le = new Date().toISOString();
    var r = referentExterne();
    if (r) a.referrer = r;
    ecrire(a);
    return a;
  }

  /* Le référent n'apprend quelque chose que s'il vient d'ailleurs :
     une navigation interne n'est pas une origine. */
  function referentExterne() {
    try {
      var r = document.referrer;
      if (r && new URL(r).hostname !== window.location.hostname) return r;
    } catch (e) {}
    return null;
  }

  function ecrire(a) {
    try { sessionStorage.setItem(CLE_UTM, JSON.stringify(a)); } catch (e) {}
  }

  function lire() {
    try { return JSON.parse(sessionStorage.getItem(CLE_UTM) || 'null'); }
    catch (e) { return null; }
  }

  var attribution = capturer();

  /* ── Émission ────────────────────────────────────────────────────
     Un seul point de sortie, trois destinations possibles. Rien
     n'échoue si aucune n'est branchée : l'événement part en console,
     ce qui suffit à recetter le parcours avant la mise en place de
     l'outil de mesure. */
  function emettre(nom, params) {
    var C = window.PHC || {};
    var charge = Object.assign({ event: nom, page: window.location.pathname }, attribution || {}, params || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(charge);

    if (typeof window.gtag === 'function') {
      window.gtag('event', nom, charge);
    }

    var sb = C.supabase || {};
    if (sb.ingestUrl) {
      fetch(sb.ingestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + sb.anonKey },
        body: JSON.stringify({
          action: 'event', brand: 'prontohabitat',
          event_type: nom, page_url: window.location.href,
          attribution: attribution || null,
          meta: params || null,
        }),
        keepalive: true,
      }).catch(function () {});
    }

    if (window.PH_DEBUG) console.log('[mesure]', nom, charge);
  }

  window.phTrack = emettre;
  window.phAttribution = function () { return attribution || {}; };

  /* ── Conversions du §14, branchées sur le DOM ────────────────────
     Ces quatre-là ne dépendent d'aucun autre script : elles sont
     posées ici pour que la mesure soit complète même si site.js
     évolue. */
  document.addEventListener('DOMContentLoaded', function () {

    /* Clic téléphone — le lien n'a de href que si le numéro existe. */
    document.querySelectorAll('a[href^="tel:"], [data-ph="phone-link"]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!el.getAttribute('href')) return;
        emettre('contact_phone_click', { emplacement: reperer(el) });
      });
    });

    /* Clic WhatsApp, hors agent — celui de Léa est mesuré séparément
       pour distinguer les deux origines dans le reporting. */
    document.querySelectorAll('[data-ph-wa]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (!el.getAttribute('href')) return;
        emettre('contact_whatsapp_click', {
          emplacement: reperer(el),
          contexte: el.getAttribute('data-ph-wa') || 'default',
        });
      });
    });

    /* Envoi des deux formulaires. L'écouteur est posé en capture :
       il passe avant celui de site.js, donc l'événement part même si
       la soumission bascule ensuite sur le repli mailto. */
    document.querySelectorAll('form[data-ph-form]').forEach(function (f) {
      f.addEventListener('submit', function () {
        var parcours = f.getAttribute('data-ph-form') || 'inconnu';
        emettre('form_submit', { parcours: parcours });
        emettre(parcours.indexOf('pann') !== -1 ? 'form_depannage_submit' : 'form_projet_submit', {});
      }, true);
    });
  });

  /* Où le visiteur a-t-il cliqué ? Utile pour savoir si les
     conversions viennent de l'en-tête, du bandeau, de la barre
     mobile ou du corps de page. */
  function reperer(el) {
    if (el.closest('.site-header'))  return 'en-tete';
    if (el.closest('.action-bar'))   return 'barre-mobile';
    if (el.closest('.action-band'))  return 'bandeau';
    if (el.closest('.hero, .page-hero')) return 'hero';
    if (el.closest('.cta-strip'))    return 'cta-final';
    if (el.closest('.site-footer'))  return 'pied';
    return 'corps';
  }

})();
