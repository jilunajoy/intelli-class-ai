import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth-context";
import { deleteLesson, listLessons, toggleFavorite } from "@/lib/lessons";
import type { Lesson } from "@/lib/supabase";
import { parseLessonJson } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Trash2, BookOpen, Search, X, Star } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-context";
import { cn } from "@/lib/utils";
import { curriculumBadgeClass } from "@/components/LessonDetail";

function getCurriculum(l: Lesson): string | undefined {
  return l.curriculum || l.content?.curriculum || parseLessonJson(l.lesson_json)?.curriculum;
}

export const Route = createFileRoute("/library")({
  component: () => <ProtectedLayout><Library /></ProtectedLayout>,
});

function Library() {
  const { user } = useAuth();
  const { refresh: refreshProfile, lessonsVersion } = useProfile();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState<string>("all");
  const [grade, setGrade] = useState<string>("all");
  const [difficulty, setDifficulty] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [curriculum, setCurriculum] = useState<string>("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    if (!user) return;
    setLessons(null);
    setError(null);
    listLessons(user.id).then(setLessons).catch((e) => { setError(e.message); setLessons([]); });
  };

  useEffect(load, [user, lessonsVersion]);

  const subjects = useMemo(
    () => Array.from(new Set((lessons ?? []).map((l) => l.subject ?? ""))).filter(Boolean) as string[],
    [lessons],
  );
  const grades = useMemo(
    () => Array.from(new Set((lessons ?? []).map((l) => l.grade ?? ""))).filter(Boolean) as string[],
    [lessons],
  );

  const difficulties = useMemo(
    () => Array.from(new Set((lessons ?? []).map((l) => l.difficulty ?? ""))).filter(Boolean) as string[],
    [lessons],
  );
  const languages = useMemo(
    () => Array.from(new Set((lessons ?? []).map((l) => l.language ?? ""))).filter(Boolean) as string[],
    [lessons],
  );
  const curricula = useMemo(
    () => Array.from(new Set((lessons ?? []).map((l) => getCurriculum(l) ?? ""))).filter(Boolean) as string[],
    [lessons],
  );

  const hasActiveFilters =
    query.length > 0 ||
    subject !== "all" ||
    grade !== "all" ||
    difficulty !== "all" ||
    language !== "all" ||
    curriculum !== "all" ||
    favoritesOnly;

  const filtered = (lessons ?? []).filter((l) => {
    const q = query.toLowerCase().trim();
    if (
      q &&
      !(
        l.title?.toLowerCase().includes(q) ||
        l.topic?.toLowerCase().includes(q) ||
        l.subject?.toLowerCase().includes(q) ||
        l.grade?.toLowerCase().includes(q)
      )
    )
      return false;
    if (subject !== "all" && l.subject !== subject) return false;
    if (grade !== "all" && l.grade !== grade) return false;
    if (difficulty !== "all" && l.difficulty !== difficulty) return false;
    if (language !== "all" && l.language !== language) return false;
    if (curriculum !== "all" && (getCurriculum(l) ?? "") !== curriculum) return false;
    if (favoritesOnly && !l.is_favorite) return false;
    return true;
  });

  const handleClear = () => {
    setQuery("");
    setSubject("all");
    setGrade("all");
    setDifficulty("all");
    setLanguage("all");
    setCurriculum("all");
    setFavoritesOnly(false);
  };

  const handleToggleFavorite = async (l: Lesson) => {
    const next = !l.is_favorite;
    setLessons((prev) =>
      prev?.map((x) => (x.id === l.id ? { ...x, is_favorite: next } : x)) ?? null,
    );
    try {
      await toggleFavorite(l.id, next);
      toast.success(next ? "Added to favorites" : "Removed from favorites");
    } catch (e: any) {
      setLessons((prev) =>
        prev?.map((x) => (x.id === l.id ? { ...x, is_favorite: !next } : x)) ?? null,
      );
      toast.error(e.message || "Failed to update favorite");
    }
  };

  const openDeleteDialog = (l: Lesson) => setLessonToDelete(l);

  const confirmDelete = async () => {
    if (!lessonToDelete) return;
    setIsDeleting(true);
    try {
      await deleteLesson(lessonToDelete.id);
      setLessons((prev) => prev?.filter((x) => x.id !== lessonToDelete.id) ?? null);
      refreshProfile();
      toast.success("Lesson deleted");
    } catch (e: any) {
      toast.error(e.message || "Failed to delete lesson");
    } finally {
      setIsDeleting(false);
      setLessonToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Lesson Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Search, filter, and revisit lessons you've saved.</p>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:flex-wrap md:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, subject, or grade…"
              className="pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Subject" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="md:w-32"><SelectValue placeholder="Grade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All grades</SelectItem>
              {grades.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Difficulty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All difficulties</SelectItem>
              {difficulties.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="md:w-36"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {languages.map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={curriculum} onValueChange={setCurriculum}>
            <SelectTrigger className="md:w-40"><SelectValue placeholder="Curriculum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All curricula</SelectItem>
              {["NCERT", "CBSE", "ICSE", "State Board", ...curricula.filter((c) => !["NCERT","CBSE","ICSE","State Board"].includes(c))].map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={favoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setFavoritesOnly((v) => !v)}
            className="shrink-0"
          >
            <Star className={cn("h-4 w-4 mr-1", favoritesOnly && "fill-current")} />
            Favorites
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className={cn("shrink-0", !hasActiveFilters && "opacity-0 pointer-events-none")}
          >
            <X className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </CardContent>
      </Card>

      {lessons !== null && !error && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {hasActiveFilters && (
              <span className="text-muted-foreground/70"> of {lessons.length}</span>
            )}
          </p>
          {hasActiveFilters && (
            <Button variant="link" size="sm" className="h-auto p-0" onClick={handleClear}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      {lessons === null ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : error ? (
        <Card><CardContent className="p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Couldn't load lessons</p>
          <p>{error}</p>
          <p className="mt-2 text-xs">Ensure the <code className="rounded bg-muted px-1">lessons</code> table exists in Supabase.</p>
        </CardContent></Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 font-medium">{lessons.length === 0 ? "No lessons saved yet" : "No lessons match your search"}</p>
            <p className="text-sm text-muted-foreground">{lessons.length === 0 ? "Generate and save your first lesson." : "Try adjusting your search or filters."}</p>
            {hasActiveFilters && lessons.length > 0 && (
              <Button variant="outline" size="sm" className="mt-4" onClick={handleClear}>
                Clear search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <Card key={l.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-base">{l.title || `${l.subject} — ${l.topic}`}</CardTitle>
                  <button
                    type="button"
                    onClick={() => handleToggleFavorite(l)}
                    aria-label={l.is_favorite ? "Remove from favorites" : "Add to favorites"}
                    className={cn(
                      "shrink-0 rounded-md p-1 transition-colors",
                      l.is_favorite
                        ? "text-amber-500 hover:text-amber-600"
                        : "text-muted-foreground hover:text-amber-500",
                    )}
                  >
                    <Star className={cn("h-5 w-5", l.is_favorite && "fill-current")} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 pt-2">
                  {l.subject && <Badge variant="secondary">{l.subject}</Badge>}
                  {l.grade && <Badge variant="outline">Grade {l.grade}</Badge>}
                  {(() => {
                    const c = getCurriculum(l);
                    return c ? (
                      <Badge className={curriculumBadgeClass(c)}>{c}</Badge>
                    ) : null;
                  })()}
                  
                  {l.is_favorite && (
                    <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/20 border-amber-500/30">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Favorite
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/lessons/$lessonId", params: { lessonId: l.id } })}><Eye className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(l)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Delete Lesson</AlertDialogTitle>
                        <AlertDialogDescription>
                          Delete this lesson permanently? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setLessonToDelete(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={confirmDelete}
                          disabled={isDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? "Deleting…" : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}