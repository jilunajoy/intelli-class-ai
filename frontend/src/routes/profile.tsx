import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, Mail, UserCircle, Calendar, BookOpen, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useProfile } from "@/lib/profile-context";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/profile")({
  component: () => <ProtectedLayout><Profile /></ProtectedLayout>,
});

function Profile() {
  const { user, signOut } = useAuth();
  const { profile, totalLessons, loading, error, updateFullName } = useProfile();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await updateFullName(fullName.trim());
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your IntelliClass AI account.</p>
      </header>

      <Card>
        <CardHeader><CardTitle className="text-lg">Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <div className="flex gap-2">
                  <Input
                    id="full_name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                  <Button onClick={handleSaveName} disabled={saving || fullName === (profile?.full_name ?? "")}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </div>
              <Row icon={Mail} label="Email" value={profile?.email ?? user?.email ?? "—"} />
              <Row icon={BookOpen} label="Total lessons" value={String(totalLessons)} />
              <Row
                icon={Calendar}
                label="Joined"
                value={
                  (profile?.created_at ?? user?.created_at)
                    ? new Date((profile?.created_at ?? user!.created_at)!).toLocaleDateString()
                    : "—"
                }
              />
              <Row icon={UserCircle} label="User ID" value={user?.id ?? "—"} mono />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Session</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={"truncate text-sm " + (mono ? "font-mono" : "font-medium")}>{value}</p>
      </div>
    </div>
  );
}