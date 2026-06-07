import type { LessonContent } from "./supabase";

function toStrArr(v: any): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map((x) => (typeof x === "string" ? x : String(x?.text ?? x?.value ?? x?.name ?? JSON.stringify(x))));
  if (typeof v === "string") return v.split(/\r?\n|;|•/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export type GenerateLessonPayload = {
  subject: string;
  grade: string;
  topic: string;
  duration: string;
  objectives: string;
  difficulty?: string;
  language?: string;
  curriculum?: string;
  userId?: string;
  userEmail?: string;
};

/**
 * POST the lesson request to the configured n8n webhook.
 * The webhook is expected to return JSON shaped like LessonContent.
 */
export async function generateLessonViaN8n(
  payload: GenerateLessonPayload,
): Promise<LessonContent> {
  const url = import.meta.env.VITE_N8N_WEBHOOK_URL as string | undefined;
  if (!url) {
    throw new Error(
      "Lesson generation webhook is not configured. Set VITE_N8N_WEBHOOK_URL in your environment.",
    );
  }
  const GENERIC_ERROR = "Lesson generation failed. Please try again.";

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[n8n] network error", err);
    throw new Error(GENERIC_ERROR);
  }

  if (!res.ok) {
    console.error("[n8n] non-OK response", res.status);
    throw new Error(GENERIC_ERROR);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch (err) {
    console.error("[n8n] invalid JSON response", err);
    throw new Error(GENERIC_ERROR);
  }

  if (
    data == null ||
    (typeof data === "object" && !Array.isArray(data) && Object.keys(data as object).length === 0) ||
    (Array.isArray(data) && data.length === 0)
  ) {
    console.error("[n8n] empty response body");
    throw new Error(GENERIC_ERROR);
  }

  // Accept flat shape, { content: {...} }, or first element of an array.
  let raw: any = data;
  if (Array.isArray(raw)) raw = raw[0] ?? {};
  // Unwrap common envelopes: { content }, { lesson }, { data }, { result }.
  const c: any = raw?.content ?? raw?.lesson ?? raw?.data ?? raw?.result ?? raw ?? {};

  // Lesson plan may be nested under `lesson_plan` (snake_case from n8n).
  const plan: any = c.lesson_plan ?? c.lessonPlan ?? c.plan ?? c;

  // Worksheet may be an array, or { questions: [...] }, or { items: [...] }.
  const wsRaw = c.worksheet ?? plan.worksheet;
  const worksheet: string[] = Array.isArray(wsRaw)
    ? wsRaw
    : Array.isArray(wsRaw?.questions)
    ? wsRaw.questions
    : Array.isArray(wsRaw?.items)
    ? wsRaw.items
    : [];

  // Quiz may be `quizQuestions`, or `quiz.mcqs`, or `quiz.questions`.
  const quizRaw =
    c.quizQuestions ??
    c.quiz?.mcqs ??
    c.quiz?.questions ??
    (Array.isArray(c.quiz) ? c.quiz : []);

  // Answer key may live separately as { answers: [...] }.
  const answerKeyArr: string[] = Array.isArray(c.answer_key?.answers)
    ? c.answer_key.answers
    : Array.isArray(c.answerKey?.answers)
    ? c.answerKey.answers
    : Array.isArray(c.answers)
    ? c.answers
    : [];

  const quizQuestions = Array.isArray(quizRaw)
    ? quizRaw.map((q: any, i: number) => {
        const question: string = q?.question ?? q?.q ?? String(q ?? "");
        const options: string[] = Array.isArray(q?.options) ? q.options : [];
        const correct = q?.correct ?? q?.answer ?? q?.correct_answer;
        let answer = "";
        if (typeof correct === "string" && options.length) {
          // If `correct` is a letter like "B", resolve to that option's text.
          const letter = correct.trim().match(/^[A-Za-z]$/)?.[0]?.toUpperCase();
          if (letter) {
            const idx = letter.charCodeAt(0) - 65;
            answer = options[idx] ?? correct;
          } else {
            answer = correct;
          }
        } else if (typeof correct === "number" && options[correct]) {
          answer = options[correct];
        } else if (correct) {
          answer = String(correct);
        } else if (answerKeyArr[i]) {
          answer = answerKeyArr[i];
        }
        const fullQuestion = options.length
          ? `${question}\n${options.join("\n")}`
          : question;
        return { question: fullQuestion, answer };
      })
    : [];

  const result: LessonContent = {
    warmUp: plan.warmUp ?? plan.warm_up ?? "",
    keyConcepts: plan.keyConcepts ?? plan.key_concepts ?? plan.concept ?? plan.concepts ?? "",
    activity: plan.activity ?? "",
    recap: plan.recap ?? plan.summary ?? "",
    homework: plan.homework ?? "",
    worksheet: worksheet.filter(Boolean).map(String),
    worksheetAnswers: answerKeyArr.map(String),
    quizQuestions,
    curriculum:
      c.curriculum ?? plan.curriculum ?? c.curriculum_name ?? plan.curriculum_name ?? "",
    learningObjectives: toStrArr(
      plan.learning_objectives ?? plan.learningObjectives ?? c.learning_objectives ?? c.learningObjectives,
    ),
    competencies: toStrArr(
      plan.competencies ?? c.competencies ?? plan.competency ?? c.competency,
    ),
    outcomes: toStrArr(
      plan.outcomes ?? c.outcomes ?? plan.learning_outcomes ?? c.learning_outcomes,
    ),
    curriculumReferences: toStrArr(
      plan.curriculum_references ??
        plan.curriculumReferences ??
        c.curriculum_references ??
        c.curriculumReferences ??
        c.references,
    ),
  };

  const hasAnyContent =
    !!result.warmUp ||
    !!result.keyConcepts ||
    !!result.activity ||
    !!result.recap ||
    !!result.homework ||
    result.worksheet.length > 0 ||
    result.quizQuestions.length > 0 ||
    (result.learningObjectives?.length ?? 0) > 0 ||
    (result.competencies?.length ?? 0) > 0 ||
    (result.outcomes?.length ?? 0) > 0;

  if (!hasAnyContent) {
    console.error("[n8n] response had no recognizable lesson fields", data);
    throw new Error(GENERIC_ERROR);
  }

  return result;
}