"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EmailEditor } from "@/components/admin/EmailEditor";

export default function NewEmailCampaign() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [sendResult, setSendResult] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [targetTags, setTargetTags] = useState<string[]>([]);
  const [showTestSend, setShowTestSend] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState("");

  async function handleTestSend() {
    if (!testEmail || !subject || !content) return;
    setTestSending(true);
    setTestResult("");
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail, subject, html_content: content }),
    });
    if (res.ok) {
      const data = await res.json();
      setTestResult(data.success ? `Test envoyé à ${testEmail}` : `Erreur : ${data.error}`);
    } else {
      setTestResult("Erreur lors de l'envoi test");
    }
    setTestSending(false);
  }

  async function handleSaveDraft() {
    setSaving(true);
    const body: Record<string, unknown> = { subject, html_content: content, status: "draft" };
    if (targetTags.length > 0) body.target_tags = targetTags;

    const url = campaignId ? `/api/emails/campaigns/${campaignId}` : "/api/emails/campaigns";
    const method = campaignId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      if (!campaignId) setCampaignId(data.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  async function handleSend() {
    if (!campaignId) {
      await handleSaveDraft();
    }
    setSending(true);
    const res = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, target_tags: targetTags.length > 0 ? targetTags : undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      setSendResult(`Envoyé à ${data.sent} contacts (${data.failed} erreurs)`);
    } else {
      setSendResult("Erreur lors de l'envoi");
    }
    setSending(false);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Nouvelle campagne email</h1>
          <p className="text-sm text-gray-500 mt-1">Créez et envoyez une newsletter à vos contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? "Éditeur" : "Aperçu"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving || !subject}>
            {saving ? "..." : saved ? "Sauvegardé" : "Sauvegarder"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTestSend(!showTestSend)} disabled={!subject || !content}>
            Envoyer un test
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend} disabled={sending || !subject || !content}>
            {sending ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </div>

      {sendResult && (
        <div className="bg-green-50 text-green-800 text-sm rounded-lg p-4 mb-6">{sendResult}</div>
      )}

      {/* Test send */}
      {showTestSend && (
        <Card className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Adresse email pour le test..."
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                type="email"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestSend} disabled={testSending || !testEmail}>
              {testSending ? "Envoi..." : "Envoyer le test"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setShowTestSend(false); setTestResult(""); }}>
              Fermer
            </Button>
          </div>
          {testResult && (
            <p className={`text-sm mt-2 ${testResult.includes("Erreur") ? "text-red-600" : "text-es-green"}`}>{testResult}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">L'email de test inclura le tracking (pixel + liens) pour vérifier que tout fonctionne.</p>
        </Card>
      )}

      {/* Target audience */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            label="Objet de l'email"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: 5 astuces pour votre premier investissement"
          />
        </div>
        <div className="w-72">
          <label className="text-sm font-medium text-gray-900 mb-1.5 block">Destinataires</label>
          <div className="px-4 py-3 rounded-lg border border-gray-200 bg-white space-y-2">
            {targetTags.length === 0 && (
              <p className="text-xs text-gray-400">Tous les contacts actifs (aucun filtre)</p>
            )}
            {[
              { value: "client", label: "Clients", color: "bg-green-100 text-green-700" },
              { value: "newsletter", label: "Abonnés newsletter", color: "bg-gray-100 text-gray-700" },
              { value: "lead_magnet", label: "Leads ebook", color: "bg-purple-100 text-purple-700" },
              { value: "ebook", label: "Ebook (tag)", color: "bg-purple-100 text-purple-700" },
              { value: "formation_gratuite", label: "Formation gratuite", color: "bg-amber-100 text-amber-700" },
              { value: "import", label: "Importés CSV", color: "bg-blue-100 text-blue-700" },
            ].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={targetTags.includes(opt.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTargetTags([...targetTags, opt.value]);
                    } else {
                      setTargetTags(targetTags.filter((t) => t !== opt.value));
                    }
                  }}
                  className="rounded border-gray-300 accent-es-green"
                />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${opt.color}`}>{opt.label}</span>
              </label>
            ))}
          </div>
          {targetTags.length > 0 && (
            <button
              onClick={() => setTargetTags([])}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1 cursor-pointer"
            >
              Réinitialiser (envoyer à tous)
            </button>
          )}
        </div>
      </div>

      {previewMode ? (
        /* Preview */
        <Card className="max-w-2xl mx-auto">
          <div className="bg-es-green text-white p-6 -m-6 mb-4 rounded-t-xl text-center">
            <h3 className="font-serif text-lg font-bold">Emeline Siron</h3>
          </div>
          <div className="mt-4">
            {subject && <p className="font-bold text-gray-900 mb-4 text-lg">{subject}</p>}
            {content ? (
              <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
              <p className="text-gray-300 text-sm italic">Le contenu apparaîtra ici...</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Emeline Siron - Aix-en-Provence - Se désabonner
          </div>
        </Card>
      ) : (
        /* WYSIWYG Editor */
        <EmailEditor value={content} onChange={setContent} />
      )}
    </div>
  );
}
