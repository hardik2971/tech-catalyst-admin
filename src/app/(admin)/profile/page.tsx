"use client";

import { useEffect, useState } from "react";
import { KeyRound, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, formatDate, initials } from "@/lib/client";
import { PageHeader } from "@/components/page-header";
import { Badge, Button, Card, CardHeader, Field, Input } from "@/components/ui";
import { useSession } from "@/components/session";

export default function ProfilePage() {
  const { me, reload } = useSession();
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [busy, setBusy] = useState<"profile" | "pw" | null>(null);

  useEffect(() => {
    if (me) setProfile({ name: me.name, email: me.email });
  }, [me]);

  async function saveProfile() {
    setBusy("profile");
    try {
      await api.put("/auth/me", profile);
      await reload();
      toast.success("Profile updated");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(null);
    }
  }

  async function savePassword() {
    if (pw.newPassword !== pw.confirm) return toast.error("New passwords don't match");
    setBusy("pw");
    try {
      await api.put("/auth/me", { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
      toast.success("Password changed");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="My Profile" description="Your account details and password." icon={<UserCircle />} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit p-6 text-center">
          <div className="bg-brand-gradient mx-auto grid h-20 w-20 place-items-center rounded-3xl text-2xl font-bold text-white">{initials(me?.name)}</div>
          <div className="mt-4 text-lg font-bold text-ink">{me?.name}</div>
          <div className="text-sm text-muted">{me?.email}</div>
          <div className="mt-3"><Badge tone="violet">{me?.role.replace("_", " ")}</Badge></div>
          <div className="mt-4 text-xs text-muted">Last login {formatDate(me?.lastLoginAt, true)}</div>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Account" icon={<UserCircle className="h-4 w-4" />} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Full name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} /></Field>
              <div className="sm:col-span-2 flex justify-end"><Button loading={busy === "profile"} onClick={saveProfile}>Save profile</Button></div>
            </div>
          </Card>
          <Card>
            <CardHeader title="Change password" icon={<KeyRound className="h-4 w-4" />} />
            <div className="grid gap-4 p-5 sm:grid-cols-3">
              <Field label="Current password"><Input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
              <Field label="New password" hint="At least 8 characters"><Input type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
              <Field label="Confirm new password"><Input type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
              <div className="sm:col-span-3 flex justify-end">
                <Button loading={busy === "pw"} disabled={!pw.currentPassword || pw.newPassword.length < 8} onClick={savePassword}>Update password</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
