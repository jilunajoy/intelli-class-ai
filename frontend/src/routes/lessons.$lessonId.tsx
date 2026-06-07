import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LessonDetail } from "@/components/LessonDetail";
import { LessonEditor } from "@/components/LessonEditor";
import { deleteLesson, getLesson, updateLessonJson } from "@/lib/lessons";
import type { Lesson, LessonJson } from "@/lib/supabase";
import { ArrowLeft, Pencil, Trash2, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-context";

export const Route = createFileRoute("/lessons/$lessonId")({
  component: () => <ProtectedLayout><LessonPage /></ProtectedLayout>,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { refresh: refreshProfile } = useProfile();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getLesson(lessonId)
      .then((l) => setLesson(l))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const goBack = () => navigate({ to: "/library" });

  const handleDelete = async () => {
    if (!lesson) return;
    if (!confirm("Delete this lesson? This cannot be undone.")) return;
    try {
      await deleteLesson(lesson.id);
      refreshProfile();
      toast.success("Lesson deleted");
      goBack();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handlePrint = () => window.print();

  const handleEdit = () => setEditing(true);

  const handleSave = async (next: LessonJson) => {
    if (!lesson) return;
    setSaving(true);
    try {
      const updated = await updateLessonJson(lesson.id, next, lesson.version ?? 0);
      setLesson(updated);
      setEditing(false);
      refreshProfile();
      toast.success("Lesson updated");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = () => {
    if (!lesson) {
      navigate({ to: "/generate" });
      return;
    }
    navigate({
      to: "/generate",
      search: {
        lessonId: lesson.id,
        subject: lesson.subject ?? undefined,
        grade: lesson.grade ?? undefined,
        topic: lesson.topic ?? undefined,
        duration: lesson.duration ?? undefined,
        objectives: lesson.objectives ?? undefined,
        difficulty: lesson.difficulty ?? undefined,
        language: lesson.language ?? undefined,
        curriculum: lesson.curriculum ?? lesson.content?.curriculum ?? undefined,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Library
        </Button>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <Button variant="outline" size="sm" onClick={handleEdit} disabled={!lesson}>
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            <RefreshCw className="mr-1 h-4 w-4" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" /> Print
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">
          {lesson?.title || (loading ? "Loading…" : "Lesson")}
        </h1>
        {lesson?.topic && (
          <p className="mt-1 text-sm text-muted-foreground">{lesson.topic}</p>
        )}
        {lesson?.version != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            Version {lesson.version}
            {lesson.last_modified
              ? ` · Last modified ${new Date(lesson.last_modified).toLocaleString()}`
              : ""}
          </p>
        )}
      </header>

      {error ? (
        <Card><CardContent className="p-6 text-sm">
          <p className="font-medium">Couldn't load lesson</p>
          <p className="text-muted-foreground">{error}</p>
        </CardContent></Card>
      ) : editing && lesson ? (
        <LessonEditor
          lesson={lesson}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
        />
      ) : (
        <LessonDetail
          lesson={lesson}
          loading={loading}
        />
      )}
    </div>
  );
}