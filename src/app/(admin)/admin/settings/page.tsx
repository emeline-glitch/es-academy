import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const services = [
  {
    name: "Supabase",
    description: "Base de données + authentification",
    status: "connected",
    config: "tvkzndkywznaysiqvmsh.supabase.co",
  },
  {
    name: "Notion",
    description: "CMS contenu (formations, blog)",
    status: "connected",
    config: "6 bases de données connectées",
  },
  {
    name: "Bunny.net",
    description: "Hébergement vidéo",
    status: "connected",
    config: "Library: ES Academy Formation",
  },
  {
    name: "Stripe",
    description: "Paiements en ligne",
    status: "pending",
    config: "En attente du Kbis",
  },
  {
    name: "Amazon SES",
    description: "Envoi d'emails en masse",
    status: "pending",
    config: "En attente du nom de domaine",
  },
];

const sitePages = [
  { name: "Accueil", url: "/" },
  { name: "ES Academy", url: "/academy" },
  { name: "ES Family", url: "/family" },
  { name: "Blog", url: "/blog" },
  { name: "À propos", url: "/a-propos" },
  { name: "Outils gratuits", url: "/outils-gratuits" },
  { name: "Connexion", url: "/connexion" },
  { name: "Inscription", url: "/inscription" },
  { name: "CGV", url: "/cgv" },
  { name: "Mentions légales", url: "/mentions-legales" },
  { name: "Confidentialité", url: "/politique-confidentialite" },
];

export default function AdminSettings() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration de la plateforme</p>
      </div>

      {/* Services connectés */}
      <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Services connectés</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {services.map((service, i) => (
          <Card key={i}>
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900">{service.name}</h3>
              <Badge variant={service.status === "connected" ? "success" : "warning"}>
                {service.status === "connected" ? "Connecté" : "En attente"}
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mb-2">{service.description}</p>
            <p className="text-[10px] text-gray-400 font-mono">{service.config}</p>
          </Card>
        ))}
      </div>

      {/* Infos site */}
      <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Informations du site</h2>
      <Card className="mb-10">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Nom du site :</span>
            <span className="text-gray-900 ml-2 font-medium">Emeline Siron</span>
          </div>
          <div>
            <span className="text-gray-500">Email admin :</span>
            <span className="text-gray-900 ml-2 font-medium">emeline.siron@hotmail.fr</span>
          </div>
          <div>
            <span className="text-gray-500">URL locale :</span>
            <span className="text-gray-900 ml-2 font-mono">localhost:3001</span>
          </div>
          <div>
            <span className="text-gray-500">Framework :</span>
            <span className="text-gray-900 ml-2">Next.js 16 + Tailwind v4</span>
          </div>
          <div>
            <span className="text-gray-500">Articles blog :</span>
            <span className="text-gray-900 ml-2 font-medium">58</span>
          </div>
          <div>
            <span className="text-gray-500">Ressources formation :</span>
            <span className="text-gray-900 ml-2 font-medium">10 fichiers Excel</span>
          </div>
        </div>
      </Card>

      {/* Pages du site */}
      <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Pages du site</h2>
      <Card padding="none">
        <div className="divide-y divide-gray-50">
          {sitePages.map((page, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <span className="text-sm text-gray-700">{page.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 font-mono">{page.url}</span>
                <a href={page.url} target="_blank" className="text-xs text-es-green hover:underline">Ouvrir →</a>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
