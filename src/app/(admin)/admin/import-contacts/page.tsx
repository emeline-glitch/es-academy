"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface ContactList {
  id: string;
  name: string;
  tag_key: string;
  folder_id: string | null;
}

interface PreviewResult {
  total_rows: number;
  valid: number;
  duplicates_in_csv: number;
  invalid: number;
  invalid_samples: Array<{ row: number; email: string; reason: string }>;
  tags_to_apply: string[];
  sample_contacts: Array<{ email: string; first_name: string; last_name: string; phone: string | null }>;
}

interface ImportResult {
  success: boolean;
  total_rows: number;
  imported: number;
  errors: number;
  invalid: number;
  duplicates_in_csv: number;
  tags_applied: string[];
  consent_logs_created: number;
}

const CONSENT_OPTIONS = [
  {
    value: "legitimate_interest",
    label: "Intérêt légitime (alumni, clients existants)",
    description: "Article 6.1.f RGPD. Pour des contacts avec qui il y a eu une relation commerciale. Pas besoin de re-opt-in.",
  },
  {
    value: "explicit",
    label: "Consentement explicite (opt-in direct avant import)",
    description: "Article 7 RGPD. Les contacts ont déjà coché une case claire avant l'import.",
  },
  {
    value: "re_consent",
    label: "Re-consentement demandé (cohorte 2 Brevo)",
    description: "Pour les contacts actifs mais sans trace de consentement clair. Auto-enroll dans la séquence SEQ_BRV.",
  },
];

export default function ImportContactsPage() {
  const toast = useToast();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [consentType, setConsentType] = useState("legitimate_interest");
  const [consentBasis, setConsentBasis] = useState("");
  const [source, setSource] = useState("import");
  const [sourceDetail, setSourceDetail] = useState("");
  const [setAlumni, setSetAlumni] = useState(false);
  const [rgpdCohort, setRgpdCohort] = useState<number | "">("");
  const [listId, setListId] = useState("");
  const [lists, setLists] = useState<ContactList[]>([]);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const fetchLists = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/lists");
      if (r.ok) {
        const d = await r.json();
        setLists(d.lists || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setCsv(String(e.target?.result || ""));
      setFileName(file.name);
      setPreview(null);
      setResult(null);
    };
    reader.readAsText(file);
  }

  function buildPayload(dryRun: boolean) {
    const tags = tagsRaw.split(/[,;]/).map((t) => t.trim()).filter(Boolean);
    return {
      csv,
      tags_to_apply: tags,
      consent_type: consentType,
      consent_basis: consentBasis || null,
      set_alumni_evermind: setAlumni,
      rgpd_cohort: typeof rgpdCohort === "number" ? rgpdCohort : null,
      list_id: listId || null,
      source,
      source_detail: sourceDetail || null,
      dry_run: dryRun,
    };
  }

  async function runPreview() {
    if (!csv.trim()) return;
    setPreviewing(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/import-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(true)),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur preview");
      }
      const data = await res.json();
      setPreview(data);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setPreviewing(false);
    }
  }

  async function runImport() {
    if (!preview) {
      toast.error("Fais d'abord un aperçu (dry run) avant d'importer");
      return;
    }
    if (!confirm(`Importer ${preview.valid} contacts avec consentement « ${consentType} » ? Cette action est tracée dans le registre RGPD.`)) return;
    setImporting(true);
    try {
      const res = await fetch("/api/admin/import-contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(false)),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur import");
      }
      const data = await res.json();
      setResult(data);
      toast.success(`${data.imported} contacts importés`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/contacts" className="text-sm text-gray-400 hover:text-es-green">
          ← Contacts
        </Link>
        <h1 className="font-serif text-2xl font-bold text-gray-900 mt-1">Import de contacts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import CSV avec tagging automatique, rattachement à une liste et enregistrement dans le registre de consentement RGPD.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Colonne principale */}
        <div className="space-y-4">
          {/* Fichier CSV */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">1. Fichier CSV</h2>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="mb-3 text-sm"
            />
            {fileName && (
              <p className="text-xs text-gray-500">
                Fichier chargé : <span className="font-medium">{fileName}</span> ({Math.round(csv.length / 1024)} Ko)
              </p>
            )}
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer">Format attendu / exemples</summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-[11px] font-mono text-gray-600">
                email,first_name,last_name,phone<br />
                marie.dupont@example.com,Marie,Dupont,0612345678<br />
                jean@example.com,Jean,,<br />
              </div>
              <p className="text-[11px] text-gray-500 mt-2">
                Headers acceptés : email (obligatoire), first_name/prenom, last_name/nom, phone/telephone. Délimiteur virgule ou point-virgule auto-détecté.
              </p>
            </details>
          </Card>

          {/* Tags & source */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">2. Tags et source</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Tags à appliquer (séparés par , ou ;)</label>
                <Input
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  placeholder="Ex : source:alumni-evermind, rgpd:legitimate-interest"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Conseil : utilise le préfixe <code className="font-mono">source:</code> pour la provenance et{" "}
                  <code className="font-mono">lm:</code> pour les lead magnets.
                </p>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-1 block">Liste à rattacher (optionnel)</label>
                <select
                  value={listId}
                  onChange={(e) => setListId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Aucune liste</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  Le tag de la liste sera ajouté aux contacts. <Link href="/admin/lists" className="text-es-green hover:underline">Gérer mes listes →</Link>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Source</label>
                  <Input
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="Ex : alumni-evermind"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Détail source (optionnel)</label>
                  <Input
                    value={sourceDetail}
                    onChange={(e) => setSourceDetail(e.target.value)}
                    placeholder="Ex : export Brevo 2026-04-20"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* RGPD */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">3. Base juridique RGPD</h2>
            <p className="text-xs text-gray-500 mb-3">
              Obligatoire. Chaque contact importé aura une entrée dans le registre de consentement (<code>consent_log</code>).
            </p>
            <div className="space-y-2">
              {CONSENT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    consentType === opt.value ? "border-es-green bg-es-green/5" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="radio"
                      name="consent"
                      value={opt.value}
                      checked={consentType === opt.value}
                      onChange={(e) => setConsentType(e.target.value)}
                      className="mt-1 accent-es-green"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="text-xs text-gray-500 mb-1 block">
                Base du consentement (contexte, ex : « export Evermind 2025 », « re-optin mai 2026 »)
              </label>
              <Input
                value={consentBasis}
                onChange={(e) => setConsentBasis(e.target.value)}
                placeholder="Ex : alumni_evermind_2026_04 ou brevo_reoptin_2026_05"
              />
            </div>
          </Card>

          {/* Options spécifiques alumni / cohortes Brevo */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">4. Options spéciales</h2>
            <div className="space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAlumni}
                  onChange={(e) => setSetAlumni(e.target.checked)}
                  className="mt-1 accent-es-green"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">Marquer comme alumni Evermind</p>
                  <p className="text-xs text-gray-500">
                    Active le flag <code>is_alumni_evermind</code> et la date <code>alumni_migrated_at</code>. Permet l&apos;auto-enroll dans SEQ_AL si la séquence a un trigger correspondant.
                  </p>
                </div>
              </label>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Cohorte RGPD (pour migration Brevo 3-phases)</label>
                <select
                  value={rgpdCohort}
                  onChange={(e) => setRgpdCohort(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">Aucune</option>
                  <option value="1">Cohorte 1 : alumni intérêt légitime</option>
                  <option value="2">Cohorte 2 : actifs 6 mois, re-consentement demandé</option>
                  <option value="3">Cohorte 3 : inactifs 6 mois+ (ne PAS importer normalement)</option>
                </select>
              </div>
            </div>
          </Card>
        </div>

        {/* Colonne droite : preview + actions */}
        <div className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <Card>
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-3">Aperçu</h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={runPreview}
                disabled={!csv || previewing}
                className="w-full"
              >
                {previewing ? "Analyse…" : "Voir l'aperçu (dry run)"}
              </Button>

              {preview && (
                <div className="mt-4 space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-es-green/5 p-2 rounded">
                      <p className="text-[10px] text-gray-500 uppercase">Valides</p>
                      <p className="text-xl font-bold text-es-green">{preview.valid}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="text-[10px] text-gray-500 uppercase">Total lignes</p>
                      <p className="text-xl font-bold text-gray-700">{preview.total_rows}</p>
                    </div>
                    {preview.duplicates_in_csv > 0 && (
                      <div className="bg-amber-50 p-2 rounded">
                        <p className="text-[10px] text-gray-500 uppercase">Doublons CSV</p>
                        <p className="text-xl font-bold text-amber-600">{preview.duplicates_in_csv}</p>
                      </div>
                    )}
                    {preview.invalid > 0 && (
                      <div className="bg-red-50 p-2 rounded">
                        <p className="text-[10px] text-gray-500 uppercase">Invalides</p>
                        <p className="text-xl font-bold text-red-600">{preview.invalid}</p>
                      </div>
                    )}
                  </div>

                  {preview.tags_to_apply.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase">Tags qui seront appliqués</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preview.tags_to_apply.map((t) => (
                          <code key={t} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded font-mono">{t}</code>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.invalid_samples.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-600 cursor-pointer">Voir {preview.invalid_samples.length} erreurs</summary>
                      <div className="mt-2 max-h-40 overflow-y-auto text-[11px] space-y-1">
                        {preview.invalid_samples.map((s, i) => (
                          <p key={i} className="text-red-600">
                            Ligne {s.row} : {s.email || "—"} ({s.reason})
                          </p>
                        ))}
                      </div>
                    </details>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={runImport}
                    disabled={preview.valid === 0 || importing}
                    className="w-full mt-3"
                  >
                    {importing ? "Import en cours…" : `Importer ${preview.valid} contacts`}
                  </Button>
                </div>
              )}
            </Card>

            {result && (
              <Card>
                <h3 className="font-serif text-lg font-bold text-es-green mb-2">✅ Import terminé</h3>
                <ul className="text-sm space-y-1 text-gray-700">
                  <li>{result.imported} contacts importés</li>
                  <li>{result.consent_logs_created} entrées consent_log</li>
                  {result.errors > 0 && <li className="text-red-600">{result.errors} erreurs</li>}
                  {result.duplicates_in_csv > 0 && <li className="text-amber-600">{result.duplicates_in_csv} doublons ignorés</li>}
                </ul>
                <div className="mt-3 flex gap-2">
                  <Link href="/admin/contacts" className="text-sm text-es-green hover:underline">
                    Voir les contacts →
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
