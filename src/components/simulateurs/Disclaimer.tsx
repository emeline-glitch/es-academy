export function SimulateurDisclaimer() {
  return (
    <div className="mt-8 bg-gray-50 rounded-xl p-5 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-700 mb-2">⚠️ Avertissement</h4>
      <p className="text-xs text-gray-500 leading-relaxed">
        Ce simulateur fournit une estimation indicative basée sur les données que tu renseignes.
        Les résultats ne constituent ni un conseil en investissement, ni un engagement contractuel.
        Les calculs sont simplifiés et peuvent différer des conditions réelles proposées par
        les établissements bancaires ou les notaires. Pour un calcul précis adapté à ta situation,
        consulte un professionnel (courtier, notaire, expert-comptable).
      </p>
      <p className="text-[10px] text-gray-400 mt-2">
        Taux et barèmes utilisés : données moyennes constatées, mises à jour périodiquement.
        Dernière mise à jour : avril 2026.
      </p>
    </div>
  );
}
