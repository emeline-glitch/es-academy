"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import { formatRelative, formatDateTime, formatMoney } from "@/lib/utils/format";

interface StudentData {
  profile: {
    id: string;
    full_name: string | null;
    email: string | null;
    role: string;
    coaching_credits_total: number;
    coaching_credits_used: number;
    created_at: string;
  } | null;
  auth: {
    email: string | null;
    last_sign_in_at: string | null;
    created_at: string | null;
    email_confirmed_at: string | null;
  };
  enrollments: Array<{ id: string; course_id: string; product_name: string; amount_paid: number; purchased_at: string; status: string }>;
  progress: Array<{ id: string; lesson_id: string; course_id: string; completed_at: string }>;
  progress_by_course: Record<string, number>;
  last_progress_at: string | null;
  quiz_results: Array<{ quiz_id: string; lesson_id: string | null; score: number; passed: boolean; completed_at: string }>;
  notes: Array<{ id: string; content: string; created_at: string; author_id: string }>;
}

const TOTAL_LESSONS = 64;

export default function StudentDetailPage() {
  const toast = useToast();
  const params = useParams();
  const userId = params?.userId as string;
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/eleves/${userId}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      toast.error("Impossible de charger l'élève");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    if (userId) fetchData();
  }, [userId, fetchData]);

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Non authentifié");
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("coaching_notes").insert({
      student_id: userId,
      author_id: user.id,
      content: noteText,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNoteText("");
    fetchData();
    toast.success("Note ajoutée");
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="h-64 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!data?.profile) {
    return (
      <div>
        <Link href="/admin/eleves" className="text-sm text-gray-400 hover:text-es-green">← Retour aux élèves</Link>
        <div className="text-center py-20 text-gray-400">Élève introuvable</div>
      </div>
    );
  }

  const completedLessons = data.progress.length;
  const progressPct = Math.round((completedLessons / TOTAL_LESSONS) * 100);
  const email = data.auth.email || data.profile.email;

  const courseStats = Object.entries(data.progress_by_course).map(([course, count]) => ({
    course,
    count,
  }));

  const lastActivity = [data.last_progress_at, data.auth.last_sign_in_at]
    .filter((x): x is string => !!x)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/eleves" className="text-sm text-gray-400 hover:text-es-green mb-2 inline-block">
          ← Retour aux élèves
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              {data.profile.full_name || email || "Élève"}
            </h1>
            {email && data.profile.full_name !== email && (
              <p className="text-sm text-gray-500">
                <a href={`mailto:${email}`} className="hover:text-es-green">{email}</a>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data.auth.email_confirmed_at ? (
              <Badge variant="success">Email vérifié</Badge>
            ) : (
              <Badge variant="warning">Email non vérifié</Badge>
            )}
          </div>
        </div>
      </div>

      {/* KPIs activité */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider">Inscrit</p>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            {formatRelative(data.auth.created_at || data.profile.created_at)}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider">Dernière connexion</p>
          <p className={`text-sm font-semibold mt-1 ${data.auth.last_sign_in_at ? "text-es-green" : "text-gray-400 italic"}`}>
            {data.auth.last_sign_in_at ? formatRelative(data.auth.last_sign_in_at) : "Jamais connecté"}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider">Dernière leçon</p>
          <p className={`text-sm font-semibold mt-1 ${data.last_progress_at ? "text-blue-600" : "text-gray-400 italic"}`}>
            {data.last_progress_at ? formatRelative(data.last_progress_at) : "Pas encore"}
          </p>
        </Card>
        <Card>
          <p className="text-[10px] uppercase text-gray-500 tracking-wider">Activité globale</p>
          <p className={`text-sm font-semibold mt-1 ${lastActivity ? "text-amber-600" : "text-gray-400 italic"}`}>
            {lastActivity ? formatRelative(lastActivity) : "—"}
          </p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Formations achetées</h2>
            {data.enrollments.length > 0 ? (
              <div className="space-y-3">
                {data.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="success">
                        {e.product_name}
                      </Badge>
                      {e.course_id && <span className="text-xs text-gray-600 font-mono">{e.course_id}</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatMoney(e.amount_paid)}</span>
                      <p className="text-[10px] text-gray-400">{formatRelative(e.purchased_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune formation achetée</p>
            )}
          </Card>

          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Progression formation</h2>
            <ProgressBar value={completedLessons} max={TOTAL_LESSONS} label={`${completedLessons} / ${TOTAL_LESSONS} leçons · ${progressPct}%`} className="mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-es-green">{completedLessons}</div>
                <div className="text-[10px] text-gray-500">Leçons terminées</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">{data.quiz_results.length}</div>
                <div className="text-[10px] text-gray-500">Quiz passés</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-amber-600">
                  {data.quiz_results.length > 0
                    ? Math.round(data.quiz_results.reduce((s, q) => s + q.score, 0) / data.quiz_results.length)
                    : 0}%
                </div>
                <div className="text-[10px] text-gray-500">Score moyen</div>
              </div>
            </div>
            {courseStats.length > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Par cours</p>
                <div className="space-y-1.5">
                  {courseStats.map((c) => (
                    <div key={c.course} className="flex items-center justify-between text-xs">
                      <span className="font-mono text-gray-600">{c.course}</span>
                      <span className="font-semibold text-gray-900">{c.count} leçon{c.count > 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {data.progress.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-lg font-bold text-gray-900">Historique des leçons</h2>
                <span className="text-xs text-gray-400">{data.progress.length} leçon{data.progress.length > 1 ? "s" : ""}</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
                {data.progress.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-xs text-green-700">✓</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 font-mono truncate" title={p.lesson_id}>
                          {p.lesson_id}
                        </p>
                        {p.course_id && <p className="text-[10px] text-gray-400">Cours : {p.course_id}</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-gray-500">{formatRelative(p.completed_at)}</p>
                      <p className="text-[10px] text-gray-400">{formatDateTime(p.completed_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.quiz_results.length > 0 && (
            <Card>
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Résultats quiz</h2>
              <div className="space-y-2">
                {data.quiz_results.map((q, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className="text-sm text-gray-700 font-mono">{q.quiz_id}</span>
                      <p className="text-[10px] text-gray-400">{formatRelative(q.completed_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${q.passed ? "text-green-600" : "text-red-500"}`}>{q.score}%</span>
                      <Badge variant={q.passed ? "success" : "error"}>
                        {q.passed ? "Validé" : "Échoué"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Notes de coaching</h2>

            <div className="mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Écrire une note pour cet élève…"
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 mb-2"
              />
              <Button variant="primary" size="sm" onClick={handleAddNote} disabled={saving || !noteText.trim()}>
                {saving ? "…" : "Ajouter la note"}
              </Button>
            </div>

            {data.notes.length > 0 ? (
              <div className="space-y-3">
                {data.notes.map((note) => (
                  <div key={note.id} className="bg-es-green/5 rounded-lg p-3 border border-es-green/10">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {formatRelative(note.created_at)} · {formatDateTime(note.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucune note</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
