import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth-context";
import { listLessons } from "@/lib/lessons";
import type { Lesson } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Sparkles,
  Library,
  Plus,
  CalendarDays,
  GraduationCap,
  Layers,
  Clock,
  TrendingUp,
} from "lucide-react";
import { useProfile } from "@/lib/profile-context";

export const Route = createFileRoute("/dashboard")({ component: () => <ProtectedLayout><Dashboard /></ProtectedLayout> });

function Dashboard() {
  const { user } = useAuth();
  const { profile, totalLessons, lessonsVersion, loading: profileLoading } = useProfile();
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listLessons(user.id)
      .then(setLessons)
      .catch((e) => {
        setError(e.message ?? "Failed to load lessons");
        setLessons([]);
      });
  }, [user, lessonsVersion]);

  const greeting =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Educator";

  // Teacher KPI computations
  const stats = useMemo(() => {
    if (!lessons || lessons.length === 0) {
      return {
        totalLessons: 0,
        lessonsThisMonth: 0,
        mostUsedSubject: "—",
        mostUsedGrade: "—",
        lastGenerated: null,
      };
    }

    // Total lessons
    const totalLessons = lessons.length;

    // Lessons this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lessonsThisMonth = lessons.filter((l) => {
      const d = new Date(l.created_at);
      return d >= startOfMonth;
    }).length;

    // Most used subject
    const subjectCounts: Record<string, number> = {};
    lessons.forEach((l) => {
      const s = l.subject?.trim();
      if (s) subjectCounts[s] = (subjectCounts[s] || 0) + 1;
    });
    const mostUsedSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Most used grade
    const gradeCounts: Record<string, number> = {};
    lessons.forEach((l) => {
      const g = l.grade?.trim();
      if (g) gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    });
    const mostUsedGrade = Object.entries(gradeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

    // Last generated lesson
    const lastGenerated = lessons.length > 0 ? lessons[0] : null;

    return { totalLessons, lessonsThisMonth, mostUsedSubject, mostUsedGrade, lastGenerated };
  }, [lessons]);

  const isLoading = lessons === null || (profileLoading && lessons === null);

  return (
    <div className="space-y-8">
      <header
        className="flex flex-wrap items-end justify-between gap-4 rounded-2xl p-6 text-primary-foreground md:p-8"
        style={{ background: "var(--gradient-header)" }}
      >
        <div>
          <p className="text-sm/none opacity-80">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hi, {greeting} 👋</h1>
          <p className="mt-2 text-sm opacity-80">Here's a snapshot of your teaching workspace.</p>
        </div>
        <Link to="/generate">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />New lesson
          </Button>
        </Link>
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total Lessons"
          value={isLoading ? "…" : stats.totalLessons}
          icon={BookOpen}
          color="bg-primary/10 text-primary"
        />
        <KpiCard
          label="This Month"
          value={isLoading ? "…" : stats.lessonsThisMonth}
          icon={CalendarDays}
          color="bg-support/20 text-support-foreground"
          accent
        />
        <KpiCard
          label="Top Subject"
          value={isLoading ? "…" : stats.mostUsedSubject}
          icon={GraduationCap}
          color="bg-secondary/10 text-secondary"
          smallValue
        />
        <KpiCard
          label="Top Grade"
          value={isLoading ? "…" : stats.mostUsedGrade}
          icon={Layers}
          color="bg-accent/10 text-accent"
          smallValue
        />
        <KpiCard
          label="Last Generated"
          value={
            isLoading
              ? "…"
              : stats.lastGenerated
                ? new Date(stats.lastGenerated.created_at).toLocaleDateString()
                : "—"
          }
          subValue={stats.lastGenerated ? (stats.lastGenerated.title || `${stats.lastGenerated.subject} — ${stats.lastGenerated.topic}`) : undefined}
          icon={Clock}
          color="bg-chart-5/15 text-chart-5"
          smallValue
        />
      </div>

      {/* Quick trend line */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-accent" />
            <span>
              {isLoading ? (
                "Loading activity…"
              ) : stats.totalLessons === 0 ? (
                "Start generating lessons to see your activity here."
              ) : (
                <>
                  You&apos;ve created <strong className="text-foreground">{stats.totalLessons}</strong> lesson{stats.totalLessons !== 1 ? "s" : ""} so far,
                  with <strong className="text-foreground">{stats.lessonsThisMonth}</strong> this month.
                  {stats.mostUsedSubject !== "—" && (
                    <> Most lessons are in <strong className="text-foreground">{stats.mostUsedSubject}</strong>.</>
                  )}
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent lessons</CardTitle>
          <Link to="/library" className="text-sm text-muted-foreground hover:text-foreground">View all</Link>
        </CardHeader>
        <CardContent>
          {lessons === null ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : error ? (
            <EmptyError message={error} />
          ) : lessons.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y">
              {lessons.slice(0, 5).map((l) => (
                <li key={l.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{l.title || `${l.subject} — ${l.topic}`}</p>
                    <p className="text-xs text-muted-foreground">{l.subject} · Grade {l.grade} · {new Date(l.created_at).toLocaleDateString()}</p>
                  </div>
                  <Link to="/library"><Button variant="ghost" size="sm">Open</Button></Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickAction
          title="Generate a new lesson"
          desc="Plan a complete classroom-ready lesson kit in seconds."
          to="/generate"
          icon={Sparkles}
        />
        <QuickAction
          title="Browse your library"
          desc="Find, edit, and reuse lessons you've saved."
          to="/library"
          icon={Library}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subValue,
  icon: Icon,
  color,
  accent,
  smallValue,
}: {
  label: string;
  value: React.ReactNode;
  subValue?: string;
  icon: React.ElementType;
  color: string;
  accent?: boolean;
  smallValue?: boolean;
}) {
  return (
    <Card className={accent ? "border-support/30" : undefined}>
      <CardContent className="flex items-start justify-between p-5">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={smallValue ? "mt-1 truncate text-sm font-semibold" : "mt-1 text-2xl font-semibold"}>
            {value ?? "—"}
          </p>
          {subValue && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground" title={subValue}>
              {subValue}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ title, desc, to, icon: Icon }: { title: string; desc: string; to: string; icon: any }) {
  return (
    <Link to={to}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <BookOpen className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="mt-3 font-medium">No lessons yet</p>
      <p className="text-sm text-muted-foreground">Generate your first lesson kit to get started.</p>
      <Link to="/generate" className="mt-4"><Button size="sm">Generate lesson</Button></Link>
    </div>
  );
}

function EmptyError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Couldn't load lessons</p>
      <p className="mt-1">{message}</p>
      <p className="mt-2 text-xs">Make sure the <code className="rounded bg-muted px-1">lessons</code> table exists in your Supabase project (see <code>src/lib/lessons.ts</code> for schema).</p>
    </div>
  );
}
