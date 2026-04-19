"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmailEditor } from "@/components/admin/EmailEditor";
import { AudienceTargeter } from "@/components/admin/AudienceTargeter";
import { MergeTagsToolbar, renderMergeTagsPreview } from "@/components/admin/MergeTagsToolbar";
import { InboxPreview } from "@/components/admin/InboxPreview";
import { useToast } from "@/components/ui/Toast";

type SectionKey = "sender" | "recipients" | "subject" | "design" | "settings" | "preview" | "schedule" | null;

interface CampaignState {
  id: string;
  subject: string;
  preview_text: string;
  from_name: string;
  from_email: string;
  reply_to: string;
  html_content: string;
  target_tags: string[];
  scheduled_at: string | null;
  status: string;
}

const DEFAULT_FROM_NAME = "Emeline Siron";
const DEFAULT_FROM_EMAIL = "emeline@es-academy.fr";

export default function NewEmailCampaign() {
  const toast = useToast();
  const [state, setState] = useState<CampaignState>({
    id: "",
    subject: "",
    preview_text: "",
    from_name: DEFAULT_FROM_NAME,
    from_email: DEFAULT_FROM_EMAIL,
    reply_to: "",
    html_content: "",
    target_tags: [],
    scheduled_at: null,
    status: "draft",
  });
  const [openSection, setOpenSection] = useState<SectionKey>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  // Auto-save debounced
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleSave(next: Partial<CampaignState>) {
    const merged = { ...state, ...next };
    setState(merged);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveCampaign(merged), 800);
  }

  async function saveCampaign(s: CampaignState) {
    setSaving(true);
    const payload = {
      subject: s.subject,
      html_content: s.html_content,
      preview_text: s.preview_text,
      from_name: s.from_name,
      from_email: s.from_email,
      reply_to: s.reply_to || null,
      target_tags: s.target_tags,
    };
    try {
      const url = s.id ? `/api/emails/campaigns/${s.id}` : "/api/emails/campaigns";
      const method = s.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!s.id && data.id) {
        setState((prev) => ({ ...prev, id: data.id }));
      }
    } catch {
      toast.error("Sauvegarde impossible");
    } finally {
      setSaving(false);
    }
  }

  const senderDone = !!state.from_name && !!state.from_email;
  const recipientsDone = state.target_tags.length > 0;
  const subjectDone = state.subject.trim().length > 0;
  const designDone = state.html_content.trim().length > 0;

  const allReady = senderDone && recipientsDone && subjectDone && designDone;

  async function handleSend() {
    if (!allReady) {
      toast.error("Complète toutes les sections avant d'envoyer");
      return;
    }
    if (!confirm(`Envoyer la campagne aux ${state.target_tags.length} liste(s) ciblée(s) ?`)) return;
    // Save first
    await saveCampaign(state);
    setSending(true);
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: state.id,
          target_tags: state.target_tags,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Envoyé à ${data.sent || 0} contact${(data.sent || 0) > 1 ? "s" : ""}${data.failed ? ` · ${data.failed} erreurs` : ""}`);
    } catch {
      toast.error("Échec de l'envoi");
    } finally {
      setSending(false);
    }
  }

  async function handleSchedule(when: string) {
    await saveCampaign(state);
    const res = await fetch(`/api/emails/campaigns/${state.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduled_at: when, status: "scheduled" }),
    });
    if (res.ok) {
      setState((s) => ({ ...s, scheduled_at: when, status: "scheduled" }));
      setOpenSection(null);
      toast.success(`Campagne programmée pour le ${new Date(when).toLocaleString("fr-FR")}`);
    } else {
      toast.error("Programmation impossible");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/admin/emails" className="text-gray-400 hover:text-gray-600 text-xl">
            ←
          </Link>
          <div className="min-w-0">
            <h1 className="font-serif text-xl font-bold text-gray-900 truncate">
              {state.subject || "Nouvelle campagne"}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {state.status === "draft" && "Brouillon"}
              {state.status === "scheduled" && state.scheduled_at && `Programmée pour le ${new Date(state.scheduled_at).toLocaleString("fr-FR")}`}
              {state.status === "sent" && "Envoyée"}
              {saving && <span className="ml-2 italic text-gray-400">· sauvegarde…</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setOpenSection("preview")}
            disabled={!subjectDone || !designDone}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Aperçu et test
          </button>
          <button
            onClick={() => setOpenSection("schedule")}
            disabled={!allReady}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-40"
          >
            Programmer
          </button>
          <Button variant="primary" size="sm" onClick={handleSend} disabled={!allReady || sending}>
            {sending ? "Envoi…" : "Envoyer maintenant"}
          </Button>
        </div>
      </div>

      {/* Sections cards */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* Expéditeur */}
        <SectionRow
          done={senderDone}
          title="Expéditeur"
          description={
            senderDone
              ? `${state.from_name} · ${state.from_email}`
              : "Qui envoie cette campagne d'emails ?"
          }
          actionLabel={senderDone ? "Gérer l'expéditeur" : "Définir l'expéditeur"}
          onAction={() => setOpenSection("sender")}
        />

        {/* Destinataires */}
        <SectionRow
          done={recipientsDone}
          title="Destinataires"
          description={
            recipientsDone
              ? `${state.target_tags.length} liste${state.target_tags.length > 1 ? "s" : ""} sélectionnée${state.target_tags.length > 1 ? "s" : ""}`
              : "Les personnes qui reçoivent votre campagne"
          }
          actionLabel={recipientsDone ? "Modifier les destinataires" : "Ajouter des destinataires"}
          onAction={() => setOpenSection("recipients")}
        />

        {/* Objet */}
        <SectionRow
          done={subjectDone}
          title="Objet de la campagne"
          description={
            subjectDone ? (
              <>
                <p className="text-sm"><span className="font-semibold">Objet :</span> {state.subject}</p>
                {state.preview_text && (
                  <p className="text-sm"><span className="font-semibold">Aperçu :</span> {state.preview_text}</p>
                )}
              </>
            ) : (
              "Ajoute une ligne d'objet pour cette campagne."
            )
          }
          actionLabel={subjectDone ? "Modifier l'objet" : "Définir l'objet"}
          onAction={() => setOpenSection("subject")}
        />

        {/* Design */}
        <SectionRow
          done={designDone}
          title="Design"
          description={
            designDone ? (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-w-md">
                <div
                  className="p-4 bg-white text-sm max-h-[120px] overflow-hidden text-gray-600"
                  dangerouslySetInnerHTML={{ __html: state.html_content }}
                />
              </div>
            ) : (
              "Créer le contenu de l'email."
            )
          }
          actionLabel={designDone ? "Modifier le design" : "Créer le design"}
          onAction={() => setOpenSection("design")}
        />

        {/* Paramètres */}
        <SectionRow
          done={null}
          title="Paramètres supplémentaires"
          description="Reply-to, désinscription, tracking"
          actionLabel="Modifier les paramètres"
          onAction={() => setOpenSection("settings")}
          isLast
        />
      </div>

      {/* Modals */}
      {openSection === "sender" && (
        <SenderModal
          fromName={state.from_name}
          fromEmail={state.from_email}
          onSave={(next) => {
            scheduleSave(next);
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "recipients" && (
        <RecipientsModal
          value={state.target_tags}
          onSave={(tags) => {
            scheduleSave({ target_tags: tags });
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "subject" && (
        <SubjectModal
          subject={state.subject}
          previewText={state.preview_text}
          fromName={state.from_name}
          onSave={(next) => {
            scheduleSave(next);
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "design" && (
        <DesignModal
          content={state.html_content}
          onSave={(html) => {
            scheduleSave({ html_content: html });
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "settings" && (
        <SettingsModal
          replyTo={state.reply_to}
          onSave={(next) => {
            scheduleSave(next);
            setOpenSection(null);
          }}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "preview" && (
        <PreviewModal
          subject={state.subject}
          previewText={state.preview_text}
          content={state.html_content}
          fromName={state.from_name}
          campaignId={state.id}
          onClose={() => setOpenSection(null)}
        />
      )}

      {openSection === "schedule" && (
        <ScheduleModal
          onSchedule={handleSchedule}
          onClose={() => setOpenSection(null)}
        />
      )}
    </div>
  );
}

// ============================================================================
// Section row (dans la carte principale)
// ============================================================================
function SectionRow({
  done,
  title,
  description,
  actionLabel,
  onAction,
  isLast = false,
}: {
  done: boolean | null; // null = pas de check (paramètres)
  title: string;
  description: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-start gap-4 p-5 ${!isLast ? "border-b border-gray-100" : ""}`}>
      <div className="shrink-0 mt-0.5">
        {done === true && (
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">✓</div>
        )}
        {done === false && (
          <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
        )}
        {done === null && <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 text-base">{title}</h3>
        <div className="text-sm text-gray-500 mt-1">{description}</div>
      </div>
      <button
        onClick={onAction}
        className="shrink-0 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ============================================================================
// Modal generic wrapper
// ============================================================================
function Modal({
  icon,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  icon: "done" | "todo";
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-10 pb-10 px-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-6xl" : "max-w-3xl"} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 p-6 border-b border-gray-100">
          <div className="shrink-0 mt-0.5">
            {icon === "done" ? (
              <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">✓</div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ============================================================================
// Expéditeur modal
// ============================================================================
function SenderModal({
  fromName,
  fromEmail,
  onSave,
  onClose,
}: {
  fromName: string;
  fromEmail: string;
  onSave: (next: { from_name: string; from_email: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(fromName);
  const [email, setEmail] = useState(fromEmail);
  const done = !!name && !!email;

  return (
    <Modal
      icon={done ? "done" : "todo"}
      title="Expéditeur"
      subtitle="Qui envoie cette campagne d'emails ?"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button variant="primary" size="sm" onClick={() => onSave({ from_name: name, from_email: email })}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-900 mb-1.5 block">Adresse email *</label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white"
            >
              <option value="emeline@es-academy.fr">emeline@es-academy.fr</option>
              <option value="contact@evermind.group">contact@evermind.group</option>
              <option value="contact@emelinesiron.com">contact@emelinesiron.com</option>
            </select>
            <p className="text-[11px] text-gray-400 mt-1">Seules les adresses vérifiées dans Amazon SES sont utilisables en envoi réel.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-900 mb-1.5 block">Nom</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Emeline Siron"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <InboxPreview fromName={name} subject="Objet du message…" previewText="Votre texte d'aperçu" />
      </div>
    </Modal>
  );
}

// ============================================================================
// Destinataires modal
// ============================================================================
function RecipientsModal({
  value,
  onSave,
  onClose,
}: {
  value: string[];
  onSave: (tags: string[]) => void;
  onClose: () => void;
}) {
  const [tags, setTags] = useState<string[]>(value);
  return (
    <Modal
      icon={tags.length > 0 ? "done" : "todo"}
      title="Destinataires"
      subtitle="Choisis les listes de contacts qui recevront la campagne"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button variant="primary" size="sm" onClick={() => onSave(tags)}>Enregistrer</Button>
        </>
      }
    >
      <AudienceTargeter value={tags} onChange={setTags} label="" />
    </Modal>
  );
}

// ============================================================================
// Objet modal (avec iPhone preview live)
// ============================================================================
function SubjectModal({
  subject,
  previewText,
  fromName,
  onSave,
  onClose,
}: {
  subject: string;
  previewText: string;
  fromName: string;
  onSave: (next: { subject: string; preview_text: string }) => void;
  onClose: () => void;
}) {
  const [s, setS] = useState(subject);
  const [p, setP] = useState(previewText);
  const subjectRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);

  function insertSubject(tag: string) {
    const el = subjectRef.current;
    if (!el) { setS((v) => v + tag); return; }
    const pos = el.selectionStart ?? s.length;
    const next = s.slice(0, pos) + tag + s.slice(el.selectionEnd ?? pos);
    setS(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(pos + tag.length, pos + tag.length); }, 0);
  }
  function insertPreview(tag: string) {
    const el = previewRef.current;
    if (!el) { setP((v) => v + tag); return; }
    const pos = el.selectionStart ?? p.length;
    const next = p.slice(0, pos) + tag + p.slice(el.selectionEnd ?? pos);
    setP(next);
    setTimeout(() => { el.focus(); el.setSelectionRange(pos + tag.length, pos + tag.length); }, 0);
  }

  return (
    <Modal
      icon={s ? "done" : "todo"}
      title="Objet de la campagne"
      subtitle="Ajoute une ligne d'objet pour cette campagne."
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button variant="primary" size="sm" onClick={() => onSave({ subject: s, preview_text: p })} disabled={!s}>
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-900">Objet *</label>
              <MergeTagsToolbar onInsert={insertSubject} />
            </div>
            <input
              ref={subjectRef}
              value={s}
              onChange={(e) => setS(e.target.value)}
              placeholder="Ex : {{prenom}}, voici un scoop immo 🏠"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">Tip : garde-le sous 50 caractères pour qu&apos;il s&apos;affiche entièrement sur mobile.</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-900">Texte d&apos;aperçu</label>
              <MergeTagsToolbar onInsert={insertPreview} />
            </div>
            <input
              ref={previewRef}
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="Court résumé qui apparaît après l'objet dans la boîte mail"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
        <InboxPreview
          fromName={fromName}
          subject={renderMergeTagsPreview(s, null)}
          previewText={renderMergeTagsPreview(p, null)}
        />
      </div>
    </Modal>
  );
}

// ============================================================================
// Design modal (full editor)
// ============================================================================
function DesignModal({
  content,
  onSave,
  onClose,
}: {
  content: string;
  onSave: (html: string) => void;
  onClose: () => void;
}) {
  const [html, setHtml] = useState(content);
  return (
    <Modal
      icon={html ? "done" : "todo"}
      title="Design"
      subtitle="Rédige le contenu de l'email"
      wide
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button variant="primary" size="sm" onClick={() => onSave(html)}>Enregistrer</Button>
        </>
      }
    >
      <EmailEditor value={html} onChange={setHtml} />
    </Modal>
  );
}

// ============================================================================
// Settings modal
// ============================================================================
function SettingsModal({
  replyTo,
  onSave,
  onClose,
}: {
  replyTo: string;
  onSave: (next: { reply_to: string }) => void;
  onClose: () => void;
}) {
  const [rt, setRt] = useState(replyTo);
  return (
    <Modal
      icon="todo"
      title="Paramètres supplémentaires"
      subtitle="Options avancées de la campagne"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button variant="primary" size="sm" onClick={() => onSave({ reply_to: rt })}>Enregistrer</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-900 mb-1.5 block">Reply-to (optionnel)</label>
          <input
            type="email"
            value={rt}
            onChange={(e) => setRt(e.target.value)}
            placeholder="contact@emelinesiron.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Si un destinataire répond à l&apos;email, sa réponse ira à cette adresse (si différente de l&apos;expéditeur).</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-1">Désinscription</p>
          <p className="text-xs text-gray-600">
            Un lien de désinscription est ajouté automatiquement en bas de chaque email, pointant vers{" "}
            <a href="/desabonnement" target="_blank" className="text-es-green hover:underline">/desabonnement</a>.
          </p>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Preview & test modal
// ============================================================================
function PreviewModal({
  subject,
  previewText,
  content,
  fromName,
  campaignId,
  onClose,
}: {
  subject: string;
  previewText: string;
  content: string;
  fromName: string;
  campaignId: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState({ first_name: "Marie", last_name: "Dupont", email: "marie@test.com" });

  const renderedSubject = useMemo(() => renderMergeTagsPreview(subject, preview), [subject, preview]);
  const renderedContent = useMemo(() => renderMergeTagsPreview(content, preview), [content, preview]);
  const renderedPreview = useMemo(() => renderMergeTagsPreview(previewText, preview), [previewText, preview]);

  async function sendTest() {
    if (!testEmail) return;
    setSending(true);
    const res = await fetch("/api/emails/send-test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: testEmail, subject, html_content: content, campaign_id: campaignId }),
    });
    setSending(false);
    if (res.ok) toast.success(`Test envoyé à ${testEmail}`);
    else toast.error("Échec de l'envoi test");
  }

  return (
    <Modal
      icon="done"
      title="Aperçu et test"
      subtitle="Vérifie le rendu avant d'envoyer"
      wide
      onClose={onClose}
    >
      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <div>
          {/* Device toggle */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setDevice("desktop")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium ${device === "desktop" ? "bg-white shadow-sm" : "text-gray-500"}`}
              >
                🖥 Desktop
              </button>
              <button
                onClick={() => setDevice("mobile")}
                className={`px-4 py-1.5 rounded-md text-xs font-medium ${device === "mobile" ? "bg-white shadow-sm" : "text-gray-500"}`}
              >
                📱 Mobile
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-500">Contact de preview :</label>
              <input
                value={preview.first_name}
                onChange={(e) => setPreview({ ...preview, first_name: e.target.value })}
                placeholder="Prénom"
                className="px-2 py-1 border border-gray-200 rounded w-20"
              />
              <input
                value={preview.email}
                onChange={(e) => setPreview({ ...preview, email: e.target.value })}
                placeholder="Email"
                className="px-2 py-1 border border-gray-200 rounded w-40"
              />
            </div>
          </div>

          {/* Preview rendu */}
          <div className={`${device === "desktop" ? "max-w-2xl" : "max-w-xs"} mx-auto border border-gray-200 rounded-xl overflow-hidden shadow-sm`}>
            <div className="bg-gray-50 border-b border-gray-100 p-3">
              <p className="text-[11px] text-gray-400">De : {fromName}</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{renderedSubject}</p>
              {renderedPreview && <p className="text-xs text-gray-500">{renderedPreview}</p>}
            </div>
            <div
              className="bg-white p-5 text-sm text-gray-700 leading-relaxed min-h-[200px]"
              dangerouslySetInnerHTML={{ __html: renderedContent || "<p class='text-gray-300 italic'>Vide</p>" }}
            />
          </div>
        </div>

        {/* Test send */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">Envoyer un test</h3>
          <p className="text-xs text-gray-500 mb-3">L&apos;email test inclut le tracking (pixel + liens).</p>
          <div className="space-y-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="ton@email.com"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <Button variant="primary" size="sm" onClick={sendTest} disabled={!testEmail || sending} className="w-full">
              {sending ? "Envoi…" : "Envoyer le test"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Schedule modal
// ============================================================================
function ScheduleModal({
  onSchedule,
  onClose,
}: {
  onSchedule: (whenISO: string) => void;
  onClose: () => void;
}) {
  const minLocal = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    return d.toISOString().slice(0, 16);
  }, []);
  const defaultLocal = useMemo(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000); // dans 1h
    return d.toISOString().slice(0, 16);
  }, []);
  const [when, setWhen] = useState(defaultLocal);

  return (
    <Modal
      icon="todo"
      title="Programmer la campagne"
      subtitle="Choisis la date et l'heure d'envoi (heure locale)"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2">Annuler</button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onSchedule(new Date(when).toISOString())}
            disabled={!when}
          >
            Programmer
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <input
          type="datetime-local"
          value={when}
          min={minLocal}
          onChange={(e) => setWhen(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setWhen(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16))}
            className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Dans 1h
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(9, 0, 0, 0);
              setWhen(d.toISOString().slice(0, 16));
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Demain 9h
          </button>
          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + ((2 - d.getDay() + 7) % 7 || 7)); // prochain mardi
              d.setHours(10, 0, 0, 0);
              setWhen(d.toISOString().slice(0, 16));
            }}
            className="text-xs px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            Mardi prochain 10h
          </button>
        </div>
        <p className="text-[11px] text-gray-400">
          La campagne sera envoyée automatiquement à l&apos;heure choisie. Tu peux encore la modifier ou l&apos;annuler avant.
        </p>
      </div>
    </Modal>
  );
}

// Empêche les lint warnings sur useEffect non utilisé
void useEffect;
