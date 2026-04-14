"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface StudentData {
  profile: { id: string; full_name: string; role: string; created_at: string } | null;
  enrollments: Array<{ id: string; course_id: string; product_name: string; amount_paid: number; purchased_at: string }>;
  progress: Array<{ lesson_id: string; completed_at: string }>;
  quizResults: Array<{ quiz_id: string; score: number; passed: boolean; completed_at: string }>;
  notes: Array<{ id: string; content: string; created_at: string }>;
}

export default function StudentDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const [userId, setUserId] = useState("");
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setUserId(p.userId);
      fetchStudentData(p.userId);
    });
  }, [params]);

  async function fetchStudentData(uid: string) {
    const supabase = createClient();
    const [profileRes, enrollRes, progressRes, quizRes, notesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).single(),
      supabase.from("enrollments").select("*").eq("user_id", uid),
      supabase.from("progress").select("*").eq("user_id", uid),
      supabase.from("quiz_results").select("*").eq("user_id", uid),
      supabase.from("coaching_notes").select("*").eq("student_id", uid).order("created_at", { ascending: false }),
    ]);

    setData({
      profile: profileRes.data,
      enrollments: enrollRes.data || [],
      progress: progressRes.data || [],
      quizResults: quizRes.data || [],
      notes: notesRes.data || [],
    });
    setLoading(false);
  }

  async function handleAddNote() {
    if (!noteText.trim() || !userId) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("coaching_notes").insert({
      student_id: userId,
      author_id: user.id,
      content: noteText,
    });

    setNoteText("");
    setSaving(false);
    fetchStudentData(userId);
  }

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-64 bg-gray-100 rounded-xl" /></div>;
  }

  if (!data?.profile) {
    return <div className="text-center py-20 text-gray-400">Élève introuvable</div>;
  }

  const totalLessons = 64; // 14 modules × ~4-5 leçons
  const completedLessons = data.progress.length;

  return (
    <div>
      <div className="mb-8">
        <a href="/admin/eleves" className="text-sm text-gray-400 hover:text-es-green mb-2 inline-block">← Retour aux élèves</a>
        <h1 className="font-serif text-2xl font-bold text-gray-900">
          {data.profile.full_name || "Élève"}
        </h1>
        <p className="text-sm text-gray-500">Inscrit le {new Date(data.profile.created_at).toLocaleDateString("fr-FR")}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — info + progression */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enrollments */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Formations</h2>
            {data.enrollments.length > 0 ? (
              <div className="space-y-3">
                {data.enrollments.map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={e.product_name === "expert" ? "warning" : "success"}>
                        {e.product_name}
                      </Badge>
                      <span className="text-sm text-gray-700">{e.course_id}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{(e.amount_paid / 100).toLocaleString("fr-FR")}€</span>
                      <p className="text-[10px] text-gray-400">{new Date(e.purchased_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucune formation achetée</p>
            )}
          </Card>

          {/* Progression */}
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Progression</h2>
            <ProgressBar value={completedLessons} max={totalLessons} label={`${completedLessons} / ${totalLessons} leçons`} className="mb-4" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-es-green">{completedLessons}</div>
                <div className="text-[10px] text-gray-500">Leçons terminées</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">{data.quizResults.length}</div>
                <div className="text-[10px] text-gray-500">Quiz passés</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xl font-bold text-amber-600">
                  {data.quizResults.length > 0
                    ? Math.round(data.quizResults.reduce((s, q) => s + q.score, 0) / data.quizResults.length)
                    : 0}%
                </div>
                <div className="text-[10px] text-gray-500">Score moyen</div>
              </div>
            </div>
          </Card>

          {/* Quiz results */}
          {data.quizResults.length > 0 && (
            <Card>
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Résultats quiz</h2>
              <div className="space-y-2">
                {data.quizResults.map((q, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-700">{q.quiz_id}</span>
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

        {/* Right — coaching notes */}
        <div className="space-y-6">
          <Card>
            <h2 className="font-serif text-lg font-bold text-gray-900 mb-4">Notes de coaching</h2>

            {/* Add note */}
            <div className="mb-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Écrire une note pour cet élève..."
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-es-green/30 mb-2"
              />
              <Button variant="primary" size="sm" onClick={handleAddNote} disabled={saving || !noteText.trim()}>
                {saving ? "..." : "Ajouter la note"}
              </Button>
            </div>

            {/* Notes list */}
            {data.notes.length > 0 ? (
              <div className="space-y-3">
                {data.notes.map((note) => (
                  <div key={note.id} className="bg-es-green/5 rounded-lg p-3 border border-es-green/10">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(note.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
