import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, Save, RefreshCw, FileDown } from "lucide-react";
import { toast } from "sonner";
import { generateLessonViaN8n, type GenerateLessonPayload } from "@/lib/n8n";
import type { Lesson, LessonContent } from "@/lib/supabase";
import { LessonOutput } from "@/components/LessonOutput";
import { LessonDetail } from "@/components/LessonDetail";
import { useAuth } from "@/lib/auth-context";
import { saveLesson, getLesson } from "@/lib/lessons";
import { useProfile } from "@/lib/profile-context";

export const Route = createFileRoute("/generate")({
  validateSearch: (search: Record<string, unknown>) => ({
    lessonId: typeof search.lessonId === "string" ? search.lessonId : undefined,
    subject: typeof search.subject === "string" ? search.subject : undefined,
    grade: typeof search.grade === "string" ? search.grade : undefined,
    topic: typeof search.topic === "string" ? search.topic : undefined,
    duration: typeof search.duration === "string" ? search.duration : undefined,
    objectives: typeof search.objectives === "string" ? search.objectives : undefined,
    difficulty: typeof search.difficulty === "string" ? search.difficulty : undefined,
    language: typeof search.language === "string" ? search.language : undefined,
    curriculum: typeof search.curriculum === "string" ? search.curriculum : undefined,
  }),
  component: () => <ProtectedLayout><GeneratePage /></ProtectedLayout>,
});

const SUBJECTS = ["Mathematics", "Science", "English", "History", "Geography", "Computer Science", "Art", "Music", "Physical Education"];
const GRADES = ["KG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const DURATIONS = ["15 minutes", "30 minutes", "45 minutes", "60 minutes", "90 minutes"];
const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Spanish", "French", "German", "Hindi", "Mandarin", "Arabic"];
const CURRICULA = ["NCERT", "ICSE", "CBSE", "State Board"];

function GeneratePage() {
  const { user } = useAuth();
  const { refresh: refreshProfile, bumpLessons } = useProfile();
  const search = Route.useSearch();
  const [form, setForm] = useState<GenerateLessonPayload>({
    subject: search.subject ?? "",
    grade: search.grade ?? "",
    topic: search.topic ?? "",
    duration: search.duration ?? "",
    objectives: search.objectives ?? "",
    difficulty: search.difficulty ?? "",
    language: search.language ?? "English",
    curriculum: search.curriculum ?? "NCERT",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LessonContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingLesson, setExistingLesson] = useState<Lesson | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!search.lessonId) {
      setExistingLesson(null);
      return;
    }
    setLoadingExisting(true);
    getLesson(search.lessonId)
      .then((l) => setExistingLesson(l))
      .catch((e) => toast.error(e?.message ?? "Failed to load lesson"))
      .finally(() => setLoadingExisting(false));
  }, [search.lessonId]);

  const set = <K extends keyof GenerateLessonPayload>(k: K, v: GenerateLessonPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!form.subject || !form.grade || !form.topic || !form.duration || !form.objectives) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const content = await generateLessonViaN8n({
        ...form,
        userId: user?.id,
        userEmail: user?.email,
      });
      setResult(content);
      toast.success("Lesson generated");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to generate lesson");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      await saveLesson({
        user_id: user.id,
        title: `${form.subject} — ${form.topic}`,
        subject: form.subject,
        grade: form.grade,
        topic: form.topic,
        duration: form.duration,
        objectives: form.objectives,
        difficulty: form.difficulty,
        language: form.language,
        curriculum: form.curriculum,
        content: { ...result, curriculum: result.curriculum || form.curriculum },
      });
      // Optimistic UI: bump count + lessonsVersion so dashboard/library refetch immediately.
      bumpLessons(1);
      // Then sync with server (recomputes total_lessons from lessons table).
      refreshProfile();
      toast.success("Lesson saved to your library");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Generate Lesson</h1>
        <p className="mt-1 text-sm text-muted-foreground">Describe your class and let AI draft a complete lesson kit.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-lg">Lesson details</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={form.subject} onValueChange={(v) => set("subject", v)}>
                  <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Grade</Label>
                  <Select value={form.grade} onValueChange={(v) => set("grade", v)}>
                    <SelectTrigger><SelectValue placeholder="Grade" /></SelectTrigger>
                    <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={form.duration} onValueChange={(v) => set("duration", v)}>
                    <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                    <SelectContent>{DURATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input id="topic" value={form.topic} onChange={(e) => set("topic", e.target.value)} placeholder="e.g. Photosynthesis" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea id="objectives" rows={4} value={form.objectives} onChange={(e) => set("objectives", e.target.value)} placeholder="What should students be able to do by the end?" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>{DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={(v) => set("language", v)}>
                    <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                    <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Curriculum</Label>
                <Select value={form.curriculum} onValueChange={(v) => set("curriculum", v)}>
                  <SelectTrigger><SelectValue placeholder="Select curriculum" /></SelectTrigger>
                  <SelectContent>{CURRICULA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Lesson will be aligned to this curriculum with objectives, competencies, outcomes, and references.
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</> : <><Sparkles className="mr-2 h-4 w-4" />Generate Lesson</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div>
          {(existingLesson || loadingExisting) && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">
                  Existing lesson{existingLesson?.title ? ` — ${existingLesson.title}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LessonDetail
                  lesson={existingLesson}
                  loading={loadingExisting}
                />
              </CardContent>
            </Card>
          )}
          {result && !loading && (
            <div className="no-print mb-4 flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving} variant="default">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
              </Button>
              <Button onClick={() => submit()} variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Regenerate</Button>
              <Button onClick={() => window.print()} variant="outline"><FileDown className="mr-2 h-4 w-4" />Download PDF</Button>
            </div>
          )}
          <LessonOutput
            content={result}
            loading={loading}
            meta={{ topic: form.topic, subject: form.subject, grade: form.grade, duration: form.duration }}
          />
        </div>
      </div>
    </div>
  );
}