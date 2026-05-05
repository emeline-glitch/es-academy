"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EmailEditor } from "@/components/admin/EmailEditor";
import { formatRelative } from "@/lib/utils/format";

interface Template {
  id: string;
  key: string;
  name: string;
  description: string | null;
  subject: string;
  html_content: string;
  from_name: string;
  from_email: string;
  reply_to: string | null;
  available_variables: string[];
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-templates");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      toast.error("Impossible de charger les templates");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <Link href="/admin/emails" className="text-sm text-gray-400 hover:text-es-green">
            ← Campagnes
          </Link>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mt-1">
            Templates d&apos;emails transactionnels
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Les emails envoyés automatiquement : bascule élève, réinitialisation mot de passe, bienvenue achat… Tous éditables ici.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-4 border-es-green/20 border-t-es-green animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-serif text-lg font-bold text-gray-900">{t.name}</h2>
                    <code className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">
                      {t.key}
                    </code>
                  </div>
                  {t.description && (
                    <p className="text-sm text-gray-500 mt-1">{t.description}</p>
                  )}
                  <p className="text-sm text-gray-700 mt-2">
                    <span className="font-semibold">Sujet :</span> {t.subject}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    De : {t.from_name} &lt;{t.from_email}&gt; · modifié{" "}
                    {formatRelative(t.updated_at)}
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={() => setEditing(t)}>
                  Modifier
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <EditTemplateModal
          template={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            fetchTemplates();
          }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
function EditTemplateModal({
  template,
  onClose,
  onSaved,
}: {
  template: Template;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [subject, setSubject] = useState(template.subject);
  const [html, setHtml] = useState(template.html_content);
  const [fromName, setFromName] = useState(template.from_name);
  const [fromEmail, setFromEmail] = useState(template.from_email);
  const [replyTo, setReplyTo] = useState(template.reply_to || "");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/email-templates/${template.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          html_content: html,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Erreur");
      }
      toast.success("Template enregistré");
      onSaved();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    if (!testEmail) return;
    setSendingTest(true);
    try {
      // On prépare un HTML avec les variables remplacées par des valeurs d'exemple
      const sampleVars: Record<string, string> = {
        prenom: "Marie",
        email: testEmail,
        activation_url: "https://emeline-siron.fr/connexion?token=EXEMPLE",
        reset_url: "https://emeline-siron.fr/reset-password?token=EXEMPLE",
        dashboard_url: "https://emeline-siron.fr/dashboard",
        family_url: "https://emeline-siron.fr/family",
        // Legacy : Skool abandonne avril 2026, garde pour retrocompat des anciens templates DB
        skool_url: "https://emeline-siron.fr/family",
        coaching_credits: "3",
        coaching_date: "Mardi 22 avril",
        coaching_time: "14h00",
        meeting_url: "https://meet.google.com/exemple",
        remaining_coachings: "2",
        product_name: "Academy",
        amount_paid: "998€",
      };
      const rendered = html.replace(
        /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
        (_m, name) => sampleVars[name] || `[${name}]`
      );
      const renderedSubject = subject.replace(
        /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g,
        (_m, name) => sampleVars[name] || `[${name}]`
      );

      const res = await fetch("/api/emails/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: `[TEST TEMPLATE] ${renderedSubject}`,
          html_content: rendered,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Test envoyé à ${testEmail}`);
    } catch {
      toast.error("Échec de l'envoi test");
    } finally {
      setSendingTest(false);
    }
  }

  const availableVars = Array.isArray(template.available_variables)
    ? template.available_variables
    : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-6 pb-6 px-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{template.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Variables disponibles */}
          {availableVars.length > 0 && (
            <div className="bg-es-green/5 border border-es-green/20 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-1.5">
                Variables disponibles (copie-colle dans le sujet ou le corps) :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableVars.map((v) => (
                  <code
                    key={v}
                    className="text-[11px] bg-white border border-gray-200 text-es-green px-2 py-0.5 rounded font-mono cursor-pointer hover:bg-es-green/10"
                    onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                    title="Cliquer pour copier"
                  >{`{{${v}}}`}</code>
                ))}
              </div>
            </div>
          )}

          {/* Expéditeur */}
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Nom expéditeur</label>
              <input
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email expéditeur</label>
              <input
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Reply-to (optionnel)</label>
              <input
                value={replyTo}
                onChange={(e) => setReplyTo(e.target.value)}
                placeholder="Par défaut = from"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Sujet */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Sujet *</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>

          {/* HTML content */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Corps du message</label>
            <EmailEditor value={html} onChange={setHtml} />
          </div>

          {/* Test send */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Envoyer un test</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="ton@email.com"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={sendTest}
                disabled={!testEmail || sendingTest}
              >
                {sendingTest ? "Envoi…" : "Envoyer un test"}
              </Button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Les variables seront remplacées par des valeurs d&apos;exemple (ex : Marie, URL fictive).
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-100 bg-gray-50">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" size="sm" onClick={save} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
