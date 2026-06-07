import type { LessonContent } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { curriculumBadgeClass } from "@/components/LessonDetail";
import {
  Flame, Lightbulb, Activity, RefreshCw, GraduationCap,
  BookOpen, ClipboardList, HelpCircle, KeyRound, FileText, Inbox, Target, Award, CheckCircle2, Library,
} from "lucide-react";

type Props = {
  content?: LessonContent | null;
  loading?: boolean;
  meta?: {
    topic?: string;
    subject?: string;
    grade?: string;
    duration?: string;
  };
};

function SectionCard({
  icon: Icon, title, subtitle, children, breakBefore,
}: {
  icon: any; title: string; subtitle?: string;
  children: React.ReactNode; breakBefore?: boolean;
}) {
  return (
    <Card className={`print-section ${breakBefore ? "print-break-before" : ""}`}>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </CardHeader>
      <CardContent className="text-sm leading-relaxed text-foreground/90">{children}</CardContent>
    </Card>
  );
}

function TextBlock({ value, placeholder }: { value: string; placeholder: string }) {
  if (!value?.trim()) {
    return <p className="italic text-muted-foreground">{placeholder}</p>;
  }
  return <p className="whitespace-pre-wrap">{value}</p>;
}

function PlanItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <div className="mt-1">
        <TextBlock value={value} placeholder="—" />
      </div>
    </div>
  );
}

function BulletList({ icon: Icon, label, items }: { icon: any; label: string; items: string[] }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {items.map((it, i) => (
          <li key={i} className="whitespace-pre-wrap">{it}</li>
        ))}
      </ul>
    </div>
  );
}

export function LessonOutput({ content, loading = false, meta }: Props) {
  if (loading) {
    return (
      <div className="grid gap-4 no-print">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-40" />
            </CardHeader>
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

  if (!content) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No lesson to display yet</p>
          <p className="text-sm text-muted-foreground">
            Generate a lesson to see the plan, worksheet, quiz, and answer key here.
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    warmUp, keyConcepts, activity, recap, homework, worksheet, quizQuestions, worksheetAnswers,
    curriculum, learningObjectives, competencies, outcomes, curriculumReferences,
  } = content;
  const hasAlignment =
    !!curriculum ||
    (learningObjectives?.length ?? 0) > 0 ||
    (competencies?.length ?? 0) > 0 ||
    (outcomes?.length ?? 0) > 0 ||
    (curriculumReferences?.length ?? 0) > 0;
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="print-area grid gap-4">
      {meta && (
        <div className="hidden print:block print-section border-b pb-3 mb-2">
          <h1 className="text-2xl font-bold">{meta.topic || "Lesson"}</h1>
          <div className="mt-1 text-sm text-foreground/80 flex flex-wrap gap-x-4">
            {meta.subject && <span><strong>Subject:</strong> {meta.subject}</span>}
            {meta.grade && <span><strong>Grade:</strong> {meta.grade}</span>}
            {meta.duration && <span><strong>Duration:</strong> {meta.duration}</span>}
            <span><strong>Generated:</strong> {generatedDate}</span>
          </div>
        </div>
      )}
      {meta && (
        <div className="no-print flex flex-wrap gap-2">
          {meta.subject && <Badge variant="secondary">{meta.subject}</Badge>}
          {meta.grade && <Badge variant="outline">Grade {meta.grade}</Badge>}
          {meta.duration && <Badge variant="outline">{meta.duration}</Badge>}
          {curriculum && <Badge className={curriculumBadgeClass(curriculum)}>{curriculum}</Badge>}
        </div>
      )}
      {hasAlignment && (
        <SectionCard
          icon={GraduationCap}
          title="Curriculum Alignment"
          subtitle={curriculum ? `Aligned to ${curriculum}` : "Curriculum-aligned outcomes"}
        >
          <div className="grid gap-4">
            {(learningObjectives?.length ?? 0) > 0 && (
              <BulletList icon={Target} label="Learning Objectives" items={learningObjectives!} />
            )}
            {(competencies?.length ?? 0) > 0 && (
              <BulletList icon={Award} label="Competencies" items={competencies!} />
            )}
            {(outcomes?.length ?? 0) > 0 && (
              <BulletList icon={CheckCircle2} label="Outcomes" items={outcomes!} />
            )}
            {(curriculumReferences?.length ?? 0) > 0 && (
              <BulletList icon={Library} label="Curriculum References" items={curriculumReferences!} />
            )}
          </div>
        </SectionCard>
      )}
      <SectionCard icon={BookOpen} title="Lesson Plan" subtitle="Teacher-facing flow for the class period">
        <div className="grid gap-4">
          <PlanItem label="Warm-up" value={warmUp} />
          <PlanItem label="Key Concepts" value={keyConcepts} />
          <PlanItem label="Activity" value={activity} />
          <PlanItem label="Recap" value={recap} />
          <PlanItem label="Homework" value={homework} />
        </div>
      </SectionCard>

      <SectionCard
        icon={ClipboardList}
        title="Worksheet"
        subtitle="Student exercises to complete in class"
        breakBefore
      >
        {worksheet && worksheet.length > 0 ? (
          <ol className="list-decimal space-y-3 pl-5">
            {worksheet.map((item, i) => (
              <li key={i} className="pl-1">
                <p className="whitespace-pre-wrap">{item}</p>
                <div className="mt-2 space-y-2">
                  <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                  <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="space-y-3">
            <p className="italic text-muted-foreground">
              No worksheet items provided. Use the space below for student notes.
            </p>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-5 border-b border-dashed border-muted-foreground/40" />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={HelpCircle}
        title="Quiz"
        subtitle="Hand to students — answers are on the next page"
        breakBefore
      >
        {quizQuestions.length === 0 ? (
          <p className="italic text-muted-foreground">No quiz questions returned.</p>
        ) : (
          <ol className="list-decimal space-y-4 pl-5">
            {quizQuestions.map((q, i) => (
              <li key={i} className="pl-1">
                <p className="font-medium">{q.question}</p>
                <div className="mt-2 space-y-2">
                  <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                  <div className="h-5 border-b border-dashed border-muted-foreground/40" />
                </div>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <SectionCard
        icon={KeyRound}
        title="Answer Key"
        subtitle="Teacher reference — keep separate from student copies"
        breakBefore
      >
        {quizQuestions.length === 0 && (!worksheet || worksheet.length === 0) ? (
          <p className="italic text-muted-foreground">No answers available.</p>
        ) : (
          <div className="space-y-6">
            {worksheet && worksheet.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Worksheet Answers
                </p>
                <ol className="list-decimal space-y-3 pl-5">
                  {worksheet.map((q, i) => (
                    <li key={i} className="pl-1">
                      <p className="font-medium text-foreground whitespace-pre-wrap">{q}</p>
                      <p className="mt-1 text-foreground/80">
                        <span className="font-semibold text-primary">Answer: </span>
                        {worksheetAnswers?.[i]?.trim()
                          ? worksheetAnswers[i]
                          : <span className="italic text-muted-foreground">Not provided.</span>}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {quizQuestions.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Quiz Answers
                </p>
                <ol className="list-decimal space-y-3 pl-5">
                  {quizQuestions.map((q, i) => (
                    <li key={i} className="pl-1">
                      <p className="font-medium text-foreground whitespace-pre-wrap">{q.question}</p>
                      <p className="mt-1 text-foreground/80">
                        <span className="font-semibold text-primary">Answer: </span>
                        {q.answer?.trim() ? q.answer : <span className="italic text-muted-foreground">Not provided.</span>}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      <p className="no-print text-center text-xs text-muted-foreground">
        <FileText className="mr-1 inline h-3 w-3" />
        Tip: use your browser's Print to save as PDF — sections are formatted to break onto separate pages.
      </p>
    </div>
  );
}