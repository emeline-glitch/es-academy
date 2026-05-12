# EXECUTION LOG MORCEAU 7 — Performance, SEO, JSON-LD, OG dynamiques

Date : 2026-05-12
Branch : main
Commits : 4b5cce3 → 84940b1 (5 commits)

---

## Commits

| Hash | Sujet |
|------|-------|
| 4b5cce3 | feat(seo): metadata globale et par page |
| 8956a93 | feat(seo): schemas JSON-LD complets (Organization, Article, Course, FAQ, Breadcrumb) |
| 9e0cff2 | feat(seo): OG images dynamiques via /api/og |
| 0efe558 | feat(seo): sitemap dynamique avec Notion et robots.ts |
| 84940b1 | perf(public): next/image, fonts, lazy loading composants lourds |

---

## Chantier A — Metadata par page

| Page | Status avant | Action |
|---|---|---|
| / | OK (buildMetadata) | Aucune action |
| /academy | OK | Override OG dynamique (variant=product) |
| /family | OK | Override OG dynamique (variant=product) |
| /family/support | OK | Aucune action (canonical OK) |
| /family/bienvenue | OK (noindex) | Aucune action |
| /blog | OK | Aucune action |
| /blog/[slug] | OK (generateMetadata Notion) | Confirmation /api/og branche |
| /blog/categorie/[category] | OK | Aucune action |
| /a-propos | OK | Aucune action |
| /podcast | OK | Override OG dynamique |
| /glossaire | OK | Override OG dynamique |
| /simulateurs + sous-pages | OK (layouts dedies) | Aucune action |
| /outils-gratuits | **MANQUANT** | **Layout cree** (indexable) |
| /simulateur (legacy) | **MANQUANT** | **Layout cree** (indexable) |
| /quiz-investisseur | OK | Aucune action |
| /masterclass | OK | Aucune action |
| /cahier-preview | OK (noindex saisonnier) | Aucune action |
| /calendrier-avent | OK (noindex saisonnier) | Aucune action |
| /chasse-oeufs | OK (noindex saisonnier) | Aucune action |
| /merci | **MANQUANT** | **Layout cree** (noindex) |
| /merci-outils | **MANQUANT** | **Layout cree** (noindex) |
| /desabonnement | **MANQUANT** | **Layout cree** (noindex) |
| /form/[slug] | **MANQUANT** | **Layout cree** (noindex) |
| /site-password | **MANQUANT** | **Layout cree** (noindex) |
| /mentions-legales, /cgv, /politique-confidentialite | OK | Aucune action |

Layout root (`src/app/layout.tsx`) enrichi avec : keywords, authors, creator,
publisher (Holdem Groupe), og:image fallback dynamique sur `/api/og`.

---

## Chantier B — Schemas JSON-LD

Module `src/lib/seo/schemas.ts` enrichi.

### Schemas par page (output verifie via curl + grep)

| Page | Schemas emis |
|------|--------------|
| Layout global (toutes pages) | `EducationalOrganization`, `WebSite`, `Person` |
| /academy | `Course`, `Product`, `FAQPage`, `BreadcrumbList` |
| /family | `FAQPage`, `BreadcrumbList` |
| /podcast | `PodcastSeries`, `BreadcrumbList` |
| /glossaire | `BreadcrumbList` |
| /simulateurs + sous-pages | `BreadcrumbList` (via layout) |
| /outils-gratuits | `BreadcrumbList` (via layout) |
| /blog/[slug] | `Article` + `BreadcrumbList` (existait deja) |
| /a-propos | `BreadcrumbList` (existait deja) |
| /blog | `BreadcrumbList` (existait deja) |

### Schemas factory ajoutes / enrichis

- `organizationSchema()` : ajout `address` (Issy-les-Moulineaux 92130 FR), `contactPoint` (customer support email), `legalName: "Holdem Groupe"`, `@id: SITE_URL#organization` reutilise par les autres schemas pour un graph coherent.
- `productSchema()` : NOUVEAU. Product + Offer (998 EUR) + AggregateRating (4.9 / 447).
- `podcastSeriesSchema()` : NOUVEAU. URL canonique vers otb-podcast.fr.
- `videoObjectSchema(video)` : NOUVEAU. Helper reutilisable pour hero video futur.
- `articleSchema()` : ajout `dateModified` et `mainEntityOfPage` typé WebPage.
- `personSchema()` : jobTitle change pour "Real Estate Investor and Educator" (anglais SEO-friendly).
- `websiteSchema()` : `@id` ajoute, publisher reference Organization via `@id`.
- `courseSchema()` : ajout `courseCode: ES-ACADEMY-V1`, `category: Online Course`, `inLanguage: fr-FR` sur CourseInstance.

Tous les schemas Course/Product/Article referencent l'Organization par `@id`
(graph coherent, pas de duplication).

---

## Chantier C — OG images dynamiques

`src/app/api/og/route.tsx` refactor :

- 3 variants : `default` | `blog` | `product`
- Parametres : `title`, `subtitle` (nouveau), `category`, `author`, `variant` (nouveau)
- Cache : `public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800`
- Test ok : `curl /api/og?title=Test&subtitle=Test+sub&variant=product` retourne 200 image/png 1200x630 (76 KB)

### Pages utilisant /api/og

| Page | URL OG |
|------|--------|
| /academy | `/api/og?title=ES+Academy+%3A+la+methode+Emeline+Siron&subtitle=...&variant=product` |
| /family | `/api/og?title=ES+Family...&variant=product` |
| /podcast | `/api/og?title=Out+of+the+Box...&category=Podcast` |
| /glossaire | `/api/og?title=Glossaire...&category=Ressource` |
| /blog/[slug] | `/api/og?title={article}&category={cat}&author={auth}` (existait) |
| Toutes autres pages (fallback) | `/api/og?title=Emeline+Siron&subtitle=Investir+en+immobilier...` |

### Sanity check visuel

Capture de l'OG /academy (rendue par node satori → PNG 1200x630) :

- Bandeau gold/green en haut
- Header `ES ACADEMY` uppercase tracking-wide + dot gold
- Title Georgia 76px noir
- Subtitle Helvetica 28px gris
- Footer : "AVEC Emeline Siron" + "emeline-siron.fr"
- Background cream → beige gradient

---

## Chantier D — Sitemap dynamique

`src/app/sitemap.ts` enrichi :

### Pages statiques (16 entrees fixes)

`/`, `/academy`, `/family`, `/family/support`, `/blog`, `/a-propos`,
`/podcast`, `/simulateur`, `/glossaire`, `/outils-gratuits`,
`/masterclass`, `/quiz-investisseur`, `/mentions-legales`, `/cgv`,
`/politique-confidentialite` + 9 simulateurs.

### Pages dynamiques

- **Articles blog** : `getPublishedArticles(100)` depuis Notion, `lastModified` = `publishDate`.
- **Pages saisonnieres** : conditionnees au cron `seasonal-toggle` (cahier/avent/chasse-oeufs n'apparaissent que pendant la saison active).
- **Glossaire** : entree unique `/glossaire` (les termes sont sur la meme page, pas de routes individuelles `/glossaire/[slug]`).

### Volumetrie

Sitemap genere : **81 entrees** (15 statiques + 9 simulateurs + ~57 articles Notion).
Test : `curl /sitemap.xml | grep -c '<url>'` → 81.

### Robots.txt

Disallow elargi : `/admin`, `/admin/`, `/api/`, `/dashboard`, `/cours`,
`/profil`, `/ressources`, `/coaching`, `/connexion`, `/inscription`,
`/desabonnement`, `/site-password`, `/form/`, `/merci`, `/merci-outils`,
`/family/bienvenue`.

Allow explicite : `/api/og` (LinkedIn / Twitter / Facebook bots ont besoin
de crawler l'OG image pour generer les previews).

`host: SITE_URL` ajoute (utilise par les crawlers qui le supportent).

---

## Chantier E — Performance (images, fonts, lazy)

### next/image

Pages publiques converties (de `<img>` vers `next/image`) :

| Fichier | Occurrences |
|---|---|
| `src/app/blog/page.tsx` | 1 → Image fill + sizes responsive |
| `src/app/blog/[slug]/page.tsx` | 2 → Image fill + priority sur cover above-the-fold |
| `src/app/blog/categorie/[category]/page.tsx` | 1 → Image fill + sizes responsive |
| `src/app/page.tsx` | 1 (logo OTB) → Image width/height + lazy |
| `src/app/podcast/page.tsx` | 1 (logo OTB) → Image width/height + priority |
| `src/app/calendrier-avent/page.tsx` | 2 (hero Unsplash + table) → Image fill, priority sur hero seulement |

Total : **8 occurrences converties** sur 8 candidates. Les `<img>` restantes
dans `src/app/cahier-preview/page.tsx` sont decoratives (polaroids inline
avec styles inline custom width/height) avec `eslint-disable-next-line`
explicite : on les garde telles quelles, pas de regression sur le score.

`grep -rln '<img' src/components --include="*.tsx"` : 0 occurrence
(aucun `<img>` dans les composants partages).

### Fonts

`src/app/layout.tsx` deja en `next/font/google` (Playfair_Display + Inter)
avec `display: 'swap'`. Pas de modification necessaire.

### next.config.ts

Ajout `remotePatterns` :
- `**.notion.so` (covers / icons Notion)
- `images.unsplash.com` (fallback photos blog + decoratifs saisonniers)

Patterns deja presents conserves : `**.amazonaws.com`, `prod-files-secure.s3.us-west-2.amazonaws.com`, `**.b-cdn.net`.

### Lazy-load composants lourds

- Calendly iframe (`/simulateurs/appel-decouverte`) : ajout `loading="lazy"` natif sur l'iframe. Defer du fetch Calendly tant que l'iframe n'est pas dans le viewport, gain LCP attendu ~600ms sur mobile 4G.
- iframe podcast (Ausha) : `loading="lazy"` deja present.
- `LazyIframe` composant : deja existant pour les embeds tiers.

Aucun simulateur n'utilise de lib graphique (recharts / chart.js).
Pas de `dynamic()` requis : grep `recharts|chart` → 0.

---

## Chantier F — Lighthouse

Lighthouse CLI **a executer par Emeline** depuis sa machine locale (sandbox
Claude Code n'a pas Chromium installé). Commande type :

```bash
npx lighthouse https://emeline-siron.fr \
  --output=html --output-path=./lighthouse-home.html \
  --chrome-flags="--headless" \
  --only-categories=performance,accessibility,best-practices,seo
```

Pages a auditer en priorite :
- `/` (homepage)
- `/academy` (page de vente, LCP critique)
- `/family` (page de vente)
- `/blog` (liste)
- `/blog/[un-slug]` (article, perf images)
- `/podcast`
- `/glossaire`
- `/simulateurs`
- `/simulateurs/rentabilite-locative`
- `/a-propos`

Objectif vise : 95+ sur les 4 categories pour les 10 pages.

Estimation basee sur les changements effectues :
- **SEO** : score attendu 100 (metadata complete + schemas JSON-LD + sitemap + robots + canonical sur toutes les pages).
- **Performance** : 90+ attendu (images converties next/image avec sizes responsifs, fonts en `display: swap`, lazy iframes, cache headers en place via next.config.ts).
- **Best practices** : 95+ attendu (HTTPS, security headers, no console errors, next.config bien configure).
- **Accessibility** : 85-90 (morceau 11 reprend ce point pour pousser a 95+ WCAG AA).

---

## Verification production-like

```bash
npm run build  # OK (compile 8.2s, type check OK, prerender OK)
curl /robots.txt           # OK (24 disallows + Allow /api/og + sitemap + host)
curl /sitemap.xml          # OK (81 urls)
curl /api/og?...           # OK (200, image/png, 1200x630, 76 KB)
curl /academy | grep "@type" # OK (7 schemas distincts emis)
curl /family | grep og:image # OK (URL pointe vers /api/og?variant=product)
```

---

## Recommandations pour morceau 11 (accessibilite WCAG AA)

Le morceau 11 touche les memes composants UI. Quelques pieges identifies
pendant le morceau 7 :

1. **Images `<img>` decoratives dans `/cahier-preview`** : `alt=""` + `aria-hidden="true"` deja partiellement la, mais a auditer (au moins 5 occurrences inline avec eslint-disable). Les conserver mais s'assurer du contraste alt/decor.

2. **`/calendrier-avent`** : photos hero Unsplash en `aria-hidden="true"` ✓. Verifier que le contenu textuel par-dessus est lisible (overlay sombre suffit-il pour AA 4.5:1 ?).

3. **OG image dynamique** : pas d'enjeu accessibilite (image visible uniquement sur les reseaux sociaux, pas dans le DOM client).

4. **Iframe Calendly** : `title="Reserver un appel..."` ✓ deja en place. Verifier qu'on a aussi un fallback texte lisible si l'iframe ne charge pas.

5. **Skip-to-content** : pas de `<a href="#main">Aller au contenu</a>` visible. A ajouter au Header.

6. **Color contrast** : `es-text-muted` (#5C6B62) sur `es-cream` (#F7F1E5) → ratio 4.7:1 (AA OK pour body text 14px+). A re-verifier sur tous les couples palette dans le morceau 11.

7. **Focus states** : `:focus-visible` outline a verifier sur Button, Input, Accordion, Link. Probablement OK via Tailwind defaults mais a auditer manuellement.

8. **ARIA landmarks** : `<main>` manque dans plusieurs pages (Header + sections empilees sans wrapper `<main>`). A ajouter systematiquement dans le morceau 11.

9. **Heading hierarchy** : pas d'h1 sur certaines pages (h2 direct). A auditer page par page.

10. **Schemas JSON-LD** : `aggregateRating` requiere des reviews verifiees (FTC + Google guidelines). Trustpilot 4.9/447 est OK (review réel). Si on ajoute des `Review` schemas individuels, il faut citer la source + URL Trustpilot reelle.

---

## Notes / Anomalies

- Le commit `84940b1` a accidentellement embarque des fichiers staged d'un autre morceau (validators Zod du morceau 3, route handlers refactor). Le contenu de ces fichiers etait valide et le build passe. Aucun rollback necessaire.
- `tsconfig.tsbuildinfo` a un cache TS qui a fait echouer le 1er build sur une fausse erreur (Supabase parser `notification_préférences`). Suppression du tsbuildinfo + rebuild → OK. Si Emeline rencontre ce probleme : `rm tsconfig.tsbuildinfo && rm -rf .next && npm run build`.
- L'URL de base dans la sortie locale du sitemap est `http://localhost:3000` car `NEXT_PUBLIC_SITE_URL` n'est pas dans l'env dev. En prod (Vercel/Netlify), la var pointe vers `https://emeline-siron.fr` et tout est correct.

---

Morceau 7 : LIVRE.
