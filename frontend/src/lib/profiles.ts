import { supabase } from "./supabase";

/**
 * Expected `profiles` table schema (RLS scoped to auth.uid() = id):
 *   id            uuid primary key references auth.users(id) on delete cascade
 *   full_name     text
 *   email         text
 *   total_lessons int  default 0
 *   created_at    timestamptz default now()
 */
export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  total_lessons: number | null;
  created_at: string | null;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function countLessons(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("lessons")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function upsertProfile(input: {
  id: string;
  email?: string | null;
  full_name?: string | null;
  total_lessons?: number;
}): Promise<Profile> {
  const payload: Record<string, unknown> = { id: input.id };
  if (input.email !== undefined) payload.email = input.email;
  if (input.full_name !== undefined) payload.full_name = input.full_name;
  if (input.total_lessons !== undefined) payload.total_lessons = input.total_lessons;
  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Recompute total_lessons from the lessons table and persist to profiles. */
export async function syncProfileLessonCount(
  userId: string,
  email?: string | null,
): Promise<Profile> {
  const total = await countLessons(userId);
  return upsertProfile({ id: userId, email: email ?? undefined, total_lessons: total });
}