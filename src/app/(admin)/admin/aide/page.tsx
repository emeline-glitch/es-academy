import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AidePage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Aide & documentation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Comment fonctionnent les widgets, listes CRM et CTAs tracking. Pour Tiffany, Antony et toute l&apos;équipe.
        </p>
      </header>

      {/* ============================================================
          1. CTAs tracking
          ============================================================ */}
      <section className="mb-8">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">1. Comment tagger un nouveau CTA</h2>
        <Card>
          <p className="text-sm text-gray-700 mb-4">
            Chaque bouton ou lien commercial peut être tracké pour savoir lequel rapporte le plus de ventes.
            Le widget &quot;Top CTA convertisseurs&quot; du dashboard liste tous les boutons tagués avec leur taux de
            conversion réel.
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">Comment faire</h3>
          <p className="text-sm text-gray-700 mb-3">
            Ajouter l&apos;attribut <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">data-cta=&quot;mon-id&quot;</code> sur le bouton ou le lien. C&apos;est tout.
            Le tracking se fait automatiquement (provider global dans le layout).
          </p>

          <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-3 overflow-x-auto mb-4">
{`<a href="/academy" data-cta="home-hero-academy">
  Découvrir ES Academy
</a>`}
          </pre>

          <h3 className="font-semibold text-gray-900 mb-2">Convention de nommage</h3>
          <p className="text-sm text-gray-700 mb-2">
            Format <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">page-placement-action</code> en kebab-case.
          </p>
          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
            <li><strong>page</strong> : <code>home</code>, <code>academy</code>, <code>family</code>, <code>coaching</code>, <code>mc</code>, <code>quiz</code>, <code>sim</code>, <code>cahier</code>, <code>pod</code>, <code>blog</code></li>
            <li><strong>placement</strong> : <code>hero</code>, <code>pricing</code>, <code>end</code>, <code>cta-block</code>, <code>footer</code>, <code>mobile</code></li>
            <li><strong>action</strong> : <code>academy</code>, <code>family</code>, <code>checkout</code>, <code>book</code>, <code>optin</code>, <code>scroll</code></li>
          </ul>

          <h3 className="font-semibold text-gray-900 mb-2">CTAs déjà tagués</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              "home-hero-academy", "home-hero-family", "home-univers-academy", "home-univers-family",
              "home-cta-academy", "academy-hero-scroll", "academy-coaching-devis", "academy-end-scroll",
              "academy-checkout-1x", "academy-checkout-3x", "academy-checkout-4x",
              "family-hero-fondateur", "family-pricing-fondateur", "family-bridge-academy",
              "mc-hero-optin", "quiz-hero-optin",
              "coaching-included-book", "coaching-paid-book", "coaching-packages-sales",
              "pod-end-academy", "sim-appel-decouverte-fallback", "newsletter-banner-subscribe",
            ].map((cta) => (
              <code key={cta} className="bg-gray-50 border border-gray-200 px-2 py-1 rounded font-mono text-gray-700">{cta}</code>
            ))}
          </div>
        </Card>
      </section>

      {/* ============================================================
          2. Widgets dashboard
          ============================================================ */}
      <section className="mb-8">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">2. Comment lire le dashboard</h2>
        <Card>
          <h3 className="font-semibold text-gray-900 mb-2">Bandeaux d&apos;alerte (en haut)</h3>
          <ul className="text-sm text-gray-700 space-y-2 mb-4 list-disc pl-5">
            <li><strong className="text-red-600">🔴 Welcome mail Academy en échec</strong> : un élève a payé mais n&apos;a pas reçu son mail de bienvenue Family. Aller sur sa fiche élève pour relancer.</li>
            <li><strong className="text-red-600">🔴 Dunning Family</strong> : un abonné Family est en past_due ou unpaid (paiement échec côté Stripe). MRR menacé affiché.</li>
            <li><strong className="text-amber-600">🟠 Leads chauds</strong> : prospect a cliqué 3+ CTAs en 24h sans être client. <strong>Antony à appeler</strong>.</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mb-2">Stat cards principales</h3>
          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
            <li><strong>CA ce mois-ci</strong> + delta vs mois précédent (vert si +, rouge si -)</li>
            <li><strong>MRR Family</strong> : revenu récurrent mensuel + nb actifs + churn rate</li>
            <li><strong>CA total</strong> : depuis le lancement, HT entre parenthèses</li>
            <li><strong>Ventes ce mois</strong> : nombre d&apos;achats avec delta M-1</li>
            <li><strong>Contacts CRM</strong> + nombre arrivés aujourd&apos;hui</li>
            <li><strong>Élèves inscrits</strong> : profils avec au moins un enrollment actif</li>
            <li><strong>Pipeline deals gagnés</strong> : contacts en stage &quot;gagné&quot; Academy</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mb-2">Widgets analytiques</h3>
          <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pl-5">
            <li><strong>Vitesse de conversion</strong> : délai moyen entre arrivée CRM et bascule en gagné, par pipeline.</li>
            <li><strong>Coaching upsell</strong> : élèves ayant épuisé leurs crédits coaching (opportunités d&apos;upsell).</li>
            <li><strong>Abandon checkout</strong> : sessions Stripe créées mais non finalisées. Relances email auto J+1/J+3/J+7.</li>
            <li><strong>Top CTA convertisseurs</strong> : quels boutons rapportent le plus, par taux et CA attribué.</li>
            <li><strong>LTV par segment</strong> : revenu cumulé moyen selon Academy seul / Family seul / les deux.</li>
            <li><strong>Cohortes de conversion</strong> : par mois d&apos;arrivée CRM, taux et délai de conversion.</li>
            <li><strong>Funnel par lead magnet</strong> : opt-ins → acheteurs par LM.</li>
            <li><strong>CA par source d&apos;acquisition</strong> : quel canal rapporte le plus (newsletter, podcast, etc.).</li>
          </ul>
        </Card>
      </section>

      {/* ============================================================
          3. Listes CRM
          ============================================================ */}
      <section className="mb-8">
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">3. Utiliser les listes CRM</h2>
        <Card>
          <p className="text-sm text-gray-700 mb-4">
            9 listes auto-segmentées sur <a href="/admin/lists" className="text-es-green hover:underline">/admin/lists</a>.
            Un contact apparaît dans une liste dès qu&apos;il a le bon tag (auto), pas besoin de l&apos;ajouter à la main.
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">Les 3 dossiers</h3>
          <ul className="text-sm text-gray-700 space-y-2 mb-4 list-disc pl-5">
            <li><strong>Newsletter</strong> : 1 liste alimentée par le form public <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">/form/newsletter</code>. Partage ce lien en story Insta pour faire grossir la liste.</li>
            <li><strong>Lead magnets</strong> : 6 listes (Masterclass, Quiz, Simulateur, Cahier vacances, Calendrier Avent, Chasse œufs). Chaque opt-in atterrit dans la liste correspondante.</li>
            <li><strong>Paniers abandonnés</strong> : 2 listes (Academy, Family). Un contact y arrive si son checkout Stripe n&apos;a pas été finalisé sous 24h. Sort automatiquement à la complétion.</li>
          </ul>

          <h3 className="font-semibold text-gray-900 mb-2">Envoyer une campagne à une liste</h3>
          <p className="text-sm text-gray-700 mb-4">
            Aller dans <a href="/admin/emails/new" className="text-es-green hover:underline">/admin/emails/new</a>, sélectionner la liste cible dans <em>Audience</em>, écrire le mail, prévisualiser, envoyer.
          </p>

          <h3 className="font-semibold text-gray-900 mb-2">Créer une nouvelle liste</h3>
          <p className="text-sm text-gray-700">
            Sur <a href="/admin/lists" className="text-es-green hover:underline">/admin/lists</a>, cliquer &quot;+ Liste&quot; dans un dossier.
            Définir un <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">tag_key</code> unique. Tout contact qui aura ce tag apparaîtra automatiquement.
          </p>
        </Card>
      </section>

      {/* ============================================================
          4. Glossaire des tags
          ============================================================ */}
      <section>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">4. Glossaire des tags système</h2>
        <Card>
          <p className="text-sm text-gray-700 mb-4">
            Les tags appliqués automatiquement par les webhooks Stripe, Calendly et les forms publics.
          </p>

          <div className="space-y-3">
            <TagDoc tag="client" desc="Au moins un enrollment actif (Academy, Family, coaching). Posé par webhook Stripe à l'achat." />
            <TagDoc tag="prospect" desc="Inscrit newsletter, opt-in lead magnet ou form, mais pas encore acheteur." />
            <TagDoc tag="newsletter" desc="Inscrit newsletter via /form/newsletter ou tag historique." />
            <TagDoc tag="academy" desc="Acheteur Academy. Posé par webhook checkout.session.completed." />
            <TagDoc tag="family" desc="Abonné Family (actif ou résilié). Précisé par family:fondateur ou family:standard." />
            <TagDoc tag="lm:masterclass-fondatrice" desc="Opt-in masterclass evergreen." />
            <TagDoc tag="lm:quiz-investissement-locatif" desc="Opt-in quiz." />
            <TagDoc tag="lm:simulateur-rentabilite" desc="Opt-in simulateur." />
            <TagDoc tag="lm:cahier-vacances" desc="Opt-in cahier de vacances (juillet-août)." />
            <TagDoc tag="lm:calendrier-avent" desc="Opt-in calendrier de l'Avent (décembre)." />
            <TagDoc tag="lm:chasse-oeufs" desc="Opt-in chasse aux œufs (Pâques)." />
            <TagDoc tag="cart-abandoned:academy" desc="Panier Academy abandonné (24h+ sans paiement). Posé par cron J+1. Retiré à la complétion." />
            <TagDoc tag="cart-abandoned:family" desc="Panier Family abandonné, idem." />
            <TagDoc tag="source:newsletter" desc="Origine du lead, posé par webhook Calendly selon l'URL du RDV. Autres : podcast, linkedin, instagram, cahier, site." />
            <TagDoc tag="behavior:multi-magnet" desc="A opt-in 2+ lead magnets en 14j (signal d'intérêt fort)." />
            <TagDoc tag="behavior:masterclass-watched-full" desc="A regardé la masterclass jusqu'au bout." />
            <TagDoc tag="behavior:clicked-formation" desc="A cliqué un CTA Academy depuis un email." />
            <TagDoc tag="behavior:inactive-90" desc="Aucune activité depuis 90 jours, candidat à SEQ_REACT." />
            <TagDoc tag="rdv-calendly-pris" desc="A pris un RDV via Calendly (peu importe la source)." />
            <TagDoc tag="closer:antony" desc="Le RDV Calendly est assigné à Antony (vs host:emeline)." />
            <TagDoc tag="rgpd:legitimate-interest" desc="Import alumni Evermind (relation commerciale préexistante)." />
            <TagDoc tag="rgpd:cohorte-2-pending" desc="Cohorte 2 Brevo en attente de re-consentement explicite." />
          </div>
        </Card>
      </section>
    </div>
  );
}

function TagDoc({ tag, desc }: { tag: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <Badge variant="default">{tag}</Badge>
      <p className="text-sm text-gray-700 flex-1">{desc}</p>
    </div>
  );
}
