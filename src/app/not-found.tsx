import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-es-green-dark flex items-center justify-center p-4">
      <div className="text-center">
        <div className="font-serif text-8xl font-bold text-es-gold mb-4">404</div>
        <h1 className="font-serif text-2xl font-bold text-white mb-2">
          Page introuvable
        </h1>
        <p className="text-white/60 mb-8 max-w-md">
          La page que tu cherches n&apos;existe pas ou a ete deplacee.
        </p>
        <Button href="/" variant="cta" className="btn-gold-shimmer">
          Retour a l&apos;accueil
        </Button>
      </div>
    </div>
  );
}
