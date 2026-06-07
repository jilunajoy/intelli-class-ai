import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { countLessons, getProfile, syncProfileLessonCount, upsertProfile, type Profile } from "./profiles";

type ProfileCtx = {
  profile: Profile | null;
  totalLessons: number;
  lessonsVersion: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  bumpLessons: (delta?: number) => void;
  updateFullName: (full_name: string) => Promise<void>;
};

const Ctx = createContext<ProfileCtx | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [lessonsVersion, setLessonsVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setTotalLessons(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Always compute live count from lessons table — it's the source of truth.
      // Sync the profiles row so total_lessons stays accurate.
      const [existing, liveCount] = await Promise.all([
        getProfile(user.id),
        countLessons(user.id),
      ]);
      setTotalLessons(liveCount);
      setLessonsVersion((v) => v + 1);

      let row = existing;
      // Create the profile row on first load, or update stale counter.
      if (!row || row.total_lessons !== liveCount || (!row.email && user.email)) {
        try {
          row = await upsertProfile({
            id: user.id,
            email: user.email ?? null,
            full_name: row?.full_name ?? null,
            total_lessons: liveCount,
          });
        } catch (e) {
          // Non-fatal: still show what we have.
          console.warn("profile upsert failed", e);
        }
      }
      setProfile(row);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const bumpLessons = useCallback((delta = 1) => {
    setTotalLessons((n) => Math.max(0, n + delta));
    setLessonsVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateFullName = useCallback(
    async (full_name: string) => {
      if (!user) return;
      const row = await upsertProfile({ id: user.id, full_name, email: user.email ?? null });
      setProfile((p) => ({ ...(p ?? row), ...row }));
    },
    [user],
  );

  const value: ProfileCtx = {
    profile,
    totalLessons,
    lessonsVersion,
    loading,
    error,
    refresh,
    bumpLessons,
    updateFullName,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProfile() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProfile must be used inside ProfileProvider");
  return v;
}

export { syncProfileLessonCount };