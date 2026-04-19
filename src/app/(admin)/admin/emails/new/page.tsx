"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EmailEditor } from "@/components/admin/EmailEditor";
import { AudienceTargeter } from "@/components/admin/AudienceTargeter";
import { MergeTagsToolbar, renderMergeTagsPreview } from "@/components/admin/MergeTagsToolbar";
import { useToast } from "@/components/ui/Toast";

interface PreviewContact {
  first_name: string;
  last_name: string;
  email: string;
}

export default function NewEmailCampaign() {
  const toast = useToast();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [targetTags, setTargetTags] = useState<string[]>([]);
  const [showTestSend, setShowTestSend] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [previewContact, setPreviewContact] = useState<PreviewContact>({
    first_name: "Marie",
    last_name: "Dupont",
    email: "marie.dupont@exemple.com",
  });
  const subjectRef = useRef<HTMLInputElement>(null);

  const renderedSubject = useMemo(() => renderMergeTagsPreview(subject, previewContact), [subject, previewContact]);
  const renderedContent = useMemo(() => renderMergeTagsPreview(content, previewContact), [content, previewContact]);

  function insertIntoSubject(tag: string) {
    const input = subjectRef.current;
    if (!input) {
      setSubject((s) => s + tag);
      return;
    }
    const start = input.selectionStart ?? subject.length;
    const end = input.selectionEnd ?? subject.length;
    const next = subject.slice(0, start) + tag + subject.slice(end);
    setSubject(next);
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  }

  function insertIntoContent(tag: string) {
    setContent((c) => c + tag);
  }

  async function handleTestSend() {
    if (!testEmail || !subject || !content) return;
    setTestSending(true);
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail, subject, html_content: content }),
    });
    setTestSending(false);
    if (res.ok) {
      const data = await res.json();
      if (data.success) toast.success(`Test envoyé à ${testEmail}`);
      else toast.error(`Erreur : ${data.error}`);
    } else {
      toast.error("Erreur lors de l'envoi test");
    }
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
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      if (!campaignId) setCampaignId(data.id);
      toast.success("Brouillon sauvegardé");
    } else {
      toast.error("Impossible de sauvegarder");
    }
  }

  async function handleSend() {
    if (!campaignId) {
      await handleSaveDraft();
    }
    if (!confirm(`Envoyer cette campagne ${targetTags.length > 0 ? `aux contacts des ${targetTags.length} liste(s) sélectionnée(s)` : "à TOUS les contacts actifs"} ?`)) {
      return;
    }
    setSending(true);
    const res = await fetch("/api/emails/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campaign_id: campaignId,
        target_tags: targetTags.length > 0 ? targetTags : undefined,
      }),
    });
    setSending(false);
    if (res.ok) {
      const data = await res.json();
      toast.success(`Envoyé à ${data.sent} contact${data.sent > 1 ? "s" : ""}${data.failed > 0 ? ` · ${data.failed} erreurs` : ""}`);
    } else {
      toast.error("Erreur lors de l'envoi");
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Nouvelle campagne email</h1>
          <p className="text-sm text-gray-500 mt-1">Crée et envoie une newsletter à tes contacts</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? "Éditeur" : "Aperçu"}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSaveDraft} disabled={saving || !subject}>
            {saving ? "…" : "Sauvegarder"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowTestSend(!showTestSend)} disabled={!subject || !content}>
            Test
          </Button>
          <Button variant="primary" size="sm" onClick={handleSend} disabled={sending || !subject || !content}>
            {sending ? "Envoi…" : "Envoyer"}
          </Button>
        </div>
      </div>

      {/* Test send */}
      {showTestSend && (
        <Card className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <Input
                placeholder="Adresse email pour le test…"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                type="email"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={handleTestSend} disabled={testSending || !testEmail}>
              {testSending ? "Envoi…" : "Envoyer le test"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTestSend(false)}>
              Fermer
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-2">L&apos;email test inclut le tracking (pixel + liens).</p>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 mb-6">
        {/* Sujet + audience */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-900">Objet de l&apos;email</label>
              <MergeTagsToolbar onInsert={insertIntoSubject} />
            </div>
            <input
              ref={subjectRef}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex : {{prenom}}, voici 5 astuces pour ton premier investissement"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm"
            />
            {subject.includes("{{") && (
              <p className="text-[11px] text-gray-400 mt-1 italic">
                Aperçu : <span className="text-es-green">{renderedSubject}</span>
              </p>
            )}
          </div>
        </div>

        <AudienceTargeter
          value={targetTags}
          onChange={setTargetTags}
          helpText="Vide = tous les contacts actifs"
        />
      </div>

      {previewMode ? (
        /* Preview avec merge tags rendus */
        <Card className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <p className="text-xs text-gray-400">Prévisualisation en tant que :</p>
            <div className="flex gap-2 items-center">
              <input
                value={previewContact.first_name}
                onChange={(e) => setPreviewContact({ ...previewContact, first_name: e.target.value })}
                placeholder="Prénom"
                className="text-xs px-2 py-1 border border-gray-200 rounded w-24"
              />
              <input
                value={previewContact.email}
                onChange={(e) => setPreviewContact({ ...previewContact, email: e.target.value })}
                placeholder="Email"
                className="text-xs px-2 py-1 border border-gray-200 rounded w-40"
              />
            </div>
          </div>
          <div className="bg-es-green text-white p-6 -m-6 mb-4 rounded-t-xl text-center">
            <h3 className="font-serif text-lg font-bold">Emeline Siron</h3>
          </div>
          <div className="mt-4">
            {renderedSubject && <p className="font-bold text-gray-900 mb-4 text-lg">{renderedSubject}</p>}
            {renderedContent ? (
              <div className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderedContent }} />
            ) : (
              <p className="text-gray-300 text-sm italic">Le contenu apparaîtra ici…</p>
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Emeline Siron · Aix-en-Provence · Se désabonner
          </div>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-900">Contenu de l&apos;email</label>
            <MergeTagsToolbar onInsert={insertIntoContent} />
          </div>
          <EmailEditor value={content} onChange={setContent} />
        </div>
      )}
    </div>
  );
}
