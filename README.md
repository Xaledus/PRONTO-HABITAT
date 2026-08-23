# Pronto Habitat

Site de [pronto-habitat.fr](https://pronto-habitat.fr) — marque grand public de
FX Services : dépannage, rénovation, confort et optimisation de l'habitat.

Statique, sans dépendance ni étape de compilation. HTML, deux feuilles de styles,
quatre scripts. Servi par GitHub Pages.

## Lancer en local

```bash
python -m http.server 4291
```

Puis <http://localhost:4291>.

## Structure

```
index.html                     accueil
depannage.html                 dépannage — 24h/24 · 7j/7
renovation.html                rénovation
confort-optimisation.html      confort & optimisation
realisations.html              grille des 11 chantiers, filtrable par thème
realisations/                  11 pages projet + 6 pages thématiques
pronto-habitat.html            qui sommes-nous, engagements
faq.html · contact.html · mentions-legales.html · 404.html

assets/css/ph.css              styles du site — palette verrouillée par la charte
assets/css/lea.css             agent conversationnel
assets/js/site-config.js       source de vérité unique : coordonnées, mentions
assets/js/site.js              injection des données, formulaires, JSON-LD
assets/js/agent-lea.js         agent conversationnel Léa
assets/js/tracking.js          attribution et conversions, sans script tiers
assets/img/site/               photographies des sections
assets/img/realisations/       un dossier par chantier
```

## Principes tenus

**Aucune donnée inventée.** Pas d'avis, pas de note, pas de délai, pas de prix,
pas de garantie qui ne vienne de l'entreprise. Un champ non renseigné fait
disparaître la ligne plutôt que d'afficher une valeur plausible.

**Aucune image de banque.** Les 149 photographies proviennent de chantiers
réellement conduits, publiées avec l'accord des clients concernés.

**Une seule source de vérité.** `assets/js/site-config.js` porte les
coordonnées, les horaires, la zone et les mentions légales ; tout le site s'y
alimente. Modifier une valeur à un seul endroit la met à jour partout.

**Zéro requête bloquante.** Pas de webfont, pas de script tiers, pas de CDN.

**Assets versionnés.** Chaque feuille et chaque script porte un condensat de son
contenu (`?v=…`), régénéré à la construction : une mise à jour atteint les
visiteurs déjà venus au lieu de rester bloquée dans leur cache.

## Accessibilité

Cible WCAG 2.1 AA / RGAA. Contrastes mesurés sur le rendu réel, focus visible,
navigation au clavier, `prefers-reduced-motion`, régions live sur les filtres.
Les dérivés d'orange (`--orange-title`, `--orange-text`) existent uniquement
parce que l'orange de marque ne passe pas les seuils de contraste en texte —
ils ne remplacent jamais `--ph-orange` sur les aplats et les CTA.

## Déploiement

GitHub Pages sur la branche `main`, domaine `pronto-habitat.fr` (fichier
`CNAME`). `.nojekyll` empêche le traitement Jekyll.

---

Conception AIFOS SAS · Marque FX Services
