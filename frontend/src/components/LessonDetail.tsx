import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Flame, Lightbulb, Activity, GraduationCap,
  ClipboardList, HelpCircle, KeyRound, AlertTriangle, Inbox, CheckCircle2,
  Library, Target, Award,
} from "lucide-react";
import { parseLessonJson, type Lesson } from "@/lib/supabase";

const CURRICULUM_BADGE: Record<string, string> = {
  NCERT: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
  CBSE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  ICSE: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  "State Board": "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
};

export function curriculumBadgeClass(name?: string | null) {
  if (!name) return "";
  return CURRICULUM_BADGE[name] ?? "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30";
}

type Props = {
  lesson?: Lesson | null;
  loading?: boolean;
  error?: string | null;
};

function SectionCard({
  icon: Icon, title, children,
}: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg flex-1">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-foreground/90">
        {children}
      </CardContent>
    </Card>
  );
}

function Empty({ icon: Icon, title, message }: { icon: any; title: string; message: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}

export function LessonDetail({ lesson, loading, error }: Props) {
  const data = useMemo(() => parseLessonJson(lesson?.lesson_json), [lesson]);

  if (loading) {
    return (
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3"><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <Empty icon={AlertTriangle} title="Couldn't load lesson" message={error} />;
  }

  if (!lesson) {
    return <Empty icon={Inbox} title="No lesson selected" message="Pick a lesson from the library to view its details." />;
  }

  if (!data) {
    return (
      <Empty
        icon={AlertTriangle}
        title="Lesson data is malformed"
        message="The lesson_json field is missing or could not be parsed."
      />
    );
  }

  const plan = data.lesson_plan ?? {};
  const worksheet = data.worksheet?.questions ?? [];
  const mcqs = data.quiz?.mcqs ?? [];
  const answers = data.answer_key?.answers ?? [];

  const curriculum = lesson.curriculum ?? data.curriculum ?? lesson.content?.curriculum ?? "";
  const outcomes = data.outcomes ?? data.learning_outcomes ?? lesson.content?.outcomes ?? [];
  const competencies = data.competencies ?? lesson.content?.competencies ?? [];
  const objectives = data.learning_objectives ?? lesson.content?.learningObjectives ?? [];
  const references = data.curriculum_references ?? lesson.content?.curriculumReferences ?? [];
  const hasAlignment =
    !!curriculum || outcomes.length > 0 || competencies.length > 0 || objectives.length > 0 || references.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {lesson.subject && <Badge variant="secondary">{lesson.subject}</Badge>}
        {lesson.grade && <Badge variant="outline">Grade {lesson.grade}</Badge>}
        {lesson.duration && <Badge variant="outline">{lesson.duration}</Badge>}
        {lesson.difficulty && <Badge variant="outline">{lesson.difficulty}</Badge>}
        {curriculum && (
          <Badge className={curriculumBadgeClass(curriculum)}>{curriculum}</Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard icon={Flame} title="Warm-up">
          {plan.warm_up ? <p className="whitespace-pre-wrap">{plan.warm_up}</p>
            : <p className="italic text-muted-foreground">No warm-up provided.</p>}
        </SectionCard>
        <SectionCard icon={Lightbulb} title="Concept">
          {plan.concept ? <p className="whitespace-pre-wrap">{plan.concept}</p>
            : <p className="italic text-muted-foreground">No concept provided.</p>}
        </SectionCard>
        <SectionCard icon={Activity} title="Activity">
          {plan.activity ? <p className="whitespace-pre-wrap">{plan.activity}</p>
            : <p className="italic text-muted-foreground">No activity provided.</p>}
        </SectionCard>
        <SectionCard icon={GraduationCap} title="Homework">
          {plan.homework ? <p className="whitespace-pre-wrap">{plan.homework}</p>
            : <p className="italic text-muted-foreground">No homework provided.</p>}
        </SectionCard>
      </div>

      {hasAlignment && (
        <SectionCard icon={Library} title="Curriculum Alignment">
          <div className="grid gap-4 md:grid-cols-2">
            {objectives.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3.5 w-3.5" /> Learning Objectives
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {objectives.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {outcomes.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Learning Outcomes
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {outcomes.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {competencies.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Award className="h-3.5 w-3.5" /> Competencies
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {competencies.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {references.length > 0 && (
              <div className="md:col-span-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">References</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {references.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </SectionCard>
      )}


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
              <TabsTrigger value="answers">
                <KeyRound className="mr-2 h-4 w-4" /> Answer Key
              </TabsTrigger>
            </TabsList>

            <TabsContent value="worksheet" className="pt-4">
              {worksheet.length === 0 ? (
                <p className="italic text-muted-foreground">No worksheet questions.</p>
              ) : (
                <ol className="list-decimal space-y-3 pl-5">
                  {worksheet.map((q, i) => (
                    <li key={i} className="pl-1">
                      <p className="whitespace-pre-wrap">{q}</p>
                      <div className="mt-2 space-y-2">
                        <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                        <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="quiz" className="pt-4">
              {mcqs.length === 0 ? (
                <p className="italic text-muted-foreground">No quiz questions.</p>
              ) : (
                <ol className="list-decimal space-y-4 pl-5">
                  {mcqs.map((q, i) => (
                    <li key={i} className="pl-1">
                      <p className="font-medium">{q?.question}</p>
                      {q?.options && q.options.length > 0 && (
                        <ul className="mt-2 space-y-1 pl-1">
                          {q.options.map((opt, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-foreground/80">
                              <span className="font-semibold text-primary">
                                {String.fromCharCode(65 + j)}.
                              </span>
                              <span>{opt}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </TabsContent>

            <TabsContent value="answers" className="pt-4">
              {answers.length === 0 && mcqs.length === 0 ? (
                <p className="italic text-muted-foreground">No answers available.</p>
              ) : (
                <div className="space-y-6">
                  {mcqs.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                        Quiz Answers
                      </p>
                      <ol className="list-decimal space-y-4 pl-5">
                        {mcqs.map((q, i) => (
                          <li key={i} className="pl-1">
                            <p className="text-sm font-medium text-foreground/90">{q?.question}</p>
                            <div className="mt-1.5 flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                {(() => {
                                  const correct =
                                    (q as any)?.correct_answer ??
                                    (q as any)?.answer ??
                                    q?.correct;
                                  if (!correct) return "Not provided";
                                  const idx = q?.options?.findIndex(
                                    (opt: string) => opt.toUpperCase() === correct.toUpperCase()
                                  );
                                  if (idx !== undefined && idx >= 0) {
                                    return `${String.fromCharCode(65 + idx)}. ${q?.options?.[idx]}`;
                                  }
                                  if (/^[A-D]$/i.test(correct)) {
                                    const optIdx = correct.toUpperCase().charCodeAt(0) - 65;
                                    if (q?.options?.[optIdx]) {
                                      return `${correct.toUpperCase()}. ${q?.options?.[optIdx]}`;
                                    }
                                  }
                                  return correct;
                                })()}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {answers.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                        Worksheet Answers
                      </p>
                      <ol className="list-decimal space-y-2 pl-5">
                        {answers.map((a, i) => (
                          <li key={i} className="pl-1 whitespace-pre-wrap text-sm text-foreground/90">{a}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
