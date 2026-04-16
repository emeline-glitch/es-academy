import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { LazyIframe } from "@/components/ui/LazyIframe";
import { JsonLd } from "@/components/seo/JsonLd";
import { BottomBanner } from "@/components/marketing/BottomBanner";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { buildMetadata } from "@/lib/seo/metadata";
import { SITE_URL } from "@/lib/utils/constants";

export const metadata: Metadata = buildMetadata({
  title: "Qui est Emeline ?",
  description: "L'histoire d'Emeline Siron : de fille de garagiste à investisseuse avec 55 locataires. Son parcours, ses échecs, ses victoires.",
  path: "/a-propos",
});

const chapters = [
  {
    id: "enfance",
    year: "1990–2008",
    title: "Fille de garagiste",
    content: [
      "J'ai passé 26 ans de ma vie dans le 95, à Domont. Une enfance relativement classique : mes parents bossaient énormément, c'étaient des commerçants qui donnaient tout pour leurs clients. Je passais peu de temps à des loisirs avec eux. Je n'ai jamais fait de bowling, de sorties au parc…",
      "Ils avaient acheté une maison en Normandie quand j'étais toute petite — une ancienne boulangerie avec énormément de travaux. Tout était à refaire. Ils nous l'ont revendue quand j'avais 26 ans, après 20 ans de travaux.",
      "Comme je ne passais pas beaucoup de temps à faire des trucs fun avec mes parents, je me rapprochais naturellement de mon père en bricolant. Je l'aidais comme je pouvais depuis toute petite. J'ai toujours aimé les activités manuelles.",
    ],
  },
  {
    id: "lycee-echec",
    year: "2008",
    title: "L'échec qui a tout changé",
    content: [
      "Au lycée, j'ai découvert la liberté et l'envie de tester les limites. J'ai fait quelques boulettes, rien de grave. Je suis passée en conseil de discipline et j'ai loupé mon bac, alors que j'avais 27 points d'avance.",
      "J'avais déjà un caractère bien trempé, et j'étais en conflit avec l'école. Ils m'ont fait passer pour l'exemple. Même avec mes points d'avance, ils ont fait en sorte que je sois recalée. Ils me l'ont dit.",
      "Ça a été le plus gros échec de ma vie parce que j'avais toujours eu énormément de facilités.",
    ],
  },
  {
    id: "immo",
    year: "2008–2013",
    title: "L'entrée dans l'immobilier",
    content: [
      "Hors de question de stagner en restant un an de plus au lycée. Quand j'ai vu la déception dans les yeux de mes parents, je me suis dit qu'il fallait me bouger. J'ai cherché un BTS professions immobilières.",
      "Mes parents cherchaient une résidence secondaire dans le sud de la France, j'avais donc pu visiter des biens avec eux. J'ai gardé en tête l'image de cette femme blonde qui s'était occupée des visites — elle était arrivée dans une voiture élégante, elle avait l'air indépendante, de très bien gérer sa vie. Je me suis dit que le plan était plutôt pas mal.",
      "J'ai fait mon BTS, repassé mon bac en candidat libre et je l'ai eu. Il me manquait 3 points. Puis licence et Master en gestion de patrimoine immobilier.",
    ],
  },
  {
    id: "burnouts",
    year: "2015–2018",
    title: "Convergence CVL : deux burnouts",
    content: [
      "J'étais en alternance dans une boîte qui gérait des centres commerciaux. J'ai passé 2 ans là-bas, très formateur mais extrêmement dur psychologiquement. Je gérais les baux, les locataires, les copropriétés, tout.",
      "À une vingtaine d'années, j'ai fait deux burnouts. L'ambiance était terriblement mauvaise. J'ai vu partir 19 personnes en 6 mois. Le patron ne respectait personne. Quand je bossais bien, il bloquait mes primes pour le plaisir.",
      "Je ne craquais pas psychologiquement, c'était mon corps qui parlait. Je n'arrivais pas à bouger le matin, mon dos se bloquait. À chaque fois que j'étais arrêtée, le lendemain, tout était débloqué.",
      "À la fin de l'alternance, le patron m'a proposé de rester pour un SMIC. J'étais complètement perdue, dégoûtée de l'immobilier et du monde du travail.",
    ],
  },
  {
    id: "intérim",
    year: "2018–2019",
    title: "L'intérim et Swiss Life",
    content: [
      "Je n'ai jamais été éduquée pour ne rien faire. Je suis partie faire de l'intérim pour ne pas être enchaînée à un job détestable, voir différentes structures, comprendre ce que je voulais.",
      "J'ai intégré Swiss Life Asset Manager en remplacement de congé maternité — gestion d'immobilier commercial. Service 100% féminin, je n'y trouvais pas ma place. Je devais rester mais la personne remplacée est revenue et a récupéré son poste.",
      "Je n'arrivais pas à trouver ma place dans le monde classique du travail. J'étais un vrai électron libre. Parler des enfants et du beau temps me gonflait.",
    ],
  },
  {
    id: "lifento",
    year: "2019–2022",
    title: "Lifento : 250 millions d'euros à placer",
    content: [
      "J'ai intégré Lifento, une société en pleine création, boîte de gestion de fonds d'investissement. Une petite équipe de 3, tout à créer. J'y ai passé 3 ans. Mes boss étaient géniaux.",
      "Les caisses de retraite nous donnaient de l'argent à placer. Nous achetions de l'immobilier de santé en Europe en contrepartie d'un rendement. Je gérais environ 250 millions d'euros : EHPAD, hôtels pour patients, établissements de dialyse, psychiatriques.",
      "J'adorais passer ma vie sur les chantiers. Ils m'ont recrutée pour mon côté féminin et mon côté masculin très déployé. Pas de bla-bla, toujours dans l'action. Pas de problème pour aller négocier. C'est quelque chose que j'ai toujours adoré.",
    ],
  },
  {
    id: "relations",
    year: "2015–2020",
    title: "Relations imparfaites et prise de conscience",
    content: [
      "Personnellement, j'ai toujours enchaîné les relations imparfaites. Jamais célibataire longtemps.",
      "Première relation de 3 ans avec quelqu'un qui avait l'alcool et un peu violent. C'est aussi pour ça que je me suis mise à la boxe — un défouloir, le besoin de me sentir en sécurité sans dépendre de personne. J'ai fait 5 ans de boxe et de Viet Vo Dao. J'étais commissaire sportif et juge en compétition. J'étais douée en combat — j'avais une rage interne.",
      "Deuxième relation de 3 ans avec un cliché parfait du pervers narcissique. Caméras chez moi, vérification du téléphone, il m'avait coupée de mes potes et de ma famille. Enfer quotidien. Il m'a fallu du temps pour m'en rendre compte et m'en sortir.",
      "Un jour, une amie qui savait que j'étais dans l'immobilier m'a proposé de venir visiter un bien avec elle. J'ai eu un véritable déclic, un sentiment d'utilité. C'est là que tout a changé.",
    ],
  },
  {
    id: "premier-invest",
    year: "2020",
    title: "Mon premier investissement",
    content: [
      "En deux semaines, j'avais signé deux compromis pour 15 appartements — deux immeubles : un de 7 et un de 8 logements. J'avais simplement appliqué ce que je faisais dans mon job : tableaux, business plans.",
      "Je suis partie en vacances avec cette personne toxique, mais cette fois-ci je suis rentrée déterminée. C'était fini. Une semaine plus tard, j'ai rencontré l'homme qui deviendra mon mari.",
      "J'ai gardé l'immeuble de 8 appartements. Les galères : je me suis fait arnaquer sur les travaux, j'ai dû bricoler moi-même avec mes parents. Le chauffage a lâché en novembre avec 8 locataires dans l'immeuble. J'ai dû tout remplacer en urgence.",
      "Mais le modèle marchait : 3 250€ de loyer par mois, 1 250€ de mensualités, 700€ de charges. Il restait de l'argent. Plutôt cool.",
    ],
  },
  {
    id: "enchainement",
    year: "2020–2021",
    title: "L'enchaînement des opérations",
    content: [
      "J'ai commencé à investir en SCI avec mon père comme associé. Logique : j'étais un produit de fonds d'investissement, j'ai toujours été habituée aux sociétés et à l'optimisation.",
      "Super deal à rénover : maison de 140 m² transformée en coloc. Puis 2 colocations en août (5 et 6 personnes). Une maison en octobre transformée en 4 studios. Fin novembre, une maison qui deviendra un coliving de 8 chambres sur 230 m².",
      "En 2021, j'ai géré tous les travaux. Mon artisan n'avait que deux mains. Je l'ai aidé à monter sa boîte — j'ai expliqué comment faire, trouvé le comptable, recruté son équipe de 8 personnes via Pôle emploi : un couvreur, un carreleur, un plaquiste, un électricien.",
      "Cette personne à qui j'avais tendu la main a développé son entreprise. Sa situation familiale s'est arrangée. Il gérait tous mes chantiers. C'était cool de voir ça.",
    ],
  },
  {
    id: "demission",
    year: "2021–2022",
    title: "Instagram, la démission",
    content: [
      "J'avais commencé un compte Instagram depuis mon premier investissement, où je partageais mon quotidien. 1 500 à 2 000 abonnés, beaucoup de demandes de conseils. Je me suis dit : pourquoi pas en faire un complément de mon job ?",
      "Ma société a bloqué — clause d'exclusivité. Été 2021 : je pars en vacances à Punta Cana avec mon conjoint et je lui annonce que je dois démissionner. J'étais à 15 000€ de loyer facturé par mois, 6 000€ nets.",
      "Le 5 septembre 2021, je rentre de vacances, gros déjeuner d'équipe où ils m'annoncent tous les projets de fin d'année. Et là je leur dis : \"Écoutez les gars. Je vous aime mais il va falloir que je parte.\"",
      "C'était dur. C'étaient mes frères d'armes. Ils ont essayé de me retenir. Mais j'avais envie de voler de mes propres ailes. On s'entendait tellement bien qu'ils m'ont proposé une rupture conventionnelle pour que je touche le chômage.",
    ],
  },
  {
    id: "formation",
    year: "2022",
    title: "La formation et l'association avec Thomas",
    content: [
      "J'échangeais déjà avec Thomas sur Instagram — points d'accroche importants, on parlait beaucoup de private equity. Il est venu m'aider pour tourner mes vidéos. Il m'a laissé galérer puis m'a fait une proposition que je ne pouvais pas refuser. Je me suis associée avec lui. La meilleure décision de ma vie.",
      "Mi-avril, deux semaines intenses de tournage. Première fois que je tournais des vidéos. La formation devait sortir le 8 mai 2022. Webinaire de lancement très stressant. Nous avons vendu 80 formations en 3 jours.",
      "Septembre 2022 : nous sommes passés de 2 à 8 personnes dans l'équipe. Stressant, mais on a réussi.",
    ],
  },
  {
    id: "transformation",
    year: "Aujourd'hui",
    title: "Ma transformation",
    content: [
      "Ce qui est le plus marquant dans cette histoire, c'est la transformation de la personne que j'étais. Solitaire, je n'aimais pas du tout les gens. J'avais passé 3 ans avec quelqu'un qui m'avait mise plus bas que terre. J'avais très peu de confiance en moi. Château de cartes : je menais ma barque à l'aveugle.",
      "J'ai eu une véritable rage de vaincre. Je me suis promis de ne plus jamais me retrouver dans une situation de faiblesse sans contrôle.",
      "J'ai grandi dans un garage automobile — j'ai appris à changer des plaquettes, à me battre avec un frère dans la robotique automobile. J'ai toujours joué aux jeux vidéo, aux jeux de voiture et de guerre. J'aime la moto, la liberté, le stand de tir. Je me suis longtemps raccrochée aux parties masculines de moi, car j'ai été éduquée dans un univers où la place de la femme était plus faible. Je me suis rangée du côté du pouvoir.",
      "Début 2024, après de multiples prises de conscience, j'ai appris à travailler mon côté féminin, à développer ma spiritualité. J'ai retiré mes barrières en me réconciliant avec la femme que je suis.",
      "Aujourd'hui, je suis beaucoup plus à l'aise. J'arrive à m'intéresser autant aux hommes qu'aux femmes, à leur histoire. Je suis moins dans le jugement. Ce que j'aime : créer, partager, organiser des expériences avec mes proches. Tant que l'expérience est bonne, peu importe que ce soit un gastronomique ou un sandwich à emporter.",
      "J'ai une vraie quête de reconnaissance — certainement due à ma relation toxique et au besoin de prouver que je suis assez forte. Je me remets constamment en question. Je suis persuadée que si j'arrête de pédaler, mon vélo tombe. J'ai besoin de projets pour continuer à solliciter mes zones de génie et en créer de nouvelles.",
      "Et ce que j'aime aussi : tendre la main aux gens. Mon père m'a toujours appelée Mère Teresa. J'aime aider, j'aime avoir un impact positif. J'aime voir le sourire des autres et faire plaisir.",
    ],
  },
];

export default function QuiEstEmeline() {
  return (
    <div className="min-h-screen">
      <Header />
      <JsonLd data={breadcrumbSchema([
        { name: "Accueil", url: SITE_URL },
        { name: "Qui est Emeline ?", url: `${SITE_URL}/a-propos` },
      ])} />

      {/* Hero */}
      <section className="relative py-20 lg:py-28 bg-es-green-dark overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-es-green-dark via-es-green to-es-green-light/20" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }} />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-xs text-es-gold uppercase tracking-widest font-medium">Mon histoire</span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mt-4 mb-6">
            Qui est Emeline ?
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            De fille de garagiste à investisseuse avec 55 locataires.
            Parcours, échecs, victoires.
          </p>
        </div>
      </section>

      {/* Photo + intro */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal direction="left">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-xl relative">
                <Image
                  src="/images/emeline-siron.png"
                  alt="Emeline Siron — Formatrice en investissement immobilier"
                  width={800}
                  height={800}
                  className="w-full h-full object-cover object-top"
                  quality={85}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div>
                <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">Un roman vrai</span>
                <h2 className="font-serif text-3xl font-bold text-es-text mt-3 mb-6">
                  Mon parcours, sans filtre.
                </h2>
                <div className="space-y-4 text-es-text-muted leading-relaxed">
                  <p>
                    Fille de garagiste, enfance en Val-d&apos;Oise, loupage du bac, deux burnouts avant 25 ans,
                    deux relations toxiques, puis un déclic qui a tout changé.
                  </p>
                  <p>
                    En 5 ans : 55 locataires, une formation qui a touché +1 900 élèves, une communauté de
                    500+ investisseurs, un podcast hebdo, une équipe de 8 personnes.
                  </p>
                  <p className="font-medium text-es-text">
                    Voici comment j&apos;y suis arrivée. Et pourquoi je suis persuadée que tu peux le faire aussi.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="py-16 bg-es-green">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-center text-white">
          {[
            { value: "35", label: "chambres de colocation" },
            { value: "15", label: "appartements" },
            { value: "1", label: "garage" },
            { value: "1", label: "local commercial" },
            { value: "+1 900", label: "élèves formés" },
          ].map((stat, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div>
                <div className="text-3xl sm:text-4xl font-serif font-bold text-es-gold">{stat.value}</div>
                <div className="text-sm text-white/50 mt-1">{stat.label}</div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* L'histoire en chapitres */}
      <section className="py-20 bg-es-cream">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-xs text-es-terracotta uppercase tracking-widest font-medium">L&apos;histoire complète</span>
            <h2 className="font-serif text-3xl font-bold text-es-text mt-3">Tout a commencé dans un garage</h2>
          </div>

          <div className="space-y-12">
            {chapters.map((chapter, i) => (
              <ScrollReveal key={chapter.id} delay={i * 50}>
                <article className="relative pl-8 border-l-2 border-es-green/20">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-es-green border-4 border-es-cream" />
                  <div className="mb-2">
                    <span className="text-xs text-es-terracotta font-bold uppercase tracking-wider">{chapter.year}</span>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-es-text mb-4">{chapter.title}</h3>
                  <div className="space-y-3 text-es-text-muted leading-relaxed">
                    {chapter.content.map((para, j) => (
                      <p key={j}>{para}</p>
                    ))}
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* Signature */}
          <div className="mt-16 pt-8 border-t border-es-cream-dark text-center">
            <p className="font-serif italic text-es-text-muted text-lg">
              &ldquo; Si j&apos;ai pu le faire, tu peux le faire aussi. &rdquo;
            </p>
            <p className="text-sm text-es-text mt-3 font-medium">— Emeline</p>
          </div>
        </div>
      </section>

      {/* Podcast */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-8">
            <img
              src="/images/logo-otb.png"
              alt="Out of the Box — Podcast Emeline Siron"
              className="h-16 sm:h-20 mx-auto mb-4"
            />
            <p className="text-es-text-muted max-w-xl mx-auto">
              Chaque mardi, un épisode de 30 minutes pour repenser ton rapport
              à l&apos;argent, l&apos;investissement et l&apos;entrepreneuriat.
              Interviews, analyses, retours d&apos;expérience.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-es-cream-dark bg-white">
            <LazyIframe
              src="https://player.ausha.co/?showId=k5xV9FYeMPDx&color=%23000000&display=horizontal&multishow=false&playlist=true&dark=false&v=3&playerId=ausha-apropos"
              height={420}
              title="Podcast Out of the Box"
              placeholder="Charger les épisodes du podcast"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-es-cream text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-2xl font-bold text-es-text mb-4">
            Prêt(e) à passer à l&apos;action ?
          </h2>
          <p className="text-es-text-muted mb-8">
            Découvre la méthode complète ou rejoins la communauté.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="lg" href="/academy">
              ES Academy →
            </Button>
            <Button variant="secondary" size="lg" href="/family">
              ES Family →
            </Button>
          </div>
        </div>
      </section>

      <BottomBanner />
      <Footer />
    </div>
  );
}
