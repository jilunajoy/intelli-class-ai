import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame, Lightbulb, Activity, GraduationCap,
  ClipboardList, HelpCircle, Plus, Trash2, Save, X,
} from "lucide-react";
import { parseLessonJson, type Lesson, type LessonJson } from "@/lib/supabase";

type Mcq = {
  question: string;
  options: string[];
  correct_answer?: string;
};

type EditorState = {
  warm_up: string;
  concept: string;
  activity: string;
  homework: string;
  worksheet: string[];
  mcqs: Mcq[];
};

function toEditorState(json: LessonJson | null): EditorState {
  const plan = json?.lesson_plan ?? {};
  return {
    warm_up: plan.warm_up ?? "",
    concept: plan.concept ?? "",
    activity: plan.activity ?? "",
    homework: plan.homework ?? "",
    worksheet: json?.worksheet?.questions ?? [],
    mcqs: (json?.quiz?.mcqs ?? []).map((m: any) => ({
      question: m?.question ?? "",
      options: Array.isArray(m?.options) ? [...m.options] : ["", "", "", ""],
      correct_answer: m?.correct_answer ?? m?.answer ?? m?.correct ?? "",
    })),
  };
}

function toLessonJson(state: EditorState, original: LessonJson | null): LessonJson {
  return {
    ...(original ?? {}),
    lesson_plan: {
      ...(original?.lesson_plan ?? {}),
      warm_up: state.warm_up,
      concept: state.concept,
      activity: state.activity,
      homework: state.homework,
    },
    worksheet: {
      ...(original?.worksheet ?? {}),
      questions: state.worksheet,
    },
    quiz: {
      ...(original?.quiz ?? {}),
      mcqs: state.mcqs.map((m) => ({
        question: m.question,
        options: m.options,
        correct_answer: m.correct_answer,
      })),
    },
    answer_key: original?.answer_key,
  };
}

function Section({
  icon: Icon, title, children,
}: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

type Props = {
  lesson: Lesson;
  saving?: boolean;
  onCancel: () => void;
  onSave: (next: LessonJson) => Promise<void> | void;
};

export function LessonEditor({ lesson, saving, onCancel, onSave }: Props) {
  const original = useMemo(() => parseLessonJson(lesson.lesson_json), [lesson]);
  const [state, setState] = useState<EditorState>(() => toEditorState(original));

  const setField = <K extends keyof EditorState>(k: K, v: EditorState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const updateWorksheet = (i: number, v: string) =>
    setField("worksheet", state.worksheet.map((q, idx) => (idx === i ? v : q)));
  const addWorksheet = () => setField("worksheet", [...state.worksheet, ""]);
  const removeWorksheet = (i: number) =>
    setField("worksheet", state.worksheet.filter((_, idx) => idx !== i));

  const updateMcq = (i: number, patch: Partial<Mcq>) =>
    setField("mcqs", state.mcqs.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const updateMcqOption = (i: number, j: number, v: string) =>
    setField(
      "mcqs",
      state.mcqs.map((m, idx) =>
        idx === i ? { ...m, options: m.options.map((o, k) => (k === j ? v : o)) } : m,
      ),
    );
  const addMcq = () =>
    setField("mcqs", [
      ...state.mcqs,
      { question: "", options: ["", "", "", ""], correct_answer: "" },
    ]);
  const removeMcq = (i: number) =>
    setField("mcqs", state.mcqs.filter((_, idx) => idx !== i));

  const handleSave = () => onSave(toLessonJson(state, original));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Flame} title="Warm-up">
          <Textarea
            value={state.warm_up}
            onChange={(e) => setField("warm_up", e.target.value)}
            placeholder="How will you hook students at the start?"
            className="min-h-32"
          />
        </Section>
        <Section icon={Lightbulb} title="Concept">
          <Textarea
            value={state.concept}
            onChange={(e) => setField("concept", e.target.value)}
            placeholder="Core concept explanation."
            className="min-h-32"
          />
        </Section>
        <Section icon={Activity} title="Activity">
          <Textarea
            value={state.activity}
            onChange={(e) => setField("activity", e.target.value)}
            placeholder="Hands-on or group activity instructions."
            className="min-h-32"
          />
        </Section>
        <Section icon={GraduationCap} title="Homework">
          <Textarea
            value={state.homework}
            onChange={(e) => setField("homework", e.target.value)}
            placeholder="Homework assignment."
            className="min-h-32"
          />
        </Section>
      </div>

      <Card>
        <CardContent className="p-4">
          <Tabs defaultValue="worksheet">
            <TabsList>
              <TabsTrigger value="worksheet">
                <ClipboardList className="mr-2 h-4 w-4" /> Worksheet
              </TabsTrigger>
              <TabsTrigger value="quiz">
                <HelpCircle className="mr-2 h-4 w-4" /> Quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent value="worksheet" className="space-y-3 pt-4">
              {state.worksheet.length === 0 && (
                <p className="text-sm italic text-muted-foreground">No worksheet questions yet.</p>
              )}
              {state.worksheet.map((q, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-2 w-6 text-sm font-semibold text-primary">{i + 1}.</span>
                  <Textarea
                    value={q}
                    onChange={(e) => updateWorksheet(i, e.target.value)}
                    placeholder={`Question ${i + 1}`}
                    className="min-h-20 flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeWorksheet(i)} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addWorksheet}>
                <Plus className="mr-1 h-4 w-4" /> Add question
              </Button>
            </TabsContent>

            <TabsContent value="quiz" className="space-y-4 pt-4">
              {state.mcqs.length === 0 && (
                <p className="text-sm italic text-muted-foreground">No quiz questions yet.</p>
              )}
              {state.mcqs.map((m, i) => (
                <Card key={i} className="border-dashed">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-2 w-6 text-sm font-semibold text-primary">Q{i + 1}</span>
                      <Textarea
                        value={m.question}
                        onChange={(e) => updateMcq(i, { question: e.target.value })}
                        placeholder="Question"
                        className="min-h-16 flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeMcq(i)} aria-label="Remove">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {m.options.map((opt, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="w-5 text-sm font-semibold text-primary">
                            {String.fromCharCode(65 + j)}.
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => updateMcqOption(i, j, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + j)}`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Correct answer
                      </label>
                      <Input
                        value={m.correct_answer ?? ""}
                        onChange={(e) => updateMcq(i, { correct_answer: e.target.value })}
                        placeholder="A, B, C, D or full text"
                        className="max-w-xs"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button variant="outline" size="sm" onClick={addMcq}>
                <Plus className="mr-1 h-4 w-4" /> Add question
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/80 py-3 backdrop-blur">
        <Button variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-1 h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}