import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description:
    "Conditions générales de vente ES Academy : formation immobilier, coaching individuel et abonnement communauté ES Family.",
};

const LAST_UPDATE = "23 avril 2026";

export default function CGV() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-es-green-dark py-12">
        <div className="max-w-3xl mx-auto px-6">
          <Link
            href="/"
            className="text-white/60 text-sm hover:text-white transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="font-serif text-3xl font-bold text-white mt-4">
            Conditions générales de vente
          </h1>
          <p className="text-white/60 text-sm mt-2">
            En vigueur au {LAST_UPDATE}. Version 2026-04.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 prose-es space-y-6">
        <p className="text-sm text-gray-600">
          Les présentes conditions générales de vente (ci-après les « CGV »)
          sont conclues entre toi, la personne qui effectue un achat (ci-après
          « toi » ou « l&apos;Acheteur »), et la société éditrice ci-dessous
          identifiée. En passant commande, tu confirmes avoir lu, compris et
          accepté sans réserve les présentes CGV.
        </p>

        <h2>Article 1. Éditeur et identification</h2>
        <p>
          Le site <strong>emeline-siron.fr</strong> est édité et exploité
          par&nbsp;:
        </p>
        <ul>
          <li>
            <strong>ES ACADEMY</strong>, Société par Actions Simplifiée
            Unipersonnelle (SASU) au capital social de{" "}
            <strong>1&nbsp;000&nbsp;€</strong>
          </li>
          <li>
            Immatriculée au Registre du Commerce et des Sociétés de Nanterre
            sous le numéro <strong>104&nbsp;020&nbsp;078</strong>
          </li>
          <li>
            Identifiant européen (EUID)&nbsp;:{" "}
            <strong>FR9201.104020078</strong>
          </li>
          <li>
            SIRET&nbsp;: <strong>104&nbsp;020&nbsp;078&nbsp;00010</strong>
          </li>
          <li>
            Numéro de TVA intracommunautaire&nbsp;:{" "}
            <strong>FR91&nbsp;104&nbsp;020&nbsp;078</strong>
          </li>
          <li>
            Siège social&nbsp;: 152 Promenade du Verger,{" "}
            <strong>92130 Issy-les-Moulineaux</strong>
          </li>
          <li>
            Présidente&nbsp;: la société{" "}
            <strong>HOLDEM GROUPE</strong>, SASU au capital de{" "}
            <strong>3&nbsp;095&nbsp;€</strong>,
            immatriculée au RCS de Nanterre sous le numéro{" "}
            <strong>920&nbsp;244&nbsp;563</strong>, dont le siège social est
            également situé au 152 Promenade du Verger, 92130
            Issy-les-Moulineaux, elle-même représentée par sa Présidente{" "}
            <strong>Emeline Siron</strong>
          </li>
          <li>
            Directrice de la publication&nbsp;: <strong>Emeline Siron</strong>
          </li>
          <li>
            Contact&nbsp;:{" "}
            <a href="mailto:emeline@emeline-siron.fr">
              emeline@emeline-siron.fr
            </a>
          </li>
        </ul>
        <p>
          <strong>Hébergement</strong>&nbsp;: le site est hébergé par Netlify,
          Inc., 44 Montgomery Street, Suite 300, San Francisco, California
          94104, États-Unis. Les données personnelles et de paiement sont
          traitées par des sous-traitants basés dans l&apos;Union européenne
          lorsque cela est techniquement possible (voir la{" "}
          <Link href="/politique-confidentialite">
            politique de confidentialité
          </Link>
          ).
        </p>

        <h2>Article 2. Définitions</h2>
        <ul>
          <li>
            <strong>Acheteur</strong> ou <strong>Client</strong>&nbsp;: toute
            personne physique majeure ou personne morale qui passe commande sur
            le Site.
          </li>
          <li>
            <strong>Site</strong>&nbsp;: le site accessible à l&apos;adresse{" "}
            <a href="https://emeline-siron.fr">emeline-siron.fr</a>.
          </li>
          <li>
            <strong>Formation</strong> ou <strong>Academy</strong>&nbsp;: la
            formation en ligne « La Méthode Emeline Siron », accessible
            après paiement intégral du prix, incluant vidéos, outils
            téléchargeables, mises à jour et sessions de mentorat collectives.
          </li>
          <li>
            <strong>Coaching</strong>&nbsp;: accompagnement individuel sur
            devis, activable à tout moment et dont les conditions spécifiques
            sont communiquées lors du devis.
          </li>
          <li>
            <strong>Abonnement Family</strong> ou <strong>ES Family</strong>
            &nbsp;: service en ligne d&apos;accès à la communauté privée ES
            Family, souscrit par abonnement mensuel avec tacite reconduction.
          </li>
          <li>
            <strong>Code cadeau</strong>&nbsp;: code unique attribué à
            l&apos;Acheteur lui permettant d&apos;activer une période
            d&apos;abonnement Family offerte (3 mois ou 6 mois selon
            l&apos;offre).
          </li>
          <li>
            <strong>CGV</strong>&nbsp;: les présentes conditions générales de
            vente.
          </li>
        </ul>

        <h2>Article 3. Champ d&apos;application et acceptation</h2>
        <p>
          Les présentes CGV régissent l&apos;ensemble des ventes de Formation,
          Coaching et Abonnement Family conclues entre toi et ES Academy via le
          Site. Le fait de passer commande emporte ton acceptation pleine et
          entière des CGV en vigueur à la date de la commande. ES Academy se
          réserve le droit d&apos;adapter ou de modifier les présentes CGV à
          tout moment. Les CGV applicables sont celles en vigueur à la date de
          ta commande.
        </p>

        <h2>Article 4. Produits et services proposés</h2>

        <h3>4.1 ES Academy (Formation)</h3>
        <p>
          La Formation Academy est vendue au prix de <strong>998&nbsp;€ TTC</strong>{" "}
          et donne accès&nbsp;:
        </p>
        <ul>
          <li>À l&apos;intégralité du programme vidéo (30&nbsp;heures environ)</li>
          <li>Aux outils pratiques, modèles et checklists téléchargeables</li>
          <li>Aux mises à jour et replays des lives inclus à vie</li>
          <li>
            À 3 mois d&apos;Abonnement Family offerts sous la forme d&apos;un
            Code cadeau à activer (voir article 10)
          </li>
        </ul>
        <p>
          L&apos;accès aux contenus est personnel, non cessible et non
          transférable. L&apos;accès est maintenu à vie sous réserve du
          paiement intégral du prix et du respect des présentes CGV.
        </p>

        <h3>4.2 Coaching individuel</h3>
        <p>
          Le Coaching individuel est proposé sur devis. Son prix, sa durée et
          ses modalités sont communiqués dans un devis écrit préalable que tu
          acceptes avant paiement. Le Coaching ne donne lieu à aucune tacite
          reconduction.
        </p>

        <h3>4.3 Abonnement ES Family</h3>
        <p>
          L&apos;Abonnement Family est un service par abonnement mensuel
          permettant d&apos;accéder à la communauté privée, aux lives mensuels,
          aux simulateurs, aux contenus exclusifs et aux avantages partenaires.
          Les modalités tarifaires, la durée, la reconduction et la résiliation
          sont décrites à l&apos;article 10.
        </p>

        <h2>Article 5. Commande et conclusion du contrat</h2>
        <p>
          La commande est passée en ligne sur le Site. Elle comporte&nbsp;:
          sélection du produit, saisie des informations personnelles, choix du
          mode de paiement, acceptation des CGV par case à cocher, puis
          paiement. La commande devient définitive dès l&apos;encaissement du
          premier prélèvement par Stripe. Un email de confirmation t&apos;est
          envoyé à l&apos;adresse renseignée.
        </p>
        <p>
          ES Academy se réserve le droit de refuser ou d&apos;annuler toute
          commande d&apos;un Acheteur avec lequel un litige serait en cours,
          ou en cas de présomption raisonnable de fraude.
        </p>

        <h2>Article 6. Prix et modalités de paiement</h2>
        <p>
          Tous les prix sont indiqués en euros toutes taxes comprises (TTC).
          Les taxes applicables sont celles en vigueur à la date de la
          commande. Les tarifs peuvent être modifiés à tout moment&nbsp;; la
          tarification applicable est celle affichée sur le Site au moment du
          paiement.
        </p>

        <h3>6.1 Academy — paiement en 1, 3 ou 4 fois</h3>
        <p>Tu as le choix entre trois modalités&nbsp;:</p>
        <ul>
          <li>
            <strong>Paiement en 1 fois</strong>&nbsp;: 998&nbsp;€ débités le
            jour de la commande
          </li>
          <li>
            <strong>Paiement en 3 fois sans frais</strong>&nbsp;: 332,67&nbsp;€
            débités le jour de la commande, puis à la même date les 2 mois
            suivants (soit un total de 998,01&nbsp;€, incluant 0,01&nbsp;€
            d&apos;arrondi)
          </li>
          <li>
            <strong>Paiement en 4 fois sans frais</strong>&nbsp;: 249,50&nbsp;€
            débités le jour de la commande, puis à la même date les 3 mois
            suivants (soit un total de 998&nbsp;€)
          </li>
        </ul>
        <p>
          Les paiements échelonnés sont conditionnés à l&apos;autorisation de
          la carte bancaire utilisée. En cas d&apos;échec d&apos;un
          prélèvement, ES Academy te contacte pour régulariser. À défaut de
          régularisation sous 15 jours, l&apos;accès à la Formation peut être
          suspendu jusqu&apos;à paiement intégral. L&apos;accès à vie est
          garanti dès lors que l&apos;intégralité du prix a été encaissée.
        </p>

        <h3>6.2 Abonnement Family</h3>
        <p>
          Les tarifs applicables à l&apos;Abonnement Family sont&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Offre Fondateur</strong>&nbsp;:{" "}
            <strong>19&nbsp;€ TTC par mois</strong>, réservée aux 500
            premières personnes souscrivant à l&apos;Abonnement Family. Une
            fois ce quota atteint, l&apos;offre est retirée et remplacée par
            l&apos;offre Standard. Le tarif de 19&nbsp;€/mois reste acquis au
            Fondateur tant qu&apos;il ne résilie pas son abonnement.
          </li>
          <li>
            <strong>Offre Standard</strong>&nbsp;:{" "}
            <strong>29&nbsp;€ TTC par mois</strong>
          </li>
        </ul>
        <p>
          Le premier prélèvement intervient à l&apos;issue de la période
          d&apos;essai gratuite (voir articles 10 et 11), puis chaque mois à la
          même date, par tacite reconduction, jusqu&apos;à résiliation.
        </p>

        <h2>Article 7. Paiement sécurisé</h2>
        <p>
          Les paiements sont réalisés via la plateforme{" "}
          <strong>Stripe Payments Europe, Ltd.</strong> (société établie en
          Irlande), prestataire agréé par la Banque centrale d&apos;Irlande et
          supervisé à ce titre. Les données de carte bancaire sont chiffrées et
          ne transitent ni ne sont stockées sur les serveurs de ES Academy. Stripe
          applique les standards PCI-DSS de l&apos;industrie du paiement et
          exige l&apos;authentification 3D Secure lorsque cela est requis par
          ta banque.
        </p>
        <p>
          En cas d&apos;échec de paiement, tu reçois une notification. Après
          trois tentatives infructueuses, la commande ou l&apos;abonnement est
          suspendu.
        </p>

        <h2>Article 8. Compte client et identifiants</h2>
        <p>
          Après paiement, un compte personnel t&apos;est créé sur la plateforme
          ES Academy. Tu reçois un email contenant un lien d&apos;activation
          pour définir ton mot de passe. Tes identifiants sont strictement
          personnels. Tu es responsable de leur confidentialité. Tout accès
          frauduleux à ton compte ou tout partage de tes identifiants avec un
          tiers peut entraîner la suspension immédiate de l&apos;accès, sans
          préavis ni remboursement.
        </p>

        <h2>Article 9. Accès aux contenus Academy</h2>
        <p>
          L&apos;accès à la Formation est immédiat après confirmation du
          premier paiement. Les contenus sont disponibles 24h/24 depuis
          l&apos;espace élève. ES Academy met en œuvre les moyens raisonnables
          pour assurer la disponibilité du service mais ne peut garantir une
          disponibilité absolue, notamment en cas de maintenance programmée ou
          d&apos;incident d&apos;hébergement. En cas d&apos;indisponibilité
          prolongée supérieure à 72&nbsp;heures continues et imputable à
          ES Academy, une prolongation d&apos;accès équivalente te sera offerte
          sur simple demande.
        </p>

        <h2>
          Article 10. Abonnement ES Family — souscription, reconduction et
          résiliation
        </h2>

        <h3>10.1 Souscription et durée</h3>
        <p>
          L&apos;Abonnement Family est souscrit pour une durée initiale
          d&apos;un mois, renouvelable par tacite reconduction pour des
          périodes successives d&apos;un mois, sauf résiliation dans les
          conditions prévues ci-après.
        </p>

        <h3>10.2 Période d&apos;essai gratuite (Code cadeau)</h3>
        <p>
          L&apos;Abonnement Family peut être précédé d&apos;une période
          d&apos;essai gratuite activée par un Code cadeau, selon les cas
          suivants&nbsp;:
        </p>
        <ul>
          <li>
            <strong>Acheteurs Academy</strong>&nbsp;: un Code cadeau
            offrant 3 mois gratuits d&apos;Abonnement Family est délivré
            automatiquement après l&apos;achat de la Formation. Ce code est
            personnel, non cessible et utilisable une seule fois.
          </li>
          <li>
            <strong>Alumni Evermind</strong>&nbsp;: les anciens élèves
            Evermind identifiés au préalable peuvent activer un code unique
            offrant 6 mois gratuits d&apos;Abonnement Family, sous réserve de
            figurer sur la liste des alumni éligibles. L&apos;éligibilité est
            vérifiée automatiquement par rapprochement entre l&apos;adresse
            email utilisée et la base alumni.
          </li>
        </ul>
        <p>
          Pour activer un Code cadeau, tu dois renseigner une carte bancaire
          en amont. Aucun prélèvement n&apos;est effectué pendant toute la
          période d&apos;essai gratuite. À l&apos;issue de la période
          d&apos;essai, le prélèvement mensuel démarre automatiquement au
          tarif indiqué à l&apos;article 6.2.
        </p>

        <h3>
          10.3 Rappels légaux avant premier prélèvement (loi Chatel)
        </h3>
        <p>
          Conformément à l&apos;article L.&nbsp;215-1 du Code de la
          consommation et à la directive européenne DDADUE 2023, tu reçois
          deux rappels par email avant le premier prélèvement à la fin de la
          période d&apos;essai gratuite&nbsp;:
        </p>
        <ul>
          <li>
            <strong>15 jours avant la fin de l&apos;essai gratuit</strong>
            &nbsp;: rappel indiquant la date exacte du premier prélèvement,
            le montant, et la procédure de résiliation
          </li>
          <li>
            <strong>7 jours avant la fin de l&apos;essai gratuit</strong>
            &nbsp;: dernier rappel avant prélèvement
          </li>
        </ul>
        <p>
          Tu peux t&apos;opposer à tout moment à la poursuite de
          l&apos;abonnement par une simple résiliation selon les modalités
          prévues à l&apos;article 10.4.
        </p>

        <h3>10.4 Résiliation en 1 clic</h3>
        <p>
          Conformément à l&apos;article L.&nbsp;215-1-1 du Code de la
          consommation (loi DDADUE de 2023), tu peux résilier l&apos;Abonnement
          Family à tout moment, sans frais et sans justification, par les
          moyens suivants&nbsp;:
        </p>
        <ul>
          <li>
            En cliquant sur le lien de résiliation présent dans chaque email
            transactionnel et dans les rappels J-15 et J-7 (résiliation en un
            clic)
          </li>
          <li>
            Depuis ton espace personnel sur le Site, rubrique « Mon
            abonnement »
          </li>
          <li>
            Par email à{" "}
            <a href="mailto:emeline@emeline-siron.fr">
              emeline@emeline-siron.fr
            </a>
          </li>
        </ul>
        <p>
          La résiliation prend effet à la fin de la période d&apos;abonnement
          en cours déjà payée. Aucun remboursement au prorata n&apos;est
          effectué pour la période commencée. Après résiliation, ton accès à
          ES Family est maintenu jusqu&apos;à la fin de la période payée,
          puis désactivé.
        </p>

        <h3>10.5 Résiliation par ES Academy</h3>
        <p>
          ES Academy peut résilier l&apos;Abonnement Family de plein droit en cas
          de manquement grave à tes obligations, notamment en cas de partage
          d&apos;identifiants, de diffusion de contenus de la communauté, de
          propos injurieux ou discriminatoires, ou de non-paiement après trois
          tentatives de prélèvement. La résiliation intervient après un
          préavis écrit de sept jours, sauf urgence ou faute grave.
        </p>

        <h2>
          Article 11. Droit de rétractation (vente à distance)
        </h2>
        <p>
          Conformément aux articles L.&nbsp;221-18 et suivants du Code de la
          consommation, tu disposes d&apos;un délai de{" "}
          <strong>14 jours calendaires</strong> à compter de la conclusion du
          contrat pour exercer ton droit de rétractation, sans avoir à
          justifier de motif ni à payer de pénalité.
        </p>

        <h3>11.1 Exception pour les contenus numériques déjà consommés</h3>
        <p>
          Conformément à l&apos;article L.&nbsp;221-28, 13° du Code de la
          consommation, tu reconnais expressément que l&apos;exécution de la
          Formation commence dès la confirmation de paiement et{" "}
          <strong>
            tu renonces expressément à ton droit de rétractation dès lors
            que tu as commencé à consommer les contenus numériques
          </strong>{" "}
          (visionnage d&apos;une vidéo, téléchargement d&apos;un outil). Cette
          renonciation t&apos;est demandée explicitement par case à cocher au
          moment de la commande.
        </p>

        <h3>11.2 Modalités d&apos;exercice</h3>
        <p>
          Pour exercer ton droit de rétractation avant toute consommation du
          contenu, envoie un email non équivoque à{" "}
          <a href="mailto:emeline@emeline-siron.fr">
            emeline@emeline-siron.fr
          </a>{" "}
          en mentionnant ton nom, l&apos;email utilisé lors de la commande,
          la référence de la commande et ta volonté de te rétracter. Le
          remboursement intégral est effectué sous 14 jours à compter de la
          réception de ta demande, par crédit sur la carte bancaire utilisée.
        </p>

        <h3>11.3 Garantie « satisfait ou remboursé 14 jours » Academy</h3>
        <p>
          En complément du droit légal de rétractation, ES Academy offre une
          garantie commerciale « satisfait ou remboursé » sur la Formation
          Academy valable 14 jours à compter de la date d&apos;achat.
          Pendant ces 14 jours et à ta demande, ES Academy rembourse
          l&apos;intégralité du prix payé, même si tu as commencé à consulter
          les contenus. Cette garantie ne s&apos;applique pas à
          l&apos;Abonnement Family ni au Coaching individuel.
        </p>

        <h2>Article 12. Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des contenus proposés sur le Site et dans les
          formations (textes, vidéos, modèles, outils, simulateurs, code,
          images, graphismes, marques) est protégé par le droit d&apos;auteur
          et le droit des marques. Ils demeurent la propriété exclusive de
          ES Academy ou de ses ayants droit.
        </p>
        <p>
          L&apos;achat ne te confère qu&apos;un droit d&apos;usage personnel,
          non exclusif, non cessible et non transférable. Toute reproduction,
          représentation, diffusion, revente, partage public ou mise à
          disposition de tiers, en tout ou partie, par quelque procédé que ce
          soit, est strictement interdite. Toute violation sera poursuivie au
          titre de la contrefaçon (article L.&nbsp;335-2 du Code de la
          propriété intellectuelle) et du parasitisme.
        </p>
        <p>
          Tu t&apos;engages en particulier à ne pas extraire, copier ou
          diffuser les lives enregistrés, les contenus de la communauté
          Family ou les fichiers outils hors du cadre strictement personnel
          prévu par les présentes.
        </p>

        <h2>Article 13. Données personnelles et cookies</h2>
        <p>
          Les données personnelles que tu communiques (nom, email, données de
          paiement) sont traitées par ES Academy en sa qualité de responsable de
          traitement, pour les finalités suivantes&nbsp;: exécution du
          contrat, facturation, envoi d&apos;emails transactionnels, respect
          des obligations légales (facturation, lutte contre la fraude),
          amélioration du service.
        </p>
        <p>
          Conformément au Règlement général sur la protection des données
          (RGPD) et à la loi Informatique et Libertés, tu disposes de droits
          d&apos;accès, de rectification, d&apos;effacement, de portabilité,
          d&apos;opposition et de limitation sur tes données. Tu peux exercer
          ces droits à tout moment par email à{" "}
          <a href="mailto:emeline@emeline-siron.fr">
            emeline@emeline-siron.fr
          </a>
          . Pour plus d&apos;informations, consulte la{" "}
          <Link href="/politique-confidentialite">
            politique de confidentialité
          </Link>
          .
        </p>
        <p>
          Tu peux également introduire une réclamation auprès de la
          Commission nationale de l&apos;informatique et des libertés
          (CNIL)&nbsp;:{" "}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noreferrer noopener"
          >
            www.cnil.fr
          </a>
          .
        </p>

        <h2>
          Article 14. Limitation de responsabilité et avertissement
          investissement
        </h2>
        <p>
          Les contenus des formations et de la communauté ES Family ont une
          vocation strictement <strong>éducative et pédagogique</strong>. Ils
          ne constituent ni un conseil en investissement individuel, ni une
          recommandation personnalisée, ni une sollicitation à acheter ou
          vendre un actif.
        </p>
        <p>
          Emeline Siron et la société ES Academy ne sont pas, au titre de la
          marque ES Academy, des conseillers en investissements financiers
          agréés au sens de l&apos;article L.&nbsp;541-1 du Code monétaire et
          financier. ES Academy n&apos;est pas davantage un établissement de
          crédit, un prestataire de services d&apos;investissement, un
          conseiller en gestion de patrimoine, un intermédiaire en opérations
          de banque ni un agent immobilier.
        </p>
        <p>
          <strong>
            L&apos;investissement immobilier comporte des risques, y compris
            le risque de perte en capital, le risque de vacance locative, le
            risque de dépréciation du bien et le risque lié aux évolutions
            réglementaires, fiscales et de taux d&apos;intérêt.
          </strong>{" "}
          Les performances passées présentées à titre d&apos;exemple ne
          préjugent pas des performances futures. Chaque décision
          d&apos;investissement relève de ta seule responsabilité et doit
          être prise en considération de ta situation personnelle, après,
          si besoin, consultation de professionnels habilités.
        </p>
        <p>
          Dans toute la mesure permise par la loi, la responsabilité de
          ES Academy ne peut être engagée qu&apos;en cas de faute prouvée et
          directement imputable à la société. La responsabilité de ES Academy
          est en tout état de cause limitée au montant effectivement versé
          par toi au titre de la commande concernée au cours des douze mois
          précédant l&apos;événement générateur.
        </p>

        <h2>Article 15. Force majeure</h2>
        <p>
          ES Academy ne pourra être tenue responsable de tout manquement à ses
          obligations résultant d&apos;un cas de force majeure au sens de
          l&apos;article 1218 du Code civil (grève, panne générale
          d&apos;hébergement ou de réseau, catastrophe naturelle, décision
          d&apos;une autorité publique, conflit armé, pandémie). ES Academy
          t&apos;en informe dans les meilleurs délais et mettra tout en
          œuvre pour rétablir le service.
        </p>

        <h2>Article 16. Modification des CGV</h2>
        <p>
          ES Academy se réserve le droit de modifier les présentes CGV à tout
          moment. Les CGV applicables à ta commande sont celles en vigueur au
          moment de sa passation. Pour l&apos;Abonnement Family, toute
          modification substantielle t&apos;est notifiée par email au moins
          30 jours avant son entrée en vigueur&nbsp;; tu peux alors résilier
          sans frais avant cette date si les nouvelles conditions ne te
          conviennent pas.
        </p>

        <h2>Article 17. Médiation de la consommation</h2>
        <p>
          Conformément aux articles L.&nbsp;611-1 et suivants et R.&nbsp;612-1
          et suivants du Code de la consommation, tu peux recourir
          gratuitement au service de médiation de la consommation suivant,
          auquel ES Academy adhère&nbsp;:
        </p>
        <p>
          <strong>[À COMPLÉTER : nom et coordonnées du médiateur]</strong>
          <br />
          <strong>[À COMPLÉTER : adresse]</strong>
          <br />
          <strong>[À COMPLÉTER : site web du médiateur]</strong>
        </p>
        <p>
          La médiation ne peut être saisie qu&apos;après avoir tenté de
          résoudre le litige directement avec ES Academy par une réclamation
          écrite.
        </p>
        <p>
          La Commission européenne met également à disposition une plateforme
          de règlement en ligne des litiges accessible à l&apos;adresse
          suivante&nbsp;:{" "}
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer noopener"
          >
            ec.europa.eu/consumers/odr
          </a>
          .
        </p>

        <h2>Article 18. Droit applicable et juridiction compétente</h2>
        <p>
          Les présentes CGV sont soumises au droit français. À défaut
          d&apos;accord amiable ou de médiation aboutie, tout litige relatif
          à leur interprétation ou à leur exécution relève de la compétence
          exclusive des tribunaux de Nanterre, sous réserve des règles
          impératives de compétence applicables au consommateur.
        </p>
        <p>
          En ta qualité de consommateur, tu conserves le droit de saisir la
          juridiction de ton lieu de domicile ou celle du lieu
          d&apos;exécution du contrat, conformément à l&apos;article
          R.&nbsp;631-3 du Code de la consommation.
        </p>

        <hr className="my-10 border-es-green/20" />

        <p className="text-sm text-gray-600">
          Tu as une question sur ces CGV ou sur ta commande&nbsp;? Écris à{" "}
          <a href="mailto:emeline@emeline-siron.fr">
            emeline@emeline-siron.fr
          </a>
          , Emeline te répond personnellement.
        </p>
      </main>
    </div>
  );
}
