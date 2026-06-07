import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Strip any trailing /rest/v1/ if accidentally included.
const cleanUrl = url?.replace(/\/rest\/v1\/?$/, "");

export const supabase = createClient(cleanUrl, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export type LessonContent = {
  warmUp: string;
  keyConcepts: string;
  activity: string;
  recap: string;
  homework: string;
  worksheet: Array<string>;
  worksheetAnswers?: Array<string>;
  quizQuestions: Array<{ question: string; answer?: string }>;
  curriculum?: string;
  learningObjectives?: Array<string>;
  competencies?: Array<string>;
  outcomes?: Array<string>;
  curriculumReferences?: Array<string>;
};

export type Lesson = {
  id: string;
  user_id: string | null;
  title?: string | null;
  subject?: string | null;
  grade?: string | null;
  topic?: string | null;
  duration?: string | null;
  objectives?: string | null;
  difficulty?: string;
  language?: string;
  curriculum?: string | null;
  content?: LessonContent | null;
  lesson_json?: string | LessonJson | null;
  created_at: string;
  last_modified?: string | null;
  version?: number | null;
  is_favorite?: boolean | null;
};

export type LessonJson = {
  lesson_plan?: {
    warm_up?: string;
    concept?: string;
    activity?: string;
    homework?: string;
  };
  worksheet?: { questions?: string[] };
  quiz?: {
    mcqs?: Array<{
      question: string;
      options?: string[];
      correct?: string;
      correct_answer?: string;
      answer?: string;
    }>;
  };
  answer_key?: { answers?: string[] };
  curriculum?: string;
  learning_outcomes?: string[];
  outcomes?: string[];
  competencies?: string[];
  learning_objectives?: string[];
  curriculum_references?: string[];
};

export function parseLessonJson(raw: unknown): LessonJson | null {
  if (!raw) return null;
  try {
    return typeof raw === "string" ? (JSON.parse(raw) as LessonJson) : (raw as LessonJson);
  } catch {
    return null;
  }
}