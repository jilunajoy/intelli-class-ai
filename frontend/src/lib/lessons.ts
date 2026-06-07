import { supabase, type Lesson } from "./supabase";

/**
 * The app expects a `lessons` table in your Supabase project with the
 * following schema. RLS should restrict rows to `auth.uid() = user_id`.
 *
 *   id           uuid    primary key default gen_random_uuid()
 *   user_id      uuid    references auth.users(id) on delete cascade
 *   title        text
 *   subject      text
 *   grade        text
 *   topic        text
 *   duration     text
 *   objectives   text
 *   difficulty   text
 *   language     text
 *   curriculum   text
 *   content      jsonb
 *   created_at   timestamptz default now()
 */

export async function listLessons(userId: string): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lesson[];
}

export async function getLesson(id: string): Promise<Lesson | null> {
  const { data, error } = await supabase.from("lessons").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Lesson) ?? null;
}

export async function saveLesson(lesson: Omit<Lesson, "id" | "created_at">): Promise<Lesson> {
  const { data, error } = await supabase.from("lessons").insert(lesson).select().single();
  if (error) throw error;
  return data as Lesson;
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleFavorite(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from("lessons")
    .update({ is_favorite: value })
    .eq("id", id);
  if (error) throw error;
}

export async function updateLessonJson(
  id: string,
  lesson_json: unknown,
  currentVersion?: number | null,
): Promise<Lesson> {
  const payload: Record<string, unknown> = {
    lesson_json,
    last_modified: new Date().toISOString(),
    version: (currentVersion ?? 0) + 1,
  };
  const { data, error } = await supabase
    .from("lessons")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Lesson;
}