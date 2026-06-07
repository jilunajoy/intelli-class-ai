import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Sparkles, BookOpen, Clock, Layers, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

const FEATURES = [
  { icon: Sparkles, title: "AI Lesson Kits", desc: "Generate full lesson plans, activities, and quizzes in seconds." },
  { icon: Layers, title: "Aligned to Your Curriculum", desc: "Specify subject, grade, duration, and objectives — get tailored output." },
  { icon: BookOpen, title: "Reusable Library", desc: "Save, search, and revisit every lesson you create." },
  { icon: Clock, title: "Save Hours Weekly", desc: "Cut planning time so you can focus on teaching." },
  { icon: ShieldCheck, title: "Private & Secure", desc: "Your account and lessons are protected end-to-end." },
  { icon: GraduationCap, title: "Built for Educators", desc: "Designed with teachers — minimal, focused, classroom-ready." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-semibold">IntelliClass AI</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
        <span className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3 w-3" /> AI-powered lesson planning
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-6xl">
          Plan extraordinary lessons in minutes, not hours.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          IntelliClass AI helps educators craft complete, classroom-ready lesson kits — warm-ups, activities, recaps, homework, and quizzes — tailored to your subject, grade, and learning objectives.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup"><Button size="lg">Start free</Button></Link>
          <Link to="/login"><Button size="lg" variant="outline">I already have an account</Button></Link>
        </div>
      </section>

      <section className="border-t bg-muted/30 py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <h2 className="text-center text-2xl font-semibold md:text-3xl">Everything an educator needs</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            A focused workspace for planning, organizing, and reusing lessons.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="border-muted">
                  <CardContent className="p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-muted-foreground md:flex-row md:px-8">
          <p>© {new Date().getFullYear()} IntelliClass AI. Built for educators.</p>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-foreground">Login</Link>
            <Link to="/signup" className="hover:text-foreground">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
